# سند — حالة البناء v0.13.0

## الحالة المؤكدة

- Expo/EAS project: `@engmohammad92s-team/sanad`.
- EAS project ID: `d8021acb-3d10-41f5-8623-f41ac8e64e8b`.
- Supabase live backend connected.
- GitHub repository: `bzyhz8yf5j-code/sanad`.
- أول iOS Simulator Development Build نجح بالكامل بعد تصحيح EAS owner.
- Source/TypeScript/Native checks وiOS prebuild نجحت في السحابة.
- مسار iPhone الحقيقي موجود ويوقف قبل البناء إلى أن يتم تسجيل الجهاز واعتماده في Expo/Apple.
- GitHub Actions لا يعمل على كل PR لتقليل الاستهلاك؛ الفحص الأساسي أصبح عبر EAS Source Checks بدون Xcode Build.

## ما أضيف في v0.13.0

- Device diagnostics داخل التطبيق.
- حماية Production من demo map tiles.
- Offline retry backoff وحد أقصى للمحاولات.
- مزامنة تلقائية عند startup/foreground.
- Offline support للعقارات والرسائل وطلبات المواعيد.
- UUID ثابت للرسائل والمواعيد لمنع التكرار.
- صفحة طلب موعد معاينة مرتبطة بالعقار والمكتب.
- مركز Offline يعرض العقارات/الرسائل/المواعيد/الميدان والأخطاء الدائمة.
- Production release gate يمنع بناء نسخة إنتاجية ناقصة من الهوية أو الخريطة.
- EAS Source Checks workflow لاختبار الدفعات الكبيرة بدون تكلفة Native Build في كل مرة.

## نتيجة iOS

### Simulator
SUCCESS

### Physical iPhone
المسار وصل إلى خطوة تسجيل الجهاز. Expo يتطلب تسجيل iPhone والموافقة على enrollment قبل بناء internal development build. لم يبدأ Xcode Build للجهاز الحقيقي، لذلك لم تُصرف محاولة Native Build غير ضرورية.

## سياسة تقليل المصاريف

1. دفعات كبيرة على فرع واحد.
2. Commit واحد أو عدد محدود لكل دفعة.
3. EAS Source Checks للـTypeScript/native config/prebuild.
4. Native Build فقط عند نقاط الإصدار أو بعد تغيير Native حقيقي.
5. عدم إعادة أي Build فاشل بدون سبب واضح وتعديل فعلي.
6. Production gate قبل أي build/submit إنتاجي.

## المتبقي عالي الأولوية

1. تسجيل iPhone واعتماد الجهاز داخل Expo عند الجاهزية.
2. تشغيل أول Physical iPhone Development Build.
3. تنفيذ `docs/NATIVE_QA.md` على جهاز حقيقي.
4. إضافة الأيقونة الرسمية المعتمدة لسند وSplash.
5. ضبط Licensed Production Map Style URL.
6. إكمال Push worker end-to-end.
7. ربط CAD provider مرخّص.
8. تنفيذ مساعد AI العقاري الحقيقي كمجموعة مستقلة.
