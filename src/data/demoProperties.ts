import type { PropertySearchRecord } from '../domain/searchFilters';

export interface DemoProperty extends PropertySearchRecord {
  title: string;
  location: string;
  badge?: string;
  favorite?: boolean;
  visual: 'villa' | 'apartment' | 'land' | 'commercial';
}

export const demoProperties: DemoProperty[] = [
  { id: 'demo-villa-baghdad', title: 'فيلا فاخرة حديثة', location: 'بغداد · المنصور', governorate: 'بغداد', district: 'المنصور', neighborhood: 'الداوودي', type: 'فيلا', purpose: 'sale', price: 650_000_000, areaSqm: 520, bedrooms: 5, verified: true, favorite: true, badge: 'مميز', visual: 'villa', text: 'فيلا فاخرة حديثة واجهة حجر شارع رئيسي' },
  { id: 'demo-apartment-erbil', title: 'شقة عائلية بإطلالة', location: 'أربيل · عنكاوا', governorate: 'أربيل', district: 'عنكاوا', type: 'شقة', purpose: 'sale', price: 210_000_000, areaSqm: 168, bedrooms: 3, verified: true, badge: 'موثق', visual: 'apartment', text: 'شقة حديثة عائلية مجمع سكني' },
  { id: 'demo-land-basra', title: 'أرض سكنية مميزة', location: 'البصرة · الزبير', governorate: 'البصرة', district: 'الزبير', type: 'أرض', purpose: 'sale', price: 150_000_000, areaSqm: 400, verified: false, favorite: true, visual: 'land', text: 'أرض سكنية زاوية قريبة من الخدمات' },
  { id: 'demo-rent-anbar', title: 'دار للإيجار السنوي', location: 'الأنبار · الرمادي', governorate: 'الأنبار', district: 'الرمادي', neighborhood: 'التأميم', type: 'دار', purpose: 'rent', price: 900_000, areaSqm: 300, bedrooms: 4, verified: true, visual: 'villa', text: 'دار سكنية شارع رئيسي للإيجار السنوي' },
  { id: 'demo-shop-karbala', title: 'محل تجاري نشط', location: 'كربلاء · المركز', governorate: 'كربلاء', district: 'المركز', type: 'محل', purpose: 'rent', price: 1_500_000, areaSqm: 82, verified: true, badge: 'جديد', visual: 'commercial', text: 'محل تجاري واجهة عريضة في شارع نشط' },
];

export function getDemoProperty(id: string | undefined) {
  return demoProperties.find((property) => property.id === id);
}
