import { createClient } from 'npm:@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, init: ResponseInit = {}) => Response.json(body, { ...init, headers: { ...corsHeaders, ...(init.headers ?? {}) } });

const hash = async (value: string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))).map((b) => b.toString(16).padStart(2, '0')).join('');

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
  const { entityType, entityId, expiresInMinutes } = await req.json();
  if (!['property','parcel'].includes(entityType)) return json({ error: 'unsupported_entity' }, { status: 400 });

  const table = entityType === 'property' ? 'properties' : 'parcels';
  const { data: visible } = await userClient.from(table).select('id').eq('id', entityId).single();
  if (!visible) return json({ error: 'entity_not_accessible' }, { status: 404 });

  const token = `${crypto.randomUUID()}${crypto.randomUUID()}`.replaceAll('-', '');
  const tokenHash = await hash(token);
  const minutes = Math.max(5, Math.min(Number(expiresInMinutes ?? 1440), 10080));
  const expiresAt = new Date(Date.now() + minutes * 60_000).toISOString();
  const { data: link, error } = await admin.from('share_links').insert({
    created_by: authData.user.id,
    entity_type: entityType,
    entity_id: entityId,
    token_hash: tokenHash,
    permissions: ['view'],
    expires_at: expiresAt,
  }).select('id').single();
  if (error) return json({ error: error.message }, { status: 400 });
  return json({ shareId: link.id, token, expiresAt });
});
