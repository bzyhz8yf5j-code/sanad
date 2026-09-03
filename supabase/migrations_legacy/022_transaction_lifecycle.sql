alter table public.transactions add column if not exists updated_at timestamptz not null default now();
create index transactions_office_status_idx on public.transactions(office_id,status,updated_at desc);
create index transaction_events_tx_created_idx on public.transaction_events(transaction_id,created_at);

create or replace function public.transaction_transition_allowed(p_from text, p_to text) returns boolean language sql immutable as $$
  select case p_from
    when 'opened' then p_to in ('documents','cancelled')
    when 'documents' then p_to in ('legal_review','cancelled')
    when 'legal_review' then p_to in ('registration','documents','cancelled')
    when 'registration' then p_to in ('completed','legal_review','cancelled')
    else false end
$$;

create or replace function public.advance_transaction(p_transaction uuid, p_status text, p_note text default null, p_visible_to_client boolean default true)
returns jsonb language plpgsql security definer set search_path=public as $$
declare tx public.transactions%rowtype;
begin
  select * into tx from public.transactions where id=p_transaction for update;
  if tx.id is null then raise exception 'transaction_not_found'; end if;
  if not public.office_can(tx.office_id,'transaction') then raise exception 'not_authorized'; end if;
  if not public.transaction_transition_allowed(tx.status,p_status) then raise exception 'invalid_transition'; end if;
  update public.transactions
     set status=p_status, updated_at=now(), completed_at=case when p_status='completed' then now() else completed_at end
   where id=p_transaction;
  insert into public.transaction_events(transaction_id,status,note,visible_to_client,created_by)
  values(p_transaction,p_status,nullif(trim(coalesce(p_note,'')),''),coalesce(p_visible_to_client,true),auth.uid());
  insert into public.audit_events(actor_id,action,entity_type,entity_id,metadata)
  values(auth.uid(),'transaction.status_changed','transaction',p_transaction,jsonb_build_object('from',tx.status,'to',p_status));
  return jsonb_build_object('transaction_id',p_transaction,'status',p_status,'updated_at',now());
end $$;
revoke all on function public.advance_transaction(uuid,text,text,boolean) from public;
grant execute on function public.advance_transaction(uuid,text,text,boolean) to authenticated;
