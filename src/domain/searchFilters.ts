export interface PropertySearchRecord {
  id: string;
  governorate: string;
  district?: string;
  neighborhood?: string;
  type: string;
  purpose: 'sale' | 'rent';
  price: number;
  areaSqm: number;
  bedrooms?: number;
  officeId?: string;
  verified?: boolean;
  text?: string;
}

export interface PropertyFilters {
  query?: string;
  governorate?: string;
  district?: string;
  neighborhood?: string;
  type?: string;
  purpose?: 'sale' | 'rent';
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  minBedrooms?: number;
  verifiedOnly?: boolean;
  officeId?: string;
}

const normalize = (value: string) => value
  .toLowerCase()
  .replace(/[إأآ]/g, 'ا')
  .replace(/ى/g, 'ي')
  .replace(/ة/g, 'ه')
  .replace(/[\u064B-\u065F]/g, '')
  .trim();

export function matchesProperty(record: PropertySearchRecord, f: PropertyFilters): boolean {
  if (f.governorate && record.governorate !== f.governorate) return false;
  if (f.district && record.district !== f.district) return false;
  if (f.neighborhood && record.neighborhood !== f.neighborhood) return false;
  if (f.type && record.type !== f.type) return false;
  if (f.purpose && record.purpose !== f.purpose) return false;
  if (f.minPrice != null && record.price < f.minPrice) return false;
  if (f.maxPrice != null && record.price > f.maxPrice) return false;
  if (f.minArea != null && record.areaSqm < f.minArea) return false;
  if (f.maxArea != null && record.areaSqm > f.maxArea) return false;
  if (f.minBedrooms != null && (record.bedrooms ?? 0) < f.minBedrooms) return false;
  if (f.verifiedOnly && !record.verified) return false;
  if (f.officeId && record.officeId !== f.officeId) return false;
  if (f.query) {
    const haystack = normalize([record.governorate, record.district, record.neighborhood, record.type, record.text].filter(Boolean).join(' '));
    if (!haystack.includes(normalize(f.query))) return false;
  }
  return true;
}
