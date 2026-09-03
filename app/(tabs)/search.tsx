import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PropertyCard } from '../../src/components/PropertyCard';
import { EmptyState, Field, Icon, IconButton, SectionTitle, Title } from '../../src/components/Ui';
import { Screen } from '../../src/components/Screen';
import { demoProperties } from '../../src/data/demoProperties';
import { matchesProperty } from '../../src/domain/searchFilters';
import { colors } from '../../src/theme/colors';

type Purpose = 'all' | 'sale' | 'rent';

function FilterChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed]}><Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text></Pressable>;
}

export default function SearchScreen() {
  const params = useLocalSearchParams<{ purpose?: string; type?: string }>();
  const requestedPurpose: Purpose = params.purpose === 'sale' || params.purpose === 'rent' ? params.purpose : 'all';
  const [query, setQuery] = useState('');
  const [purpose, setPurpose] = useState<Purpose>(requestedPurpose);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => { setPurpose(requestedPurpose); }, [requestedPurpose]);

  const results = useMemo(() => demoProperties.filter((property) => matchesProperty(property, {
    query: deferredQuery,
    purpose: purpose === 'all' ? undefined : purpose,
    type: params.type,
    verifiedOnly,
  })), [deferredQuery, params.type, purpose, verifiedOnly]);

  return <Screen>
    <View style={styles.header}><View><Title>البحث العقاري</Title><Text style={styles.subtitle}>نتائج واضحة من جميع محافظات العراق</Text></View><IconButton icon="map" label="عرض الخريطة" onPress={() => router.push('/(tabs)/geo')} /></View>
    <View style={styles.searchBox}><Icon name="search" color={colors.muted} size={21} /><Field value={query} onChangeText={setQuery} placeholder="المحافظة، الحي، نوع العقار..." style={styles.searchInput} /><IconButton icon="filter" label="فلاتر البحث" /></View>
    <View style={styles.chips}>
      <FilterChip label="الكل" selected={purpose === 'all'} onPress={() => setPurpose('all')} />
      <FilterChip label="للبيع" selected={purpose === 'sale'} onPress={() => setPurpose('sale')} />
      <FilterChip label="للإيجار" selected={purpose === 'rent'} onPress={() => setPurpose('rent')} />
      <FilterChip label="الموثق فقط" selected={verifiedOnly} onPress={() => setVerifiedOnly((value) => !value)} />
    </View>
    <SectionTitle action={<Text style={styles.count}>{results.length.toLocaleString('ar-IQ')} نتائج</Text>}>العقارات</SectionTitle>
    <View style={styles.results}>{results.map((property) => <PropertyCard key={property.id} property={property} compact onPress={() => router.push(`/property/${property.id}` as never)} />)}</View>
    {results.length === 0 ? <EmptyState title="لا توجد نتائج مطابقة" description="جرّب كلمة أقصر أو ألغِ أحد الفلاتر للوصول إلى نتائج أكثر." action={<Pressable accessibilityRole="button" onPress={() => { setQuery(''); setPurpose('all'); setVerifiedOnly(false); }}><Text style={styles.reset}>مسح الفلاتر</Text></Pressable>} /> : null}
  </Screen>;
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  subtitle: { color: colors.muted, fontSize: 12, lineHeight: 19, textAlign: 'right', writingDirection: 'rtl' },
  searchBox: { minHeight: 56, flexDirection: 'row-reverse', alignItems: 'center', gap: 8, backgroundColor: colors.navy800, borderWidth: 1, borderColor: colors.line, borderRadius: 18, paddingHorizontal: 10 },
  searchInput: { flex: 1, borderWidth: 0, backgroundColor: 'transparent', paddingHorizontal: 2 },
  chips: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 38, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 999, backgroundColor: colors.navy800, borderWidth: 1, borderColor: colors.line },
  chipSelected: { backgroundColor: colors.gold500, borderColor: colors.gold300 },
  chipText: { color: colors.muted, fontSize: 12, fontWeight: '800', writingDirection: 'rtl' },
  chipTextSelected: { color: colors.navy950 },
  count: { color: colors.gold300, fontSize: 12, fontWeight: '800', writingDirection: 'rtl' },
  results: { gap: 12 },
  reset: { color: colors.gold300, fontSize: 14, fontWeight: '900', padding: 8, writingDirection: 'rtl' },
  pressed: { opacity: 0.72 },
});
