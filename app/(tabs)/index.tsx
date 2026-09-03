import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PropertyCard } from '../../src/components/PropertyCard';
import { Badge, Body, Button, Caption, Card, Icon, IconButton, QuickAction, SectionTitle } from '../../src/components/Ui';
import { Screen } from '../../src/components/Screen';
import { demoProperties } from '../../src/data/demoProperties';
import { colors } from '../../src/theme/colors';

const quickActions = [
  { label: 'للبيع', icon: 'sale', accent: '#65DFAA', params: { purpose: 'sale' } },
  { label: 'للإيجار', icon: 'key', accent: '#79B7FF', params: { purpose: 'rent' } },
  { label: 'أراضٍ', icon: 'land', accent: '#F0B866', params: { type: 'أرض' } },
  { label: 'المكاتب', icon: 'office', accent: '#C5A8FF', route: '/(tabs)/offices' },
  { label: 'المشاريع', icon: 'projects', accent: '#F0C469', params: { type: 'مشروع' } },
  { label: 'المفضلة', icon: 'heart', accent: '#FF9A9E', route: '/(tabs)/favorites' },
  { label: 'خريطة العراق', icon: 'map', accent: '#5CE2D2', route: '/(tabs)/geo' },
  { label: 'المزيد', icon: 'more', accent: '#B9C5D3', route: '/(tabs)/account' },
] as const;

function openAction(action: (typeof quickActions)[number]) {
  if ('route' in action) router.push(action.route as never);
  else router.push({ pathname: '/(tabs)/search', params: action.params } as never);
}

export default function Home() {
  return <Screen>
    <View style={styles.topbar}>
      <View style={styles.brand}><Text style={styles.wordmark}>سند</Text><Caption style={styles.brandCaption}>تطبيق عقاري لكل العراق</Caption></View>
      <View style={styles.headerActions}><View style={styles.location}><Icon name="location" color={colors.gold300} size={15} /><Text style={styles.locationText}>كل العراق</Text></View><IconButton icon="bell" label="التنبيهات" /></View>
    </View>

    <Pressable accessibilityRole="search" accessibilityLabel="فتح البحث العقاري" onPress={() => router.push('/(tabs)/search')} style={({ pressed }) => [styles.search, pressed && styles.pressed]}>
      <Icon name="search" color={colors.muted} size={21} /><Text style={styles.searchText}>ابحث عن عقار، منطقة، مكتب...</Text><View style={styles.filter}><Icon name="filter" color={colors.gold300} size={17} /></View>
    </Pressable>

    <Card tone="accent" style={styles.hero}>
      <View style={styles.heroGlow} /><View style={styles.heroMark}><Icon name="building" color="rgba(240,196,105,0.55)" size={92} /></View>
      <Badge>تغطية جميع المحافظات</Badge>
      <Text style={styles.heroTitle}>اكتشف. امتلك.</Text>
      <Body style={styles.heroText}>العقار المناسب والخدمة الموثوقة، بخطوات واضحة من البحث حتى إتمام المعاملة.</Body>
      <View style={styles.heroButtons}><Button label="استكشف العراق" icon="map" compact onPress={() => router.push('/(tabs)/geo')} /><Button label="مساعد سند" icon="sparkle" variant="secondary" compact onPress={() => router.push('/(tabs)/search')} /></View>
    </Card>

    <View style={styles.quickGrid}>{quickActions.map((action) => <QuickAction key={action.label} icon={action.icon} label={action.label} accent={action.accent} onPress={() => openAction(action)} />)}</View>

    <SectionTitle action={<Pressable accessibilityRole="button" onPress={() => router.push('/(tabs)/search')}><Text style={styles.link}>عرض الكل</Text></Pressable>}>عقارات مميزة</SectionTitle>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.properties}>{demoProperties.slice(0, 4).map((property) => <PropertyCard key={property.id} property={property} onPress={() => router.push(`/property/${property.id}` as never)} />)}</ScrollView>

    <SectionTitle>خدمات سند</SectionTitle>
    <View style={styles.services}>
      <Card tone="elevated" style={styles.serviceCard}><View style={styles.serviceHead}><View style={styles.serviceIcon}><Icon name="document" color={colors.gold300} /></View><Badge tone="success">خدمة منظمة</Badge></View><Text style={styles.serviceTitle}>متابعة المعاملة</Text><Body>اعرف المرحلة الحالية والمستندات المطلوبة باستخدام رمز المتابعة.</Body><Button label="متابعة بالرمز" variant="secondary" compact onPress={() => router.push('/transactions/track')} /></Card>
      <Card tone="elevated" style={styles.serviceCard}><View style={styles.serviceHead}><View style={styles.serviceIcon}><Icon name="office" color={colors.gold300} /></View><Badge>موثق</Badge></View><Text style={styles.serviceTitle}>المكاتب العقارية</Text><Body>تصفّح المكاتب المعتمدة وتواصل معها ضمن مسارات واضحة.</Body><Button label="فتح المكاتب" variant="secondary" compact onPress={() => router.push('/(tabs)/offices')} /></Card>
    </View>
  </Screen>;
}

const styles = StyleSheet.create({
  topbar: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  brand: { alignItems: 'flex-end' },
  wordmark: { color: colors.text, fontSize: 36, lineHeight: 40, fontWeight: '900', letterSpacing: -2, writingDirection: 'rtl' },
  brandCaption: { color: colors.gold300, fontWeight: '700' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  location: { height: 42, paddingHorizontal: 12, borderRadius: 14, flexDirection: 'row-reverse', alignItems: 'center', gap: 5, backgroundColor: colors.navy700, borderWidth: 1, borderColor: colors.line },
  locationText: { color: colors.text, fontSize: 12, fontWeight: '800', writingDirection: 'rtl' },
  search: { minHeight: 54, backgroundColor: colors.navy800, borderColor: colors.line, borderWidth: 1, borderRadius: 17, paddingHorizontal: 14, flexDirection: 'row-reverse', alignItems: 'center', gap: 9 },
  searchText: { flex: 1, color: colors.muted, fontSize: 14, textAlign: 'right', writingDirection: 'rtl' },
  filter: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(217,165,58,0.09)', alignItems: 'center', justifyContent: 'center' },
  hero: { minHeight: 232, overflow: 'hidden', justifyContent: 'flex-end', padding: 20 },
  heroGlow: { position: 'absolute', width: 260, height: 260, borderRadius: 150, top: -150, left: -70, backgroundColor: 'rgba(79,143,232,0.19)' },
  heroMark: { position: 'absolute', left: 12, bottom: 48 },
  heroTitle: { color: colors.gold300, fontSize: 31, lineHeight: 40, fontWeight: '900', textAlign: 'right', writingDirection: 'rtl', marginTop: 8 },
  heroText: { maxWidth: '76%', color: '#DCE4EF' },
  heroButtons: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginTop: 5 },
  quickGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'space-between', columnGap: 5, rowGap: 8 },
  properties: { flexDirection: 'row-reverse', gap: 12, paddingVertical: 2, paddingHorizontal: 1 },
  services: { gap: 12 },
  serviceCard: { minHeight: 180 },
  serviceHead: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  serviceIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(217,165,58,0.10)', alignItems: 'center', justifyContent: 'center' },
  serviceTitle: { color: colors.text, fontSize: 18, fontWeight: '900', textAlign: 'right', writingDirection: 'rtl' },
  link: { color: colors.gold300, fontSize: 12, fontWeight: '800', writingDirection: 'rtl' },
  pressed: { opacity: 0.74 },
});
