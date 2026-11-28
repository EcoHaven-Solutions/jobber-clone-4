import { createClient } from 'jsr:@supabase/supabase-js@2';

const env = (key: string) => Deno.env.get(key)?.trim() || '';
const db = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));
const origin = 'https://ecohaven-solutions.github.io';
const headers = {
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

function reply(body: object, status = 200) {
  return new Response(JSON.stringify(body), { status, headers });
}

const matching = /new (construction|build|home|residence|dwelling)|single[- ]family|subdivision|irrigation|sprinkler|landscap|xeriscap|vacant lot|building lot/i;
const text = (value: unknown, max = 300) => typeof value === 'string' ? value.trim().slice(0, max) : '';

function https(value: string) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Invalid HTTPS endpoint.');
  return url;
}

async function getJson(url: string, init?: RequestInit) {
  const res = await fetch(https(url), { ...init, redirect: 'error', signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`Source returned HTTP ${res.status}.`);
  return await res.json();
}

function candidate(key: string, name: string, address: string, source: string, link: string, description: string) {
  if (!key || !name || !address) return [];
  return [{ discovery_key: key, name, address, source, status: 'new',
    notes: [description, link].filter(Boolean).join('\n') }];
}

type Candidate = ReturnType<typeof candidate>[number];

async function permits(key: string): Promise<Candidate[]> {
  const since = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10);
  const results = [];
  for (let page = 1; page <= 4; page++) {
    const data = await getJson(`https://api.permit-stack.com/v1/permits/search?city=Spokane&state=WA&date_after=${since}&per_page=50&page=${page}`,
      { headers: { 'X-API-Key': key } });
    for (const row of data.results) {
      const id = text(row.id);
      const address = text(row.address_street);
      const title = text(row.description) || text(row.category);
      if (!id || !address || !matching.test(`${title} ${text(row.category)}`)) continue;
      if (!['FILED', 'ISSUED', 'IN_PROGRESS', 'FINAL'].includes(row.status)) continue;
      const ref = text(row.permit_number);
      results.push(...candidate(`permitstack:${id}`, title, `${address}, Spokane, WA`,
        'Spokane permit', 'https://my.spokanecity.org/opendata/gis/permits/', ref && `Permit ${ref}`));
    }
    if (data.results.length < (data.per_page || 50)) break;
  }
  return results;
}

async function feed(url: string): Promise<Candidate[]> {
  const data = await getJson(url);
  if (!Array.isArray(data.leads)) throw new Error('Expected a leads array.');
  const kinds: Record<string, string> = { permit: 'Permit feed', new_build: 'Builder feed', listing: 'Listing feed' };
  const host = https(url).host;
  return data.leads.slice(0, 200).flatMap((row: Record<string, unknown> | null) => {
    if (!row) return [];
    const id = text(row.id, 200);
    const kind = text(row.kind).toLowerCase();
    const name = text(row.title);
    const description = text(row.description, 2000);
    if (!id || !Object.hasOwn(kinds, kind) || (kind !== 'new_build' && !matching.test(`${name} ${description}`))) return [];
    let link;
    try { link = https(text(row.url, 1500)).href; } catch { return []; }
    return candidate(`feed:${host}:${kind}:${id}`, name, text(row.address), kinds[kind], link, description);
  });
}

async function scan(config: Record<string, string>) {
  const sources: { name: string; run: () => Promise<Candidate[]> }[] = [];
  const permitKey = config.ecohaven_permitstack_key || env('PERMITSTACK_API_KEY');
  if (permitKey) sources.push({ name: 'Spokane permits', run: () => permits(permitKey) });
  const feedUrl = config.ecohaven_lead_feed_url || env('LEAD_FEED_URL');
  if (feedUrl) sources.push({ name: 'Builder/listing feed', run: () => feed(feedUrl) });
  if (!sources.length) return reply({ error: 'Configure a permit key or lead feed first.' }, 503);
  const settled = await Promise.allSettled(sources.map((source) => source.run()));
  const rows = new Map<string, Candidate>();
  const unavailable = [];
  for (const [index, result] of settled.entries()) {
    if (result.status === 'fulfilled') {
      for (const lead of result.value) rows.set(lead.discovery_key, lead);
    } else unavailable.push(sources[index].name);
  }
  if (unavailable.length === sources.length) return reply({ error: `Unavailable: ${unavailable.join(', ')}.` }, 502);
  if (!rows.size) return reply({ added: 0, unavailable });
  const { data, error } = await db.from('leads').upsert([...rows.values()],
    { onConflict: 'discovery_key', ignoreDuplicates: true }).select('id');
  if (error) throw error;
  return reply({ added: data.length, unavailable });
}

const message = 'Hi, this is Justen with EcoHaven Solutions. Are you looking for sprinkler installation or drought-tolerant landscaping for your project? EcoHavenPro.com';

async function outreach(body: Record<string, unknown>, config: Record<string, string>) {
  const id = Number(body.id);
  if (!Number.isSafeInteger(id) || id < 1) return reply({ error: 'Invalid lead.' }, 400);
  const { data: lead, error } = await db.from('leads')
    .select('id,phone,email,status,discovery_key').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!lead?.discovery_key || ['converted', 'lost'].includes(lead.status)) return reply({ error: 'Lead is unavailable.' }, 404);
  if (body.channel === 'sms') {
    const consent = text(body.consent, 2000);
    const phone = text(lead.phone, 50).replace(/[^0-9]/g, '').replace(/^1(?=\d{10}$)/, '');
    if (!consent || !/^\d{10}$/.test(phone)) return reply({ error: 'Save an opted-in US phone and record advance consent.' }, 400);
    const { error } = await db.rpc('queue_discovered_lead_sms', {
      p_lead: id, p_phone: `+1${phone}`, p_consent: consent, p_body: 'Hi, this is Justen at EcoHaven Solutions. Need sprinklers or landscaping for your project? EcoHavenPro.com. Reply STOP to opt out.',
    });
    if (error?.code === '23505') return reply({ error: 'Outreach already exists for this lead or recipient.' }, 409);
    if (error) throw error;
    return reply({ status: 'Queued for the Work SIM' });
  }
  if (body.channel !== 'email') return reply({ error: 'Unknown outreach channel.' }, 400);
  const email = text(lead.email).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return reply({ error: 'Save a valid business email first.' }, 400);
  const gateway = config.ecohaven_lead_email_gateway || env('LEAD_EMAIL_GATEWAY');
  const gatewayKey = config.ecohaven_lead_email_gateway_key || env('LEAD_EMAIL_GATEWAY_KEY');
  const address = config.ecohaven_lead_mailing_address || env('LEAD_MAILING_ADDRESS');
  if (!gateway || !gatewayKey || !address) return reply({ error: 'Configure the email gateway and business mailing address first.' }, 503);
  const { error: claimError } = await db.from('lead_outreach').insert({
    lead_id: id, channel: 'email', recipient: email, status: 'attempted',
  });
  if (claimError?.code === '23505') return reply({ error: 'Outreach already exists for this lead or recipient.' }, 409);
  if (claimError) throw claimError;
  let status = 'check delivery';
  try {
    const response = await fetch(https(gateway), {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(10000),
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${gatewayKey}` },
      body: JSON.stringify({ idempotency_key: `ecohaven-lead-${id}`, to: email,
        subject: 'Irrigation and landscaping for your project',
        body: `${message}\n\nAdvertisement from EcoHaven Solutions\n${address}\nReply UNSUBSCRIBE to opt out.` }),
    });
    if (response.ok) status = 'accepted by email gateway';
  } catch { /* A retry could send a duplicate. */ }
  const { error: updateError } = await db.from('lead_outreach').update({ status }).eq('lead_id', id);
  if (updateError) throw updateError;
  return reply({ status });
}

async function outreachStatus(id: number) {
  if (!Number.isSafeInteger(id) || id < 1) return reply({ error: 'Invalid lead.' }, 400);
  const { data, error } = await db.from('lead_outreach').select('status, queue_id').eq('lead_id', id).maybeSingle();
  if (error) throw error;
  if (!data) return reply({ status: '' });
  if (data.queue_id) {
    const { data: queue, error: queueError } = await db.from('sms_queue')
      .select('status, error, claimed_at').eq('id', data.queue_id).maybeSingle();
    if (queueError) throw queueError;
    if (queue?.status === 'sending') {
      const recent = Date.now() - Date.parse(queue.claimed_at) <= 10 * 60_000;
      return reply({ status: recent ? 'Sending from Work SIM' : 'Check delivery on the phone' });
    }
    if (queue?.status === 'failed') return reply({ status: queue.error || 'SMS failed' });
    if (queue?.status === 'sent') return reply({ status: 'Sent by Work SIM' });
  }
  return reply({ status: data.status });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers });
  if (req.method !== 'POST') return reply({ error: 'POST only.' }, 405);
  try {
    const body = await req.json();
    const token = (req.headers.get('Authorization') || '').replace(/^Bearer /i, '');
    const { data: config, error: configError } = await db.rpc('ecohaven_lead_configuration');
    if (configError || !config) throw new Error('Configuration unavailable');
    const cron = config.ecohaven_lead_cron || env('LEAD_CRON_SECRET');
    if (cron && token === cron && body.action === 'scan') return await scan(config);
    if (!token) return reply({ error: 'Sign in to EcoHaven first.' }, 401);
    const { data, error } = await db.auth.getUser(token);
    const operators = env('LEAD_OPERATOR_EMAILS').split(',').map((email) => email.trim().toLowerCase());
    if (error || !data.user?.email_confirmed_at || !data.user.email || (data.user.id !== config.operator_id && !operators.includes(data.user.email.toLowerCase()))) {
      return reply({ error: 'This account cannot run lead outreach.' }, 403);
    }
    if (body.action === 'scan') return await scan(config);
    if (body.action === 'outreach') return await outreach(body, config);
    if (body.action === 'status') return await outreachStatus(Number(body.id));
    return reply({ error: 'Unknown action.' }, 400);
  } catch (error) {
    console.error(error instanceof Error ? error.name : 'Lead operation error');
    return reply({ error: 'Lead operation failed. Check function configuration and deployment.' }, 500);
  }
});
