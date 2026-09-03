import { supabase } from '../lib/supabase';

export async function submitOfficeApplication(name: string, governorate: string) {
  if (!supabase) return { office: { id: 'demo-office', name, governorate, status: 'submitted' } };
  const { data, error } = await supabase.functions.invoke('submit-office-application', { body: { name, governorate } });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function listMyOffices() {
  if (!supabase) return [];
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return [];
  const { data, error } = await supabase.from('offices').select('id,name,governorate,status,verified_at,rejection_reason').eq('owner_id', auth.user.id).order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listOfficeApplications() {
  if (!supabase) return [];
  const { data, error } = await supabase.from('offices').select('id,owner_id,name,governorate,status,created_at,rejection_reason').in('status', ['submitted','under_review','rejected','suspended']).order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function reviewOfficeApplication(officeId: string, decision: 'under_review'|'approved'|'rejected'|'suspended', reason?: string) {
  if (!supabase) return { office: { id: officeId, status: decision } };
  const { data, error } = await supabase.functions.invoke('review-office-application', { body: { officeId, decision, reason } });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}
