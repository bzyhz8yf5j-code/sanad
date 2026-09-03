import { supabase } from '../lib/supabase';
import { validateMedia } from '../domain/media';

export interface UploadPropertyMediaInput {
  propertyId: string;
  uri: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  kind: 'image' | 'video' | 'document';
}

function safeFileName(name: string): string {
  const normalized = name.trim().replace(/[^a-zA-Z0-9._-]+/g, '-');
  return normalized || `file-${Date.now()}`;
}

function uploadNonce(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

async function uriToArrayBuffer(uri: string): Promise<ArrayBuffer> {
  const response = await fetch(uri);
  if (!response.ok && !uri.startsWith('file:') && !uri.startsWith('blob:')) throw new Error(`media_read_failed:${response.status}`);
  return await response.arrayBuffer();
}

export async function uploadPropertyMedia(input: UploadPropertyMediaInput) {
  const errors = validateMedia({
    id: 'pending', kind: input.kind, storagePath: 'pending', mimeType: input.mimeType,
    sizeBytes: input.sizeBytes, sortOrder: 0, isCover: false,
  });
  if (errors.length) throw new Error(`invalid_media:${errors.join(',')}`);
  if (!supabase) return { id: 'demo-media', storage_path: `properties/${input.propertyId}/demo/${safeFileName(input.fileName)}` };

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('not_authenticated');
  const path = `properties/${input.propertyId}/${auth.user.id}/${uploadNonce()}-${safeFileName(input.fileName)}`;
  const bytes = await uriToArrayBuffer(input.uri);
  const { error: uploadError } = await supabase.storage.from('property-media').upload(path, bytes, {
    contentType: input.mimeType,
    upsert: false,
  });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase.from('property_media').insert({
    property_id: input.propertyId,
    uploaded_by: auth.user.id,
    kind: input.kind,
    storage_path: path,
    mime_type: input.mimeType,
    size_bytes: input.sizeBytes,
  }).select('id,storage_path,mime_type,size_bytes,sort_order,is_cover').single();

  if (error) {
    await supabase.storage.from('property-media').remove([path]);
    throw error;
  }
  return data;
}

export async function createPropertyMediaSignedUrl(storagePath: string, expiresInSeconds = 900) {
  if (!supabase) return { signedUrl: undefined };
  const { data, error } = await supabase.storage.from('property-media').createSignedUrl(storagePath, expiresInSeconds);
  if (error) throw error;
  return data;
}

export async function saveMediaOrder(propertyId: string, mediaIds: string[]) {
  if (!supabase) return { demo: true };
  const { error } = await supabase.rpc('reorder_property_media', { p_property_id: propertyId, p_media_ids: mediaIds });
  if (error) throw error;
  return { ok: true };
}

export async function setPropertyCover(propertyId: string, mediaId: string) {
  if (!supabase) return { demo: true };
  const { error } = await supabase.rpc('set_property_cover', { p_property_id: propertyId, p_media_id: mediaId });
  if (error) throw error;
  return { ok: true };
}

export async function removePropertyMedia(mediaId: string) {
  if (!supabase) return { demo: true };
  const { data, error } = await supabase.from('property_media').delete().eq('id', mediaId).select('storage_path').single();
  if (error) throw error;
  if (data?.storage_path) await supabase.storage.from('property-media').remove([data.storage_path]);
  return { ok: true };
}

export async function listPropertyMedia(propertyId: string) {
  if (!supabase) return [];
  const { data, error } = await supabase.from('property_media').select('id,kind,storage_path,mime_type,size_bytes,sort_order,is_cover,created_at').eq('property_id', propertyId).order('sort_order');
  if (error) throw error;
  return data ?? [];
}
