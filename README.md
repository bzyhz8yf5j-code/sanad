# سند (Sanad)

الإصدار الحالي: **v0.12.0**

مشروع عقاري عراقي مبني بـ Expo/React Native وSupabase/PostGIS، مرتبط رسميًا بمشروع EAS `@eng.mohammad92/sanad`.

> هذا المستودع مخصص لمشروع «سند» فقط، وهو منفصل تمامًا عن مشروع «السعد» وعن «مجمع البارق».

## Cloud build

- `.eas/workflows/ios-simulator-development.yml` — first native validation build.
- `.eas/workflows/ios-device-development.yml` — physical iPhone Development Client after Apple credentials.
- EAS build profiles include only client-safe `EXPO_PUBLIC_*` Supabase configuration.
- No service-role or server secrets are stored in the app.

راجع `BUILD_STATUS.md` و`docs/EXPO_GITHUB_BUILD.md`.
