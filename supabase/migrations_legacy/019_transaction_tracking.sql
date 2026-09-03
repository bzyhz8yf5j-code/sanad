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
