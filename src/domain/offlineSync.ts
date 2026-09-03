export type OfflineMutationStatus = 'pending' | 'syncing' | 'failed';
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
}

export interface ConflictDecisionInput { baseRevision?: number; remoteRevision?: number; operation: OfflineMutation['operation'] }
export type ConflictDecision = 'apply' | 'conflict' | 'remote_deleted';

export function decideConflict(i: ConflictDecisionInput): ConflictDecision {
  if (i.remoteRevision === undefined && i.operation !== 'create') return 'remote_deleted';
  if (i.baseRevision === undefined || i.remoteRevision === undefined) return 'apply';
  return i.remoteRevision === i.baseRevision ? 'apply' : 'conflict';
}

export function nextOfflineRetry(attempts: number): number {
  const seconds = Math.min(300, 2 ** Math.min(attempts, 8));
  return seconds * 1000;
}
