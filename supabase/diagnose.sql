-- Why is the storefront empty? Run this in Dashboard → SQL Editor.
--
-- The SQL Editor bypasses row level security, so it sees rows the public API
-- cannot. Comparing the two answers tells us which of three things is wrong.

-- 1. Is anything saved at all?
--    0 rows  → the save never reached the database.
select count(*) as total_products from public.products;

-- 2. What status did each product get?
--    Shoppers can only see rows whose status is NOT 'Draft'. A product saved
--    as a Draft is stored correctly but stays invisible on the storefront.
select status, count(*) as how_many
from public.products
group by status;

-- 3. The full list, newest first.
select name, status, stock, created_at
from public.products
order by created_at desc;
