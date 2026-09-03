import { useEffect, useState } from 'react';
import { Screen } from '../../src/components/Screen';
import { Body, Button, Card, Field, Title } from '../../src/components/Ui';
import { listMapSources, runMapSourceHealthCheck, saveMapSource } from '../../src/services/mapAdmin';

export default function AdminMaps(){
 const [sources,setSources]=useState<any[]>([]); const [name,setName]=useState(''); const [endpoint,setEndpoint]=useState(''); const [message,setMessage]=useState('');
 async function reload(){ try{setSources(await listMapSources())}catch{setMessage('تعذر تحميل المصادر')}}
 useEffect(()=>{reload()},[]);
 async function add(){ try{await saveMapSource({name,endpoint,sourceType:'wms',enabled:false});setName('');setEndpoint('');await reload();setMessage('تم حفظ المصدر')}catch{setMessage('تعذر حفظ المصدر')}}
 return <Screen><Title>إدارة مصادر الخرائط</Title><Card><Field placeholder="اسم المصدر" value={name} onChangeText={setName}/><Field placeholder="رابط WMS / WMTS / WFS" value={endpoint} onChangeText={setEndpoint}/><Button label="إضافة كمصدر غير مفعّل" onPress={add}/></Card>{sources.map(s=><Card key={s.id}><Title>{s.name}</Title><Body>{s.source_type} · {s.enabled?'مفعّل':'متوقف'}</Body><Body>{s.last_health_status??'لم يُفحص بعد'} {s.last_latency_ms?`· ${s.last_latency_ms}ms`:''}</Body><Button label="فحص المصدر" onPress={async()=>{try{const r:any=await runMapSourceHealthCheck(s.id);setMessage(`الفحص: ${r.status}`);await reload()}catch{setMessage('فشل الفحص')}}}/></Card>)}{message?<Card><Body>{message}</Body></Card>:null}</Screen>
}
