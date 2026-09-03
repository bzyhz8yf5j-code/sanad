export interface PropertyDraftInput {
  title: string;
  description?: string;
  propertyType: string;
  purpose: 'sale' | 'rent';
  price: number;
  areaSqm: number;
  governorate: string;
  district?: string;
  neighborhood?: string;
  mediaCount: number;
  coverImageCount: number;
  parcelLinked: boolean;
  unresolvedHighRiskCount: number;
  officeApproved: boolean;
}

export function validatePropertyDraft(input: PropertyDraftInput): string[] {
  const errors: string[] = [];
  if (input.title.trim().length < 5) errors.push('title_too_short');
  if (!input.propertyType.trim()) errors.push('property_type_required');
  if (input.price <= 0) errors.push('price_invalid');
  if (input.areaSqm <= 0) errors.push('area_invalid');
  if (!input.governorate.trim()) errors.push('governorate_required');
  return errors;
}

export function publicationBlocks(input: PropertyDraftInput): string[] {
  const blocks = validatePropertyDraft(input);
  if (!input.officeApproved) blocks.push('office_not_approved');
  if (input.mediaCount < 1) blocks.push('media_required');
  if (input.coverImageCount !== 1) blocks.push('cover_required');
  if (input.unresolvedHighRiskCount > 0) blocks.push('high_risk_unresolved');
  return blocks;
}

export function canPublishProperty(input: PropertyDraftInput): boolean {
  return publicationBlocks(input).length === 0;
}
