create index if not exists product_reviews_variant_idx on public.product_reviews (variant_id);
create index if not exists product_reviews_reviewed_by_idx on public.product_reviews (reviewed_by);

drop policy if exists "Administradores moderan comentarios" on public.product_reviews;
create policy "Administradores moderan comentarios"
on public.product_reviews for all to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
