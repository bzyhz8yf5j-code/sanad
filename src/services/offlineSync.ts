import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import {
  canAttemptOfflineMutation,
  decideConflict,
  nextOfflineRetryAtIso,
  OFFLINE_MAX_ATTEMPTS,
  type OfflineMutation,
} from '../domain/offlineSync';

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

export async function retryTransientOfflineMutations() {
  const queue = await loadOfflineQueue();
  const next = queue.map((item) => item.status === 'failed' && item.failureKind === 'transient'
    ? { ...item, attempts: 0, status: 'pending' as const, failureKind: undefined, nextRetryAtIso: undefined, lastError: undefined }
    : item);
  await saveOfflineQueue(next);
  return next.filter((item) => item.status === 'pending').length;
}

export async function syncOfflinePropertyQueue() {
  const queue = await loadOfflineQueue();
  if (!supabase) return { synced: 0, conflicts: 0, deferred: queue.length, exhausted: 0, remaining: queue.length, demo: true };

  let synced = 0;
  let conflicts = 0;
  let deferred = 0;
  let exhausted = 0;
  const next: OfflineMutation[] = [];

  for (const item of queue) {
    if (item.entity !== 'property') { next.push(item); continue; }

    if (item.failureKind === 'conflict') {
      conflicts++;
      next.push(item);
      continue;
    }

    if (item.attempts >= OFFLINE_MAX_ATTEMPTS) {
      exhausted++;
      next.push(item);
      continue;
    }

    if (!canAttemptOfflineMutation(item)) {
      deferred++;
      next.push(item);
      continue;
    }

    try {
      const { data: remote, error: readError } = await supabase.from('properties').select('id,revision').eq('id', item.entityId).maybeSingle();
      if (readError) throw readError;
      const decision = decideConflict({ baseRevision: item.baseRevision, remoteRevision: remote?.revision, operation: item.operation });

      if (decision !== 'apply') {
        conflicts++;
        next.push({
          ...item,
          status: 'failed',
          attempts: item.attempts + 1,
          failureKind: 'conflict',
          lastError: decision,
          nextRetryAtIso: undefined,
        });
        continue;
      }

      if (item.operation === 'update') {
        const { error } = await supabase.from('properties').update(item.payload).eq('id', item.entityId).eq('revision', item.baseRevision ?? remote?.revision ?? 0);
        if (error) throw error;
      } else if (item.operation === 'delete') {
        const { error } = await supabase.from('properties').update({ status: 'archived' }).eq('id', item.entityId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('properties').insert(item.payload);
        if (error) throw error;
      }
      synced++;
    } catch (error) {
      const attempts = item.attempts + 1;
      next.push({
        ...item,
        status: 'failed',
        attempts,
        failureKind: 'transient',
        lastError: error instanceof Error ? error.message : 'sync_failed',
        nextRetryAtIso: attempts >= OFFLINE_MAX_ATTEMPTS ? undefined : nextOfflineRetryAtIso(attempts),
      });
    }
  }

  await saveOfflineQueue(next);
  return { synced, conflicts, deferred, exhausted, remaining: next.length };
}
