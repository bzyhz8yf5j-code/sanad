import { supabase } from '../lib/supabase';
import type { ServiceRequestStatus } from '../domain/serviceWorkflow';

export async function submitServiceRequest(serviceType: 'invest'|'shares'|'installments'|'complexes', payload: Record<string, unknown>) {
  if (!supabase) return { id: 'demo-service-request', status: 'submitted' };
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('not_authenticated');
  const { data, error } = await supabase.from('service_requests').insert({ user_id: auth.user.id, service_type: serviceType, payload }).select('id,status').single();
  if (error) throw error;
  return data;
}

export async function reviewServiceRequest(id: string, status: ServiceRequestStatus, note?: string) {
  if (!supabase) return { id, status, demo: true };
  const { data, error } = await supabase.functions.invoke('review-service-request', { body: { id, status, note } });
  if (error) throw error;
  return data;
}
