import { router } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { Body, Button, Card, Title } from '../../src/components/Ui';
export default function AdminDashboard() { return <Screen><Title>إدارة سند</Title>
  <Card><Title>المراجعات المهنية</Title><Body>طلبات المكاتب والمهندسين والمثمنين.</Body><Button label="فتح المراجعات" onPress={() => router.push('/admin/professionals')} /></Card>
  <Card><Title>الخرائط والمرتسمات</Title><Body>مصادر WMS/WMTS/WFS، فحص صحة المصدر وطابور مراجعة المرتسمات.</Body><Button label="مصادر الخرائط" onPress={()=>router.push('/admin/maps')}/><Button label="طابور المرتسمات" onPress={()=>router.push('/admin/parcel-documents')}/></Card>
  <Card><Title>الخدمات الخاصة</Title><Body>استثمر معنا، الأسهم، الأقساط والمجمعات — كل طلب بسير عمل مستقل.</Body><Button label="إدارة الطلبات" onPress={()=>router.push('/admin/services')}/></Card>
  <Card><Title>التدقيق والأمان</Title><Body>Audit log، Rate limits، روابط المشاركة المؤقتة والتنبيهات الحساسة.</Body></Card>
<Button label="اعتماد المكاتب" onPress={() => router.push('/admin/offices')} /></Screen>; }
