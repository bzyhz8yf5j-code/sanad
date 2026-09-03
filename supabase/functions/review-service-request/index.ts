import { createClient } from 'npm:@supabase/supabase-js@2';
const allowed:Record<string,string[]>={submitted:['under_review','rejected'],under_review:['needs_info','approved','rejected','closed'],needs_info:['under_review','closed'],approved:['closed'],rejected:['closed'],closed:[]};
Deno.serve(async(req)=>{
  const auth=req.headers.get('Authorization')??''; const admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!); const user=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:auth}}});
  const {data:u}=await user.auth.getUser(); if(!u.user) return new Response('Unauthorized',{status:401}); const {data:profile}=await admin.from('profiles').select('role').eq('id',u.user.id).single(); if(!profile||!['admin','supervisor'].includes(profile.role)) return new Response('Forbidden',{status:403});
  const {id,status,note}=await req.json(); const {data:current}=await admin.from('service_requests').select('status,user_id,service_type').eq('id',id).single(); if(!current) return Response.json({error:'not_found'},{status:404});
  if(!(allowed[current.status]??[]).includes(status)) return Response.json({error:'invalid_transition'},{status:400}); if(['rejected','needs_info'].includes(status)&&!String(note??'').trim()) return Response.json({error:'note_required'},{status:400});
  const {data,error}=await admin.from('service_requests').update({status,decision_note:note??null,assigned_to:u.user.id,updated_at:new Date().toISOString()}).eq('id',id).select('*').single(); if(error) return Response.json({error:error.message},{status:400});
  await admin.from('service_request_events').insert({request_id:id,from_status:current.status,to_status:status,note:note??null,actor_id:u.user.id});
  await admin.from('audit_events').insert({actor_id:u.user.id,action:`service.${status}`,entity_type:'service_request',entity_id:id,metadata:{serviceType:current.service_type}});
  await admin.from('notifications').upsert({user_id:current.user_id,topic:'approval',entity_id:id,title:'تحديث طلبك في سند',body:`الحالة الجديدة: ${status}`,dedupe_key:`service:${id}:${status}`},{onConflict:'user_id,dedupe_key',ignoreDuplicates:true});
  return Response.json({request:data});
});
