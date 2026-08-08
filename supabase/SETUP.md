# Connecting KIDA to Supabase

The app runs fine without this — it just keeps data in the browser. Once you
complete these four steps, products and orders live in a real database and the
admin area is protected by real authentication.

## 1. Create the project

<https://supabase.com/dashboard> → **New project**. Pick a region close to your
customers (`eu-west` or `us-east` are good defaults for Nigeria).

## 2. Run the schema

Dashboard → **SQL Editor** → **New query** → paste the entire contents of
`supabase/schema.sql` → **Run**.

This creates the `products`, `orders` and `admins` tables, the `product-images`
storage bucket, and the row level security policies that decide who can read and
write what.

## 3. Add your keys

Dashboard → **Project Settings** → **API**. Copy the two public values into a
new `.env` file in the project root:

```
VITE_SUPABASE_URL=https://your-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

`.env` is gitignored, so these never reach GitHub. When you deploy, add the same
two variables in your host's environment settings (Vercel → Settings →
Environment Variables).

> Only ever use the **anon public** key here. The `service_role` key bypasses
> every security policy and must never appear in frontend code.

## 4. Create your admin account

1. Dashboard → **Authentication** → **Users** → **Add user**. Use a real email
   and a strong password, and tick "Auto Confirm User".
2. Copy the new user's **UID**.
3. SQL Editor → run, with your own values:

```sql
insert into public.admins (id, email)
values ('1507c67e-149a-4e58-aef0-2fedef1becca', 'obayanjuayodeji502@gmail.com');
```

Restart the dev server (`npm run dev`) and sign in at `/admin`.

## How access is enforced

- **Products** — anyone can read published items; only admins can create, edit
  or delete. Drafts are invisible to shoppers.
- **Orders** — anyone can place one; only admins can read or modify them, so
  customer details are never exposed publicly.
- **Admin area** — signing in is not enough. Your user id must also exist in the
  `admins` table, checked on every page load. Removing a row instantly revokes
  that person's access.

Because these rules live in the database rather than the frontend, they hold
even if someone calls the API directly.

## Adding another admin later

Repeat step 4 with the new person's user id. To revoke access:

```sql
delete from public.admins where email = 'them@example.com';
```
