alter table public.properties add column if not exists revision bigint not null default 1;
alter table public.properties add column if not exists updated_at timestamptz not null default now();
create or replace function public.bump_property_revision() returns trigger language plpgsql as $$
begin
  new.revision := old.revision + 1;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists properties_bump_revision on public.properties;
create trigger properties_bump_revision before update on public.properties for each row execute function public.bump_property_revision();
