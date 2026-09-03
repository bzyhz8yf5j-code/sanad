import type { ComponentProps, PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../theme/colors';

export function Title({ children, style, ...props }: ComponentProps<typeof Text>) { return <Text {...props} style={[s.title, style]}>{children}</Text>; }
export function Body({ children, style, ...props }: ComponentProps<typeof Text>) { return <Text {...props} style={[s.body, style]}>{children}</Text>; }
export function Card({ children }: PropsWithChildren) { return <View style={s.card}>{children}</View>; }
export function Button({ label, onPress }: { label: string; onPress?: () => void }) { return <Pressable onPress={onPress} style={s.button}><Text style={s.buttonText}>{label}</Text></Pressable>; }
export function Field(props: React.ComponentProps<typeof TextInput>) { return <TextInput placeholderTextColor={colors.muted} {...props} style={[s.input, props.style]} />; }

const s = StyleSheet.create({
  title: { color: colors.gold300, fontSize: 26, fontWeight: '800', textAlign: 'right' },
  body: { color: colors.text, fontSize: 15, lineHeight: 24, textAlign: 'right' },
  card: { backgroundColor: colors.navy900, borderColor: colors.line, borderWidth: 1, borderRadius: 18, padding: 16, gap: 10 },
  button: { backgroundColor: colors.gold500, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 18 },
  buttonText: { color: colors.navy950, textAlign: 'center', fontWeight: '800' },
  input: { backgroundColor: colors.navy800, color: colors.text, borderRadius: 12, padding: 12, textAlign: 'right', borderColor: colors.line, borderWidth: 1 },
});
