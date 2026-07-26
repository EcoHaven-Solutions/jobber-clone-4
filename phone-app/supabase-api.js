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
  if (error) throw new Error(error.message);
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
  if (error) return { ok: false, error: error.message };
  return data;
}

window.api = {
  isElectron: false,

  customers: {
    list: async () => unwrap(await sb.from('customers').select('*').order('name')),
    create: async (c) => unwrap(await sb.from('customers').insert(c).select().single()),
    update: async (id, updates) => unwrap(await sb.from('customers').update(updates).eq('id', id).select().single()),
    delete: async (id) => { await sb.from('customers').delete().eq('id', id); return { id }; },
    bulkImport: async (rows) => {
      const valid = rows.filter((r) => r.name && r.name.trim());
      const created = valid.length ? unwrap(await sb.from('customers').insert(valid).select()) : [];
      return { created, skippedCount: rows.length - valid.length };
    },
  },

  jobs: {
    list: async () => unwrap(await sb.from('jobs').select('*, customers(name, phone)').order('scheduled_date', { nullsFirst: false })).then(mapJobRows),
    listByCustomer: async (customerId) => unwrap(await sb.from('jobs').select('*, customers(name, phone)').eq('customer_id', customerId)).then(mapJobRows),
    create: async (job) => unwrap(await sb.from('jobs').insert(job).select('*, customers(name, phone)').single()).then((r) => mapJobRows([r])[0]),
    update: async (id, updates) => unwrap(await sb.from('jobs').update(updates).eq('id', id).select('*, customers(name, phone)').single()).then((r) => mapJobRows([r])[0]),
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

  // Photo storage isn't wired up in the phone version yet (would need
  // Supabase Storage) -- these are safe no-ops so the buttons don't crash.
  jobPhotos: {
    list: async () => [],
    add: async () => { throw new Error('Photo uploads from the phone app aren\'t set up yet.'); },
    delete: async () => [],
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
      const row = unwrap(await sb.from('quotes').insert({ ...stripItems(quote), number }).select().single());
      await saveItems('quote_items', 'quote_id', row.id, quote.items);
      return window.api.quotes.get(row.id);
    },
    update: async (id, updates) => {
      await sb.from('quotes').update(stripItems(updates)).eq('id', id);
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
      const row = unwrap(await sb.from('invoices').insert({ ...stripItems(invoice), number }).select().single());
      await saveItems('invoice_items', 'invoice_id', row.id, invoice.items);
      return window.api.invoices.get(row.id);
    },
    update: async (id, updates) => {
      await sb.from('invoices').update(stripItems(updates)).eq('id', id);
      if (updates.items) await saveItems('invoice_items', 'invoice_id', id, updates.items);
      return window.api.invoices.get(id);
    },
    delete: async (id) => { await sb.from('invoices').delete().eq('id', id); return { id }; },
  },

  expenses: {
    list: async () => unwrap(await sb.from('expenses').select('*').order('expense_date', { ascending: false })),
    listByYear: async (year) => unwrap(await sb.from('expenses').select('*').gte('expense_date', `${year}-01-01`).lte('expense_date', `${year}-12-31`)),
    create: async (expense) => unwrap(await sb.from('expenses').insert(stripReceiptData(expense)).select().single()),
    update: async (id, updates) => unwrap(await sb.from('expenses').update(stripReceiptData(updates)).eq('id', id).select().single()),
    delete: async (id) => { await sb.from('expenses').delete().eq('id', id); return { id }; },
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
    sendEstimate: (id) => invokeFunction('send-notification', { type: 'estimate', id }),
    sendInvoice: (id) => invokeFunction('send-notification', { type: 'invoice', id }),
    sendJobReminder: (id) => invokeFunction('send-notification', { type: 'job-reminder', id }),
    sendReviewRequest: (id) => invokeFunction('send-notification', { type: 'review-request', id }),
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
    getCalendarUrl: async () => null,
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
