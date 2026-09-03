import { Tabs } from 'expo-router';
import { StyleSheet, View, type ColorValue } from 'react-native';
import { Icon, type IconName } from '../../src/components/Ui';
import { colors } from '../../src/theme/colors';

function TabIcon({ name, color, focused, primary = false }: { name: IconName; color: ColorValue; focused: boolean; primary?: boolean }) {
  if (primary) return <View style={[styles.add, focused && styles.addFocused]}><Icon name="add" color={colors.navy950} size={30} /></View>;
  return <View style={[styles.icon, focused && styles.iconFocused]}><Icon name={name} color={color} size={21} /></View>;
}

export default function TabsLayout() {
  return <Tabs screenOptions={{
    headerShown: false,
    tabBarStyle: styles.bar,
    tabBarItemStyle: styles.item,
    tabBarLabelStyle: styles.label,
    tabBarActiveTintColor: colors.gold300,
    tabBarInactiveTintColor: colors.muted,
    tabBarHideOnKeyboard: true,
  }}>
    <Tabs.Screen name="index" options={{ title: 'الرئيسية', tabBarIcon: ({ color, focused }) => <TabIcon name="home" color={color} focused={focused} /> }} />
    <Tabs.Screen name="search" options={{ title: 'بحث', tabBarIcon: ({ color, focused }) => <TabIcon name="search" color={color} focused={focused} /> }} />
    <Tabs.Screen name="add" options={{ title: 'إضافة', tabBarIcon: ({ color, focused }) => <TabIcon name="add" color={color} focused={focused} primary /> }} />
    <Tabs.Screen name="favorites" options={{ title: 'المفضلة', tabBarIcon: ({ color, focused }) => <TabIcon name="heart" color={color} focused={focused} /> }} />
    <Tabs.Screen name="account" options={{ title: 'الحساب', tabBarIcon: ({ color, focused }) => <TabIcon name="account" color={color} focused={focused} /> }} />
    <Tabs.Screen name="geo" options={{ href: null }} />
    <Tabs.Screen name="offices" options={{ href: null }} />
  </Tabs>;
}

const styles = StyleSheet.create({
  bar: { position: 'absolute', height: 78, paddingTop: 7, paddingBottom: 9, backgroundColor: 'rgba(6,20,37,0.98)', borderTopColor: colors.line, borderTopWidth: StyleSheet.hairlineWidth, elevation: 18, shadowColor: '#000', shadowOpacity: 0.28, shadowRadius: 15, shadowOffset: { width: 0, height: -6 } },
  item: { paddingVertical: 1 },
  label: { fontSize: 10, fontWeight: '700', writingDirection: 'rtl' },
  icon: { width: 34, height: 29, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  iconFocused: { backgroundColor: 'rgba(217,165,58,0.10)' },
  add: { width: 48, height: 48, marginTop: -18, borderRadius: 24, backgroundColor: colors.gold500, borderWidth: 3, borderColor: colors.navy900, alignItems: 'center', justifyContent: 'center', shadowColor: colors.gold500, shadowOpacity: 0.28, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 7 },
  addFocused: { backgroundColor: colors.gold300 },
});
