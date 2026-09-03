import { useEffect, useState } from 'react';
import { Screen } from '../src/components/Screen';
import { Body, Button, Card, Title } from '../src/components/Ui';
import { loadOfflineQueue, syncOfflinePropertyQueue } from '../src/services/offlineSync';
export default function OfflineCenter(){const [count,setCount]=useState(0);const [message,setMessage]=useState('');async function load(){setCount((await loadOfflineQueue()).length)}useEffect(()=>{load()},[]);return <Screen><Title>مزامنة سند الخفيفة</Title><Card><Body>عمليات بانتظار المزامنة: {count}</Body><Body>عند تعارض نسخة محلية مع نسخة أحدث في الخادم لا يتم الكتابة فوقها تلقائيًا؛ تُحفظ كحالة تعارض للمراجعة.</Body><Button label="مزامنة الآن" onPress={async()=>{const r:any=await syncOfflinePropertyQueue();setMessage(`تمت ${r.synced??0} · تعارضات ${r.conflicts??0} · متبقي ${r.remaining??0}`);await load()}}/></Card>{message?<Card><Body>{message}</Body></Card>:null}</Screen>}
