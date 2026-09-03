import { createClient } from 'npm:@supabase/supabase-js@2';
const hex = async (value:string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))).map(b=>b.toString(16).padStart(2,'0')).join('');
Deno.serve(async(req)=>{
  const auth=req.headers.get('Authorization')??'';
  const userClient=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:auth}}});
  const admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const {data:u}=await userClient.auth.getUser(); if(!u.user) return new Response('Unauthorized',{status:401});
  const {officeId,email,memberRole}=await req.json();
  const {data:m}=await admin.from('office_members').select('member_role').eq('office_id',officeId).eq('user_id',u.user.id).eq('active',true).single();
  const allowed=m?.member_role==='owner' || (m?.member_role==='manager' && ['agent','viewer'].includes(memberRole));
  if(!allowed) return new Response('Forbidden',{status:403});
  if(!['manager','agent','viewer'].includes(memberRole)) return Response.json({error:'invalid_role'},{status:400});
  const token=crypto.randomUUID()+crypto.randomUUID(); const tokenHash=await hex(token);
  const expiresAt=new Date(Date.now()+72*60*60*1000).toISOString();
  const {data,error}=await admin.from('office_member_invitations').insert({office_id:officeId,invited_email:String(email).trim().toLowerCase(),member_role:memberRole,token_hash:tokenHash,created_by:u.user.id,expires_at:expiresAt}).select('id').single();
  if(error) return Response.json({error:error.message},{status:400});
  await admin.from('audit_events').insert({actor_id:u.user.id,action:'office.invite.created',entity_type:'office_member_invitation',entity_id:data.id,metadata:{officeId,memberRole}});
  return Response.json({invitationId:data.id,token,expiresAt});
});
