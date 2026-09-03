import { supabase } from '../lib/supabase';
import { publicationBlocks, type PropertyDraftInput } from '../domain/propertyDraft';

export interface CreatePropertyInput {
  officeId: string;
  parcelId?: string;
  title: string;
  description?: string;
  propertyType: string;
  purpose: 'sale' | 'rent';
  price: number;
  currency?: 'IQD' | 'USD';
  areaSqm: number;
  bedrooms?: number;
  governorate: string;
  district?: string;
  neighborhood?: string;
}

export async function createProperty(input: CreatePropertyInput) {
  if (!supabase) return { id: 'demo-property', status: 'draft' };
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('not_authenticated');
  const { data, error } = await supabase.from('properties').insert({
    office_id: input.officeId, parcel_id: input.parcelId ?? null, created_by: auth.user.id,
    title: input.title, description: input.description ?? null, property_type: input.propertyType,
    purpose: input.purpose, price: input.price, currency: input.currency ?? 'IQD', area_sqm: input.areaSqm,
    bedrooms: input.bedrooms ?? null, governorate: input.governorate, district: input.district ?? null,
    neighborhood: input.neighborhood ?? null, status: 'draft',
  }).select('id,status').single();
  if (error) throw error;
  return data;
}

export async function updateProperty(propertyId: string, patch: Partial<CreatePropertyInput>) {
  if (!supabase) return { id: propertyId, demo: true };
  const payload: Record<string, unknown> = {};
  const map: Record<string,string> = { officeId:'office_id', parcelId:'parcel_id', propertyType:'property_type', areaSqm:'area_sqm' };
  for (const [key,value] of Object.entries(patch)) payload[map[key] ?? key] = value;
  const { data, error } = await supabase.from('properties').update(payload).eq('id', propertyId).select('id,status').single();
  if (error) throw error;
  return data;
}

export async function archiveProperty(propertyId: string) {
  if (!supabase) return { id: propertyId, status: 'archived' };
  const { data, error } = await supabase.from('properties').update({ status: 'archived' }).eq('id', propertyId).select('id,status').single();
  if (error) throw error;
  return data;
}

export async function publishProperty(propertyId: string, readiness: PropertyDraftInput) {
  const blocks = publicationBlocks(readiness);
  if (blocks.length) throw new Error(`publication_blocked:${blocks.join(',')}`);
  if (!supabase) return { id: propertyId, status: 'published' };
  const { data, error } = await supabase.from('properties').update({ status: 'published', published_at: new Date().toISOString() }).eq('id', propertyId).select('id,status').single();
  if (error) throw error;
  return data;
}

export async function getPropertyForEdit(propertyId: string) {
  if (!supabase) return { id: propertyId, title: 'عقار تجريبي', description: '', price: 0, area_sqm: 0, district: '', neighborhood: '', revision: 1 };
  const { data, error } = await supabase.from('properties').select('id,office_id,parcel_id,title,description,property_type,purpose,price,currency,area_sqm,bedrooms,governorate,district,neighborhood,status,revision,updated_at').eq('id', propertyId).single();
  if (error) throw error;
  return data;
}
