import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '../../../../src/components/Screen';
import { Badge, Body, Button, Caption, Card, Divider, Field, Icon, SectionTitle, Title } from '../../../../src/components/Ui';
import { publicationBlocks, validatePropertyDraft, type PropertyDraftInput } from '../../../../src/domain/propertyDraft';
import { supabase } from '../../../../src/lib/supabase';
import { listMyOffices } from '../../../../src/services/offices';
import { getPropertyForEdit, publishProperty, updateProperty } from '../../../../src/services/properties';
import { listPropertyMedia } from '../../../../src/services/propertyMedia';
import { openPropertyReport } from '../../../../src/services/reports';
import { listPropertyRisks } from '../../../../src/services/risks';
import { colors } from '../../../../src/theme/colors';

interface EditForm {
  title: string;
  description: string;
  propertyType: string;
  purpose: 'sale' | 'rent';
  price: string;
  areaSqm: string;
  bedrooms: string;
  governorate: string;
  district: string;
  neighborhood: string;
}

const emptyForm: EditForm = { title: '', description: '', propertyType: 'دار', purpose: 'sale', price: '', areaSqm: '', bedrooms: '', governorate: '', district: '', neighborhood: '' };

export default function EditProperty() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [form, setForm] = useState<EditForm>(emptyForm);
  const [status, setStatus] = useState('draft');
  const [mediaCount, setMediaCount] = useState(0);
  const [coverImageCount, setCoverImageCount] = useState(0);
  const [highRiskCount, setHighRiskCount] = useState(0);
  const [officeApproved, setOfficeApproved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [property, media, risks, offices] = await Promise.all([
        getPropertyForEdit(id),
        listPropertyMedia(id),
        listPropertyRisks(id),
        listMyOffices(),
      ]);
      setForm({
        title: property.title ?? '', description: property.description ?? '', propertyType: property.property_type ?? 'دار',
        purpose: property.purpose === 'rent' ? 'rent' : 'sale', price: String(property.price ?? ''), areaSqm: String(property.area_sqm ?? ''),
        bedrooms: property.bedrooms == null ? '' : String(property.bedrooms), governorate: property.governorate ?? '', district: property.district ?? '', neighborhood: property.neighborhood ?? '',
      });
      setStatus(property.status ?? 'draft');
      setMediaCount(media.length);
      setCoverImageCount(media.filter((item) => item.kind === 'image' && item.is_cover).length);
      setHighRiskCount(risks.filter((risk) => ['high', 'critical'].includes(risk.severity) && !risk.resolved_at).length);
      setOfficeApproved(!supabase || offices.some((office) => office.id === property.office_id && office.status === 'approved'));
      setMessage('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر تحميل الإعلان');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  const readiness: PropertyDraftInput = useMemo(() => ({
    title: form.title, description: form.description, propertyType: form.propertyType, purpose: form.purpose,
    price: Number(form.price), areaSqm: Number(form.areaSqm), governorate: form.governorate,
    district: form.district, neighborhood: form.neighborhood, mediaCount, coverImageCount,
    parcelLinked: false, unresolvedHighRiskCount: highRiskCount, officeApproved,
  }), [coverImageCount, form, highRiskCount, mediaCount, officeApproved]);

  const blockers = publicationBlocks(readiness);

  function setField<Key extends keyof EditForm>(key: Key, value: EditForm[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save() {
    if (!id) return;
    const errors = validatePropertyDraft(readiness);
    if (errors.length) {
      setMessage(blockerLabel(errors[0]!));
      return;
    }
    try {
      setSaving(true);
      await updateProperty(id, {
        title: form.title.trim(), description: form.description.trim(), propertyType: form.propertyType,
        purpose: form.purpose, price: Number(form.price), areaSqm: Number(form.areaSqm),
        bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined, governorate: form.governorate.trim(),
        district: form.district.trim() || undefined, neighborhood: form.neighborhood.trim() || undefined,
      });
      setMessage(supabase ? 'تم حفظ التعديلات.' : 'تمت معاينة الحفظ محلياً فقط.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر حفظ التعديلات');
    } finally {
      setSaving(false);
    }
  }

  async function publish() {
    if (!id || blockers.length) return;
    try {
      setSaving(true);
      await publishProperty(id, readiness);
      setStatus('published');
      setMessage(supabase ? 'تم نشر الإعلان بنجاح.' : 'اجتازت المسودة فحص النشر في وضع المعاينة.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر نشر الإعلان');
    } finally {
      setSaving(false);
    }
  }

  async function report() {
    if (!id) return;
    try {
      const result = await openPropertyReport(id);
      setMessage(result.reportUrl ? 'تم إنشاء التقرير وفتح الرابط المؤقت.' : 'إنشاء PDF يحتاج اتصالاً بالخدمة الفعلية.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر إنشاء التقرير');
    }
  }

  if (loading) return <Screen><Title>تحرير الإعلان</Title><Card><Body>جاري تحميل المسودة ومتطلبات النشر…</Body></Card></Screen>;

  return <Screen>
    <View style={styles.header}><View><Title>تحرير الإعلان</Title><Caption>الخطوة 3 من 3 · المراجعة والنشر</Caption></View><Badge tone={status === 'published' ? 'success' : 'warning'}>{statusLabel(status)}</Badge></View>

    <SectionTitle>المعلومات الأساسية</SectionTitle>
    <Card>
      <LabeledField label="العنوان" field={<Field value={form.title} onChangeText={(value) => setField('title', value)} />} />
      <LabeledField label="الوصف" field={<Field multiline value={form.description} onChangeText={(value) => setField('description', value)} />} />
      <View style={styles.twoColumns}><View style={styles.column}><LabeledField label="السعر" field={<Field keyboardType="numeric" value={form.price} onChangeText={(value) => setField('price', value)} />} /></View><View style={styles.column}><LabeledField label="المساحة م²" field={<Field keyboardType="numeric" value={form.areaSqm} onChangeText={(value) => setField('areaSqm', value)} />} /></View></View>
      <LabeledField label="عدد الغرف" field={<Field keyboardType="numeric" value={form.bedrooms} onChangeText={(value) => setField('bedrooms', value)} />} />
      <View style={styles.twoColumns}><View style={styles.column}><LabeledField label="المحافظة" field={<Field value={form.governorate} onChangeText={(value) => setField('governorate', value)} />} /></View><View style={styles.column}><LabeledField label="القضاء" field={<Field value={form.district} onChangeText={(value) => setField('district', value)} />} /></View></View>
      <LabeledField label="الحي / المحلة" field={<Field value={form.neighborhood} onChangeText={(value) => setField('neighborhood', value)} />} />
      <Button label={saving ? 'جاري الحفظ…' : 'حفظ التعديلات'} icon="check" disabled={saving} onPress={save} />
    </Card>

    <SectionTitle>جاهزية النشر</SectionTitle>
    <Card tone={blockers.length ? 'default' : 'accent'}>
      <CheckRow done={officeApproved} label="المكتب معتمد" />
      <Divider />
      <CheckRow done={mediaCount > 0} label={`ملف وسائط واحد على الأقل (${mediaCount.toLocaleString('ar-IQ')})`} />
      <Divider />
      <CheckRow done={coverImageCount === 1} label="صورة غلاف واحدة" />
      <Divider />
      <CheckRow done={highRiskCount === 0} label="لا توجد مخاطر عالية غير محلولة" />
      {blockers.length ? <View style={styles.blockers}>{blockers.map((blocker) => <Caption key={blocker} style={styles.blocker}>• {blockerLabel(blocker)}</Caption>)}</View> : <Badge tone="success">الإعلان جاهز للنشر</Badge>}
    </Card>

    <View style={styles.tools}><View style={styles.grow}><Button label="الوسائط" icon="document" variant="secondary" onPress={() => router.push(`/office/property/${id}/media` as never)} /></View><View style={styles.grow}><Button label="المخاطر" icon="shield" variant="secondary" onPress={() => router.push(`/office/property/${id}/risks` as never)} /></View></View>
    <Button label={status === 'published' ? 'عرض الإعلان' : saving ? 'جاري النشر…' : 'نشر الإعلان'} icon={status === 'published' ? 'building' : 'arrow'} disabled={saving || (status !== 'published' && blockers.length > 0)} onPress={status === 'published' ? () => router.push(`/property/${id}` as never) : publish} />
    <Button label="إنشاء تقرير PDF" icon="document" variant="ghost" onPress={report} />
    {message ? <Card><Body>{message}</Body></Card> : null}
  </Screen>;
}

function LabeledField({ label, field }: { label: string; field: React.ReactNode }) { return <View style={styles.fieldGroup}><Text style={styles.label}>{label}</Text>{field}</View>; }
function CheckRow({ done, label }: { done: boolean; label: string }) { return <View style={styles.checkRow}><View style={[styles.checkIcon, done && styles.checkIconDone]}><Icon name={done ? 'check' : 'close'} color={done ? colors.navy950 : colors.muted} size={15} /></View><Body style={styles.checkLabel}>{label}</Body></View>; }
function statusLabel(status: string) { return ({ draft: 'مسودة', pending_review: 'قيد المراجعة', published: 'منشور', archived: 'مؤرشف', rejected: 'مرفوض' } as Record<string, string>)[status] ?? status; }
function blockerLabel(code: string) { return ({ title_too_short: 'العنوان قصير', property_type_required: 'نوع العقار مطلوب', price_invalid: 'السعر غير صحيح', area_invalid: 'المساحة غير صحيحة', governorate_required: 'المحافظة مطلوبة', office_not_approved: 'المكتب غير معتمد', media_required: 'أضف ملف وسائط', cover_required: 'عيّن صورة غلاف واحدة', high_risk_unresolved: 'حل المخاطر العالية أولاً' } as Record<string, string>)[code] ?? code; }

const styles = StyleSheet.create({
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  fieldGroup: { gap: 7 },
  label: { color: colors.text, fontSize: 13, fontWeight: '800', textAlign: 'right', writingDirection: 'rtl' },
  twoColumns: { flexDirection: 'row-reverse', gap: 10 },
  column: { flex: 1 },
  checkRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 9 },
  checkIcon: { width: 25, height: 25, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.navy600 },
  checkIconDone: { backgroundColor: '#65DFAA' },
  checkLabel: { flex: 1 },
  blockers: { gap: 3, padding: 10, borderRadius: 12, backgroundColor: 'rgba(228,147,53,0.08)' },
  blocker: { color: '#F0B866' },
  tools: { flexDirection: 'row-reverse', gap: 10 },
  grow: { flex: 1 },
});
