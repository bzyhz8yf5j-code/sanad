import { createClient } from 'npm:@supabase/supabase-js@2';
import { PDFDocument, rgb } from 'npm:pdf-lib@1.17.1';
import fontkit from 'npm:@pdf-lib/fontkit@1.1.1';

function drawRight(page:any,font:any,text:string,y:number,size=12){
  const width=font.widthOfTextAtSize(text,size);
  page.drawText(text,{x:555-width,y,size,font,color:rgb(0.08,0.11,0.18)});
}

Deno.serve(async(req)=>{
  const auth=req.headers.get('Authorization')??'';
  const url=Deno.env.get('SUPABASE_URL')!;
  const anon=Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceRole=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const client=createClient(url,anon,{global:{headers:{Authorization:auth}}});
  const admin=createClient(url,serviceRole);
  const {data:user}=await client.auth.getUser(); if(!user.user)return new Response('Unauthorized',{status:401});
  const {propertyId}=await req.json();
  const {data:property,error}=await client.from('properties').select('id,title,price,currency,area_sqm,governorate,district,neighborhood,parcel_id,office_id,status').eq('id',propertyId).single();
  if(error||!property)return Response.json({error:'property_not_found'},{status:404});
  const [{data:risks},{count:documentCount},{data:office},{data:parcel}]=await Promise.all([
    client.from('risk_flags').select('code,severity,message,resolved_at').eq('property_id',propertyId),
    client.from('property_media').select('*',{count:'exact',head:true}).eq('property_id',propertyId).eq('kind','document'),
    client.from('offices').select('name').eq('id',property.office_id).maybeSingle(),
    property.parcel_id?client.from('parcels').select('parcel_number,block_number,area_sqm').eq('id',property.parcel_id).maybeSingle():Promise.resolve({data:null}),
  ]);
  const fontUrl=Deno.env.get('SUPABASE_REPORT_FONT_URL');
  if(!fontUrl)return Response.json({error:'report_font_not_configured'},{status:503});
  const fontRes=await fetch(fontUrl); if(!fontRes.ok)return Response.json({error:'report_font_fetch_failed'},{status:503});
  const fontBytes=new Uint8Array(await fontRes.arrayBuffer());
  const pdf=await PDFDocument.create(); pdf.registerFontkit(fontkit); const font=await pdf.embedFont(fontBytes,{subset:true});
  const page=pdf.addPage([595.28,841.89]);
  page.drawRectangle({x:0,y:790,width:595.28,height:51,color:rgb(0.04,0.08,0.15)});
  drawRight(page,font,'سند — تقرير العقار',807,20);
  let y=760; const line=(label:string,value:unknown)=>{drawRight(page,font,`${label}: ${String(value??'—')}`,y,12);y-=26;};
  line('العقار',property.title); line('المكتب',office?.name); line('المحافظة',property.governorate); line('القضاء',property.district); line('الحي',property.neighborhood); line('المساحة',`${property.area_sqm} م²`); line('السعر',`${property.price} ${property.currency}`); line('رقم القطعة',parcel?.parcel_number); line('المقاطعة',parcel?.block_number); line('المستندات',documentCount??0);
  y-=8; drawRight(page,font,'المخاطر المفتوحة',y,14); y-=26;
  const open=(risks??[]).filter((r:any)=>!r.resolved_at);
  if(!open.length){drawRight(page,font,'لا توجد مخاطر مفتوحة مسجلة وقت إنشاء التقرير.',y,11);y-=22}else for(const r of open.slice(0,10)){drawRight(page,font,`${r.severity} — ${r.message}`,y,10);y-=20;}
  y-=16; drawRight(page,font,'تنبيه: هذا التقرير تنظيمي ومعلوماتي ولا يحل محل سند التسجيل أو الوثيقة الرسمية الصادرة من الجهة المختصة.',Math.max(55,y),9);
  const bytes=await pdf.save();
  const digest=await crypto.subtle.digest('SHA-256',bytes); const sha256=[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
  const reportId=crypto.randomUUID(); const storagePath=`${propertyId}/${reportId}.pdf`;
  const {error:uploadError}=await admin.storage.from('property-reports').upload(storagePath,bytes,{contentType:'application/pdf',upsert:false});
  if(uploadError)return Response.json({error:'report_upload_failed',detail:uploadError.message},{status:500});
  const expiresAt=new Date(Date.now()+15*60*1000).toISOString();
  const {error:metaError}=await admin.from('property_reports').insert({id:reportId,property_id:propertyId,requested_by:user.user.id,storage_path:storagePath,sha256,expires_at:expiresAt,metadata:{open_risk_count:open.length,document_count:documentCount??0}});
  if(metaError){await admin.storage.from('property-reports').remove([storagePath]);return Response.json({error:'report_metadata_failed'},{status:500});}
  const {data:signed,error:signedError}=await admin.storage.from('property-reports').createSignedUrl(storagePath,900);
  if(signedError)return Response.json({error:'report_sign_failed'},{status:500});
  return Response.json({reportId,reportUrl:signed.signedUrl,expiresAt,sha256});
});
