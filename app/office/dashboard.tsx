import { Screen } from '../../src/components/Screen';
import { Body, Card, Title } from '../../src/components/Ui';
export default function OfficeDashboard() { return <Screen><Title>لوحة المكتب</Title>{['الإعلانات','الوسائط','المعاملات','الرسائل','المواعيد','المرتسمات','أعضاء المكتب'].map((x) => <Card key={x}><Title>{x}</Title><Body>إدارة {x} ضمن صلاحيات المكتب وسجل التدقيق.</Body></Card>)}</Screen>; }
