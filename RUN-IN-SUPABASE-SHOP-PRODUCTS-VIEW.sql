-- NADINE PARAPHARM — FINAL CUSTOMER PRODUCT READ FIX
-- Run in Supabase -> SQL Editor -> New query -> Run.

-- Remove old view if it exists.
drop view if exists public.shop_products;

-- A SECURITY DEFINER function returns only active product documents.
-- The function owner (postgres) reads the source table, so storefront users
-- do not need direct access to private app_documents rows.
create or replace function public.get_shop_products()
returns table (
  doc_id text,
  data jsonb
)
language sql
security definer
stable
set search_path = public
as $$
  select d.doc_id, d.data
  from public.app_documents d
  where d.collection_name = 'products'
    and coalesce(d.data->>'active','true') <> 'false';
$$;

revoke all on function public.get_shop_products() from public;
grant execute on function public.get_shop_products() to anon, authenticated;

-- Public storefront view built on the security-definer function.
create view public.shop_products
with (security_invoker = false)
as
select * from public.get_shop_products();

grant select on public.shop_products to anon, authenticated;

-- Make sure API schema cache sees the new function/view immediately.
notify pgrst, 'reload schema';

-- Verification: this should return the same product count you see in Admin.
select count(*) as customer_visible_products
from public.shop_products;
