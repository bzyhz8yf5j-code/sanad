export type AccountDeletionStatus = 'requested' | 'under_review' | 'blocked' | 'completed' | 'cancelled';

export const activeAccountDeletionStatuses: AccountDeletionStatus[] = ['requested','under_review','blocked'];

export function isAccountDeletionActive(status?: AccountDeletionStatus | null) {
  return Boolean(status && activeAccountDeletionStatuses.includes(status));
}

export function canCancelAccountDeletion(status?: AccountDeletionStatus | null) {
  return isAccountDeletionActive(status);
}

export function accountDeletionStatusLabel(status: AccountDeletionStatus) {
  switch (status) {
    case 'requested': return 'تم استلام الطلب';
    case 'under_review': return 'قيد المراجعة';
    case 'blocked': return 'متوقف مؤقتًا';
    case 'completed': return 'اكتمل الحذف';
    case 'cancelled': return 'ملغي';
  }
}
