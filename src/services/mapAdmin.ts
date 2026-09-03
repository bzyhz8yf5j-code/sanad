import { supabase } from '../lib/supabase';
import { validateMapSourceEndpoint } from '../domain/mapSourceSecurity';

export type MapSourceType = 'xyz'|'wms'|'wmts'|'wfs'|'vector';
export async function listMapSources() {
  if (!supabase) return [];
  const { data, error } = await supabase.from('map_sources').select('*').order('created_at',{ascending:false});
  if (error) throw error; return data ?? [];
}
export async function saveMapSource(input:{id?:string;name:string;sourceType:MapSourceType;endpoint:string;enabled:boolean;attribution?:string}) {
  const endpointErrors=validateMapSourceEndpoint(input.endpoint); if(endpointErrors.length) throw new Error(`invalid_map_source:${endpointErrors.join(',')}`);
  if (!supabase) return {...input,id:input.id??'demo-source'};
  const row={name:input.name,source_type:input.sourceType,endpoint:input.endpoint,enabled:input.enabled,attribution:input.attribution??null,updated_at:new Date().toISOString()};
  const q=input.id?supabase.from('map_sources').update(row).eq('id',input.id):supabase.from('map_sources').insert(row);
  const {data,error}=await q.select('*').single(); if(error) throw error; return data;
}
export async function runMapSourceHealthCheck(sourceId:string) {
  if (!supabase) return {status:'healthy',latencyMs:32,demo:true};
  const {data,error}=await supabase.functions.invoke('check-map-source',{body:{sourceId}}); if(error) throw error; return data;
}
export async function listParcelDocumentReviewQueue() {
  if (!supabase) return [];
  const {data,error}=await supabase.from('parcel_documents').select('id,parcel_id,kind,original_name,status,created_at,uploaded_by').in('status',['submitted','under_review']).order('created_at');
  if(error) throw error; return data??[];
}
