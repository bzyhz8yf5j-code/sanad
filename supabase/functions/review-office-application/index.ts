import { createClient } from 'npm:@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, init: ResponseInit = {}) => Response.json(body, { ...init, headers: { ...corsHeaders, ...(init.headers ?? {}) } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const auth = req.headers.get('Authorization') ?? '';
  const url = Deno.env.get('SUPABASE_URL')!;
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const userClient = createClient(url, anon, { global: { headers: { Authorization: auth } } });
  const admin = createClient(url, service);
  const { data: authData } = await userClient.auth.getUser();
  if (!authData.user) return new Response('Unauthorized', { status: 401, headers: corsHeaders });
  const { data: reviewer } = await admin.from('profiles').select('role').eq('id', authData.user.id).single();
  if (!reviewer || !['admin','supervisor'].includes(reviewer.role)) return new Response('Forbidden', { status: 403, headers: corsHeaders });

  const { officeId, decision, reason } = await req.json();
  if (!['under_review','approved','rejected','suspended'].includes(decision)) return json({ error: 'invalid_decision' }, { status: 400 });
  if (decision === 'rejected' && String(reason ?? '').trim().length < 3) return json({ error: 'reason_required' }, { status: 400 });

  const { data: office, error } = await admin.from('offices').update({
    status: decision,
    reviewer_id: authData.user.id,
    reviewed_at: new Date().toISOString(),
    verified_at: decision === 'approved' ? new Date().toISOString() : null,
    rejection_reason: decision === 'rejected' ? String(reason).trim() : null,
  }).eq('id', officeId).select('id,owner_id,name,status').single();
  if (error) return json({ error: error.message }, { status: 400 });

  if (decision === 'approved') await admin.from('profiles').update({ role: 'office' }).eq('id', office.owner_id).eq('role', 'citizen');
  await admin.from('audit_events').insert({ actor_id: authData.user.id, action: `office.application.${decision}`, entity_type: 'office', entity_id: office.id, metadata: { reason: reason ?? null } });
  await admin.from('notifications').upsert({
    user_id: office.owner_id,
    topic: 'approval',
    entity_id: office.id,
    title: 'تحديث اعتماد المكتب',
    body: decision === 'approved' ? 'تم اعتماد مكتبك في سند.' : decision === 'rejected' ? `تم رفض الطلب: ${String(reason).trim()}` : `الحالة الجديدة: ${decision}`,
    dedupe_key: `office:${office.id}:${decision}`,
  }, { onConflict: 'user_id,dedupe_key', ignoreDuplicates: true });

  return json({ office });
});
