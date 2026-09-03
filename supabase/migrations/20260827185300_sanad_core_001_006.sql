create extension if not exists pgcrypto;
create extension if not exists postgis;
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
create table public.map_sources (
  id uuid primary key default gen_random_uuid(), name text not null, source_type text not null check (source_type in ('xyz','wms','wmts','wfs','vector')),
  endpoint text not null, enabled boolean not null default false, attribution text, created_at timestamptz not null default now()
);
create table public.parcels (
  id uuid primary key default gen_random_uuid(), governorate text not null, district text, subdistrict text, neighborhood text,
  block_number text, parcel_number text, area_sqm numeric, geom geometry(MultiPolygon,4326), source_id uuid references public.map_sources(id),
  source_reference text, created_at timestamptz not null default now()
);
create index parcels_geom_gix on public.parcels using gist(geom);
create index parcels_lookup_idx on public.parcels(governorate,district,block_number,parcel_number);
create table public.parcel_documents (
  id uuid primary key default gen_random_uuid(), parcel_id uuid references public.parcels(id) on delete cascade, uploaded_by uuid not null references public.profiles(id),
  kind text not null, original_name text not null, storage_path text not null, sha256 text, status public.approval_status not null default 'submitted',
  created_at timestamptz not null default now()
);
create table public.alignment_control_points (
  id uuid primary key default gen_random_uuid(), document_id uuid references public.parcel_documents(id) on delete cascade,
  ordinal int not null check (ordinal between 1 and 20), source_x double precision not null, source_y double precision not null,
  target_lng double precision not null, target_lat double precision not null, unique(document_id,ordinal)
);
create table public.document_alignments (
  id uuid primary key default gen_random_uuid(), document_id uuid not null references public.parcel_documents(id) on delete cascade,
  transform jsonb not null, rms_error double precision not null, confidence int not null check(confidence between 0 and 100),
  approved_by uuid references public.profiles(id), approved_at timestamptz, created_at timestamptz not null default now()
);
create type public.property_status as enum ('draft','pending_review','published','archived','rejected');
create table public.properties (
  id uuid primary key default gen_random_uuid(), office_id uuid not null references public.offices(id), created_by uuid not null references public.profiles(id),
  parcel_id uuid references public.parcels(id), title text not null, description text, property_type text not null, purpose text not null check(purpose in ('sale','rent')),
  price numeric not null check(price >= 0), currency text not null default 'IQD', area_sqm numeric not null check(area_sqm > 0), bedrooms int,
  governorate text not null, district text, neighborhood text, point geometry(Point,4326), status public.property_status not null default 'draft', verified boolean not null default false,
  created_at timestamptz not null default now(), published_at timestamptz
);
create index properties_point_gix on public.properties using gist(point);
create index properties_search_idx on public.properties(governorate,district,property_type,purpose,status);
create table public.property_media (
  id uuid primary key default gen_random_uuid(), property_id uuid not null references public.properties(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id), kind text not null check(kind in ('image','video','document')),
  storage_path text not null, mime_type text not null, size_bytes bigint not null check(size_bytes > 0), sort_order int not null default 0, is_cover boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index one_property_cover on public.property_media(property_id) where is_cover;
