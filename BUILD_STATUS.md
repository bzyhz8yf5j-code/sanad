# سند — حالة البناء v0.12.0

## الحالة الحالية

- Expo/EAS project linked: `@eng.mohammad92/sanad`
- EAS project ID: `d8021acb-3d10-41f5-8623-f41ac8e64e8b`
- Supabase live backend connected.
- EAS public client environment is embedded in build profiles.
- EAS workflow for iOS simulator development build is ready on branch `build/eas-development`.
- EAS workflow for physical iPhone development build is ready on branch `build/ios-device`.
- GitHub target repository confirmed: `bzyhz8yf5j-code/sanad` (kept separate from `al-saad`).
- Reproducible npm dependency lockfile is included.

## Verification

- Source syntax: PASS (99 TypeScript/TSX files).
- Domain tests: PASS.
- TypeScript strict typecheck: PASS.
- Expo SDK 57 alignment: PASS.
- Native readiness: PASS.
- EAS project link: PASS.
- EAS workflow structure: PASS.
- Release readiness: PASS, except runtime public environment variables that are supplied by EAS.

## Current external dependency

Connect the Expo GitHub App to `bzyhz8yf5j-code/sanad` from the Sanad project settings so pushes to the prepared build branches can start EAS workflows.

## Build order

1. Push prepared source to branch `build/eas-development`.
2. EAS runs source checks and iOS simulator development build.
3. Configure Apple Developer credentials/device registration.
4. Push/trigger branch `build/ios-device` for the physical iPhone Development Client.
