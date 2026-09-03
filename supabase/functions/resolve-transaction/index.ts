import { createClient } from 'npm:@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, init: ResponseInit = {}) => Response.json(body, { ...init, headers: { ...corsHeaders, ...(init.headers ?? {}) } });
const hex = async (value:string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))).map(b=>b.toString(16).padStart(2,'0')).join('');
Deno.serve(async(req)=>{
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const {code}=await req.json(); const normalized=String(code??'').trim().toUpperCase(); if(normalized.length<8) return json({error:'invalid_code'},{status:400});
  const ip=req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()??'unknown'; const subject=await hex(ip); const bucket=new Date(Math.floor(Date.now()/60000)*60000).toISOString();
  const {data:limit}=await admin.from('request_limits').select('request_count').eq('scope','transaction_track').eq('subject',subject).eq('bucket_start',bucket).maybeSingle();
  const count=(limit?.request_count??0)+1; if(count>10) return json({error:'rate_limited'},{status:429});
  await admin.from('request_limits').upsert({scope:'transaction_track',subject,bucket_start:bucket,request_count:count});
  const trackingHash=await hex(normalized);
  const {data:tx}=await admin.from('transactions').select('id,status,created_at,completed_at').eq('tracking_hash',trackingHash).single(); if(!tx) return json({error:'not_found'},{status:404});
  const {data:parties}=await admin.from('transaction_parties').select('party_type,display_name,phone').eq('transaction_id',tx.id).eq('visible_to_client',true);
  const {data:events}=await admin.from('transaction_events').select('status,note,created_at').eq('transaction_id',tx.id).eq('visible_to_client',true).order('created_at');
  return json({transaction:tx,parties:parties??[],events:events??[]});
});
