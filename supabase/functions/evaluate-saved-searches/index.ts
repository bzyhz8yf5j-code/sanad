import { createClient } from 'npm:@supabase/supabase-js@2';

function serviceRoleRequest(req: Request) {
  try {
    const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload?.role === 'service_role';
  } catch { return false; }
}

Deno.serve(async(req)=>{
  if(!serviceRoleRequest(req)) return new Response('Forbidden',{status:403});
  const admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const {propertyId}=await req.json();
  const {data:p}=await admin.from('properties').select('*').eq('id',propertyId).eq('status','published').single(); if(!p) return Response.json({matched:0});
  const {data:searches}=await admin.from('saved_searches').select('id,user_id,filters').eq('enabled',true);
  let matched=0;
  for(const s of searches??[]){
    const f=s.filters??{};
    const ok=(!f.governorate||f.governorate===p.governorate)&&(!f.district||f.district===p.district)&&(!f.type||f.type===p.property_type)&&(!f.purpose||f.purpose===p.purpose)&&(f.minPrice==null||p.price>=f.minPrice)&&(f.maxPrice==null||p.price<=f.maxPrice)&&(f.minArea==null||p.area_sqm>=f.minArea)&&(f.maxArea==null||p.area_sqm<=f.maxArea);
    if(!ok) continue;
    const key=`saved_search:${s.id}:property:${p.id}`;
    await admin.from('notifications').upsert({user_id:s.user_id,topic:'saved_search',entity_id:p.id,title:'عقار جديد يطابق بحثك',body:p.title,dedupe_key:key},{onConflict:'user_id,dedupe_key',ignoreDuplicates:true});
    matched++;
  }
  return Response.json({matched});
});
