import { useEffect, useState } from 'react';
import { Screen } from '../src/components/Screen';
import { Body, Button, Card, Field, Title } from '../src/components/Ui';
import { captureFieldNote, captureFieldPhoto, captureFieldPoint, closeFieldSession, pendingFieldObservationCount, pendingFieldSessionCount, requestFieldPermissions, startFieldSession, syncPendingFieldObservations } from '../src/services/fieldMode';

export default function FieldModeScreen() {
  const [sessionId,setSessionId]=useState('');
  const [parcelId,setParcelId]=useState('');
  const [note,setNote]=useState('');
  const [message,setMessage]=useState('');
  const [pending,setPending]=useState(0);
  const [pendingSessions,setPendingSessions]=useState(0);
  async function refresh(){setPending(await pendingFieldObservationCount());setPendingSessions(await pendingFieldSessionCount())}
  useEffect(()=>{refresh()},[]);
  return <Screen>
    <Title>الوضع الميداني</Title>
    <Card>
      <Body>ابدأ جلسة ميدانية، ثم سجّل نقطة GPS أو صورة موثقة بالموقع أو ملاحظة. إذا انقطع الإنترنت تحفظ الملاحظة محليًا وتُرفع لاحقًا بنفس رقم المزامنة لمنع التكرار.</Body>
      <Field value={parcelId} onChangeText={setParcelId} placeholder="معرّف القطعة - اختياري" autoCapitalize="none" />
      {!sessionId ? <Button label="بدء جلسة ميدانية" onPress={async()=>{try{const p=await requestFieldPermissions(); if(!p.location) throw new Error('فعّل إذن الموقع'); const s:any=await startFieldSession({parcelId:parcelId||undefined}); setSessionId(s.id); setMessage(s?.queued?'بدأت الجلسة محليًا وستتم مزامنتها عند توفر الإنترنت':'بدأت الجلسة الميدانية');}catch(e){setMessage(e instanceof Error?e.message:'تعذر البدء')}}}/> : null}
    </Card>
    {sessionId ? <>
      <Card><Body>جلسة نشطة: {sessionId}</Body><Button label="تسجيل نقطة GPS" onPress={async()=>{try{const r:any=await captureFieldPoint(sessionId);setMessage(r?.queued?'حُفظت النقطة محليًا للمزامنة':'تم تسجيل النقطة');await refresh()}catch(e){setMessage(e instanceof Error?e.message:'تعذر التسجيل')}}}/><Button label="التقاط صورة ميدانية" onPress={async()=>{try{const r:any=await captureFieldPhoto(sessionId);setMessage(r?.cancelled?'أُلغي التصوير':r?.queued?'حُفظت الصورة محليًا للمزامنة':'تم رفع الصورة الميدانية');await refresh()}catch(e){setMessage(e instanceof Error?e.message:'تعذر التصوير')}}}/></Card>
      <Card><Field value={note} onChangeText={setNote} placeholder="ملاحظة ميدانية" multiline/><Button label="حفظ الملاحظة" onPress={async()=>{if(!note.trim())return;try{const r:any=await captureFieldNote(sessionId,note.trim());setNote('');setMessage(r?.queued?'حُفظت الملاحظة محليًا للمزامنة':'تم حفظ الملاحظة');await refresh()}catch(e){setMessage(e instanceof Error?e.message:'تعذر الحفظ')}}}/></Card>
      <Card><Body>ملاحظات بانتظار المزامنة: {pending} · جلسات بانتظار المزامنة: {pendingSessions}</Body><Button label="مزامنة البيانات الميدانية" onPress={async()=>{const r=await syncPendingFieldObservations();setMessage(`تمت مزامنة ${r.synced} · متبقي ${r.remaining}`);await refresh()}}/><Button label="إنهاء الجلسة" onPress={async()=>{try{await closeFieldSession(sessionId);setSessionId('');setMessage('تم إنهاء الجلسة أو حفظ طلب الإنهاء للمزامنة');await refresh()}catch(e){setMessage(e instanceof Error?e.message:'تعذر الإنهاء')}}}/></Card>
    </> : null}
    {message ? <Card><Body>{message}</Body></Card> : null}
  </Screen>;
}
