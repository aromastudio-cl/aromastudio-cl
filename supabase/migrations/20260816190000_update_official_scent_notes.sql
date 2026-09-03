-- Notas aromáticas oficiales entregadas por Aroma Studio.
with official_notes(slug, notes) as (
  values
    ('mango', 'Mango, piña, manzana, durazno, coco, naranja, jazmín, muguet, algodón de azúcar y almizcle'),
    ('bubble-gum', 'Naranja, mandarina, plátano, frutos rojos, jazmín, violetas, tutti frutti y algodón de azúcar'),
    ('verbena', 'Limón, lima, verbena, jazmín, muguet y almizcle'),
    ('cedron-limon-menta', 'Cáscara de limón, hojas de menta, verbena, notas herbales y notas maderosas de cedro'),
    ('manzana-canela', 'Manzana fresca, canela y notas especiadas dulces'),
    ('infinity', 'Melón, pepino, tallo de bambú, muguet, jazmín, violeta, notas ozónicas, cedro y almizcle'),
    ('red-velvet', 'Frutilla, guinda, piña, pera, frambuesa, plátano y durazno; notas especiadas de anís y algodón de azúcar'),
    ('green-elixir', 'Bergamota y pomelo, manzana, menta, cardamomo, albahaca, jazmín, rosa, cedro, sándalo, musgo, tonka, ámbar y almizcle'),
    ('noir-coffee', 'Café, capuchino, naranja, vainilla y cedro'),
    ('fig-no-7', 'Bergamota, higo, cassis, leche de coco y jazmín'),
    ('soleil-blanc', 'Coco, leche de coco, flor de vainilla y algodón de azúcar')
)
update public.scents as scent
set notes = official_notes.notes
from official_notes
where scent.slug = official_notes.slug;

with official_notes(slug, notes) as (
  values
    ('mango', 'Mango, piña, manzana, durazno, coco, naranja, jazmín, muguet, algodón de azúcar y almizcle'),
    ('bubble-gum', 'Naranja, mandarina, plátano, frutos rojos, jazmín, violetas, tutti frutti y algodón de azúcar'),
    ('verbena', 'Limón, lima, verbena, jazmín, muguet y almizcle'),
    ('cedron-limon-menta', 'Cáscara de limón, hojas de menta, verbena, notas herbales y notas maderosas de cedro'),
    ('manzana-canela', 'Manzana fresca, canela y notas especiadas dulces'),
    ('infinity', 'Melón, pepino, tallo de bambú, muguet, jazmín, violeta, notas ozónicas, cedro y almizcle'),
    ('red-velvet', 'Frutilla, guinda, piña, pera, frambuesa, plátano y durazno; notas especiadas de anís y algodón de azúcar'),
    ('green-elixir', 'Bergamota y pomelo, manzana, menta, cardamomo, albahaca, jazmín, rosa, cedro, sándalo, musgo, tonka, ámbar y almizcle'),
    ('noir-coffee', 'Café, capuchino, naranja, vainilla y cedro'),
    ('fig-no-7', 'Bergamota, higo, cassis, leche de coco y jazmín'),
    ('soleil-blanc', 'Coco, leche de coco, flor de vainilla y algodón de azúcar')
)
update public.products as product
set scent_notes = official_notes.notes,
    updated_at = now()
from public.product_variants as variant
join public.scents as scent on scent.id = variant.scent_id
join official_notes on official_notes.slug = scent.slug
where variant.product_id = product.id;
