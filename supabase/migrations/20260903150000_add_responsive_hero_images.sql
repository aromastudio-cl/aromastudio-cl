alter table public.site_settings
  add column if not exists hero_desktop_url text not null default '',
  add column if not exists hero_desktop_path text not null default '',
  add column if not exists hero_mobile_url text not null default '',
  add column if not exists hero_mobile_path text not null default '';
