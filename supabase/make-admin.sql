-- Grant admin access to an existing account.
--
-- Postgres rejects every product/order write from anyone who is not listed in
-- public.admins. Until you run this, saving a product in the dashboard fails
-- and the storefront stays empty.
--
-- Before running this, create the login itself:
--   Dashboard → Authentication → Users → Add user
--   (tick "Auto Confirm User" so you can sign in straight away)
--
-- Then replace the email below with that same address and run the whole file in
-- Dashboard → SQL Editor.

insert into public.admins (id, email)
select id, email
from auth.users
where email = 'obayanjuayodeji502@gmail.com'
on conflict (id) do nothing;

-- Should return exactly one row. If it returns none, the email above does not
-- match the user you created.
select id, email from public.admins;
