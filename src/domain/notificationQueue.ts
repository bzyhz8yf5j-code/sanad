export type NotificationJobStatus = 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled';
export type NotificationChannel = 'push' | 'email' | 'sms';

export interface NotificationJobState {
  status: NotificationJobStatus;
  attempts: number;
  maxAttempts: number;
  nextAttemptAtMs: number;
}

export function retryDelayMs(attempts: number): number {
  const capped = Math.max(0, Math.min(attempts, 8));
  return Math.min(15 * 60_000, 5_000 * 2 ** capped);
}

export function canClaimNotificationJob(job: NotificationJobState, nowMs: number): boolean {
  return job.status === 'pending' && job.attempts < job.maxAttempts && job.nextAttemptAtMs <= nowMs;
}

export function nextNotificationJobAfterFailure(job: NotificationJobState, nowMs: number): NotificationJobState {
  const attempts = job.attempts + 1;
  if (attempts >= job.maxAttempts) return { ...job, attempts, status: 'failed', nextAttemptAtMs: nowMs };
  return { ...job, attempts, status: 'pending', nextAttemptAtMs: nowMs + retryDelayMs(attempts) };
}
