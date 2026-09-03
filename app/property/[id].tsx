import { useEffect, useState } from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { Badge, Body, Button, Caption, Card, Divider, EmptyState, Icon, SectionTitle, Title } from '../../src/components/Ui';
import { getDemoProperty } from '../../src/data/demoProperties';
import { supabase } from '../../src/lib/supabase';
import { startPropertyConversation } from '../../src/services/messaging';
import { createShareLink } from '../../src/services/sharing';
import { colors } from '../../src/theme/colors';

interface PropertyView {
  id: string;
  title: string;
  description: string;
  propertyType: string;
  purpose: 'sale' | 'rent';
  price: number;
  currency: string;
  areaSqm: number;
  bedrooms?: number;
  governorate: string;
  district?: string;
  neighborhood?: string;
  verified: boolean;
  demo: boolean;
  visual: 'villa' | 'apartment' | 'land' | 'commercial';
}

export default function PropertyDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [property, setProperty] = useState<PropertyView>();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setMessage('');

    const demo = getDemoProperty(id);
    if (demo) {
      setProperty({
        id: demo.id,
        title: demo.title,
        description: `${demo.type} ${demo.purpose === 'sale' ? 'للبيع' : 'للإيجار'} في ${demo.location}. هذا العقار معروض ضمن البيانات التجريبية لواجهة سند.`,
        propertyType: demo.type,
        purpose: demo.purpose,
        price: demo.price,
        currency: 'د.ع',
        areaSqm: demo.areaSqm,
        bedrooms: demo.bedrooms,
        governorate: demo.governorate,
        district: demo.district,
        neighborhood: demo.neighborhood,
        verified: Boolean(demo.verified),
        demo: true,
        visual: demo.visual,
      });
      setLoading(false);
      return () => { active = false; };
    }

    if (!supabase || !id) {
      setProperty(undefined);
      setLoading(false);
      return () => { active = false; };
    }

    supabase
      .from('properties')
      .select('id,title,description,property_type,purpose,price,currency,area_sqm,governorate,district,neighborhood,status,verified')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setProperty(undefined);
          setMessage(error.message);
        } else {
          setProperty({
            id: data.id,
            title: data.title,
            description: data.description || 'لم يضف المكتب وصفاً تفصيلياً لهذا العقار.',
            propertyType: data.property_type,
            purpose: data.purpose,
            price: data.price,
            currency: data.currency || 'IQD',
            areaSqm: data.area_sqm,
            governorate: data.governorate,
            district: data.district || undefined,
            neighborhood: data.neighborhood || undefined,
            verified: Boolean(data.verified),
            demo: false,
            visual: data.property_type === 'أرض' ? 'land' : data.property_type === 'محل' ? 'commercial' : data.property_type === 'شقة' ? 'apartment' : 'villa',
          });
        }
        setLoading(false);
      });

    return () => { active = false; };
  }, [id]);

  async function chat() {
    if (!id) return;
    try {
      const result = await startPropertyConversation(id);
      router.push(`/messages/${result.conversationId}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'سجّل الدخول لبدء المحادثة');
    }
  }

  async function share() {
    if (!id) return;
    try {
      const result = await createShareLink('property', id, 1440);
      await Share.share({ message: `سند — رابط عقار صالح حتى ${new Date(result.expiresAt).toLocaleString('ar-IQ')}\nsanad://share/${result.token}` });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر إنشاء رابط المشاركة');
    }
  }

  if (loading) {
    return <Screen><Title>تفاصيل العقار</Title><Card tone="elevated" style={styles.loadingVisual}><Icon name="building" color={colors.gold300} size={58} /><Caption>جاري تحميل بيانات العقار…</Caption></Card></Screen>;
  }

  if (!property) {
    return <Screen>
      <Title>تفاصيل العقار</Title>
      <EmptyState icon="building" title="العقار غير متاح" description={message || 'قد يكون الإعلان أُزيل أو أن الرابط غير صحيح.'} action={<Button compact label="العودة إلى البحث" onPress={() => router.replace('/(tabs)/search')} />} />
    </Screen>;
  }

  const location = [property.governorate, property.district, property.neighborhood].filter(Boolean).join(' · ');

  return <Screen>
    <View style={styles.hero}>
      <View style={styles.glow} />
      <View style={styles.heroBuilding}><Icon name={property.visual === 'land' ? 'land' : property.visual === 'commercial' ? 'office' : 'building'} color={colors.gold300} size={72} /></View>
      <View style={styles.heroBadges}>{property.demo ? <Badge tone="warning">عرض تجريبي</Badge> : null}{property.verified ? <Badge tone="success">موثق في سند</Badge> : <Badge tone="muted">غير موثق</Badge>}</View>
    </View>

    <View style={styles.titleBlock}>
      <Title>{property.title}</Title>
      <View style={styles.location}><Icon name="location" color={colors.gold300} size={17} /><Caption>{location}</Caption></View>
      <Text style={styles.price}>{property.price.toLocaleString('ar-IQ')} {property.currency}</Text>
    </View>

    <Card style={styles.stats}>
      <Stat value={property.areaSqm.toLocaleString('ar-IQ')} label="متر مربع" />
      <DividerVertical />
      <Stat value={property.propertyType} label="نوع العقار" />
      <DividerVertical />
      <Stat value={property.bedrooms ? String(property.bedrooms) : '—'} label="غرف" />
    </Card>

    <SectionTitle>وصف العقار</SectionTitle>
    <Card><Body>{property.description}</Body></Card>

    <Card tone="accent">
      <View style={styles.disclaimerTitle}><Icon name="shield" color={colors.gold300} size={19} /><Text style={styles.disclaimerHeading}>وضوح المعلومات</Text></View>
      <Caption>{property.demo
        ? 'هذه بيانات توضيحية لا تمثل إعلاناً حقيقياً ولا وثيقة ملكية أو اعتماداً حكومياً.'
        : property.verified
          ? 'علامة التوثيق تخص مراجعة الإعلان داخل منصة سند ولا تستبدل التحقق القانوني من الملكية والقيود.'
          : 'لم تُراجع بيانات هذا الإعلان داخل سند بعد. تحقّق من المستندات والملكية قبل أي التزام مالي.'}</Caption>
    </Card>

    <Button label="مراسلة المكتب" icon="message" onPress={chat} />
    <View style={styles.actions}><View style={styles.action}><Button label="مشاركة" icon="document" variant="secondary" onPress={share} /></View><View style={styles.action}><Button label="عرض على الخريطة" icon="map" variant="secondary" onPress={() => router.push('/(tabs)/geo')} /></View></View>
    {message ? <Card><Caption style={styles.error}>{message}</Caption></Card> : null}
  </Screen>;
}

function Stat({ value, label }: { value: string; label: string }) {
  return <View style={styles.stat}><Text numberOfLines={1} style={styles.statValue}>{value}</Text><Caption>{label}</Caption></View>;
}

function DividerVertical() { return <View style={styles.dividerVertical} />; }

const styles = StyleSheet.create({
  loadingVisual: { minHeight: 260, alignItems: 'center', justifyContent: 'center' },
  hero: { height: 238, overflow: 'hidden', alignItems: 'center', justifyContent: 'flex-end', borderRadius: 24, backgroundColor: colors.navy600, borderWidth: 1, borderColor: colors.lineSoft },
  glow: { position: 'absolute', width: 310, height: 310, borderRadius: 160, top: -180, left: -70, backgroundColor: 'rgba(79,143,232,0.20)' },
  heroBuilding: { width: '72%', height: '76%', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(2,10,20,0.42)', borderTopLeftRadius: 34, borderTopRightRadius: 34, borderWidth: 1, borderColor: 'rgba(240,196,105,0.20)' },
  heroBadges: { position: 'absolute', top: 14, right: 14, left: 14, flexDirection: 'row-reverse', gap: 7 },
  titleBlock: { alignItems: 'flex-end', gap: 5 },
  location: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5 },
  price: { color: '#65DFAA', fontSize: 22, lineHeight: 31, fontWeight: '900', textAlign: 'right', writingDirection: 'rtl' },
  stats: { flexDirection: 'row-reverse', alignItems: 'stretch', justifyContent: 'space-around', paddingVertical: 14 },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { color: colors.text, fontSize: 15, lineHeight: 23, fontWeight: '900', textAlign: 'center', writingDirection: 'rtl' },
  dividerVertical: { width: StyleSheet.hairlineWidth, backgroundColor: colors.line, marginVertical: 2 },
  disclaimerTitle: { flexDirection: 'row-reverse', alignItems: 'center', gap: 7 },
  disclaimerHeading: { color: colors.gold300, fontSize: 14, fontWeight: '900', writingDirection: 'rtl' },
  actions: { flexDirection: 'row-reverse', gap: 10 },
  action: { flex: 1 },
  error: { color: '#FF9A9E' },
});
