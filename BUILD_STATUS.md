# سند — حالة البناء v0.15.0

## الحالة المؤكدة

- Expo/EAS: `@engmohammad92s-team/sanad`.
- GitHub: `bzyhz8yf5j-code/sanad`.
- iOS Simulator Development Build: SUCCESS.
- EAS Source Checks: SUCCESS حتى v0.14.
- Physical iPhone: متوقف قبل Xcode على تسجيل الجهاز/Apple approval.
- Supabase project كان `INACTIVE` وتم طلب Restore؛ آخر حالة أثناء هذه الدفعة `COMING_UP`.
- v0.14 Push code مدموج على `main`، ونشر Edge Functions ينتظر Supabase `ACTIVE_HEALTHY`.

## v0.15 — Production Base Map

- OpenFreeMap Liberty أصبح Base Map مضبوطًا في EAS development/preview/production.
- لا يحتاج API key، مما يقلل الكلفة التشغيلية الحالية.
- MapLibre demo tiles لم تعد مطلوبة في EAS profiles.
- الخريطة تعرض loading/error/retry state بدل شاشة فارغة.
- واجهة المركز الجغرافي توضح أن Base Map سياقية وغير رسمية.
- حدود القطع والمرتسمات والبيانات القانونية تبقى مصادر منفصلة مرخّصة داخل سند.
- Release Gate يمنع HTTP وغير HTTPS، ويمنع `demotiles.maplibre.org`.
- Offline base-map packs غير مفعلة تلقائيًا.
- قبل الإطلاق الوطني الواسع يبقى قرار SLA/self-hosting مطلوبًا لأن OpenFreeMap public instance لا يقدم SLA.

## Release Gate المتبقي

بعد ضبط خريطة Production، أكبر blocker بصري مباشر هو:
- الأيقونة الرسمية/Splash المعتمدة لسند.

لم يتم العثور على ملف صورة شعار/أيقونة سند المعتمد داخل Library في البحث الحالي، لذلك لم يتم استبداله بصورة تخمينية.

## سياسة الكلفة

- MapLibre مفتوح المصدر.
- OpenFreeMap public base map بدون API key.
- لا Native Build لهذه الدفعة؛ Source Checks فقط.
- لا Offline tile bulk download حاليًا.
- لا إضافة مزود خرائط مدفوع قبل الحاجة الفعلية/SLA.
