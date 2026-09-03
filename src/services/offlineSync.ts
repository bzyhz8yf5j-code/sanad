import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { decideConflict, type OfflineMutation } from '../domain/offlineSync';

const QUEUE_KEY = 'sanad.offline.mutations.v2';

export async function loadOfflineQueue(): Promise<OfflineMutation[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw) as OfflineMutation[]; } catch { return []; }
}

export async function saveOfflineQueue(queue: OfflineMutation[]) {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-1000)));
}

export async function enqueueOfflineMutation(item: Omit<OfflineMutation,'attempts'|'status'>) {
  const queue = await loadOfflineQueue();
  queue.push({ ...item, attempts: 0, status: 'pending' });
  await saveOfflineQueue(queue);
}

export async function syncOfflinePropertyQueue() {
  const queue = await loadOfflineQueue();
  if (!supabase) return { synced: 0, conflicts: queue.length, demo: true };
  let synced = 0; let conflicts = 0;
  const next: OfflineMutation[] = [];
  for (const item of queue) {
    if (item.entity !== 'property') { next.push(item); continue; }
    try {
      const { data: remote, error: readError } = await supabase.from('properties').select('id,revision').eq('id', item.entityId).maybeSingle();
      if (readError) throw readError;
      const decision = decideConflict({ baseRevision: item.baseRevision, remoteRevision: remote?.revision, operation: item.operation });
      if (decision !== 'apply') { conflicts++; next.push({ ...item, status:'failed', attempts:item.attempts+1, lastError:decision }); continue; }
      if (item.operation === 'update') {
        const { error } = await supabase.from('properties').update(item.payload).eq('id', item.entityId).eq('revision', item.baseRevision ?? remote?.revision ?? 0);
        if (error) throw error;
      } else if (item.operation === 'delete') {
        const { error } = await supabase.from('properties').update({status:'archived'}).eq('id', item.entityId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('properties').insert(item.payload);
        if (error) throw error;
      }
      synced++;
    } catch (e) {
      next.push({ ...item, status:'failed', attempts:item.attempts+1, lastError:e instanceof Error ? e.message : 'sync_failed' });
    }
  }
  await saveOfflineQueue(next);
  return { synced, conflicts, remaining: next.length };
}
