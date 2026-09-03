import { supabase } from '../lib/supabase';
import type { ServiceRequestStatus } from '../domain/serviceWorkflow';

export async function listServiceReviewQueue(status?: ServiceRequestStatus, serviceType?: 'invest'|'shares'|'installments'|'complexes') {
  if (!supabase) return [];
  let query = supabase.from('service_requests').select('id,user_id,service_type,status,payload,decision_note,assigned_to,created_at,updated_at').order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);
  if (serviceType) query = query.eq('service_type', serviceType);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getServiceRequestHistory(requestId: string) {
  if (!supabase) return [];
  const { data, error } = await supabase.from('service_request_events').select('id,from_status,to_status,note,actor_id,created_at').eq('request_id', requestId).order('created_at');
  if (error) throw error;
  return data ?? [];
}
