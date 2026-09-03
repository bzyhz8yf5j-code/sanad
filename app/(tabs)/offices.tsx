import { router } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { Body, Button, Card, Title } from '../../src/components/Ui';

export default function OfficesScreen() {
  return <Screen><Title>المكاتب العقارية</Title>
    <Card><Title>المكاتب المعتمدة</Title><Body>ملف المكتب، الإعلانات، المواعيد، المعاملات والمرتسمات ضمن صلاحيات واضحة.</Body><Button label="لوحة المكتب" onPress={() => router.push('/office/dashboard')} /></Card>
    <Card><Title>اعتماد مكتب جديد</Title><Body>يقدم صاحب المكتب بياناته أولًا، وبعد المراجعة يُسمح له بالنشر وإدارة فريقه.</Body><Button label="طلب اعتماد مكتب" onPress={() => router.push('/offices/apply')} /></Card>
    <Card><Title>اعتماد مهني</Title><Body>المهندس أو المثمّن يقدم رقم الإجازة والجهة المصدرة والمحافظات التي يعمل بها.</Body><Button label="تقديم طلب" onPress={() => router.push('/professionals/apply')} /></Card>
  </Screen>;
}
