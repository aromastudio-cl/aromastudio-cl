alter table public.site_settings
  add column if not exists announcement_text text not null default 'ENVÍOS A TODO CHILE',
  add column if not exists announcement_enabled boolean not null default true;
