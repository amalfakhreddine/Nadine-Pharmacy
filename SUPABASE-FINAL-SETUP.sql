-- NADINE PARAPHARM — SUPABASE-ONLY FINAL SETUP
-- Safe to run more than once.

create table if not exists public.app_documents (
  collection_name text not null,
  doc_id text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (collection_name, doc_id)
);
create index if not exists app_documents_collection_idx on public.app_documents(collection_name);
alter table public.app_documents enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select exists (
    select 1 from public.app_documents d
    where d.collection_name='settings'
      and d.doc_id='adminAccess'
      and lower(auth.jwt()->>'email') in (
        select lower(value::text #>> '{}')
        from jsonb_array_elements(coalesce(d.data->'adminEmails','[]'::jsonb))
      )
  );
$$;

drop policy if exists "public read shop documents" on public.app_documents;
create policy "public read shop documents" on public.app_documents
for select to anon, authenticated
using (
  (collection_name='products' and coalesce(data->>'active','true') <> 'false')
  or collection_name='settings'
  or collection_name='reviews'
);

drop policy if exists "customers manage own documents" on public.app_documents;
create policy "customers manage own documents" on public.app_documents
for all to authenticated
using (
  (collection_name='profiles' and doc_id=auth.uid()::text)
  or (collection_name='wishlists' and doc_id=auth.uid()::text)
  or public.is_admin()
)
with check (
  (collection_name='profiles' and doc_id=auth.uid()::text)
  or (collection_name='wishlists' and doc_id=auth.uid()::text)
  or public.is_admin()
);

drop policy if exists "customers create orders reviews" on public.app_documents;
create policy "customers create orders reviews" on public.app_documents
for insert to authenticated
with check (
  (collection_name='orders' and data->>'customerUid'=auth.uid()::text)
  or (collection_name='reviews' and data->>'customerUid'=auth.uid()::text)
  or public.is_admin()
);

drop policy if exists "customers read own orders reviews" on public.app_documents;
create policy "customers read own orders reviews" on public.app_documents
for select to authenticated
using (
  (collection_name in ('orders','reviews') and data->>'customerUid'=auth.uid()::text)
  or public.is_admin()
);

drop policy if exists "admins full document access" on public.app_documents;
create policy "admins full document access" on public.app_documents
for all to authenticated
using (public.is_admin()) with check (public.is_admin());

grant select on public.app_documents to anon;
grant select,insert,update,delete on public.app_documents to authenticated;

create or replace function public.get_shop_products()
returns table(doc_id text,data jsonb)
language sql security definer stable set search_path=public
as $$
 select d.doc_id,d.data from public.app_documents d
 where d.collection_name='products'
 and coalesce(d.data->>'active','true') <> 'false';
$$;
revoke all on function public.get_shop_products() from public;
grant execute on function public.get_shop_products() to anon,authenticated;

drop view if exists public.shop_products;
create view public.shop_products with (security_invoker=false) as
select * from public.get_shop_products();
grant select on public.shop_products to anon,authenticated;

do $$ begin
  alter publication supabase_realtime add table public.app_documents;
exception when duplicate_object then null;
end $$;

insert into public.app_documents(collection_name,doc_id,data)
values
 ('settings','catalog','{"categories":["para"],"deletedCategories":[]}'::jsonb),
 ('settings','shop','{}'::jsonb),
 ('settings','adminAccess','{"adminEmails":[]}'::jsonb)
on conflict (collection_name,doc_id) do nothing;

notify pgrst,'reload schema';
