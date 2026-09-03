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
