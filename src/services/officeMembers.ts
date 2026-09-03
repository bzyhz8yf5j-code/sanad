import { supabase } from '../lib/supabase';
import type { OfficeMemberRole } from '../domain/officeMembers';

export async function createOfficeInvitation(officeId: string, email: string, memberRole: OfficeMemberRole) {
  if (!supabase) return { demo: true, invitationId: 'demo-invite' };
  const { data, error } = await supabase.functions.invoke('create-office-invitation', { body: { officeId, email, memberRole } });
  if (error) throw error;
  return data;
}

export async function acceptOfficeInvitation(token: string) {
  if (!supabase) return { demo: true };
  const { data, error } = await supabase.functions.invoke('accept-office-invitation', { body: { token } });
  if (error) throw error;
  return data;
}
