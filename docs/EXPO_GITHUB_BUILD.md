# Sanad Expo GitHub / EAS Build

Project: `@eng.mohammad92/sanad`
EAS project ID: `d8021acb-3d10-41f5-8623-f41ac8e64e8b`

## Current cloud build plan

1. Connect the Expo GitHub App to `bzyhz8yf5j-code/sanad` from Project settings > GitHub.
2. Keep repository root `/`.
3. Keep the current source on `main` and use branch `build/eas-development` for the first native validation build.
4. `.eas/workflows/ios-simulator-development.yml` runs checks and an iOS simulator development build on pushes to that branch.
5. After Apple Developer credentials are configured, use branch `build/ios-device` to trigger the physical iPhone development build.

## Why simulator first

The simulator build validates the native dependency graph, Expo prebuild, MapLibre integration, routing, and iOS compilation without requiring an Apple device provisioning profile. It does not install on a physical iPhone.

## Public environment variables

The EAS build profiles include only client-safe `EXPO_PUBLIC_*` Supabase values. Server/service-role secrets remain only in Supabase Edge Function secrets and must never be committed to the app.

## Repository status

The destination is the dedicated `bzyhz8yf5j-code/sanad` repository. It must remain independent from `bzyhz8yf5j-code/al-saad`; no source, branding, environment variables, or deployment configuration is shared between them.
