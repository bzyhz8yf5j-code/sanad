import { useState } from 'react';
import { router } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { Body, Button, Card, Field, Title } from '../../src/components/Ui';
import { signIn } from '../../src/services/auth';

export default function LoginScreen() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [message, setMessage] = useState('');
  async function submit() { try { setMessage('جاري تسجيل الدخول...'); await signIn(email, password); router.replace('/(tabs)/account'); } catch (e) { setMessage(e instanceof Error ? e.message : 'تعذر تسجيل الدخول'); } }
  return <Screen><Title>تسجيل الدخول</Title><Field placeholder="البريد الإلكتروني" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" /><Field placeholder="كلمة المرور" value={password} onChangeText={setPassword} secureTextEntry /><Button label="دخول" onPress={submit} /><Button label="إنشاء حساب جديد" onPress={() => router.push('/auth/register')} />{message ? <Card><Body>{message}</Body></Card> : null}</Screen>;
}
