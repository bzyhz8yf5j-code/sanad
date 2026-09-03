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

  const body = await req.json();
  const name = String(body.name ?? '').trim();
  const governorate = String(body.governorate ?? '').trim();
  if (name.length < 3 || governorate.length < 2) return json({ error: 'invalid_input' }, { status: 400 });

  const { data: existing } = await admin.from('offices')
    .select('id,status,name')
    .eq('owner_id', authData.user.id)
    .in('status', ['submitted','under_review','approved'])
    .ilike('name', name)
    .maybeSingle();
  if (existing) return json({ error: 'duplicate_active_application', office: existing }, { status: 409 });

  const { data: office, error } = await admin.from('offices').insert({
    owner_id: authData.user.id,
    name,
    governorate,
    status: 'submitted',
  }).select('id,name,governorate,status').single();
  if (error) return json({ error: error.message }, { status: 400 });

  await admin.from('office_members').upsert({ office_id: office.id, user_id: authData.user.id, member_role: 'owner', active: true });
  await admin.from('audit_events').insert({ actor_id: authData.user.id, action: 'office.application.submitted', entity_type: 'office', entity_id: office.id, metadata: { governorate } });
  return json({ office });
});
