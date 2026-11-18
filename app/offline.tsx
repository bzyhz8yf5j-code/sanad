import { useEffect, useState } from 'react';
import { Screen } from '../src/components/Screen';
import { Body, Button, Caption, Card, Title } from '../src/components/Ui';
import { pendingFieldObservationCount, pendingFieldSessionCount } from '../src/services/fieldMode';
import { loadOfflineQueue, retryTransientOfflineMutations } from '../src/services/offlineSync';
import { loadLastSyncSummary, syncPendingWork, type SyncSummary } from '../src/services/syncCoordinator';

export default function OfflineCenter() {
  const [count, setCount] = useState(0);
  const [properties, setProperties] = useState(0);
  const [messages, setMessages] = useState(0);
  const [appointments, setAppointments] = useState(0);
  const [failed, setFailed] = useState(0);
  const [permanent, setPermanent] = useState(0);
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
    setProperties(queue.filter((item) => item.entity === 'property').length);
    setMessages(queue.filter((item) => item.entity === 'message').length);
    setAppointments(queue.filter((item) => item.entity === 'appointment').length);
    setFailed(queue.filter((item) => item.status === 'failed' && item.failureKind === 'transient').length);
    setPermanent(queue.filter((item) => item.failureKind === 'permanent').length);
    setConflicts(queue.filter((item) => item.failureKind === 'conflict').length);
    setFieldPending(fieldObservations + fieldSessions);
    setLastSync(last);
  }

  useEffect(() => { void load(); }, []);

  return <Screen>
    <Title>مزامنة سند الخفيفة</Title>
    <Card>
      <Body>إجمالي الطابور: {count} · الميدان: {fieldPending}</Body>
      <Caption>عقارات {properties} · رسائل {messages} · مواعيد {appointments}</Caption>
      <Caption>أخطاء مؤقتة {failed} · تعارضات {conflicts} · أخطاء تحتاج تدخل {permanent}</Caption>
      <Body>سند يزامن تلقائيًا عند فتح التطبيق أو العودة إليه، ويوقف إعادة المحاولة إذا كان الخطأ صلاحية أو بيانات حتى لا يهدر الشبكة والبطارية.</Body>
      <Button label="مزامنة الكل الآن" onPress={async () => {
        try {
          const r = await syncPendingWork('manual');
          setMessage(r.skipped
            ? 'ماكو بيانات معلقة للمزامنة.'
            : 'الطابور: تمت ' + r.queueSynced + ' · متبقي ' + r.queueRemaining + ' | الميدان: تمت ' + r.fieldSynced + ' · متبقي ' + r.fieldRemaining);
        } catch (error) {
          setMessage(error instanceof Error ? error.message : 'تعذرت المزامنة');
        }
        await load();
      }} />
      {failed ? <Button label="إعادة محاولة الأخطاء المؤقتة" variant="secondary" onPress={async () => {
        const pending = await retryTransientOfflineMutations();
        setMessage('تمت إعادة تهيئة الأخطاء المؤقتة. الجاهز للمحاولة: ' + pending);
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
