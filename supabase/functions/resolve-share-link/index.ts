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
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { token } = await req.json();
  const raw = String(token ?? '').trim();
  if (raw.length < 32) return json({ error: 'invalid_token' }, { status: 400 });

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const ipHash = await hash(ip);
  const bucket = new Date(Math.floor(Date.now() / 60_000) * 60_000).toISOString();
  const { data: current } = await admin.from('request_limits').select('request_count').eq('scope', 'share_link').eq('subject', ipHash).eq('bucket_start', bucket).maybeSingle();
  const count = (current?.request_count ?? 0) + 1;
  if (count > 20) return json({ error: 'rate_limited' }, { status: 429 });
  await admin.from('request_limits').upsert({ scope: 'share_link', subject: ipHash, bucket_start: bucket, request_count: count });

  const tokenHash = await hash(raw);
  const { data: link } = await admin.from('share_links').select('id,entity_type,entity_id,permissions,expires_at,revoked_at').eq('token_hash', tokenHash).is('revoked_at', null).gt('expires_at', new Date().toISOString()).single();
  if (!link) return json({ error: 'not_found_or_expired' }, { status: 404 });

  if (link.entity_type === 'property') {
    const { data } = await admin.from('properties').select('id,title,property_type,purpose,price,currency,area_sqm,governorate,district,neighborhood,status,verified').eq('id', link.entity_id).single();
    return json({ entityType: 'property', entity: data, permissions: link.permissions, expiresAt: link.expires_at });
  }
  if (link.entity_type === 'parcel') {
    const { data } = await admin.from('parcels').select('id,governorate,district,subdistrict,neighborhood,block_number,parcel_number,area_sqm,source_reference').eq('id', link.entity_id).single();
    return json({ entityType: 'parcel', entity: data, permissions: link.permissions, expiresAt: link.expires_at });
  }
  return json({ error: 'unsupported_entity' }, { status: 400 });
});
