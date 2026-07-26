const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const os = require('os');

// Pin the data folder to a fixed name, independent of the app's display name.
// This means renaming or repackaging the app later never orphans the
// existing SQLite database.
app.setPath('userData', path.join(app.getPath('appData'), 'fieldbase'));

const db = require('./src/db');
const email = require('./src/email');
const payments = require('./src/payments');
const { startServer } = require('./server');

const PHONE_ACCESS_PORT = 4000;

function getLocalNetworkUrl() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return `http://${iface.address}:${PHONE_ACCESS_PORT}`;
      }
    }
  }
  return null;
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#F5F4F1',
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

app.whenReady().then(() => {
  startServer(PHONE_ACCESS_PORT);
  createWindow();
  setTimeout(runDailyReminderCheck, 3000);
  setTimeout(runEstimateFollowupCheck, 4000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ---- Customer IPC handlers ----

ipcMain.handle('customers:list', () => {
  return db.listCustomers();
});

ipcMain.handle('customers:get', (event, id) => {
  return db.getCustomer(id);
});

ipcMain.handle('customers:create', (event, customer) => {
  return db.createCustomer(customer);
});

ipcMain.handle('customers:update', (event, id, updates) => {
  return db.updateCustomer(id, updates);
});

ipcMain.handle('customers:delete', (event, id) => {
  return db.deleteCustomer(id);
});

ipcMain.handle('customers:bulkImport', (event, rows) => {
  return db.bulkImportCustomers(rows);
});

// ---- Job IPC handlers ----

ipcMain.handle('jobs:list', () => {
  return db.listJobs();
});

ipcMain.handle('jobs:listByCustomer', (event, customerId) => {
  return db.listJobsByCustomer(customerId);
});

ipcMain.handle('jobs:get', (event, id) => {
  return db.getJob(id);
});

ipcMain.handle('jobs:create', (event, job) => {
  return db.createJob(job);
});

ipcMain.handle('jobs:update', (event, id, updates) => {
  return db.updateJob(id, updates);
});

ipcMain.handle('jobs:delete', (event, id) => {
  return db.deleteJob(id);
});

ipcMain.handle('jobs:bulkCreate', (event, customerIds, jobTemplate) => {
  return db.bulkCreateJobs(customerIds, jobTemplate);
});

ipcMain.handle('jobs:createNextOccurrence', (event, jobId) => {
  return db.createNextOccurrence(jobId);
});

ipcMain.handle('jobPhotos:list', (event, jobId) => {
  return db.listJobPhotos(jobId);
});

ipcMain.handle('jobPhotos:add', (event, jobId, type, base64Data) => {
  return db.addJobPhoto(jobId, type, base64Data);
});

ipcMain.handle('jobPhotos:delete', (event, id, jobId) => {
  db.deleteJobPhoto(id);
  return db.listJobPhotos(jobId);
});

// ---- Quote IPC handlers ----

ipcMain.handle('quotes:list', () => {
  return db.listQuotes();
});

ipcMain.handle('quotes:get', (event, id) => {
  return db.getQuote(id);
});

ipcMain.handle('quotes:create', (event, quote) => {
  return db.createQuote(quote);
});

ipcMain.handle('quotes:update', (event, id, updates) => {
  return db.updateQuote(id, updates);
});

ipcMain.handle('quotes:delete', (event, id) => {
  return db.deleteQuote(id);
});

ipcMain.handle('quotes:convertToJob', (event, id, jobDetails) => {
  return db.convertQuoteToJob(id, jobDetails);
});

// ---- Invoice IPC handlers ----

ipcMain.handle('invoices:list', () => {
  return db.listInvoices();
});

ipcMain.handle('invoices:get', (event, id) => {
  return db.getInvoice(id);
});

ipcMain.handle('invoices:create', (event, invoice) => {
  return db.createInvoice(invoice);
});

ipcMain.handle('invoices:update', (event, id, updates) => {
  return db.updateInvoice(id, updates);
});

ipcMain.handle('invoices:delete', (event, id) => {
  return db.deleteInvoice(id);
});

// ---- Reports ----

ipcMain.handle('reports:getAvailableYears', () => {
  return db.getAvailableInvoiceYears();
});

ipcMain.handle('reports:getYearlyInvoiceReport', (event, year) => {
  return db.getYearlyInvoiceReport(year);
});

// ---- Expenses ----

ipcMain.handle('expenses:list', () => {
  return db.listExpenses();
});

ipcMain.handle('expenses:listByYear', (event, year) => {
  return db.listExpensesByYear(year);
});

ipcMain.handle('expenses:get', (event, id) => {
  return db.getExpense(id);
});

ipcMain.handle('expenses:create', (event, expense) => {
  return db.createExpense(expense);
});

ipcMain.handle('expenses:update', (event, id, updates) => {
  return db.updateExpense(id, updates);
});

ipcMain.handle('expenses:delete', (event, id) => {
  return db.deleteExpense(id);
});

ipcMain.handle('expenses:getAvailableYears', () => {
  return db.getAvailableExpenseYears();
});

// ---- Payments ----

ipcMain.handle('payments:createLinkForInvoice', async (event, invoiceId) => {
  try {
    const invoice = await payments.createPaymentLinkForInvoice(invoiceId);
    return { ok: true, invoice };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

// ---- App info ----

ipcMain.handle('app:getPhoneAccessUrl', () => {
  return getLocalNetworkUrl();
});

ipcMain.handle('app:getCalendarUrl', () => {
  const base = getLocalNetworkUrl();
  return base ? `${base}/calendar.ics` : null;
});

// ---- Settings ----

ipcMain.handle('settings:get', () => {
  return db.getSettings();
});

ipcMain.handle('settings:set', (event, key, value) => {
  return db.setSetting(key, value);
});

// ---- Email ----

ipcMain.handle('email:sendEstimate', async (event, quoteId) => {
  try {
    await email.sendEstimateEmail(quoteId);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('email:sendInvoice', async (event, invoiceId) => {
  try {
    await email.sendInvoiceEmail(invoiceId);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('email:sendJobReminder', async (event, jobId) => {
  try {
    await email.sendJobReminderEmail(jobId);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('email:sendReviewRequest', async (event, jobId) => {
  try {
    await email.sendReviewRequestEmail(jobId);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

// Check once per launch for jobs scheduled tomorrow and email a reminder
// automatically, if the customer has an email on file and Gmail is set up.
// Silently skipped (never blocks startup) if anything's missing.
async function runDailyReminderCheck() {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const y = tomorrow.getFullYear();
    const m = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const d = String(tomorrow.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;

    const dueJobs = db.getJobsNeedingReminder(dateStr);
    for (const job of dueJobs) {
      if (!job.customer_email) continue;
      try {
        await email.sendJobReminderEmail(job.id);
      } catch (err) {
        // Missing Gmail setup, etc. -- skip quietly, user can send manually.
      }
    }
  } catch (err) {
    // Never let this interfere with the app opening.
  }
}

// Checks once per launch for estimates still awaiting a response 2 (or 4)
// weeks after they were first sent, and sends the appropriate follow-up.
async function runEstimateFollowupCheck() {
  try {
    const dueQuotes = db.getQuotesNeedingFollowup();
    for (const quote of dueQuotes) {
      try {
        await email.sendEstimateFollowupEmail(quote.id, quote.followupStage);
      } catch (err) {
        // Missing Gmail setup, no customer email, etc. -- skip quietly.
      }
    }
  } catch (err) {
    // Never let this interfere with the app opening.
  }
}
