alter table public.categories
  add column if not exists image_url text,
  add column if not exists image_storage_path text,
  add column if not exists updated_at timestamptz not null default now();

comment on column public.categories.image_url is 'URL pública de la única imagen de la categoría';
comment on column public.categories.image_storage_path is 'Ruta del archivo en el bucket product-images';
