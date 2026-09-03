#!/usr/bin/env bash
set -euo pipefail
: "${EXPO_PUBLIC_SUPABASE_URL:?Set EXPO_PUBLIC_SUPABASE_URL}"
: "${EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY:?Set EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY}"

command -v eas >/dev/null 2>&1 || npm install --global eas-cli

eas whoami >/dev/null 2>&1 || eas login

eas init --account eng.mohammad92

eas build:configure

for env in development preview production; do
  eas env:set --name EXPO_PUBLIC_SUPABASE_URL --value "$EXPO_PUBLIC_SUPABASE_URL" --environment "$env" --visibility plaintext --force
  eas env:set --name EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY --value "$EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY" --environment "$env" --visibility sensitive --force
  eas env:set --name EXPO_PUBLIC_APP_ENV --value "$env" --environment "$env" --visibility plaintext --force
done

npm run native:check

echo "EAS project linked. Start a build with one of:"
echo "  eas build --platform android --profile development"
echo "  eas build --platform ios --profile development"
