update public.product_images image
set variant_id = (
  select variant.id
  from public.product_variants variant
  where variant.product_id = image.product_id
  order by variant.is_default desc, variant.sort_order, variant.id
  limit 1
)
where image.variant_id is null;

create or replace function public.enforce_product_image_variant_limit()
returns trigger language plpgsql set search_path=public as $$
begin
  if new.variant_id is null then
    raise exception 'Cada fotografía debe pertenecer a un formato.';
  end if;
  if not exists (select 1 from public.product_variants where id = new.variant_id and product_id = new.product_id) then
    raise exception 'El formato no pertenece al producto indicado.';
  end if;
  if (select count(1) from public.product_images where variant_id = new.variant_id and id <> coalesce(new.id, gen_random_uuid())) >= 5 then
    raise exception 'Cada formato permite un máximo de 5 fotografías.';
  end if;
  return new;
end; $$;

drop trigger if exists product_images_variant_limit on public.product_images;
create trigger product_images_variant_limit
before insert or update of variant_id on public.product_images
for each row execute function public.enforce_product_image_variant_limit();

create index if not exists product_images_variant_id_idx on public.product_images(variant_id);
