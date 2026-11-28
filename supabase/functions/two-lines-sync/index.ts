// two-lines-sync -- the bridge between the Two Lines app (Justen's Pixel)
// and FieldBase.
//
// Deploy with "Verify JWT" OFF (Two Lines has no Supabase login). Instead,
// every request must carry the header  x-two-lines-key: <TWO_LINES_KEY>
// where TWO_LINES_KEY is an Edge Function secret (Supabase -> Edge
// Functions -> Secrets). Anything without the right key gets a 401.
//
// Actions (POST JSON { action, ... }):
//   config  -> connection test; returns the FieldBase-side settings
//   log     -> { events: [{ ref, phone, direction:'in'|'out', kind:'sms'|'call'|'missed_call',
//                           body?, duration_sec?, occurred_at? }] }
//              Saves each one on the matching Customer/Lead. Unknown numbers
//              that text or call in become a new Lead (if that setting is on).
//   pull    -> hands Two Lines up to 10 queued texts to send from the work SIM
//   ack     -> { id, ok, error? } after Two Lines tried to send a queued text

import { createClient } from 'jsr:@supabase/supabase-js@2';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const KEY = Deno.env.get('TWO_LINES_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-two-lines-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

// Last 10 digits, so +1 (509) 555-1234, 5095551234 and 509-555-1234 all match.
function phoneKey(p: string) {
  const d = String(p || '').replace(/\D/g, '');
  return d.length > 10 ? d.slice(-10) : d;
}

// Constant-time-ish compare so the key can't be guessed by timing.
function keyOk(given: string) {
  if (!KEY || given.length !== KEY.length) return false;
  let diff = 0;
  for (let i = 0; i < KEY.length; i++) diff |= KEY.charCodeAt(i) ^ given.charCodeAt(i);
  return diff === 0;
}

async function getSettings() {
  const { data } = await supabase.from('settings').select('key, value').like('key', 'two_lines_%');
  const s = Object.fromEntries((data || []).map((r) => [r.key, r.value]));
  return { newLeads: String(s.two_lines_new_leads ?? 'true') === 'true' };
}

type Match = { customer_id: number | null; lead_id: number | null };

async function buildMatcher() {
  const [{ data: customers }, { data: leads }] = await Promise.all([
    supabase.from('customers').select('id, phone').not('phone', 'is', null),
    supabase.from('leads').select('id, phone, status').not('phone', 'is', null).order('created_at', { ascending: false }),
  ]);
  const byCustomer = new Map<string, number>();
  for (const c of customers || []) { const k = phoneKey(c.phone); if (k && !byCustomer.has(k)) byCustomer.set(k, c.id); }
  const byLead = new Map<string, number>();
  for (const l of leads || []) {
    if (l.status === 'converted') continue;
    const k = phoneKey(l.phone); if (k && !byLead.has(k)) byLead.set(k, l.id);
  }
  return {
    find(phone: string): Match {
      const k = phoneKey(phone);
      return { customer_id: byCustomer.get(k) ?? null, lead_id: byCustomer.has(k) ? null : (byLead.get(k) ?? null) };
    },
    addLead(phone: string, id: number) { byLead.set(phoneKey(phone), id); },
  };
}

async function handleLog(events: any[]) {
  if (!Array.isArray(events) || !events.length) return { ok: true, saved: 0, newLeads: 0 };
  const settings = await getSettings();
  const matcher = await buildMatcher();
  let newLeads = 0;
  const rows = [];

  for (const e of events.slice(0, 200)) {
    const phone = String(e.phone || '').trim().slice(0, 50);
    const direction = e.direction === 'out' ? 'out' : 'in';
    const kind = ['sms', 'call', 'missed_call'].includes(e.kind) ? e.kind : 'sms';
    if (!phone || phoneKey(phone).length < 7) continue; // skip short codes / blocked numbers

    let match = matcher.find(phone);
    if (!match.customer_id && !match.lead_id && direction === 'in' && settings.newLeads) {
      const note = kind === 'missed_call'
        ? 'Missed call on the work line (logged by Two Lines).'
        : `Texted the work line: "${String(e.body || '').slice(0, 300)}"`;
      const { data: lead } = await supabase.from('leads')
        .insert({ name: phone, phone, source: 'Two Lines (work line)', status: 'new', notes: note })
        .select('id').single();
      if (lead) { matcher.addLead(phone, lead.id); match = { customer_id: null, lead_id: lead.id }; newLeads++; }
    }

    rows.push({
      ...match,
      phone,
      direction,
      kind,
      body: e.body ? String(e.body).slice(0, 5000) : null,
      duration_sec: Number.isFinite(Number(e.duration_sec)) ? Math.round(Number(e.duration_sec)) : null,
      occurred_at: e.occurred_at ? new Date(e.occurred_at).toISOString() : new Date().toISOString(),
      device_ref: e.ref ? String(e.ref).slice(0, 200) : null,
    });
  }

  if (rows.length) {
    const { error } = await supabase.from('communications').upsert(rows, { onConflict: 'device_ref', ignoreDuplicates: true });
    if (error) throw new Error(error.message);
  }
  return { ok: true, saved: rows.length, newLeads };
}

async function handlePull() {
  // Anything stuck in "sending" for 10+ minutes (phone died mid-send) goes back in line.
  const stale = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  await supabase.from('sms_queue').update({ status: 'pending' }).eq('status', 'sending').eq('is_lead_outreach', false).lt('claimed_at', stale);

  const { data: pending } = await supabase.from('sms_queue').select('id, to_phone, body')
    .eq('status', 'pending').eq('is_lead_outreach', false).order('created_at').limit(10);
  if (!pending || !pending.length) return { ok: true, messages: [] };

  const ids = pending.map((m) => m.id);
  const { data: claimed } = await supabase.from('sms_queue')
    .update({ status: 'sending', claimed_at: new Date().toISOString() })
    .in('id', ids).eq('status', 'pending').select('id, to_phone, body');
  return { ok: true, messages: claimed || [] };
}

async function pullLeadText() {
  const { data: rows, error } = await supabase.from('sms_queue').select('id, to_phone, body')
    .eq('is_lead_outreach', true).eq('status', 'pending').order('created_at').limit(1);
  if (error) throw error;
  if (!rows.length) return { ok: true, messages: [] };
  const { data, error: claimError } = await supabase.from('sms_queue')
    .update({ status: 'sending', claimed_at: new Date().toISOString() })
    .eq('id', rows[0].id).eq('status', 'pending').select('id, to_phone, body');
  if (claimError) throw claimError;
  return { ok: true, messages: data };
}

async function handleAck(id: number, ok: boolean, error?: string) {
  const { data: row } = await supabase.from('sms_queue').select('*').eq('id', id).maybeSingle();
  if (!row) return { ok: false, error: 'Unknown queue id' };
  if (row.is_lead_outreach) {
    if (row.status !== 'sending') return { ok: true };
    const { error: updateError } = await supabase.from('sms_queue').update(ok
      ? { status: 'sent', sent_at: new Date().toISOString(), error: null }
      : { status: 'failed', error: String(error || 'Send failed').slice(0, 500) })
      .eq('id', id).eq('status', 'sending');
    if (updateError) throw updateError;
    const { error: historyError } = await supabase.from('lead_outreach')
      .update({ status: ok ? 'sent by Work SIM' : 'SMS failed' }).eq('queue_id', id);
    if (historyError) throw historyError;
    if (ok && row.discovery_lead_id) {
      const { error: logError } = await supabase.from('communications').upsert({
        lead_id: row.discovery_lead_id, phone: row.to_phone, direction: 'out',
        kind: 'sms', body: row.body, device_ref: `lead-queue-${id}`,
      }, { onConflict: 'device_ref', ignoreDuplicates: true });
      if (logError) throw logError;
    }
    return { ok: true };
  }
  if (ok) {
    await supabase.from('sms_queue').update({ status: 'sent', sent_at: new Date().toISOString(), error: null }).eq('id', id);
    const matcher = await buildMatcher();
    const match = row.customer_id ? { customer_id: row.customer_id, lead_id: null } : matcher.find(row.to_phone);
    await supabase.from('communications').upsert({
      ...match, phone: row.to_phone, direction: 'out', kind: 'sms', body: row.body, device_ref: `queue-${id}`,
    }, { onConflict: 'device_ref', ignoreDuplicates: true });
  } else {
    await supabase.from('sms_queue').update({ status: 'failed', error: String(error || 'Send failed').slice(0, 500) }).eq('id', id);
  }
  return { ok: true };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ ok: false, error: 'POST only' }, 405);
  if (!keyOk(req.headers.get('x-two-lines-key') || '')) return json({ ok: false, error: 'Bad or missing x-two-lines-key' }, 401);

  try {
    const body = await req.json().catch(() => ({}));
    switch (body.action) {
      case 'config': return json({ ok: true, ...(await getSettings()) });
      case 'log': return json(await handleLog(body.events));
      case 'pull_lead_text': return json(await pullLeadText());
      case 'pull': return json(await handlePull());
      case 'ack': return json(await handleAck(Number(body.id), !!body.ok, body.error));
      default: return json({ ok: false, error: 'Unknown action' }, 400);
    }
  } catch (err) {
    return json({ ok: false, error: (err as Error).message }, 500);
  }
});
