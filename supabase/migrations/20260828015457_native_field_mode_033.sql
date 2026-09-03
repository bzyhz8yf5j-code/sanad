-- Sanad native field mode: GPS/photo observations with offline-safe sync keys.
create table if not exists public.field_sessions (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete cascade,
  office_id uuid references public.offices(id) on delete set null,
  parcel_id uuid references public.parcels(id) on delete set null,
  status text not null default 'open' check (status in ('open','closed','synced','cancelled')),
  device_id text,
  notes text,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.field_observations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.field_sessions(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('point','photo','note','measurement','boundary','voice')),
  geom geometry(Geometry,4326),
  accuracy_m numeric,
  captured_at timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb,
  storage_path text,
  sync_key uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  unique(sync_key)
);

create index if not exists field_sessions_creator_idx on public.field_sessions(created_by, started_at desc);
create index if not exists field_sessions_office_idx on public.field_sessions(office_id, started_at desc);
create index if not exists field_sessions_parcel_idx on public.field_sessions(parcel_id, started_at desc);
create index if not exists field_observations_session_idx on public.field_observations(session_id, captured_at);
create index if not exists field_observations_geom_gix on public.field_observations using gist(geom);

alter table public.field_sessions enable row level security;
alter table public.field_observations enable row level security;

create policy field_sessions_read on public.field_sessions for select to authenticated
using (
  created_by = (select auth.uid())
  or (office_id is not null and public.is_office_member(office_id))
  or public.is_adminish()
);
create policy field_sessions_insert on public.field_sessions for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (office_id is null or public.is_office_member(office_id))
);
create policy field_sessions_update on public.field_sessions for update to authenticated
using (created_by = (select auth.uid()) or public.is_adminish())
with check (created_by = (select auth.uid()) or public.is_adminish());

create policy field_observations_read on public.field_observations for select to authenticated
using (
  created_by = (select auth.uid())
  or exists (
    select 1 from public.field_sessions s
    where s.id = session_id
      and s.office_id is not null
      and public.is_office_member(s.office_id)
  )
  or public.is_adminish()
);
create policy field_observations_insert on public.field_observations for insert to authenticated
with check (
  created_by = (select auth.uid())
  and exists(select 1 from public.field_sessions s where s.id=session_id and s.created_by=(select auth.uid()) and s.status='open')
);
create policy field_observations_update on public.field_observations for update to authenticated
using (created_by = (select auth.uid()) or public.is_adminish())
with check (created_by = (select auth.uid()) or public.is_adminish());

insert into storage.buckets(id,name,public)
values ('field-media','field-media',false)
on conflict(id) do nothing;

create policy field_media_storage_read on storage.objects for select to authenticated
using(bucket_id='field-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy field_media_storage_insert on storage.objects for insert to authenticated
with check(bucket_id='field-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy field_media_storage_update on storage.objects for update to authenticated
using(bucket_id='field-media' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check(bucket_id='field-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy field_media_storage_delete on storage.objects for delete to authenticated
using(bucket_id='field-media' and (storage.foldername(name))[1] = (select auth.uid())::text);

create or replace function public.capture_field_observation(
  p_session uuid,
  p_kind text,
  p_lng double precision default null,
  p_lat double precision default null,
  p_accuracy numeric default null,
  p_payload jsonb default '{}'::jsonb,
  p_storage_path text default null,
  p_captured_at timestamptz default now(),
  p_sync_key uuid default gen_random_uuid()
) returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  v_user uuid := auth.uid();
  v_id uuid;
begin
  if v_user is null then raise exception 'not_authenticated'; end if;
  if p_kind not in ('point','photo','note','measurement','boundary','voice') then raise exception 'invalid_kind'; end if;
  if not exists(select 1 from public.field_sessions s where s.id=p_session and s.created_by=v_user and s.status='open') then
    raise exception 'field_session_not_open';
  end if;
  insert into public.field_observations(session_id,created_by,kind,geom,accuracy_m,captured_at,payload,storage_path,sync_key)
  values(
    p_session,
    v_user,
    p_kind,
    case when p_lng is not null and p_lat is not null then st_setsrid(st_makepoint(p_lng,p_lat),4326) else null end,
    p_accuracy,
    coalesce(p_captured_at,now()),
    coalesce(p_payload,'{}'::jsonb),
    p_storage_path,
    coalesce(p_sync_key,gen_random_uuid())
  )
  on conflict(sync_key) do update set sync_key=excluded.sync_key
  returning id into v_id;
  return v_id;
end $$;
revoke all on function public.capture_field_observation(uuid,text,double precision,double precision,numeric,jsonb,text,timestamptz,uuid) from public;
grant execute on function public.capture_field_observation(uuid,text,double precision,double precision,numeric,jsonb,text,timestamptz,uuid) to authenticated;
revoke execute on function public.capture_field_observation(uuid,text,double precision,double precision,numeric,jsonb,text,timestamptz,uuid) from anon;
