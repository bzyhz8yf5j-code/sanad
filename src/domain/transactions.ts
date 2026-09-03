import type { TransactionStatus } from '../types/domain';

const allowed: Record<TransactionStatus, TransactionStatus[]> = {
  opened: ['documents', 'cancelled'],
  documents: ['legal_review', 'cancelled'],
  legal_review: ['registration', 'documents', 'cancelled'],
  registration: ['completed', 'legal_review', 'cancelled'],
  completed: [],
  cancelled: [],
};

export function canMoveTransaction(from: TransactionStatus, to: TransactionStatus): boolean {
  return allowed[from].includes(to);
}

export function makeTrackingCode(random: () => number = Math.random): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 10; i++) result += alphabet[Math.floor(random() * alphabet.length)]!;
  return result;
}
