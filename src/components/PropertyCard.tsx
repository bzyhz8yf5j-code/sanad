import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { DemoProperty } from '../data/demoProperties';
import { colors } from '../theme/colors';
import { Badge, Caption, Icon, IconButton } from './Ui';

export function PropertyCard({ property, onPress, onToggleFavorite, compact = false }: {
  property: DemoProperty;
  onPress?: () => void;
  onToggleFavorite?: () => void;
  compact?: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`فتح ${property.title}`} onPress={onPress} style={({ pressed }) => [styles.card, compact && styles.compact, pressed && styles.pressed]}>
    <View style={[styles.visual, compact && styles.visualCompact]}>
      <View style={styles.skyGlow} />
      <View style={styles.building}><Icon name={property.visual === 'land' ? 'land' : property.visual === 'commercial' ? 'office' : 'building'} color={colors.gold300} size={compact ? 44 : 56} /></View>
      <View style={styles.badges}>{property.badge ? <Badge>{property.badge}</Badge> : null}{property.verified ? <Badge tone="success">موثق</Badge> : null}</View>
      {onToggleFavorite ? <View style={styles.favorite}><IconButton icon="heart" label={property.favorite ? 'إزالة من المفضلة' : 'حفظ في المفضلة'} active={property.favorite} onPress={(event) => { event.stopPropagation(); onToggleFavorite(); }} /></View> : null}
    </View>
    <View style={styles.content}>
      <Text numberOfLines={1} style={styles.title}>{property.title}</Text>
      <View style={styles.location}><Icon name="location" color={colors.muted} size={14} /><Caption numberOfLines={1}>{property.location}</Caption></View>
      <View style={styles.meta}>
        <Caption>{property.areaSqm.toLocaleString('ar-IQ')} م²</Caption>
        {property.bedrooms ? <><View style={styles.dot} /><Caption>{property.bedrooms} غرف</Caption></> : null}
        <View style={styles.dot} /><Caption>{property.type}</Caption>
      </View>
      <Text style={styles.price}>{property.price.toLocaleString('ar-IQ')} د.ع</Text>
    </View>
  </Pressable>;
}

const styles = StyleSheet.create({
  card: { width: 286, overflow: 'hidden', backgroundColor: colors.navy800, borderRadius: 20, borderWidth: 1, borderColor: colors.line, shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 15, shadowOffset: { width: 0, height: 8 }, elevation: 4 },
  compact: { width: '100%', flexDirection: 'row-reverse' },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  visual: { height: 138, overflow: 'hidden', backgroundColor: colors.navy600, alignItems: 'center', justifyContent: 'flex-end' },
  visualCompact: { width: 116, height: 132, flexShrink: 0 },
  skyGlow: { position: 'absolute', width: 180, height: 180, borderRadius: 100, top: -90, left: -40, backgroundColor: 'rgba(79,143,232,0.18)' },
  building: { width: '78%', height: '78%', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(2,10,20,0.38)', borderTopLeftRadius: 22, borderTopRightRadius: 22, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(240,196,105,0.22)' },
  badges: { position: 'absolute', top: 10, right: 10, left: 10, flexDirection: 'row-reverse', gap: 6, alignItems: 'center' },
  favorite: { position: 'absolute', bottom: 9, left: 9 },
  content: { flex: 1, padding: 14, gap: 6, direction: 'rtl' },
  title: { color: colors.text, fontSize: 16, lineHeight: 23, fontWeight: '900', textAlign: 'right', writingDirection: 'rtl' },
  location: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
  meta: { flexDirection: 'row-reverse', alignItems: 'center', flexWrap: 'wrap', gap: 7 },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.line },
  price: { color: '#65DFAA', fontSize: 15, lineHeight: 22, fontWeight: '900', textAlign: 'right', writingDirection: 'rtl', marginTop: 2 },
});
