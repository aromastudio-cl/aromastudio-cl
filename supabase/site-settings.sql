create table if not exists public.site_settings (
  id integer primary key default 1 check (id = 1),
  phone text not null default '',
  whatsapp_number text not null default '',
  whatsapp_enabled boolean not null default true,
  instagram_url text not null default '',
  facebook_url text not null default '',
  tiktok_url text not null default '',
  youtube_url text not null default '',
  updated_at timestamptz not null default now()
);
insert into public.site_settings (id, phone, whatsapp_number)
values (1, '+56 9 9315 8300', '56993158300') on conflict (id) do nothing;
alter table public.site_settings enable row level security;
drop policy if exists "Configuración pública" on public.site_settings;
drop policy if exists "Administradores gestionan configuración" on public.site_settings;
create policy "Configuración pública" on public.site_settings for select to anon, authenticated using (true);
create policy "Administradores gestionan configuración" on public.site_settings for all to authenticated using (true) with check (true);

alter table public.site_settings
  add column if not exists instagram_url text not null default '',
  add column if not exists facebook_url text not null default '',
  add column if not exists tiktok_url text not null default '',
  add column if not exists youtube_url text not null default '';
