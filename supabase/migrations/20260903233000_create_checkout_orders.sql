create sequence if not exists public.order_number_seq;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  shipping_address text not null,
  shipping_city text not null,
  shipping_region text not null,
  shipping_notes text not null default '',
  payment_method text not null check (payment_method in ('transferencia','coordinar')),
  status text not null default 'new',
  subtotal_clp integer not null check (subtotal_clp >= 0),
  shipping_clp integer not null default 0 check (shipping_clp >= 0),
  total_clp integer not null check (total_clp >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  variant_id uuid not null references public.product_variants(id),
  product_name text not null,
  variant_name text not null,
  sku text not null,
  unit_price_clp integer not null check (unit_price_clp >= 0),
  quantity integer not null check (quantity > 0),
  line_total_clp integer not null check (line_total_clp >= 0)
);

create index if not exists orders_customer_id_idx on public.orders(customer_id);
create index if not exists orders_created_at_idx on public.orders(created_at desc);
create index if not exists order_items_order_id_idx on public.order_items(order_id);
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "Clientes leen sus pedidos" on public.orders;
create policy "Clientes leen sus pedidos" on public.orders for select to authenticated using (customer_id = (select auth.uid()) or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists "Clientes leen items de sus pedidos" on public.order_items;
create policy "Clientes leen items de sus pedidos" on public.order_items for select to authenticated using (exists (select 1 from public.orders o where o.id=order_id and (o.customer_id=(select auth.uid()) or ((select auth.jwt()) -> 'app_metadata' ->> 'role')='admin')));

create or replace function public.create_checkout_order(
  p_customer_id uuid, p_name text, p_email text, p_phone text,
  p_address text, p_city text, p_region text, p_notes text,
  p_payment_method text, p_items jsonb
) returns jsonb language plpgsql security definer set search_path=public as $$
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
    select p.id product_id,p.name product_name,v.id variant_id,v.name variant_name,v.sku,coalesce(v.price_clp,p.price_clp) price,v.stock
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
revoke all on function public.create_checkout_order(uuid,text,text,text,text,text,text,text,text,jsonb) from public, anon, authenticated;
grant execute on function public.create_checkout_order(uuid,text,text,text,text,text,text,text,text,jsonb) to service_role;
