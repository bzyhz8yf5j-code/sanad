import { useState } from 'react';
import { router } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { Body, Button, Card, Field, Title } from '../../src/components/Ui';
import { signUp } from '../../src/services/auth';

export default function RegisterScreen() {
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [message, setMessage] = useState('');
  async function submit() { try { if (name.trim().length < 2 || password.length < 8) { setMessage('أدخل الاسم وكلمة مرور من 8 أحرف على الأقل.'); return; } setMessage('جاري إنشاء الحساب...'); const data:any = await signUp(email, password, name); if (data?.session) router.replace('/(tabs)/account'); else setMessage('تم إنشاء الحساب. تحقق من البريد إذا كان تأكيد البريد مفعّلًا.'); } catch (e) { setMessage(e instanceof Error ? e.message : 'تعذر إنشاء الحساب'); } }
  return <Screen><Title>إنشاء حساب سند</Title><Field placeholder="الاسم" value={name} onChangeText={setName} /><Field placeholder="البريد الإلكتروني" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" /><Field placeholder="كلمة المرور" value={password} onChangeText={setPassword} secureTextEntry /><Button label="إنشاء الحساب" onPress={submit} /><Button label="لدي حساب" onPress={() => router.replace('/auth/login')} />{message ? <Card><Body>{message}</Body></Card> : null}</Screen>;
}
