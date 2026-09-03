create table public.property_reports (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  requested_by uuid not null references public.profiles(id),
  storage_path text not null,
  sha256 text,
  generated_at timestamptz not null default now(),
  expires_at timestamptz,
  metadata jsonb not null default '{}'
);

alter table public.property_reports enable row level security;
create policy property_reports_read on public.property_reports for select using (
  requested_by=auth.uid() or public.is_adminish() or exists(
    select 1 from public.properties p where p.id=property_id and public.is_office_member(p.office_id)
  )
);

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('property-reports','property-reports',false,10485760,array['application/pdf'])
on conflict(id) do nothing;

create policy report_objects_read on storage.objects for select to authenticated using (
  bucket_id='property-reports' and exists(
    select 1 from public.property_reports r
    join public.properties p on p.id=r.property_id
    where r.storage_path=name and (r.requested_by=auth.uid() or public.is_adminish() or public.is_office_member(p.office_id))
  )
);
alter table public.risk_flags add column if not exists resolution_note text;

create policy risk_authorized_read on public.risk_flags for select using (
  public.is_adminish() or exists(select 1 from public.properties p where p.id=property_id and public.is_office_member(p.office_id))
);

create or replace function public.resolve_property_risk(p_risk_id uuid, p_note text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare r public.risk_flags; p_office uuid;
begin
  if coalesce(length(trim(p_note)),0) < 3 then raise exception 'resolution_note_required'; end if;
  select * into r from public.risk_flags where id=p_risk_id for update;
  if r.id is null then raise exception 'risk_not_found'; end if;
  select office_id into p_office from public.properties where id=r.property_id;
  if not (public.is_adminish() or public.office_can(p_office,'property_edit')) then raise exception 'forbidden'; end if;
  update public.risk_flags set resolved_at=now(), resolved_by=auth.uid(), resolution_note=p_note where id=p_risk_id;
  insert into public.audit_events(actor_id,action,entity_type,entity_id,metadata) values(auth.uid(),'risk.resolve','risk_flag',p_risk_id::text,jsonb_build_object('note',p_note));
  return jsonb_build_object('id',p_risk_id,'resolved',true,'resolved_at',now());
end $$;

alter table public.map_sources add column if not exists updated_at timestamptz not null default now();
alter table public.map_sources add column if not exists last_checked_at timestamptz;
alter table public.map_sources add column if not exists last_health_status text check(last_health_status in ('healthy','degraded','down'));
alter table public.map_sources add column if not exists last_latency_ms int;
alter table public.map_sources add column if not exists health_message text;
alter table public.map_sources enable row level security;
create policy map_sources_read on public.map_sources for select to authenticated using(enabled or public.is_adminish());
create policy map_sources_admin_insert on public.map_sources for insert with check(public.is_adminish());
create policy map_sources_admin_update on public.map_sources for update using(public.is_adminish()) with check(public.is_adminish());
create policy map_sources_admin_delete on public.map_sources for delete using(public.is_adminish());
create policy parcel_docs_admin_update on public.parcel_documents for update using(public.is_adminish()) with check(public.is_adminish());
alter table public.properties add column if not exists revision bigint not null default 1;
alter table public.properties add column if not exists updated_at timestamptz not null default now();
create or replace function public.bump_property_revision() returns trigger language plpgsql as $$
begin
  new.revision := old.revision + 1;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists properties_bump_revision on public.properties;
create trigger properties_bump_revision before update on public.properties for each row execute function public.bump_property_revision();
-- Avoid self-referential profile RLS and centralize role checks through a security-definer helper.
drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles for update
using (auth.uid()=id)
with check (auth.uid()=id and role=public.current_role());
create policy profiles_admin_read on public.profiles for select using(auth.uid()=id or public.is_adminish());

-- Health checks are opt-in even for configured sources; this reduces accidental outbound probes.
alter table public.map_sources add column if not exists health_check_enabled boolean not null default false;

-- Service-role-only maintenance function for audit retention. No client grant is provided.
create or replace function public.prune_audit_events(p_before timestamptz)
returns bigint language plpgsql security definer set search_path=public as $$
declare n bigint;
begin
  if current_user not in ('postgres','service_role') then raise exception 'forbidden'; end if;
  delete from public.audit_events where created_at < p_before;
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.prune_audit_events(timestamptz) from public, anon, authenticated;
grant execute on function public.prune_audit_events(timestamptz) to service_role;
