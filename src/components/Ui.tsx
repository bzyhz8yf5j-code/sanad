import type { ComponentProps, PropsWithChildren, ReactNode } from 'react';
import type { ColorValue } from 'react-native';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../theme/colors';

export type IconName = keyof typeof glyphs;

const glyphs = {
  home: '⌂',
  search: '⌕',
  add: '+',
  heart: '♡',
  account: '◎',
  map: '⌖',
  office: '▥',
  building: '▤',
  land: '◇',
  key: '⌁',
  sale: '⌂',
  projects: '▦',
  more: '•••',
  bell: '♢',
  shield: '◆',
  arrow: '‹',
  location: '⌖',
  document: '▧',
  message: '□',
  check: '✓',
  close: '×',
  filter: '≡',
  sparkle: '✦',
} as const;

export function Icon({ name, color = colors.text, size = 22 }: { name: IconName; color?: ColorValue; size?: number }) {
  return <Text accessible={false} style={{ color, fontSize: size, lineHeight: size + 4, fontWeight: '800', textAlign: 'center' }}>{glyphs[name]}</Text>;
}

export function Title({ children, style, ...props }: ComponentProps<typeof Text>) {
  return <Text {...props} style={[s.title, style]}>{children}</Text>;
}

export function SectionTitle({ children, action }: PropsWithChildren<{ action?: ReactNode }>) {
  return <View style={s.sectionHeader}><View style={s.sectionHeading}><View style={s.sectionLine} /><Text style={s.sectionTitle}>{children}</Text></View>{action}</View>;
}

export function Body({ children, style, ...props }: ComponentProps<typeof Text>) {
  return <Text {...props} style={[s.body, style]}>{children}</Text>;
}

export function Caption({ children, style, ...props }: ComponentProps<typeof Text>) {
  return <Text {...props} style={[s.caption, style]}>{children}</Text>;
}

export function Card({ children, style, tone = 'default', ...props }: ComponentProps<typeof View> & { tone?: 'default' | 'elevated' | 'accent' }) {
  return <View {...props} style={[s.card, tone === 'elevated' && s.cardElevated, tone === 'accent' && s.cardAccent, style]}>{children}</View>;
}

export function Button({ label, onPress, variant = 'primary', icon, disabled, compact = false }: {
  label: string;
  onPress?: ComponentProps<typeof Pressable>['onPress'];
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: IconName;
  disabled?: boolean;
  compact?: boolean;
}) {
  const foreground = variant === 'primary' ? colors.navy950 : variant === 'danger' ? '#FF9A9E' : colors.gold300;
  return <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} style={({ pressed }) => [s.button, buttonStyles[variant], compact && s.buttonCompact, pressed && !disabled && s.pressed, disabled && s.disabled]}>
    {icon ? <Icon name={icon} color={foreground} size={compact ? 17 : 19} /> : null}
    <Text style={[s.buttonText, { color: foreground }]}>{label}</Text>
  </Pressable>;
}

export function IconButton({ icon, label, onPress, active = false }: { icon: IconName; label: string; onPress?: ComponentProps<typeof Pressable>['onPress']; active?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [s.iconButton, active && s.iconButtonActive, pressed && s.pressed]}>
    <Icon name={icon} color={active ? colors.navy950 : colors.gold300} size={20} />
  </Pressable>;
}

export function QuickAction({ icon, label, onPress, accent = colors.gold300 }: { icon: IconName; label: string; onPress?: ComponentProps<typeof Pressable>['onPress']; accent?: string }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [s.quickAction, pressed && s.pressed]}>
    <View style={[s.quickIcon, { borderColor: `${accent}55` }]}><Icon name={icon} color={accent} size={22} /></View>
    <Text numberOfLines={1} style={s.quickLabel}>{label}</Text>
  </Pressable>;
}

export function Badge({ children, tone = 'gold' }: PropsWithChildren<{ tone?: 'gold' | 'success' | 'warning' | 'muted' }>) {
  const palette = badgeStyles[tone];
  return <View style={[s.badge, { backgroundColor: palette.backgroundColor, borderColor: palette.borderColor }]}><Text style={[s.badgeText, { color: palette.color }]}>{children}</Text></View>;
}

export function Field(props: ComponentProps<typeof TextInput>) {
  return <TextInput selectionColor={colors.gold300} placeholderTextColor={colors.muted} {...props} style={[s.input, props.multiline && s.inputMultiline, props.style]} />;
}

export function Divider() { return <View style={s.divider} />; }

export function EmptyState({ icon = 'search', title, description, action }: { icon?: IconName; title: string; description: string; action?: ReactNode }) {
  return <Card style={s.empty}><View style={s.emptyIcon}><Icon name={icon} color={colors.gold300} size={30} /></View><Text style={s.emptyTitle}>{title}</Text><Body style={s.emptyDescription}>{description}</Body>{action}</Card>;
}

const buttonStyles = StyleSheet.create({
  primary: { backgroundColor: colors.gold500, borderColor: colors.gold300 },
  secondary: { backgroundColor: 'rgba(217,165,58,0.07)', borderColor: colors.gold500 },
  ghost: { backgroundColor: 'transparent', borderColor: colors.line },
  danger: { backgroundColor: 'rgba(234,93,98,0.08)', borderColor: 'rgba(234,93,98,0.55)' },
});

const badgeStyles = {
  gold: { color: colors.gold300, backgroundColor: 'rgba(217,165,58,0.12)', borderColor: 'rgba(217,165,58,0.30)' },
  success: { color: '#65DFAA', backgroundColor: 'rgba(49,185,122,0.14)', borderColor: 'rgba(49,185,122,0.30)' },
  warning: { color: '#F0B866', backgroundColor: 'rgba(228,147,53,0.14)', borderColor: 'rgba(228,147,53,0.30)' },
  muted: { color: colors.muted, backgroundColor: 'rgba(147,164,186,0.08)', borderColor: 'rgba(147,164,186,0.22)' },
} as const;

const s = StyleSheet.create({
  title: { color: colors.text, fontSize: 28, lineHeight: 38, fontWeight: '900', textAlign: 'right', writingDirection: 'rtl' },
  sectionHeader: { minHeight: 34, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  sectionLine: { width: 3, height: 22, borderRadius: 3, backgroundColor: colors.gold500 },
  sectionTitle: { color: colors.text, fontSize: 19, lineHeight: 28, fontWeight: '800', textAlign: 'right', writingDirection: 'rtl' },
  body: { color: '#D5DFEB', fontSize: 15, lineHeight: 24, textAlign: 'right', writingDirection: 'rtl' },
  caption: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'right', writingDirection: 'rtl' },
  card: { backgroundColor: colors.navy800, borderColor: colors.line, borderWidth: StyleSheet.hairlineWidth, borderRadius: 20, padding: 16, gap: 10 },
  cardElevated: { backgroundColor: colors.navy700, borderColor: colors.lineSoft, shadowColor: '#000', shadowOpacity: 0.24, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 5 },
  cardAccent: { backgroundColor: colors.navy700, borderColor: 'rgba(217,165,58,0.38)' },
  button: { minHeight: 50, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 18, borderWidth: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8 },
  buttonCompact: { minHeight: 39, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 13 },
  buttonText: { textAlign: 'center', writingDirection: 'rtl', fontSize: 14, fontWeight: '900' },
  pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
  disabled: { opacity: 0.45 },
  iconButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.navy700, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  iconButtonActive: { backgroundColor: colors.gold500, borderColor: colors.gold300 },
  quickAction: { flexGrow: 1, flexBasis: '22%', minWidth: 72, maxWidth: 108, alignItems: 'center', gap: 7, paddingVertical: 7 },
  quickIcon: { width: 51, height: 51, borderRadius: 16, backgroundColor: colors.navy700, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { color: colors.text, fontSize: 12, lineHeight: 18, fontWeight: '700', textAlign: 'center', writingDirection: 'rtl', width: '100%' },
  badge: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  badgeText: { fontSize: 10, lineHeight: 15, fontWeight: '800', writingDirection: 'rtl' },
  input: { minHeight: 50, backgroundColor: colors.navy800, color: colors.text, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, textAlign: 'right', writingDirection: 'rtl', borderColor: colors.line, borderWidth: 1, fontSize: 15 },
  inputMultiline: { minHeight: 112, textAlignVertical: 'top' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line, alignSelf: 'stretch' },
  empty: { alignItems: 'center', paddingVertical: 28, gap: 8 },
  emptyIcon: { width: 62, height: 62, borderRadius: 20, backgroundColor: 'rgba(217,165,58,0.10)', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '900', textAlign: 'center', writingDirection: 'rtl' },
  emptyDescription: { color: colors.muted, textAlign: 'center', maxWidth: 320 },
});
