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
