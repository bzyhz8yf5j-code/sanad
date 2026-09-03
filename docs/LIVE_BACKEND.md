# سند — حالة الـ Live Backend (v0.8.0)

## Supabase الحقيقي
- Project ref: `gpchnprurzdnrmjanawq`
- الحالة وقت الربط: `ACTIVE_HEALTHY`
- PostgreSQL 17 + PostGIS
- 33 جدولًا في `public`
- 59 سياسة RLS
- 4 Storage buckets
- Trigger تلقائي لإنشاء `profiles` بعد إنشاء مستخدم Auth
- Trigger قاعدة بيانات يمنع نشر العقار إذا المكتب غير معتمد، أو لا توجد صورة غلاف، أو توجد مخاطرة High/Critical غير محلولة

## Migrations
المجلد `supabase/migrations` متطابق مع تاريخ الـ migrations البعيد ويحتوي 8 ملفات timestamped. الملفات القديمة 001–032 محفوظة في `supabase/migrations_legacy` للتدقيق فقط.

## Edge Functions المنشورة
15 دالة منشورة، تشمل اعتماد المكاتب والمهنيين، دعوات فريق المكتب، المعاملات، الخدمات الخاصة، الإشعارات، تقارير العقار، فحص مصدر الخريطة، المحادثة والمشاركة المؤقتة.

الدوال الخلفية الخاصة بالتنبيهات أصبحت تتطلب JWT بدور `service_role` بدل secret يدوي منفصل.

## فحص الأمان
- أزيل وصول `anon` من دوال سند SECURITY DEFINER الحساسة.
- جداول jobs/rate-limit الداخلية لديها RLS بدون سياسات عميل عمدًا، أي deny-all للعميل ويصل إليها service role فقط.
- بقي تنبيه Supabase حول `public.spatial_ref_sys` وPostGIS في public؛ الجدول مملوك للإضافة، ومحاولة فرض RLS عليه رُفضت من PostgreSQL. لم يتم كسر الإضافة لتصفير تنبيه شكلي.
- RPCs المسموح بها للمستخدم المسجل (مثل تغيير مرحلة المعاملة وترتيب الصور) تبقى SECURITY DEFINER عمدًا، وكل واحدة تتحقق من صلاحية المستخدم داخل الدالة.

## فحص الأداء
بعد إضافة الفهارس وتحسين سياسات RLS اختفت تحذيرات foreign keys غير المفهرسة وAuth init-plan. المتبقي فقط `unused_index` وهو متوقع لأن القاعدة جديدة ولا توجد حركة إنتاجية بعد.

## ما لم يعمل بعد داخل بيئة ChatGPT الطرفية
DNS الخارجي في الـcontainer لا يستطيع حل `registry.npmjs.org` ولا حتى عنوان Supabase، لذلك:
- لا يوجد `package-lock.json` بعد.
- لم يُنفذ `npm install` الحقيقي.
- لم يُنفذ `expo-doctor` أو Development Build.

هذا ليس نقصًا في كود Supabase؛ أدوات Supabase المتصلة نفذت migrations وEdge Functions بنجاح خارج هذا القيد.

## اعتمادات خارجية باقية
1. بيئة npm متصلة بالإنترنت.
2. Expo/EAS account لبناء Development Build.
3. خط عربي مرخص/موافق عليه لـ PDF عبر `SUPABASE_REPORT_FONT_URL`.
4. مزود Map tiles وCAD SDK مرخص.
5. بيانات الخرائط/المرتسمات الرسمية عندما تتوفر اتفاقياتها.
