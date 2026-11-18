import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, init: ResponseInit = {}) =>
  Response.json(body, { ...init, headers: { ...corsHeaders, ...(init.headers ?? {}) } });

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

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

  const { data: reviewer, error: reviewerError } = await admin
    .from('profiles')
    .select('role')
    .eq('id', authData.user.id)
    .single();
  if (reviewerError || reviewer?.role !== 'admin') return json({ error: 'forbidden' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const action = String(body?.action ?? 'list');

  if (action === 'list') {
    const { data: requests, error } = await admin
      .from('account_deletion_requests')
      .select('id,user_id,status,reason,retention_note,requested_at,reviewed_at,completed_at,updated_at')
      .in('status', ['requested','under_review','blocked'])
      .order('requested_at', { ascending: true })
      .limit(100);
    if (error) return json({ error: error.message }, { status: 500 });

    const userIds = [...new Set((requests ?? []).map((item: any) => item.user_id))];
    let profiles: any[] = [];
    if (userIds.length) {
      const result = await admin.from('profiles').select('id,display_name,phone,role').in('id', userIds);
      if (result.error) return json({ error: result.error.message }, { status: 500 });
      profiles = result.data ?? [];
    }
    const byId = new Map(profiles.map((profile: any) => [profile.id, profile]));
    return json({
      requests: (requests ?? []).map((item: any) => ({
        ...item,
        profile: byId.get(item.user_id) ?? null,
      })),
    });
  }

  const requestId = String(body?.requestId ?? '');
  const note = typeof body?.note === 'string' ? body.note.trim().slice(0, 2000) : '';
  if (!isUuid(requestId)) return json({ error: 'invalid_request_id' }, { status: 400 });
  if (!['review','block'].includes(action)) return json({ error: 'invalid_action' }, { status: 400 });
  if (action === 'block' && note.length < 3) return json({ error: 'retention_note_required' }, { status: 400 });

  const { data: current, error: currentError } = await admin
    .from('account_deletion_requests')
    .select('id,user_id,status,retention_note')
    .eq('id', requestId)
    .single();
  if (currentError || !current) return json({ error: 'request_not_found' }, { status: 404 });
  if (!['requested','under_review','blocked'].includes(current.status)) {
    return json({ error: 'request_not_active' }, { status: 409 });
  }

  const nextStatus = action === 'block' ? 'blocked' : 'under_review';
  const now = new Date().toISOString();
  const { data: updated, error } = await admin
    .from('account_deletion_requests')
    .update({
      status: nextStatus,
      retention_note: action === 'block' ? note : (note || current.retention_note),
      reviewed_at: now,
      updated_at: now,
    })
    .eq('id', requestId)
    .select('id,user_id,status,reason,retention_note,requested_at,reviewed_at,completed_at,updated_at')
    .single();
  if (error) return json({ error: error.message }, { status: 400 });

  await admin.from('audit_events').insert({
    actor_id: authData.user.id,
    action: 'account.deletion.' + nextStatus,
    entity_type: 'account_deletion_request',
    entity_id: requestId,
    metadata: { note: note || null },
  });

  await admin.from('notifications').upsert({
    user_id: current.user_id,
    topic: 'account',
    entity_id: requestId,
    title: 'تحديث طلب حذف الحساب',
    body: nextStatus === 'blocked'
      ? 'طلب حذف حسابك متوقف مؤقتًا. افتح شاشة حذف الحساب لقراءة الملاحظة.'
      : 'بدأت مراجعة طلب حذف حسابك.',
    dedupe_key: 'account-deletion:' + requestId + ':' + nextStatus,
  }, { onConflict: 'user_id,dedupe_key', ignoreDuplicates: true });

  return json({ request: updated });
});
