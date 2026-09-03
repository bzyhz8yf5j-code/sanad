create or replace function public.storage_property_id(p_name text) returns uuid language plpgsql immutable as $$
declare parts text[];
begin
  parts := string_to_array(p_name,'/');
  if array_length(parts,1) < 3 or parts[1] <> 'properties' then return null; end if;
  return parts[2]::uuid;
exception when others then return null;
end $$;

create or replace function public.can_edit_property_storage(p_name text) returns boolean language sql stable security definer set search_path=public as $$
  select exists(
    select 1 from public.properties p
    where p.id=public.storage_property_id(p_name) and public.office_can(p.office_id,'property_edit')
  )
$$;

create policy property_media_storage_read on storage.objects for select to authenticated
using(bucket_id='property-media' and (
  public.can_edit_property_storage(name)
  or exists(select 1 from public.properties p where p.id=public.storage_property_id(name) and p.status='published')
));
create policy property_media_storage_insert on storage.objects for insert to authenticated
with check(bucket_id='property-media' and public.can_edit_property_storage(name));
create policy property_media_storage_update on storage.objects for update to authenticated
using(bucket_id='property-media' and public.can_edit_property_storage(name))
with check(bucket_id='property-media' and public.can_edit_property_storage(name));
create policy property_media_storage_delete on storage.objects for delete to authenticated
using(bucket_id='property-media' and public.can_edit_property_storage(name));

create or replace function public.set_property_cover(p_property_id uuid, p_media_id uuid) returns void language plpgsql security definer set search_path=public as $$
begin
  if not exists(select 1 from public.properties p where p.id=p_property_id and public.office_can(p.office_id,'property_edit')) then raise exception 'not_authorized'; end if;
  if not exists(select 1 from public.property_media m where m.id=p_media_id and m.property_id=p_property_id and m.kind='image') then raise exception 'cover_must_be_image'; end if;
  update public.property_media set is_cover=false where property_id=p_property_id and is_cover;
  update public.property_media set is_cover=true where id=p_media_id and property_id=p_property_id;
end $$;
revoke all on function public.set_property_cover(uuid,uuid) from public;
grant execute on function public.set_property_cover(uuid,uuid) to authenticated;
