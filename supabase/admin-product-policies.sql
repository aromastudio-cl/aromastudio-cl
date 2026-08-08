-- Ejecutar una vez en Supabase SQL Editor.
-- Los clientes no necesitan cuenta: solo los usuarios autenticados del panel escriben.

drop policy if exists "Administradores gestionan categorías" on public.categories;
drop policy if exists "Administradores gestionan productos" on public.products;
drop policy if exists "Administradores gestionan aromas" on public.scents;
drop policy if exists "Administradores gestionan variantes" on public.product_variants;
drop policy if exists "Administradores gestionan imágenes" on public.product_images;
drop policy if exists "Administradores suben fotografías" on storage.objects;
drop policy if exists "Administradores actualizan fotografías" on storage.objects;
drop policy if exists "Administradores eliminan fotografías" on storage.objects;

create policy "Administradores gestionan categorías"
on public.categories for all to authenticated
using (true) with check (true);

create policy "Administradores gestionan productos"
on public.products for all to authenticated
using (true) with check (true);

create policy "Administradores gestionan aromas"
on public.scents for all to authenticated
using (true) with check (true);

create policy "Administradores gestionan variantes"
on public.product_variants for all to authenticated
using (true) with check (true);

create policy "Administradores gestionan imágenes"
on public.product_images for all to authenticated
using (true) with check (true);

create policy "Administradores suben fotografías"
on storage.objects for insert to authenticated
with check (bucket_id = 'product-images');

create policy "Administradores actualizan fotografías"
on storage.objects for update to authenticated
using (bucket_id = 'product-images')
with check (bucket_id = 'product-images');

create policy "Administradores eliminan fotografías"
on storage.objects for delete to authenticated
using (bucket_id = 'product-images');
