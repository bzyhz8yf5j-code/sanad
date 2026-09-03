export interface RequestStamp { atMs: number }

export function isRateLimited(stamps: RequestStamp[], nowMs: number, windowMs: number, maxRequests: number): boolean {
  const floor = nowMs - windowMs;
  const recent = stamps.filter((s) => s.atMs > floor && s.atMs <= nowMs);
  return recent.length >= maxRequests;
}

export function nextAllowedAt(stamps: RequestStamp[], nowMs: number, windowMs: number, maxRequests: number): number {
  const recent = stamps.map((s) => s.atMs).filter((t) => t > nowMs - windowMs && t <= nowMs).sort((a, b) => a - b);
  if (recent.length < maxRequests) return nowMs;
  return recent[recent.length - maxRequests]! + windowMs;
}
