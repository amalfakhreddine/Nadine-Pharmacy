-- NADINE PARAPHARM: public customer product feed
-- Run this ONCE in Supabase SQL Editor.

create or replace function public.public_shop_products()
returns table (
  doc_id text,
  data jsonb
)
language sql
security definer
stable
set search_path = public
as $$
  select
    d.doc_id,
    d.data
  from public.app_documents d
  where d.collection_name = 'products'
    and coalesce((d.data->>'active')::boolean, true) = true
  order by lower(coalesce(d.data->>'name','')), d.doc_id;
$$;

revoke all on function public.public_shop_products() from public;
grant execute on function public.public_shop_products() to anon, authenticated;

-- Keep the normal public product RLS policy too.
drop policy if exists "public read products" on public.app_documents;
create policy "public read products"
on public.app_documents
for select
to anon, authenticated
using (
  collection_name = 'products'
  and coalesce((data->>'active')::boolean, true) = true
);

grant select on public.app_documents to anon, authenticated;
