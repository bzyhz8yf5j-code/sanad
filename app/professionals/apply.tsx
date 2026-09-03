import { useState } from 'react';
import { Screen } from '../../src/components/Screen';
import { Body, Button, Card, Field, Title } from '../../src/components/Ui';
import { submitProfessionalApplication } from '../../src/services/professionals';

export default function ApplyProfessional() {
  const [type, setType] = useState<'engineer'|'valuer'>('engineer');
  const [license, setLicense] = useState('');
  const [authority, setAuthority] = useState('');
  const [message, setMessage] = useState('');
  async function submit() { try { const r = await submitProfessionalApplication({ type, licenseNumber: license, issuingAuthority: authority, governorates: ['الأنبار'] }); setMessage(`تم إنشاء الطلب: ${'id' in r ? r.id : 'ok'}`); } catch { setMessage('تعذر إرسال الطلب'); } }
  return <Screen><Title>طلب اعتماد مهني</Title><Body onPress={() => setType(type === 'engineer' ? 'valuer' : 'engineer')}>الصفة: {type === 'engineer' ? 'مهندس' : 'مثمن'} — اضغط للتبديل</Body><Field placeholder="رقم الإجازة" value={license} onChangeText={setLicense} /><Field placeholder="الجهة المصدرة" value={authority} onChangeText={setAuthority} /><Button label="إرسال للمراجعة" onPress={submit} />{message ? <Card><Body>{message}</Body></Card> : null}</Screen>;
}
