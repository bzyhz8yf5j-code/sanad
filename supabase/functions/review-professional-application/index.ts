import { createClient } from 'npm:@supabase/supabase-js@2';
Deno.serve(async (req) => {
  const auth = req.headers.get('Authorization') ?? '';
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } });
  const { data: authUser } = await userClient.auth.getUser();
  if (!authUser.user) return new Response('Unauthorized', { status: 401 });
  const { data: profile } = await admin.from('profiles').select('role').eq('id', authUser.user.id).single();
  if (!profile || !['admin','supervisor'].includes(profile.role)) return new Response('Forbidden', { status: 403 });
  const { applicationId, decision, reason } = await req.json();
  if (!['approved','rejected','under_review','suspended'].includes(decision)) return Response.json({ error: 'invalid_decision' }, { status: 400 });
  if (decision === 'rejected' && !String(reason ?? '').trim()) return Response.json({ error: 'reason_required' }, { status: 400 });
  const { data: app, error } = await admin.from('professional_applications').update({ status: decision, reviewer_id: authUser.user.id, rejection_reason: decision === 'rejected' ? reason : null, reviewed_at: new Date().toISOString() }).eq('id', applicationId).select('*').single();
  if (error) return Response.json({ error: error.message }, { status: 400 });
  if (decision === 'approved') await admin.from('profiles').update({ role: app.professional_type }).eq('id', app.applicant_id).eq('role','citizen');
  await admin.from('audit_events').insert({ actor_id: authUser.user.id, action: `professional.${decision}`, entity_type: 'professional_application', entity_id: applicationId, metadata: { reason: reason ?? null } });
  return Response.json({ application: app });
});
