import { useEffect, useState } from 'react';
import { Screen } from '../src/components/Screen';
import { Body, Button, Card, Title } from '../src/components/Ui';
import { loadOfflineQueue, retryTransientOfflineMutations, syncOfflinePropertyQueue } from '../src/services/offlineSync';

export default function OfflineCenter() {
  const [count, setCount] = useState(0);
  const [failed, setFailed] = useState(0);
  const [conflicts, setConflicts] = useState(0);
  const [message, setMessage] = useState('');

  async function load() {
    const queue = await loadOfflineQueue();
    setCount(queue.length);
    setFailed(queue.filter((item) => item.status === 'failed' && item.failureKind === 'transient').length);
    setConflicts(queue.filter((item) => item.failureKind === 'conflict').length);
  }

  useEffect(() => { void load(); }, []);

  return <Screen>
    <Title>مزامنة سند الخفيفة</Title>
    <Card>
      <Body>عمليات في الطابور: {count} · أخطاء مؤقتة: {failed} · تعارضات: {conflicts}</Body>
      <Body>سند يستخدم تدرجًا زمنيًا بين المحاولات ويوقف الإعادة التلقائية بعد عدة محاولات. التعارض مع نسخة أحدث في الخادم لا يُكتب فوقه تلقائيًا.</Body>
      <Button label="مزامنة الآن" onPress={async () => {
        const r = await syncOfflinePropertyQueue();
        setMessage(`تمت ${r.synced} · تعارضات ${r.conflicts} · مؤجلة ${r.deferred} · استنفدت المحاولات ${r.exhausted} · متبقي ${r.remaining}`);
        await load();
      }} />
      {failed ? <Button label="إعادة محاولة الأخطاء المؤقتة" variant="secondary" onPress={async () => {
        const pending = await retryTransientOfflineMutations();
        setMessage(`تمت إعادة تهيئة الأخطاء المؤقتة. العمليات الجاهزة للمحاولة: ${pending}`);
        await load();
      }} /> : null}
    </Card>
    {message ? <Card><Body>{message}</Body></Card> : null}
  </Screen>;
}
