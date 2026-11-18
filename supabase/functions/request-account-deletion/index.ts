import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, init: ResponseInit = {}) =>
  Response.json(body, { ...init, headers: { ...corsHeaders, ...(init.headers ?? {}) } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, { status: 405 });

  const auth = req.headers.get('Authorization') ?? '';
  const url = Deno.env.get('SUPABASE_URL')!;
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const userClient = createClient(url, anon, { global: { headers: { Authorization: auth } } });
  const admin = createClient(url, service);

  const { data: authData, error: authError } = await userClient.auth.getUser();
  if (authError || !authData.user) return json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const action = String(body?.action ?? 'request');
  const reason = typeof body?.reason === 'string' ? body.reason.trim().slice(0, 1000) : '';
  const userId = authData.user.id;

  const { data: existing, error: existingError } = await admin
    .from('account_deletion_requests')
    .select('id,status,reason,retention_note,requested_at,reviewed_at,completed_at,updated_at')
    .eq('user_id', userId)
    .in('status', ['requested','under_review','blocked'])
    .order('requested_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existingError) return json({ error: existingError.message }, { status: 500 });

  if (action === 'cancel') {
    if (!existing) return json({ error: 'no_active_deletion_request' }, { status: 404 });
    const { data: cancelled, error } = await admin
      .from('account_deletion_requests')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .eq('user_id', userId)
      .select('id,status,reason,retention_note,requested_at,reviewed_at,completed_at,updated_at')
      .single();
    if (error) return json({ error: error.message }, { status: 400 });
    try {
      await admin.from('audit_events').insert({
        actor_id: userId,
        action: 'account.deletion.cancelled',
        entity_type: 'account_deletion_request',
        entity_id: existing.id,
        metadata: {},
      });
    } catch {}
    return json({ request: cancelled });
  }

  if (action !== 'request') return json({ error: 'invalid_action' }, { status: 400 });
  if (existing) return json({ request: existing, existing: true });

  const { data: created, error } = await admin
    .from('account_deletion_requests')
    .insert({ user_id: userId, reason: reason || null, status: 'requested' })
    .select('id,status,reason,retention_note,requested_at,reviewed_at,completed_at,updated_at')
    .single();
  if (error) return json({ error: error.message }, { status: 400 });

  try {
    await admin
      .from('push_devices')
      .update({ enabled: false, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
  } catch {}

  try {
    await admin.from('audit_events').insert({
      actor_id: userId,
      action: 'account.deletion.requested',
      entity_type: 'account_deletion_request',
      entity_id: created.id,
      metadata: {},
    });
  } catch {}

  return json({ request: created, existing: false });
});
