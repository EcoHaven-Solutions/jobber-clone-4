// This file only matters when the app is opened from a regular web browser
// (e.g. a phone on the same WiFi). Inside the Electron desktop app, preload.js
// already defines window.api before this script runs, so this is skipped there.
if (!window.api) {
  const json = (res) => {
    if (res.status === 401) {
      window.location.href = '/login.html';
      return new Promise(() => {}); // never resolves -- page is navigating away
    }
    return res.json();
  };
  const send = (url, method, body) =>
    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }).then(json);

  window.api = {
    customers: {
      list: () => fetch('/api/customers').then(json),
      get: (id) => fetch(`/api/customers/${id}`).then(json),
      create: (customer) => send('/api/customers', 'POST', customer),
      update: (id, updates) => send(`/api/customers/${id}`, 'PUT', updates),
      delete: (id) => send(`/api/customers/${id}`, 'DELETE'),
      bulkImport: (rows) => send('/api/customers/bulk-import', 'POST', { rows }),
    },
    jobs: {
      list: () => fetch('/api/jobs').then(json),
      listByCustomer: (customerId) => fetch(`/api/jobs?customer_id=${customerId}`).then(json),
      get: (id) => fetch(`/api/jobs/${id}`).then(json),
      create: (job) => send('/api/jobs', 'POST', job),
      update: (id, updates) => send(`/api/jobs/${id}`, 'PUT', updates),
      delete: (id) => send(`/api/jobs/${id}`, 'DELETE'),
      bulkCreate: (customerIds, jobTemplate) => send('/api/jobs/bulk', 'POST', { customerIds, jobTemplate }),
      createNextOccurrence: (jobId) => send(`/api/jobs/${jobId}/next-occurrence`, 'POST'),
    },
    jobPhotos: {
      list: (jobId) => fetch(`/api/jobs/${jobId}/photos`).then(json),
      add: (jobId, type, base64Data) => send(`/api/jobs/${jobId}/photos`, 'POST', { type, receipt_data: base64Data }),
      delete: (id) => send(`/api/job-photos/${id}`, 'DELETE'),
    },
    quotes: {
      list: () => fetch('/api/quotes').then(json),
      get: (id) => fetch(`/api/quotes/${id}`).then(json),
      create: (quote) => send('/api/quotes', 'POST', quote),
      update: (id, updates) => send(`/api/quotes/${id}`, 'PUT', updates),
      delete: (id) => send(`/api/quotes/${id}`, 'DELETE'),
      convertToJob: (id, jobDetails) => send(`/api/quotes/${id}/convert`, 'POST', jobDetails || {}),
    },
    invoices: {
      list: () => fetch('/api/invoices').then(json),
      get: (id) => fetch(`/api/invoices/${id}`).then(json),
      create: (invoice) => send('/api/invoices', 'POST', invoice),
      update: (id, updates) => send(`/api/invoices/${id}`, 'PUT', updates),
      delete: (id) => send(`/api/invoices/${id}`, 'DELETE'),
    },
    app: {
      // Not applicable when already viewing over the network from a phone.
      getPhoneAccessUrl: () => Promise.resolve(null),
      getCalendarUrl: () => Promise.resolve(null),
    },
    settings: {
      get: () => fetch('/api/settings').then(json),
      set: (key, value) => send('/api/settings', 'POST', { key, value }),
    },
    email: {
      sendEstimate: (quoteId) => send(`/api/quotes/${quoteId}/email`, 'POST'),
      sendInvoice: (invoiceId) => send(`/api/invoices/${invoiceId}/email`, 'POST'),
      sendJobReminder: (jobId) => send(`/api/jobs/${jobId}/reminder`, 'POST'),
      sendReviewRequest: (jobId) => send(`/api/jobs/${jobId}/review-request`, 'POST'),
    },
    reports: {
      getAvailableYears: () => fetch('/api/reports/years').then(json),
      getYearlyInvoiceReport: (year) => fetch(`/api/reports/yearly/${year}`).then(json),
    },
    expenses: {
      list: () => fetch('/api/expenses').then(json),
      listByYear: (year) => fetch(`/api/expenses/by-year/${year}`).then(json),
      get: (id) => fetch(`/api/expenses/${id}`).then(json),
      create: (expense) => send('/api/expenses', 'POST', expense),
      update: (id, updates) => send(`/api/expenses/${id}`, 'PUT', updates),
      delete: (id) => send(`/api/expenses/${id}`, 'DELETE'),
      getAvailableYears: () => fetch('/api/expenses/years').then(json),
    },
    payments: {
      createLinkForInvoice: (invoiceId) => send(`/api/invoices/${invoiceId}/payment-link`, 'POST'),
    },
    auth: {
      logout: () => send('/api/auth/logout', 'POST').then(() => { window.location.href = '/login.html'; }),
    },
    isElectron: false,
  };
}
