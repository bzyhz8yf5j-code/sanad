import { supabase } from '../lib/supabase';

export async function createShareLink(entityType: 'property'|'parcel', entityId: string, expiresInMinutes = 1440) {
  if (!supabase) return { token: 'demo-share-token', expiresAt: new Date(Date.now() + expiresInMinutes * 60000).toISOString() };
  const { data, error } = await supabase.functions.invoke('create-share-link', { body: { entityType, entityId, expiresInMinutes } });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data as { shareId: string; token: string; expiresAt: string };
}

export async function resolveShareLink(token: string) {
  if (!supabase) return { entityType: 'property', entity: { title: 'عقار تجريبي', area_sqm: 250 }, permissions: ['view'] };
  const { data, error } = await supabase.functions.invoke('resolve-share-link', { body: { token } });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data as { entityType: 'property'|'parcel'; entity: Record<string, unknown>; permissions: string[]; expiresAt: string };
}

export async function revokeShareLink(shareId: string) {
  if (!supabase) return;
  const { error } = await supabase.from('share_links').update({ revoked_at: new Date().toISOString() }).eq('id', shareId);
  if (error) throw error;
}
