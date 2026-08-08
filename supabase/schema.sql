-- ============================================================================
-- KIDA — database schema
-- Run this once in the Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ============================================================================

-- ------------------------------------------------------------------ admins
-- Allow-list of admin accounts. A user can only manage the store if their
-- auth uid appears here, so simply signing up does NOT grant admin access.
create table if not exists public.admins (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- Helper used by every admin policy below.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.admins a where a.id = auth.uid());
$$;

drop policy if exists "admins read own row" on public.admins;
create policy "admins read own row" on public.admins
  for select using (id = auth.uid());

-- ---------------------------------------------------------------- products
create table if not exists public.products (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  description      text not null default '',
  category         text not null,
  price            numeric(12,2) not null check (price >= 0),
  compare_at_price numeric(12,2) check (compare_at_price >= 0),
  images           text[] not null default '{}',
  variants         jsonb  not null default '[]'::jsonb,
  stock            integer not null default 0 check (stock >= 0),
  status           text not null default 'Draft'
                     check (status in ('Active','Draft','Out of Stock')),
  popularity       integer not null default 50,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists products_category_idx on public.products (category);
create index if not exists products_status_idx   on public.products (status);

alter table public.products enable row level security;

-- Shoppers may read published products only.
drop policy if exists "public reads active products" on public.products;
create policy "public reads active products" on public.products
  for select using (status <> 'Draft');

-- Admins have full control.
drop policy if exists "admins manage products" on public.products;
create policy "admins manage products" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------------ orders
create table if not exists public.orders (
  id             uuid primary key default gen_random_uuid(),
  reference      text unique not null default 'KID-' || upper(substr(md5(random()::text), 1, 6)),
  customer_name  text not null,
  customer_phone text not null default '',
  customer_email text not null default '',
  address        text not null default '',
  items          jsonb not null default '[]'::jsonb,
  subtotal       numeric(12,2) not null default 0,
  shipping       numeric(12,2) not null default 0,
  total          numeric(12,2) not null default 0,
  status         text not null default 'Pending'
                   check (status in ('Pending','Processing','Shipped','Delivered','Cancelled','Refunded')),
  payment        text not null default 'Unpaid'
                   check (payment in ('Paid','Unpaid','Refunded')),
  tracking       text,
  note           text,
  created_at     timestamptz not null default now()
);

create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists orders_status_idx  on public.orders (status);

alter table public.orders enable row level security;

-- Anyone can place an order from the storefront...
drop policy if exists "anyone creates orders" on public.orders;
create policy "anyone creates orders" on public.orders
  for insert with check (true);

-- ...but only admins can read or modify them.
drop policy if exists "admins read orders" on public.orders;
create policy "admins read orders" on public.orders
  for select using (public.is_admin());

drop policy if exists "admins update orders" on public.orders;
create policy "admins update orders" on public.orders
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins delete orders" on public.orders;
create policy "admins delete orders" on public.orders
  for delete using (public.is_admin());

-- ----------------------------------------------------------- updated_at
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists products_touch_updated_at on public.products;
create trigger products_touch_updated_at
  before update on public.products
  for each row execute function public.touch_updated_at();

-- --------------------------------------------------------------- storage
-- Public bucket for product photography.
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "public reads product images" on storage.objects;
create policy "public reads product images" on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists "admins upload product images" on storage.objects;
create policy "admins upload product images" on storage.objects
  for insert with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "admins delete product images" on storage.objects;
create policy "admins delete product images" on storage.objects
  for delete using (bucket_id = 'product-images' and public.is_admin());

-- ============================================================================
-- FINAL STEP — grant yourself admin access
--
--   1. Dashboard → Authentication → Users → "Add user"
--      Create your account with a strong password and confirm the email.
--   2. Copy that user's UID, then run:
--
--        insert into public.admins (id, email)
--        values ('PASTE-USER-UID-HERE', 'you@example.com');
--
--   Until you do this, no one can edit products — which is the point.
-- ============================================================================
