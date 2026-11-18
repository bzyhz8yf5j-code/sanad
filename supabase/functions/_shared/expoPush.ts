export const EXPO_PUSH_SEND_URL = 'https://exp.host/--/api/v2/push/send';
export const EXPO_PUSH_RECEIPTS_URL = 'https://exp.host/--/api/v2/push/getReceipts';
export const EXPO_PUSH_BATCH_SIZE = 100;
export const EXPO_RECEIPT_BATCH_SIZE = 1000;

export type ExpoRetryClass = 'ok' | 'retry' | 'permanent';
export type ExpoTicketAction = 'accepted' | 'retry' | 'disable_device' | 'permanent';

export function chunk<T>(items: T[], size: number): T[][] {
  if (!Number.isFinite(size) || size < 1) throw new Error('invalid_chunk_size');
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export function classifyExpoHttpStatus(status: number): ExpoRetryClass {
  if (status >= 200 && status < 300) return 'ok';
  if (status === 429 || status >= 500) return 'retry';
  return 'permanent';
}

export function ticketErrorCode(ticket: any): string {
  return String(ticket?.details?.error ?? '').trim();
}

export function classifyExpoTicket(ticket: any): ExpoTicketAction {
  if (ticket?.status === 'ok' && typeof ticket?.id === 'string' && ticket.id) return 'accepted';
  const code = ticketErrorCode(ticket);
  if (code === 'DeviceNotRegistered') return 'disable_device';
  if (code === 'MessageRateExceeded') return 'retry';
  return 'permanent';
}

export function classifyExpoReceipt(receipt: any): ExpoTicketAction {
  if (receipt?.status === 'ok') return 'accepted';
  const code = String(receipt?.details?.error ?? '').trim();
  if (code === 'DeviceNotRegistered') return 'disable_device';
  if (code === 'MessageRateExceeded') return 'retry';
  return 'permanent';
}

export function retryDelayMs(attempt: number): number {
  const safeAttempt = Math.max(1, Math.min(Number.isFinite(attempt) ? attempt : 1, 8));
  return Math.min(15 * 60_000, 5_000 * (2 ** (safeAttempt - 1)));
}

export function compactExpoError(value: unknown): string {
  const text = value instanceof Error ? value.message : typeof value === 'string' ? value : JSON.stringify(value);
  return String(text || 'expo_push_error').slice(0, 500);
}
