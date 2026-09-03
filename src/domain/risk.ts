export type RiskSeverity = 'low' | 'medium' | 'high' | 'critical';
export interface RiskFlag { code: string; severity: RiskSeverity; message: string }
export interface RiskInput {
  declaredAreaSqm?: number;
  mappedAreaSqm?: number;
  documentParcelNumber?: string;
  listingParcelNumber?: string;
  documentAgeDays?: number;
  duplicateDocumentCount?: number;
  locationDistanceM?: number;
  missingRequiredDocuments?: number;
}

export function evaluateRisks(i: RiskInput): RiskFlag[] {
  const out: RiskFlag[] = [];
  if (i.declaredAreaSqm && i.mappedAreaSqm) {
    const diff = Math.abs(i.declaredAreaSqm - i.mappedAreaSqm) / i.declaredAreaSqm;
    if (diff > 0.10) out.push({ code: 'area_mismatch', severity: 'high', message: 'فرق المساحة يتجاوز 10٪' });
    else if (diff > 0.03) out.push({ code: 'area_mismatch', severity: 'medium', message: 'يوجد فرق ملحوظ في المساحة' });
  }
  if (i.documentParcelNumber && i.listingParcelNumber && i.documentParcelNumber !== i.listingParcelNumber)
    out.push({ code: 'parcel_number_mismatch', severity: 'critical', message: 'رقم القطعة لا يطابق المستند' });
  if ((i.documentAgeDays ?? 0) > 1825) out.push({ code: 'old_document', severity: 'medium', message: 'المستند أقدم من خمس سنوات' });
  if ((i.duplicateDocumentCount ?? 0) > 1) out.push({ code: 'duplicate_document', severity: 'high', message: 'المستند مستخدم في أكثر من ملف' });
  if ((i.locationDistanceM ?? 0) > 250) out.push({ code: 'location_far', severity: 'high', message: 'الموقع بعيد عن حدود القطعة' });
  if ((i.missingRequiredDocuments ?? 0) > 0) out.push({ code: 'missing_documents', severity: 'medium', message: 'ملف العقار غير مكتمل' });
  return out;
}

export function riskScore(flags: RiskFlag[]): number {
  const weight: Record<RiskSeverity, number> = { low: 5, medium: 20, high: 35, critical: 60 };
  return Math.min(100, flags.reduce((sum, f) => sum + weight[f.severity], 0));
}
