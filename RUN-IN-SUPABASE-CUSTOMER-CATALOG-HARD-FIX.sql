-- NADINE PARAPHARM — CUSTOMER CATALOG HARD FIX
-- Run this once in Supabase -> SQL Editor -> New query -> Run.

create or replace function public.public_shop_products_json()
returns jsonb
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'doc_id', d.doc_id,
        'data', d.data
      )
      order by lower(coalesce(d.data->>'name','')), d.doc_id
    ),
    '[]'::jsonb
  )
  from public.app_documents d
  where d.collection_name = 'products'
    and coalesce((d.data->>'active')::boolean, true) = true;
$$;

revoke all on function public.public_shop_products_json() from public;
grant execute on function public.public_shop_products_json() to anon, authenticated;

-- Keep the normal product read rule available as a fallback.
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

-- Force PostgREST to refresh its schema cache immediately.
notify pgrst, 'reload schema';
