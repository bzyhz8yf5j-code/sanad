import { router } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { Body, Button, Card, Title } from '../../src/components/Ui';

export default function Home() {
  return <Screen>
    <Title>سند</Title>
    <Body>بوابتك العقارية المنظمة للبحث، المعاملات، الخرائط والمرتسمات في العراق.</Body>
    <Card><Title>مركز سند الجغرافي</Title><Body>ابحث عن القطعة، افتح المرتسم، طابقه على الخريطة وسجّل الملاحظات.</Body><Button label="فتح المركز" onPress={() => router.push('/(tabs)/geo')} /></Card>
    <Card><Title>متابعة معاملة</Title><Body>استخدم رمز المتابعة الذي استلمته من المكتب للاطلاع على المراحل المسموح بها.</Body><Button label="متابعة بالرمز" onPress={() => router.push('/transactions/track')} /></Card>
    <Card><Title>الخدمات</Title><Button label="استثمر معنا" onPress={() => router.push('/services/invest')} /><Button label="الأسهم" onPress={() => router.push('/services/shares')} /><Button label="الأقساط" onPress={() => router.push('/services/installments')} /><Button label="المجمعات" onPress={() => router.push('/services/complexes')} /></Card>
  </Screen>;
}
