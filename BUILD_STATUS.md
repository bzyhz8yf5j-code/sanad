# سند — حالة البناء v0.16.0

## المنجز قبل هذه الدفعة

- iOS Simulator Development Build: SUCCESS.
- EAS Source Checks: SUCCESS حتى v0.15.
- Supabase: ACTIVE_HEALTHY.
- Push Edge Functions v4 منشورة.
- OpenFreeMap base map مضبوط للإنتاج مع release guards.
- Physical iPhone ما زال ينتظر تسجيل الجهاز/Apple approval.

## v0.16 — Account & Privacy Readiness

- Migration حيّة ومسجلة رسميًا: `20261118015656_account_deletion_requests`.
- RLS يسمح للمستخدم بقراءة طلبه فقط، والعميل لا يملك insert/update/delete مباشر.
- مسار طلب حذف/إلغاء الحساب عبر Edge Function موثقة بالجلسة.
- بدء طلب الحذف يعطل Push devices للحساب.
- واجهة داخل الحساب لسياسة الخصوصية وشروط الاستخدام وحذف الحساب.
- شاشة حذف الحساب تعرض الحالة وملاحظة الاحتفاظ وتسمح بإلغاء الطلب قبل الاكتمال.
- Privacy/Terms داخل التطبيق هي مسودات تشغيلية وليست اعتمادًا قانونيًا نهائيًا.
- Release Gate يرفض Production إذا روابط privacy/terms/support العامة غير HTTPS أو مفقودة.

## قرار الحذف النهائي

الحذف المباشر لحساب Auth غير مفعل من العميل. قاعدة البيانات تحتوي علاقات معاملات ومكاتب ورسائل وسجلات تدقيق تمنع حذف profile بشكل أعمى. قبل تفعيل الحذف النهائي نحتاج قواعد واضحة لكل سجل: حذف، anonymization، أو احتفاظ مبرر.

## سياسة تقليل الكلفة

- لا Native Build في v0.16.
- Source Check واحد بعد تجميع الدفعة.
- لا Supabase branch مدفوع.
- Migration واحدة فقط مسجلة في production بعد مراجعة المخطط.
- لا خدمة قانونية/هوية خارجية مدفوعة مضافة.

## Release blockers المتبقية

1. نشر وفحص Edge Function حذف الحساب.
2. مسار إداري لإكمال/تعطيل طلبات الحذف.
3. النص القانوني النهائي وروابط HTTPS العامة.
4. الأيقونة الرسمية/Splash.
5. تسجيل iPhone وبناء Development Build فعلي.
6. Push end-to-end على جهاز حقيقي.
7. CAD/PDF/AI حسب أولويات الإطلاق.
