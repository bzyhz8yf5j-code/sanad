# Production Readiness

## قبل أول Development Build
1. `npm install` وإنشاء lockfile.
2. `npx expo install --fix` ثم `npx expo-doctor`.
3. `npm run typecheck && npm run check && npm run release:readiness`.
4. تشغيل Supabase المحلي: `supabase start` ثم `supabase db reset`.
5. تحميل fixture المحلي فقط وتشغيل `supabase/tests/rls_smoke.sql`.

## قبل الإنتاج
- ضبط أسرار Edge Functions وعدم وضع service role داخل التطبيق.
- تفعيل خط PDF عربي مرخص واختبار التشكيل بصريًا.
- ربط Map/CAD providers المرخصين واختبار source health ضمن allowlist تشغيلية.
- اختبار RLS بحسابات citizen/office/engineer/valuer/supervisor/admin.
- اختبار النسخ الاحتياطي والاستعادة، rate limits، monitoring وcrash reporting.
- مراجعة قانونية لسياسة الخصوصية، الاحتفاظ، شروط المكاتب، الخرائط والمرتسمات.
