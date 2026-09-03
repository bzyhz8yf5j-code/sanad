import { supabase } from '../lib/supabase';
import type { TransactionStatus } from '../types/domain';

export async function createTrackedTransaction(officeId: string, propertyId?: string) {
  if (!supabase) return { transaction_id: 'demo-transaction', tracking_code: 'DEMO12345678' };
  const { data, error } = await supabase.rpc('create_transaction_with_tracking', {
    p_office: officeId,
    p_property: propertyId ?? null,
  });
  if (error) throw error;
  return data as { transaction_id: string; tracking_code: string };
}

export async function advanceTransaction(transactionId: string, status: TransactionStatus, note?: string, visibleToClient = true) {
  if (!supabase) return { transaction_id: transactionId, status, demo: true };
  const { data, error } = await supabase.rpc('advance_transaction', {
    p_transaction: transactionId,
    p_status: status,
    p_note: note ?? null,
    p_visible_to_client: visibleToClient,
  });
  if (error) throw error;
  return data as { transaction_id: string; status: TransactionStatus; updated_at: string };
}

export async function setTransactionParty(transactionId: string, partyType: string, displayName: string, phone?: string, visibleToClient = false) {
  if (!supabase) return { demo: true };
  const { error } = await supabase.from('transaction_parties').upsert({
    transaction_id: transactionId,
    party_type: partyType,
    display_name: displayName,
    phone: phone ?? null,
    visible_to_client: visibleToClient,
  }, { onConflict: 'transaction_id,party_type,display_name' });
  if (error) throw error;
  return { ok: true };
}

export async function listOfficeTransactions(officeId: string, limit = 100) {
  if (!supabase) return [];
  const { data, error } = await supabase.from('transactions')
    .select('id,property_id,status,created_at,updated_at,completed_at')
    .eq('office_id', officeId)
    .order('updated_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function getTransactionHistory(transactionId: string) {
  if (!supabase) return [];
  const { data, error } = await supabase.from('transaction_events')
    .select('id,status,note,visible_to_client,created_at')
    .eq('transaction_id', transactionId)
    .order('created_at');
  if (error) throw error;
  return data ?? [];
}
