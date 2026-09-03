-- LOCAL DEVELOPMENT ONLY. Never run this fixture against production.
-- Fixed users allow deterministic RLS tests without exposing real personal data.
insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values
('00000000-0000-0000-0000-000000000000','10000000-0000-0000-0000-000000000001','authenticated','authenticated','citizen@sanad.local',crypt('LocalOnly123!',gen_salt('bf')),now(),'{}','{}',now(),now()),
('00000000-0000-0000-0000-000000000000','10000000-0000-0000-0000-000000000002','authenticated','authenticated','owner@sanad.local',crypt('LocalOnly123!',gen_salt('bf')),now(),'{}','{}',now(),now()),
('00000000-0000-0000-0000-000000000000','10000000-0000-0000-0000-000000000003','authenticated','authenticated','agent@sanad.local',crypt('LocalOnly123!',gen_salt('bf')),now(),'{}','{}',now(),now()),
('00000000-0000-0000-0000-000000000000','10000000-0000-0000-0000-000000000004','authenticated','authenticated','admin@sanad.local',crypt('LocalOnly123!',gen_salt('bf')),now(),'{}','{}',now(),now())
on conflict(id) do nothing;

insert into public.profiles(id,display_name,role) values
('10000000-0000-0000-0000-000000000001','مواطن تجريبي','citizen'),
('10000000-0000-0000-0000-000000000002','مالك مكتب تجريبي','office'),
('10000000-0000-0000-0000-000000000003','موظف مكتب تجريبي','office'),
('10000000-0000-0000-0000-000000000004','مشرف تجريبي','admin')
on conflict(id) do nothing;

insert into public.offices(id,owner_id,name,governorate,status,verified_at)
values('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','مكتب سند التجريبي','الأنبار','approved',now())
on conflict(id) do nothing;
insert into public.office_members(office_id,user_id,member_role,active) values
('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','owner',true),
('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000003','agent',true)
on conflict(office_id,user_id) do nothing;

insert into public.properties(id,office_id,created_by,title,property_type,purpose,price,currency,area_sqm,governorate,district,status,published_at)
values
('30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','دار منشورة للتجربة','دار','sale',150000000,'IQD',200,'الأنبار','الرمادي','published',now()),
('30000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','مسودة داخلية','أرض','sale',50000000,'IQD',300,'الأنبار','الرمادي','draft',null)
on conflict(id) do nothing;
