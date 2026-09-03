create table public.favorites (user_id uuid references public.profiles(id) on delete cascade, property_id uuid references public.properties(id) on delete cascade, created_at timestamptz default now(), primary key(user_id,property_id));
create table public.saved_searches (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, name text not null, filters jsonb not null, enabled boolean not null default true, created_at timestamptz default now());
create table public.transactions (
  id uuid primary key default gen_random_uuid(), office_id uuid not null references public.offices(id), property_id uuid references public.properties(id),
  created_by uuid not null references public.profiles(id), status text not null check(status in ('opened','documents','legal_review','registration','completed','cancelled')) default 'opened',
  tracking_hash text not null unique, created_at timestamptz not null default now(), completed_at timestamptz
);
create table public.transaction_parties (transaction_id uuid references public.transactions(id) on delete cascade, party_type text not null, display_name text not null, phone text, visible_to_client boolean not null default false, primary key(transaction_id,party_type,display_name));
create table public.transaction_events (id uuid primary key default gen_random_uuid(), transaction_id uuid not null references public.transactions(id) on delete cascade, status text not null, note text, visible_to_client boolean not null default true, created_by uuid references public.profiles(id), created_at timestamptz not null default now());
create table public.service_requests (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id), service_type text not null check(service_type in ('invest','shares','installments','complexes')),
  status text not null default 'submitted' check(status in ('submitted','under_review','needs_info','approved','rejected','closed')),
  payload jsonb not null default '{}', assigned_to uuid references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.conversations (id uuid primary key default gen_random_uuid(), property_id uuid references public.properties(id), office_id uuid references public.offices(id), created_at timestamptz default now());
create table public.conversation_members (conversation_id uuid references public.conversations(id) on delete cascade, user_id uuid references public.profiles(id) on delete cascade, primary key(conversation_id,user_id));
create table public.messages (id uuid primary key default gen_random_uuid(), conversation_id uuid not null references public.conversations(id) on delete cascade, sender_id uuid not null references public.profiles(id), body text not null check(length(body) between 1 and 5000), created_at timestamptz default now());
create table public.appointments (id uuid primary key default gen_random_uuid(), property_id uuid references public.properties(id), office_id uuid not null references public.offices(id), requester_id uuid not null references public.profiles(id), starts_at timestamptz not null, status text not null default 'requested' check(status in ('requested','confirmed','completed','cancelled')), note text, created_at timestamptz default now());
create table public.risk_flags (id uuid primary key default gen_random_uuid(), property_id uuid references public.properties(id) on delete cascade, document_id uuid references public.parcel_documents(id) on delete cascade, code text not null, severity text not null check(severity in ('low','medium','high','critical')), message text not null, resolved_at timestamptz, resolved_by uuid references public.profiles(id), created_at timestamptz default now());
create table public.processing_jobs (id uuid primary key default gen_random_uuid(), job_type text not null, document_id uuid references public.parcel_documents(id) on delete cascade, status text not null default 'queued' check(status in ('queued','processing','completed','failed')), attempts int not null default 0, locked_at timestamptz, result jsonb, error text, created_at timestamptz default now());
create table public.audit_events (id bigint generated always as identity primary key, actor_id uuid references public.profiles(id), action text not null, entity_type text not null, entity_id text, metadata jsonb not null default '{}', created_at timestamptz not null default now());
create table public.share_links (id uuid primary key default gen_random_uuid(), created_by uuid not null references public.profiles(id), entity_type text not null, entity_id uuid not null, token_hash text not null unique, permissions text[] not null default '{view}', expires_at timestamptz not null, revoked_at timestamptz, created_at timestamptz default now());
create table public.notifications (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, topic text not null, entity_id text not null, title text not null, body text not null, dedupe_key text not null, read_at timestamptz, created_at timestamptz default now(), unique(user_id,dedupe_key));
create table public.push_devices (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, expo_push_token text not null unique, platform text not null, enabled boolean not null default true, updated_at timestamptz not null default now());
create or replace function public.current_role() returns public.app_role language sql stable security definer set search_path=public as $$ select role from public.profiles where id = auth.uid() $$;
create or replace function public.is_adminish() returns boolean language sql stable security definer set search_path=public as $$ select coalesce(public.current_role() in ('admin','supervisor'), false) $$;
create or replace function public.is_office_member(p_office uuid) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.office_members m where m.office_id=p_office and m.user_id=auth.uid() and m.active) $$;

alter table public.offices enable row level security;
alter table public.office_members enable row level security;
alter table public.professional_applications enable row level security;
alter table public.parcels enable row level security;
alter table public.parcel_documents enable row level security;
alter table public.document_alignments enable row level security;
alter table public.properties enable row level security;
alter table public.property_media enable row level security;
alter table public.favorites enable row level security;
alter table public.saved_searches enable row level security;
alter table public.transactions enable row level security;
alter table public.transaction_parties enable row level security;
alter table public.transaction_events enable row level security;
alter table public.service_requests enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.appointments enable row level security;
alter table public.risk_flags enable row level security;
alter table public.audit_events enable row level security;
alter table public.share_links enable row level security;
alter table public.notifications enable row level security;
alter table public.push_devices enable row level security;

create policy offices_public_read on public.offices for select using (status='approved' or owner_id=auth.uid() or public.is_adminish());
create policy office_members_self_or_admin on public.office_members for select using (user_id=auth.uid() or public.is_office_member(office_id) or public.is_adminish());
create policy professional_owner_read on public.professional_applications for select using (applicant_id=auth.uid() or public.is_adminish());
create policy professional_owner_insert on public.professional_applications for insert with check (applicant_id=auth.uid() and status in ('draft','submitted'));
create policy professional_admin_update on public.professional_applications for update using (public.is_adminish()) with check (public.is_adminish());
create policy parcels_authenticated_read on public.parcels for select to authenticated using (true);
create policy parcel_docs_authorized_read on public.parcel_documents for select using (uploaded_by=auth.uid() or public.is_adminish() or public.current_role() in ('engineer','office'));
create policy parcel_docs_upload on public.parcel_documents for insert with check (uploaded_by=auth.uid() and public.current_role() in ('office','engineer','admin','supervisor'));
create policy properties_public_read on public.properties for select using (status='published' or created_by=auth.uid() or public.is_office_member(office_id) or public.is_adminish());
create policy properties_office_insert on public.properties for insert with check (created_by=auth.uid() and public.is_office_member(office_id) and exists(select 1 from public.offices o where o.id=office_id and o.status='approved'));
create policy properties_office_update on public.properties for update using (public.is_office_member(office_id) or public.is_adminish()) with check (public.is_office_member(office_id) or public.is_adminish());
create policy media_property_access on public.property_media for select using (exists(select 1 from public.properties p where p.id=property_id and (p.status='published' or p.created_by=auth.uid() or public.is_office_member(p.office_id) or public.is_adminish())));
create policy favorites_self on public.favorites for all using (user_id=auth.uid()) with check(user_id=auth.uid());
create policy saved_searches_self on public.saved_searches for all using (user_id=auth.uid()) with check(user_id=auth.uid());
create policy service_self_read on public.service_requests for select using (user_id=auth.uid() or public.is_adminish());
create policy service_self_insert on public.service_requests for insert with check (user_id=auth.uid());
create policy conversation_member_read on public.conversations for select using (exists(select 1 from public.conversation_members cm where cm.conversation_id=id and cm.user_id=auth.uid()) or public.is_adminish());
create policy messages_member_read on public.messages for select using (exists(select 1 from public.conversation_members cm where cm.conversation_id=messages.conversation_id and cm.user_id=auth.uid()) or public.is_adminish());
create policy messages_member_insert on public.messages for insert with check (sender_id=auth.uid() and exists(select 1 from public.conversation_members cm where cm.conversation_id=messages.conversation_id and cm.user_id=auth.uid()));
create policy notifications_self on public.notifications for select using(user_id=auth.uid());
create policy push_devices_self on public.push_devices for all using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy audit_admin_read on public.audit_events for select using(public.is_adminish());
