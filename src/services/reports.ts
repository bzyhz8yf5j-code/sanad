import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';

export interface PropertyReportRecord {
  id: string;
  property_id: string;
  sha256: string | null;
  generated_at: string;
  expires_at: string | null;
  metadata: Record<string, unknown>;
}

export interface PropertyReportLink {
  reportId: string;
  propertyId?: string;
  reportUrl: string;
  expiresAt: string;
  generatedAt?: string;
  sha256: string;
  metadata?: Record<string, unknown>;
}

export async function requestPropertyReport(propertyId: string) {
  if (!supabase) return { demo: true, reportUrl: undefined };
  const { data, error } = await supabase.functions.invoke('generate-property-report', {
    body: { action: 'generate', propertyId },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data as PropertyReportLink;
}

export async function signExistingPropertyReport(reportId: string) {
  if (!supabase) throw new Error('backend_unavailable');
  const { data, error } = await supabase.functions.invoke('generate-property-report', {
    body: { action: 'sign', reportId },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data as PropertyReportLink;
}

export async function listPropertyReports(propertyId: string, limit = 20): Promise<PropertyReportRecord[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('property_reports')
    .select('id,property_id,sha256,generated_at,expires_at,metadata')
    .eq('property_id', propertyId)
    .order('generated_at', { ascending: false })
    .limit(Math.max(1, Math.min(limit, 50)));
  if (error) throw error;
  return (data ?? []) as PropertyReportRecord[];
}

export async function openPropertyReport(propertyId: string) {
  const report = await requestPropertyReport(propertyId);
  if ('reportUrl' in report && report.reportUrl) await Linking.openURL(report.reportUrl);
  return report;
}

export async function openExistingPropertyReport(reportId: string) {
  const report = await signExistingPropertyReport(reportId);
  await Linking.openURL(report.reportUrl);
  return report;
}
