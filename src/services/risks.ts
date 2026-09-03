import { supabase } from '../lib/supabase';

export async function listPropertyRisks(propertyId: string) {
  if (!supabase) return [];
  const { data, error } = await supabase.from('risk_flags').select('id,code,severity,message,resolved_at,resolution_note,created_at').eq('property_id', propertyId).order('created_at', {ascending:false});
  if (error) throw error;
  return data ?? [];
}

export async function resolvePropertyRisk(riskId: string, note: string) {
  if (!supabase) return { id:riskId, resolved:true, demo:true };
  const { data, error } = await supabase.rpc('resolve_property_risk', { p_risk_id:riskId, p_note:note });
  if (error) throw error;
  return data;
}
