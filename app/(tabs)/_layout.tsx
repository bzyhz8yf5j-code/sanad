import { Tabs } from 'expo-router';
import { colors } from '../../src/theme/colors';

export default function TabsLayout() {
  return <Tabs screenOptions={{ headerShown: false, tabBarStyle: { backgroundColor: colors.navy900, borderTopColor: colors.line }, tabBarActiveTintColor: colors.gold300, tabBarInactiveTintColor: colors.muted }}>
    <Tabs.Screen name="index" options={{ title: 'الرئيسية' }} />
    <Tabs.Screen name="search" options={{ title: 'البحث' }} />
    <Tabs.Screen name="geo" options={{ title: 'الخريطة' }} />
    <Tabs.Screen name="offices" options={{ title: 'المكاتب' }} />
    <Tabs.Screen name="account" options={{ title: 'الحساب' }} />
  </Tabs>;
}
