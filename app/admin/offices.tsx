import { useEffect, useState } from 'react';
import { Screen } from '../../src/components/Screen';
import { Body, Button, Card, Title } from '../../src/components/Ui';
import { listOfficeApplications, reviewOfficeApplication } from '../../src/services/offices';

export default function OfficeReviewsScreen() {
  const [items, setItems] = useState<any[]>([]); const [message, setMessage] = useState('');
  async function load() { try { setItems(await listOfficeApplications()); } catch (e) { setMessage(e instanceof Error ? e.message : 'تعذر التحميل'); } }
  useEffect(() => { load(); }, []);
  async function decide(id:string, decision:'approved'|'rejected') { try { await reviewOfficeApplication(id, decision, decision === 'rejected' ? 'الطلب يحتاج استكمال أو تصحيح البيانات.' : undefined); await load(); } catch (e) { setMessage(e instanceof Error ? e.message : 'تعذر تحديث الطلب'); } }
  return <Screen><Title>اعتماد المكاتب</Title>{items.map((x) => <Card key={x.id}><Title>{x.name}</Title><Body>{x.governorate} · {x.status}</Body><Button label="اعتماد" onPress={() => decide(x.id,'approved')} /><Button label="رفض" onPress={() => decide(x.id,'rejected')} /></Card>)}{!items.length ? <Card><Body>لا توجد طلبات معلقة.</Body></Card> : null}{message ? <Card><Body>{message}</Body></Card> : null}</Screen>;
}
