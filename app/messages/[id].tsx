import { useCallback, useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { Badge, Body, Button, Card, Field, Title } from '../../src/components/Ui';
import { listMessages, sendMessage } from '../../src/services/messaging';

export default function Conversation() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [messages, setMessages] = useState<any[]>([]);
  const [body, setBody] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setMessages(await listMessages(id));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر تحميل الرسائل');
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  async function submit() {
    if (!id || !body.trim() || sending) return;
    setSending(true);
    setMessage('');
    try {
      const result = await sendMessage(id, body);
      setBody('');
      if (result.queued) {
        setMessages((current) => [...current, { ...result, localQueued: true }]);
        setMessage('انحفظت الرسالة على الجهاز وراح تنرسل تلقائيًا من يرجع الإنترنت.');
      } else {
        await load();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر إرسال الرسالة');
    } finally {
      setSending(false);
    }
  }

  return <Screen>
    <Title>المحادثة</Title>
    {messages.length
      ? messages.map((item) => <Card key={item.id}>
          {item.localQueued ? <Badge tone="warning">بانتظار المزامنة</Badge> : null}
          <Body>{item.body}</Body>
          <Body>{new Date(item.created_at).toLocaleString('ar-IQ')}</Body>
        </Card>)
      : <Card><Body>ابدأ الرسالة الأولى.</Body></Card>}
    <Field placeholder="اكتب رسالتك" value={body} onChangeText={setBody} multiline />
    <Button label={sending ? 'جاري الإرسال…' : 'إرسال'} disabled={sending || !body.trim()} onPress={submit} />
    {message ? <Card><Body>{message}</Body></Card> : null}
  </Screen>;
}
