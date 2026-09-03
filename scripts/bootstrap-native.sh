#!/usr/bin/env bash
set -euo pipefail

node -v
npm -v
npm install
npx expo install --fix
npx expo-doctor
node scripts/validate.mjs
node scripts/test-domain.mjs
node scripts/native-readiness.mjs
printf '\nSanad native dependencies are installed and validated. Next: npx eas-cli@latest init\n'
