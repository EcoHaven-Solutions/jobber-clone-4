// This file makes the phone app talk directly to Supabase instead of a
// desktop app. It implements the exact same window.api.* methods the rest
// of the app (app.js) already calls, so nothing else needed to change.

const SUPABASE_URL = 'https://tudyqzbmlfkgcdfjdhej.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1ZHlxemJtbGZrZ2NkZmpkaGVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwNTMwMDUsImV4cCI6MjEwMDYyOTAwNX0.DH6-qu8JtqH5XRIZsbPB8vzDNReiFbFsJ0Zx78JPXDU';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---- Auth gate: bounce to login if not signed in ----
(async function requireAuth() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) {
    window.location.href = 'login.html';
  }
})();

function unwrap({ data, error }) {
  if (error) {
    const parts = [error.message, error.details, error.hint, error.code].filter(Boolean);
    throw new Error(parts.join(' | '));
  }
  return data;
}

// ---- Estimates/invoices need their computed subtotal/total, same as the
// desktop app's SQL did. We calculate it client-side here instead. ----
async function withTotals(table, itemsTable, fkColumn, rows) {
  const list = Array.isArray(rows) ? rows : [rows];
  for (const row of list) {
    if (!row) continue;
    const items = unwrap(await sb.from(itemsTable).select('*').eq(fkColumn, row.id).order('sort_order'));
    const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
    row.subtotal = subtotal;
    row.total = subtotal * (1 + (row.tax_rate || 0) / 100);
    if (!Array.isArray(rows)) row.items = items;
  }
  return rows;
}

async function saveItems(itemsTable, fkColumn, parentId, items) {
  await sb.from(itemsTable).delete().eq(fkColumn, parentId);
  const rows = (items || [])
    .filter((i) => i.description || Number(i.unit_price))
    .map((i, index) => ({
      [fkColumn]: parentId,
      description: i.description || 'Item',
      quantity: Number(i.quantity) || 1,
      unit_price: Number(i.unit_price) || 0,
      sort_order: index,
      notes: i.notes || null,
    }));
  if (rows.length) await sb.from(itemsTable).insert(rows);
}

async function generateDocNumber(table) {
  const existing = unwrap(await sb.from(table).select('number'));
  const taken = new Set(existing.map((r) => r.number).filter(Boolean));
  let digits = 4;
  while (true) {
    const candidate = String(Math.floor(Math.random() * 9 * 10 ** (digits - 1)) + 10 ** (digits - 1));
    if (!taken.has(candidate)) return candidate;
  }
}

async function invokeFunction(name, body) {
  const { data, error } = await sb.functions.invoke(name, { body });
  if (error) {
    // error.message alone is just a generic "non-2xx status" -- the actual
    // reason is in the function's own response body, so read that instead.
    if (error.context && typeof error.context.json === 'function') {
      try {
        const errBody = await error.context.json();
        return { ok: false, error: errBody.error || error.message };
      } catch (e) {
        // response wasn't JSON -- fall through to the generic message
      }
    }
    return { ok: false, error: error.message };
  }
  return data;
}

function toIntOrNull(v) {
  if (v === undefined || v === null || v === '') return null;
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? null : n;
}
function toNumOrDefault(v, def = 0) {
  if (v === undefined || v === null || v === '') return def;
  const n = Number(v);
  return Number.isNaN(n) ? def : n;
}
function toBoolInt(v) {
  return v === 'on' || v === true || v === 1 || v === '1' ? 1 : 0;
}
function toNullableText(v) {
  return v === undefined || v === '' ? null : v;
}

function cleanCustomer(c) {
  return {
    ...c,
    zone_count: toIntOrNull(c.zone_count),
    exclude_from_mass_comms: toBoolInt(c.exclude_from_mass_comms),
    email: toNullableText(c.email),
    phone: toNullableText(c.phone),
    address: toNullableText(c.address),
    city: toNullableText(c.city),
    state: toNullableText(c.state),
    zip: toNullableText(c.zip),
    notes: toNullableText(c.notes),
    controller_brand: toNullableText(c.controller_brand),
    backflow_due_date: toNullableText(c.backflow_due_date),
    system_notes: toNullableText(c.system_notes),
  };
}

function cleanJob(j) {
  return {
    ...j,
    customer_id: toIntOrNull(j.customer_id),
    scheduled_date: toNullableText(j.scheduled_date),
    scheduled_time: toNullableText(j.scheduled_time),
    scheduled_time_end: toNullableText(j.scheduled_time_end),
    description: toNullableText(j.description),
  };
}

function cleanQuoteOrInvoice(o) {
  const cleaned = {
    ...o,
    customer_id: toIntOrNull(o.customer_id),
    tax_rate: toNumOrDefault(o.tax_rate, 0),
    notes: toNullableText(o.notes),
  };
  // due_date only exists on invoices, not quotes -- and job_id should never
  // get silently overwritten to null just because a form didn't include it.
  if ('due_date' in o) cleaned.due_date = toNullableText(o.due_date);
  if ('job_id' in o) cleaned.job_id = toIntOrNull(o.job_id);
  return cleaned;
}

function cleanExpense(e) {
  return {
    ...e,
    amount: toNumOrDefault(e.amount, 0),
    notes: toNullableText(e.notes),
  };
}

function cleanMileage(m) {
  return {
    ...m,
    miles: toNumOrDefault(m.miles, 0),
    purpose: toNullableText(m.purpose),
    job_id: 'job_id' in m ? toIntOrNull(m.job_id) : undefined,
  };
}

// Uploads a base64 data URL (from a file input) to Supabase Storage, and
// returns the public URL to store/display. Used for job photos and expense
// receipts alike.
async function uploadToStorage(base64DataUrl, folder) {
  const match = /^data:(.+);base64,(.+)$/.exec(base64DataUrl || '');
  if (!match) throw new Error('Invalid image data.');
  const [, mimeType, base64] = match;
  const ext = mimeType.split('/')[1] || 'jpg';
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const { error } = await sb.storage.from('attachments').upload(path, bytes, { contentType: mimeType });
  if (error) throw new Error(error.message);

  return sb.storage.from('attachments').getPublicUrl(path).data.publicUrl;
}

async function deleteFromStorage(url) {
  if (!url) return;
  const marker = '/attachments/';
  const idx = url.indexOf(marker);
  if (idx === -1) return;
  const path = url.slice(idx + marker.length);
  await sb.storage.from('attachments').remove([path]);
}

window.api = {
  isElectron: false,

  customers: {
    list: async () => unwrap(await sb.from('customers').select('*').order('name')),
    create: async (c) => unwrap(await sb.from('customers').insert(cleanCustomer(c)).select().single()),
    update: async (id, updates) => unwrap(await sb.from('customers').update(cleanCustomer(updates)).eq('id', id).select().single()),
    delete: async (id) => { await sb.from('customers').delete().eq('id', id); return { id }; },
    bulkImport: async (rows) => {
      const valid = rows.filter((r) => r.name && r.name.trim());
      const existing = unwrap(await sb.from('customers').select('*'));

      const normalizePhone = (p) => (p || '').replace(/\D/g, '');
      const byPhone = new Map(existing.filter((c) => c.phone).map((c) => [normalizePhone(c.phone), c]));
      const byName = new Map(existing.map((c) => [c.name.trim().toLowerCase(), c]));

      let createdCount = 0;
      let updatedCount = 0;

      for (const row of valid) {
        const phoneKey = normalizePhone(row.phone);
        const nameKey = (row.name || '').trim().toLowerCase();
        const match = (phoneKey && byPhone.get(phoneKey)) || byName.get(nameKey);

        // Only overwrite a field if the imported row actually has a value --
        // an empty cell in the spreadsheet shouldn't blank out existing data.
        const merged = {};
        for (const key of Object.keys(cleanCustomer(row))) {
          if (row[key] !== undefined && row[key] !== '') merged[key] = row[key];
        }

        if (match) {
          await sb.from('customers').update(cleanCustomer({ ...match, ...merged })).eq('id', match.id);
          updatedCount += 1;
        } else {
          const created = unwrap(await sb.from('customers').insert(cleanCustomer(row)).select().single());
          byPhone.set(normalizePhone(created.phone), created);
          byName.set(created.name.trim().toLowerCase(), created);
          createdCount += 1;
        }
      }

      return { created: new Array(createdCount), updatedCount, skippedCount: rows.length - valid.length };
    },
  },

  jobs: {
    list: async () => mapJobRows(unwrap(await sb.from('jobs').select('*, customers(name, phone)').order('scheduled_date', { nullsFirst: false }))),
    listByCustomer: async (customerId) => mapJobRows(unwrap(await sb.from('jobs').select('*, customers(name, phone)').eq('customer_id', customerId))),
    create: async (job) => mapJobRows([unwrap(await sb.from('jobs').insert(cleanJob(job)).select('*, customers(name, phone)').single())])[0],
    update: async (id, updates) => mapJobRows([unwrap(await sb.from('jobs').update(cleanJob(updates)).eq('id', id).select('*, customers(name, phone)').single())])[0],
    delete: async (id) => { await sb.from('jobs').delete().eq('id', id); return { id }; },
    bulkCreate: async (customerIds, template) => {
      const rows = customerIds.map((customer_id) => ({ ...template, customer_id }));
      return unwrap(await sb.from('jobs').insert(rows).select());
    },
    createNextOccurrence: async (jobId) => {
      const job = unwrap(await sb.from('jobs').select('*').eq('id', jobId).single());
      if (!job.scheduled_date || job.repeat_interval === 'none') throw new Error('This job has no repeat interval set.');
      const next = new Date(`${job.scheduled_date}T00:00:00`);
      if (job.repeat_interval === 'yearly') next.setFullYear(next.getFullYear() + 1);
      else if (job.repeat_interval === 'half_yearly') next.setMonth(next.getMonth() + 6);
      else if (job.repeat_interval === 'monthly') next.setMonth(next.getMonth() + 1);
      return unwrap(
        await sb
          .from('jobs')
          .insert({
            customer_id: job.customer_id,
            title: job.title,
            description: job.description,
            status: 'scheduled',
            scheduled_date: next.toISOString().slice(0, 10),
            scheduled_time: job.scheduled_time,
            repeat_interval: job.repeat_interval,
          })
          .select()
          .single()
      );
    },
  },

  jobPhotos: {
    list: async (jobId) => unwrap(await sb.from('job_photos').select('*').eq('job_id', jobId).order('created_at')),
    add: async (jobId, type, base64Data) => {
      const url = await uploadToStorage(base64Data, `jobs/${jobId}`);
      await sb.from('job_photos').insert({ job_id: jobId, type: type || 'before', filename: url });
      return unwrap(await sb.from('job_photos').select('*').eq('job_id', jobId).order('created_at'));
    },
    delete: async (id, jobId) => {
      const row = unwrap(await sb.from('job_photos').select('*').eq('id', id).single());
      await deleteFromStorage(row.filename);
      await sb.from('job_photos').delete().eq('id', id);
      return unwrap(await sb.from('job_photos').select('*').eq('job_id', jobId).order('created_at'));
    },
  },

  quotes: {
    list: async () => withTotals('quotes', 'quote_items', 'quote_id', unwrap(await sb.from('quotes').select('*, customers(name)').order('created_at', { ascending: false })).map(mapCustomerName)),
    get: async (id) => {
      const row = unwrap(await sb.from('quotes').select('*, customers(name)').eq('id', id).single());
      mapCustomerName(row);
      await withTotals('quotes', 'quote_items', 'quote_id', row);
      return row;
    },
    create: async (quote) => {
      const number = await generateDocNumber('quotes');
      const row = unwrap(await sb.from('quotes').insert({ ...cleanQuoteOrInvoice(stripItems(quote)), number }).select().single());
      await saveItems('quote_items', 'quote_id', row.id, quote.items);
      return window.api.quotes.get(row.id);
    },
    update: async (id, updates) => {
      await sb.from('quotes').update(cleanQuoteOrInvoice(stripItems(updates))).eq('id', id);
      if (updates.items) await saveItems('quote_items', 'quote_id', id, updates.items);
      return window.api.quotes.get(id);
    },
    delete: async (id) => { await sb.from('quotes').delete().eq('id', id); return { id }; },
    convertToJob: async (id, jobDetails) => {
      const quote = await window.api.quotes.get(id);
      const itemLines = quote.items.map((i) => `${i.quantity} x ${i.description} @ $${Number(i.unit_price).toFixed(2)}`).join('\n');
      const description = [quote.notes, itemLines].filter(Boolean).join('\n\n');
      const job = unwrap(
        await sb
          .from('jobs')
          .insert({
            customer_id: quote.customer_id,
            title: quote.title,
            description,
            status: 'scheduled',
            scheduled_date: jobDetails?.scheduled_date || null,
            scheduled_time: jobDetails?.scheduled_time || null,
          })
          .select()
          .single()
      );
      await sb.from('quotes').update({ status: 'approved', job_id: job.id }).eq('id', id);
      return job;
    },
  },

  invoices: {
    list: async () => withTotals('invoices', 'invoice_items', 'invoice_id', unwrap(await sb.from('invoices').select('*, customers(name), jobs(title)').order('created_at', { ascending: false })).map(mapInvoiceRow)),
    get: async (id) => {
      const row = unwrap(await sb.from('invoices').select('*, customers(name), jobs(title)').eq('id', id).single());
      mapInvoiceRow(row);
      await withTotals('invoices', 'invoice_items', 'invoice_id', row);
      return row;
    },
    create: async (invoice) => {
      const number = await generateDocNumber('invoices');
      const row = unwrap(await sb.from('invoices').insert({ ...cleanQuoteOrInvoice(stripItems(invoice)), number }).select().single());
      await saveItems('invoice_items', 'invoice_id', row.id, invoice.items);
      return window.api.invoices.get(row.id);
    },
    update: async (id, updates) => {
      await sb.from('invoices').update(cleanQuoteOrInvoice(stripItems(updates))).eq('id', id);
      if (updates.items) await saveItems('invoice_items', 'invoice_id', id, updates.items);
      return window.api.invoices.get(id);
    },
    delete: async (id) => { await sb.from('invoices').delete().eq('id', id); return { id }; },
  },

  expenses: {
    list: async () => unwrap(await sb.from('expenses').select('*').order('expense_date', { ascending: false })),
    listByYear: async (year) => unwrap(await sb.from('expenses').select('*').gte('expense_date', `${year}-01-01`).lte('expense_date', `${year}-12-31`)),
    create: async (expense) => {
      const receipt_filename = expense.receipt_data ? await uploadToStorage(expense.receipt_data, 'expenses') : null;
      return unwrap(await sb.from('expenses').insert({ ...cleanExpense(stripReceiptData(expense)), receipt_filename }).select().single());
    },
    update: async (id, updates) => {
      const existing = unwrap(await sb.from('expenses').select('*').eq('id', id).single());
      let receipt_filename = existing.receipt_filename;
      if (updates.receipt_data) {
        await deleteFromStorage(existing.receipt_filename);
        receipt_filename = await uploadToStorage(updates.receipt_data, 'expenses');
      } else if (updates.remove_receipt) {
        await deleteFromStorage(existing.receipt_filename);
        receipt_filename = null;
      }
      return unwrap(await sb.from('expenses').update({ ...cleanExpense(stripReceiptData(updates)), receipt_filename }).eq('id', id).select().single());
    },
    delete: async (id) => {
      const existing = unwrap(await sb.from('expenses').select('*').eq('id', id).single());
      await deleteFromStorage(existing.receipt_filename);
      await sb.from('expenses').delete().eq('id', id);
      return { id };
    },
  },

  mileage: {
    list: async () => unwrap(await sb.from('mileage_log').select('*').order('trip_date', { ascending: false })),
    listByYear: async (year) => unwrap(await sb.from('mileage_log').select('*').gte('trip_date', `${year}-01-01`).lte('trip_date', `${year}-12-31`)),
    create: async (trip) => unwrap(await sb.from('mileage_log').insert(cleanMileage(trip)).select().single()),
    update: async (id, updates) => unwrap(await sb.from('mileage_log').update(cleanMileage(updates)).eq('id', id).select().single()),
    delete: async (id) => { await sb.from('mileage_log').delete().eq('id', id); return { id }; },
  },

  reports: {
    getAvailableYears: async () => {
      const rows = unwrap(await sb.from('invoices').select('due_date, created_at'));
      const years = new Set(rows.map((r) => (r.due_date || r.created_at || '').slice(0, 4)).filter(Boolean));
      years.add(String(new Date().getFullYear()));
      return Array.from(years).sort().reverse();
    },
    getYearlyInvoiceReport: async (year) =>
      withTotals(
        'invoices',
        'invoice_items',
        'invoice_id',
        unwrap(await sb.from('invoices').select('*, customers(name), jobs(title)').gte('due_date', `${year}-01-01`).lte('due_date', `${year}-12-31`)).map(mapInvoiceRow)
      ),
  },

  settings: {
    get: async () => {
      const rows = unwrap(await sb.from('settings').select('*'));
      return Object.fromEntries(rows.map((r) => [r.key, r.value]));
    },
    set: async (key, value) => {
      await sb.from('settings').upsert({ key, value });
      return { key, value };
    },
  },

  email: {
    sendEstimate: (id) => invokeFunction('send-notifications', { type: 'estimate', id }),
    sendInvoice: (id) => invokeFunction('send-notifications', { type: 'invoice', id }),
    sendJobReminder: (id) => invokeFunction('send-notifications', { type: 'job-reminder', id }),
    sendReviewRequest: (id) => invokeFunction('send-notifications', { type: 'review-request', id }),
  },

  sms: {
    sendEstimateText: (quoteId) => invokeFunction('send-sms', { quoteId }),
  },

  payments: {
    createLinkForInvoice: async (invoiceId) => {
      const result = await invokeFunction('create-payment-link', { invoiceId });
      if (!result.ok) return result;
      const invoice = await window.api.invoices.get(invoiceId);
      return { ok: true, invoice };
    },
  },

  app: {
    getPhoneAccessUrl: async () => null,
    getCalendarUrl: async () => `${SUPABASE_URL}/functions/v1/smooth-action?apikey=${SUPABASE_ANON_KEY}`,
  },

  auth: {
    logout: async () => {
      await sb.auth.signOut();
      window.location.href = 'login.html';
    },
  },
};

function mapCustomerName(row) {
  row.customer_name = row.customers ? row.customers.name : '';
  delete row.customers;
  return row;
}

function mapInvoiceRow(row) {
  row.customer_name = row.customers ? row.customers.name : '';
  row.job_title = row.jobs ? row.jobs.title : null;
  delete row.customers;
  delete row.jobs;
  return row;
}

function mapJobRows(rows) {
  return rows.map((row) => {
    row.customer_name = row.customers ? row.customers.name : '';
    row.customer_phone = row.customers ? row.customers.phone : '';
    delete row.customers;
    return row;
  });
}

function stripItems(obj) {
  const { items, ...rest } = obj;
  return rest;
}

function stripReceiptData(obj) {
  const { receipt_data, remove_receipt, ...rest } = obj;
  return rest;
}
