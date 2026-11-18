# سند — خريطة الأساس

## القرار الحالي

يستخدم سند **OpenFreeMap Liberty** كخريطة أساس منخفضة الكلفة عبر MapLibre:

`https://tiles.openfreemap.org/styles/liberty`

OpenFreeMap يسمح بالاستخدام التجاري على الـpublic instance بدون API key أو تسجيل، ولا يضع حدًا معلنًا لعدد المشاهدات/الطلبات. الخدمة مجانية لكنها مقدمة بدون SLA.

## الفصل بين خريطة الأساس والبيانات العقارية

خريطة الأساس تعرض الطرق والأماكن والسياق الجغرافي العام فقط.

لا تعتبر بيانات OpenFreeMap/OpenStreetMap:
- سند ملكية.
- حدود قطعة رسمية.
- سجل عقاري.
- مرتسمًا مساحيًا رسميًا.
- اعتمادًا حكوميًا.

طبقات القطع والمرتسمات والملفات القانونية في **مركز سند الجغرافي العقاري** تبقى من مصادر مرخّصة ومراجعة داخل سند.

## Production

EAS profiles تضبط:
- `EXPO_PUBLIC_MAP_STYLE_URL`
- `EXPO_PUBLIC_MAP_PROVIDER=openfreemap`

Release Gate يرفض:
- URL غير HTTPS.
- MapLibre demo tiles.
- غياب Production Map Style.

## Offline

لا ينفذ سند تنزيل خرائط أساسية Offline تلقائيًا في هذه المرحلة.

شروط OpenFreeMap الحالية تسمح بتنزيل منطقة إذا لم تتجاوز 3000 tile أو 50 MB، وبحد أقصى 4 طلبات متوازية مع User-Agent فريد للتطبيق. أي Offline map packs أوسع يجب أن تكون دفعة مستقلة ومراجعة قبل الإطلاق.

## خطة الاعتمادية

OpenFreeMap مناسب لتقليل الكلفة في النسخة الحالية. قبل إطلاق وطني واسع، يراجع الفريق أحد الخيارين:
1. استمرار OpenFreeMap مع مراقبة وتقبل عدم وجود SLA.
2. مزود مدفوع/SLA أو self-hosting مع الاحتفاظ بنفس MapLibre abstraction.
