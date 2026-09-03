alter table public.products
  add column if not exists aroma_family text;

alter table public.products
  drop constraint if exists products_aroma_family_check,
  add constraint products_aroma_family_check
  check (aroma_family is null or aroma_family in ('frutal', 'citrico', 'amaderado', 'dulce'));
