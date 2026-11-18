export const REPORT_RATE_LIMIT = 5;
export const REPORT_RATE_WINDOW_MS = 10 * 60_000;
export const REPORT_MAX_TEXT = 4000;

export function sanitizeReportText(value: unknown, max = REPORT_MAX_TEXT) {
  return String(value ?? '').replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

export function wrapMeasuredText(
  value: unknown,
  maxWidth: number,
  measure: (text: string) => number,
) {
  const text = sanitizeReportText(value);
  if (!text) return ['—'];
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? current + ' ' + word : word;
    if (!current || measure(candidate) <= maxWidth) {
      current = candidate;
      continue;
    }
    lines.push(current);
    current = word;
  }
  if (current) lines.push(current);
  return lines.length ? lines : ['—'];
}

export function reportRateLimitExceeded(count: number, limit = REPORT_RATE_LIMIT) {
  return Math.max(0, count) >= limit;
}
