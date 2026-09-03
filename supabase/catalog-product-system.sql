-- Catálogo AromaStudio: metadata de imágenes.
-- El esquema existente ya centraliza fragancias en public.scents y evita
-- duplicados de variantes con product_variant_unique.

alter table public.product_images
  add column if not exists file_size_bytes bigint,
  add column if not exists mime_type text;

alter table public.product_images
  drop constraint if exists product_images_file_size_check,
  add constraint product_images_file_size_check
    check (file_size_bytes is null or file_size_bytes > 0),
  drop constraint if exists product_images_mime_type_check,
  add constraint product_images_mime_type_check
    check (mime_type is null or mime_type in ('image/jpeg', 'image/png', 'image/webp'));

update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'product-images';
