import { useCallback, useState } from 'react';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { Body, Button, Caption, Card, SectionTitle, Title } from '../../src/components/Ui';
import { listPropertyReports, openExistingPropertyReport, type PropertyReportRecord } from '../../src/services/reports';

export default function PropertyReportsScreen() {
  const { propertyId } = useLocalSearchParams<{ propertyId: string }>();
  const [items, setItems] = useState<PropertyReportRecord[]>([]);
  const [message, setMessage] = useState('');
  const [opening, setOpening] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!propertyId) return;
    try {
      setItems(await listPropertyReports(propertyId));
      setMessage('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر تحميل سجل التقارير');
    }
  }, [propertyId]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  return <Screen>
    <Title>تقارير العقار</Title>
    <Caption>فتح تقرير سابق ينشئ رابطًا مؤقتًا جديدًا ولا يولد PDF جديدًا.</Caption>

    <Card tone="accent">
      <Body>التقارير المحفوظة: {items.length}</Body>
      <Button label="تحديث السجل" variant="secondary" onPress={() => void load()} />
    </Card>

    <SectionTitle>السجل</SectionTitle>
    {items.length ? items.map((item) => <Card key={item.id}>
      <Body>{new Date(item.generated_at).toLocaleString('ar-IQ')}</Body>
      <Caption>SHA-256: {item.sha256 ? item.sha256.slice(0, 16) + '…' : 'غير متوفر'}</Caption>
      <Caption>الصفحات: {String(item.metadata?.page_count ?? '—')} · المخاطر المفتوحة: {String(item.metadata?.open_risk_count ?? '—')}</Caption>
      <Button
        compact
        label={opening === item.id ? 'جاري الفتح…' : 'فتح التقرير'}
        disabled={Boolean(opening)}
        onPress={async () => {
          setOpening(item.id); setMessage('');
          try { await openExistingPropertyReport(item.id); }
          catch (error) { setMessage(error instanceof Error ? error.message : 'تعذر فتح التقرير'); }
          finally { setOpening(null); }
        }}
      />
    </Card>) : <Card><Body>ماكو تقارير محفوظة لهذا العقار بعد.</Body></Card>}

    {message ? <Card><Body>{message}</Body></Card> : null}
  </Screen>;
}
