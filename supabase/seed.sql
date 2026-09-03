insert into public.map_sources(name,source_type,endpoint,enabled,attribution)
values ('Demo disabled source','xyz','https://example.invalid/{z}/{x}/{y}.png',false,'Demo only')
on conflict do nothing;
