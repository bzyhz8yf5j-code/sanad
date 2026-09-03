import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';

export async function requestPropertyReport(propertyId: string) {
  if (!supabase) return { demo: true, reportUrl: undefined };
  const { data, error } = await supabase.functions.invoke('generate-property-report', { body: { propertyId } });
  if (error) throw error;
  return data as { reportId:string; reportUrl: string; expiresAt: string; sha256:string };
}

export async function openPropertyReport(propertyId: string) {
  const report = await requestPropertyReport(propertyId);
  if (report.reportUrl) await Linking.openURL(report.reportUrl);
  return report;
}
