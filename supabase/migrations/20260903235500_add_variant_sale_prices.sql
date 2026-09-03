alter table public.product_variants
  add column if not exists sale_price_clp integer
  check (sale_price_clp is null or sale_price_clp >= 0);

create or replace function public.create_checkout_order(p_customer_id uuid,p_name text,p_email text,p_phone text,p_address text,p_city text,p_region text,p_notes text,p_payment_method text,p_items jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_order_id uuid := gen_random_uuid();
  v_number text := 'AS' || to_char(now(),'YYYYMMDD') || lpad(nextval('public.order_number_seq')::text,5,'0');
  v_subtotal integer := 0;
  v_item jsonb;
  v_product record;
  v_quantity integer;
  v_price integer;
begin
  if jsonb_array_length(p_items) = 0 then raise exception 'El carrito está vacío.'; end if;
  if p_payment_method not in ('transferencia','coordinar') then raise exception 'Medio de pago no válido.'; end if;
  insert into public.orders(id,order_number,customer_id,customer_name,customer_email,customer_phone,shipping_address,shipping_city,shipping_region,shipping_notes,payment_method,subtotal_clp,total_clp)
  values(v_order_id,v_number,p_customer_id,trim(p_name),lower(trim(p_email)),trim(p_phone),trim(p_address),trim(p_city),trim(p_region),coalesce(trim(p_notes),''),p_payment_method,0,0);
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_quantity := (v_item->>'quantity')::integer;
    if v_quantity < 1 then raise exception 'Cantidad no válida.'; end if;
    select p.id product_id,p.name product_name,v.id variant_id,v.name variant_name,v.sku,coalesce(v.sale_price_clp,v.price_clp,p.price_clp) price,v.stock
      into v_product from public.product_variants v join public.products p on p.id=v.product_id
      where p.id=(v_item->>'productId')::uuid and v.id=(v_item->>'variantId')::uuid and p.active=true and v.active=true for update of v;
    if not found then raise exception 'Uno de los productos ya no está disponible.'; end if;
    if v_product.stock < v_quantity then raise exception 'Stock insuficiente para %.',v_product.product_name; end if;
    v_price := v_product.price;
    v_subtotal := v_subtotal + (v_price*v_quantity);
    insert into public.order_items(order_id,product_id,variant_id,product_name,variant_name,sku,unit_price_clp,quantity,line_total_clp)
    values(v_order_id,v_product.product_id,v_product.variant_id,v_product.product_name,v_product.variant_name,v_product.sku,v_price,v_quantity,v_price*v_quantity);
    update public.product_variants set stock=stock-v_quantity where id=v_product.variant_id;
    update public.products set stock=greatest(0,stock-v_quantity) where id=v_product.product_id;
  end loop;
  update public.orders set subtotal_clp=v_subtotal,total_clp=v_subtotal where id=v_order_id;
  return jsonb_build_object('id',v_order_id,'orderNumber',v_number,'subtotal',v_subtotal,'total',v_subtotal);
end; $$;
