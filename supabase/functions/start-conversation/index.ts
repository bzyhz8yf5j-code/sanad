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
  const { propertyId } = await req.json();

  const { data: property } = await userClient.from('properties').select('id,office_id,status').eq('id', propertyId).single();
  if (!property) return json({ error: 'property_not_accessible' }, { status: 404 });

  const { data: memberships } = await admin.from('conversation_members').select('conversation_id').eq('user_id', authData.user.id);
  const ids = (memberships ?? []).map((m: any) => m.conversation_id);
  if (ids.length) {
    const { data: existing } = await admin.from('conversations').select('id').eq('property_id', propertyId).in('id', ids).order('created_at').limit(1).maybeSingle();
    if (existing) return json({ conversationId: existing.id, existing: true });
  }

  const { data: conversation, error } = await admin.from('conversations').insert({ property_id: property.id, office_id: property.office_id }).select('id').single();
  if (error) return json({ error: error.message }, { status: 400 });
  const { data: officeMembers } = await admin.from('office_members').select('user_id').eq('office_id', property.office_id).eq('active', true);
  const userIds = [...new Set([authData.user.id, ...(officeMembers ?? []).map((m: any) => m.user_id)])];
  await admin.from('conversation_members').insert(userIds.map((userId) => ({ conversation_id: conversation.id, user_id: userId })));
  return json({ conversationId: conversation.id, existing: false });
});
