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
