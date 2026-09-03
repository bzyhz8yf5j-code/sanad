-- Live backend hardening discovered after first production-shaped Supabase deployment.

-- 1) Every Auth user must have a public profile before app workflows reference it.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  insert into public.profiles(id, display_name, phone)
  values(
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data->>'display_name',''),
      nullif(new.raw_user_meta_data->>'full_name',''),
      nullif(split_part(coalesce(new.email,''),'@',1),'')
    ),
    nullif(new.raw_user_meta_data->>'phone','')
  )
  on conflict(id) do nothing;
  return new;
end $$;

insert into public.profiles(id, display_name, phone)
select
  u.id,
  coalesce(
    nullif(u.raw_user_meta_data->>'display_name',''),
    nullif(u.raw_user_meta_data->>'full_name',''),
    nullif(split_part(coalesce(u.email,''),'@',1),'')
  ),
  nullif(u.raw_user_meta_data->>'phone','')
from auth.users u
on conflict(id) do nothing;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- 2) Office review metadata. Submission/review is performed by authenticated Edge Functions.
alter table public.offices add column if not exists reviewer_id uuid references public.profiles(id);
alter table public.offices add column if not exists reviewed_at timestamptz;
alter table public.offices add column if not exists rejection_reason text;

-- 3) Consolidate profile policies and avoid duplicate permissive SELECT policies.
drop policy if exists profiles_self_read on public.profiles;
drop policy if exists profiles_admin_read on public.profiles;
drop policy if exists profiles_self_update on public.profiles;
create policy profiles_read on public.profiles
for select to authenticated
using ((select auth.uid())=id or public.is_adminish());
create policy profiles_self_update on public.profiles
for update to authenticated
using ((select auth.uid())=id)
with check ((select auth.uid())=id and role=public.current_role());

-- 4) Conversation membership must work through RLS without recursive self-queries.
create or replace function public.is_conversation_member(p_conversation uuid)
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select exists(
    select 1 from public.conversation_members cm
    where cm.conversation_id=p_conversation
      and cm.user_id=(select auth.uid())
  )
$$;

create policy conversation_members_read on public.conversation_members
for select to authenticated
using (
  user_id=(select auth.uid())
  or public.is_adminish()
  or exists(
    select 1 from public.conversations c
    where c.id=conversation_id and c.office_id is not null and public.is_office_member(c.office_id)
  )
);

drop policy if exists conversation_member_read on public.conversations;
create policy conversation_member_read on public.conversations
for select to authenticated
using (
  public.is_conversation_member(id)
  or public.is_adminish()
  or (office_id is not null and public.is_office_member(office_id))
);

drop policy if exists messages_member_read on public.messages;
drop policy if exists messages_member_insert on public.messages;
create policy messages_member_read on public.messages
for select to authenticated
using (public.is_conversation_member(conversation_id) or public.is_adminish());
create policy messages_member_insert on public.messages
for insert to authenticated
with check (sender_id=(select auth.uid()) and public.is_conversation_member(conversation_id));

-- 5) CAD/georeferencing rows: uploader, engineer, or administration only.
create policy alignment_points_read on public.alignment_control_points
for select to authenticated
using (
  exists(
    select 1 from public.parcel_documents d
    where d.id=document_id and (
      d.uploaded_by=(select auth.uid())
      or public.current_role()='engineer'
      or public.is_adminish()
    )
  )
);
create policy alignment_points_insert on public.alignment_control_points
for insert to authenticated
with check (
  exists(
    select 1 from public.parcel_documents d
    where d.id=document_id and (
      d.uploaded_by=(select auth.uid())
      or public.current_role()='engineer'
      or public.is_adminish()
    )
  )
);
create policy alignment_points_update on public.alignment_control_points
for update to authenticated
using (
  exists(
    select 1 from public.parcel_documents d
    where d.id=document_id and (
      d.uploaded_by=(select auth.uid())
      or public.current_role()='engineer'
      or public.is_adminish()
    )
  )
)
with check (
  exists(
    select 1 from public.parcel_documents d
    where d.id=document_id and (
      d.uploaded_by=(select auth.uid())
      or public.current_role()='engineer'
      or public.is_adminish()
    )
  )
);
create policy alignment_points_delete on public.alignment_control_points
for delete to authenticated
using (
  exists(
    select 1 from public.parcel_documents d
    where d.id=document_id and (
      d.uploaded_by=(select auth.uid())
      or public.current_role()='engineer'
      or public.is_adminish()
    )
  )
);

create policy document_alignments_read on public.document_alignments
for select to authenticated
using (
  exists(
    select 1 from public.parcel_documents d
    where d.id=document_id and (
      d.uploaded_by=(select auth.uid())
      or public.current_role()='engineer'
      or public.is_adminish()
    )
  )
);
create policy document_alignments_insert on public.document_alignments
for insert to authenticated
with check (
  exists(
    select 1 from public.parcel_documents d
    where d.id=document_id and (
      d.uploaded_by=(select auth.uid())
      or public.current_role()='engineer'
      or public.is_adminish()
    )
  )
);
create policy document_alignments_update on public.document_alignments
for update to authenticated
using (
  exists(
    select 1 from public.parcel_documents d
    where d.id=document_id and (
      d.uploaded_by=(select auth.uid())
      or public.current_role()='engineer'
      or public.is_adminish()
    )
  )
)
with check (
  exists(
    select 1 from public.parcel_documents d
    where d.id=document_id and (
      d.uploaded_by=(select auth.uid())
      or public.current_role()='engineer'
      or public.is_adminish()
    )
  )
);

-- 6) Share-link rows remain insert-only through server code; creators can inspect/revoke their own links.
create policy share_links_creator_read on public.share_links
for select to authenticated
using (created_by=(select auth.uid()) or public.is_adminish());
create policy share_links_creator_update on public.share_links
for update to authenticated
using (created_by=(select auth.uid()) or public.is_adminish())
with check (created_by=(select auth.uid()) or public.is_adminish());

-- 7) Property publishing is enforced in the database, even if a client bypasses UI checks.
create or replace function public.enforce_property_publish_gate()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if new.status='published' then
    if not public.office_can(new.office_id,'property_publish') then
      raise exception 'publish_not_authorized';
    end if;
    if not exists(select 1 from public.offices o where o.id=new.office_id and o.status='approved') then
      raise exception 'office_not_approved';
    end if;
    if not exists(
      select 1 from public.property_media m
      where m.property_id=new.id and m.kind='image' and m.is_cover=true
    ) then
      raise exception 'cover_image_required';
    end if;
    if exists(
      select 1 from public.risk_flags r
      where r.property_id=new.id and r.resolved_at is null and r.severity in ('high','critical')
    ) then
      raise exception 'unresolved_high_risk';
    end if;
    new.published_at := coalesce(new.published_at, now());
  end if;
  return new;
end $$;

drop trigger if exists properties_publish_gate on public.properties;
create trigger properties_publish_gate
before update of status, office_id on public.properties
for each row execute function public.enforce_property_publish_gate();

-- 8) Fix mutable search_path warnings for application functions.
alter function public.hash_tracking_code(text) set search_path=public,extensions;
alter function public.transaction_transition_allowed(text,text) set search_path=public,extensions;
alter function public.storage_property_id(text) set search_path=public,extensions;
alter function public.bump_property_revision() set search_path=public,extensions;

-- 9) Explicit execution boundaries. Supabase grants anon/authenticated by default on new functions.
revoke execute on function public.advance_transaction(uuid,text,text,boolean) from public, anon;
revoke execute on function public.create_transaction_with_tracking(uuid,uuid) from public, anon;
revoke execute on function public.reorder_property_media(uuid,uuid[]) from public, anon;
revoke execute on function public.resolve_property_risk(uuid,text) from public, anon;
revoke execute on function public.set_property_cover(uuid,uuid) from public, anon;
revoke execute on function public.current_role() from public, anon;
revoke execute on function public.is_adminish() from public, anon;
revoke execute on function public.is_office_member(uuid) from public, anon;
revoke execute on function public.office_can(uuid,text) from public, anon;
revoke execute on function public.office_member_role(uuid) from public, anon;
revoke execute on function public.can_edit_property_storage(text) from public, anon;
revoke execute on function public.is_conversation_member(uuid) from public, anon;

revoke execute on function public.queue_push_for_notification() from public, anon, authenticated;
revoke execute on function public.log_service_request_submission() from public, anon, authenticated;
revoke execute on function public.bump_property_revision() from public, anon, authenticated;
revoke execute on function public.enforce_property_publish_gate() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Client RPCs intentionally remain authenticated-only; internal RLS helpers must also be executable by authenticated.
grant execute on function public.advance_transaction(uuid,text,text,boolean) to authenticated;
grant execute on function public.create_transaction_with_tracking(uuid,uuid) to authenticated;
grant execute on function public.reorder_property_media(uuid,uuid[]) to authenticated;
grant execute on function public.resolve_property_risk(uuid,text) to authenticated;
grant execute on function public.set_property_cover(uuid,uuid) to authenticated;
grant execute on function public.current_role() to authenticated;
grant execute on function public.is_adminish() to authenticated;
grant execute on function public.is_office_member(uuid) to authenticated;
grant execute on function public.office_can(uuid,text) to authenticated;
grant execute on function public.office_member_role(uuid) to authenticated;
grant execute on function public.can_edit_property_storage(text) to authenticated;
grant execute on function public.is_conversation_member(uuid) to authenticated;

-- PostGIS metadata tables are extension-owned in hosted Supabase; their advisor notice is tracked separately.
