import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  EXPO_PUSH_BATCH_SIZE,
  EXPO_PUSH_RECEIPTS_URL,
  EXPO_PUSH_SEND_URL,
  EXPO_RECEIPT_BATCH_SIZE,
  chunk,
  classifyExpoHttpStatus,
  classifyExpoReceipt,
  classifyExpoTicket,
  compactExpoError,
  retryDelayMs,
  ticketErrorCode,
} from '../_shared/expoPush.ts';

type PushDevice = { id: string; expo_push_token: string };
type TicketRecord = { id: string; deviceId: string; token: string };
type JobPayload = Record<string, any> & {
  title?: string;
  body?: string;
  topic?: string;
  entityId?: string;
  remainingDeviceIds?: string[];
  expoTickets?: TicketRecord[];
  receiptResults?: Array<{ id: string; status: string; error?: string }>;
  receiptCheckAfter?: string;
  receiptCheckedAt?: string;
};

function serviceRoleRequest(req: Request) {
  try {
    const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    const segment = token.split('.')[1];
    if (!segment) return false;
    const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
    const payload = JSON.parse(atob(padded));
    return payload?.role === 'service_role';
  } catch {
    return false;
  }
}

function nowIso() {
  return new Date().toISOString();
}

function retryAt(attempt: number) {
  return new Date(Date.now() + retryDelayMs(attempt)).toISOString();
}

async function disableDevices(admin: any, ids: string[]) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return 0;
  const { error } = await admin
    .from('push_devices')
    .update({ enabled: false, updated_at: nowIso() })
    .in('id', unique);
  if (error) throw error;
  return unique.length;
}

async function sweepReceipts(admin: any) {
  const since = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
  const { data: rows, error } = await admin
    .from('notification_jobs')
    .select('id,payload,updated_at,attempts,max_attempts,last_error')
    .eq('channel', 'push')
    .eq('status', 'sent')
    .gte('updated_at', since)
    .order('updated_at', { ascending: true })
    .limit(250);
  if (error) throw error;

  const now = Date.now();
  const jobs = (rows ?? []).filter((row: any) => {
    const payload = (row.payload ?? {}) as JobPayload;
    if (payload.receiptCheckedAt) return false;
    if (!Array.isArray(payload.expoTickets) || !payload.expoTickets.length) return false;
    const due = Date.parse(payload.receiptCheckAfter ?? '');
    return Number.isNaN(due) || due <= now;
  });

  const known = new Map<string, { jobId: string; deviceId: string }>();
  for (const job of jobs) {
    const payload = (job.payload ?? {}) as JobPayload;
    const resolved = new Set((payload.receiptResults ?? []).map((r) => r.id));
    for (const ticket of payload.expoTickets ?? []) {
      if (!resolved.has(ticket.id)) known.set(ticket.id, { jobId: job.id, deviceId: ticket.deviceId });
    }
  }

  const ids = [...known.keys()].slice(0, EXPO_RECEIPT_BATCH_SIZE);
  if (!ids.length) return { checked: 0, disabled: 0, pending: 0 };

  const response = await fetch(EXPO_PUSH_RECEIPTS_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ ids }),
  });
  if (classifyExpoHttpStatus(response.status) !== 'ok') {
    return { checked: 0, disabled: 0, pending: ids.length };
  }

  const body = await response.json().catch(() => ({}));
  const receipts = body?.data ?? {};
  const byJob = new Map<string, Array<{ id: string; receipt: any; deviceId: string }>>();
  for (const id of ids) {
    const meta = known.get(id);
    const receipt = receipts?.[id];
    if (!meta || !receipt) continue;
    const list = byJob.get(meta.jobId) ?? [];
    list.push({ id, receipt, deviceId: meta.deviceId });
    byJob.set(meta.jobId, list);
  }

  let checked = 0;
  let disabled = 0;
  for (const job of jobs) {
    const found = byJob.get(job.id) ?? [];
    if (!found.length) continue;

    const payload = (job.payload ?? {}) as JobPayload;
    const previous = payload.receiptResults ?? [];
    const previousIds = new Set(previous.map((r) => r.id));
    const additions: Array<{ id: string; status: string; error?: string }> = [];
    const disableIds: string[] = [];
    const retryIds: string[] = [];
    const permanentReceiptErrors: string[] = [];

    for (const item of found) {
      if (previousIds.has(item.id)) continue;
      const action = classifyExpoReceipt(item.receipt);
      const errorCode = ticketErrorCode(item.receipt);
      additions.push({
        id: item.id,
        status: action,
        ...(errorCode ? { error: errorCode } : {}),
      });
      if (action === 'disable_device') disableIds.push(item.deviceId);
      else if (action === 'retry') retryIds.push(item.deviceId);
      else if (action === 'permanent') permanentReceiptErrors.push(errorCode || 'receipt_permanent_error');
      checked++;
    }

    disabled += await disableDevices(admin, disableIds);
    const results = [...previous, ...additions];
    const ticketCount = (payload.expoTickets ?? []).length;
    const allResolved = results.length >= ticketCount;
    if (retryIds.length) {
      const attempts = (job.attempts ?? 0) + 1;
      const terminal = attempts >= (job.max_attempts ?? 5);
      const retryPayload: JobPayload = {
        ...payload,
        receiptResults: results,
        remainingDeviceIds: [...new Set(retryIds)],
        receiptCheckAfter: undefined,
        receiptCheckedAt: undefined,
      };
      await admin
        .from('notification_jobs')
        .update({
          status: terminal ? 'failed' : 'pending',
          attempts,
          next_attempt_at: retryAt(attempts),
          payload: retryPayload,
          last_error: terminal ? 'receipt_retry_exhausted' : 'receipt_message_rate_exceeded',
          locked_at: null,
          locked_by: null,
          updated_at: nowIso(),
        })
        .eq('id', job.id);
      continue;
    }

    const nextPayload: JobPayload = {
      ...payload,
      receiptResults: results,
      ...(allResolved
        ? { receiptCheckedAt: nowIso(), receiptCheckAfter: undefined }
        : { receiptCheckAfter: new Date(Date.now() + 5 * 60_000).toISOString() }),
    };

    await admin
      .from('notification_jobs')
      .update({
        payload: nextPayload,
        last_error: permanentReceiptErrors.length
          ? ('receipt:' + permanentReceiptErrors.join('|')).slice(0, 500)
          : job.last_error,
        updated_at: nowIso(),
      })
      .eq('id', job.id);
  }

  return { checked, disabled, pending: Math.max(0, ids.length - checked) };
}

async function loadDevices(admin: any, job: any): Promise<PushDevice[]> {
  const payload = (job.payload ?? {}) as JobPayload;
  let query = admin
    .from('push_devices')
    .select('id,expo_push_token')
    .eq('user_id', job.user_id)
    .eq('enabled', true);

  if (Array.isArray(payload.remainingDeviceIds) && payload.remainingDeviceIds.length) {
    query = query.in('id', payload.remainingDeviceIds);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as PushDevice[];
}

async function markPending(admin: any, job: any, payload: JobPayload, attempts: number, errorText: string) {
  const terminal = attempts >= job.max_attempts;
  await admin.from('notification_jobs').update({
    status: terminal ? 'failed' : 'pending',
    attempts,
    next_attempt_at: retryAt(attempts),
    payload,
    last_error: errorText.slice(0, 500),
    locked_at: null,
    locked_by: null,
    updated_at: nowIso(),
  }).eq('id', job.id);
  return terminal;
}

async function processJob(admin: any, job: any) {
  if (job.channel !== 'push') return { outcome: 'failed', reason: 'channel_adapter_not_configured' };

  const devices = await loadDevices(admin, job);
  if (!devices.length) {
    await admin.from('notification_jobs').update({
      status: 'cancelled',
      last_error: 'no_active_device',
      locked_at: null,
      locked_by: null,
      updated_at: nowIso(),
    }).eq('id', job.id);
    return { outcome: 'cancelled', disabled: 0 };
  }

  const payload = (job.payload ?? {}) as JobPayload;
  const accepted: TicketRecord[] = [];
  const retryDeviceIds: string[] = [];
  const disableDeviceIds: string[] = [];
  const permanentErrors: string[] = [];

  for (const deviceBatch of chunk(devices, EXPO_PUSH_BATCH_SIZE)) {
    const messages = deviceBatch.map((device) => ({
      to: device.expo_push_token,
      sound: 'default',
      title: String(payload.title ?? '').slice(0, 200),
      body: String(payload.body ?? '').slice(0, 4000),
      data: { topic: payload.topic, entityId: payload.entityId },
    }));

    let response: Response;
    try {
      response = await fetch(EXPO_PUSH_SEND_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify(messages),
      });
    } catch (error) {
      const attempts = (job.attempts ?? 0) + 1;
      const terminal = await markPending(admin, job, {
        ...payload,
        remainingDeviceIds: deviceBatch.map((d) => d.id),
      }, attempts, compactExpoError(error));
      return { outcome: terminal ? 'failed' : 'retried', disabled: 0 };
    }

    const httpClass = classifyExpoHttpStatus(response.status);
    if (httpClass !== 'ok') {
      const detail = (await response.text().catch(() => '')) || ('expo_push_' + response.status);
      if (httpClass === 'retry') {
        const attempts = (job.attempts ?? 0) + 1;
        const terminal = await markPending(admin, job, {
          ...payload,
          remainingDeviceIds: deviceBatch.map((d) => d.id),
        }, attempts, detail);
        return { outcome: terminal ? 'failed' : 'retried', disabled: 0 };
      }
      permanentErrors.push('http_' + response.status + ':' + detail.slice(0, 180));
      continue;
    }

    const result = await response.json().catch(() => ({}));
    const tickets = Array.isArray(result?.data) ? result.data : [];
    for (let i = 0; i < deviceBatch.length; i++) {
      const device = deviceBatch[i];
      const ticket = tickets[i];
      const action = classifyExpoTicket(ticket);
      if (action === 'accepted') {
        accepted.push({ id: ticket.id, deviceId: device.id, token: device.expo_push_token });
      } else if (action === 'retry') {
        retryDeviceIds.push(device.id);
      } else if (action === 'disable_device') {
        disableDeviceIds.push(device.id);
      } else {
        permanentErrors.push(ticketErrorCode(ticket) || String(ticket?.message ?? 'invalid_push_ticket'));
      }
    }
  }

  const disabled = await disableDevices(admin, disableDeviceIds);
  const allTickets = [...(payload.expoTickets ?? []), ...accepted];

  if (retryDeviceIds.length) {
    const attempts = (job.attempts ?? 0) + 1;
    const terminal = await markPending(admin, job, {
      ...payload,
      expoTickets: allTickets,
      remainingDeviceIds: [...new Set(retryDeviceIds)],
      receiptCheckAfter: allTickets.length
        ? new Date(Date.now() + 15 * 60_000).toISOString()
        : payload.receiptCheckAfter,
    }, attempts, 'expo_transient_ticket_error');
    return { outcome: terminal ? 'failed' : 'retried', disabled };
  }

  if (!accepted.length && disableDeviceIds.length && !permanentErrors.length) {
    await admin.from('notification_jobs').update({
      status: 'cancelled',
      attempts: (job.attempts ?? 0) + 1,
      payload: { ...payload, remainingDeviceIds: [] },
      last_error: 'device_not_registered',
      locked_at: null,
      locked_by: null,
      updated_at: nowIso(),
    }).eq('id', job.id);
    return { outcome: 'cancelled', disabled };
  }

  if (!accepted.length && permanentErrors.length) {
    await admin.from('notification_jobs').update({
      status: 'failed',
      attempts: (job.attempts ?? 0) + 1,
      payload: { ...payload, remainingDeviceIds: [] },
      last_error: permanentErrors.join('|').slice(0, 500),
      locked_at: null,
      locked_by: null,
      updated_at: nowIso(),
    }).eq('id', job.id);
    return { outcome: 'failed', disabled };
  }

  await admin.from('notification_jobs').update({
    status: 'sent',
    attempts: job.attempts ?? 0,
    sent_at: nowIso(),
    payload: {
      ...payload,
      expoTickets: allTickets,
      remainingDeviceIds: [],
      receiptCheckAfter: new Date(Date.now() + 15 * 60_000).toISOString(),
    },
    last_error: permanentErrors.length ? ('partial:' + permanentErrors.join('|')).slice(0, 500) : null,
    locked_at: null,
    locked_by: null,
    updated_at: nowIso(),
  }).eq('id', job.id);
  return { outcome: 'sent', disabled };
}

Deno.serve(async (req) => {
  if (!serviceRoleRequest(req)) return new Response('Forbidden', { status: 403 });

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const receipts = await sweepReceipts(admin).catch((error) => ({
    checked: 0,
    disabled: 0,
    pending: 0,
    error: compactExpoError(error),
  }));

  const worker = 'edge-' + crypto.randomUUID();
  const { data: jobs, error } = await admin.rpc('claim_notification_jobs', {
    p_worker: worker,
    p_limit: 25,
  });
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const summary = {
    claimed: jobs?.length ?? 0,
    sent: 0,
    retried: 0,
    failed: 0,
    cancelled: 0,
    devicesDisabled: receipts.disabled ?? 0,
    receipts,
  };

  for (const job of jobs ?? []) {
    try {
      const result = await processJob(admin, job);
      summary.devicesDisabled += result.disabled ?? 0;
      if (result.outcome === 'sent') summary.sent++;
      else if (result.outcome === 'retried') summary.retried++;
      else if (result.outcome === 'cancelled') summary.cancelled++;
      else summary.failed++;
    } catch (error) {
      const attempts = (job.attempts ?? 0) + 1;
      const terminal = await markPending(
        admin,
        job,
        job.payload ?? {},
        attempts,
        compactExpoError(error),
      );
      terminal ? summary.failed++ : summary.retried++;
    }
  }

  return Response.json(summary);
});
