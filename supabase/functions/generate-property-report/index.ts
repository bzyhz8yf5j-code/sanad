import { createClient } from 'npm:@supabase/supabase-js@2';
import { PDFDocument, rgb } from 'npm:pdf-lib@1.17.1';
import fontkit from 'npm:@pdf-lib/fontkit@1.1.1';
import {
  REPORT_RATE_LIMIT,
  REPORT_RATE_WINDOW_MS,
  reportRateLimitExceeded,
  sanitizeReportText,
  wrapMeasuredText,
} from '../_shared/reportPdf.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, init: ResponseInit = {}) =>
  Response.json(body, { ...init, headers: { ...corsHeaders, ...(init.headers ?? {}) } });

const A4_W = 595.28;
const A4_H = 841.89;
const MARGIN_X = 40;
const TOP_Y = 760;
const BOTTOM_Y = 72;
const MAX_TEXT_WIDTH = A4_W - (MARGIN_X * 2);

let fontBytesPromise: Promise<Uint8Array> | null = null;

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function getFontBytes() {
  if (fontBytesPromise) return fontBytesPromise;
  fontBytesPromise = (async () => {
    const fontUrl = Deno.env.get('SUPABASE_REPORT_FONT_URL');
    if (!fontUrl || !/^https:\/\//i.test(fontUrl)) throw new Error('report_font_not_configured');
    const response = await fetch(fontUrl);
    if (!response.ok) throw new Error('report_font_fetch_failed');
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (!bytes.byteLength) throw new Error('report_font_empty');
    return bytes;
  })();
  try {
    return await fontBytesPromise;
  } catch (error) {
    fontBytesPromise = null;
    throw error;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, { status: 405 });

  const auth = req.headers.get('Authorization') ?? '';
  const url = Deno.env.get('SUPABASE_URL')!;
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const client = createClient(url, anon, { global: { headers: { Authorization: auth } } });
  const admin = createClient(url, serviceRole);

  const { data: userData, error: authError } = await client.auth.getUser();
  if (authError || !userData.user) return json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const action = String(body?.action ?? 'generate');

  if (action === 'sign') {
    const reportId = String(body?.reportId ?? '');
    if (!isUuid(reportId)) return json({ error: 'invalid_report_id' }, { status: 400 });

    const { data: report, error } = await client
      .from('property_reports')
      .select('id,property_id,storage_path,sha256,generated_at,metadata')
      .eq('id', reportId)
      .single();
    if (error || !report) return json({ error: 'report_not_accessible' }, { status: 404 });

    const { data: signed, error: signedError } = await admin.storage
      .from('property-reports')
      .createSignedUrl(report.storage_path, 900);
    if (signedError) return json({ error: 'report_sign_failed' }, { status: 500 });

    return json({
      reportId: report.id,
      propertyId: report.property_id,
      reportUrl: signed.signedUrl,
      expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
      sha256: report.sha256,
      generatedAt: report.generated_at,
      metadata: report.metadata,
    });
  }

  if (action !== 'generate') return json({ error: 'invalid_action' }, { status: 400 });

  const propertyId = String(body?.propertyId ?? '');
  if (!isUuid(propertyId)) return json({ error: 'invalid_property_id' }, { status: 400 });

  const since = new Date(Date.now() - REPORT_RATE_WINDOW_MS).toISOString();
  const { count: recentCount, error: rateError } = await admin
    .from('property_reports')
    .select('id', { count: 'exact', head: true })
    .eq('requested_by', userData.user.id)
    .gte('generated_at', since);
  if (rateError) return json({ error: 'report_rate_check_failed' }, { status: 500 });
  if (reportRateLimitExceeded(recentCount ?? 0)) {
    return json({
      error: 'report_rate_limited',
      limit: REPORT_RATE_LIMIT,
      windowMinutes: REPORT_RATE_WINDOW_MS / 60_000,
    }, { status: 429, headers: { 'Retry-After': '600' } });
  }

  const { data: property, error: propertyError } = await client
    .from('properties')
    .select('id,title,price,currency,area_sqm,governorate,district,neighborhood,parcel_id,office_id,status')
    .eq('id', propertyId)
    .single();
  if (propertyError || !property) return json({ error: 'property_not_found' }, { status: 404 });

  const [
    riskResult,
    propertyDocumentResult,
    officeResult,
    parcelResult,
    parcelDocumentResult,
  ] = await Promise.all([
    client.from('risk_flags').select('code,severity,message,resolved_at').eq('property_id', propertyId).limit(100),
    client.from('property_media').select('id', { count: 'exact', head: true }).eq('property_id', propertyId).eq('kind', 'document'),
    client.from('offices').select('name').eq('id', property.office_id).maybeSingle(),
    property.parcel_id
      ? client.from('parcels').select('parcel_number,block_number,area_sqm').eq('id', property.parcel_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    property.parcel_id
      ? client.from('parcel_documents').select('id', { count: 'exact', head: true }).eq('parcel_id', property.parcel_id)
      : Promise.resolve({ count: 0, error: null }),
  ]);

  if (riskResult.error) return json({ error: 'report_risks_unavailable' }, { status: 500 });

  let fontBytes: Uint8Array;
  try {
    fontBytes = await getFontBytes();
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'report_font_failed' }, { status: 503 });
  }

  const reportId = crypto.randomUUID();
  const generatedAt = new Date();
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  pdf.setTitle('سند — تقرير العقار');
  pdf.setAuthor('سند');
  pdf.setProducer('Sanad Property Platform');
  pdf.setCreationDate(generatedAt);
  const font = await pdf.embedFont(fontBytes, { subset: true });

  let page: any;
  let y = TOP_Y;
  const pages: any[] = [];

  const startPage = () => {
    page = pdf.addPage([A4_W, A4_H]);
    pages.push(page);
    page.drawRectangle({ x: 0, y: 790, width: A4_W, height: 51, color: rgb(0.04, 0.08, 0.15) });
    drawRight('سند — تقرير العقار', 807, 19, rgb(0.92, 0.78, 0.42));
    y = TOP_Y;
  };

  const drawRight = (text: string, atY: number, size = 12, color = rgb(0.08, 0.11, 0.18)) => {
    const clean = sanitizeReportText(text);
    const width = font.widthOfTextAtSize(clean, size);
    page.drawText(clean, { x: Math.max(MARGIN_X, A4_W - MARGIN_X - width), y: atY, size, font, color });
  };

  const ensureSpace = (needed = 26) => {
    if (y - needed < BOTTOM_Y) startPage();
  };

  const paragraph = (text: string, size = 11, gap = 18) => {
    const lines = wrapMeasuredText(text, MAX_TEXT_WIDTH, (line) => font.widthOfTextAtSize(line, size));
    for (const line of lines) {
      ensureSpace(gap);
      drawRight(line, y, size);
      y -= gap;
    }
  };

  const line = (label: string, value: unknown) => {
    paragraph(label + ': ' + sanitizeReportText(value ?? '—'), 11.5, 23);
  };

  const section = (title: string) => {
    ensureSpace(34);
    y -= 4;
    drawRight(title, y, 14, rgb(0.05, 0.16, 0.28));
    y -= 27;
  };

  startPage();
  line('رقم التقرير', reportId);
  line('وقت الإنشاء', generatedAt.toISOString());
  line('العقار', property.title);
  line('المكتب', officeResult.data?.name ?? '—');
  line('الحالة', property.status);
  line('المحافظة', property.governorate);
  line('القضاء', property.district);
  line('الحي', property.neighborhood);
  line('المساحة', String(property.area_sqm ?? '—') + ' م²');
  line('السعر', String(property.price ?? '—') + ' ' + String(property.currency ?? 'IQD'));
  line('رقم القطعة', parcelResult.data?.parcel_number ?? '—');
  line('المقاطعة', parcelResult.data?.block_number ?? '—');
  line('مرفقات الإعلان', propertyDocumentResult.count ?? 0);
  line('مستندات القطعة الرسمية', parcelDocumentResult.count ?? 0);

  section('المخاطر المفتوحة');
  const openRisks = (riskResult.data ?? []).filter((risk: any) => !risk.resolved_at);
  if (!openRisks.length) {
    paragraph('لا توجد مخاطر مفتوحة مسجلة وقت إنشاء التقرير.');
  } else {
    for (const risk of openRisks) {
      paragraph('• ' + String(risk.severity ?? '—') + ' — ' + String(risk.message ?? risk.code ?? 'ملاحظة بدون وصف'), 10.5, 17);
    }
  }

  section('تنبيه');
  paragraph('هذا التقرير تنظيمي ومعلوماتي ولا يحل محل سند التسجيل أو الوثيقة الرسمية الصادرة من الجهة المختصة.', 9.5, 16);

  pages.forEach((item, index) => {
    const label = 'صفحة ' + (index + 1) + ' من ' + pages.length;
    const width = font.widthOfTextAtSize(label, 8);
    item.drawText(label, { x: (A4_W - width) / 2, y: 34, size: 8, font, color: rgb(0.4, 0.45, 0.5) });
  });

  const bytes = await pdf.save();
  if (bytes.byteLength > 10 * 1024 * 1024) return json({ error: 'report_too_large' }, { status: 413 });

  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const sha256 = [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('');
  const storagePath = propertyId + '/' + reportId + '.pdf';

  const { error: uploadError } = await admin.storage
    .from('property-reports')
    .upload(storagePath, bytes, { contentType: 'application/pdf', cacheControl: '3600', upsert: false });
  if (uploadError) return json({ error: 'report_upload_failed', detail: uploadError.message }, { status: 500 });

  const expiresAt = new Date(Date.now() + 15 * 60_000).toISOString();
  const metadata = {
    page_count: pages.length,
    open_risk_count: openRisks.length,
    property_document_count: propertyDocumentResult.count ?? 0,
    parcel_document_count: parcelDocumentResult.count ?? 0,
    generator: 'sanad-pdf-v3',
  };

  const { error: metaError } = await admin.from('property_reports').insert({
    id: reportId,
    property_id: propertyId,
    requested_by: userData.user.id,
    storage_path: storagePath,
    sha256,
    expires_at: expiresAt,
    metadata,
  });
  if (metaError) {
    await admin.storage.from('property-reports').remove([storagePath]);
    return json({ error: 'report_metadata_failed' }, { status: 500 });
  }

  const { data: signed, error: signedError } = await admin.storage
    .from('property-reports')
    .createSignedUrl(storagePath, 900);
  if (signedError) return json({ error: 'report_sign_failed' }, { status: 500 });

  return json({
    reportId,
    propertyId,
    reportUrl: signed.signedUrl,
    expiresAt,
    generatedAt: generatedAt.toISOString(),
    sha256,
    metadata,
  });
});
