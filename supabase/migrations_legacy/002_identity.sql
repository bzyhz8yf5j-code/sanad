create type public.app_role as enum ('citizen','office','engineer','valuer','supervisor','admin');
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  phone text,
  role public.app_role not null default 'citizen',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy profiles_self_read on public.profiles for select using (auth.uid() = id);
create policy profiles_self_update on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id and role = (select p.role from public.profiles p where p.id = auth.uid()));
