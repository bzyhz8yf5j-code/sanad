import { createClient } from 'npm:@supabase/supabase-js@2';
function serviceRoleRequest(req:Request){try{const token=(req.headers.get('Authorization')??'').replace(/^Bearer\s+/i,'');const payload=JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));return payload?.role==='service_role'}catch{return false}}
Deno.serve(async(req)=>{
  if(!serviceRoleRequest(req)) return new Response('Forbidden',{status:403});
  const admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const payload=await req.json();
  const dedupeKey=payload.dedupeKey??`${payload.userId}:${payload.topic}:${payload.entityId}`;
  const {data,error}=await admin.from('notifications').upsert({user_id:payload.userId,topic:payload.topic,entity_id:payload.entityId,title:payload.title,body:payload.body,dedupe_key:dedupeKey},{onConflict:'user_id,dedupe_key',ignoreDuplicates:true}).select('id').maybeSingle();
  if(error)return Response.json({error:error.message},{status:400});
  return Response.json({queued:Boolean(data?.id),notificationId:data?.id??null});
});
