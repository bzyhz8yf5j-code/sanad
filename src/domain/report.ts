import type { ParcelSummary } from '../types/domain';
import type { RiskFlag } from './risk';

export interface PropertyReportInput {
  reportId: string;
  generatedAtIso: string;
  propertyTitle: string;
  officeName?: string;
  parcel?: ParcelSummary;
  price?: number;
  currency?: 'IQD' | 'USD';
  risks: RiskFlag[];
  documentCount: number;
  mapSnapshotUrl?: string;
}

export function buildReportSummary(input: PropertyReportInput) {
  return {
    ...input,
    hasParcel: Boolean(input.parcel?.id),
    riskCount: input.risks.length,
    highRiskCount: input.risks.filter((r) => r.severity === 'high' || r.severity === 'critical').length,
    verificationNotice: 'هذا التقرير تنظيمي ومعلوماتي ولا يحل محل سند التسجيل أو الوثيقة الرسمية الصادرة من الجهة المختصة.',
  };
}
