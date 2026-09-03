revoke execute on function public.capture_field_observation(uuid,text,double precision,double precision,numeric,jsonb,text,timestamptz,uuid) from anon;
revoke execute on function public.capture_field_observation(uuid,text,double precision,double precision,numeric,jsonb,text,timestamptz,uuid) from public;
grant execute on function public.capture_field_observation(uuid,text,double precision,double precision,numeric,jsonb,text,timestamptz,uuid) to authenticated;
