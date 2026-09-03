create table if not exists public.store_locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  image_url text not null,
  image_storage_path text not null,
  show_in_hero boolean not null default false,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists store_locations_single_hero on public.store_locations (show_in_hero) where show_in_hero = true;
alter table public.store_locations enable row level security;
drop policy if exists "Sucursales públicas" on public.store_locations;
drop policy if exists "Administradores gestionan sucursales" on public.store_locations;
create policy "Sucursales públicas" on public.store_locations for select to anon, authenticated using (active = true or auth.role() = 'authenticated');
create policy "Administradores gestionan sucursales" on public.store_locations for all to authenticated using (true) with check (true);
