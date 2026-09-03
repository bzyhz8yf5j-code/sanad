import { createClient } from 'npm:@supabase/supabase-js@2';

function endpointErrors(raw:string){try{const u=new URL(raw);const h=u.hostname.toLowerCase();const p=h.split('.').map(Number);const ipv4=p.length===4&&p.every(x=>!Number.isNaN(x));const priv=ipv4&&(p[0]===10||p[0]===127||(p[0]===169&&p[1]===254)||(p[0]===172&&p[1]>=16&&p[1]<=31)||(p[0]===192&&p[1]===168));return [u.protocol!=='https:'?'https_required':'',(h==='localhost'||h.endsWith('.local')||h==='::1'||priv)?'private_host_blocked':'',(u.username||u.password)?'embedded_credentials_blocked':''].filter(Boolean)}catch{return ['invalid_url']}}
Deno.serve(async(req)=>{
 const auth=req.headers.get('Authorization')??'';
 const client=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:auth}}});
 const {data:u}=await client.auth.getUser(); if(!u.user) return new Response('Unauthorized',{status:401});
 const {data:p}=await client.from('profiles').select('role').eq('id',u.user.id).single(); if(!p||!['admin','supervisor'].includes(p.role)) return new Response('Forbidden',{status:403});
 const {sourceId}=await req.json(); const {data:s,error}=await client.from('map_sources').select('id,endpoint,health_check_enabled').eq('id',sourceId).single(); if(error||!s)return Response.json({error:'source_not_found'},{status:404});
 if(!s.health_check_enabled) return Response.json({error:'health_check_disabled'},{status:409});
 const endpointProblems=endpointErrors(s.endpoint); if(endpointProblems.length) return Response.json({error:'unsafe_endpoint',details:endpointProblems},{status:400});
 const started=Date.now(); let status:'healthy'|'degraded'|'down'='down'; let message='';
 try{ const controller=new AbortController(); const t=setTimeout(()=>controller.abort(),8000); const r=await fetch(s.endpoint,{method:'GET',signal:controller.signal}); clearTimeout(t); const latency=Date.now()-started; status=r.ok?(latency>2500?'degraded':'healthy'):'down'; message=`HTTP ${r.status}`; await client.from('map_sources').update({last_checked_at:new Date().toISOString(),last_health_status:status,last_latency_ms:latency,health_message:message}).eq('id',sourceId); return Response.json({status,latencyMs:latency,message}); }
 catch(e){ const latency=Date.now()-started; message=e instanceof Error?e.message:'request_failed'; await client.from('map_sources').update({last_checked_at:new Date().toISOString(),last_health_status:'down',last_latency_ms:latency,health_message:message}).eq('id',sourceId); return Response.json({status:'down',latencyMs:latency,message}); }
});
