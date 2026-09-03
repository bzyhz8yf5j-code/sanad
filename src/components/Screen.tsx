import type { PropsWithChildren } from 'react';
import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export function Screen({ children }: PropsWithChildren) {
  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.content}>{children}</ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.navy950 }, content: { padding: 18, gap: 14 } });
