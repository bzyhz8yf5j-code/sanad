import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '../../../src/components/Screen';
import { Badge, Body, Button, Caption, Card, EmptyState, Field, Icon, SectionTitle, Title } from '../../../src/components/Ui';
import { validatePropertyDraft } from '../../../src/domain/propertyDraft';
import { supabase } from '../../../src/lib/supabase';
import { listMyOffices } from '../../../src/services/offices';
import { createProperty } from '../../../src/services/properties';
import { colors } from '../../../src/theme/colors';

interface OfficeOption { id: string; name: string; governorate: string; status: string }

const propertyTypes = ['دار', 'شقة', 'فيلا', 'أرض', 'محل', 'مكتب'];

export default function NewProperty() {
  const [offices, setOffices] = useState<OfficeOption[]>([]);
  const [officeId, setOfficeId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [propertyType, setPropertyType] = useState('دار');
  const [purpose, setPurpose] = useState<'sale' | 'rent'>('sale');
  const [currency, setCurrency] = useState<'IQD' | 'USD'>('IQD');
  const [price, setPrice] = useState('');
  const [area, setArea] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [governorate, setGovernorate] = useState('');
  const [district, setDistrict] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [message, setMessage] = useState('');
  const [savedId, setSavedId] = useState('');
  const [loadingOffices, setLoadingOffices] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadOffices() {
      try {
        const available: OfficeOption[] = supabase
          ? (await listMyOffices()).filter((office) => office.status === 'approved')
          : [{ id: 'demo-office', name: 'مكتب سند التجريبي', governorate: 'بغداد', status: 'approved' }];
        if (!active) return;
        setOffices(available);
        setOfficeId(available[0]?.id ?? '');
        setGovernorate(available[0]?.governorate ?? '');
      } catch (error) {
        if (active) setMessage(error instanceof Error ? error.message : 'تعذر تحميل المكاتب');
      } finally {
        if (active) setLoadingOffices(false);
      }
    }
    void loadOffices();
    return () => { active = false; };
  }, []);

  async function save() {
    const numericPrice = Number(price);
    const numericArea = Number(area);
    const errors = validatePropertyDraft({
      title, description, propertyType, purpose, price: numericPrice, areaSqm: numericArea,
      governorate, district, neighborhood, mediaCount: 0, coverImageCount: 0,
      parcelLinked: false, unresolvedHighRiskCount: 0, officeApproved: true,
    });
    if (!officeId) errors.unshift('office_required');
    if (errors.length) {
      setMessage(draftError(errors[0]!));
      return;
    }

    try {
      setSaving(true);
      setMessage('');
      const result = await createProperty({
        officeId, title: title.trim(), description: description.trim() || undefined,
        propertyType, purpose, price: numericPrice, currency, areaSqm: numericArea,
        bedrooms: bedrooms ? Number(bedrooms) : undefined, governorate: governorate.trim(),
        district: district.trim() || undefined, neighborhood: neighborhood.trim() || undefined,
      });
      setSavedId(result.id);
      setMessage(supabase ? 'حُفظت المسودة. أضف الصور والمستندات قبل طلب النشر.' : 'حُفظت مسودة تجريبية محلياً للمعاينة فقط.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر حفظ المسودة');
    } finally {
      setSaving(false);
    }
  }

  if (loadingOffices) return <Screen><Title>إعلان جديد</Title><Card><Body>جاري التحقق من المكتب…</Body></Card></Screen>;
  if (!offices.length) return <Screen><Title>إعلان جديد</Title><EmptyState icon="office" title="يلزم مكتب معتمد" description="نشر العقارات وإدارتها متاح فقط من خلال مكتب عقاري معتمد في سند." action={<Button compact label="طلب اعتماد مكتب" onPress={() => router.push('/offices/apply')} />} /></Screen>;

  return <Screen>
    <View style={styles.header}><View><Title>إعلان جديد</Title><Caption>الخطوة 1 من 3 · المعلومات الأساسية</Caption></View><Badge>{supabase ? 'مسودة' : 'معاينة'}</Badge></View>

    <SectionTitle>المكتب والغرض</SectionTitle>
    <Card>
      <Text style={styles.label}>المكتب</Text>
      <View style={styles.options}>{offices.map((office) => <Option key={office.id} label={office.name} selected={officeId === office.id} onPress={() => { setOfficeId(office.id); if (!governorate) setGovernorate(office.governorate); }} />)}</View>
      <Text style={styles.label}>الغرض</Text>
      <View style={styles.options}><Option label="للبيع" selected={purpose === 'sale'} onPress={() => setPurpose('sale')} /><Option label="للإيجار" selected={purpose === 'rent'} onPress={() => setPurpose('rent')} /></View>
    </Card>

    <SectionTitle>وصف العقار</SectionTitle>
    <Card>
      <LabeledField label="عنوان الإعلان" field={<Field placeholder="مثال: دار حديثة في المنصور" value={title} onChangeText={setTitle} maxLength={120} />} />
      <Text style={styles.label}>نوع العقار</Text>
      <View style={styles.options}>{propertyTypes.map((type) => <Option key={type} label={type} selected={propertyType === type} onPress={() => setPropertyType(type)} />)}</View>
      <LabeledField label="الوصف" field={<Field placeholder="المواصفات، الواجهة، الشارع والخدمات القريبة" value={description} onChangeText={setDescription} multiline maxLength={2000} />} />
    </Card>

    <SectionTitle>السعر والمساحة</SectionTitle>
    <Card>
      <View style={styles.options}><Option label="دينار عراقي" selected={currency === 'IQD'} onPress={() => setCurrency('IQD')} /><Option label="دولار" selected={currency === 'USD'} onPress={() => setCurrency('USD')} /></View>
      <View style={styles.twoColumns}><View style={styles.column}><LabeledField label="السعر" field={<Field placeholder="0" keyboardType="numeric" value={price} onChangeText={setPrice} />} /></View><View style={styles.column}><LabeledField label="المساحة م²" field={<Field placeholder="0" keyboardType="numeric" value={area} onChangeText={setArea} />} /></View></View>
      {propertyType !== 'أرض' ? <LabeledField label="عدد الغرف (اختياري)" field={<Field placeholder="0" keyboardType="numeric" value={bedrooms} onChangeText={setBedrooms} />} /> : null}
    </Card>

    <SectionTitle>الموقع</SectionTitle>
    <Card>
      <LabeledField label="المحافظة" field={<Field placeholder="مثال: بغداد" value={governorate} onChangeText={setGovernorate} />} />
      <View style={styles.twoColumns}><View style={styles.column}><LabeledField label="القضاء / المنطقة" field={<Field placeholder="المنصور" value={district} onChangeText={setDistrict} />} /></View><View style={styles.column}><LabeledField label="المحلة / الحي" field={<Field placeholder="الداوودي" value={neighborhood} onChangeText={setNeighborhood} />} /></View></View>
      <Button label="اختيار الموقع على الخريطة" icon="map" variant="secondary" onPress={() => router.push('/(tabs)/geo')} />
    </Card>

    {message ? <Card tone={savedId ? 'accent' : 'default'}><View style={styles.feedback}><Icon name={savedId ? 'check' : 'close'} color={savedId ? '#65DFAA' : '#FF9A9E'} size={20} /><Body style={[styles.feedbackCopy, !savedId && styles.error]}>{message}</Body></View></Card> : null}
    {savedId ? <View style={styles.savedActions}><View style={styles.grow}><Button label="إضافة الوسائط" icon="document" onPress={() => router.replace(`/office/property/${savedId}/media` as never)} /></View><View style={styles.grow}><Button label="تحرير المسودة" variant="secondary" onPress={() => router.push(`/office/property/${savedId}/edit` as never)} /></View></View> : <Button label={saving ? 'جاري حفظ المسودة…' : 'حفظ ومتابعة'} icon="arrow" disabled={saving} onPress={save} />}
    <Caption style={styles.disclaimer}>لا يُنشر الإعلان تلقائياً. يلزم غلاف واحد على الأقل ومراجعة متطلبات المكتب والمخاطر قبل النشر.</Caption>
  </Screen>;
}

function LabeledField({ label, field }: { label: string; field: React.ReactNode }) { return <View style={styles.fieldGroup}><Text style={styles.label}>{label}</Text>{field}</View>; }

function Option({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={({ pressed }) => [styles.option, selected && styles.optionSelected, pressed && styles.pressed]}><Text style={[styles.optionText, selected && styles.optionTextSelected]}>{label}</Text></Pressable>;
}

function draftError(code: string) {
  return ({ office_required: 'اختر مكتباً معتمداً.', title_too_short: 'اكتب عنواناً واضحاً من 5 أحرف على الأقل.', property_type_required: 'اختر نوع العقار.', price_invalid: 'أدخل سعراً أكبر من صفر.', area_invalid: 'أدخل مساحة صحيحة أكبر من صفر.', governorate_required: 'أدخل المحافظة.' } as Record<string, string>)[code] ?? 'راجع الحقول المطلوبة.';
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  label: { color: colors.text, fontSize: 13, fontWeight: '800', textAlign: 'right', writingDirection: 'rtl' },
  fieldGroup: { gap: 7 },
  options: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  option: { minHeight: 39, justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: colors.navy700, borderWidth: 1, borderColor: colors.line },
  optionSelected: { backgroundColor: 'rgba(217,165,58,0.13)', borderColor: colors.gold500 },
  optionText: { color: colors.muted, fontSize: 13, fontWeight: '800', writingDirection: 'rtl' },
  optionTextSelected: { color: colors.gold300 },
  pressed: { opacity: 0.7 },
  twoColumns: { flexDirection: 'row-reverse', gap: 10 },
  column: { flex: 1 },
  feedback: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  feedbackCopy: { flex: 1 },
  error: { color: '#FFB3B6' },
  savedActions: { flexDirection: 'row-reverse', gap: 10 },
  grow: { flex: 1 },
  disclaimer: { textAlign: 'center', paddingHorizontal: 10 },
});
