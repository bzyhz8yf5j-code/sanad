import { useState } from 'react';
import { Screen } from '../../../src/components/Screen';
import { Body, Button, Card, Field, Title } from '../../../src/components/Ui';
import { advanceTransaction, createTrackedTransaction } from '../../../src/services/transactionTracking';
import type { TransactionStatus } from '../../../src/types/domain';

export default function OfficeTransactionsScreen(){
  const [officeId,setOfficeId]=useState('');
  const [transactionId,setTransactionId]=useState('');
  const [trackingCode,setTrackingCode]=useState('');
  const [status,setStatus]=useState<TransactionStatus>('opened');
  const [message,setMessage]=useState('');
  const create=async()=>{try{const r=await createTrackedTransaction(officeId);setTransactionId(r.transaction_id);setTrackingCode(r.tracking_code);setStatus('opened');setMessage('احفظ رمز المتابعة الآن؛ لن يُخزن كنص صريح.');}catch(e){setMessage(e instanceof Error?e.message:'تعذر فتح المعاملة');}};
  const move=async(next:TransactionStatus)=>{try{await advanceTransaction(transactionId,next);setStatus(next);setMessage('تم تحديث مرحلة المعاملة.');}catch(e){setMessage(e instanceof Error?e.message:'تعذر تحديث المعاملة');}};
  return <Screen><Title>معاملات المكتب</Title><Card><Field value={officeId} onChangeText={setOfficeId} placeholder="معرّف المكتب"/><Button label="فتح معاملة جديدة" onPress={()=>void create()}/>{trackingCode?<><Body>رمز المتابعة: {trackingCode}</Body><Body>يظهر الرمز عند الإنشاء فقط.</Body></>:null}</Card>{transactionId?<Card><Title>المعاملة الحالية</Title><Body>الحالة: {status}</Body><Body>{message}</Body>{status==='opened'?<Button label="استلام الوثائق" onPress={()=>void move('documents')}/>:null}{status==='documents'?<Button label="إرسال للمراجعة القانونية" onPress={()=>void move('legal_review')}/>:null}{status==='legal_review'?<Button label="بدء التسجيل" onPress={()=>void move('registration')}/>:null}{status==='registration'?<Button label="إكمال المعاملة" onPress={()=>void move('completed')}/>:null}</Card>:null}</Screen>;
}
