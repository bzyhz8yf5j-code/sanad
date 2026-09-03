import { createClient } from 'npm:@supabase/supabase-js@2';
const hex = async (value:string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))).map(b=>b.toString(16).padStart(2,'0')).join('');
Deno.serve(async(req)=>{
  const auth=req.headers.get('Authorization')??'';
  const userClient=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:auth}}});
  const admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const {data:u}=await userClient.auth.getUser(); if(!u.user?.email) return new Response('Unauthorized',{status:401});
  const {token}=await req.json(); const tokenHash=await hex(String(token));
  const {data:invite}=await admin.from('office_member_invitations').select('*').eq('token_hash',tokenHash).is('accepted_at',null).is('revoked_at',null).gt('expires_at',new Date().toISOString()).single();
  if(!invite || invite.invited_email!==u.user.email.toLowerCase()) return Response.json({error:'invalid_invitation'},{status:400});
  await admin.from('office_members').upsert({office_id:invite.office_id,user_id:u.user.id,member_role:invite.member_role,active:true});
  await admin.from('office_member_invitations').update({accepted_at:new Date().toISOString()}).eq('id',invite.id);
  await admin.from('audit_events').insert({actor_id:u.user.id,action:'office.invite.accepted',entity_type:'office',entity_id:invite.office_id,metadata:{invitationId:invite.id}});
  return Response.json({ok:true,officeId:invite.office_id,memberRole:invite.member_role});
});
