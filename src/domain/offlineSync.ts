export type OfflineMutationStatus = 'pending' | 'syncing' | 'failed';
export type OfflineFailureKind = 'conflict' | 'transient';

export interface OfflineMutation {
  id: string;
  entity: 'property' | 'parcel_note' | 'appointment' | 'message';
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  payload: Record<string, unknown>;
  baseRevision?: number;
  createdAtIso: string;
  attempts: number;
  status: OfflineMutationStatus;
  lastError?: string;
  failureKind?: OfflineFailureKind;
  nextRetryAtIso?: string;
}

export interface ConflictDecisionInput { baseRevision?: number; remoteRevision?: number; operation: OfflineMutation['operation'] }
export type ConflictDecision = 'apply' | 'conflict' | 'remote_deleted';

export const OFFLINE_MAX_ATTEMPTS = 8;

export function decideConflict(i: ConflictDecisionInput): ConflictDecision {
  if (i.remoteRevision === undefined && i.operation !== 'create') return 'remote_deleted';
  if (i.baseRevision === undefined || i.remoteRevision === undefined) return 'apply';
  return i.remoteRevision === i.baseRevision ? 'apply' : 'conflict';
}

export function nextOfflineRetry(attempts: number): number {
  const seconds = Math.min(300, 2 ** Math.min(attempts, 8));
  return seconds * 1000;
}

export function canAttemptOfflineMutation(item: Pick<OfflineMutation, 'attempts' | 'failureKind' | 'nextRetryAtIso'>, nowMs = Date.now()) {
  if (item.failureKind === 'conflict') return false;
  if (item.attempts >= OFFLINE_MAX_ATTEMPTS) return false;
  if (!item.nextRetryAtIso) return true;
  const next = Date.parse(item.nextRetryAtIso);
  return Number.isNaN(next) || next <= nowMs;
}

export function nextOfflineRetryAtIso(attempts: number, nowMs = Date.now()) {
  return new Date(nowMs + nextOfflineRetry(attempts)).toISOString();
}
