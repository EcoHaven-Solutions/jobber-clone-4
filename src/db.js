const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const Database = require('better-sqlite3');

// DATA_DIR is set by the hosting platform (e.g. Render's persistent disk
// mount path). Falls back to a local ./data folder for development.
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const dbPath = path.join(DATA_DIR, 'fieldbase.db');
const db = new Database(dbPath);

const receiptsDir = path.join(DATA_DIR, 'receipts');
if (!fs.existsSync(receiptsDir)) fs.mkdirSync(receiptsDir, { recursive: true });

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'scheduled',
    scheduled_date TEXT,
    scheduled_time TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_jobs_customer ON jobs(customer_id);
  CREATE INDEX IF NOT EXISTS idx_jobs_date ON jobs(scheduled_date);

  CREATE TABLE IF NOT EXISTS quotes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    notes TEXT,
    job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS quote_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quote_id INTEGER NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity REAL NOT NULL DEFAULT 1,
    unit_price REAL NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0
  );

  CREATE INDEX IF NOT EXISTS idx_quotes_customer ON quotes(customer_id);
  CREATE INDEX IF NOT EXISTS idx_quote_items_quote ON quote_items(quote_id);

  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'unpaid',
    due_date TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS invoice_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity REAL NOT NULL DEFAULT 1,
    unit_price REAL NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0
  );

  CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
  CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vendor TEXT NOT NULL,
    amount REAL NOT NULL DEFAULT 0,
    expense_date TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Other',
    notes TEXT,
    receipt_filename TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
`);

// ---- Lightweight migrations ----
// CREATE TABLE IF NOT EXISTS only handles brand-new installs; existing
// databases need columns added after the fact without losing data.
function ensureColumn(table, column, definition) {
  const existing = db.prepare(`PRAGMA table_info(${table})`).all();
  const hasColumn = existing.some((col) => col.name === column);
  if (!hasColumn) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

ensureColumn('quotes', 'tax_rate', 'REAL NOT NULL DEFAULT 0');
ensureColumn('invoices', 'tax_rate', 'REAL NOT NULL DEFAULT 0');
ensureColumn('invoices', 'payment_link_url', 'TEXT');
ensureColumn('quote_items', 'notes', 'TEXT');
ensureColumn('invoice_items', 'notes', 'TEXT');
ensureColumn('invoices', 'stripe_price_id', 'TEXT');
ensureColumn('quotes', 'number', 'TEXT');
ensureColumn('quotes', 'sent_at', 'TEXT');
ensureColumn('quotes', 'followup_1_sent', 'INTEGER NOT NULL DEFAULT 0');
ensureColumn('quotes', 'followup_2_sent', 'INTEGER NOT NULL DEFAULT 0');
ensureColumn('invoices', 'number', 'TEXT');

// Zone/system info kept on the customer record, since it's per-property
// rather than per-visit.
ensureColumn('customers', 'zone_count', 'INTEGER');
ensureColumn('customers', 'controller_brand', 'TEXT');
ensureColumn('customers', 'backflow_due_date', 'TEXT');
ensureColumn('customers', 'system_notes', 'TEXT');

// Recurrence + one-shot flags for reminders/review requests.
ensureColumn('jobs', 'repeat_interval', "TEXT NOT NULL DEFAULT 'none'");
ensureColumn('jobs', 'reminder_sent', 'INTEGER NOT NULL DEFAULT 0');
ensureColumn('jobs', 'review_requested', 'INTEGER NOT NULL DEFAULT 0');
ensureColumn('jobs', 'scheduled_time_end', 'TEXT');

db.exec(`
  CREATE TABLE IF NOT EXISTS job_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'before',
    filename TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_job_photos_job ON job_photos(job_id);
`);

db.exec(`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_quotes_number ON quotes(number);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_number ON invoices(number);
`);

// Generates a random, hard-to-guess 4-digit document number, retrying on
// the rare collision. Falls back to a 5th digit if the 4-digit space
// somehow fills up.
function generateDocNumber(table) {
  const existing = new Set(db.prepare(`SELECT number FROM ${table} WHERE number IS NOT NULL`).all().map((r) => r.number));
  let digits = 4;
  let attempts = 0;
  while (true) {
    const candidate = String(Math.floor(Math.random() * 9 * 10 ** (digits - 1)) + 10 ** (digits - 1));
    if (!existing.has(candidate)) return candidate;
    attempts += 1;
    if (attempts > 50) digits += 1;
  }
}

// Backfill any existing rows created before this feature existed.
for (const row of db.prepare('SELECT id FROM quotes WHERE number IS NULL').all()) {
  db.prepare('UPDATE quotes SET number = ? WHERE id = ?').run(generateDocNumber('quotes'), row.id);
}
for (const row of db.prepare('SELECT id FROM invoices WHERE number IS NULL').all()) {
  db.prepare('UPDATE invoices SET number = ? WHERE id = ?').run(generateDocNumber('invoices'), row.id);
}

function listCustomers() {
  return db.prepare('SELECT * FROM customers ORDER BY name COLLATE NOCASE ASC').all();
}

function getCustomer(id) {
  return db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
}

function createCustomer(customer) {
  const stmt = db.prepare(`
    INSERT INTO customers (name, email, phone, address, city, state, zip, notes, zone_count, controller_brand, backflow_due_date, system_notes)
    VALUES (@name, @email, @phone, @address, @city, @state, @zip, @notes, @zone_count, @controller_brand, @backflow_due_date, @system_notes)
  `);
  const info = stmt.run({
    name: customer.name,
    email: customer.email || null,
    phone: customer.phone || null,
    address: customer.address || null,
    city: customer.city || null,
    state: customer.state || null,
    zip: customer.zip || null,
    notes: customer.notes || null,
    zone_count: customer.zone_count ? Number(customer.zone_count) : null,
    controller_brand: customer.controller_brand || null,
    backflow_due_date: customer.backflow_due_date || null,
    system_notes: customer.system_notes || null,
  });
  return getCustomer(info.lastInsertRowid);
}

function updateCustomer(id, updates) {
  const existing = getCustomer(id);
  if (!existing) throw new Error(`Customer ${id} not found`);

  const merged = {
    ...existing,
    ...updates,
    zone_count: updates.zone_count !== undefined ? (updates.zone_count ? Number(updates.zone_count) : null) : existing.zone_count,
  };
  db.prepare(`
    UPDATE customers
    SET name = @name, email = @email, phone = @phone, address = @address,
        city = @city, state = @state, zip = @zip, notes = @notes,
        zone_count = @zone_count, controller_brand = @controller_brand,
        backflow_due_date = @backflow_due_date, system_notes = @system_notes,
        updated_at = datetime('now')
    WHERE id = @id
  `).run({ ...merged, id });

  return getCustomer(id);
}

function deleteCustomer(id) {
  db.prepare('DELETE FROM customers WHERE id = ?').run(id);
  return { id };
}

// Bulk-import customers from a parsed CSV. Skips rows with no name at all;
// everything else is optional and defaults sensibly.
const bulkImportCustomers = db.transaction((rows) => {
  const created = [];
  const skipped = [];
  for (const row of rows) {
    if (!row.name || !row.name.trim()) {
      skipped.push(row);
      continue;
    }
    created.push(createCustomer(row));
  }
  return { created, skippedCount: skipped.length };
});

// ---- Jobs ----
// Jobs are joined with customer name/phone here so the UI never has to
// make a second round-trip just to show "who is this job for."
const JOB_SELECT = `
  SELECT jobs.*, customers.name AS customer_name, customers.phone AS customer_phone
  FROM jobs
  JOIN customers ON customers.id = jobs.customer_id
`;

function listJobs() {
  return db.prepare(`${JOB_SELECT} ORDER BY (jobs.scheduled_date IS NULL), jobs.scheduled_date ASC, jobs.scheduled_time ASC`).all();
}

function listJobsByCustomer(customerId) {
  return db.prepare(`${JOB_SELECT} WHERE jobs.customer_id = ? ORDER BY jobs.scheduled_date DESC`).all(customerId);
}

function getJob(id) {
  return db.prepare(`${JOB_SELECT} WHERE jobs.id = ?`).get(id);
}

function createJob(job) {
  const stmt = db.prepare(`
    INSERT INTO jobs (customer_id, title, description, status, scheduled_date, scheduled_time, scheduled_time_end, repeat_interval)
    VALUES (@customer_id, @title, @description, @status, @scheduled_date, @scheduled_time, @scheduled_time_end, @repeat_interval)
  `);
  const info = stmt.run({
    customer_id: job.customer_id,
    title: job.title,
    description: job.description || null,
    status: job.status || 'scheduled',
    scheduled_date: job.scheduled_date || null,
    scheduled_time: job.scheduled_time || null,
    scheduled_time_end: job.scheduled_time_end || null,
    repeat_interval: job.repeat_interval || 'none',
  });
  return getJob(info.lastInsertRowid);
}

function updateJob(id, updates) {
  const existing = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id);
  if (!existing) throw new Error(`Job ${id} not found`);

  const merged = { ...existing, ...updates };
  db.prepare(`
    UPDATE jobs
    SET customer_id = @customer_id, title = @title, description = @description,
        status = @status, scheduled_date = @scheduled_date, scheduled_time = @scheduled_time,
        scheduled_time_end = @scheduled_time_end,
        repeat_interval = @repeat_interval, updated_at = datetime('now')
    WHERE id = @id
  `).run({ ...merged, id });

  return getJob(id);
}

function deleteJob(id) {
  db.prepare('DELETE FROM jobs WHERE id = ?').run(id);
  return { id };
}

// Bulk-create the same job (e.g. "Spring Startup") for many customers at
// once -- the seasonal maintenance use case.
const bulkCreateJobs = db.transaction((customerIds, jobTemplate) => {
  return customerIds.map((customerId) =>
    createJob({ ...jobTemplate, customer_id: customerId })
  );
});

// Adds a follow-up job for the same customer, offset by the job's repeat
// interval -- used for "Create next occurrence" on recurring jobs.
function createNextOccurrence(jobId) {
  const job = getJob(jobId);
  if (!job) throw new Error(`Job ${jobId} not found`);
  if (!job.scheduled_date || job.repeat_interval === 'none') {
    throw new Error('This job has no repeat interval set.');
  }

  const next = new Date(`${job.scheduled_date}T00:00:00`);
  if (job.repeat_interval === 'yearly') next.setFullYear(next.getFullYear() + 1);
  else if (job.repeat_interval === 'half_yearly') next.setMonth(next.getMonth() + 6);
  else if (job.repeat_interval === 'monthly') next.setMonth(next.getMonth() + 1);

  const nextDateStr = next.toISOString().slice(0, 10);

  return createJob({
    customer_id: job.customer_id,
    title: job.title,
    description: job.description,
    status: 'scheduled',
    scheduled_date: nextDateStr,
    scheduled_time: job.scheduled_time,
    repeat_interval: job.repeat_interval,
  });
}

// ---- Job photos (before/after) ----
function addJobPhoto(jobId, type, base64Data) {
  const filename = saveReceiptImage(base64Data); // same helper, same storage folder
  if (!filename) throw new Error('Invalid image data.');
  db.prepare('INSERT INTO job_photos (job_id, type, filename) VALUES (?, ?, ?)').run(jobId, type || 'before', filename);
  return listJobPhotos(jobId);
}

function listJobPhotos(jobId) {
  return db.prepare('SELECT * FROM job_photos WHERE job_id = ? ORDER BY created_at ASC').all(jobId);
}

function deleteJobPhoto(id) {
  const photo = db.prepare('SELECT * FROM job_photos WHERE id = ?').get(id);
  if (photo) deleteReceiptFile(photo.filename);
  db.prepare('DELETE FROM job_photos WHERE id = ?').run(id);
  return { id };
}

// ---- Reminders & review requests ----
function getJobsNeedingReminder(dateStr) {
  return db
    .prepare(
      `SELECT jobs.*, customers.name AS customer_name, customers.email AS customer_email, customers.phone AS customer_phone
       FROM jobs JOIN customers ON customers.id = jobs.customer_id
       WHERE jobs.scheduled_date = ? AND jobs.reminder_sent = 0 AND jobs.status != 'cancelled'`
    )
    .all(dateStr);
}

function markReminderSent(jobId) {
  db.prepare('UPDATE jobs SET reminder_sent = 1 WHERE id = ?').run(jobId);
}

function markReviewRequested(jobId) {
  db.prepare('UPDATE jobs SET review_requested = 1 WHERE id = ?').run(jobId);
}

// ---- Quotes ----
// Quotes carry their own line items; the total is always derived from
// those items rather than stored, so it can never drift out of sync.
const QUOTE_LIST_SELECT = `
  SELECT quotes.*, customers.name AS customer_name,
    (SELECT COALESCE(SUM(quantity * unit_price), 0) FROM quote_items WHERE quote_items.quote_id = quotes.id) AS subtotal,
    (SELECT COALESCE(SUM(quantity * unit_price), 0) FROM quote_items WHERE quote_items.quote_id = quotes.id)
      * (1 + quotes.tax_rate / 100.0) AS total
  FROM quotes
  JOIN customers ON customers.id = quotes.customer_id
`;

function listQuotes() {
  return db.prepare(`${QUOTE_LIST_SELECT} ORDER BY quotes.created_at DESC`).all();
}

function getQuote(id) {
  const quote = db.prepare(`${QUOTE_LIST_SELECT} WHERE quotes.id = ?`).get(id);
  if (!quote) return null;
  quote.items = db.prepare('SELECT * FROM quote_items WHERE quote_id = ? ORDER BY sort_order ASC, id ASC').all(id);
  return quote;
}

function replaceQuoteItems(quoteId, items) {
  db.prepare('DELETE FROM quote_items WHERE quote_id = ?').run(quoteId);
  const insert = db.prepare(`
    INSERT INTO quote_items (quote_id, description, quantity, unit_price, sort_order, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  (items || []).forEach((item, index) => {
    if (!item.description && !Number(item.unit_price)) return;
    insert.run(quoteId, item.description || 'Item', Number(item.quantity) || 1, Number(item.unit_price) || 0, index, item.notes || null);
  });
}

const createQuote = db.transaction((quote) => {
  const info = db.prepare(`
    INSERT INTO quotes (customer_id, title, status, notes, tax_rate, number)
    VALUES (@customer_id, @title, @status, @notes, @tax_rate, @number)
  `).run({
    customer_id: quote.customer_id,
    title: quote.title,
    status: quote.status || 'draft',
    notes: quote.notes || null,
    tax_rate: Number(quote.tax_rate) || 0,
    number: generateDocNumber('quotes'),
  });
  replaceQuoteItems(info.lastInsertRowid, quote.items);
  return getQuote(info.lastInsertRowid);
});

const updateQuote = db.transaction((id, updates) => {
  const existing = db.prepare('SELECT * FROM quotes WHERE id = ?').get(id);
  if (!existing) throw new Error(`Quote ${id} not found`);

  const merged = { ...existing, ...updates, tax_rate: Number(updates.tax_rate ?? existing.tax_rate) || 0 };
  db.prepare(`
    UPDATE quotes
    SET customer_id = @customer_id, title = @title, status = @status, notes = @notes,
        tax_rate = @tax_rate, updated_at = datetime('now')
    WHERE id = @id
  `).run({ ...merged, id });

  if (updates.items) replaceQuoteItems(id, updates.items);
  return getQuote(id);
});

function deleteQuote(id) {
  db.prepare('DELETE FROM quotes WHERE id = ?').run(id);
  return { id };
}

// Only records the first time an estimate is sent -- follow-up timing is
// based on the original send date, not any later re-sends.
function markQuoteSent(id) {
  db.prepare(`UPDATE quotes SET sent_at = COALESCE(sent_at, datetime('now')) WHERE id = ?`).run(id);
}

function markQuoteFollowupSent(id, stage) {
  const column = stage === 1 ? 'followup_1_sent' : 'followup_2_sent';
  db.prepare(`UPDATE quotes SET ${column} = 1 WHERE id = ?`).run(id);
}

// Finds estimates that are still awaiting a response two (or four) weeks
// after they were first sent, and haven't already gotten that follow-up.
function getQuotesNeedingFollowup() {
  return db
    .prepare(
      `${QUOTE_LIST_SELECT}
       WHERE quotes.status NOT IN ('approved', 'declined')
         AND quotes.sent_at IS NOT NULL
         AND (
           (quotes.followup_1_sent = 0 AND julianday('now') - julianday(quotes.sent_at) >= 14)
           OR
           (quotes.followup_1_sent = 1 AND quotes.followup_2_sent = 0 AND julianday('now') - julianday(quotes.sent_at) >= 28)
         )`
    )
    .all()
    .map((q) => ({ ...q, followupStage: q.followup_1_sent === 0 ? 1 : 2 }));
}

const convertQuoteToJob = db.transaction((id, jobDetails = {}) => {
  const quote = getQuote(id);
  if (!quote) throw new Error(`Quote ${id} not found`);

  const itemLines = quote.items
    .map((item) => `${item.quantity} x ${item.description} @ $${item.unit_price.toFixed(2)}`)
    .join('\n');
  const description = [quote.notes, itemLines].filter(Boolean).join('\n\n');

  const job = createJob({
    customer_id: quote.customer_id,
    title: quote.title,
    description,
    status: 'scheduled',
    scheduled_date: jobDetails.scheduled_date || null,
    scheduled_time: jobDetails.scheduled_time || null,
  });

  db.prepare(`UPDATE quotes SET status = 'approved', job_id = ?, updated_at = datetime('now') WHERE id = ?`).run(job.id, id);
  return job;
});

// ---- Invoices ----
// Same line-item pattern as quotes: total is always derived, never stored.
const INVOICE_LIST_SELECT = `
  SELECT invoices.*, customers.name AS customer_name, jobs.title AS job_title,
    (SELECT COALESCE(SUM(quantity * unit_price), 0) FROM invoice_items WHERE invoice_items.invoice_id = invoices.id) AS subtotal,
    (SELECT COALESCE(SUM(quantity * unit_price), 0) FROM invoice_items WHERE invoice_items.invoice_id = invoices.id)
      * (1 + invoices.tax_rate / 100.0) AS total
  FROM invoices
  JOIN customers ON customers.id = invoices.customer_id
  LEFT JOIN jobs ON jobs.id = invoices.job_id
`;

function listInvoices() {
  return db.prepare(`${INVOICE_LIST_SELECT} ORDER BY invoices.created_at DESC`).all();
}

function getInvoice(id) {
  const invoice = db.prepare(`${INVOICE_LIST_SELECT} WHERE invoices.id = ?`).get(id);
  if (!invoice) return null;
  invoice.items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY sort_order ASC, id ASC').all(id);
  return invoice;
}

function replaceInvoiceItems(invoiceId, items) {
  db.prepare('DELETE FROM invoice_items WHERE invoice_id = ?').run(invoiceId);
  const insert = db.prepare(`
    INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, sort_order, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  (items || []).forEach((item, index) => {
    if (!item.description && !Number(item.unit_price)) return;
    insert.run(invoiceId, item.description || 'Item', Number(item.quantity) || 1, Number(item.unit_price) || 0, index, item.notes || null);
  });
}

const createInvoice = db.transaction((invoice) => {
  const info = db.prepare(`
    INSERT INTO invoices (customer_id, job_id, title, status, due_date, notes, tax_rate, number)
    VALUES (@customer_id, @job_id, @title, @status, @due_date, @notes, @tax_rate, @number)
  `).run({
    customer_id: invoice.customer_id,
    job_id: invoice.job_id || null,
    title: invoice.title,
    status: invoice.status || 'unpaid',
    due_date: invoice.due_date || null,
    notes: invoice.notes || null,
    tax_rate: Number(invoice.tax_rate) || 0,
    number: generateDocNumber('invoices'),
  });
  replaceInvoiceItems(info.lastInsertRowid, invoice.items);
  return getInvoice(info.lastInsertRowid);
});

const updateInvoice = db.transaction((id, updates) => {
  const existing = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
  if (!existing) throw new Error(`Invoice ${id} not found`);

  const merged = {
    ...existing,
    ...updates,
    job_id: updates.job_id || null,
    tax_rate: Number(updates.tax_rate ?? existing.tax_rate) || 0,
  };
  db.prepare(`
    UPDATE invoices
    SET customer_id = @customer_id, job_id = @job_id, title = @title, status = @status,
        due_date = @due_date, notes = @notes, tax_rate = @tax_rate, updated_at = datetime('now')
    WHERE id = @id
  `).run({ ...merged, id });

  if (updates.items) replaceInvoiceItems(id, updates.items);
  return getInvoice(id);
});

function deleteInvoice(id) {
  db.prepare('DELETE FROM invoices WHERE id = ?').run(id);
  return { id };
}

function setInvoicePaymentLink(id, url, stripePriceId) {
  db.prepare(`UPDATE invoices SET payment_link_url = ?, stripe_price_id = ? WHERE id = ?`).run(url, stripePriceId, id);
  return getInvoice(id);
}

// ---- Reports ----
// Uses the due date when set, falling back to when the invoice was created,
// as the "date" an invoice counts toward for a given tax year.
function getAvailableInvoiceYears() {
  const rows = db
    .prepare(`SELECT DISTINCT strftime('%Y', COALESCE(due_date, created_at)) AS year FROM invoices ORDER BY year DESC`)
    .all();
  const years = rows.map((r) => r.year).filter(Boolean);
  const currentYear = String(new Date().getFullYear());
  if (!years.includes(currentYear)) years.unshift(currentYear);
  return years;
}

function getYearlyInvoiceReport(year) {
  return db
    .prepare(
      `${INVOICE_LIST_SELECT}
       WHERE strftime('%Y', COALESCE(invoices.due_date, invoices.created_at)) = ?
       ORDER BY COALESCE(invoices.due_date, invoices.created_at) ASC`
    )
    .all(String(year));
}

// ---- Settings (used for the Resend API key and sender email) ----

function getSetting(key) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? row.value : null;
}

function getSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

function setSetting(key, value) {
  db.prepare(`
    INSERT INTO settings (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(key, value);
  return { key, value };
}

// ---- Expenses ----
// Receipt photos are saved as files in a `receipts` folder next to the
// database; only the filename is stored in the row.
function saveReceiptImage(base64Data) {
  const match = /^data:(image\/\w+);base64,(.+)$/.exec(base64Data);
  if (!match) return null;
  const ext = match[1].split('/')[1].replace('jpeg', 'jpg');
  const filename = `receipt-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
  fs.writeFileSync(path.join(receiptsDir, filename), Buffer.from(match[2], 'base64'));
  return filename;
}

function deleteReceiptFile(filename) {
  if (!filename) return;
  const filePath = path.join(receiptsDir, filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

function listExpenses() {
  return db.prepare('SELECT * FROM expenses ORDER BY expense_date DESC, id DESC').all();
}

function listExpensesByYear(year) {
  return db
    .prepare(`SELECT * FROM expenses WHERE strftime('%Y', expense_date) = ? ORDER BY expense_date ASC`)
    .all(String(year));
}

function getExpense(id) {
  return db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);
}

function createExpense(expense) {
  const receiptFilename = expense.receipt_data ? saveReceiptImage(expense.receipt_data) : null;
  const info = db
    .prepare(
      `INSERT INTO expenses (vendor, amount, expense_date, category, notes, receipt_filename)
       VALUES (@vendor, @amount, @expense_date, @category, @notes, @receipt_filename)`
    )
    .run({
      vendor: expense.vendor,
      amount: Number(expense.amount) || 0,
      expense_date: expense.expense_date,
      category: expense.category || 'Other',
      notes: expense.notes || null,
      receipt_filename: receiptFilename,
    });
  return getExpense(info.lastInsertRowid);
}

function updateExpense(id, updates) {
  const existing = getExpense(id);
  if (!existing) throw new Error(`Expense ${id} not found`);

  let receiptFilename = existing.receipt_filename;
  if (updates.receipt_data) {
    deleteReceiptFile(existing.receipt_filename);
    receiptFilename = saveReceiptImage(updates.receipt_data);
  } else if (updates.remove_receipt) {
    deleteReceiptFile(existing.receipt_filename);
    receiptFilename = null;
  }

  const merged = { ...existing, ...updates, receipt_filename: receiptFilename };
  db.prepare(
    `UPDATE expenses
     SET vendor = @vendor, amount = @amount, expense_date = @expense_date, category = @category,
         notes = @notes, receipt_filename = @receipt_filename, updated_at = datetime('now')
     WHERE id = @id`
  ).run({ ...merged, amount: Number(merged.amount) || 0, id });

  return getExpense(id);
}

function deleteExpense(id) {
  const existing = getExpense(id);
  if (existing) deleteReceiptFile(existing.receipt_filename);
  db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
  return { id };
}

function getAvailableExpenseYears() {
  const rows = db.prepare(`SELECT DISTINCT strftime('%Y', expense_date) AS year FROM expenses ORDER BY year DESC`).all();
  const years = rows.map((r) => r.year).filter(Boolean);
  const currentYear = String(new Date().getFullYear());
  if (!years.includes(currentYear)) years.unshift(currentYear);
  return years;
}

// ---- Login (single business password, no per-user accounts) ----
function setAppPassword(plainPassword) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(plainPassword, salt, 64).toString('hex');
  setSetting('app_password_hash', `${salt}:${hash}`);
}

function checkAppPassword(plainPassword) {
  const stored = getSetting('app_password_hash');
  if (!stored) return false;
  const [salt, hash] = stored.split(':');
  const check = crypto.scryptSync(plainPassword, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(check, 'hex'));
}

function hasAppPassword() {
  return !!getSetting('app_password_hash');
}

module.exports = {
  listCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  bulkImportCustomers,
  listJobs,
  listJobsByCustomer,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  bulkCreateJobs,
  createNextOccurrence,
  addJobPhoto,
  listJobPhotos,
  deleteJobPhoto,
  getJobsNeedingReminder,
  markReminderSent,
  markReviewRequested,
  listQuotes,
  getQuote,
  createQuote,
  updateQuote,
  deleteQuote,
  convertQuoteToJob,
  markQuoteSent,
  markQuoteFollowupSent,
  getQuotesNeedingFollowup,
  listInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  setInvoicePaymentLink,
  getAvailableInvoiceYears,
  getYearlyInvoiceReport,
  listExpenses,
  listExpensesByYear,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  getAvailableExpenseYears,
  setAppPassword,
  checkAppPassword,
  hasAppPassword,
  receiptsDir,
  getSetting,
  getSettings,
  setSetting,
};
