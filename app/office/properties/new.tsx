import { useState } from 'react';
import { Screen } from '../../../src/components/Screen';
import { Body, Button, Card, Field, Title } from '../../../src/components/Ui';
import { createProperty } from '../../../src/services/properties';

export default function NewProperty(){
  const [title,setTitle]=useState(''); const [price,setPrice]=useState(''); const [area,setArea]=useState(''); const [message,setMessage]=useState('');
  async function save(){ try { const r=await createProperty({officeId:'demo-office',title,propertyType:'دار',purpose:'sale',price:Number(price),areaSqm:Number(area),governorate:'الأنبار'}); setMessage(`حُفظت المسودة: ${r.id}`); } catch { setMessage('تعذر حفظ المسودة'); } }
  return <Screen><Title>إعلان جديد</Title><Field placeholder="عنوان الإعلان" value={title} onChangeText={setTitle}/><Field placeholder="السعر" keyboardType="numeric" value={price} onChangeText={setPrice}/><Field placeholder="المساحة م²" keyboardType="numeric" value={area} onChangeText={setArea}/><Button label="حفظ كمسودة" onPress={save}/>{message?<Card><Body>{message}</Body></Card>:null}</Screen>;
}
