# Transaction Lifecycle

المراحل المعتمدة:
`opened -> documents -> legal_review -> registration -> completed`

يمكن الإلغاء قبل الإكمال، ويمكن الرجوع من `legal_review` إلى `documents` ومن `registration` إلى `legal_review` عند الحاجة للتصحيح.

## الأمان
- فتح المعاملة يتم عبر RPC وينشئ رمز متابعة يعاد للموظف مرة واحدة فقط.
- قاعدة البيانات تخزن SHA-256 للرمز، لا الرمز نفسه.
- تغيير المرحلة يتم عبر `advance_transaction` وليس Update مباشر، ويتحقق من صلاحية المكتب ومن الانتقال المسموح ثم يكتب `transaction_events` و`audit_events` ذرّيًا.
- واجهة العميل العامة تستخدم Edge Function `resolve-transaction` مع rate limiting ولا تعيد إلا الأطراف والأحداث الموسومة `visible_to_client=true`.
