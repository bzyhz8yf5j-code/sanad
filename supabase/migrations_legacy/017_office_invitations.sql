create table public.office_member_invitations (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null references public.offices(id) on delete cascade,
  invited_email text not null,
  member_role text not null check(member_role in ('manager','agent','viewer')),
  token_hash text not null unique,
  created_by uuid not null references public.profiles(id),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.office_member_invitations enable row level security;
create policy office_invites_member_read on public.office_member_invitations for select using(public.is_office_member(office_id) or public.is_adminish());
