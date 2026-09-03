import { useLocalSearchParams } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { Body, Button, Card, Title } from '../../src/components/Ui';

export default function ParcelScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Screen><Title>ملف القطعة</Title><Body>المعرف: {id}</Body>
    <Card><Title>البيانات المكانية</Title><Body>المقاطعة، رقم القطعة، الحدود، المساحة، الإحداثيات، ومصدر البيانات.</Body></Card>
    <Card><Title>المستندات</Title><Body>النسخة الأصلية تحفظ دون تعديل، وتُنشأ نسخة منفصلة للمطابقة.</Body><Button label="رفع مرتسم" /></Card>
    <Card><Title>المطابقة الذكية</Title><Body>ثلاث نقاط تحكم + Affine Transform + RMS + درجة ثقة، مع اعتماد نهائي من المختص.</Body></Card>
    <Card><Title>رادار المخاطر</Title><Body>اختلاف مساحة، رقم قطعة، قدم وثيقة، تكرار، بعد موقع ونقص ملفات.</Body></Card>
  </Screen>;
}
