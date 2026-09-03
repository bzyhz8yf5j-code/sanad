# Notification Queue

## الهدف
فصل إنشاء الإشعار داخل سند عن عملية الإرسال إلى مزود Push حتى لا يؤدي تعطل المزود إلى تعطيل نشر العقار أو تحديث المعاملة.

## التدفق
1. ينشأ صف في `notifications` مع `dedupe_key` فريد.
2. Trigger قاعدة البيانات يضيف `notification_jobs` لقناة Push فقط إذا كان للمستخدم جهاز فعال.
3. `process-notification-queue` يحجز الدفعات باستخدام `FOR UPDATE SKIP LOCKED` عبر `claim_notification_jobs`.
4. النجاح يغير الحالة إلى `sent`.
5. الفشل يعاد بجدولة Exponential Backoff حتى `max_attempts`، ثم يتحول إلى `failed`.
6. المستخدم لا يملك وصولًا مباشرًا إلى جدول الطابور؛ هو service-role only.

## التشغيل
يستدعى worker دوريًا من Cron/Scheduler داخلي مع `x-internal-secret`، وليس من التطبيق.
