import { useEffect, useState } from 'react';
import { Screen } from '../../src/components/Screen';
import { Body, Card, Title } from '../../src/components/Ui';
import { listParcelDocumentReviewQueue } from '../../src/services/mapAdmin';
export default function ParcelDocumentQueue(){const [items,setItems]=useState<any[]>([]);useEffect(()=>{listParcelDocumentReviewQueue().then(setItems).catch(()=>setItems([]))},[]);return <Screen><Title>طابور مراجعة المرتسمات</Title>{items.length?items.map(x=><Card key={x.id}><Title>{x.original_name}</Title><Body>{x.kind} · {x.status}</Body><Body>القطعة: {x.parcel_id??'غير مرتبطة'}</Body></Card>):<Card><Body>لا توجد مرتسمات بانتظار المراجعة.</Body></Card>}</Screen>}
