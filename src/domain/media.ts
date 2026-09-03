import type { MediaKind } from '../types/domain';

export interface PropertyMediaItem {
  id: string;
  kind: MediaKind;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  sortOrder: number;
  isCover: boolean;
}

const maxBytes: Record<MediaKind, number> = {
  image: 15 * 1024 * 1024,
  video: 250 * 1024 * 1024,
  document: 40 * 1024 * 1024,
};

export function validateMedia(item: PropertyMediaItem): string[] {
  const errors: string[] = [];
  if (item.sizeBytes <= 0) errors.push('empty_file');
  if (item.sizeBytes > maxBytes[item.kind]) errors.push('file_too_large');
  if (!item.storagePath.trim()) errors.push('storage_path_required');
  if (!item.mimeType.includes('/')) errors.push('mime_type_invalid');
  return errors;
}

export function reorderMedia(items: PropertyMediaItem[], orderedIds: string[]): PropertyMediaItem[] {
  const byId = new Map(items.map((item) => [item.id, item]));
  const seen = new Set<string>();
  const ordered: PropertyMediaItem[] = [];
  for (const id of orderedIds) {
    const item = byId.get(id);
    if (item && !seen.has(id)) {
      ordered.push({ ...item, sortOrder: ordered.length });
      seen.add(id);
    }
  }
  for (const item of items) {
    if (!seen.has(item.id)) ordered.push({ ...item, sortOrder: ordered.length });
  }
  return ordered;
}

export function setCoverMedia(items: PropertyMediaItem[], id: string): PropertyMediaItem[] {
  if (!items.some((item) => item.id === id && item.kind === 'image')) throw new Error('cover_must_be_image');
  return items.map((item) => ({ ...item, isCover: item.id === id }));
}
