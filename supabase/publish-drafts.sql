-- Publish products that are sitting in Draft.
--
-- Shoppers never see Draft rows — the storefront filters them out and the
-- database policy blocks them too. If you added products expecting them to be
-- on sale, run this once to make them live.
--
-- Run in Dashboard → SQL Editor.

update public.products
set status = case when stock > 0 then 'Active' else 'Out of Stock' end
where status = 'Draft';

-- Confirm: everything below should now read Active (or Out of Stock if you
-- have not set a stock count yet — restock it in the dashboard to sell it).
select name, status, stock from public.products order by created_at desc;
