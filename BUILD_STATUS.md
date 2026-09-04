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
- Source transfer to GitHub `main` is complete and synchronized through ChatGPT.
- Core Arabic RTL interface is implemented with the approved navy/gold direction: home, search, add property, favorites, account, Iraq map, offices, and property details.
- Demo property records are visibly labeled and never presented as governmental or legal verification.
- Account access now uses real Supabase Auth only; disconnected previews report their state instead of simulating a successful login.
- The office workflow is connected end-to-end: dashboard, approved-office selection, property draft, media upload/order/cover, risk resolution, readiness blockers, publishing, and report request.

## Verification

- Source syntax: PASS (103 TypeScript/TSX files).
- Domain tests: PASS.
- TypeScript strict typecheck: PASS.
- Expo SDK 57 alignment: PASS.
- Native readiness: PASS.
- EAS project link: PASS.
- EAS workflow structure: PASS.
- Release readiness: PASS, except runtime public environment variables that are supplied by EAS.
- Expo web production export: PASS (45 static routes).

## Current release gate

No EAS or device build has been started. Before a native distribution build, confirm the target build type and credentials explicitly; local checks intentionally report the Supabase public variables as runtime-provided.

## Build order

1. Continue product implementation and local/GitHub quality checks on `main`.
2. After explicit approval, trigger the iOS simulator development workflow.
3. Configure Apple Developer credentials/device registration only when a physical-device build is requested.
4. Trigger the physical iPhone Development Client workflow after those prerequisites are confirmed.
