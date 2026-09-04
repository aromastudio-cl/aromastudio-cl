alter table public.site_settings
  add column if not exists hero_title_accent text not null default 'Descubre el aroma perfecto',
  add column if not exists hero_title text not null default 'para cada espacio',
  add column if not exists hero_description text not null default 'Descubre fragancias que transforman tu hogar y tu día a día.';
