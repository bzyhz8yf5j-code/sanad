create index if not exists field_observations_creator_idx on public.field_observations(created_by, captured_at desc);
