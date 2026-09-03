import { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { Body, Card, Title } from '../../src/components/Ui';
import { resolveShareLink } from '../../src/services/sharing';

export default function SharedEntityScreen() {
  const { token } = useLocalSearchParams<{ token: string }>(); const [data, setData] = useState<any>(); const [error, setError] = useState('');
  useEffect(() => { if (!token) return; resolveShareLink(token).then(setData).catch((e) => setError(e instanceof Error ? e.message : 'الرابط غير صالح أو انتهت مدته')); }, [token]);
  if (error) return <Screen><Title>رابط سند</Title><Card><Body>{error}</Body></Card></Screen>;
  if (!data) return <Screen><Title>رابط سند</Title><Body>جاري التحقق من الرابط...</Body></Screen>;
  const e = data.entity ?? {};
  return <Screen><Title>{data.entityType === 'property' ? String(e.title ?? 'عقار') : 'بيانات قطعة عقارية'}</Title><Card>{data.entityType === 'property' ? <><Body>{String(e.governorate ?? '')} · {String(e.district ?? '')} · {String(e.neighborhood ?? '')}</Body><Body>{String(e.area_sqm ?? '—')} م² · {String(e.price ?? '—')} {String(e.currency ?? '')}</Body></> : <><Body>{String(e.governorate ?? '')} · {String(e.district ?? '')}</Body><Body>المقاطعة: {String(e.block_number ?? '—')} · القطعة: {String(e.parcel_number ?? '—')}</Body><Body>المساحة: {String(e.area_sqm ?? '—')} م²</Body></>}</Card><Card><Body>هذا الرابط للمشاهدة المؤقتة ولا يُعد إثبات ملكية أو بديلًا عن الوثائق الرسمية.</Body></Card></Screen>;
}
