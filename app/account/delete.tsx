import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { Badge, Body, Button, Caption, Card, Field, SectionTitle, Title } from '../../src/components/Ui';
import { accountDeletionStatusLabel, canCancelAccountDeletion, isAccountDeletionActive } from '../../src/domain/accountDeletion';
import { cancelAccountDeletion, getMyAccountDeletionRequest, requestAccountDeletion, type AccountDeletionRequest } from '../../src/services/accountDeletion';
import { refreshPushRegistrationIfAuthorized } from '../../src/services/notifications';
import { colors } from '../../src/theme/colors';

export default function DeleteAccountScreen() {
  const [request, setRequest] = useState<AccountDeletionRequest | null>(null);
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    try { setRequest(await getMyAccountDeletionRequest()); setMessage(''); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'تعذر تحميل حالة طلب الحذف'); }
  }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const active = isAccountDeletionActive(request?.status);

  return <Screen>
    <View style={styles.header}>
      <Title>حذف حساب سند</Title>
      <Caption>ابدأ طلب حذف الحساب من داخل التطبيق وتابع حالته من نفس المكان.</Caption>
    </View>

    {request && active ? <>
      <Card tone="accent">
        <View style={styles.statusRow}>
          <View style={styles.statusCopy}>
            <Text style={styles.statusTitle}>حالة الطلب</Text>
            <Caption>تاريخ الطلب: {new Date(request.requested_at).toLocaleString('ar-IQ')}</Caption>
          </View>
          <Badge tone={request.status === 'blocked' ? 'warning' : 'gold'}>{accountDeletionStatusLabel(request.status)}</Badge>
        </View>
        {request.retention_note ? <Body>{request.retention_note}</Body> : null}
      </Card>
      <Card>
        <Body>أثناء المعالجة قد تبقى بعض السجلات المرتبطة بمعاملة أو التزام حفظ. تُراجع هذه السجلات بشكل منفصل بدل حذفها عشوائيًا.</Body>
        <Caption>إذا كان الطلب متوقفًا، تظهر ملاحظة الاحتفاظ أو سبب التوقف هنا عند إضافتها من فريق المراجعة.</Caption>
      </Card>
      {canCancelAccountDeletion(request.status) ? <Button
        label={busy ? 'جاري الإلغاء…' : 'إلغاء طلب الحذف'}
        variant="secondary"
        disabled={busy}
        onPress={async () => {
          setBusy(true); setMessage('');
          try {
            const next = await cancelAccountDeletion();
            setRequest(next); setConfirmed(false);
            void refreshPushRegistrationIfAuthorized().catch(() => {});
            setMessage('تم إلغاء طلب حذف الحساب.');
          } catch (error) {
            setMessage(error instanceof Error ? error.message : 'تعذر إلغاء الطلب');
          } finally { setBusy(false); }
        }}
      /> : null}
    </> : <>
      <Card tone="accent">
        <Body>هذا الطلب يبدأ إزالة حسابك وبياناتك الشخصية من سند. السجلات التي يلزم الاحتفاظ بها بسبب معاملة قائمة أو متطلبات قانونية/تدقيقية تُراجع بشكل منفصل.</Body>
      </Card>
      <SectionTitle>قبل الإرسال</SectionTitle>
      <Card>
        <Body>بعد إرسال الطلب تقدر ترجع لهذه الشاشة لمتابعته أو إلغائه ما دام الطلب لم يكتمل.</Body>
        <Caption>سبب الطلب اختياري ويساعدنا في تحسين الخدمة.</Caption>
        <Field value={reason} onChangeText={setReason} placeholder="سبب الطلب (اختياري)" multiline />
      </Card>
      <Card>
        <Button label={confirmed ? 'تم التأكيد' : 'أفهم أن هذا طلب حذف للحساب'} variant={confirmed ? 'secondary' : 'ghost'} onPress={() => setConfirmed((value) => !value)} />
        <Button
          label={busy ? 'جاري إرسال الطلب…' : 'إرسال طلب حذف الحساب'}
          variant="danger"
          disabled={busy || !confirmed}
          onPress={async () => {
            setBusy(true); setMessage('');
            try {
              const next = await requestAccountDeletion(reason);
              setRequest(next); setConfirmed(false);
              setMessage('تم استلام طلب حذف الحساب.');
            } catch (error) {
              setMessage(error instanceof Error ? error.message : 'تعذر إرسال طلب الحذف');
            } finally { setBusy(false); }
          }}
        />
      </Card>
    </>}

    <SectionTitle>المعلومات والسياسات</SectionTitle>
    <Button label="سياسة الخصوصية داخل التطبيق" variant="ghost" onPress={() => router.push('/legal/privacy' as any)} />
    <Button label="شروط الاستخدام داخل التطبيق" variant="ghost" onPress={() => router.push('/legal/terms' as any)} />
    {message ? <Card><Body>{message}</Body></Card> : null}
  </Screen>;
}

const styles = StyleSheet.create({
  header: { gap: 4 },
  statusRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  statusCopy: { flex: 1, alignItems: 'flex-end', gap: 3 },
  statusTitle: { color: colors.text, fontSize: 17, fontWeight: '900', textAlign: 'right', writingDirection: 'rtl' },
});
