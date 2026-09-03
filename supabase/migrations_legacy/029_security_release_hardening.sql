-- Avoid self-referential profile RLS and centralize role checks through a security-definer helper.
drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles for update
using (auth.uid()=id)
with check (auth.uid()=id and role=public.current_role());
create policy profiles_admin_read on public.profiles for select using(auth.uid()=id or public.is_adminish());

-- Health checks are opt-in even for configured sources; this reduces accidental outbound probes.
alter table public.map_sources add column if not exists health_check_enabled boolean not null default false;

-- Service-role-only maintenance function for audit retention. No client grant is provided.
create or replace function public.prune_audit_events(p_before timestamptz)
returns bigint language plpgsql security definer set search_path=public as $$
declare n bigint;
begin
  if current_user not in ('postgres','service_role') then raise exception 'forbidden'; end if;
  delete from public.audit_events where created_at < p_before;
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.prune_audit_events(timestamptz) from public, anon, authenticated;
grant execute on function public.prune_audit_events(timestamptz) to service_role;
