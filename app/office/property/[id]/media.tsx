import { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { Screen } from '../../../../src/components/Screen';
import { Body, Button, Card, Title } from '../../../../src/components/Ui';
import { listPropertyMedia, removePropertyMedia, saveMediaOrder, setPropertyCover, uploadPropertyMedia } from '../../../../src/services/propertyMedia';

export default function PropertyMediaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [message, setMessage] = useState('اختر صورة أو فيديو أو مستند لإضافته إلى الإعلان.');
  const [items,setItems]=useState<any[]>([]);
  async function load(){if(id)setItems(await listPropertyMedia(id))}
  useEffect(()=>{load().catch(()=>setItems([]))},[id]);
  const pick = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'video/*', 'application/pdf'], multiple: false, copyToCacheDirectory: true });
    if (result.canceled || !id) return;
    const file = result.assets[0]!; const mime = file.mimeType ?? 'application/octet-stream';
    const kind = mime.startsWith('image/') ? 'image' : mime.startsWith('video/') ? 'video' : 'document';
    try { await uploadPropertyMedia({ propertyId: id, uri: file.uri, fileName: file.name, mimeType: mime, sizeBytes: file.size ?? 1, kind }); setMessage('تم رفع الملف وربطه بالإعلان بنجاح.'); await load(); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'تعذر رفع الملف'); }
  };
  async function move(index:number,dir:-1|1){if(!id)return;const next=[...items];const target=index+dir;if(target<0||target>=next.length)return;[next[index],next[target]]=[next[target],next[index]];setItems(next);try{await saveMediaOrder(id,next.map(x=>x.id));setMessage('تم حفظ ترتيب الوسائط')}catch{setMessage('تعذر حفظ الترتيب')}}
  return <Screen><Title>وسائط الإعلان</Title><Card><Body>{message}</Body><Button label="اختيار ملف ورفعه" onPress={pick}/></Card>{items.map((m,i)=><Card key={m.id}><Title>{m.kind} {m.is_cover?'· الغلاف':''}</Title><Body>{m.mime_type} · {Math.round((m.size_bytes??0)/1024)} KB</Body>{m.kind==='image'&&!m.is_cover?<Button label="تعيين كغلاف" onPress={async()=>{if(id){await setPropertyCover(id,m.id);await load()}}}/>:null}<Button label="تحريك للأعلى" onPress={()=>move(i,-1)}/><Button label="تحريك للأسفل" onPress={()=>move(i,1)}/><Button label="حذف" onPress={async()=>{await removePropertyMedia(m.id);await load()}}/></Card>)}</Screen>;
}
