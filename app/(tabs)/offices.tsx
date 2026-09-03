import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { Badge, Body, Button, Caption, Card, Field, Icon, SectionTitle, Title } from '../../src/components/Ui';
import { colors } from '../../src/theme/colors';

const offices = [
  { id: 'rafidain', name: 'مكتب الرافدين العقاري', governorate: 'بغداد', specialty: 'بيع وتأجير العقارات', rating: '4.9', listings: 84 },
  { id: 'anbar', name: 'مكتب الأنبار المعتمد', governorate: 'الأنبار', specialty: 'الدور والأراضي', rating: '4.8', listings: 61 },
  { id: 'basra', name: 'دار البصرة للعقار', governorate: 'البصرة', specialty: 'التجاري والسكني', rating: '4.7', listings: 48 },
] as const;

export default function OfficesScreen() {
  return <Screen>
    <View style={styles.header}><View><Title>المكاتب العقارية</Title><Text style={styles.subtitle}>مكاتب موثقة وخدمات واضحة</Text></View><View style={styles.headerIcon}><Icon name="office" color={colors.gold300} size={27} /></View></View>
    <View style={styles.search}><Icon name="search" color={colors.muted} size={20} /><Field placeholder="ابحث باسم المكتب أو المحافظة" style={styles.searchField} /></View>
    <View style={styles.summary}>
      <View style={styles.summaryItem}><Text style={styles.summaryValue}>+1,200</Text><Caption>مكتب</Caption></View>
      <View style={styles.summaryItem}><Text style={styles.summaryValue}>18</Text><Caption>محافظة</Caption></View>
      <View style={styles.summaryItem}><Text style={styles.summaryValue}>موثّق</Text><Caption>نظام الاعتماد</Caption></View>
    </View>
    <SectionTitle action={<Text style={styles.count}>الأعلى تقييماً</Text>}>مكاتب مقترحة</SectionTitle>
    <View style={styles.list}>{offices.map((office) => <Pressable key={office.id} accessibilityRole="button" accessibilityLabel={`فتح ${office.name}`} style={({ pressed }) => [styles.officePressable, pressed && styles.pressed]}>
      <Card tone="elevated">
        <View style={styles.officeHead}><View style={styles.officeLogo}><Icon name="office" color={colors.gold300} size={25} /></View><View style={styles.officeText}><Text style={styles.officeName}>{office.name}</Text><View style={styles.location}><Icon name="location" color={colors.muted} size={14} /><Caption>{office.governorate} · {office.specialty}</Caption></View></View><Badge tone="success">موثق</Badge></View>
        <View style={styles.officeMeta}><Caption>★ {office.rating}</Caption><View style={styles.dot} /><Caption>{office.listings.toLocaleString('ar-IQ')} عقاراً</Caption><View style={styles.dot} /><Caption>استجابة سريعة</Caption></View>
      </Card>
    </Pressable>)}</View>
    <SectionTitle>انضم إلى سند</SectionTitle>
    <Card tone="accent"><View style={styles.joinHead}><View style={styles.joinIcon}><Icon name="shield" color={colors.gold300} /></View><View style={styles.joinText}><Text style={styles.officeName}>اعتماد مكتب جديد</Text><Body>قدّم بيانات المكتب، وبعد المراجعة يمكنك النشر وإدارة الفريق والمعاملات.</Body></View></View><Button label="طلب اعتماد مكتب" icon="office" onPress={() => router.push('/offices/apply')} /></Card>
    <Card><Text style={styles.officeName}>هل أنت مهندس أو مثمّن؟</Text><Body>أنشئ ملفاً مهنياً موثقاً واربط خدماتك بالمحافظات التي تعمل بها.</Body><Button label="طلب اعتماد مهني" variant="secondary" onPress={() => router.push('/professionals/apply')} /></Card>
  </Screen>;
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  headerIcon: { width: 52, height: 52, borderRadius: 17, backgroundColor: 'rgba(217,165,58,0.10)', borderWidth: 1, borderColor: colors.lineSoft, alignItems: 'center', justifyContent: 'center' },
  subtitle: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'right', writingDirection: 'rtl' },
  search: { minHeight: 54, flexDirection: 'row-reverse', alignItems: 'center', gap: 8, backgroundColor: colors.navy800, borderWidth: 1, borderColor: colors.line, borderRadius: 17, paddingHorizontal: 12 },
  searchField: { flex: 1, borderWidth: 0, backgroundColor: 'transparent', paddingHorizontal: 2 },
  summary: { flexDirection: 'row-reverse', gap: 8 },
  summaryItem: { flex: 1, minWidth: 0, alignItems: 'center', padding: 11, borderRadius: 14, backgroundColor: colors.navy800, borderWidth: 1, borderColor: colors.line },
  summaryValue: { color: colors.gold300, fontSize: 17, lineHeight: 24, fontWeight: '900', textAlign: 'center' },
  count: { color: colors.gold300, fontSize: 12, fontWeight: '800', writingDirection: 'rtl' },
  list: { gap: 10 },
  officePressable: { borderRadius: 20 },
  officeHead: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  officeLogo: { width: 50, height: 50, flexShrink: 0, borderRadius: 16, backgroundColor: 'rgba(217,165,58,0.10)', borderWidth: 1, borderColor: colors.lineSoft, alignItems: 'center', justifyContent: 'center' },
  officeText: { flex: 1, alignItems: 'flex-end', gap: 2 },
  officeName: { color: colors.text, fontSize: 17, lineHeight: 24, fontWeight: '900', textAlign: 'right', writingDirection: 'rtl' },
  location: { maxWidth: '100%', flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
  officeMeta: { flexDirection: 'row-reverse', alignItems: 'center', flexWrap: 'wrap', gap: 7 },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.line },
  joinHead: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 11 },
  joinIcon: { width: 48, height: 48, borderRadius: 15, backgroundColor: 'rgba(217,165,58,0.10)', alignItems: 'center', justifyContent: 'center' },
  joinText: { flex: 1, gap: 5 },
  pressed: { opacity: 0.74 },
});
