import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../src/components/Screen';
import { Badge, Body, Button, Caption, Card, SectionTitle, Title } from '../src/components/Ui';
import { runDeviceDiagnostics, type DeviceDiagnosticItem, type DeviceDiagnostics } from '../src/services/deviceDiagnostics';
import { registerForPush } from '../src/services/notifications';
import { colors } from '../src/theme/colors';

const toneByStatus = {
  pass: 'success',
  warn: 'warning',
  fail: 'muted',
  info: 'gold',
} as const;

const labelByStatus = {
  pass: 'سليم',
  warn: 'تنبيه',
  fail: 'غير جاهز',
  info: 'معلومة',
} as const;

export default function DiagnosticsScreen() {
  const [result, setResult] = useState<DeviceDiagnostics | null>(null);
  const [message, setMessage] = useState('');
  const [running, setRunning] = useState(false);

  async function run() {
    setRunning(true);
    setMessage('');
    try {
      setResult(await runDeviceDiagnostics());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر تنفيذ فحص الجهاز');
    } finally {
      setRunning(false);
    }
  }

  useEffect(() => { void run(); }, []);

  return <Screen>
    <View style={styles.heading}>
      <Title>فحص الجهاز والاتصال</Title>
      <Caption>تشخيص سريع قبل تجربة سند على الآيفون أو قبل إرسال تقرير عن خلل.</Caption>
    </View>

    <Card tone="accent">
      <Body>هذا الفحص لا يغيّر بيانات العقارات. يفحص ربط EAS، اتصال Supabase، جاهزية الخرائط، أذونات الإشعارات وطوابير المزامنة المحلية.</Body>
      <Button label={running ? 'جاري الفحص…' : 'إعادة الفحص'} icon="shield" disabled={running} onPress={() => void run()} />
    </Card>

    <SectionTitle>النتائج</SectionTitle>
    {result?.items.map((item) => <DiagnosticRow key={item.id} item={item} />)}
    {!result && !message ? <Card><Body>جاري تجهيز النتائج…</Body></Card> : null}

    <SectionTitle>الإشعارات</SectionTitle>
    <Card>
      <Body>فعّل Push فقط عند التجربة على Development Build. سيطلب iOS الإذن عند الحاجة ويسجل Expo Push Token للحساب الحالي إذا كان مسجلاً.</Body>
      <Button label="فحص وتفعيل Push" variant="secondary" icon="bell" onPress={async () => {
        try {
          const push = await registerForPush();
          setMessage(push.enabled ? 'تم تسجيل Push Token بنجاح.' : `لم يتم تفعيل Push: ${push.reason ?? 'غير معروف'}`);
          await run();
        } catch (error) {
          setMessage(error instanceof Error ? error.message : 'تعذر تسجيل الإشعارات');
        }
      }} />
    </Card>

    {message ? <Card><Body>{message}</Body></Card> : null}
    {result ? <Caption style={styles.timestamp}>آخر فحص: {new Date(result.generatedAt).toLocaleString('ar-IQ')}</Caption> : null}
  </Screen>;
}

function DiagnosticRow({ item }: { item: DeviceDiagnosticItem }) {
  return <Card>
    <View style={styles.row}>
      <View style={styles.copy}>
        <Text style={styles.label}>{item.label}</Text>
        <Caption>{item.detail}</Caption>
      </View>
      <Badge tone={toneByStatus[item.status]}>{labelByStatus[item.status]}</Badge>
    </View>
  </Card>;
}

const styles = StyleSheet.create({
  heading: { gap: 3 },
  row: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 12 },
  copy: { flex: 1, alignItems: 'flex-end', gap: 3 },
  label: { color: colors.text, fontSize: 15, fontWeight: '900', textAlign: 'right', writingDirection: 'rtl' },
  timestamp: { textAlign: 'center', paddingBottom: 12 },
});
