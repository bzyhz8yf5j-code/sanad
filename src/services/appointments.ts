import * as Crypto from 'expo-crypto';
import { isLikelyTransientSyncError } from '../domain/offlineSync';
import { supabase } from '../lib/supabase';
import { enqueueOfflineMutation } from './offlineSync';

async function currentUserId() {
  if (!supabase) return 'demo-user';
  const { data: session } = await supabase.auth.getSession();
  if (session.session?.user.id) return session.session.user.id;
  const { data: auth, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!auth.user) throw new Error('not_authenticated');
  return auth.user.id;
}

export async function requestAppointment(input: {
  propertyId: string;
  officeId: string;
  startsAt: string;
  note?: string;
}) {
  const startsAtMs = Date.parse(input.startsAt);
  if (!Number.isFinite(startsAtMs) || startsAtMs <= Date.now()) throw new Error('invalid_appointment_time');

  if (!supabase) {
    return { id: 'demo-appointment', status: 'requested', starts_at: input.startsAt, queued: false };
  }

  const requesterId = await currentUserId();
  const id = Crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const payload = {
    id,
    property_id: input.propertyId,
    office_id: input.officeId,
    requester_id: requesterId,
    starts_at: input.startsAt,
    status: 'requested',
    note: input.note?.trim() || null,
    created_at: createdAt,
  };

  try {
    const { data, error } = await supabase
      .from('appointments')
      .insert(payload)
      .select('id,status,starts_at')
      .single();
    if (error) throw error;
    return {
      id: data?.id ?? id,
      status: data?.status ?? 'requested',
      starts_at: data?.starts_at ?? input.startsAt,
      queued: false,
    };
  } catch (error) {
    if (!isLikelyTransientSyncError(error)) throw error;
    await enqueueOfflineMutation({
      id: 'appointment:' + id,
      entity: 'appointment',
      entityId: id,
      operation: 'create',
      payload,
      createdAtIso: createdAt,
    });
    return { id, status: 'requested', starts_at: input.startsAt, queued: true };
  }
}

export async function listMyAppointments(limit = 50) {
  if (!supabase) return [];
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user.id;
  if (!userId) return [];

  const { data, error } = await supabase
    .from('appointments')
    .select('id,property_id,office_id,starts_at,status,note,created_at')
    .eq('requester_id', userId)
    .order('starts_at', { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}
