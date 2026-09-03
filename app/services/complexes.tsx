import { Screen } from '../../src/components/Screen';
import { Body, Button, Card, Field, Title } from '../../src/components/Ui';
export default function Service() { return <Screen><Title>المجمعات السكنية والتجارية</Title><Card><Body>يُرسل الطلب إلى لوحة الإدارة، ويُحفظ بسجل حالة ومرفقات وملاحظات دون تنفيذ مالي مباشر قبل اعتماد مزود رسمي.</Body><Field placeholder="تفاصيل الطلب" multiline /><Button label="إرسال الطلب" /></Card></Screen>; }
