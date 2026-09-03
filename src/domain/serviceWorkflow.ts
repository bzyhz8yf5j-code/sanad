export type ServiceRequestStatus = 'submitted' | 'under_review' | 'needs_info' | 'approved' | 'rejected' | 'closed';

const transitions: Record<ServiceRequestStatus, ServiceRequestStatus[]> = {
  submitted: ['under_review','rejected'],
  under_review: ['needs_info','approved','rejected','closed'],
  needs_info: ['under_review','closed'],
  approved: ['closed'],
  rejected: ['closed'],
  closed: [],
};

export function canMoveServiceRequest(from: ServiceRequestStatus, to: ServiceRequestStatus): boolean {
  return transitions[from].includes(to);
}

export function requireServiceDecisionNote(to: ServiceRequestStatus, note?: string): void {
  if ((to === 'rejected' || to === 'needs_info') && !note?.trim()) throw new Error('decision_note_required');
}
