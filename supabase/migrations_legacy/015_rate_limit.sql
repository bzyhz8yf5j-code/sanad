create table public.request_limits (
  scope text not null, subject text not null, bucket_start timestamptz not null, request_count int not null default 1,
  primary key(scope,subject,bucket_start)
);
revoke all on public.request_limits from anon, authenticated;
