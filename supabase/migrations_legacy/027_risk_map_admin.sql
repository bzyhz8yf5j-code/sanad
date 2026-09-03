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
