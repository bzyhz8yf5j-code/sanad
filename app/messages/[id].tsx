import { useCallback, useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { Body, Button, Card, Field, Title } from '../../src/components/Ui';
import { listMessages, sendMessage } from '../../src/services/messaging';

export default function Conversation() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [messages, setMessages] = useState<any[]>([]); const [body, setBody] = useState(''); const [message, setMessage] = useState('');
  const load = useCallback(async () => { if (!id) return; try { setMessages(await listMessages(id)); } catch (e) { setMessage(e instanceof Error ? e.message : 'تعذر تحميل الرسائل'); } }, [id]);
  useEffect(() => { load(); }, [load]);
  async function submit() { if (!id || !body.trim()) return; try { await sendMessage(id, body); setBody(''); await load(); } catch (e) { setMessage(e instanceof Error ? e.message : 'تعذر إرسال الرسالة'); } }
  return <Screen><Title>المحادثة</Title>{messages.length ? messages.map((m) => <Card key={m.id}><Body>{m.body}</Body><Body>{new Date(m.created_at).toLocaleString('ar-IQ')}</Body></Card>) : <Card><Body>ابدأ الرسالة الأولى.</Body></Card>}<Field placeholder="اكتب رسالتك" value={body} onChangeText={setBody} multiline /><Button label="إرسال" onPress={submit} />{message ? <Card><Body>{message}</Body></Card> : null}</Screen>;
}
