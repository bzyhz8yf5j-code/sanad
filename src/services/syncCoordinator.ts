import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { pendingFieldObservationCount, pendingFieldSessionCount, syncPendingFieldObservations } from './fieldMode';
import { loadOfflineQueue, syncOfflinePropertyQueue } from './offlineSync';

const SYNC_META_KEY = 'sanad.sync.last.v1';

export type SyncSource = 'startup' | 'foreground' | 'manual';

export interface SyncSummary {
  completedAt: string;
  source: SyncSource;
  propertySynced: number;
  propertyRemaining: number;
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
  const [propertyQueue, fieldObservations, fieldSessions] = await Promise.all([
    loadOfflineQueue(),
    pendingFieldObservationCount(),
    pendingFieldSessionCount(),
  ]);

  if (!propertyQueue.length && fieldObservations + fieldSessions === 0) {
    return {
      completedAt: new Date().toISOString(),
      source,
      propertySynced: 0,
      propertyRemaining: 0,
      fieldSynced: 0,
      fieldRemaining: 0,
      skipped: true,
    };
  }

  let propertySynced = 0;
  let propertyRemaining = propertyQueue.length;
  let fieldSynced = 0;
  let fieldRemaining = fieldObservations + fieldSessions;

  if (propertyQueue.length) {
    const property = await syncOfflinePropertyQueue();
    propertySynced = property.synced;
    propertyRemaining = property.remaining;
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
    propertySynced,
    propertyRemaining,
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
