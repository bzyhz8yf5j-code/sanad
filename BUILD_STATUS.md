# سند — حالة البناء v0.12.0

## الحالة الحالية

- Expo/EAS project linked: `@eng.mohammad92/sanad`
- EAS project ID: `d8021acb-3d10-41f5-8623-f41ac8e64e8b`
- Supabase live backend connected.
- EAS public client environment is embedded in build profiles.
- EAS workflow for iOS simulator development build is ready on branch `build/eas-development`.
- EAS workflow for physical iPhone development build is ready on branch `build/ios-device`.
- `main` has not been modified by this preparation.

## Verification

- Source syntax: PASS (99 TypeScript/TSX files).
- Domain tests: PASS.
- Expo SDK 57 alignment: PASS.
- Native readiness: PASS.
- EAS project link: PASS.
- EAS workflow structure: PASS.
- Local dependency-based typecheck: pending because this execution environment cannot download npm dependencies. The cloud workflow installs dependencies before running typecheck.

## Current external dependency

The ChatGPT GitHub connector is unavailable in this session, so the prepared source/workflow has not been pushed to the repository. The next UI step is to connect the Expo GitHub App to `bzyhz8yf5j-code/sanad` from the Sanad project's GitHub settings.

## Build order

1. Push prepared source to branch `build/eas-development`.
2. EAS runs source checks and iOS simulator development build.
3. Configure Apple Developer credentials/device registration.
4. Push/trigger branch `build/ios-device` for the physical iPhone Development Client.
