import { createClient } from 'npm:@supabase/supabase-js@2';

function serviceRoleRequest(req: Request) {
  try {
    const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    const segment = token.split('.')[1];
    if (!segment) return false;
    const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
    const payload = JSON.parse(atob(padded));
    return payload?.role === 'service_role';
  } catch {
    return false;
  }
}

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

Deno.serve(async (req) => {
  if (!serviceRoleRequest(req)) return new Response('Forbidden', { status: 403 });
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const input = await req.json().catch(() => null);
  const userId = text(input?.userId, 64);
  const topic = text(input?.topic, 80);
  const entityId = text(input?.entityId, 160);
  const title = text(input?.title, 200);
  const body = text(input?.body, 4000);

  if (!isUuid(userId) || !topic || !entityId || !title || !body) {
    return Response.json({ error: 'invalid_notification_payload' }, { status: 400 });
  }

  const dedupeKey = text(input?.dedupeKey, 300) || (userId + ':' + topic + ':' + entityId);
  const row = {
    user_id: userId,
    topic,
    entity_id: entityId,
    title,
    body,
    dedupe_key: dedupeKey,
  };

  const { data, error } = await admin
    .from('notifications')
    .insert(row)
    .select('id')
    .single();

  if (!error) {
    return Response.json({ queued: true, deduped: false, notificationId: data.id });
  }

  if (error.code === '23505') {
    const { data: existing, error: existingError } = await admin
      .from('notifications')
      .select('id')
      .eq('user_id', userId)
      .eq('dedupe_key', dedupeKey)
      .maybeSingle();

    if (existingError) return Response.json({ error: existingError.message }, { status: 500 });
    return Response.json({
      queued: false,
      deduped: true,
      notificationId: existing?.id ?? null,
    });
  }

  return Response.json({ error: error.message }, { status: 400 });
});
