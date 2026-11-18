import { useEffect, useState } from 'react';
import { Screen } from '../src/components/Screen';
import { Body, Button, Caption, Card, Title } from '../src/components/Ui';
import { pendingFieldObservationCount, pendingFieldSessionCount } from '../src/services/fieldMode';
import { loadOfflineQueue, retryTransientOfflineMutations } from '../src/services/offlineSync';
import { loadLastSyncSummary, syncPendingWork, type SyncSummary } from '../src/services/syncCoordinator';

export default function OfflineCenter() {
  const [count, setCount] = useState(0);
  const [failed, setFailed] = useState(0);
  const [conflicts, setConflicts] = useState(0);
  const [fieldPending, setFieldPending] = useState(0);
  const [lastSync, setLastSync] = useState<SyncSummary | null>(null);
  const [message, setMessage] = useState('');

  async function load() {
    const [queue, fieldObservations, fieldSessions, last] = await Promise.all([
      loadOfflineQueue(),
      pendingFieldObservationCount(),
      pendingFieldSessionCount(),
      loadLastSyncSummary(),
    ]);
    setCount(queue.length);
    setFailed(queue.filter((item) => item.status === 'failed' && item.failureKind === 'transient').length);
    setConflicts(queue.filter((item) => item.failureKind === 'conflict').length);
    setFieldPending(fieldObservations + fieldSessions);
    setLastSync(last);
  }

  useEffect(() => { void load(); }, []);

  return <Screen>
    <Title>مزامنة سند الخفيفة</Title>

    <Card>
      <Body>عقارات في الطابور: {count} · ميدان: {fieldPending}</Body>
      <Body>أخطاء مؤقتة: {failed} · تعارضات محمية: {conflicts}</Body>
      <Body>سند يحاول المزامنة تلقائيًا عند فتح التطبيق أو الرجوع إليه، ويستخدم تدرجًا زمنيًا للمحاولات حتى لا يستهلك الشبكة أو البطارية بلا داعٍ.</Body>
      <Button label="مزامنة الكل الآن" onPress={async () => {
        try {
          const r = await syncPendingWork('manual');
          setMessage(r.skipped
            ? 'ماكو بيانات معلقة للمزامنة.'
            : 'عقارات: تمت ' + r.propertySynced + ' · متبقي ' + r.propertyRemaining + ' | ميدان: تمت ' + r.fieldSynced + ' · متبقي ' + r.fieldRemaining);
        } catch (error) {
          setMessage(error instanceof Error ? error.message : 'تعذرت المزامنة');
        }
        await load();
      }} />

      {failed ? <Button label="إعادة محاولة أخطاء العقارات المؤقتة" variant="secondary" onPress={async () => {
        const pending = await retryTransientOfflineMutations();
        setMessage('تمت إعادة تهيئة الأخطاء المؤقتة. العمليات الجاهزة للمحاولة: ' + pending);
        await load();
      }} /> : null}
    </Card>

    {lastSync ? <Card>
      <Caption>آخر مزامنة: {new Date(lastSync.completedAt).toLocaleString('ar-IQ')}</Caption>
      <Caption>المصدر: {lastSync.source === 'manual' ? 'يدوي' : lastSync.source === 'startup' ? 'بدء التطبيق' : 'العودة للتطبيق'}</Caption>
    </Card> : null}

    {message ? <Card><Body>{message}</Body></Card> : null}
  </Screen>;
}
