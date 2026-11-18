import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { Badge, Body, Button, Caption, Card, Field, SectionTitle, Title } from '../../src/components/Ui';
import { accountDeletionStatusLabel } from '../../src/domain/accountDeletion';
import { blockAccountDeletion, listAccountDeletionReviewQueue, reviewAccountDeletion, type AdminDeletionRequest } from '../../src/services/adminAccountDeletion';
import { colors } from '../../src/theme/colors';

export default function AdminAccountDeletionsScreen() {
  const [items, setItems] = useState<AdminDeletionRequest[]>([]);
  const [selected, setSelected] = useState<AdminDeletionRequest | null>(null);
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const next = await listAccountDeletionReviewQueue();
      setItems(next);
      setSelected((current) => current ? next.find((item) => item.id === current.id) ?? null : null);
      setMessage('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر تحميل طلبات حذف الحساب');
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  async function update(action: 'review' | 'block') {
    if (!selected || busy) return;
    if (action === 'block' && note.trim().length < 3) {
      setMessage('اكتب ملاحظة واضحة قبل تعليق الطلب.');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      if (action === 'block') await blockAccountDeletion(selected.id, note);
      else await reviewAccountDeletion(selected.id, note);
      setNote('');
      setMessage(action === 'block' ? 'تم تعليق الطلب مع الملاحظة.' : 'تم نقل الطلب إلى المراجعة.');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر تحديث الطلب');
    } finally {
      setBusy(false);
    }
  }

  return <Screen>
    <Title>طلبات حذف الحساب</Title>
    <Caption>المراجعة التشغيلية فقط. إكمال الحذف النهائي غير متاح هنا إلى أن تعتمد قواعد الاحتفاظ وإخفاء الهوية للسجلات المرتبطة.</Caption>

    <Card tone="accent">
      <Body>طلبات فعالة: {items.length}</Body>
      <Button label="تحديث القائمة" variant="secondary" onPress={() => void load()} />
    </Card>

    <SectionTitle>الطابور</SectionTitle>
    {items.length ? items.map((item) => <Card key={item.id}>
      <View style={styles.row}>
        <View style={styles.copy}>
          <Text style={styles.name}>{item.profile?.display_name || 'حساب بدون اسم معروض'}</Text>
          <Caption>{item.user_id.slice(0, 8)}… · {new Date(item.requested_at).toLocaleString('ar-IQ')}</Caption>
          {item.reason ? <Body>{item.reason}</Body> : null}
          {item.retention_note ? <Caption>{item.retention_note}</Caption> : null}
        </View>
        <Badge tone={item.status === 'blocked' ? 'warning' : 'gold'}>{accountDeletionStatusLabel(item.status)}</Badge>
      </View>
      <Button compact label="مراجعة" variant="ghost" onPress={() => { setSelected(item); setNote(item.retention_note ?? ''); }} />
    </Card>) : <Card><Body>ماكو طلبات حذف فعالة حاليًا.</Body></Card>}

    {selected ? <>
      <SectionTitle>إجراء على الطلب</SectionTitle>
      <Card>
        <Text style={styles.name}>{selected.profile?.display_name || selected.user_id}</Text>
        <Caption>الحالة الحالية: {accountDeletionStatusLabel(selected.status)}</Caption>
        <Field value={note} onChangeText={setNote} placeholder="ملاحظة المراجعة أو سبب الاحتفاظ" multiline />
        <Button label={busy ? 'جاري التحديث…' : 'بدء / استمرار المراجعة'} disabled={busy} onPress={() => void update('review')} />
        <Button label="تعليق الطلب مع ملاحظة" variant="danger" disabled={busy} onPress={() => void update('block')} />
      </Card>
    </> : null}

    {message ? <Card><Body>{message}</Body></Card> : null}
  </Screen>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 10 },
  copy: { flex: 1, alignItems: 'flex-end', gap: 4 },
  name: { color: colors.text, fontSize: 16, fontWeight: '900', textAlign: 'right', writingDirection: 'rtl' },
});
