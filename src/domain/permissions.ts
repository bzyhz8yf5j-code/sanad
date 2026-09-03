import type { Role } from '../types/domain';

export type Permission =
  | 'property.read' | 'property.create' | 'property.publish'
  | 'parcel.read' | 'parcel.document.upload' | 'parcel.align'
  | 'office.manage' | 'office.members.manage'
  | 'valuation.create' | 'engineering.verify'
  | 'professional.apply' | 'professional.review'
  | 'admin.review' | 'admin.audit' | 'admin.mapSources';

const rolePermissions: Record<Role, ReadonlySet<Permission>> = {
  citizen: new Set(['property.read', 'parcel.read', 'professional.apply']),
  office: new Set(['property.read', 'property.create', 'property.publish', 'parcel.read', 'parcel.document.upload', 'office.manage', 'office.members.manage']),
  engineer: new Set(['property.read', 'parcel.read', 'parcel.document.upload', 'parcel.align', 'engineering.verify']),
  valuer: new Set(['property.read', 'parcel.read', 'valuation.create']),
  supervisor: new Set(['property.read', 'parcel.read', 'parcel.align', 'professional.review', 'admin.review', 'admin.audit']),
  admin: new Set(['property.read', 'property.create', 'property.publish', 'parcel.read', 'parcel.document.upload', 'parcel.align', 'office.manage', 'office.members.manage', 'valuation.create', 'engineering.verify', 'professional.review', 'admin.review', 'admin.audit', 'admin.mapSources']),
};

export function can(role: Role, permission: Permission): boolean {
  return rolePermissions[role].has(permission);
}

export function assertPermission(role: Role, permission: Permission): void {
  if (!can(role, permission)) throw new Error(`permission_denied:${role}:${permission}`);
}
