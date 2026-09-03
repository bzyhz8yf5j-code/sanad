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
