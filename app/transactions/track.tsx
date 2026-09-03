import { useState } from 'react';
import { Screen } from '../../src/components/Screen';
import { Body, Button, Card, Field, Title } from '../../src/components/Ui';

export default function TrackTransaction() {
  const [code, setCode] = useState('');
  const [submitted, setSubmitted] = useState(false);
  return <Screen><Title>متابعة المعاملة</Title><Field value={code} onChangeText={setCode} autoCapitalize="characters" placeholder="رمز المتابعة" /><Button label="فتح المتابعة" onPress={() => setSubmitted(Boolean(code.trim()))} />
    {submitted && <Card><Body>هذه واجهة Demo. عند ربط Supabase يتم حل الرمز في دالة آمنة وإرجاع الأحداث المسموح للعميل بمشاهدتها فقط.</Body></Card>}
  </Screen>;
}
