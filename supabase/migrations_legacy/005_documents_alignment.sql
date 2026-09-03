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
