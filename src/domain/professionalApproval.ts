import type { ApprovalStatus, Role } from '../types/domain';

export type ProfessionalType = 'engineer' | 'valuer';

export interface ProfessionalApplication {
  id: string;
  applicantId: string;
  type: ProfessionalType;
  status: ApprovalStatus;
  licenseNumber: string;
  issuingAuthority: string;
  governorates: string[];
  rejectionReason?: string;
}

const transitions: Record<ApprovalStatus, ApprovalStatus[]> = {
  draft: ['submitted'],
  submitted: ['under_review', 'rejected'],
  under_review: ['approved', 'rejected'],
  approved: ['suspended'],
  rejected: ['submitted'],
  suspended: ['under_review', 'approved'],
};

export function canTransitionProfessional(from: ApprovalStatus, to: ApprovalStatus): boolean {
  return transitions[from].includes(to);
}

export function transitionProfessional(
  application: ProfessionalApplication,
  to: ApprovalStatus,
  actorRole: Role,
  reason?: string,
): ProfessionalApplication {
  const selfAllowed = application.status === 'draft' && to === 'submitted';
  const reviewerAllowed = actorRole === 'supervisor' || actorRole === 'admin';
  if (!selfAllowed && !reviewerAllowed) throw new Error('professional_transition_not_authorized');
  if (!canTransitionProfessional(application.status, to)) throw new Error(`invalid_transition:${application.status}:${to}`);
  if (to === 'rejected' && !reason?.trim()) throw new Error('rejection_reason_required');
  return { ...application, status: to, rejectionReason: to === 'rejected' ? reason!.trim() : undefined };
}
