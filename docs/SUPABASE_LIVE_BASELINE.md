# Supabase Live Baseline — سند

تم إنشاء القاعدة السحابية الفعلية لمشروع سند ثم مواءمة سجل migrations المحلي مع سجل Supabase البعيد.

## المشروع
- Project ref: `gpchnprurzdnrmjanawq`
- المنطقة: `ap-northeast-1`
- PostgreSQL: 17
- PostGIS: مفعّل

## سجل الـ migrations البعيد المطابق للمجلد النشط
1. `20260827185300_sanad_core_001_006.sql`
2. `20260827185409_sanad_core_007_013.sql`
3. `20260827185440_sanad_core_014_020.sql`
4. `20260827185523_sanad_core_021_025.sql`
5. `20260827185553_sanad_core_026_029.sql`
6. `20260827190616_live_backend_hardening_030.sql`
7. `20260827190635_performance_indexes_031.sql`
8. `20260827191541_rls_performance_032.sql`

المجلد `supabase/migrations_legacy` يحتفظ بالملفات 001–031 قبل التجميع لأغراض التدقيق فقط، ولا يجب تمريره إلى `supabase db push`.

## قاعدة العمل من الآن
أي تغيير جديد في قاعدة البيانات يجب أن ينشأ كـ migration جديد باسم timestamp كامل، ولا يتم تعديل migrations الثمانية المطبقة بعد اعتمادها.

## ملاحظة PostGIS
تنبيه Supabase حول `public.spatial_ref_sys` ووجود PostGIS داخل `public` ناتج عن الإضافة المُدارة نفسها. محاولة تغيير RLS على `spatial_ref_sys` رُفضت لأن الجدول مملوك للإضافة، لذلك لم يتم إجبار تغيير قد يكسر عمليات الخرائط/التحويل المكاني.

## Native field mode (v0.10.0)

Remote migrations now also include:
- `20260828015457_native_field_mode_033`
- `20260828015621_native_field_rpc_hardening_034`
- `20260828015715_native_field_performance_035`

The live backend includes `field_sessions`, `field_observations`, the private `field-media` bucket, and the authenticated-only `capture_field_observation` RPC.
