export type OfflineMutationStatus = 'pending' | 'syncing' | 'failed';
export type OfflineFailureKind = 'conflict' | 'transient' | 'permanent';
export type OfflineEntity = 'property' | 'appointment' | 'message';

export interface OfflineMutation {
  id: string;
  entity: OfflineEntity;
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

export interface ConflictDecisionInput {
  baseRevision?: number;
  remoteRevision?: number;
  operation: OfflineMutation['operation'];
}

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

export function canAttemptOfflineMutation(
  item: Pick<OfflineMutation, 'attempts' | 'failureKind' | 'nextRetryAtIso'>,
  nowMs = Date.now(),
) {
  if (item.failureKind === 'conflict' || item.failureKind === 'permanent') return false;
  if (item.attempts >= OFFLINE_MAX_ATTEMPTS) return false;
  if (!item.nextRetryAtIso) return true;
  const next = Date.parse(item.nextRetryAtIso);
  return Number.isNaN(next) || next <= nowMs;
}

export function nextOfflineRetryAtIso(attempts: number, nowMs = Date.now()) {
  return new Date(nowMs + nextOfflineRetry(attempts)).toISOString();
}

function errorCode(error: unknown) {
  if (!error || typeof error !== 'object') return '';
  const value = (error as { code?: unknown }).code;
  return typeof value === 'string' ? value.toUpperCase() : '';
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message.toLowerCase();
  if (!error || typeof error !== 'object') return String(error ?? '').toLowerCase();
  const value = (error as { message?: unknown }).message;
  return typeof value === 'string' ? value.toLowerCase() : '';
}

export function isDuplicateMutationError(error: unknown) {
  return errorCode(error) === '23505';
}

export function isLikelyTransientSyncError(error: unknown) {
  const code = errorCode(error);
  if (['42501', '23503', '23514', '22P02'].includes(code)) return false;
  if (code.startsWith('PGRST')) return false;

  const message = errorMessage(error);
  if (
    message.includes('permission') ||
    message.includes('not authorized') ||
    message.includes('not_authorized') ||
    message.includes('row-level security') ||
    message.includes('violates check constraint') ||
    message.includes('foreign key')
  ) return false;

  if (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('timeout') ||
    message.includes('timed out') ||
    message.includes('connection') ||
    message.includes('offline') ||
    message.includes('socket')
  ) return true;

  return true;
}
