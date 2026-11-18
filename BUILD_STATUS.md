# سند — حالة البناء v0.12.0 / Native Readiness Batch

## الحالة الحالية

- Expo/EAS project linked: `@eng.mohammad92/sanad`
- EAS project ID: `d8021acb-3d10-41f5-8623-f41ac8e64e8b`
- Supabase live backend connected.
- EAS public client environment is embedded in build profiles.
- EAS workflow for iOS simulator development build is ready on branch `build/eas-development`.
- Physical iPhone workflow now includes Expo Apple device registration request and ad-hoc provisioning refresh before the Development Client build.
- GitHub target repository confirmed: `bzyhz8yf5j-code/sanad` (kept separate from `al-saad`).
- Reproducible npm dependency lockfile is included.
- Core Arabic RTL interface is implemented with the approved navy/gold direction.
- Account access uses real Supabase Auth only.
- Office workflow is connected end-to-end: dashboard, property draft, media, risks, readiness blockers, publishing and report request.
- Device diagnostics screen added for EAS, Supabase health, map configuration, Push permission and Offline queues.
- Production map runtime no longer falls back to public demo tiles when a licensed style is missing.
- Property Offline queue now uses retry backoff, a retry ceiling and manual retry for transient failures while conflicts remain protected.

## Verification target for this batch

The PR must pass:
- `npm run check`
- `npm run typecheck`
- `npm run release:readiness`

GitHub quality CI remains the merge gate.

## Current release gate

No EAS native build is considered verified until a workflow run produces an actual iOS artifact. For a physical iPhone build, Apple device enrollment/approval and signing credentials are still required in the official Expo/Apple flow.

## Remaining high-priority release work

1. Run the iOS simulator workflow and fix any cloud-only native issue.
2. Run the physical iPhone workflow and complete device registration/signing.
3. Execute `docs/NATIVE_QA.md` on a real iPhone.
4. Add the officially approved Sanad icon/splash assets.
5. Configure a licensed production Map Style URL.
6. Finish end-to-end Push delivery testing.
7. Keep AI assistant and licensed CAD integration as separate implementation batches; neither should be presented as production-ready until a real provider is connected.
