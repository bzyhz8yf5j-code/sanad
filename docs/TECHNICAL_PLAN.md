# الخطة التقنية — سند v0.3.0

## الهدف الحالي
إغلاق نسخة Release Candidate محلية قبل رفعها إلى GitHub أو ربط أي خدمة إنتاجية. هذه النسخة تفصل منطق الأعمال عن مزودي الخرائط وCAD والإشعارات والتقارير حتى يمكن تغيير المزود دون إعادة بناء التطبيق.

## الطبقات
1. **App / Expo Router:** شاشات المواطن والمكتب والمختص والإدارة.
2. **Domain:** صلاحيات، حالات الاعتماد، المطابقة، المخاطر، البحث، الوسائط، المعاملات، الإشعارات وRate Limit.
3. **Services:** Supabase adapters، Push adapter، Report adapter، Map/CAD adapters.
4. **Database:** PostgreSQL + PostGIS + RLS + Storage.
5. **Edge Functions:** عمليات إدارية أو حساسة لا تنفذ من العميل.

## ما أُغلق في v0.3.0
- Workflow اعتماد المهندس والمثمّن.
- صلاحيات Role/Permission واضحة وقابلة للاختبار.
- إدارة ترتيب صور الإعلان وتحديد الغلاف وحذف الملفات من التخزين.
- فلاتر بحث موسعة مع تطبيع عربي بسيط.
- Push registration adapter + جدول أجهزة + in-app notifications.
- Report adapter وEdge Function ترجع payload منظم؛ محرك PDF الفعلي يبقى Adapter خارجي.
- Rate-limit domain logic وجدول خادمي محجوب عن العميل.
- RLS أساسي للمكاتب، المحادثات، المهنيين، الإعلانات، الإشعارات والتدقيق.

## قبل الإنتاج
- اختبار RLS فعليًا على Supabase محلي/سحابي، لا يكفي فحص النص.
- إنشاء policy صريحة لكل عملية write لم تُفعل بعد.
- تنفيذ وظائف حذف الوسائط عبر Edge Function أو trigger حتى لا يقع حذف Storage/DB في حالة نصف مكتملة.
- اختيار مصدر خرائط مرخص، CAD SDK، PDF renderer، SMS/email provider، Push retry worker.
- ربط البيانات الرسمية بمصدر وصلاحيات واضحة؛ لا تُعامل البيانات المرفوعة من المستخدم كوثيقة حكومية.
