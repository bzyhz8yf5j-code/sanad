# Property Media Storage

- Bucket `property-media` خاص (Private).
- المسار القياسي: `properties/<property-id>/<user-id>/<nonce>-<filename>`.
- القراءة متاحة للمكتب المخول، أو لعقار منشور عبر Signed URL/Storage policy.
- الكتابة والحذف لا يسمحان إلا لمن يملك `property_edit` على المكتب صاحب الإعلان.
- عند فشل إنشاء صف `property_media` بعد رفع الملف، تحاول الخدمة حذف الملف فورًا لتجنب Orphan objects.
- اختيار الغلاف يتم عبر RPC `set_property_cover` لضمان صورة غلاف واحدة فقط.
