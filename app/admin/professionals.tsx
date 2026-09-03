import { useState } from 'react';
import { Screen } from '../../src/components/Screen';
import { Body, Button, Card, Title } from '../../src/components/Ui';
import { transitionProfessional, type ProfessionalApplication } from '../../src/domain/professionalApproval';

const initial: ProfessionalApplication = { id: 'demo-1', applicantId: 'user-1', type: 'engineer', status: 'under_review', licenseNumber: 'ENG-2026-1042', issuingAuthority: 'جهة مهنية', governorates: ['الأنبار'] };
export default function ProfessionalReviews() {
  const [app, setApp] = useState(initial);
  return <Screen><Title>مراجعة المهنيين</Title><Card><Title>{app.type === 'engineer' ? 'مهندس' : 'مثمن'}</Title><Body>{app.licenseNumber} · {app.issuingAuthority}</Body><Body>الحالة: {app.status}</Body>
    <Button label="اعتماد" onPress={() => setApp(transitionProfessional(app, 'approved', 'admin'))} />
    <Button label="رفض تجريبي" onPress={() => setApp(transitionProfessional(app, 'rejected', 'admin', 'بيانات غير مكتملة'))} />
  </Card></Screen>;
}
