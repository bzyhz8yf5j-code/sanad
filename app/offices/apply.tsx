import { useState } from 'react';
import { Screen } from '../../src/components/Screen';
import { Body, Button, Card, Field, Title } from '../../src/components/Ui';
import { submitOfficeApplication } from '../../src/services/offices';

export default function OfficeApplyScreen() {
  const [name, setName] = useState(''); const [governorate, setGovernorate] = useState(''); const [message, setMessage] = useState('');
  async function submit() { try { setMessage('جاري إرسال الطلب...'); const r = await submitOfficeApplication(name, governorate); setMessage(`تم إرسال طلب ${r.office.name} للمراجعة.`); } catch (e) { setMessage(e instanceof Error ? e.message : 'تعذر إرسال الطلب'); } }
  return <Screen><Title>طلب اعتماد مكتب عقاري</Title><Body>يصبح المكتب قادرًا على النشر بعد مراجعة سند واعتماده.</Body><Field placeholder="اسم المكتب" value={name} onChangeText={setName} /><Field placeholder="المحافظة" value={governorate} onChangeText={setGovernorate} /><Button label="إرسال الطلب" onPress={submit} />{message ? <Card><Body>{message}</Body></Card> : null}</Screen>;
}
