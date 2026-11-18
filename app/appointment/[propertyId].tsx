import { useMemo, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { Body, Button, Caption, Card, Field, Title } from '../../src/components/Ui';
import { requestAppointment } from '../../src/services/appointments';

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function defaultAppointmentParts() {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
  date.setHours(17, 0, 0, 0);
  return {
    date: date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()),
    time: pad(date.getHours()) + ':' + pad(date.getMinutes()),
  };
}

export default function AppointmentRequestScreen() {
  const { propertyId, officeId } = useLocalSearchParams<{ propertyId: string; officeId?: string }>();
  const defaults = useMemo(defaultAppointmentParts, []);
  const [date, setDate] = useState(defaults.date);
  const [time, setTime] = useState(defaults.time);
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  async function submit() {
    if (!propertyId || !officeId) {
      setMessage('بيانات المكتب غير مكتملة لهذا العقار.');
      return;
    }

    const matchDate = /^\d{4}-\d{2}-\d{2}$/.test(date);
    const matchTime = /^\d{2}:\d{2}$/.test(time);
    if (!matchDate || !matchTime) {
      setMessage('اكتب التاريخ بصيغة YYYY-MM-DD والوقت بصيغة HH:MM.');
      return;
    }

    const startsAt = new Date(date + 'T' + time + ':00');
    if (Number.isNaN(startsAt.getTime()) || startsAt.getTime() <= Date.now()) {
      setMessage('اختار موعد بالمستقبل.');
      return;
    }

    setSending(true);
    setMessage('');
    try {
      const result = await requestAppointment({
        propertyId,
        officeId,
        startsAt: startsAt.toISOString(),
        note,
      });
      setMessage(result.queued
        ? 'انحفظ طلب الموعد على الجهاز وراح ينرسل تلقائيًا من يرجع الإنترنت.'
        : 'تم إرسال طلب الموعد للمكتب.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر إرسال طلب الموعد');
    } finally {
      setSending(false);
    }
  }

  return <Screen>
    <Title>طلب موعد معاينة</Title>
    <Card tone="accent">
      <Body>حدد اليوم والوقت المناسبين. الوقت يعتمد على توقيت جهازك، والمكتب يقدر يؤكد الموعد أو يغير حالته بعد استلام الطلب.</Body>
    </Card>
    <Card>
      <Caption>التاريخ</Caption>
      <Field value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" autoCapitalize="none" />
      <Caption>الوقت</Caption>
      <Field value={time} onChangeText={setTime} placeholder="HH:MM" autoCapitalize="none" />
      <Caption>ملاحظة اختيارية</Caption>
      <Field value={note} onChangeText={setNote} placeholder="مثلاً: أفضل المعاينة بعد العصر" multiline />
      <Button label={sending ? 'جاري الإرسال…' : 'إرسال طلب الموعد'} disabled={sending} onPress={submit} />
    </Card>
    {message ? <Card><Body>{message}</Body></Card> : null}
  </Screen>;
}
