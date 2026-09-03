import { useCallback, useEffect, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { Body, Button, Card, Title } from '../../src/components/Ui';
import { getCurrentAccount, signOut } from '../../src/services/auth';
import { listMyOffices } from '../../src/services/offices';

export default function AccountScreen() {
  const [account, setAccount] = useState<any>(undefined); const [offices, setOffices] = useState<any[]>([]);
  const load = useCallback(async () => { try { const a = await getCurrentAccount(); setAccount(a); setOffices(a ? await listMyOffices() : []); } catch { setAccount(null); } }, []);
  useEffect(() => { load(); }, [load]); useFocusEffect(useCallback(() => { load(); }, [load]));
  if (account === undefined) return <Screen><Title>الحساب</Title><Body>جاري التحميل...</Body></Screen>;
  if (!account) return <Screen><Title>الحساب</Title><Card><Body>سجّل الدخول حتى تستخدم المفضلة، الرسائل، المواعيد، المعاملات وخدمات المكتب.</Body></Card><Button label="تسجيل الدخول" onPress={() => router.push('/auth/login')} /><Button label="إنشاء حساب" onPress={() => router.push('/auth/register')} /></Screen>;
  return <Screen><Title>الحساب</Title><Card><Title>{account.profile.display_name || account.user.email}</Title><Body>الصلاحية: {account.profile.role}</Body></Card>{offices.map((o) => <Card key={o.id}><Body>{o.name} · {o.governorate}</Body><Body>حالة الاعتماد: {o.status}</Body>{o.rejection_reason ? <Body>{o.rejection_reason}</Body> : null}</Card>)}<Button label="طلب اعتماد مكتب" onPress={() => router.push('/offices/apply')} /><Button label="طلب اعتماد مهني" onPress={() => router.push('/professionals/apply')} />{['admin','supervisor'].includes(account.profile.role) ? <Button label="الإدارة" onPress={() => router.push('/admin')} /> : null}<Button label="تسجيل الخروج" onPress={async () => { await signOut(); setAccount(null); }} /></Screen>;
}
