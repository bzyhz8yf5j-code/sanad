alter table public.service_requests add column if not exists decision_note text;
create index service_requests_admin_queue_idx on public.service_requests(status,service_type,created_at);
