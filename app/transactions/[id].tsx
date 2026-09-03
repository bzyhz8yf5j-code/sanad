import { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { Body, Card, Title } from '../../src/components/Ui';
import { getTransactionHistory } from '../../src/services/transactionTracking';
export default function TransactionDetail(){const {id}=useLocalSearchParams<{id:string}>();const [items,setItems]=useState<any[]>([]);useEffect(()=>{if(id)getTransactionHistory(id).then(setItems).catch(()=>setItems([]))},[id]);return <Screen><Title>سجل المعاملة</Title>{items.map(x=><Card key={x.id}><Title>{x.status}</Title><Body>{x.note??'بدون ملاحظة'}</Body><Body>{new Date(x.created_at).toLocaleString('ar-IQ')}</Body></Card>)}</Screen>}
