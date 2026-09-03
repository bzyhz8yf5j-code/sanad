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
