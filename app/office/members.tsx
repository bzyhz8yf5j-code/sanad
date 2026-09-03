import { useState } from 'react';
import { Screen } from '../../src/components/Screen';
import { Body, Button, Card, Field, Title } from '../../src/components/Ui';
import { createOfficeInvitation } from '../../src/services/officeMembers';

export default function OfficeMembers() {
  const [email,setEmail]=useState(''); const [message,setMessage]=useState('');
  async function invite(){ try { const r=await createOfficeInvitation('demo-office',email,'agent'); setMessage(`تم إنشاء الدعوة: ${'invitationId' in r ? r.invitationId : 'ok'}`); } catch { setMessage('تعذر إنشاء الدعوة'); } }
  return <Screen><Title>أعضاء المكتب</Title><Card><Body>المالك يعيّن مدير/موظف/مشاهد، والمدير يستطيع دعوة موظف أو مشاهد فقط.</Body><Field placeholder="البريد الإلكتروني" value={email} onChangeText={setEmail}/><Button label="دعوة كموظف" onPress={invite}/>{message?<Body>{message}</Body>:null}</Card></Screen>;
}
