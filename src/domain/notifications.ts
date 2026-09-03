export type NotificationChannel = 'push' | 'in_app' | 'email' | 'sms';
export type NotificationTopic = 'saved_search' | 'message' | 'appointment' | 'transaction' | 'approval' | 'risk';

export interface NotificationRequest {
  userId: string;
  topic: NotificationTopic;
  entityId: string;
  channels: NotificationChannel[];
  title: string;
  body: string;
}

export function notificationDedupeKey(request: NotificationRequest): string {
  return `${request.userId}:${request.topic}:${request.entityId}`;
}

export function safeChannels(requested: NotificationChannel[], hasPushToken: boolean, hasEmail: boolean, hasPhone: boolean): NotificationChannel[] {
  return requested.filter((c) => {
    if (c === 'push') return hasPushToken;
    if (c === 'email') return hasEmail;
    if (c === 'sms') return hasPhone;
    return true;
  });
}
