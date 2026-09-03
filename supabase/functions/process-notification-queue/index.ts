import { createClient } from 'npm:@supabase/supabase-js@2';
function serviceRoleRequest(req:Request){try{const token=(req.headers.get('Authorization')??'').replace(/^Bearer\s+/i,'');const payload=JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));return payload?.role==='service_role'}catch{return false}}
const retryMs=(attempt:number)=>Math.min(15*60_000,5_000*(2**Math.max(0,Math.min(attempt,8))));
Deno.serve(async(req)=>{
  if(!serviceRoleRequest(req)) return new Response('Forbidden',{status:403});
  const admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const worker=`edge-${crypto.randomUUID()}`;
  const {data:jobs,error}=await admin.rpc('claim_notification_jobs',{p_worker:worker,p_limit:25});
  if(error) return Response.json({error:error.message},{status:500});
  let sent=0,failed=0,retried=0;
  for(const job of jobs??[]){
    try{
      if(job.channel!=='push') throw new Error('channel_adapter_not_configured');
      const {data:devices}=await admin.from('push_devices').select('expo_push_token').eq('user_id',job.user_id).eq('enabled',true);
      if(!devices?.length){await admin.from('notification_jobs').update({status:'cancelled',last_error:'no_active_device',updated_at:new Date().toISOString()}).eq('id',job.id);continue;}
      const messages=devices.map((d:any)=>({to:d.expo_push_token,sound:'default',title:job.payload.title,body:job.payload.body,data:{topic:job.payload.topic,entityId:job.payload.entityId}}));
      const response=await fetch('https://exp.host/--/api/v2/push/send',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(messages)});
      if(!response.ok) throw new Error(`expo_push_${response.status}`);
      await admin.from('notification_jobs').update({status:'sent',sent_at:new Date().toISOString(),locked_at:null,locked_by:null,last_error:null,updated_at:new Date().toISOString()}).eq('id',job.id);sent++;
    }catch(error){
      const attempts=(job.attempts??0)+1;const terminal=attempts>=job.max_attempts;
      await admin.from('notification_jobs').update({status:terminal?'failed':'pending',attempts,next_attempt_at:new Date(Date.now()+retryMs(attempts)).toISOString(),last_error:error instanceof Error?error.message:String(error),locked_at:null,locked_by:null,updated_at:new Date().toISOString()}).eq('id',job.id);terminal?failed++:retried++;
    }
  }
  return Response.json({claimed:jobs?.length??0,sent,retried,failed});
});
