-- Run this once in Supabase SQL Editor before deploying the migrated site.
create table if not exists public.app_documents (
  collection_name text not null,
  doc_id text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (collection_name, doc_id)
);
create index if not exists app_documents_collection_idx on public.app_documents(collection_name);
alter table public.app_documents enable row level security;

drop policy if exists "public read shop documents" on public.app_documents;
create policy "public read shop documents" on public.app_documents for select to anon, authenticated
using (collection_name in ('products','settings','reviews'));

drop policy if exists "customers manage own documents" on public.app_documents;
create policy "customers manage own documents" on public.app_documents for all to authenticated
using (
  (collection_name='profiles' and doc_id=auth.uid()::text) or
  (collection_name='wishlists' and doc_id=auth.uid()::text) or
  public.is_admin()
)
with check (
  (collection_name='profiles' and doc_id=auth.uid()::text) or
  (collection_name='wishlists' and doc_id=auth.uid()::text) or
  public.is_admin()
);

drop policy if exists "customers create orders reviews" on public.app_documents;
create policy "customers create orders reviews" on public.app_documents for insert to authenticated
with check (
  (collection_name='orders' and data->>'customerUid'=auth.uid()::text) or
  (collection_name='reviews' and data->>'customerUid'=auth.uid()::text) or
  public.is_admin()
);

drop policy if exists "customers read own orders reviews" on public.app_documents;
create policy "customers read own orders reviews" on public.app_documents for select to authenticated
using (
  (collection_name in ('orders','reviews') and data->>'customerUid'=auth.uid()::text) or
  public.is_admin()
);

drop policy if exists "admins full document access" on public.app_documents;
create policy "admins full document access" on public.app_documents for all to authenticated
using (public.is_admin()) with check (public.is_admin());

grant select on public.app_documents to anon;
grant select, insert, update, delete on public.app_documents to authenticated;

-- Realtime sync for admin/customer pages.
do $$ begin
  alter publication supabase_realtime add table public.app_documents;
exception when duplicate_object then null;
end $$;

-- Seed settings expected by the existing website.
insert into public.app_documents(collection_name,doc_id,data)
values
 ('settings','catalog','{"categories":["para"],"deletedCategories":[]}'::jsonb),
 ('settings','shop','{}'::jsonb),
 ('settings','adminAccess','{"adminEmails":[]}'::jsonb)
on conflict (collection_name,doc_id) do nothing;
