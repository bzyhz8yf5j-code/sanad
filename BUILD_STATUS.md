# سند — حالة البناء v0.14.0

## الحالة المؤكدة

- Expo/EAS project: `@engmohammad92s-team/sanad`.
- EAS project ID: `d8021acb-3d10-41f5-8623-f41ac8e64e8b`.
- Supabase live backend connected.
- GitHub repository: `bzyhz8yf5j-code/sanad`.
- iOS Simulator Development Build: SUCCESS.
- EAS Source Checks بدون Native Build: SUCCESS في v0.13.
- Physical iPhone workflow متوقف قبل Xcode Build على خطوة تسجيل الجهاز/Apple approval.
- GitHub Actions لا يعمل على كل PR لتقليل الاستهلاك.

## v0.14.0 — Push Delivery Hardening

- Expo Push send batches محددة إلى 100.
- HTTP 429 و5xx/network فقط تدخل retry/backoff.
- Push tickets تفحص لكل جهاز.
- `DeviceNotRegistered` يعطل الجهاز بدل الاستمرار بالإرسال له.
- `MessageRateExceeded` يعيد الجهاز المتأثر فقط.
- الإرسال الجزئي يحفظ tickets ويعيد فقط الأجهزة المؤقتة الفشل.
- Push receipts تُفحص من worker runs التالية وتوثق داخل payload.
- Token يرتبط بالحساب الحالي ويتعطل عند sign-out.
- بعد sign-in يعاد تفعيل التسجيل تلقائيًا فقط إذا الإذن سبق ومنح.
- Foreground notifications لها handler واضح.
- `send-notification` يتحقق من payload ويعيد نتيجة dedupe واضحة.
- Push logic لديه اختبار مستقل `npm run test:push`.

## ما لم يثبت بعد

- لم يظهر Scheduler/Cron للـPush worker في المستودع.
- Supabase logs لآخر 24 ساعة لم تعرض استدعاءات worker وقت الفحص.
- لذلك الكود صار جاهزًا، لكن delivery الدوري end-to-end لا يعتبر مثبتًا قبل تفعيل/توثيق Scheduler واختباره على iPhone حقيقي.
- Secret-key migration مؤجلة حتى نحدد caller/Scheduler الحالي حتى لا نكسر المصادقة الحية.

## سياسة تقليل المصاريف

1. دفعات كبيرة على فرع واحد.
2. EAS Source Checks قبل أي Native Build.
3. Native Build فقط عند تغييرات native أو نقاط إصدار.
4. عدم إعادة Build فاشل بلا تعديل واضح.
5. لا نضيف خدمة Push خارجية مدفوعة؛ نستفيد من Expo Push + Supabase الموجودين.
6. Production release gate يبقى مانعًا للنشر حتى اكتمال الهوية والخريطة.

## المتبقي عالي الأولوية

1. فحص v0.14 عبر EAS Source Checks.
2. نشر Edge Functions المحسنة بعد نجاح الفحص.
3. تفعيل/توثيق Scheduler للـPush worker.
4. اختبار Push فعلي بعد تسجيل iPhone.
5. الأيقونة الرسمية + Splash.
6. Licensed Production Map Style.
7. CAD provider مرخّص.
8. مساعد AI العقاري الحقيقي كدفعة مستقلة.
