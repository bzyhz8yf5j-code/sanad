insert into storage.buckets(id,name,public) values ('property-media','property-media',false) on conflict(id) do nothing;
insert into storage.buckets(id,name,public) values ('parcel-documents','parcel-documents',false) on conflict(id) do nothing;
insert into storage.buckets(id,name,public) values ('reports','reports',false) on conflict(id) do nothing;
