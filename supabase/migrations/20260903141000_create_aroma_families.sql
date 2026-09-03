create table if not exists public.aroma_families (
  slug text primary key,
  name text not null unique,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.aroma_families (slug,name,sort_order) values
  ('frutal','Frutal',1),
  ('citrico','Cítrico',2),
  ('amaderado','Amaderado',3),
  ('dulce','Dulce',4)
on conflict (slug) do nothing;

alter table public.products drop constraint if exists products_aroma_family_check;
alter table public.products drop constraint if exists products_aroma_family_fkey;
alter table public.products add constraint products_aroma_family_fkey foreign key (aroma_family) references public.aroma_families(slug) on update cascade on delete restrict;

alter table public.aroma_families enable row level security;
drop policy if exists "Aromas públicos" on public.aroma_families;
create policy "Aromas públicos" on public.aroma_families for select to anon, authenticated using (active = true or auth.role() = 'authenticated');
drop policy if exists "Administradores gestionan aromas" on public.aroma_families;
create policy "Administradores gestionan aromas" on public.aroma_families for all to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
