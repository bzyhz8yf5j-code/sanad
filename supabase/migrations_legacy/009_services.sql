create table public.service_requests (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id), service_type text not null check(service_type in ('invest','shares','installments','complexes')),
  status text not null default 'submitted' check(status in ('submitted','under_review','needs_info','approved','rejected','closed')),
  payload jsonb not null default '{}', assigned_to uuid references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
