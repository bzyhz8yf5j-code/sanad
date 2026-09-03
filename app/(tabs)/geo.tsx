import { useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { Badge, Body, Button, Caption, Card, Field, Icon, SectionTitle, Title } from '../../src/components/Ui';
import { SanadMap } from '../../src/components/SanadMap';
import { colors } from '../../src/theme/colors';

export default function GeoScreen() {
  const [governorate, setGovernorate] = useState('');
  const [district, setDistrict] = useState('');
  const [parcel, setParcel] = useState('');
  const [searched, setSearched] = useState(false);

  return <Screen>
    <View style={styles.header}><View><Title>مركز سند الجغرافي</Title><Text style={styles.subtitle}>ابحث عن القطعة وافتح ملفها المكاني</Text></View><View style={styles.headerIcon}><Icon name="map" color={colors.gold300} size={27} /></View></View>
    <Card tone="accent">
      <View style={styles.cardHead}><Text style={styles.cardTitle}>البحث عن قطعة</Text><Badge>بحث إداري</Badge></View>
      <Field value={governorate} onChangeText={setGovernorate} placeholder="المحافظة" />
      <Field value={district} onChangeText={setDistrict} placeholder="القضاء / الناحية / المقاطعة" />
      <Field value={parcel} onChangeText={setParcel} placeholder="رقم القطعة" keyboardType="numbers-and-punctuation" />
      <Button label="عرض القطعة على الخريطة" icon="search" onPress={() => setSearched(true)} disabled={!governorate.trim() && !parcel.trim()} />
    </Card>

    <SectionTitle>خريطة العراق</SectionTitle>
    <View style={styles.mapWrap}><SanadMap /><View style={styles.mapBadge}><Badge tone={searched ? 'success' : 'muted'}>{searched ? 'تم تطبيق البحث' : 'وضع الاستكشاف'}</Badge></View></View>
    <Caption style={styles.disclaimer}>الخريطة الحالية للمعاينة التقنية. البيانات العقارية الرسمية لا تُعتمد إلا بعد ربط مصدر مرخّص ومراجع.</Caption>

    {searched ? <Card tone="elevated">
      <View style={styles.resultHead}><View style={styles.resultIcon}><Icon name="land" color="#5CE2D2" size={25} /></View><View style={styles.resultText}><Text style={styles.cardTitle}>نتيجة البحث الأولية</Text><Caption>{[governorate, district, parcel].filter(Boolean).join(' · ')}</Caption></View><Badge tone="warning">بانتظار المصدر</Badge></View>
      <View style={styles.stats}><View style={styles.stat}><Text style={styles.statValue}>—</Text><Caption>المساحة</Caption></View><View style={styles.stat}><Text style={styles.statValue}>—</Text><Caption>الاستعمال</Caption></View></View>
      <Button label="فتح ملف القطعة" variant="secondary" icon="document" onPress={() => router.push('/parcel/demo')} />
    </Card> : null}

    <SectionTitle>أدوات المركز</SectionTitle>
    <View style={styles.tools}>
      <Card style={styles.tool}><View style={styles.toolIcon}><Icon name="document" color={colors.gold300} /></View><Text style={styles.toolTitle}>المرتسمات</Text><Body style={styles.toolBody}>DWG · DXF · PDF · KML · GeoJSON</Body><Button label="إدارة الملفات" variant="ghost" compact onPress={() => router.push('/parcel/demo')} /></Card>
      <Card style={styles.tool}><View style={styles.toolIcon}><Icon name="location" color="#5CE2D2" /></View><Text style={styles.toolTitle}>الوضع الميداني</Text><Body style={styles.toolBody}>GPS وصور وملاحظات مع مزامنة لاحقة.</Body><Button label="فتح الميدان" variant="ghost" compact onPress={() => router.push('/field')} /></Card>
    </View>
    <Button label="مركز المزامنة دون إنترنت" variant="secondary" onPress={() => router.push('/offline')} />
  </Screen>;
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  headerIcon: { width: 52, height: 52, borderRadius: 17, backgroundColor: 'rgba(217,165,58,0.10)', borderWidth: 1, borderColor: colors.lineSoft, alignItems: 'center', justifyContent: 'center' },
  subtitle: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'right', writingDirection: 'rtl' },
  cardHead: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardTitle: { color: colors.text, fontSize: 18, lineHeight: 26, fontWeight: '900', textAlign: 'right', writingDirection: 'rtl' },
  mapWrap: { position: 'relative', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: colors.lineSoft },
  mapBadge: { position: 'absolute', top: 12, right: 12 },
  disclaimer: { textAlign: 'center', paddingHorizontal: 12 },
  resultHead: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  resultIcon: { width: 46, height: 46, borderRadius: 15, backgroundColor: 'rgba(92,226,210,0.09)', alignItems: 'center', justifyContent: 'center' },
  resultText: { flex: 1, alignItems: 'flex-end' },
  stats: { flexDirection: 'row-reverse', gap: 10 },
  stat: { flex: 1, padding: 12, borderRadius: 14, backgroundColor: colors.navy800, borderWidth: 1, borderColor: colors.line, alignItems: 'flex-end' },
  statValue: { color: colors.text, fontSize: 21, fontWeight: '900' },
  tools: { flexDirection: 'row-reverse', gap: 10, alignItems: 'stretch' },
  tool: { flex: 1, minWidth: 0 },
  toolIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.navy700, alignItems: 'center', justifyContent: 'center' },
  toolTitle: { color: colors.text, fontSize: 16, fontWeight: '900', textAlign: 'right', writingDirection: 'rtl' },
  toolBody: { color: colors.muted, fontSize: 12, lineHeight: 19, flexGrow: 1 },
});
