import { supabase } from '../lib/supabase';
import type { AccountDeletionStatus } from '../domain/accountDeletion';

export interface AccountDeletionRequest {
  id: string;
  status: AccountDeletionStatus;
  reason: string | null;
  retention_note: string | null;
  requested_at: string;
  reviewed_at: string | null;
  completed_at: string | null;
  updated_at: string;
}

export async function getMyAccountDeletionRequest(): Promise<AccountDeletionRequest | null> {
  if (!supabase) return null;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data, error } = await supabase
    .from('account_deletion_requests')
    .select('id,status,reason,retention_note,requested_at,reviewed_at,completed_at,updated_at')
    .eq('user_id', auth.user.id)
    .order('requested_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as AccountDeletionRequest | null;
}

async function invoke(action: 'request' | 'cancel', reason?: string) {
  if (!supabase) throw new Error('backend_unavailable');
  const { data, error } = await supabase.functions.invoke('request-account-deletion', {
    body: { action, ...(reason ? { reason } : {}) },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data?.request as AccountDeletionRequest;
}

export function requestAccountDeletion(reason?: string) {
  return invoke('request', reason?.trim());
}

export function cancelAccountDeletion() {
  return invoke('cancel');
}
