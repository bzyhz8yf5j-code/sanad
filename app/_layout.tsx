import { useEffect } from 'react';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { parseNotificationData, routeForTarget } from '../src/domain/deepLinks';
import { bindNativeAuthRefresh } from '../src/lib/supabase';
import { bindForegroundSync } from '../src/services/syncCoordinator';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

function openNotification(data: Record<string, unknown> | undefined) {
  const route = routeForTarget(parseNotificationData(data));
  if (route !== '/') router.push(route as any);
}

export default function RootLayout() {
  useEffect(() => {
    const unbindAuthRefresh = bindNativeAuthRefresh();
    const unbindForegroundSync = bindForegroundSync();

    Notifications.getLastNotificationResponseAsync().then((response) => {
      const data = response?.notification.request.content.data as Record<string, unknown> | undefined;
      if (data) openNotification(data);
    });

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      openNotification(response.notification.request.content.data as Record<string, unknown> | undefined);
    });

    return () => {
      sub.remove();
      unbindForegroundSync();
      unbindAuthRefresh();
    };
  }, []);

  return <>
    <StatusBar style="light" />
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#061425' }, animation: 'fade_from_bottom' }} />
  </>;
}
