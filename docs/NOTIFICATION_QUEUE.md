# Notification Queue

## الهدف

فصل إنشاء الإشعار داخل سند عن عملية الإرسال إلى Expo Push حتى لا يؤدي تعطل المزود إلى تعطيل نشر العقار أو تحديث المعاملة.

## التدفق الحالي

1. ينشأ صف في `notifications` مع `dedupe_key` فريد.
2. Trigger قاعدة البيانات يضيف `notification_jobs` لقناة Push فقط إذا كان للمستخدم جهاز فعال.
3. `process-notification-queue` يحجز دفعات باستخدام `FOR UPDATE SKIP LOCKED` عبر `claim_notification_jobs`.
4. كل job يحمّل أجهزة المستخدم الفعالة.
5. الإرسال إلى Expo يتم على دفعات لا تتجاوز 100 رسالة.
6. HTTP 429 و5xx وأخطاء الشبكة فقط تعامل كأخطاء مؤقتة وتدخل Exponential Backoff.
7. أخطاء 4xx الدائمة لا تعاد بلا نهاية.
8. Push tickets تُفحص لكل جهاز:
   - `DeviceNotRegistered`: يعطل الجهاز في `push_devices`.
   - `MessageRateExceeded`: يعاد فقط الجهاز المتأثر.
   - الأخطاء الدائمة تسجل ولا تعاد آليًا.
9. Ticket IDs تحفظ داخل `notification_jobs.payload` بدون تغيير schema.
10. عند تشغيل worker لاحقًا، يفحص Push Receipts المستحقة ويعطل الأجهزة التي ترجع `DeviceNotRegistered`.
11. إذا نجح الإرسال جزئيًا، لا يعاد إرسال الأجهزة التي أخذت ticket ناجح؛ يعاد فقط `remainingDeviceIds`.

## دورة حياة Token داخل التطبيق

- التطبيق يسجل Expo Push Token بعد موافقة المستخدم.
- Token يربط بالحساب الحالي فقط.
- عند تسجيل الدخول، إذا الإذن ممنوح مسبقًا، يجدد التطبيق التسجيل بدون عرض نافذة إذن جديدة.
- عند تسجيل الخروج، يعطل Token الخاص بهذا الجهاز قبل إنهاء الجلسة.
- التطبيق يعرض إشعار foreground بهدوء بدون صوت تلقائي.
- الضغط على الإشعار يستخدم Deep Link الموجود في `app/_layout.tsx`.

## التشغيل الدوري

الـworker يحتاج Scheduler/Cron داخلي يستدعي `process-notification-queue` دوريًا بصلاحية backend.

**حالة 18 نوفمبر 2026:** الكود والـEdge Functions موجودة، لكن لم يظهر في المستودع Cron/pg_net configuration، وSupabase logs لآخر 24 ساعة لم تعرض استدعاءات worker. لذلك لا يعتبر التشغيل الدوري مثبتًا حتى يتم توثيق/تفعيل Scheduler واختباره.

## الأمان

- التطبيق لا يحمل secret/service-role.
- worker الحالي يحافظ مؤقتًا على مصادقة service-role JWT المتوافقة مع الإعداد الحي بدل تغيير caller بدون معرفة مصدر الجدولة.
- الانتقال إلى Supabase Secret Keys / server auth يكون في دفعة مستقلة بعد تحديد Scheduler الحالي، لتجنب قطع الاستدعاءات الحية.

## اختبار الإطلاق

لا يعتبر Push end-to-end مكتملًا إلا بعد:
1. تسجيل iPhone حقيقي والحصول على Expo Push Token.
2. إنشاء notification حقيقية لمستخدم اختبار.
3. تشغيل worker تلقائيًا من Scheduler.
4. وصول الإشعار للجهاز.
5. فحص ticket ثم receipt.
6. اختبار DeviceNotRegistered على token غير صالح أو جهاز أُلغي تسجيله.
