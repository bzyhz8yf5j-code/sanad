import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { Badge, Body, Button, Caption, Card, Divider, Icon, SectionTitle, Title } from '../../src/components/Ui';
import { getCurrentAccount, signOut } from '../../src/services/auth';
import { listMyOffices } from '../../src/services/offices';
import { colors } from '../../src/theme/colors';

type Account = Awaited<ReturnType<typeof getCurrentAccount>>;
type Office = Awaited<ReturnType<typeof listMyOffices>>[number];

const roleLabels: Record<string, string> = {
  user: 'مستخدم',
  professional: 'مختص عقاري',
  office_owner: 'مالك مكتب',
  office_member: 'عضو مكتب',
  supervisor: 'مشرف',
  admin: 'مدير النظام',
};

const officeStatus: Record<string, { label: string; tone: 'success' | 'warning' | 'muted' }> = {
  approved: { label: 'مكتب معتمد', tone: 'success' },
  submitted: { label: 'قيد التقديم', tone: 'warning' },
  under_review: { label: 'قيد المراجعة', tone: 'warning' },
  rejected: { label: 'يحتاج معالجة', tone: 'muted' },
  suspended: { label: 'موقوف', tone: 'muted' },
};

export default function AccountScreen() {
  const [account, setAccount] = useState<Account | undefined>(undefined);
  const [offices, setOffices] = useState<Office[]>([]);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    try {
      const nextAccount = await getCurrentAccount();
      setAccount(nextAccount);
      setOffices(nextAccount ? await listMyOffices() : []);
      setMessage('');
    } catch (error) {
      setAccount(null);
      setOffices([]);
      setMessage(error instanceof Error ? error.message : 'تعذر تحميل بيانات الحساب');
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void load();
  }, [load]));

  if (account === undefined) {
    return <Screen>
      <View style={styles.heading}><Title>الحساب</Title><Caption>جاري تحميل بياناتك…</Caption></View>
      <Card tone="elevated" style={styles.loadingCard}><View style={styles.loadingAvatar} /><View style={styles.loadingLines}><View style={styles.loadingWide} /><View style={styles.loadingShort} /></View></Card>
    </Screen>;
  }

  if (!account) {
    return <Screen>
      <View style={styles.heading}><Title>حساب سند</Title><Caption>احفظ بحثك وتابع معاملاتك من مكان واحد</Caption></View>
      <Card tone="accent" style={styles.welcomeCard}>
        <View style={styles.accountMark}><Icon name="account" color={colors.gold300} size={38} /></View>
        <Text style={styles.welcomeTitle}>مرحباً بك في سند</Text>
        <Body style={styles.centerText}>سجّل الدخول للوصول إلى المفضلة والرسائل والمواعيد وخدمات المكاتب العقارية.</Body>
        <View style={styles.benefits}>
          <Feature icon="heart" label="عقاراتك المحفوظة" />
          <Feature icon="message" label="محادثاتك ومواعيدك" />
          <Feature icon="document" label="متابعة المعاملات" />
        </View>
      </Card>
      {message ? <Card><Caption style={styles.error}>{message}</Caption></Card> : null}
      <Button label="تسجيل الدخول" icon="account" onPress={() => router.push('/auth/login')} />
      <Button label="إنشاء حساب جديد" variant="secondary" onPress={() => router.push('/auth/register')} />
    </Screen>;
  }

  const displayName = account.profile.display_name || account.user.email || 'مستخدم سند';
  const role = account.profile.role || 'user';

  return <Screen>
    <View style={styles.heading}><Title>الحساب</Title><Caption>الإعدادات والخدمات المهنية</Caption></View>
    <Card tone="accent" style={styles.profileCard}>
      <View style={styles.profileTop}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{displayName.trim().slice(0, 1).toUpperCase()}</Text></View>
        <View style={styles.profileCopy}>
          <Text numberOfLines={1} style={styles.displayName}>{displayName}</Text>
          <Caption numberOfLines={1}>{account.user.email}</Caption>
        </View>
      </View>
      <Divider />
      <View style={styles.profileMeta}><Badge>{roleLabels[role] ?? role}</Badge>{account.profile.phone ? <Caption>{account.profile.phone}</Caption> : <Caption>يمكن إضافة رقم الهاتف لاحقاً</Caption>}</View>
    </Card>

    {offices.length ? <>
      <SectionTitle>مكاتبي</SectionTitle>
      {offices.map((office) => {
        const status = officeStatus[office.status] ?? { label: office.status, tone: 'muted' as const };
        return <Card key={office.id}>
          <View style={styles.officeTop}><View style={styles.officeIcon}><Icon name="office" color={colors.gold300} /></View><View style={styles.officeCopy}><Text style={styles.officeName}>{office.name}</Text><Caption>{office.governorate}</Caption></View><Badge tone={status.tone}>{status.label}</Badge></View>
          {office.rejection_reason ? <Body style={styles.notice}>{office.rejection_reason}</Body> : null}
          {office.status === 'approved' ? <Button compact label="فتح لوحة المكتب" variant="secondary" onPress={() => router.push('/office/dashboard')} /> : null}
        </Card>;
      })}
    </> : null}

    <SectionTitle>الخدمات المهنية</SectionTitle>
    <Card>
      <AccountAction icon="office" title="اعتماد مكتب عقاري" description="قدّم بيانات المكتب وتابع حالة المراجعة" onPress={() => router.push('/offices/apply')} />
      <Divider />
      <AccountAction icon="shield" title="اعتماد مهني" description="للمهندسين والمسّاحين والمختصين" onPress={() => router.push('/professionals/apply')} />
      {['admin', 'supervisor'].includes(role) ? <><Divider /><AccountAction icon="account" title="لوحة الإدارة" description="المراجعات وإدارة المصادر والخدمات" onPress={() => router.push('/admin')} /></> : null}
    </Card>
    <Button label="تسجيل الخروج" variant="danger" onPress={async () => { await signOut(); setAccount(null); setOffices([]); }} />
  </Screen>;
}

function Feature({ icon, label }: { icon: 'heart' | 'message' | 'document'; label: string }) {
  return <View style={styles.feature}><Icon name={icon} color={colors.gold300} size={18} /><Caption style={styles.featureText}>{label}</Caption></View>;
}

function AccountAction({ icon, title, description, onPress }: { icon: 'office' | 'shield' | 'account'; title: string; description: string; onPress: () => void }) {
  return <View style={styles.actionRow}><View style={styles.actionIcon}><Icon name={icon} color={colors.gold300} size={20} /></View><View style={styles.actionCopy}><Text style={styles.actionTitle}>{title}</Text><Caption>{description}</Caption></View><Button compact label="فتح" variant="ghost" onPress={onPress} /></View>;
}

const styles = StyleSheet.create({
  heading: { gap: 2 },
  loadingCard: { flexDirection: 'row-reverse', alignItems: 'center' },
  loadingAvatar: { width: 58, height: 58, borderRadius: 20, backgroundColor: colors.navy600 },
  loadingLines: { flex: 1, gap: 10 },
  loadingWide: { height: 13, width: '76%', borderRadius: 7, backgroundColor: colors.navy600, alignSelf: 'flex-end' },
  loadingShort: { height: 10, width: '48%', borderRadius: 6, backgroundColor: colors.navy600, alignSelf: 'flex-end' },
  welcomeCard: { alignItems: 'center', paddingVertical: 25 },
  accountMark: { width: 76, height: 76, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(217,165,58,0.10)', borderWidth: 1, borderColor: 'rgba(217,165,58,0.25)' },
  welcomeTitle: { color: colors.text, fontSize: 21, fontWeight: '900', textAlign: 'center', writingDirection: 'rtl' },
  centerText: { color: colors.muted, textAlign: 'center', maxWidth: 340 },
  benefits: { alignSelf: 'stretch', gap: 9, marginTop: 5 },
  feature: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8 },
  featureText: { color: '#D5DFEB' },
  error: { color: '#FF9A9E' },
  profileCard: { gap: 15 },
  profileTop: { flexDirection: 'row-reverse', alignItems: 'center', gap: 13 },
  avatar: { width: 58, height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.gold500 },
  avatarText: { color: colors.navy950, fontSize: 23, fontWeight: '900' },
  profileCopy: { flex: 1, alignItems: 'flex-end', gap: 2 },
  displayName: { color: colors.text, fontSize: 19, lineHeight: 27, fontWeight: '900', writingDirection: 'rtl' },
  profileMeta: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  officeTop: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  officeIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(217,165,58,0.10)' },
  officeCopy: { flex: 1, alignItems: 'flex-end' },
  officeName: { color: colors.text, fontSize: 16, fontWeight: '900', textAlign: 'right', writingDirection: 'rtl' },
  notice: { color: '#F0B866', padding: 10, borderRadius: 10, backgroundColor: 'rgba(228,147,53,0.10)' },
  actionRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  actionIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.navy700 },
  actionCopy: { flex: 1, alignItems: 'flex-end', gap: 2 },
  actionTitle: { color: colors.text, fontSize: 14, fontWeight: '900', textAlign: 'right', writingDirection: 'rtl' },
});
