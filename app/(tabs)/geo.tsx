import { router } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { Body, Button, Card, Field, Title } from '../../src/components/Ui';
import { SanadMap } from '../../src/components/SanadMap';

export default function GeoScreen() {
  return <Screen>
    <Title>مركز سند الجغرافي العقاري</Title>
    <Field placeholder="المحافظة / المقاطعة / رقم القطعة" />
    <Card><Title>خريطة العراق</Title><Body>MapLibre Native مهيأ للـDevelopment Build. في الإنتاج يُستخدم مصدر البلاطات المعتمد من إعدادات سند.</Body><SanadMap /></Card>
    <Card><Title>المرتسمات</Title><Body>DWG · DXF · PDF · GeoTIFF · KML · GeoJSON</Body><Button label="إدارة مرتسمات القطعة" onPress={() => router.push('/parcel/demo')} /></Card>
    <Card><Title>أدوات الميدان</Title><Body>GPS، صور بإحداثيات، ملاحظات، قياسات تقريبية ومزامنة لاحقة عند عودة الإنترنت.</Body><Button label="فتح الوضع الميداني" onPress={() => router.push('/field')} /><Button label="مركز المزامنة دون إنترنت" onPress={() => router.push('/offline')} /></Card>
  </Screen>;
}
