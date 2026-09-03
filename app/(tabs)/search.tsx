import { useMemo, useState } from 'react';
import { Screen } from '../../src/components/Screen';
import { Body, Card, Field, Title } from '../../src/components/Ui';
import { matchesProperty, type PropertySearchRecord } from '../../src/domain/searchFilters';

const demo: PropertySearchRecord[] = [
  { id: '1', governorate: 'الأنبار', district: 'الرمادي', neighborhood: 'التأميم', type: 'دار', purpose: 'sale', price: 180000000, areaSqm: 300, bedrooms: 4, verified: true, text: 'دار سكنية شارع رئيسي' },
  { id: '2', governorate: 'بغداد', district: 'المنصور', type: 'شقة', purpose: 'rent', price: 900000, areaSqm: 145, bedrooms: 3, verified: true, text: 'شقة مفروشة' },
];

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const results = useMemo(() => demo.filter((r) => matchesProperty(r, { query, verifiedOnly })), [query, verifiedOnly]);
  return <Screen><Title>البحث العقاري</Title><Field value={query} onChangeText={setQuery} placeholder="المحافظة، الحي، نوع العقار..." />
    <Body onPress={() => setVerifiedOnly((v) => !v)}>الموثق فقط: {verifiedOnly ? 'نعم' : 'لا'}</Body>
    {results.map((r) => <Card key={r.id}><Title>{r.type} — {r.governorate}</Title><Body>{r.district ?? ''} · {r.areaSqm} م² · {r.price.toLocaleString('ar-IQ')} د.ع</Body></Card>)}
  </Screen>;
}
