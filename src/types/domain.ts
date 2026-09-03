export type Role = 'citizen' | 'office' | 'engineer' | 'valuer' | 'supervisor' | 'admin';
export type ApprovalStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'suspended';
export type MediaKind = 'image' | 'video' | 'document';
export type PropertyStatus = 'draft' | 'pending_review' | 'published' | 'archived' | 'rejected';
export type TransactionStatus = 'opened' | 'documents' | 'legal_review' | 'registration' | 'completed' | 'cancelled';

export interface GeoPoint { lat: number; lng: number }
export interface ControlPair { source: GeoPoint; target: GeoPoint }
export interface ParcelSummary {
  id: string;
  governorate: string;
  district?: string;
  neighborhood?: string;
  blockNumber?: string;
  parcelNumber?: string;
  areaSqm?: number;
}
