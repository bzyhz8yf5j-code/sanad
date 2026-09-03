# Sanad Native Build — v0.10.0

## What is prepared

- Expo SDK 57 / React Native 0.86 / React 19.2.3.
- `expo-dev-client` development build profile.
- iOS bundle id and Android package: `iq.sanad.app`.
- Arabic permission messages for location, camera and photo library.
- Supabase React Native session persistence using AsyncStorage and foreground token refresh.
- MapLibre React Native v11 adapter for native maps; production style URL remains environment-controlled.
- Native field mode with GPS point capture, field photos, notes, offline retry queue and idempotent sync keys.
- EAS profiles: development / preview / production.

## First internet-enabled build commands

Fast path:

```bash
bash scripts/bootstrap-native.sh
```

Then link EAS and build:

```bash
npm install
npx expo install --fix
npx expo-doctor
npx eas-cli@latest init
npx expo prebuild --clean
npx eas-cli@latest build --platform ios --profile development
npx eas-cli@latest build --platform android --profile development
```

After `eas init`, Expo writes the real EAS project id into app config. Push token registration intentionally returns `eas_project_not_linked` until that happens.

## Production map requirement

Set `EXPO_PUBLIC_MAP_STYLE_URL` to the licensed/approved production map style. The MapLibre demo style is only a development fallback and must not be treated as the production basemap.

## Official branding assets

The approved Sanad logo/icon has not been replaced by a generated placeholder. Add the officially approved icon/splash assets before store submission.
