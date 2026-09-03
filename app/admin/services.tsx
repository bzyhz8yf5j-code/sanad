import { useEffect, useState } from 'react';
import { Screen } from '../../src/components/Screen';
import { Body, Button, Card, Title } from '../../src/components/Ui';
import { canMoveServiceRequest, type ServiceRequestStatus } from '../../src/domain/serviceWorkflow';
import { listServiceReviewQueue } from '../../src/services/adminServices';
import { reviewServiceRequest } from '../../src/services/specialServices';

type Row = { id:string; service_type:string; status:ServiceRequestStatus; decision_note?:string|null; created_at:string };

export default function AdminServices(){
  const [rows,setRows]=useState<Row[]>([]);
  const [message,setMessage]=useState('');
  const load=async()=>{ try { setRows(await listServiceReviewQueue() as Row[]); } catch(e){ setMessage(e instanceof Error?e.message:'تعذر تحميل الطلبات'); } };
  useEffect(()=>{ void load(); },[]);
  const move=async(row:Row,to:ServiceRequestStatus)=>{
    if(!canMoveServiceRequest(row.status,to)) return;
    try { await reviewServiceRequest(row.id,to,to==='rejected'?'لم يستوفِ الطلب متطلبات المراجعة':undefined); setMessage('تم تحديث الطلب'); await load(); }
    catch(e){ setMessage(e instanceof Error?e.message:'تعذر تحديث الطلب'); }
  };
  return <Screen><Title>إدارة طلبات الخدمات</Title>{message?<Body>{message}</Body>:null}{rows.length===0?<Card><Body>لا توجد طلبات في الطابور حاليًا.</Body></Card>:rows.map(row=><Card key={row.id}><Title>{row.service_type}</Title><Body>الحالة: {row.status}</Body><Body>تاريخ الطلب: {new Date(row.created_at).toLocaleDateString('ar-IQ')}</Body>{canMoveServiceRequest(row.status,'under_review')?<Button label="بدء المراجعة" onPress={()=>void move(row,'under_review')}/>:null}{canMoveServiceRequest(row.status,'approved')?<Button label="اعتماد" onPress={()=>void move(row,'approved')}/>:null}{canMoveServiceRequest(row.status,'rejected')?<Button label="رفض" onPress={()=>void move(row,'rejected')}/>:null}{canMoveServiceRequest(row.status,'closed')?<Button label="إغلاق" onPress={()=>void move(row,'closed')}/>:null}</Card>)}</Screen>;
}
