-- Run after migrations + supabase/fixtures/demo.sql on a LOCAL Supabase database.
-- Fails with an exception when a core RLS invariant is broken.

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
do $$ begin
  if (select count(*) from public.properties where id='30000000-0000-0000-0000-000000000001') <> 1 then raise exception 'citizen_must_read_published'; end if;
  if (select count(*) from public.properties where id='30000000-0000-0000-0000-000000000002') <> 0 then raise exception 'citizen_must_not_read_draft'; end if;
end $$;
rollback;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000003',true);
do $$ begin
  if (select count(*) from public.properties where id='30000000-0000-0000-0000-000000000002') <> 1 then raise exception 'office_agent_must_read_own_draft'; end if;
  if not public.office_can('20000000-0000-0000-0000-000000000001','property_edit') then raise exception 'office_agent_property_edit_expected'; end if;
  if public.office_can('20000000-0000-0000-0000-000000000001','property_publish') then raise exception 'office_agent_must_not_publish'; end if;
end $$;
rollback;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000004',true);
do $$ begin
  if not public.is_adminish() then raise exception 'adminish_expected'; end if;
  if (select count(*) from public.properties where id in ('30000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000002')) <> 2 then raise exception 'admin_must_read_all'; end if;
end $$;
rollback;
