import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PropertyCard } from '../../src/components/PropertyCard';
import { EmptyState, Icon, Title } from '../../src/components/Ui';
import { Screen } from '../../src/components/Screen';
import { demoProperties } from '../../src/data/demoProperties';
import { colors } from '../../src/theme/colors';

export default function FavoritesScreen() {
  const [favoriteIds, setFavoriteIds] = useState(() => new Set(demoProperties.filter((property) => property.favorite).map((property) => property.id)));
  const favorites = useMemo(() => demoProperties.filter((property) => favoriteIds.has(property.id)), [favoriteIds]);

  function removeFavorite(id: string) {
    setFavoriteIds((current) => { const next = new Set(current); next.delete(id); return next; });
  }

  return <Screen>
    <View style={styles.header}><View><Title>المفضلة</Title><Text style={styles.subtitle}>العقارات التي حفظتها للرجوع إليها</Text></View><View style={styles.headerIcon}><Icon name="heart" color="#FF9A9E" size={28} /></View></View>
    <View style={styles.list}>{favorites.map((property) => <PropertyCard key={property.id} property={{ ...property, favorite: true }} compact onPress={() => router.push(`/property/${property.id}` as never)} onToggleFavorite={() => removeFavorite(property.id)} />)}</View>
    {favorites.length === 0 ? <EmptyState icon="heart" title="المفضلة فارغة" description="احفظ العقارات المهمة من نتائج البحث حتى تجدها هنا بسرعة." action={<Pressable accessibilityRole="button" onPress={() => router.push('/(tabs)/search')} style={({ pressed }) => [styles.linkButton, pressed && styles.pressed]}><Text style={styles.link}>استكشف العقارات</Text></Pressable>} /> : null}
  </Screen>;
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  headerIcon: { width: 52, height: 52, borderRadius: 17, backgroundColor: 'rgba(234,93,98,0.09)', borderWidth: 1, borderColor: 'rgba(234,93,98,0.25)', alignItems: 'center', justifyContent: 'center' },
  subtitle: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'right', writingDirection: 'rtl' },
  list: { gap: 12 },
  linkButton: { padding: 8 },
  pressed: { opacity: 0.7 },
  link: { color: colors.gold300, fontSize: 14, fontWeight: '900', writingDirection: 'rtl' },
});
