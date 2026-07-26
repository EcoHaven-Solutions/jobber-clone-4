const express = require('express');
const session = require('express-session');
const path = require('path');
const crypto = require('crypto');
const db = require('./src/db');
const email = require('./src/email');
const payments = require('./src/payments');
const { buildJobsIcs } = require('./src/calendar');

function startServer(port = 4000) {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Persisted so sessions survive a server restart/redeploy, instead of
  // forcing everyone to log in again every time.
  let sessionSecret = db.getSetting('session_secret');
  if (!sessionSecret) {
    sessionSecret = crypto.randomBytes(32).toString('hex');
    db.setSetting('session_secret', sessionSecret);
  }

  app.use(
    session({
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }, // 30 days
    })
  );

  // ---- Auth (single business password, no per-user accounts) ----
  app.get('/api/auth/status', (req, res) => {
    res.json({ hasPassword: db.hasAppPassword(), authed: !!(req.session && req.session.authed) });
  });

  app.post('/api/auth/setup', (req, res) => {
    if (db.hasAppPassword()) return res.status(400).json({ ok: false, error: 'Password already set.' });
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ ok: false, error: 'Password must be at least 6 characters.' });
    }
    db.setAppPassword(password);
    req.session.authed = true;
    res.json({ ok: true });
  });

  app.post('/api/auth/login', (req, res) => {
    const { password } = req.body;
    if (!db.checkAppPassword(password || '')) {
      return res.status(401).json({ ok: false, error: 'Incorrect password.' });
    }
    req.session.authed = true;
    res.json({ ok: true });
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy(() => res.json({ ok: true }));
  });

  function requireAuth(req, res, next) {
    if (req.session && req.session.authed) return next();
    if (req.path.startsWith('/api/')) return res.status(401).json({ error: 'Not authenticated' });
    return res.redirect('/login.html');
  }

  // Login page itself must stay reachable without a session.
  app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'renderer', 'login.html'));
  });

  app.use(requireAuth);

  app.use(express.static(path.join(__dirname, 'renderer')));
  app.use('/receipts', express.static(db.receiptsDir));

  // ---- Customers ----
  app.get('/api/customers', (req, res) => res.json(db.listCustomers()));
  app.get('/api/customers/:id', (req, res) => res.json(db.getCustomer(Number(req.params.id))));
  app.post('/api/customers', (req, res) => res.json(db.createCustomer(req.body)));
  app.put('/api/customers/:id', (req, res) => res.json(db.updateCustomer(Number(req.params.id), req.body)));
  app.delete('/api/customers/:id', (req, res) => res.json(db.deleteCustomer(Number(req.params.id))));
  app.post('/api/customers/bulk-import', (req, res) => res.json(db.bulkImportCustomers(req.body.rows)));

  // ---- Jobs ----
  app.get('/api/jobs', (req, res) => {
    if (req.query.customer_id) {
      return res.json(db.listJobsByCustomer(Number(req.query.customer_id)));
    }
    res.json(db.listJobs());
  });
  app.get('/api/jobs/:id', (req, res) => res.json(db.getJob(Number(req.params.id))));
  app.post('/api/jobs', (req, res) => res.json(db.createJob(req.body)));
  app.put('/api/jobs/:id', (req, res) => res.json(db.updateJob(Number(req.params.id), req.body)));
  app.delete('/api/jobs/:id', (req, res) => res.json(db.deleteJob(Number(req.params.id))));
  app.post('/api/jobs/bulk', (req, res) => res.json(db.bulkCreateJobs(req.body.customerIds, req.body.jobTemplate)));
  app.post('/api/jobs/:id/next-occurrence', (req, res) => res.json(db.createNextOccurrence(Number(req.params.id))));

  // ---- Job photos ----
  app.get('/api/jobs/:id/photos', (req, res) => res.json(db.listJobPhotos(Number(req.params.id))));
  app.post('/api/jobs/:id/photos', (req, res) => res.json(db.addJobPhoto(Number(req.params.id), req.body.type, req.body.receipt_data)));
  app.delete('/api/job-photos/:id', (req, res) => res.json(db.deleteJobPhoto(Number(req.params.id))));

  // ---- Estimates (quotes) ----
  app.get('/api/quotes', (req, res) => res.json(db.listQuotes()));
  app.get('/api/quotes/:id', (req, res) => res.json(db.getQuote(Number(req.params.id))));
  app.post('/api/quotes', (req, res) => res.json(db.createQuote(req.body)));
  app.put('/api/quotes/:id', (req, res) => res.json(db.updateQuote(Number(req.params.id), req.body)));
  app.delete('/api/quotes/:id', (req, res) => res.json(db.deleteQuote(Number(req.params.id))));
  app.post('/api/quotes/:id/convert', (req, res) => res.json(db.convertQuoteToJob(Number(req.params.id), req.body)));

  // ---- Invoices ----
  app.get('/api/invoices', (req, res) => res.json(db.listInvoices()));
  app.get('/api/invoices/:id', (req, res) => res.json(db.getInvoice(Number(req.params.id))));
  app.post('/api/invoices', (req, res) => res.json(db.createInvoice(req.body)));
  app.put('/api/invoices/:id', (req, res) => res.json(db.updateInvoice(Number(req.params.id), req.body)));
  app.delete('/api/invoices/:id', (req, res) => res.json(db.deleteInvoice(Number(req.params.id))));

  // ---- Settings ----
  app.get('/api/settings', (req, res) => res.json(db.getSettings()));
  app.post('/api/settings', (req, res) => {
    const { key, value } = req.body;
    res.json(db.setSetting(key, value));
  });

  // ---- Email ----
  app.post('/api/quotes/:id/email', async (req, res) => {
    try {
      await email.sendEstimateEmail(Number(req.params.id));
      res.json({ ok: true });
    } catch (err) {
      res.json({ ok: false, error: err.message });
    }
  });
  app.post('/api/invoices/:id/email', async (req, res) => {
    try {
      await email.sendInvoiceEmail(Number(req.params.id));
      res.json({ ok: true });
    } catch (err) {
      res.json({ ok: false, error: err.message });
    }
  });
  app.post('/api/jobs/:id/reminder', async (req, res) => {
    try {
      await email.sendJobReminderEmail(Number(req.params.id));
      res.json({ ok: true });
    } catch (err) {
      res.json({ ok: false, error: err.message });
    }
  });
  app.post('/api/jobs/:id/review-request', async (req, res) => {
    try {
      await email.sendReviewRequestEmail(Number(req.params.id));
      res.json({ ok: true });
    } catch (err) {
      res.json({ ok: false, error: err.message });
    }
  });

  // ---- Expenses ----
  app.get('/api/expenses', (req, res) => res.json(db.listExpenses()));
  app.get('/api/expenses/years', (req, res) => res.json(db.getAvailableExpenseYears()));
  app.get('/api/expenses/by-year/:year', (req, res) => res.json(db.listExpensesByYear(req.params.year)));
  app.get('/api/expenses/:id', (req, res) => res.json(db.getExpense(Number(req.params.id))));
  app.post('/api/expenses', (req, res) => res.json(db.createExpense(req.body)));
  app.put('/api/expenses/:id', (req, res) => res.json(db.updateExpense(Number(req.params.id), req.body)));
  app.delete('/api/expenses/:id', (req, res) => res.json(db.deleteExpense(Number(req.params.id))));

  // ---- Reports ----
  app.get('/api/reports/years', (req, res) => res.json(db.getAvailableInvoiceYears()));
  app.get('/api/reports/yearly/:year', (req, res) => res.json(db.getYearlyInvoiceReport(req.params.year)));

  // ---- Payments ----
  app.post('/api/invoices/:id/payment-link', async (req, res) => {
    try {
      const invoice = await payments.createPaymentLinkForInvoice(Number(req.params.id));
      res.json({ ok: true, invoice });
    } catch (err) {
      res.json({ ok: false, error: err.message });
    }
  });

  // ---- Calendar feed ----
  app.get('/calendar.ics', (req, res) => {
    res.set('Content-Type', 'text/calendar; charset=utf-8');
    res.set('Content-Disposition', 'inline; filename="ecohaven-jobs.ics"');
    res.send(buildJobsIcs());
  });

  const listenPort = process.env.PORT || port;
  app.listen(listenPort, '0.0.0.0', () => {
    console.log(`Server listening on port ${listenPort}`);
  });
}

module.exports = { startServer };

// When run directly (npm start / hosted deployment), start the server
// immediately. When required by Electron's main.js instead, main.js calls
// startServer() itself, so this stays inert there.
if (require.main === module) {
  startServer();
}
