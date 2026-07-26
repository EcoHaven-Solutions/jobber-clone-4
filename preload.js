const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  customers: {
    list: () => ipcRenderer.invoke('customers:list'),
    get: (id) => ipcRenderer.invoke('customers:get', id),
    create: (customer) => ipcRenderer.invoke('customers:create', customer),
    update: (id, updates) => ipcRenderer.invoke('customers:update', id, updates),
    delete: (id) => ipcRenderer.invoke('customers:delete', id),
    bulkImport: (rows) => ipcRenderer.invoke('customers:bulkImport', rows),
  },
  jobs: {
    list: () => ipcRenderer.invoke('jobs:list'),
    listByCustomer: (customerId) => ipcRenderer.invoke('jobs:listByCustomer', customerId),
    get: (id) => ipcRenderer.invoke('jobs:get', id),
    create: (job) => ipcRenderer.invoke('jobs:create', job),
    update: (id, updates) => ipcRenderer.invoke('jobs:update', id, updates),
    delete: (id) => ipcRenderer.invoke('jobs:delete', id),
    bulkCreate: (customerIds, jobTemplate) => ipcRenderer.invoke('jobs:bulkCreate', customerIds, jobTemplate),
    createNextOccurrence: (jobId) => ipcRenderer.invoke('jobs:createNextOccurrence', jobId),
  },
  jobPhotos: {
    list: (jobId) => ipcRenderer.invoke('jobPhotos:list', jobId),
    add: (jobId, type, base64Data) => ipcRenderer.invoke('jobPhotos:add', jobId, type, base64Data),
    delete: (id, jobId) => ipcRenderer.invoke('jobPhotos:delete', id, jobId),
  },
  quotes: {
    list: () => ipcRenderer.invoke('quotes:list'),
    get: (id) => ipcRenderer.invoke('quotes:get', id),
    create: (quote) => ipcRenderer.invoke('quotes:create', quote),
    update: (id, updates) => ipcRenderer.invoke('quotes:update', id, updates),
    delete: (id) => ipcRenderer.invoke('quotes:delete', id),
    convertToJob: (id, jobDetails) => ipcRenderer.invoke('quotes:convertToJob', id, jobDetails),
  },
  invoices: {
    list: () => ipcRenderer.invoke('invoices:list'),
    get: (id) => ipcRenderer.invoke('invoices:get', id),
    create: (invoice) => ipcRenderer.invoke('invoices:create', invoice),
    update: (id, updates) => ipcRenderer.invoke('invoices:update', id, updates),
    delete: (id) => ipcRenderer.invoke('invoices:delete', id),
  },
  app: {
    getPhoneAccessUrl: () => ipcRenderer.invoke('app:getPhoneAccessUrl'),
    getCalendarUrl: () => ipcRenderer.invoke('app:getCalendarUrl'),
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    set: (key, value) => ipcRenderer.invoke('settings:set', key, value),
  },
  reports: {
    getAvailableYears: () => ipcRenderer.invoke('reports:getAvailableYears'),
    getYearlyInvoiceReport: (year) => ipcRenderer.invoke('reports:getYearlyInvoiceReport', year),
  },
  email: {
    sendEstimate: (quoteId) => ipcRenderer.invoke('email:sendEstimate', quoteId),
    sendInvoice: (invoiceId) => ipcRenderer.invoke('email:sendInvoice', invoiceId),
    sendJobReminder: (jobId) => ipcRenderer.invoke('email:sendJobReminder', jobId),
    sendReviewRequest: (jobId) => ipcRenderer.invoke('email:sendReviewRequest', jobId),
  },
  expenses: {
    list: () => ipcRenderer.invoke('expenses:list'),
    listByYear: (year) => ipcRenderer.invoke('expenses:listByYear', year),
    get: (id) => ipcRenderer.invoke('expenses:get', id),
    create: (expense) => ipcRenderer.invoke('expenses:create', expense),
    update: (id, updates) => ipcRenderer.invoke('expenses:update', id, updates),
    delete: (id) => ipcRenderer.invoke('expenses:delete', id),
    getAvailableYears: () => ipcRenderer.invoke('expenses:getAvailableYears'),
  },
  payments: {
    createLinkForInvoice: (invoiceId) => ipcRenderer.invoke('payments:createLinkForInvoice', invoiceId),
  },
  isElectron: true,
});
