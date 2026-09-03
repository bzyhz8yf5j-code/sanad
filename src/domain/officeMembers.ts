export type OfficeMemberRole = 'owner' | 'manager' | 'agent' | 'viewer';
export type OfficeMemberPermission =
  | 'office.read' | 'office.settings' | 'member.invite' | 'member.remove'
  | 'property.create' | 'property.edit' | 'property.publish'
  | 'transaction.create' | 'transaction.edit'
  | 'message.reply' | 'appointment.manage' | 'parcel.upload';

const matrix: Record<OfficeMemberRole, ReadonlySet<OfficeMemberPermission>> = {
  owner: new Set(['office.read','office.settings','member.invite','member.remove','property.create','property.edit','property.publish','transaction.create','transaction.edit','message.reply','appointment.manage','parcel.upload']),
  manager: new Set(['office.read','member.invite','property.create','property.edit','property.publish','transaction.create','transaction.edit','message.reply','appointment.manage','parcel.upload']),
  agent: new Set(['office.read','property.create','property.edit','transaction.create','message.reply','appointment.manage','parcel.upload']),
  viewer: new Set(['office.read']),
};

export function officeMemberCan(role: OfficeMemberRole, permission: OfficeMemberPermission): boolean {
  return matrix[role].has(permission);
}

export function canAssignOfficeRole(actor: OfficeMemberRole, target: OfficeMemberRole): boolean {
  if (actor === 'owner') return target !== 'owner';
  if (actor === 'manager') return target === 'agent' || target === 'viewer';
  return false;
}
