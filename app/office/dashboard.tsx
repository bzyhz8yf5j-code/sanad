import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { Badge, Body, Button, Caption, Card, EmptyState, Icon, SectionTitle, Title, type IconName } from '../../src/components/Ui';
import { supabase } from '../../src/lib/supabase';
import { listMyOffices } from '../../src/services/offices';
import { listOfficeProperties, type OfficePropertySummary } from '../../src/services/properties';
import { colors } from '../../src/theme/colors';

interface DashboardOffice {
  id: string;
  name: string;
  governorate: string;
  status: string;
}

export default function OfficeDashboard() {
  const [office, setOffice] = useState<DashboardOffice>();
  const [properties, setProperties] = useState<OfficePropertySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (!supabase) {
        setOffice({ id: 'demo-office', name: 'مكتب سند التجريبي', governorate: 'بغداد', status: 'approved' });
        setProperties([]);
        setMessage('');
        return;
      }
      const offices = await listMyOffices();
      const selected = offices.find((item) => item.status === 'approved') ?? offices[0];
      setOffice(selected);
      setProperties(selected?.status === 'approved' ? await listOfficeProperties(selected.id) : []);
      setMessage('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر تحميل بيانات المكتب');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  if (loading) return <Screen><Title>لوحة المكتب</Title><Card tone="elevated"><Body>جاري تحميل مساحة العمل…</Body></Card></Screen>;

  if (!office) return <Screen>
    <Title>لوحة المكتب</Title>
    <EmptyState icon="office" title="لا يوجد مكتب مرتبط بالحساب" description={message || 'قدّم طلب اعتماد مكتب عقاري للوصول إلى إدارة الإعلانات والفريق.'} action={<Button compact label="طلب اعتماد مكتب" onPress={() => router.push('/offices/apply')} />} />
  </Screen>;

  const published = properties.filter((item) => item.status === 'published').length;
  const drafts = properties.filter((item) => item.status === 'draft').length;
  const inReview = properties.filter((item) => item.status === 'pending_review').length;

  return <Screen>
    <View style={styles.header}><View style={styles.officeMark}><Icon name="office" color={colors.gold300} size={29} /></View><View style={styles.headerCopy}><Title>لوحة المكتب</Title><Caption>{office.name} · {office.governorate}</Caption></View></View>
    {!supabase ? <Card tone="accent"><View style={styles.banner}><Badge tone="warning">وضع معاينة</Badge><Caption style={styles.bannerCopy}>لن تُحفظ العمليات على الخادم حتى تُضبط بيئة Supabase.</Caption></View></Card> : null}
    {office.status !== 'approved' ? <Card tone="accent"><Badge tone="warning">الاعتماد: {office.status}</Badge><Body>إدارة الإعلانات والنشر تصبح متاحة بعد اعتماد المكتب.</Body></Card> : <>
      <View style={styles.stats}>
        <Stat value={properties.length} label="الإعلانات" />
        <Stat value={published} label="منشور" />
        <Stat value={drafts} label="مسودة" />
        <Stat value={inReview} label="للمراجعة" />
      </View>
      <Button label="إضافة عقار جديد" icon="add" onPress={() => router.push('/office/properties/new')} />
    </>}

    <SectionTitle>إدارة المكتب</SectionTitle>
    <View style={styles.grid}>
      <DashboardAction icon="building" label="الإعلانات" description="إنشاء وتحرير" onPress={() => router.push('/office/properties/new')} disabled={office.status !== 'approved'} />
      <DashboardAction icon="document" label="المعاملات" description="الحالة والتدقيق" onPress={() => router.push('/office/transactions')} />
      <DashboardAction icon="account" label="أعضاء المكتب" description="الأدوار والصلاحيات" onPress={() => router.push('/office/members')} />
      <DashboardAction icon="map" label="الوضع الميداني" description="قياس وتثبيت" onPress={() => router.push('/field')} />
    </View>

    <SectionTitle>أحدث الإعلانات</SectionTitle>
    {properties.slice(0, 5).map((item) => <Pressable key={item.id} accessibilityRole="button" onPress={() => router.push(`/office/property/${item.id}/edit` as never)} style={({ pressed }) => [styles.propertyRow, pressed && styles.pressed]}>
      <View style={styles.propertyIcon}><Icon name="building" color={colors.gold300} /></View>
      <View style={styles.propertyCopy}><Text numberOfLines={1} style={styles.propertyTitle}>{item.title}</Text><Caption>{item.governorate}{item.district ? ` · ${item.district}` : ''} · {item.area_sqm.toLocaleString('ar-IQ')} م²</Caption></View>
      <Badge tone={item.status === 'published' ? 'success' : item.status === 'pending_review' ? 'warning' : 'muted'}>{statusLabel(item.status)}</Badge>
    </Pressable>)}
    {!properties.length ? <Card><Body>{supabase ? 'لا توجد إعلانات في هذا المكتب بعد.' : 'ستظهر إعلانات المكتب الحقيقية هنا عند الاتصال.'}</Body><Button compact label="إنشاء أول مسودة" variant="secondary" onPress={() => router.push('/office/properties/new')} /></Card> : null}
    {message ? <Card><Caption style={styles.error}>{message}</Caption></Card> : null}
  </Screen>;
}

function Stat({ value, label }: { value: number; label: string }) {
  return <Card style={styles.stat}><Text style={styles.statValue}>{value.toLocaleString('ar-IQ')}</Text><Caption>{label}</Caption></Card>;
}

function DashboardAction({ icon, label, description, onPress, disabled = false }: { icon: IconName; label: string; description: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.action, disabled && styles.disabled, pressed && styles.pressed]}><View style={styles.actionIcon}><Icon name={icon} color={colors.gold300} size={25} /></View><Text style={styles.actionLabel}>{label}</Text><Caption style={styles.actionDescription}>{description}</Caption></Pressable>;
}

function statusLabel(status: OfficePropertySummary['status']) {
  return ({ draft: 'مسودة', pending_review: 'للمراجعة', published: 'منشور', archived: 'مؤرشف', rejected: 'مرفوض' })[status];
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  officeMark: { width: 58, height: 58, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(217,165,58,0.10)', borderWidth: 1, borderColor: 'rgba(217,165,58,0.24)' },
  headerCopy: { flex: 1, alignItems: 'flex-end' },
  banner: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  bannerCopy: { flex: 1 },
  stats: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 9 },
  stat: { flexGrow: 1, flexBasis: '21%', minWidth: 76, alignItems: 'center', padding: 12, gap: 0 },
  statValue: { color: colors.gold300, fontSize: 22, fontWeight: '900' },
  grid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10 },
  action: { flexGrow: 1, flexBasis: '45%', minWidth: 145, padding: 15, gap: 5, alignItems: 'flex-end', backgroundColor: colors.navy800, borderWidth: 1, borderColor: colors.line, borderRadius: 18 },
  actionIcon: { width: 47, height: 47, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.navy700, marginBottom: 3 },
  actionLabel: { color: colors.text, fontSize: 15, fontWeight: '900', writingDirection: 'rtl' },
  actionDescription: { textAlign: 'right' },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.72 },
  propertyRow: { minHeight: 76, flexDirection: 'row-reverse', alignItems: 'center', gap: 10, padding: 13, backgroundColor: colors.navy800, borderWidth: 1, borderColor: colors.line, borderRadius: 17 },
  propertyIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.navy700 },
  propertyCopy: { flex: 1, alignItems: 'flex-end', gap: 2 },
  propertyTitle: { color: colors.text, fontSize: 14, fontWeight: '900', textAlign: 'right', writingDirection: 'rtl' },
  error: { color: '#FF9A9E' },
});
