create type public.notification_job_status as enum ('pending','processing','sent','failed','cancelled');

create table public.notification_jobs (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  channel text not null check(channel in ('push','email','sms')),
  payload jsonb not null default '{}',
  status public.notification_job_status not null default 'pending',
  attempts int not null default 0 check(attempts >= 0),
  max_attempts int not null default 5 check(max_attempts between 1 and 10),
  next_attempt_at timestamptz not null default now(),
  locked_at timestamptz,
  locked_by text,
  last_error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(notification_id, channel)
);
create index notification_jobs_claim_idx on public.notification_jobs(status,next_attempt_at,created_at);
alter table public.notification_jobs enable row level security;

create or replace function public.queue_push_for_notification() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if exists(select 1 from public.push_devices d where d.user_id=new.user_id and d.enabled) then
    insert into public.notification_jobs(notification_id,user_id,channel,payload)
    values(new.id,new.user_id,'push',jsonb_build_object('title',new.title,'body',new.body,'topic',new.topic,'entityId',new.entity_id))
    on conflict(notification_id,channel) do nothing;
  end if;
  return new;
end $$;

create trigger notifications_queue_push after insert on public.notifications
for each row execute function public.queue_push_for_notification();

create or replace function public.claim_notification_jobs(p_worker text, p_limit int default 25)
returns setof public.notification_jobs language plpgsql security definer set search_path=public as $$
begin
  return query
  with candidates as (
    select j.id from public.notification_jobs j
    where j.status='pending' and j.next_attempt_at <= now() and j.attempts < j.max_attempts
    order by j.created_at
    for update skip locked
    limit greatest(1,least(coalesce(p_limit,25),100))
  )
  update public.notification_jobs j
     set status='processing', locked_at=now(), locked_by=p_worker, updated_at=now()
   where j.id in (select id from candidates)
  returning j.*;
end $$;
revoke all on function public.claim_notification_jobs(text,int) from public, anon, authenticated;
grant execute on function public.claim_notification_jobs(text,int) to service_role;
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
create table public.service_request_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.service_requests(id) on delete cascade,
  from_status text,
  to_status text not null,
  note text,
  actor_id uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create index service_request_events_request_idx on public.service_request_events(request_id,created_at);
alter table public.service_request_events enable row level security;
create policy service_request_events_owner_read on public.service_request_events for select using(
  public.is_adminish() or exists(select 1 from public.service_requests r where r.id=request_id and r.user_id=auth.uid())
);

create or replace function public.log_service_request_submission() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.service_request_events(request_id,from_status,to_status,note,actor_id)
  values(new.id,null,new.status,'تم تقديم الطلب',new.user_id);
  return new;
end $$;
create trigger service_request_submission_event after insert on public.service_requests
for each row execute function public.log_service_request_submission();
create policy transactions_office_read on public.transactions for select using(public.is_office_member(office_id) or public.is_adminish());
create policy transaction_parties_office_read on public.transaction_parties for select using(
  exists(select 1 from public.transactions t where t.id=transaction_id and (public.is_office_member(t.office_id) or public.is_adminish()))
);
create policy transaction_parties_office_insert on public.transaction_parties for insert with check(
  exists(select 1 from public.transactions t where t.id=transaction_id and public.office_can(t.office_id,'transaction'))
);
create policy transaction_parties_office_update on public.transaction_parties for update using(
  exists(select 1 from public.transactions t where t.id=transaction_id and public.office_can(t.office_id,'transaction'))
) with check(
  exists(select 1 from public.transactions t where t.id=transaction_id and public.office_can(t.office_id,'transaction'))
);
create policy transaction_parties_office_delete on public.transaction_parties for delete using(
  exists(select 1 from public.transactions t where t.id=transaction_id and public.office_can(t.office_id,'transaction'))
);
create policy transaction_events_office_read on public.transaction_events for select using(
  exists(select 1 from public.transactions t where t.id=transaction_id and (public.is_office_member(t.office_id) or public.is_adminish()))
);
create policy notifications_self_update on public.notifications for update using(user_id=auth.uid()) with check(user_id=auth.uid());
