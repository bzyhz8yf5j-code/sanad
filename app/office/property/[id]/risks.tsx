import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '../../../../src/components/Screen';
import { Badge, Body, Button, Caption, Card, EmptyState, Field, Icon, SectionTitle, Title } from '../../../../src/components/Ui';
import { listPropertyRisks, resolvePropertyRisk } from '../../../../src/services/risks';
import { colors } from '../../../../src/theme/colors';

interface RiskItem {
  id: string;
  code: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  resolved_at?: string | null;
  resolution_note?: string | null;
  created_at?: string;
}

export default function PropertyRisks() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [items, setItems] = useState<RiskItem[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setItems(await listPropertyRisks(id) as RiskItem[]);
      setMessage('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر تحميل المخاطر');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  async function resolve(riskId: string) {
    const note = notes[riskId]?.trim() ?? '';
    if (note.length < 5) {
      setMessage('اكتب ملاحظة واضحة تشرح الإجراء المتخذ قبل تسجيل الحل.');
      return;
    }
    try {
      setResolvingId(riskId);
      await resolvePropertyRisk(riskId, note);
      setNotes((current) => ({ ...current, [riskId]: '' }));
      await load();
      setMessage('تم تسجيل معالجة الخطر في سجل التدقيق.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر تسجيل معالجة الخطر');
    } finally {
      setResolvingId('');
    }
  }

  const unresolved = items.filter((item) => !item.resolved_at);
  const blocking = unresolved.filter((item) => item.severity === 'high' || item.severity === 'critical').length;

  return <Screen>
    <View style={styles.header}><View><Title>رادار المخاطر</Title><Caption>فحص العقار قبل النشر</Caption></View><View style={styles.shield}><Icon name="shield" color={blocking ? '#FF9A9E' : '#65DFAA'} size={29} /></View></View>
    <Card tone={blocking ? 'default' : 'accent'}>
      <View style={styles.summaryTop}><Badge tone={blocking ? 'warning' : 'success'}>{blocking ? `${blocking.toLocaleString('ar-IQ')} مخاطر مانعة` : 'لا توجد مخاطر مانعة'}</Badge><Caption>{unresolved.length.toLocaleString('ar-IQ')} غير محلولة</Caption></View>
      <Body>المخاطر العالية والحرجة تمنع نشر الإعلان حتى تُعالج. يُحفظ سبب الحل وهوية المنفذ في سجل التدقيق.</Body>
    </Card>

    {loading ? <Card><Body>جاري تحميل نتائج الفحص…</Body></Card> : null}
    {!loading && !items.length ? <EmptyState icon="shield" title="لا توجد إشارات خطر" description="لم يسجّل النظام إشارات خطر على هذا العقار حتى الآن." action={<Button compact label="العودة إلى مراجعة الإعلان" variant="secondary" onPress={() => router.back()} />} /> : null}

    {unresolved.length ? <SectionTitle>تحتاج معالجة</SectionTitle> : null}
    {unresolved.map((risk) => <RiskCard key={risk.id} risk={risk} note={notes[risk.id] ?? ''} busy={resolvingId === risk.id} onChangeNote={(value) => setNotes((current) => ({ ...current, [risk.id]: value }))} onResolve={() => resolve(risk.id)} />)}

    {items.some((item) => item.resolved_at) ? <SectionTitle>تمت معالجتها</SectionTitle> : null}
    {items.filter((item) => item.resolved_at).map((risk) => <Card key={risk.id}>
      <View style={styles.riskTop}><Badge tone="success">محلول</Badge><Text style={styles.riskCode}>{risk.code}</Text></View>
      <Body>{risk.message}</Body>
      {risk.resolution_note ? <Caption>ملاحظة الحل: {risk.resolution_note}</Caption> : null}
    </Card>)}

    {message ? <Card><Body style={styles.feedback}>{message}</Body></Card> : null}
    <Button label="العودة لمراجعة الإعلان" icon="arrow" variant="secondary" onPress={() => router.replace(`/office/property/${id}/edit` as never)} />
  </Screen>;
}

function RiskCard({ risk, note, busy, onChangeNote, onResolve }: { risk: RiskItem; note: string; busy: boolean; onChangeNote: (value: string) => void; onResolve: () => void }) {
  const critical = risk.severity === 'critical' || risk.severity === 'high';
  return <Card style={critical && styles.criticalCard}>
    <View style={styles.riskTop}><Badge tone={critical ? 'warning' : 'muted'}>{severityLabel(risk.severity)}</Badge><Text style={styles.riskCode}>{risk.code}</Text></View>
    <Body>{risk.message}</Body>
    <Field accessibilityLabel={`ملاحظة حل ${risk.code}`} placeholder="اشرح الإجراء أو المستند الذي عالج الخطر" multiline value={note} onChangeText={onChangeNote} />
    <Button label={busy ? 'جاري تسجيل الحل…' : 'تسجيل معالجة الخطر'} icon="check" variant={critical ? 'primary' : 'secondary'} disabled={busy} onPress={onResolve} />
  </Card>;
}

function severityLabel(severity: RiskItem['severity']) { return ({ low: 'منخفض', medium: 'متوسط', high: 'عالٍ', critical: 'حرج' })[severity]; }

const styles = StyleSheet.create({
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  shield: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.navy700, borderWidth: 1, borderColor: colors.line },
  summaryTop: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  criticalCard: { borderColor: 'rgba(234,93,98,0.35)' },
  riskTop: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  riskCode: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '900', textAlign: 'right', writingDirection: 'rtl' },
  feedback: { color: '#F0C469' },
});
