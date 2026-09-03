create table if not exists public.customer_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  phone text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.customer_profiles enable row level security;

drop policy if exists "Clientes leen su perfil" on public.customer_profiles;
create policy "Clientes leen su perfil" on public.customer_profiles for select to authenticated using (id = (select auth.uid()) or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists "Clientes actualizan su perfil" on public.customer_profiles;
create policy "Clientes actualizan su perfil" on public.customer_profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
drop policy if exists "Administradores gestionan clientes" on public.customer_profiles;
create policy "Administradores gestionan clientes" on public.customer_profiles for all to authenticated using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin') with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create or replace function public.create_customer_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(new.raw_app_meta_data ->> 'role', '') <> 'admin' then
    insert into public.customer_profiles (id, email, full_name, phone)
    values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''), coalesce(new.raw_user_meta_data ->> 'phone', ''))
    on conflict (id) do update set email=excluded.email, full_name=excluded.full_name, phone=excluded.phone, updated_at=now();
  end if;
  return new;
end;
$$;

drop trigger if exists create_customer_profile_after_signup on auth.users;
create trigger create_customer_profile_after_signup after insert or update of email, raw_user_meta_data on auth.users for each row execute function public.create_customer_profile();

insert into public.customer_profiles (id,email,full_name,phone)
select id,email,coalesce(raw_user_meta_data ->> 'full_name',''),coalesce(raw_user_meta_data ->> 'phone','') from auth.users
where coalesce(raw_app_meta_data ->> 'role','') <> 'admin'
on conflict (id) do nothing;
