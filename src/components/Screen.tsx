import type { PropsWithChildren } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '../theme/colors';

export function Screen({ children, contentStyle }: PropsWithChildren<{ contentStyle?: StyleProp<ViewStyle> }>) {
  return <SafeAreaView style={styles.safe}><ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, contentStyle]}>{children}</ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.navy950 },
  content: { width: '100%', maxWidth: 760, minHeight: '100%', alignSelf: 'center', paddingHorizontal: 18, paddingTop: 12, paddingBottom: 110, gap: 16, direction: 'rtl' },
});
