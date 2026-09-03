# Expo / EAS account linkage

- Expo owner: `eng.mohammad92`
- Expo project slug: `sanad`
- EAS project full name: `@eng.mohammad92/sanad`
- EAS project ID: `d8021acb-3d10-41f5-8623-f41ac8e64e8b`
- iOS bundle identifier: `iq.sanad.app`
- Android package: `iq.sanad.app`
- EAS Update URL: `https://u.expo.dev/d8021acb-3d10-41f5-8623-f41ac8e64e8b`

The web-created EAS project is now linked in `app.json` through `expo.extra.eas.projectId`.
The runtime policy is tied to the application version for safe update compatibility.

## Next online command

Once EAS CLI is available and authenticated:

```bash
eas whoami
eas project:info
npm install
npx expo-doctor
npm run typecheck
eas build --platform ios --profile development
```

No Expo password or access token should be committed to the repository or shared in chat.
