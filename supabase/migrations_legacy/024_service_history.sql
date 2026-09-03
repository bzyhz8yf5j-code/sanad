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
