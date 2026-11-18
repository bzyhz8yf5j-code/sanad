import { supabase } from '../lib/supabase';
import type { AccountDeletionStatus } from '../domain/accountDeletion';

export interface AdminDeletionRequest {
  id: string;
  user_id: string;
  status: AccountDeletionStatus;
  reason: string | null;
  retention_note: string | null;
  requested_at: string;
  reviewed_at: string | null;
  completed_at: string | null;
  updated_at: string;
  profile: { id: string; display_name: string | null; phone: string | null; role: string | null } | null;
}

async function invoke(body: Record<string, unknown>) {
  if (!supabase) throw new Error('backend_unavailable');
  const { data, error } = await supabase.functions.invoke('admin-account-deletions', { body });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function listAccountDeletionReviewQueue(): Promise<AdminDeletionRequest[]> {
  const data = await invoke({ action: 'list' });
  return (data?.requests ?? []) as AdminDeletionRequest[];
}

export async function reviewAccountDeletion(requestId: string, note?: string) {
  const data = await invoke({ action: 'review', requestId, note: note?.trim() || undefined });
  return data.request as AdminDeletionRequest;
}

export async function blockAccountDeletion(requestId: string, note: string) {
  const data = await invoke({ action: 'block', requestId, note: note.trim() });
  return data.request as AdminDeletionRequest;
}
