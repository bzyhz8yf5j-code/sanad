import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { Body, Button, Caption, Card, Field, Icon, Title } from '../../src/components/Ui';
import { signUp } from '../../src/services/auth';
import { colors } from '../../src/theme/colors';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (name.trim().length < 2) {
      setMessage('أدخل الاسم الكامل أو اسماً واضحاً من حرفين على الأقل.');
      return;
    }
    if (!email.includes('@')) {
      setMessage('أدخل بريداً إلكترونياً صحيحاً.');
      return;
    }
    if (password.length < 8) {
      setMessage('يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.');
      return;
    }

    try {
      setSubmitting(true);
      setMessage('');
      const data = await signUp(email, password, name);
      if (data.session) {
        router.replace('/(tabs)/account');
      } else {
        setSuccess(true);
        setMessage('تم إنشاء الحساب. افتح رسالة التأكيد التي أرسلناها إلى بريدك الإلكتروني.');
      }
    } catch (error) {
      setSuccess(false);
      setMessage(registerErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return <Screen>
    <View style={styles.brand}>
      <View style={styles.brandMark}><Icon name="account" color={colors.gold300} size={35} /></View>
      <Title style={styles.center}>إنشاء حساب سند</Title>
      <Caption style={styles.center}>حساب واحد للبحث والمفضلة والمعاملات</Caption>
    </View>
    <Card tone="elevated" style={styles.form}>
      <LabeledField label="الاسم" field={<Field accessibilityLabel="الاسم" placeholder="الاسم الكامل" value={name} onChangeText={setName} autoComplete="name" textContentType="name" />} />
      <LabeledField label="البريد الإلكتروني" field={<Field accessibilityLabel="البريد الإلكتروني" placeholder="name@example.com" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" textContentType="emailAddress" />} />
      <LabeledField label="كلمة المرور" field={<Field accessibilityLabel="كلمة المرور" placeholder="8 أحرف على الأقل" value={password} onChangeText={setPassword} secureTextEntry textContentType="newPassword" autoComplete="new-password" onSubmitEditing={submit} />} />
      <Caption>بإنشاء الحساب أنت تستخدم بياناتك للوصول إلى خدمات سند فقط، ولا تُمنح أي صفة مهنية تلقائياً.</Caption>
      {message ? <View style={[styles.message, success && styles.successMessage]}><Body style={[styles.messageText, success && styles.successText]}>{message}</Body></View> : null}
      <Button label={submitting ? 'جاري إنشاء الحساب…' : 'إنشاء الحساب'} icon="account" disabled={submitting || success} onPress={submit} />
    </Card>
    <View style={styles.login}><Caption>لديك حساب؟</Caption><Button compact label="تسجيل الدخول" variant="ghost" onPress={() => router.replace('/auth/login')} /></View>
  </Screen>;
}

function LabeledField({ label, field }: { label: string; field: React.ReactNode }) {
  return <View style={styles.fieldGroup}><Text style={styles.label}>{label}</Text>{field}</View>;
}

function registerErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  if (message === 'backend_unavailable') return 'إنشاء الحساب غير متاح في نسخة المعاينة غير المتصلة. أكمل إعداد بيئة Supabase أولاً.';
  if (/already registered|already exists/i.test(message)) return 'هذا البريد مسجّل مسبقاً. جرّب تسجيل الدخول.';
  if (/password/i.test(message)) return 'كلمة المرور لا تحقق متطلبات الأمان.';
  return message || 'تعذر إنشاء الحساب. حاول مرة أخرى.';
}

const styles = StyleSheet.create({
  brand: { alignItems: 'center', gap: 4, paddingTop: 18, paddingBottom: 5 },
  brandMark: { width: 72, height: 72, borderRadius: 25, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(217,165,58,0.10)', borderWidth: 1, borderColor: 'rgba(217,165,58,0.28)', marginBottom: 8 },
  center: { textAlign: 'center' },
  form: { gap: 15 },
  fieldGroup: { gap: 7 },
  label: { color: colors.text, fontSize: 13, fontWeight: '800', textAlign: 'right', writingDirection: 'rtl' },
  message: { padding: 11, borderRadius: 12, backgroundColor: 'rgba(234,93,98,0.09)', borderWidth: 1, borderColor: 'rgba(234,93,98,0.24)' },
  successMessage: { backgroundColor: 'rgba(49,185,122,0.10)', borderColor: 'rgba(49,185,122,0.28)' },
  messageText: { color: '#FFB3B6', fontSize: 13 },
  successText: { color: '#83E8BF' },
  login: { flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', gap: 8 },
});
