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
