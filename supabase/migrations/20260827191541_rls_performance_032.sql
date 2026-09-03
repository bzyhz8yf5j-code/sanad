create index if not exists offices_reviewer_idx on public.offices(reviewer_id, reviewed_at desc);

drop policy if exists offices_public_read on public.offices;
create policy offices_public_read on public.offices for select using (status='approved' or owner_id=(select auth.uid()) or public.is_adminish());

drop policy if exists office_members_self_or_admin on public.office_members;
create policy office_members_self_or_admin on public.office_members for select using (user_id=(select auth.uid()) or public.is_office_member(office_id) or public.is_adminish());

drop policy if exists professional_owner_read on public.professional_applications;
create policy professional_owner_read on public.professional_applications for select using (applicant_id=(select auth.uid()) or public.is_adminish());
drop policy if exists professional_owner_insert on public.professional_applications;
create policy professional_owner_insert on public.professional_applications for insert with check (applicant_id=(select auth.uid()) and status in ('draft','submitted'));

drop policy if exists parcel_docs_authorized_read on public.parcel_documents;
create policy parcel_docs_authorized_read on public.parcel_documents for select using (uploaded_by=(select auth.uid()) or public.is_adminish() or public.current_role() in ('engineer','office'));
drop policy if exists parcel_docs_upload on public.parcel_documents;
create policy parcel_docs_upload on public.parcel_documents for insert with check (uploaded_by=(select auth.uid()) and public.current_role() in ('office','engineer','admin','supervisor'));

drop policy if exists properties_public_read on public.properties;
create policy properties_public_read on public.properties for select using (status='published' or created_by=(select auth.uid()) or public.is_office_member(office_id) or public.is_adminish());
drop policy if exists properties_office_insert on public.properties;
create policy properties_office_insert on public.properties for insert with check (created_by=(select auth.uid()) and public.is_office_member(office_id) and exists(select 1 from public.offices o where o.id=office_id and o.status='approved'));

drop policy if exists media_property_access on public.property_media;
create policy media_property_access on public.property_media for select using (exists(select 1 from public.properties p where p.id=property_id and (p.status='published' or p.created_by=(select auth.uid()) or public.is_office_member(p.office_id) or public.is_adminish())));

drop policy if exists favorites_self on public.favorites;
create policy favorites_self on public.favorites for all using (user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
drop policy if exists saved_searches_self on public.saved_searches;
create policy saved_searches_self on public.saved_searches for all using (user_id=(select auth.uid())) with check(user_id=(select auth.uid()));

drop policy if exists service_self_read on public.service_requests;
create policy service_self_read on public.service_requests for select using (user_id=(select auth.uid()) or public.is_adminish());
drop policy if exists service_self_insert on public.service_requests;
create policy service_self_insert on public.service_requests for insert with check (user_id=(select auth.uid()));

drop policy if exists notifications_self on public.notifications;
create policy notifications_self on public.notifications for select using(user_id=(select auth.uid()));
drop policy if exists notifications_self_update on public.notifications;
create policy notifications_self_update on public.notifications for update using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));

drop policy if exists push_devices_self on public.push_devices;
create policy push_devices_self on public.push_devices for all using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));

drop policy if exists property_media_office_insert on public.property_media;
create policy property_media_office_insert on public.property_media for insert with check(uploaded_by=(select auth.uid()) and exists(select 1 from public.properties p where p.id=property_id and public.office_can(p.office_id,'property_edit')));

drop policy if exists appointments_participant_read on public.appointments;
create policy appointments_participant_read on public.appointments for select using(requester_id=(select auth.uid()) or public.is_office_member(office_id) or public.is_adminish());
drop policy if exists appointments_requester_insert on public.appointments;
create policy appointments_requester_insert on public.appointments for insert with check(requester_id=(select auth.uid()));
drop policy if exists appointments_office_update on public.appointments;
create policy appointments_office_update on public.appointments for update using(public.office_can(office_id,'appointment') or requester_id=(select auth.uid()) or public.is_adminish());

drop policy if exists service_request_events_owner_read on public.service_request_events;
create policy service_request_events_owner_read on public.service_request_events for select using(public.is_adminish() or exists(select 1 from public.service_requests r where r.id=request_id and r.user_id=(select auth.uid())));

drop policy if exists property_reports_read on public.property_reports;
create policy property_reports_read on public.property_reports for select using (requested_by=(select auth.uid()) or public.is_adminish() or exists(select 1 from public.properties p where p.id=property_id and public.is_office_member(p.office_id)));
