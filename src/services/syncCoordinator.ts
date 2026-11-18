import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { pendingFieldObservationCount, pendingFieldSessionCount, syncPendingFieldObservations } from './fieldMode';
import { loadOfflineQueue, syncOfflineQueue } from './offlineSync';

const SYNC_META_KEY = 'sanad.sync.last.v1';

export type SyncSource = 'startup' | 'foreground' | 'manual';

export interface SyncSummary {
  completedAt: string;
  source: SyncSource;
  queueSynced: number;
  queueRemaining: number;
  fieldSynced: number;
  fieldRemaining: number;
  skipped: boolean;
}

let inFlight: Promise<SyncSummary> | null = null;

export async function loadLastSyncSummary(): Promise<SyncSummary | null> {
  const raw = await AsyncStorage.getItem(SYNC_META_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as SyncSummary; } catch { return null; }
}

async function runSync(source: SyncSource): Promise<SyncSummary> {
  const [queue, fieldObservations, fieldSessions] = await Promise.all([
    loadOfflineQueue(),
    pendingFieldObservationCount(),
    pendingFieldSessionCount(),
  ]);

  if (!queue.length && fieldObservations + fieldSessions === 0) {
    return {
      completedAt: new Date().toISOString(),
      source,
      queueSynced: 0,
      queueRemaining: 0,
      fieldSynced: 0,
      fieldRemaining: 0,
      skipped: true,
    };
  }

  let queueSynced = 0;
  let queueRemaining = queue.length;
  let fieldSynced = 0;
  let fieldRemaining = fieldObservations + fieldSessions;

  if (queue.length) {
    const result = await syncOfflineQueue();
    queueSynced = result.synced;
    queueRemaining = result.remaining;
  }

  if (fieldObservations + fieldSessions > 0) {
    const field = await syncPendingFieldObservations();
    fieldSynced = field.synced;
    const remainingSessions = await pendingFieldSessionCount();
    fieldRemaining = field.remaining + remainingSessions;
  }

  const summary: SyncSummary = {
    completedAt: new Date().toISOString(),
    source,
    queueSynced,
    queueRemaining,
    fieldSynced,
    fieldRemaining,
    skipped: false,
  };
  await AsyncStorage.setItem(SYNC_META_KEY, JSON.stringify(summary));
  return summary;
}

export async function syncPendingWork(source: SyncSource = 'manual'): Promise<SyncSummary> {
  if (inFlight) return inFlight;
  inFlight = runSync(source).finally(() => { inFlight = null; });
  return inFlight;
}

export function bindForegroundSync() {
  let previousState = AppState.currentState;
  const startupTimer = setTimeout(() => {
    void syncPendingWork('startup').catch(() => {});
  }, 1200);

  const subscription = AppState.addEventListener('change', (nextState) => {
    const becameActive = nextState === 'active' && previousState !== 'active';
    previousState = nextState;
    if (becameActive) void syncPendingWork('foreground').catch(() => {});
  });

  return () => {
    clearTimeout(startupTimer);
    subscription.remove();
  };
}
