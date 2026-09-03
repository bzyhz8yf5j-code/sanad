create table public.transactions (
  id uuid primary key default gen_random_uuid(), office_id uuid not null references public.offices(id), property_id uuid references public.properties(id),
  created_by uuid not null references public.profiles(id), status text not null check(status in ('opened','documents','legal_review','registration','completed','cancelled')) default 'opened',
  tracking_hash text not null unique, created_at timestamptz not null default now(), completed_at timestamptz
);
create table public.transaction_parties (transaction_id uuid references public.transactions(id) on delete cascade, party_type text not null, display_name text not null, phone text, visible_to_client boolean not null default false, primary key(transaction_id,party_type,display_name));
create table public.transaction_events (id uuid primary key default gen_random_uuid(), transaction_id uuid not null references public.transactions(id) on delete cascade, status text not null, note text, visible_to_client boolean not null default true, created_by uuid references public.profiles(id), created_at timestamptz not null default now());
