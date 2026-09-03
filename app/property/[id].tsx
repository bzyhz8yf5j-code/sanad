import { useEffect, useState } from 'react';
import { Share } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { Body, Button, Card, Title } from '../../src/components/Ui';
import { supabase } from '../../src/lib/supabase';
import { startPropertyConversation } from '../../src/services/messaging';
import { createShareLink } from '../../src/services/sharing';

export default function PropertyDetail() {
  const { id } = useLocalSearchParams<{ id: string }>(); const [p, setP] = useState<any>(); const [message, setMessage] = useState('');
  useEffect(() => { if (!supabase || !id) return; supabase.from('properties').select('id,title,description,property_type,purpose,price,currency,area_sqm,governorate,district,neighborhood,status,verified').eq('id', id).single().then(({ data, error }) => { if (error) setMessage(error.message); else setP(data); }); }, [id]);
  async function chat() { if (!id) return; try { const r = await startPropertyConversation(id); router.push(`/messages/${r.conversationId}`); } catch (e) { setMessage(e instanceof Error ? e.message : 'سجّل الدخول لبدء المحادثة'); } }
  async function share() { if (!id) return; try { const r = await createShareLink('property', id, 1440); await Share.share({ message: `سند — رابط عقار صالح حتى ${new Date(r.expiresAt).toLocaleString('ar-IQ')}\nsanad://share/${r.token}` }); } catch (e) { setMessage(e instanceof Error ? e.message : 'تعذر إنشاء رابط المشاركة'); } }
  return <Screen><Title>{p?.title ?? 'تفاصيل العقار'}</Title><Card><Body>{p?.description ?? 'جاري تحميل التفاصيل...'}</Body>{p ? <><Body>{p.area_sqm} م² · {p.price} {p.currency}</Body><Body>{p.governorate} · {p.district ?? ''} · {p.neighborhood ?? ''}</Body><Body>{p.verified ? 'معلومات مدققة في سند' : 'معلومات غير مدققة رسميًا'}</Body></> : null}</Card>{p ? <><Button label="مراسلة المكتب" onPress={chat} /><Button label="مشاركة برابط مؤقت" onPress={share} /></> : null}{message ? <Card><Body>{message}</Body></Card> : null}</Screen>;
}
