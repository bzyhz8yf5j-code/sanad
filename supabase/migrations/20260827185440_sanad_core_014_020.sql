create or replace function public.reorder_property_media(p_property_id uuid, p_media_ids uuid[])
returns void language plpgsql security definer set search_path=public as $$
declare v_office uuid; v_id uuid; v_index int := 0;
begin
  select office_id into v_office from public.properties where id=p_property_id;
  if v_office is null or not (public.is_office_member(v_office) or public.is_adminish()) then raise exception 'not_authorized'; end if;
  foreach v_id in array p_media_ids loop
    update public.property_media set sort_order=v_index where id=v_id and property_id=p_property_id;
    v_index := v_index + 1;
  end loop;
end $$;
create table public.request_limits (
  scope text not null, subject text not null, bucket_start timestamptz not null, request_count int not null default 1,
  primary key(scope,subject,bucket_start)
);
revoke all on public.request_limits from anon, authenticated;
insert into storage.buckets(id,name,public) values ('property-media','property-media',false) on conflict(id) do nothing;
insert into storage.buckets(id,name,public) values ('parcel-documents','parcel-documents',false) on conflict(id) do nothing;
insert into storage.buckets(id,name,public) values ('reports','reports',false) on conflict(id) do nothing;
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
create or replace function public.office_member_role(p_office uuid) returns text language sql stable security definer set search_path=public as $$
  select member_role from public.office_members where office_id=p_office and user_id=auth.uid() and active limit 1
$$;
create or replace function public.office_can(p_office uuid, p_action text) returns boolean language plpgsql stable security definer set search_path=public as $$
declare r text;
begin
  if public.is_adminish() then return true; end if;
  r := public.office_member_role(p_office);
  if r='owner' then return true; end if;
  if r='manager' and p_action in ('invite','property_create','property_edit','property_publish','transaction','message','appointment','parcel_upload') then return true; end if;
  if r='agent' and p_action in ('property_create','property_edit','transaction','message','appointment','parcel_upload') then return true; end if;
  return false;
end $$;

create policy office_members_manage_insert on public.office_members for insert with check(public.office_can(office_id,'invite'));
create policy office_members_manage_update on public.office_members for update using(public.office_can(office_id,'invite')) with check(public.office_can(office_id,'invite'));
create policy property_media_office_insert on public.property_media for insert with check(uploaded_by=auth.uid() and exists(select 1 from public.properties p where p.id=property_id and public.office_can(p.office_id,'property_edit')));
create policy property_media_office_update on public.property_media for update using(exists(select 1 from public.properties p where p.id=property_id and public.office_can(p.office_id,'property_edit'))) with check(exists(select 1 from public.properties p where p.id=property_id and public.office_can(p.office_id,'property_edit')));
create policy property_media_office_delete on public.property_media for delete using(exists(select 1 from public.properties p where p.id=property_id and public.office_can(p.office_id,'property_edit')));
create policy service_admin_update on public.service_requests for update using(public.is_adminish()) with check(public.is_adminish());
create policy appointments_participant_read on public.appointments for select using(requester_id=auth.uid() or public.is_office_member(office_id) or public.is_adminish());
create policy appointments_requester_insert on public.appointments for insert with check(requester_id=auth.uid());
create policy appointments_office_update on public.appointments for update using(public.office_can(office_id,'appointment') or requester_id=auth.uid() or public.is_adminish());
create or replace function public.hash_tracking_code(p_code text) returns text language sql immutable as $$
  select encode(digest(upper(trim(p_code)), 'sha256'), 'hex')
$$;

create or replace function public.create_transaction_with_tracking(p_office uuid, p_property uuid default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare code text; tx uuid;
begin
  if not public.office_can(p_office,'transaction') then raise exception 'not_authorized'; end if;
  code := upper(substr(encode(gen_random_bytes(12),'hex'),1,12));
  insert into public.transactions(office_id,property_id,created_by,status,tracking_hash)
  values(p_office,p_property,auth.uid(),'opened',public.hash_tracking_code(code)) returning id into tx;
  insert into public.transaction_events(transaction_id,status,note,visible_to_client,created_by) values(tx,'opened','تم فتح المعاملة',true,auth.uid());
  return jsonb_build_object('transaction_id',tx,'tracking_code',code);
end $$;
revoke all on function public.create_transaction_with_tracking(uuid,uuid) from public;
grant execute on function public.create_transaction_with_tracking(uuid,uuid) to authenticated;
alter table public.service_requests add column if not exists decision_note text;
create index service_requests_admin_queue_idx on public.service_requests(status,service_type,created_at);
