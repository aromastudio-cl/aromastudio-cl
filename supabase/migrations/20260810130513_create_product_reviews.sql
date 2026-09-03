create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  reviewer_name text not null check (char_length(trim(reviewer_name)) between 2 and 80),
  rating smallint not null check (rating between 1 and 5),
  comment text not null check (char_length(trim(comment)) between 10 and 1200),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists product_reviews_product_status_created_idx
  on public.product_reviews (product_id, status, created_at desc);
create index if not exists product_reviews_status_created_idx
  on public.product_reviews (status, created_at desc);
create index if not exists product_reviews_variant_idx on public.product_reviews (variant_id);
create index if not exists product_reviews_reviewed_by_idx on public.product_reviews (reviewed_by);

alter table public.product_reviews enable row level security;

revoke all on public.product_reviews from anon, authenticated;
grant select (id, product_id, variant_id, reviewer_name, rating, comment, created_at)
  on public.product_reviews to anon;
grant select, insert, update, delete on public.product_reviews to authenticated;
grant all on public.product_reviews to service_role;

create policy "Comentarios aprobados son públicos"
on public.product_reviews for select to anon
using (status = 'approved');

create policy "Administradores moderan comentarios"
on public.product_reviews for all to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create or replace function public.set_product_review_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_product_review_updated_at() from public, anon, authenticated;

drop trigger if exists set_product_review_updated_at on public.product_reviews;
create trigger set_product_review_updated_at
before update on public.product_reviews
for each row execute function public.set_product_review_updated_at();
