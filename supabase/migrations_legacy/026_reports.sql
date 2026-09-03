create table public.property_reports (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  requested_by uuid not null references public.profiles(id),
  storage_path text not null,
  sha256 text,
  generated_at timestamptz not null default now(),
  expires_at timestamptz,
  metadata jsonb not null default '{}'
);

alter table public.property_reports enable row level security;
create policy property_reports_read on public.property_reports for select using (
  requested_by=auth.uid() or public.is_adminish() or exists(
    select 1 from public.properties p where p.id=property_id and public.is_office_member(p.office_id)
  )
);

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('property-reports','property-reports',false,10485760,array['application/pdf'])
on conflict(id) do nothing;

create policy report_objects_read on storage.objects for select to authenticated using (
  bucket_id='property-reports' and exists(
    select 1 from public.property_reports r
    join public.properties p on p.id=r.property_id
    where r.storage_path=name and (r.requested_by=auth.uid() or public.is_adminish() or public.is_office_member(p.office_id))
  )
);
