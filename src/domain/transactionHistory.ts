import type { TransactionStatus } from '../types/domain';

export interface TransactionHistoryItem {
  status: TransactionStatus;
  note?: string | null;
  visibleToClient: boolean;
  createdAtIso: string;
}

export function visibleTransactionHistory(items: TransactionHistoryItem[]): TransactionHistoryItem[] {
  return [...items]
    .filter((item) => item.visibleToClient)
    .sort((a, b) => Date.parse(a.createdAtIso) - Date.parse(b.createdAtIso));
}

export function transactionProgress(status: TransactionStatus): number {
  const map: Record<TransactionStatus, number> = {
    opened: 10,
    documents: 30,
    legal_review: 55,
    registration: 80,
    completed: 100,
    cancelled: 0,
  };
  return map[status];
}
