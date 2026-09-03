# تقارير PDF في سند

- Edge Function: `generate-property-report`.
- يتحقق من جلسة المستخدم وصلاحية قراءة العقار عبر RLS.
- يجمع العقار، المكتب، القطعة، المستندات والمخاطر المفتوحة.
- ينشئ PDF فعليًا عبر `pdf-lib` ويستخدم خط TTF عربي من المتغير `SUPABASE_REPORT_FONT_URL`.
- يحفظ الملف داخل bucket خاص `property-reports` ويكتب SHA-256 في `property_reports`.
- يعيد Signed URL مدته 15 دقيقة.
- التقرير معلوماتي ولا يحل محل سند التسجيل أو الوثيقة الرسمية.

## أسرار مطلوبة
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_REPORT_FONT_URL` لرابط HTTPS موثوق لخط TTF عربي مرخص للاستخدام.
