# عقد الخدمات — سند

## Professional applications
- `submitProfessionalApplication` من العميل: engineer/valuer + license + authority + governorates.
- `review-professional-application` Edge Function: admin/supervisor فقط؛ approve/reject/suspend.
- الاعتماد يغيّر role فقط عندما يكون الحساب ما زال citizen، لتجنب خفض صلاحية حساب إداري بالخطأ.

## Property media
- `property_media` metadata في PostgreSQL.
- الملفات في bucket خاص `property-media`.
- ترتيب الوسائط عبر RPC `reorder_property_media` بعد فحص عضوية المكتب.
- روابط القراءة يجب أن تكون signed URLs وليست public URLs.

## Notifications
- الجهاز يسجل Expo token في `push_devices`.
- الخادم ينشئ `notifications` باستخدام dedupe key.
- الإرسال الخارجي يُنفذ من Adapter/Worker مع retry وdead-letter لاحقًا.

## Reports
- `generate-property-report` لا يعتبر مستندًا رسميًا.
- المرحلة الحالية تعيد payload موحدًا؛ renderer الفعلي يضاف خلف Adapter ويخزن PDF مؤقتًا في bucket خاص.
