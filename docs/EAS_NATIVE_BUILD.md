# Sanad EAS Native Build Handoff — v0.11.0

## Status
The project is prepared for EAS Development Builds. Local source checks pass. The remaining external prerequisites are:
1. npm connectivity so dependencies can be installed and package-lock.json can be created.
2. Expo/EAS account authentication and `eas init`, which writes `expo.extra.eas.projectId`.
3. EAS environment variables for `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
4. Apple Developer credentials/device registration for a development build installed on a physical iPhone. Android internal development builds do not require a Play Store account.

## Prepared build profiles
- `development`: physical-device Dev Client, internal distribution.
- `development-simulator`: iOS Simulator Dev Client.
- `preview`: internal QA build.
- `production`: store build with remote auto-increment.

## One-shot bootstrap
After npm connectivity is available:

```bash
npm install
npm run sdk57:check
npm run native:doctor
npm run typecheck
npm run native:readiness
```

Then authenticate/link EAS and set environment variables with `scripts/eas-link-and-build.sh` or equivalent EAS dashboard setup.

## First build order
1. Android development build first — validates native config without Apple signing.
2. iOS simulator build if a macOS simulator is available.
3. Physical iPhone development build after Apple Developer signing/device registration is ready.

## Backend
Supabase live backend is already provisioned. Never place `SUPABASE_SERVICE_ROLE_KEY` in Expo/EAS client variables.
