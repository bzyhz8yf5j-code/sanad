create type public.account_deletion_status as enum (
  'requested',
  'under_review',
  'blocked',
  'completed',
  'cancelled'
);

create table public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  status public.account_deletion_status not null default 'requested',
  reason text,
  retention_note text,
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint account_deletion_reason_length check (reason is null or char_length(reason) <= 1000),
  constraint account_deletion_retention_note_length check (retention_note is null or char_length(retention_note) <= 2000)
);

create unique index account_deletion_requests_one_active_per_user
  on public.account_deletion_requests(user_id)
  where status in ('requested','under_review','blocked');

create index account_deletion_requests_status_requested_idx
  on public.account_deletion_requests(status, requested_at);

alter table public.account_deletion_requests enable row level security;

revoke all on table public.account_deletion_requests from anon;
revoke insert, update, delete on table public.account_deletion_requests from authenticated;
grant select on table public.account_deletion_requests to authenticated;

create policy account_deletion_requests_self_read
  on public.account_deletion_requests
  for select
  to authenticated
  using ((select auth.uid()) = user_id);
