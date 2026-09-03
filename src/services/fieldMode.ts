import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

const PENDING_KEY = 'sanad.field.pending.v2';
const PENDING_SESSIONS_KEY = 'sanad.field.sessions.pending.v1';
const FIELD_DIR = `${FileSystem.documentDirectory ?? ''}sanad-field/`;

type PendingObservation = {
  syncKey: string;
  sessionId: string;
  kind: 'point'|'photo'|'note';
  longitude?: number;
  latitude?: number;
  accuracy?: number | null;
  payload?: Record<string, unknown>;
  localUri?: string;
  mimeType?: string;
  fileName?: string;
  capturedAt: string;
};

type PendingSession = {
  id: string;
  createdBy: string;
  parcelId?: string;
  officeId?: string;
  notes?: string;
  startedAt: string;
  closeRequested?: boolean;
  endedAt?: string;
};

async function currentUserId() {
  if (!supabase) return 'demo-user';
  const { data: sessionData } = await supabase.auth.getSession();
  const id = sessionData.session?.user.id;
  if (id) return id;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('not_authenticated');
  return userData.user.id;
}

async function loadPending(): Promise<PendingObservation[]> {
  const raw = await AsyncStorage.getItem(PENDING_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw) as PendingObservation[]; } catch { return []; }
}
async function savePending(items: PendingObservation[]) { await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(items.slice(-500))); }

async function loadPendingSessions(): Promise<PendingSession[]> {
  const raw = await AsyncStorage.getItem(PENDING_SESSIONS_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw) as PendingSession[]; } catch { return []; }
}
async function savePendingSessions(items: PendingSession[]) { await AsyncStorage.setItem(PENDING_SESSIONS_KEY, JSON.stringify(items.slice(-100))); }

async function queueSession(item: PendingSession) {
  const items = await loadPendingSessions();
  const i = items.findIndex(x => x.id === item.id);
  if (i >= 0) items[i] = { ...items[i], ...item };
  else items.push(item);
  await savePendingSessions(items);
}

async function persistFieldPhoto(uri: string, syncKey: string, fileName?: string) {
  if (!FileSystem.documentDirectory) return uri;
  await FileSystem.makeDirectoryAsync(FIELD_DIR, { intermediates:true }).catch(() => {});
  const rawExt = fileName?.split('.').pop() || 'jpg';
  const ext = rawExt.replace(/[^a-z0-9]/gi,'').toLowerCase() || 'jpg';
  const destination = `${FIELD_DIR}${syncKey}.${ext}`;
  await FileSystem.copyAsync({ from:uri, to:destination });
  return destination;
}

async function cleanupPersistedPhoto(uri?: string) {
  if (!uri || !FileSystem.documentDirectory || !uri.startsWith(FIELD_DIR)) return;
  await FileSystem.deleteAsync(uri, { idempotent:true }).catch(() => {});
}

export async function requestFieldPermissions() {
  const location = await Location.requestForegroundPermissionsAsync();
  const camera = await ImagePicker.requestCameraPermissionsAsync();
  return { location: location.status === 'granted', camera: camera.status === 'granted' };
}

export async function currentFieldLocation() {
  const permission = await Location.getForegroundPermissionsAsync();
  if (permission.status !== 'granted') throw new Error('location_permission_required');
  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  return {
    longitude: pos.coords.longitude,
    latitude: pos.coords.latitude,
    accuracy: pos.coords.accuracy,
    capturedAt: new Date(pos.timestamp).toISOString(),
  };
}

export async function startFieldSession(input: { parcelId?: string; officeId?: string; notes?: string }) {
  const id = Crypto.randomUUID();
  const startedAt = new Date().toISOString();
  const createdBy = await currentUserId();
  const pending: PendingSession = { id, createdBy, parcelId:input.parcelId, officeId:input.officeId, notes:input.notes, startedAt };
  if (!supabase) return { id, status:'offline_demo', started_at:startedAt, queued:true };
  try {
    const { data, error } = await supabase.from('field_sessions').insert({
      id,
      created_by: createdBy,
      parcel_id: input.parcelId || null,
      office_id: input.officeId || null,
      notes: input.notes || null,
      started_at: startedAt,
    }).select('id,status,started_at').single();
    if (error) throw error;
    return data;
  } catch {
    await queueSession(pending);
    return { id, status:'offline_pending', started_at:startedAt, queued:true };
  }
}

export async function closeFieldSession(sessionId: string) {
  const endedAt = new Date().toISOString();
  const createdBy = await currentUserId();
  if (!supabase) return { ok:true, queued:true };
  try {
    const { error } = await supabase.from('field_sessions').update({ status:'closed', ended_at:endedAt, updated_at:endedAt }).eq('id',sessionId);
    if (error) throw error;
    return { ok:true };
  } catch {
    await queueSession({ id:sessionId, createdBy, startedAt:endedAt, closeRequested:true, endedAt });
    return { ok:true, queued:true };
  }
}

export async function syncPendingFieldSessions() {
  if (!supabase) return { synced:0, remaining:(await loadPendingSessions()).length };
  const sessions = await loadPendingSessions();
  const remaining: PendingSession[] = [];
  let synced = 0;
  for (const item of sessions) {
    try {
      const { error:insertError } = await supabase.from('field_sessions').upsert({
        id:item.id,
        created_by:item.createdBy,
        parcel_id:item.parcelId || null,
        office_id:item.officeId || null,
        notes:item.notes || null,
        started_at:item.startedAt,
      }, { onConflict:'id', ignoreDuplicates:true });
      if (insertError) throw insertError;
      if (item.closeRequested) {
        const endedAt = item.endedAt || new Date().toISOString();
        const { error:closeError } = await supabase.from('field_sessions').update({ status:'closed', ended_at:endedAt, updated_at:endedAt }).eq('id',item.id);
        if (closeError) throw closeError;
      }
      synced++;
    } catch { remaining.push(item); }
  }
  await savePendingSessions(remaining);
  return { synced, remaining:remaining.length };
}

async function uploadFieldPhoto(item: PendingObservation): Promise<string | null> {
  if (!item.localUri || !supabase) return null;
  const userId = await currentUserId();
  const ext = (item.fileName?.split('.').pop() || 'jpg').replace(/[^a-z0-9]/gi,'').toLowerCase() || 'jpg';
  const path = `${userId}/${item.sessionId}/${item.syncKey}.${ext}`;
  const response = await fetch(item.localUri);
  const bytes = await response.arrayBuffer();
  const { error } = await supabase.storage.from('field-media').upload(path, bytes, { contentType:item.mimeType || 'image/jpeg', upsert:false });
  if (error && !String(error.message).toLowerCase().includes('already')) throw error;
  return path;
}

async function sendObservation(item: PendingObservation) {
  if (!supabase) return { demo:true };
  const storagePath = item.kind === 'photo' ? await uploadFieldPhoto(item) : null;
  const { data, error } = await supabase.rpc('capture_field_observation', {
    p_session:item.sessionId,
    p_kind:item.kind,
    p_lng:item.longitude ?? null,
    p_lat:item.latitude ?? null,
    p_accuracy:item.accuracy ?? null,
    p_payload:item.payload ?? {},
    p_storage_path:storagePath,
    p_captured_at:item.capturedAt,
    p_sync_key:item.syncKey,
  });
  if (error) throw error;
  await cleanupPersistedPhoto(item.localUri);
  return data;
}

async function queueOrSend(item: PendingObservation) {
  try { return await sendObservation(item); }
  catch {
    const pending = await loadPending();
    if (!pending.some(x => x.syncKey === item.syncKey)) pending.push(item);
    await savePending(pending);
    return { queued:true };
  }
}

export async function captureFieldPoint(sessionId: string, payload: Record<string,unknown> = {}) {
  const loc = await currentFieldLocation();
  return await queueOrSend({ syncKey:Crypto.randomUUID(), sessionId, kind:'point', ...loc, payload });
}

export async function captureFieldNote(sessionId: string, note: string) {
  let loc: Awaited<ReturnType<typeof currentFieldLocation>> | undefined;
  try { loc = await currentFieldLocation(); } catch { /* note can be captured without GPS */ }
  return await queueOrSend({ syncKey:Crypto.randomUUID(), sessionId, kind:'note', ...(loc ?? {}), payload:{ note }, capturedAt:loc?.capturedAt ?? new Date().toISOString() });
}

export async function captureFieldPhoto(sessionId: string) {
  const permission = await ImagePicker.getCameraPermissionsAsync();
  if (permission.status !== 'granted') throw new Error('camera_permission_required');
  const shot = await ImagePicker.launchCameraAsync({ mediaTypes:['images'], quality:0.82, exif:false });
  if (shot.canceled || !shot.assets[0]) return { cancelled:true };
  const asset = shot.assets[0];
  const syncKey = Crypto.randomUUID();
  const localUri = await persistFieldPhoto(asset.uri, syncKey, asset.fileName || undefined);
  const loc = await currentFieldLocation();
  return await queueOrSend({
    syncKey, sessionId, kind:'photo', ...loc,
    localUri, mimeType:asset.mimeType || 'image/jpeg', fileName:asset.fileName || `field-${Date.now()}.jpg`,
    payload:{ width:asset.width, height:asset.height },
  });
}

export async function syncPendingFieldObservations() {
  await syncPendingFieldSessions();
  const pending = await loadPending();
  const remaining: PendingObservation[] = [];
  let synced = 0;
  for (const item of pending) {
    try { await sendObservation(item); synced++; }
    catch { remaining.push(item); }
  }
  await savePending(remaining);
  return { synced, remaining:remaining.length };
}

export async function pendingFieldObservationCount() { return (await loadPending()).length; }
export async function pendingFieldSessionCount() { return (await loadPendingSessions()).length; }
