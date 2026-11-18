# سند — حالة البناء v0.12.0 / Native Readiness Batch

## الحالة الحالية

- Expo/EAS project ID: d8021acb-3d10-41f5-8623-f41ac8e64e8b.
- GitHub-triggered Expo workflow reports the project under @engmohammad92s-team/sanad; app config owner has been aligned to that owner.
- Supabase live backend connected.
- EAS public client environment is embedded in build profiles.
- EAS workflow for iOS simulator development build is on branch build/eas-development.
- Simulator workflow now performs an iOS prebuild before starting the more expensive native build.
- Physical iPhone workflow includes Expo Apple device registration request and ad-hoc provisioning refresh before the Development Client build.
- GitHub target repository: bzyhz8yf5j-code/sanad and remains separate from other projects.
- GitHub Actions PR runs were disabled to reduce CI cost/churn; quality runs remain available manually and on relevant changes to main.
- Reproducible npm dependency lockfile is included.
- Core Arabic RTL interface is implemented with the navy/gold direction.
- Account access uses real Supabase Auth only.
- Office workflow is connected end-to-end: dashboard, property draft, media, risks, readiness blockers, publishing and report request.
- Device diagnostics covers EAS, Supabase health, map configuration, Push permission, Offline queues and last local sync.
- Production map runtime does not fall back to public demo tiles.
- Property Offline queue uses retry backoff, a retry ceiling and manual retry for transient failures while conflicts remain protected.
- Pending property/field work is coordinated automatically at startup and when the app returns to foreground, without adding a new networking dependency.

## First cloud build result

The first GitHub-triggered EAS simulator run reached:
- Source/native checks: SUCCESS.
- iOS simulator build job: ERROR.

The Expo-generated GitHub status identifies the project as @engmohammad92s-team/sanad, while the previous app config owner was eng.mohammad92. This mismatch is corrected in this batch before spending another build.

## Verification strategy

To reduce cost:
1. Make large consolidated changes on the PR branch.
2. Run local/static checks before moving the EAS trigger branch.
3. Move build/eas-development once per completed batch.
4. EAS runs source/type/native checks plus iOS prebuild before native compilation.
5. Do not retry failed cloud builds without a concrete config/code change.

## Remaining high-priority release work

1. Re-run one simulator build after this consolidated batch.
2. If the build reaches native compilation and still fails, inspect Expo build logs before any dependency upgrade.
3. Run the physical iPhone workflow only after Apple credentials/device prerequisites are ready.
4. Execute docs/NATIVE_QA.md on a real iPhone.
5. Add the officially approved Sanad icon/splash assets.
6. Configure a licensed production Map Style URL.
7. Finish end-to-end Push delivery testing.
8. Keep AI assistant and licensed CAD integration as separate implementation batches until real providers are connected.
