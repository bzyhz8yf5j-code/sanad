import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { Body, Button, Caption, Card, Field, Icon, Title } from '../../src/components/Ui';
import { signIn } from '../../src/services/auth';
import { colors } from '../../src/theme/colors';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!email.trim() || password.length < 8) {
      setMessage('أدخل بريداً إلكترونياً صحيحاً وكلمة المرور كاملة.');
      return;
    }
    try {
      setSubmitting(true);
      setMessage('');
      await signIn(email, password);
      router.replace('/(tabs)/account');
    } catch (error) {
      setMessage(authErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return <Screen>
    <View style={styles.brand}>
      <View style={styles.brandMark}><Icon name="key" color={colors.gold300} size={34} /></View>
      <Title style={styles.center}>تسجيل الدخول</Title>
      <Caption style={styles.center}>ادخل إلى حسابك في سند بأمان</Caption>
    </View>
    <Card tone="elevated" style={styles.form}>
      <View style={styles.fieldGroup}><Text style={styles.label}>البريد الإلكتروني</Text><Field accessibilityLabel="البريد الإلكتروني" placeholder="name@example.com" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="emailAddress" /></View>
      <View style={styles.fieldGroup}><Text style={styles.label}>كلمة المرور</Text><Field accessibilityLabel="كلمة المرور" placeholder="ثمانية أحرف على الأقل" value={password} onChangeText={setPassword} secureTextEntry textContentType="password" onSubmitEditing={submit} /></View>
      {message ? <View style={styles.message}><Body style={styles.messageText}>{message}</Body></View> : null}
      <Button label={submitting ? 'جاري الدخول…' : 'دخول'} icon="account" disabled={submitting} onPress={submit} />
    </Card>
    <View style={styles.register}><Caption>ليس لديك حساب؟</Caption><Button compact label="إنشاء حساب جديد" variant="ghost" onPress={() => router.push('/auth/register')} /></View>
    <Button compact label="العودة للرئيسية" variant="ghost" onPress={() => router.replace('/(tabs)')} />
  </Screen>;
}

function authErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  if (message === 'backend_unavailable') return 'تسجيل الدخول غير متاح في نسخة المعاينة غير المتصلة. أكمل إعداد بيئة Supabase أولاً.';
  if (/invalid login credentials/i.test(message)) return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
  if (/email not confirmed/i.test(message)) return 'يرجى تأكيد البريد الإلكتروني أولاً.';
  return message || 'تعذر تسجيل الدخول. حاول مرة أخرى.';
}

const styles = StyleSheet.create({
  brand: { alignItems: 'center', gap: 4, paddingTop: 28, paddingBottom: 8 },
  brandMark: { width: 72, height: 72, borderRadius: 25, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(217,165,58,0.10)', borderWidth: 1, borderColor: 'rgba(217,165,58,0.28)', marginBottom: 8 },
  center: { textAlign: 'center' },
  form: { gap: 17 },
  fieldGroup: { gap: 7 },
  label: { color: colors.text, fontSize: 13, fontWeight: '800', textAlign: 'right', writingDirection: 'rtl' },
  message: { padding: 11, borderRadius: 12, backgroundColor: 'rgba(234,93,98,0.09)', borderWidth: 1, borderColor: 'rgba(234,93,98,0.24)' },
  messageText: { color: '#FFB3B6', fontSize: 13 },
  register: { flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', gap: 8 },
});
