import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import {
  canAttemptOfflineMutation,
  decideConflict,
  isDuplicateMutationError,
  isLikelyTransientSyncError,
  nextOfflineRetryAtIso,
  OFFLINE_MAX_ATTEMPTS,
  type OfflineMutation,
} from '../domain/offlineSync';

const QUEUE_KEY = 'sanad.offline.mutations.v3';

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
  const next = { ...item, attempts: 0, status: 'pending' as const };
  const index = queue.findIndex((queued) => queued.id === item.id);
  if (index >= 0) queue[index] = next;
  else queue.push(next);
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

async function applyPropertyMutation(item: OfflineMutation) {
  if (!supabase) throw new Error('supabase_unavailable');

  const { data: remote, error: readError } = await supabase
    .from('properties')
    .select('id,revision')
    .eq('id', item.entityId)
    .maybeSingle();
  if (readError) throw readError;

  const decision = decideConflict({
    baseRevision: item.baseRevision,
    remoteRevision: remote?.revision,
    operation: item.operation,
  });
  if (decision !== 'apply') return { conflict: decision };

  if (item.operation === 'update') {
    const { error } = await supabase
      .from('properties')
      .update(item.payload)
      .eq('id', item.entityId)
      .eq('revision', item.baseRevision ?? remote?.revision ?? 0);
    if (error) throw error;
  } else if (item.operation === 'delete') {
    const { error } = await supabase.from('properties').update({ status: 'archived' }).eq('id', item.entityId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('properties').insert(item.payload);
    if (error && !isDuplicateMutationError(error)) throw error;
  }

  return { conflict: null as string | null };
}

async function applyCreateOnlyMutation(item: OfflineMutation, table: 'messages' | 'appointments') {
  if (!supabase) throw new Error('supabase_unavailable');
  if (item.operation !== 'create') return { permanent: 'unsupported_operation' };

  const { error } = await supabase.from(table).insert(item.payload);
  if (error && !isDuplicateMutationError(error)) throw error;
  return { permanent: null as string | null };
}

export async function syncOfflineQueue() {
  const queue = await loadOfflineQueue();
  if (!supabase) {
    return {
      synced: 0,
      conflicts: 0,
      deferred: queue.length,
      exhausted: 0,
      permanent: 0,
      remaining: queue.length,
      demo: true,
    };
  }

  let synced = 0;
  let conflicts = 0;
  let deferred = 0;
  let exhausted = 0;
  let permanent = 0;
  const next: OfflineMutation[] = [];

  for (const item of queue) {
    if (item.failureKind === 'conflict') {
      conflicts++;
      next.push(item);
      continue;
    }
    if (item.failureKind === 'permanent') {
      permanent++;
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
      if (item.entity === 'property') {
        const result = await applyPropertyMutation(item);
        if (result.conflict) {
          conflicts++;
          next.push({
            ...item,
            status: 'failed',
            attempts: item.attempts + 1,
            failureKind: 'conflict',
            lastError: result.conflict,
            nextRetryAtIso: undefined,
          });
          continue;
        }
      } else {
        const table = item.entity === 'message' ? 'messages' : 'appointments';
        const result = await applyCreateOnlyMutation(item, table);
        if (result.permanent) {
          permanent++;
          next.push({
            ...item,
            status: 'failed',
            attempts: item.attempts + 1,
            failureKind: 'permanent',
            lastError: result.permanent,
            nextRetryAtIso: undefined,
          });
          continue;
        }
      }
      synced++;
    } catch (error) {
      const attempts = item.attempts + 1;
      const transient = isLikelyTransientSyncError(error);
      if (!transient) permanent++;
      next.push({
        ...item,
        status: 'failed',
        attempts,
        failureKind: transient ? 'transient' : 'permanent',
        lastError: error instanceof Error ? error.message : 'sync_failed',
        nextRetryAtIso: transient && attempts < OFFLINE_MAX_ATTEMPTS
          ? nextOfflineRetryAtIso(attempts)
          : undefined,
      });
    }
  }

  await saveOfflineQueue(next);
  return { synced, conflicts, deferred, exhausted, permanent, remaining: next.length };
}

/** @deprecated Use syncOfflineQueue. Kept temporarily for compatibility with older callers. */
export const syncOfflinePropertyQueue = syncOfflineQueue;
