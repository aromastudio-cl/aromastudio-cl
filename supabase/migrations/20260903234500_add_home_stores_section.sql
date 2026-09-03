alter table public.site_settings
  add column if not exists stores_eyebrow text not null default 'TIENDAS OFICIALES',
  add column if not exists stores_title text not null default 'Visítanos en nuestras tiendas',
  add column if not exists stores_content_eyebrow text not null default 'AROMA STUDIO',
  add column if not exists stores_content_title text not null default 'Encuentra tu aroma favorito',
  add column if not exists stores_content_text text not null default 'Visita nuestros puntos de venta y descubre una selección de productos y aromas pensados para transformar tus espacios. Nuestro equipo estará disponible para orientarte.',
  add column if not exists stores_image_url text not null default '',
  add column if not exists stores_image_path text not null default '';
