import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { Badge, Body, Button, Card, Icon, SectionTitle, Title } from '../../src/components/Ui';
import { colors } from '../../src/theme/colors';

export default function AddPropertyScreen() {
  return <Screen>
    <View style={styles.header}><View><Title>إضافة عقار</Title><Text style={styles.subtitle}>اختر الطريقة المناسبة لنشر عقارك</Text></View><View style={styles.headerIcon}><Icon name="add" color={colors.gold300} size={30} /></View></View>
    <Card tone="accent" style={styles.primaryCard}>
      <View style={styles.cardHead}><View style={styles.cardIcon}><Icon name="office" color={colors.gold300} size={28} /></View><Badge tone="success">المسار الموثوق</Badge></View>
      <Text style={styles.cardTitle}>النشر عن طريق مكتب معتمد</Text>
      <Body>اختر مكتباً موثقاً ليتولى مراجعة البيانات والصور قبل نشر الإعلان.</Body>
      <Button label="اختيار مكتب" icon="office" onPress={() => router.push('/(tabs)/offices')} />
    </Card>
    <Card tone="elevated">
      <View style={styles.cardHead}><View style={styles.cardIcon}><Icon name="building" color="#79B7FF" size={27} /></View><Badge>للمكاتب</Badge></View>
      <Text style={styles.cardTitle}>إنشاء إعلان من لوحة المكتب</Text>
      <Body>للمكاتب المعتمدة: احفظ المسودة، أضف الوسائط، اربط القطعة وافحص الجاهزية قبل النشر.</Body>
      <Button label="فتح مسودة جديدة" variant="secondary" icon="add" onPress={() => router.push('/office/properties/new')} />
    </Card>
    <SectionTitle>قبل النشر</SectionTitle>
    <View style={styles.steps}>
      {[['1', 'بيانات العقار', 'العنوان، النوع، المساحة والسعر'], ['2', 'الصور والوثائق', 'صور واضحة ومستندات دون بيانات حساسة ظاهرة'], ['3', 'الموقع والمراجعة', 'تحديد الموقع ومراجعة المكتب قبل الظهور']].map(([number, title, description]) => <View key={number} style={styles.step}><View style={styles.stepNumber}><Text style={styles.stepNumberText}>{number}</Text></View><View style={styles.stepText}><Text style={styles.stepTitle}>{title}</Text><Body style={styles.stepBody}>{description}</Body></View></View>)}
    </View>
    <Card><Text style={styles.cardTitle}>لديك رقم قطعة أو مرتسم؟</Text><Body>ابدأ من مركز سند الجغرافي لربط العقار بملف القطعة قبل إنشاء الإعلان.</Body><Button label="فتح المركز الجغرافي" variant="ghost" icon="map" onPress={() => router.push('/(tabs)/geo')} /></Card>
  </Screen>;
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  headerIcon: { width: 52, height: 52, borderRadius: 17, backgroundColor: 'rgba(217,165,58,0.10)', borderWidth: 1, borderColor: colors.lineSoft, alignItems: 'center', justifyContent: 'center' },
  subtitle: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'right', writingDirection: 'rtl' },
  primaryCard: { minHeight: 220 },
  cardHead: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardIcon: { width: 51, height: 51, borderRadius: 17, backgroundColor: colors.navy800, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { color: colors.text, fontSize: 19, lineHeight: 27, fontWeight: '900', textAlign: 'right', writingDirection: 'rtl' },
  steps: { gap: 10 },
  step: { minHeight: 76, flexDirection: 'row-reverse', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, backgroundColor: colors.navy800, borderWidth: 1, borderColor: colors.line },
  stepNumber: { width: 40, height: 40, flexShrink: 0, borderRadius: 13, backgroundColor: colors.gold500, alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { color: colors.navy950, fontSize: 17, fontWeight: '900' },
  stepText: { flex: 1, alignItems: 'flex-end' },
  stepTitle: { color: colors.text, fontSize: 15, fontWeight: '900', textAlign: 'right', writingDirection: 'rtl' },
  stepBody: { color: colors.muted, fontSize: 12, lineHeight: 19 },
});
