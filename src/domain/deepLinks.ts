export type DeepLinkTarget =
  | { kind: 'property'; id: string }
  | { kind: 'conversation'; id: string }
  | { kind: 'transaction'; id: string }
  | { kind: 'parcel'; id: string }
  | { kind: 'service'; id: string; serviceType?: string }
  | { kind: 'unknown' };

export function routeForTarget(target: DeepLinkTarget): string {
  switch (target.kind) {
    case 'property': return `/property/${target.id}`;
    case 'conversation': return `/messages/${target.id}`;
    case 'transaction': return `/transactions/${target.id}`;
    case 'parcel': return `/parcel/${target.id}`;
    case 'service': return `/admin/services?requestId=${encodeURIComponent(target.id)}`;
    default: return '/';
  }
}

export function parseNotificationData(data: Record<string, unknown> | undefined): DeepLinkTarget {
  if (!data) return { kind: 'unknown' };
  const kind = String(data.kind ?? data.topic ?? '');
  const id = String(data.id ?? data.entityId ?? '');
  if (!id) return { kind: 'unknown' };
  if (kind === 'property' || kind === 'saved_search') return { kind: 'property', id };
  if (kind === 'conversation' || kind === 'message') return { kind: 'conversation', id };
  if (kind === 'transaction') return { kind: 'transaction', id };
  if (kind === 'parcel') return { kind: 'parcel', id };
  if (kind === 'service') return { kind: 'service', id, serviceType: typeof data.serviceType === 'string' ? data.serviceType : undefined };
  return { kind: 'unknown' };
}
