create type public.approval_status as enum ('draft','submitted','under_review','approved','rejected','suspended');
create table public.offices (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id), name text not null,
  governorate text not null, status public.approval_status not null default 'draft', verified_at timestamptz, created_at timestamptz not null default now()
);
create table public.office_members (
  office_id uuid references public.offices(id) on delete cascade, user_id uuid references public.profiles(id) on delete cascade,
  member_role text not null check (member_role in ('owner','manager','agent','viewer')), active boolean not null default true,
  primary key (office_id,user_id)
);
create table public.professional_applications (
  id uuid primary key default gen_random_uuid(), applicant_id uuid not null references public.profiles(id) on delete cascade,
  professional_type text not null check (professional_type in ('engineer','valuer')), status public.approval_status not null default 'draft',
  license_number text not null, issuing_authority text not null, governorates text[] not null default '{}',
  reviewer_id uuid references public.profiles(id), rejection_reason text, submitted_at timestamptz default now(), reviewed_at timestamptz
);
create unique index professional_active_license_unique on public.professional_applications(professional_type, license_number) where status in ('submitted','under_review','approved');
