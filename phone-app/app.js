let customers = [];
let jobs = [];
let quotes = [];
let invoices = [];
let editingCustomerId = null;
let mapboxAccessToken = ''; // loaded from settings once loadSettings() runs
let editingJobId = null;
let editingQuoteId = null;
let currentQuoteNumber = null;
let editingInvoiceId = null;
let currentInvoiceNumber = null;
let lineItemCounter = 0;

const STATUS_LABELS = {
  scheduled: 'Scheduled',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const QUOTE_STATUS_LABELS = {
  draft: 'Draft',
  sent: 'Sent',
  approved: 'Approved',
  declined: 'Declined',
};

const INVOICE_STATUS_LABELS = {
  unpaid: 'Unpaid',
  paid: 'Paid',
};

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ===================== View switching =====================

const navItems = document.querySelectorAll('.nav-item[data-view]');
const views = document.querySelectorAll('.view');

navItems.forEach((btn) => {
  btn.addEventListener('click', () => {
    navItems.forEach((b) => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    const target = btn.dataset.view;
    views.forEach((v) => {
      v.hidden = v.id !== `view-${target}`;
    });
    if (target === 'schedule' && window.initRouteMap) window.initRouteMap();
  });
});

// ===================== Customers =====================

const rowsEl = document.getElementById('customer-rows');
const emptyEl = document.getElementById('empty-state');
const countEl = document.getElementById('customer-count');
const searchEl = document.getElementById('search-input');

const overlay = document.getElementById('overlay');
const drawer = document.getElementById('drawer');
const form = document.getElementById('customer-form');
const drawerTitle = document.getElementById('drawer-title');
const drawerIdTag = document.getElementById('drawer-id-tag');
const deleteBtn = document.getElementById('btn-delete-customer');

async function loadCustomers() {
  customers = await window.api.customers.list();
  renderCustomers();
  populateJobCustomerSelect();
  populateQuoteCustomerSelect();
  populateInvoiceCustomerSelect();
}

function renderCustomers() {
  const query = searchEl.value.trim().toLowerCase();
  const filtered = query
    ? customers.filter((c) =>
        [c.name, c.phone, c.email].some((f) => (f || '').toLowerCase().includes(query))
      )
    : customers;

  countEl.textContent = `${customers.length} on file`;
  rowsEl.innerHTML = '';

  if (filtered.length === 0) {
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;

  for (const c of filtered) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td onclick="event.stopPropagation()"><input type="checkbox" class="customer-select-checkbox" value="${c.id}" style="width:auto;" ${selectedCustomerIds.has(c.id) ? 'checked' : ''} /></td>
      <td class="cell-id">C-${String(c.id).padStart(4, '0')}</td>
      <td class="cell-name">${escapeHtml(c.name)}</td>
      <td>${escapeHtml(c.phone || '—')}</td>
      <td>${escapeHtml(c.email || '—')}</td>
      <td>${escapeHtml(c.city || '—')}</td>
      <td class="cell-arrow">›</td>
    `;
    tr.addEventListener('click', () => openCustomerDrawer(c));
    tr.querySelector('.customer-select-checkbox').addEventListener('change', (e) => {
      if (e.target.checked) selectedCustomerIds.add(c.id);
      else selectedCustomerIds.delete(c.id);
      updateDeleteSelectedButton('customer', selectedCustomerIds);
    });
    rowsEl.appendChild(tr);
  }
}

const selectedCustomerIds = new Set();

document.getElementById('customer-select-all').addEventListener('change', (e) => {
  document.querySelectorAll('.customer-select-checkbox').forEach((cb) => {
    cb.checked = e.target.checked;
    const id = Number(cb.value);
    if (e.target.checked) selectedCustomerIds.add(id);
    else selectedCustomerIds.delete(id);
  });
  updateDeleteSelectedButton('customer', selectedCustomerIds);
});

document.getElementById('btn-delete-selected-customers').addEventListener('click', async () => {
  const count = selectedCustomerIds.size;
  const confirmed = confirm(
    `Delete ${count} customer(s)? This also permanently deletes all of their jobs, estimates, and invoices. This can't be undone.`
  );
  if (!confirmed) return;

  const btn = document.getElementById('btn-delete-selected-customers');
  btn.disabled = true;
  btn.textContent = 'Deleting…';

  for (const id of selectedCustomerIds) {
    await window.api.customers.delete(id);
  }
  selectedCustomerIds.clear();
  btn.disabled = false;

  await loadCustomers();
  await loadJobs();
});

function openCustomerDrawer(customer = null) {
  editingCustomerId = customer ? customer.id : null;
  form.reset();

  if (customer) {
    drawerTitle.textContent = 'Edit customer';
    drawerIdTag.textContent = `C-${String(customer.id).padStart(4, '0')}`;
    deleteBtn.hidden = false;
    for (const key of ['name', 'phone', 'email', 'address', 'city', 'state', 'zip', 'notes', 'zone_count', 'controller_brand', 'backflow_due_date', 'system_notes']) {
      if (form.elements[key]) form.elements[key].value = customer[key] || '';
    }
    form.elements.exclude_from_mass_comms.checked = !!customer.exclude_from_mass_comms;
  } else {
    drawerTitle.textContent = 'New customer';
    drawerIdTag.textContent = 'NEW';
    deleteBtn.hidden = true;
  }

  overlay.hidden = false;
  drawer.hidden = false;
}

function closeCustomerDrawer() {
  overlay.hidden = true;
  drawer.hidden = true;
  editingCustomerId = null;
}

// ---- Address autocomplete (free, via OpenStreetMap's Nominatim) ----

const addressInput = document.getElementById('customer-address-input');
const addressSuggestionsEl = document.getElementById('address-suggestions');
let addressSearchTimer = null;
let addressSearchToken = 0;

function hideAddressSuggestions() {
  addressSuggestionsEl.hidden = true;
  addressSuggestionsEl.innerHTML = '';
}

addressInput.addEventListener('input', () => {
  const query = addressInput.value.trim();
  clearTimeout(addressSearchTimer);

  if (query.length < 5) {
    hideAddressSuggestions();
    return;
  }

  const thisToken = ++addressSearchToken;
  addressSearchTimer = setTimeout(async () => {
    try {
      const suggestions = mapboxAccessToken
        ? await fetchMapboxSuggestions(query)
        : await fetchNominatimSuggestions(query);

      if (thisToken !== addressSearchToken) return; // a newer keystroke superseded this search

      if (!suggestions || suggestions.length === 0) {
        hideAddressSuggestions();
        return;
      }

      addressSuggestionsEl.innerHTML = suggestions
        .map((s, i) => `<div class="address-suggestion-item" data-index="${i}">${escapeHtml(s.label)}</div>`)
        .join('');
      addressSuggestionsEl.hidden = false;

      addressSuggestionsEl.querySelectorAll('.address-suggestion-item').forEach((el) => {
        el.addEventListener('click', () => {
          const s = suggestions[Number(el.dataset.index)];
          form.elements.address.value = s.address || '';
          form.elements.city.value = s.city || '';
          form.elements.state.value = s.state || '';
          form.elements.zip.value = s.zip || '';
          hideAddressSuggestions();
        });
      });
    } catch (err) {
      hideAddressSuggestions();
    }
  }, 350); // debounce so we're not hammering the geocoding service on every keystroke
});

// Mapbox Geocoding v6 -- much better accuracy than the free fallback,
// especially for rural addresses. Requires a free Mapbox token (Settings).
async function fetchMapboxSuggestions(query) {
  const url = `https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(query)}&access_token=${mapboxAccessToken}&country=us&types=address&autocomplete=true&limit=5`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.features) return [];

  return data.features.map((f) => {
    const ctx = f.properties.context || {};
    return {
      label: f.properties.full_address || f.properties.name,
      address: [ctx.address?.address_number, ctx.street?.name || ctx.address?.street_name].filter(Boolean).join(' ') || f.properties.name,
      city: ctx.place?.name || ctx.locality?.name || '',
      state: ctx.region?.region_code || ctx.region?.name || '',
      zip: ctx.postcode?.name || '',
    };
  });
}

// Free fallback (OpenStreetMap/Nominatim) used only if no Mapbox token has
// been set up yet in Settings -- lower accuracy but keeps things working.
async function fetchNominatimSuggestions(query) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&countrycodes=us&q=${encodeURIComponent(query)}`
  );
  const results = await res.json();
  return (results || []).map((r) => {
    const addr = r.address || {};
    return {
      label: r.display_name,
      address: [addr.house_number, addr.road].filter(Boolean).join(' '),
      city: addr.city || addr.town || addr.village || addr.hamlet || '',
      state: addr.state ? stateAbbreviation(addr.state) : '',
      zip: addr.postcode || '',
    };
  });
}

document.addEventListener('click', (e) => {
  if (!addressSuggestionsEl.contains(e.target) && e.target !== addressInput) {
    hideAddressSuggestions();
  }
});

const US_STATE_ABBREVIATIONS = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA',
  colorado: 'CO', connecticut: 'CT', delaware: 'DE', florida: 'FL', georgia: 'GA',
  hawaii: 'HI', idaho: 'ID', illinois: 'IL', indiana: 'IN', iowa: 'IA',
  kansas: 'KS', kentucky: 'KY', louisiana: 'LA', maine: 'ME', maryland: 'MD',
  massachusetts: 'MA', michigan: 'MI', minnesota: 'MN', mississippi: 'MS', missouri: 'MO',
  montana: 'MT', nebraska: 'NE', nevada: 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
  'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', ohio: 'OH',
  oklahoma: 'OK', oregon: 'OR', pennsylvania: 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', tennessee: 'TN', texas: 'TX', utah: 'UT', vermont: 'VT',
  virginia: 'VA', washington: 'WA', 'west virginia': 'WV', wisconsin: 'WI', wyoming: 'WY',
};

function stateAbbreviation(name) {
  return US_STATE_ABBREVIATIONS[name.toLowerCase()] || name;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  if (!data.name.trim()) return;

  try {
    if (editingCustomerId) {
      await window.api.customers.update(editingCustomerId, data);
    } else {
      await window.api.customers.create(data);
    }
  } catch (err) {
    alert(`Couldn't save customer: ${err.message}`);
    return;
  }

  closeCustomerDrawer();
  await loadCustomers();
  await loadJobs();
});

deleteBtn.addEventListener('click', async () => {
  if (!editingCustomerId) return;
  const confirmed = confirm('Delete this customer? This also removes their job history and cannot be undone.');
  if (!confirmed) return;

  await window.api.customers.delete(editingCustomerId);
  closeCustomerDrawer();
  await loadCustomers();
  await loadJobs();
});

document.getElementById('btn-new-customer').addEventListener('click', () => openCustomerDrawer());

// ---- CSV customer import ----

const CUSTOMER_CSV_FIELDS = [
  'name', 'email', 'phone', 'address', 'city', 'state', 'zip', 'notes',
  'zone_count', 'controller_brand', 'backflow_due_date', 'system_notes',
];

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

function csvRowsToCustomers(rows) {
  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'));
  return rows.slice(1).map((row) => {
    const obj = {};
    headers.forEach((header, i) => {
      if (CUSTOMER_CSV_FIELDS.includes(header)) {
        obj[header] = (row[i] || '').trim();
      }
    });
    return obj;
  });
}

let parsedImportRows = [];

document.getElementById('btn-import-csv').addEventListener('click', () => {
  document.getElementById('customer-csv-input').click();
});

document.getElementById('customer-csv-input').addEventListener('change', () => {
  const file = document.getElementById('customer-csv-input').files[0];
  if (!file) return;
  const isExcel = /\.xlsx?$/i.test(file.name);
  const reader = new FileReader();

  reader.onload = () => {
    let rows;
    if (isExcel) {
      const workbook = XLSX.read(reader.result, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, raw: false, defval: '' });
    } else {
      rows = parseCSV(reader.result);
    }

    parsedImportRows = csvRowsToCustomers(rows).filter((c) => c.name);

    const summaryEl = document.getElementById('import-summary');
    const previewRowsEl = document.getElementById('import-preview-rows');
    const skippedCount = rows.length - 1 - parsedImportRows.length;

    summaryEl.textContent = `${parsedImportRows.length} customer(s) ready to import${skippedCount > 0 ? ` (${skippedCount} row(s) skipped — no name)` : ''}.`;
    previewRowsEl.innerHTML = parsedImportRows
      .slice(0, 50)
      .map(
        (c) => `<tr><td>${escapeHtml(c.name || '')}</td><td>${escapeHtml(c.phone || '')}</td><td>${escapeHtml(c.email || '')}</td><td>${escapeHtml(c.city || '')}</td></tr>`
      )
      .join('');

    document.getElementById('import-overlay').hidden = false;
    document.getElementById('import-drawer').hidden = false;
    document.getElementById('customer-csv-input').value = '';
  };

  if (isExcel) reader.readAsArrayBuffer(file);
  else reader.readAsText(file);
});

function closeImportDrawer() {
  document.getElementById('import-overlay').hidden = true;
  document.getElementById('import-drawer').hidden = true;
  parsedImportRows = [];
}

document.getElementById('btn-close-import-drawer').addEventListener('click', closeImportDrawer);
document.getElementById('btn-cancel-import').addEventListener('click', closeImportDrawer);
document.getElementById('import-overlay').addEventListener('click', closeImportDrawer);

document.getElementById('btn-confirm-import').addEventListener('click', async () => {
  if (parsedImportRows.length === 0) {
    alert('No valid rows to import.');
    return;
  }
  const confirmBtn = document.getElementById('btn-confirm-import');
  confirmBtn.disabled = true;
  confirmBtn.textContent = 'Importing…';

  const result = await window.api.customers.bulkImport(parsedImportRows);

  confirmBtn.disabled = false;
  confirmBtn.textContent = 'Import customers';
  closeImportDrawer();
  await loadCustomers();
  alert(`Imported: ${result.created.length} new, ${result.updatedCount || 0} updated (matched existing).${result.skippedCount ? ` Skipped ${result.skippedCount} row(s) with no name.` : ''}`);
});

document.getElementById('btn-download-template').addEventListener('click', (e) => {
  e.preventDefault();
  const csv = CUSTOMER_CSV_FIELDS.join(',') + '\n' + 'Jane Smith,jane@example.com,555-123-4567,123 Main St,Kennewick,WA,99336,Gate code 1234,6,Rain Bird,2026-04-01,Backflow near garage';
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'customer-import-template.csv';
  a.click();
  URL.revokeObjectURL(url);
});
document.getElementById('btn-close-drawer').addEventListener('click', closeCustomerDrawer);
document.getElementById('btn-cancel-drawer').addEventListener('click', closeCustomerDrawer);
overlay.addEventListener('click', closeCustomerDrawer);
searchEl.addEventListener('input', renderCustomers);

// ===================== Jobs =====================

const jobRowsEl = document.getElementById('job-rows');
const jobEmptyEl = document.getElementById('job-empty-state');
const jobCountEl = document.getElementById('job-count');
const jobStatusFilter = document.getElementById('job-status-filter');

const jobOverlay = document.getElementById('job-overlay');
const jobDrawer = document.getElementById('job-drawer');
const jobForm = document.getElementById('job-form');
const jobDrawerTitle = document.getElementById('job-drawer-title');
const jobDrawerIdTag = document.getElementById('job-drawer-id-tag');
const jobDeleteBtn = document.getElementById('btn-delete-job');
const jobCreateInvoiceBtn = document.getElementById('btn-create-invoice-from-job');
const jobNextOccurrenceBtn = document.getElementById('btn-next-occurrence');
const jobSendReminderBtn = document.getElementById('btn-send-reminder');
const jobRequestReviewBtn = document.getElementById('btn-request-review');
const jobPhotoInput = document.getElementById('job-photo-input');
const jobPhotoTypeSelect = document.getElementById('job-photo-type');
const jobPhotoGallery = document.getElementById('job-photo-gallery');
const jobCustomerSelect = document.getElementById('job-customer-select');

function populateJobCustomerSelect() {
  const current = jobCustomerSelect.value;
  jobCustomerSelect.innerHTML = customers
    .map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`)
    .join('');
  if (current) jobCustomerSelect.value = current;
}

async function loadJobs() {
  jobs = await window.api.jobs.list();
  renderJobs();
  renderWeekView();
  renderUnscheduledJobs();
  populateInvoiceJobSelect();
}

function renderUnscheduledJobs() {
  const wrap = document.getElementById('unscheduled-jobs-wrap');
  const listEl = document.getElementById('unscheduled-jobs-list');
  const needsDate = jobs.filter((j) => !j.scheduled_date && j.status !== 'cancelled' && j.status !== 'completed');

  if (needsDate.length === 0) {
    wrap.hidden = true;
    return;
  }

  wrap.hidden = false;
  listEl.innerHTML = needsDate
    .map(
      (j) => `
      <div class="unscheduled-job-row" data-job-id="${j.id}">
        <div>
          <div class="ujr-title">${escapeHtml(j.title)}</div>
          <div class="ujr-customer">${escapeHtml(j.customer_name)}</div>
        </div>
        <span>›</span>
      </div>`
    )
    .join('');

  listEl.querySelectorAll('.unscheduled-job-row').forEach((row) => {
    row.addEventListener('click', () => {
      const job = jobs.find((j) => j.id === Number(row.dataset.jobId));
      if (job) openJobDrawer(job);
    });
  });
}

function formatTimeOnly(timeStr) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function formatTimeRange(startTime, endTime) {
  const start = formatTimeOnly(startTime);
  if (!start) return null;
  const end = formatTimeOnly(endTime);
  return end ? `${start}–${end}` : start;
}

function formatDate(dateStr, timeStr, timeEndStr) {
  if (!dateStr) return '<span class="badge badge-needs-schedule">Needs scheduling</span>';
  const d = new Date(`${dateStr}T${timeStr || '00:00'}`);
  const dateLabel = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  const timeRange = formatTimeRange(timeStr, timeEndStr);
  if (!timeRange) return `${dateLabel} · <span class="text-muted">no time set</span>`;
  return `${dateLabel} · ${timeRange}`;
}

function renderJobs() {
  const statusQuery = jobStatusFilter.value;
  const filtered = statusQuery ? jobs.filter((j) => j.status === statusQuery) : jobs;

  jobCountEl.textContent = `${jobs.length} total`;
  jobRowsEl.innerHTML = '';

  if (filtered.length === 0) {
    jobEmptyEl.hidden = false;
    return;
  }
  jobEmptyEl.hidden = true;

  for (const j of filtered) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td onclick="event.stopPropagation()"><input type="checkbox" class="job-select-checkbox" value="${j.id}" style="width:auto;" ${selectedJobIds.has(j.id) ? 'checked' : ''} /></td>
      <td class="cell-id">J-${String(j.id).padStart(4, '0')}</td>
      <td>${formatDate(j.scheduled_date, j.scheduled_time, j.scheduled_time_end)}</td>
      <td class="cell-name">${escapeHtml(j.title)}</td>
      <td>${escapeHtml(j.customer_name)}</td>
      <td><span class="badge badge-${j.status}">${STATUS_LABELS[j.status] || j.status}</span></td>
      <td class="cell-arrow">›</td>
    `;
    tr.addEventListener('click', () => openJobDrawer(j));
    tr.querySelector('.job-select-checkbox').addEventListener('change', (e) => {
      if (e.target.checked) selectedJobIds.add(j.id);
      else selectedJobIds.delete(j.id);
      updateDeleteSelectedButton('job', selectedJobIds);
    });
    jobRowsEl.appendChild(tr);
  }
}

const selectedJobIds = new Set();

// Shared by Jobs/Estimates/Invoices "Delete selected" buttons.
function updateDeleteSelectedButton(kind, selectedSet) {
  const btn = document.getElementById(`btn-delete-selected-${kind}s`);
  if (selectedSet.size > 0) {
    btn.hidden = false;
    btn.textContent = `Delete selected (${selectedSet.size})`;
  } else {
    btn.hidden = true;
  }
  const selectAll = document.getElementById(`${kind}-select-all`);
  const total = document.querySelectorAll(`.${kind}-select-checkbox`).length;
  selectAll.checked = selectedSet.size > 0 && selectedSet.size === total;
}

document.getElementById('job-select-all').addEventListener('change', (e) => {
  document.querySelectorAll('.job-select-checkbox').forEach((cb) => {
    cb.checked = e.target.checked;
    const id = Number(cb.value);
    if (e.target.checked) selectedJobIds.add(id);
    else selectedJobIds.delete(id);
  });
  updateDeleteSelectedButton('job', selectedJobIds);
});

document.getElementById('btn-delete-selected-jobs').addEventListener('click', async () => {
  const count = selectedJobIds.size;
  if (!confirm(`Delete ${count} job(s)? This can't be undone.`)) return;

  const btn = document.getElementById('btn-delete-selected-jobs');
  btn.disabled = true;
  btn.textContent = 'Deleting…';

  for (const id of selectedJobIds) {
    await window.api.jobs.delete(id);
  }
  selectedJobIds.clear();
  btn.disabled = false;

  await loadJobs();
});

async function renderJobPhotoGallery(jobId) {
  jobPhotoGallery.innerHTML = '';
  if (!jobId) return;
  const photos = await window.api.jobPhotos.list(jobId);
  for (const photo of photos) {
    const item = document.createElement('div');
    item.className = 'photo-gallery-item';
    item.innerHTML = `
      <img src="${receiptUrl(photo.filename)}" />
      <span class="photo-tag">${photo.type}</span>
      <button type="button" class="photo-remove" aria-label="Remove photo">&times;</button>
    `;
    item.querySelector('.photo-remove').addEventListener('click', async () => {
      await window.api.jobPhotos.delete(photo.id, jobId);
      renderJobPhotoGallery(jobId);
    });
    jobPhotoGallery.appendChild(item);
  }
}

const jobLineItemRowsEl = document.getElementById('job-line-item-rows');

function addJobLineItemRow(item = {}) {
  jobLineItemRowsEl.appendChild(createLineItemRow(item, updateJobTotal));
}

function updateJobTotal() {
  const subtotal = sumLineItemsFrom(jobLineItemRowsEl);
  document.getElementById('job-subtotal-display').textContent = formatCurrency(subtotal);
}

async function openJobDrawer(job = null) {
  editingJobId = job ? job.id : null;
  jobForm.reset();
  populateJobCustomerSelect();
  jobPhotoGallery.innerHTML = '';
  jobLineItemRowsEl.innerHTML = '';

  if (job) {
    const fullJob = await window.api.jobs.get(job.id);
    jobDrawerTitle.textContent = 'Edit job';
    jobDrawerIdTag.textContent = `J-${String(job.id).padStart(4, '0')}`;
    jobDeleteBtn.hidden = false;
    jobCreateInvoiceBtn.hidden = false;
    jobNextOccurrenceBtn.hidden = !job.scheduled_date || job.repeat_interval === 'none';
    jobSendReminderBtn.hidden = false;
    jobRequestReviewBtn.hidden = job.status !== 'completed';
    jobForm.elements.customer_id.value = job.customer_id;
    jobForm.elements.title.value = job.title || '';
    jobForm.elements.scheduled_date.value = job.scheduled_date || '';
    jobForm.elements.scheduled_time.value = job.scheduled_time || '';
    jobForm.elements.scheduled_time_end.value = job.scheduled_time_end || '';
    jobForm.elements.status.value = job.status || 'scheduled';
    jobForm.elements.repeat_interval.value = job.repeat_interval || 'none';
    jobForm.elements.description.value = job.description || '';
    (fullJob.items && fullJob.items.length ? fullJob.items : [{}]).forEach(addJobLineItemRow);
    updateJobTotal();
    renderJobPhotoGallery(job.id);
    const assignedIds = await window.api.jobEmployees.listForJob(job.id);
    renderJobEmployeeCheckboxes(assignedIds);
    renderJobProfitability(job.id);
    renderJobSignaturePreview(job);
  } else {
    jobDrawerTitle.textContent = 'New job';
    jobDrawerIdTag.textContent = 'NEW';
    jobDeleteBtn.hidden = true;
    jobCreateInvoiceBtn.hidden = true;
    jobNextOccurrenceBtn.hidden = true;
    jobSendReminderBtn.hidden = true;
    jobRequestReviewBtn.hidden = true;
    addJobLineItemRow();
    updateJobTotal();
    renderJobEmployeeCheckboxes([]);
    document.getElementById('job-profitability-wrap').hidden = true;
    document.getElementById('job-signature-preview-wrap').hidden = true;
  }

  jobOverlay.hidden = false;
  jobDrawer.hidden = false;
}

function renderJobProfitability(jobId) {
  const wrap = document.getElementById('job-profitability-wrap');
  const invoice = invoices.find((i) => i.job_id === jobId);

  if (!invoice) {
    wrap.hidden = true;
    return;
  }

  const jobExpenses = expenses.filter((e) => e.job_id === jobId).reduce((s, e) => s + e.amount, 0);
  const jobMileage = mileageTrips.filter((t) => t.job_id === jobId).reduce((s, t) => s + t.miles * mileageRate, 0);
  const costs = jobExpenses + jobMileage;
  const margin = invoice.total - costs;

  document.getElementById('job-profit-invoiced').textContent = formatCurrency(invoice.total);
  document.getElementById('job-profit-costs').textContent = formatCurrency(costs);
  document.getElementById('job-profit-margin').textContent = formatCurrency(margin);
  wrap.hidden = false;
}

function renderJobEmployeeCheckboxes(selectedIds) {
  const wrap = document.getElementById('job-employee-list');
  const activeEmployees = employees.filter((e) => e.active);
  if (activeEmployees.length === 0) {
    wrap.innerHTML = '<p class="empty-sub" style="margin:0;">No employees added yet.</p>';
    return;
  }
  wrap.innerHTML = activeEmployees
    .map(
      (e) => `
      <label style="display:flex; flex-direction:row; align-items:center; gap:8px; font-size:14px; padding:8px 10px; margin:0; white-space:nowrap;">
        <input type="checkbox" class="job-employee-checkbox" value="${e.id}" ${selectedIds.includes(e.id) ? 'checked' : ''} style="width:18px; height:18px; min-width:18px; flex:none; margin:0;" />
        <span>${escapeHtml(e.name)}</span>
      </label>`
    )
    .join('');
}

function closeJobDrawer() {
  jobOverlay.hidden = true;
  jobDrawer.hidden = true;
  editingJobId = null;
}

jobForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(jobForm).entries());
  if (!data.title.trim() || !data.customer_id) return;

  data.items = collectLineItemsFrom(jobLineItemRowsEl);

  let jobId = editingJobId;
  if (editingJobId) {
    await window.api.jobs.update(editingJobId, data);
  } else {
    const created = await window.api.jobs.create(data);
    jobId = created.id;
  }

  const assignedEmployeeIds = Array.from(document.querySelectorAll('.job-employee-checkbox:checked')).map((cb) => Number(cb.value));
  await window.api.jobEmployees.setForJob(jobId, assignedEmployeeIds);

  closeJobDrawer();
  await loadJobs();
});

jobDeleteBtn.addEventListener('click', async () => {
  if (!editingJobId) return;
  const confirmed = confirm('Delete this job? This cannot be undone.');
  if (!confirmed) return;

  await window.api.jobs.delete(editingJobId);
  closeJobDrawer();
  await loadJobs();
});

document.getElementById('btn-new-job').addEventListener('click', () => {
  if (customers.length === 0) {
    alert('Add a customer first, then you can schedule a job for them.');
    return;
  }
  openJobDrawer();
});
document.getElementById('btn-close-job-drawer').addEventListener('click', closeJobDrawer);
document.getElementById('btn-cancel-job-drawer').addEventListener('click', closeJobDrawer);
jobCreateInvoiceBtn.addEventListener('click', async () => {
  const job = jobs.find((j) => j.id === editingJobId);
  if (!job) return;
  const fullJob = await window.api.jobs.get(job.id);
  closeJobDrawer();
  openInvoiceDrawer(null, fullJob);
});

// Opens the phone's default texting app (Messages, or Google Voice if set
// as default) with the number and message pre-filled, ready to send.
// On desktop, sms: links don't reliably do anything (Safari has no way to
// hand them off), so we open Google Voice directly instead -- if it's
// pinned to the Dock/installed as an app, macOS should route it there.
function openTextCompose(phone, text) {
  const digits = (phone || '').replace(/[^\d+]/g, '');
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (isMobile && digits) {
    window.open(`sms:${digits}?&body=${encodeURIComponent(text)}`, '_blank');
  } else {
    window.open('https://voice.google.com/u/0/messages', '_blank');
    alert("Opened Google Voice. The message is copied -- just paste it (Cmd+V) into a new text.");
  }
}

function buildJobCopyText() {
  const customerId = jobForm.elements.customer_id.value;
  const customer = customers.find((c) => c.id === Number(customerId));
  const title = jobForm.elements.title.value || 'Job';
  const scheduledDate = jobForm.elements.scheduled_date.value;
  const timeRange = formatTimeRange(jobForm.elements.scheduled_time.value, jobForm.elements.scheduled_time_end.value);
  const notes = jobForm.elements.description.value;

  const lines = [];
  lines.push(`EcoHaven Solutions LLC — ${title}`);
  if (customer) lines.push(`For: ${customer.name}`);
  if (scheduledDate) {
    const dateLabel = new Date(`${scheduledDate}T00:00:00`).toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
    lines.push(`When: ${dateLabel}${timeRange ? `, ${timeRange}` : ''}`);
  } else {
    lines.push("When: we'll follow up to schedule");
  }
  if (customer && customer.address) lines.push(`Where: ${customer.address}, ${customer.city || ''} ${customer.state || ''}`.trim());
  if (notes) {
    lines.push('');
    lines.push(notes);
  }
  lines.push('');
  lines.push('Questions? Call/text 509-866-6388 or visit ecohavenpro.com');
  return lines.join('\n');
}

document.getElementById('btn-copy-job-text').addEventListener('click', async () => {
  const text = buildJobCopyText();
  const customerId = jobForm.elements.customer_id.value;
  const customer = customers.find((c) => c.id === Number(customerId));
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    // clipboard failed -- the text is still pre-filled in the texting app below
  }
  if (customer && customer.phone) {
    openTextCompose(customer.phone, text);
  } else {
    prompt('No phone number on file. Copy this text manually:', text);
  }
});

jobPhotoInput.addEventListener('change', () => {
  const file = jobPhotoInput.files[0];
  if (!file || !editingJobId) return;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      await window.api.jobPhotos.add(editingJobId, jobPhotoTypeSelect.value, reader.result);
      jobPhotoInput.value = '';
      renderJobPhotoGallery(editingJobId);
    } catch (err) {
      alert(err.message);
      jobPhotoInput.value = '';
    }
  };
  reader.readAsDataURL(file);
});

jobNextOccurrenceBtn.addEventListener('click', async () => {
  if (!editingJobId) return;
  const confirmed = confirm('Create the next occurrence of this recurring job?');
  if (!confirmed) return;
  await window.api.jobs.createNextOccurrence(editingJobId);
  closeJobDrawer();
  await loadJobs();
  alert('Next occurrence created — check the Schedule or Jobs tab.');
});

jobSendReminderBtn.addEventListener('click', async () => {
  if (!editingJobId) return;
  jobSendReminderBtn.disabled = true;
  jobSendReminderBtn.textContent = 'Sending…';
  const result = await window.api.email.sendJobReminder(editingJobId);
  jobSendReminderBtn.disabled = false;
  jobSendReminderBtn.textContent = 'Send reminder';
  alert(result.ok ? 'Reminder sent.' : `Couldn't send reminder: ${result.error}`);
});

jobRequestReviewBtn.addEventListener('click', async () => {
  if (!editingJobId) return;
  jobRequestReviewBtn.disabled = true;
  jobRequestReviewBtn.textContent = 'Sending…';
  const result = await window.api.email.sendReviewRequest(editingJobId);
  jobRequestReviewBtn.disabled = false;
  jobRequestReviewBtn.textContent = 'Request review';
  alert(result.ok ? 'Review request sent.' : `Couldn't send request: ${result.error}`);
});
jobOverlay.addEventListener('click', closeJobDrawer);
jobStatusFilter.addEventListener('change', renderJobs);

// ---- Seasonal batch job creation ----

const batchOverlay = document.getElementById('batch-overlay');
const batchDrawer = document.getElementById('batch-drawer');
const batchForm = document.getElementById('batch-form');
const batchCustomerListEl = document.getElementById('batch-customer-list');
const batchSelectAll = document.getElementById('batch-select-all');

function openBatchDrawer() {
  const eligibleCustomers = customers.filter((c) => !c.exclude_from_mass_comms);
  const excludedCount = customers.length - eligibleCustomers.length;

  if (eligibleCustomers.length === 0) {
    alert('Add some customers first, then you can batch-schedule jobs for them.');
    return;
  }
  batchForm.reset();
  batchCustomerListEl.innerHTML = eligibleCustomers
    .map(
      (c) => `
      <label class="batch-customer-row">
        <input type="checkbox" class="batch-customer-checkbox" value="${c.id}" />
        ${escapeHtml(c.name)}
      </label>`
    )
    .join('');
  document.getElementById('batch-excluded-note').textContent =
    excludedCount > 0 ? `${excludedCount} customer(s) opted out of mass communications and aren't shown here.` : '';
  batchSelectAll.checked = false;
  batchOverlay.hidden = false;
  batchDrawer.hidden = false;
}

function closeBatchDrawer() {
  batchOverlay.hidden = true;
  batchDrawer.hidden = true;
}

batchSelectAll.addEventListener('change', () => {
  document.querySelectorAll('.batch-customer-checkbox').forEach((cb) => {
    cb.checked = batchSelectAll.checked;
  });
});

batchForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(batchForm).entries());
  const customerIds = Array.from(document.querySelectorAll('.batch-customer-checkbox:checked')).map((cb) => Number(cb.value));

  if (!data.title.trim()) return;
  if (customerIds.length === 0) {
    alert('Select at least one customer.');
    return;
  }

  const submitBtn = batchForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Creating…';

  const createdJobs = await window.api.jobs.bulkCreate(customerIds, {
    title: data.title,
    scheduled_date: data.scheduled_date || null,
    description: data.description || null,
    repeat_interval: data.repeat_interval || 'none',
    status: 'scheduled',
  });

  const batchedCustomers = customers.filter((c) => customerIds.includes(c.id));

  // Auto-email anyone with an address on file; only the rest need the
  // copy-paste text list, since they've got no other automatic channel.
  let emailedCount = 0;
  const emailedCustomerIds = new Set();
  submitBtn.textContent = 'Emailing…';
  for (const job of createdJobs) {
    const customer = batchedCustomers.find((c) => c.id === job.customer_id);
    if (!customer || !customer.email) continue;
    const result = await window.api.email.sendJobReminder(job.id);
    if (result.ok) {
      emailedCount += 1;
      emailedCustomerIds.add(customer.id);
    }
  }

  submitBtn.disabled = false;
  submitBtn.textContent = 'Create jobs';

  const needsTextList = batchedCustomers.filter((c) => !emailedCustomerIds.has(c.id));
  closeBatchDrawer();
  await loadJobs();
  openBatchTextListDrawer(data.title, data.scheduled_date, needsTextList, emailedCount);
});

document.getElementById('btn-seasonal-batch').addEventListener('click', openBatchDrawer);
document.getElementById('btn-close-batch-drawer').addEventListener('click', closeBatchDrawer);
document.getElementById('btn-cancel-batch-drawer').addEventListener('click', closeBatchDrawer);
batchOverlay.addEventListener('click', closeBatchDrawer);

// ---- Copyable text list after a batch run ----

const batchTextOverlay = document.getElementById('batch-text-overlay');
const batchTextDrawer = document.getElementById('batch-text-drawer');
const batchTextMessage = document.getElementById('batch-text-message');
const batchTextCustomerList = document.getElementById('batch-text-customer-list');

function openBatchTextListDrawer(title, scheduledDate, needsTextList, emailedCount = 0) {
  document.getElementById('batch-text-title').textContent =
    emailedCount > 0 ? `Jobs created — ${emailedCount} emailed automatically` : 'Jobs created';

  const dateLabel = scheduledDate
    ? new Date(`${scheduledDate}T00:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
    : null;

  batchTextMessage.value = `Hi! Just a heads up, we have your "${title}" scheduled${dateLabel ? ` for ${dateLabel}` : ''}. Reply if you need to reschedule. — EcoHaven Solutions LLC, 509-866-6388`;

  if (needsTextList.length === 0) {
    batchTextCustomerList.innerHTML = '<div class="batch-customer-row">Everyone in this batch was emailed automatically — nothing left to text.</div>';
  } else {
    const withPhones = needsTextList.filter((c) => c.phone);
    batchTextCustomerList.innerHTML = withPhones.length
      ? withPhones.map((c) => `<div class="batch-customer-row">${escapeHtml(c.name)} — ${escapeHtml(c.phone)}</div>`).join('')
      : '<div class="batch-customer-row">No phone numbers on file for these customers.</div>';
  }

  batchTextOverlay.hidden = false;
  batchTextDrawer.hidden = false;
}

function closeBatchTextListDrawer() {
  batchTextOverlay.hidden = true;
  batchTextDrawer.hidden = true;
}

document.getElementById('btn-copy-batch-message').addEventListener('click', async () => {
  await navigator.clipboard.writeText(batchTextMessage.value);
  alert('Message copied.');
});

document.getElementById('btn-copy-batch-phones').addEventListener('click', async () => {
  const phones = Array.from(batchTextCustomerList.querySelectorAll('.batch-customer-row'))
    .map((row) => row.textContent.split('—').pop().trim())
    .filter((p) => p && p !== 'No phone numbers on file for these customers.');
  if (phones.length === 0) {
    alert('No phone numbers to copy.');
    return;
  }
  await navigator.clipboard.writeText(phones.join('\n'));
  alert('Phone numbers copied, one per line.');
});

document.getElementById('btn-close-batch-text-drawer').addEventListener('click', closeBatchTextListDrawer);
document.getElementById('btn-done-batch-text').addEventListener('click', closeBatchTextListDrawer);
batchTextOverlay.addEventListener('click', closeBatchTextListDrawer);

// ===================== Schedule (weekly view, home tab) =====================

const weekGridEl = document.getElementById('week-grid');
const weekRangeLabel = document.getElementById('week-range-label');

function startOfWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay()); // back up to Sunday
  return d;
}

let currentWeekStart = startOfWeek(new Date());

function dateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isSameDate(a, b) {
  return dateStr(a) === dateStr(b);
}

function renderWeekView() {
  if (!weekGridEl) return;
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  weekRangeLabel.textContent = `${days[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${days[6].toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;

  weekGridEl.innerHTML = '';
  for (const day of days) {
    const dayJobs = jobs
      .filter((j) => j.scheduled_date === dateStr(day))
      .sort((a, b) => (a.scheduled_time || '').localeCompare(b.scheduled_time || ''));

    const col = document.createElement('div');
    col.className = 'week-day' + (isSameDate(day, today) ? ' is-today' : '');

    const header = document.createElement('div');
    header.className = 'week-day-header';
    header.textContent = day.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    col.appendChild(header);

    const body = document.createElement('div');
    body.className = 'week-day-body';

    if (dayJobs.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'week-day-empty';
      empty.textContent = '—';
      body.appendChild(empty);
    } else {
      for (const job of dayJobs) {
        const card = document.createElement('div');
        card.className = `week-job-card status-${job.status}`;
        card.innerHTML = `
          <div class="wjc-time">${formatTimeRange(job.scheduled_time, job.scheduled_time_end) || 'No time set'}</div>
          <div class="wjc-title">${escapeHtml(job.title)}</div>
          <div class="wjc-customer">${escapeHtml(job.customer_name)}</div>
        `;
        card.addEventListener('click', () => openJobDrawer(job));
        body.appendChild(card);
      }
    }

    col.appendChild(body);
    weekGridEl.appendChild(col);
  }
}

document.getElementById('btn-week-prev').addEventListener('click', () => {
  currentWeekStart.setDate(currentWeekStart.getDate() - 7);
  renderWeekView();
});

document.getElementById('btn-week-next').addEventListener('click', () => {
  currentWeekStart.setDate(currentWeekStart.getDate() + 7);
  renderWeekView();
});

document.getElementById('btn-week-today').addEventListener('click', () => {
  currentWeekStart = startOfWeek(new Date());
  renderWeekView();
});

document.getElementById('btn-new-job-from-schedule').addEventListener('click', () => {
  if (customers.length === 0) {
    alert('Add a customer first, then you can schedule a job for them.');
    return;
  }
  openJobDrawer();
});

// ===================== Quotes =====================

const quoteRowsEl = document.getElementById('quote-rows');
const quoteEmptyEl = document.getElementById('quote-empty-state');
const quoteCountEl = document.getElementById('quote-count');
const quoteStatusFilter = document.getElementById('quote-status-filter');

const quoteOverlay = document.getElementById('quote-overlay');
const quoteDrawer = document.getElementById('quote-drawer');
const quoteForm = document.getElementById('quote-form');
const quoteDrawerTitle = document.getElementById('quote-drawer-title');
const quoteDrawerIdTag = document.getElementById('quote-drawer-id-tag');
const quoteDeleteBtn = document.getElementById('btn-delete-quote');
const quoteConvertBtn = document.getElementById('btn-convert-quote');
const quoteEmailBtn = document.getElementById('btn-email-quote');
const quoteTextBtn = document.getElementById('btn-text-quote');
const quoteCustomerSelect = document.getElementById('quote-customer-select');
const lineItemRowsEl = document.getElementById('line-item-rows');
const quoteTotalDisplay = document.getElementById('quote-total-display');

function populateQuoteCustomerSelect() {
  const current = quoteCustomerSelect.value;
  quoteCustomerSelect.innerHTML = customers
    .map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`)
    .join('');
  if (current) quoteCustomerSelect.value = current;
}

async function loadQuotes() {
  quotes = await window.api.quotes.list();
  renderQuotes();
}

function formatCurrency(amount) {
  return `$${Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function renderQuotes() {
  const statusQuery = quoteStatusFilter.value;
  const filtered = statusQuery ? quotes.filter((q) => q.status === statusQuery) : quotes;

  quoteCountEl.textContent = `${quotes.length} on file`;
  quoteRowsEl.innerHTML = '';

  if (filtered.length === 0) {
    quoteEmptyEl.hidden = false;
    return;
  }
  quoteEmptyEl.hidden = true;

  for (const q of filtered) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td onclick="event.stopPropagation()"><input type="checkbox" class="quote-select-checkbox" value="${q.id}" style="width:auto;" ${selectedQuoteIds.has(q.id) ? 'checked' : ''} /></td>
      <td class="cell-id">E-${q.number}</td>
      <td>${escapeHtml(q.customer_name)}</td>
      <td class="cell-name">${escapeHtml(q.title)}</td>
      <td>${formatCurrency(q.total)}</td>
      <td><span class="badge badge-${q.status}">${QUOTE_STATUS_LABELS[q.status] || q.status}</span></td>
      <td class="cell-arrow">›</td>
    `;
    tr.addEventListener('click', async () => {
      const full = await window.api.quotes.get(q.id);
      openQuoteDrawer(full);
    });
    tr.querySelector('.quote-select-checkbox').addEventListener('change', (e) => {
      if (e.target.checked) selectedQuoteIds.add(q.id);
      else selectedQuoteIds.delete(q.id);
      updateDeleteSelectedButton('quote', selectedQuoteIds);
    });
    quoteRowsEl.appendChild(tr);
  }
}

const selectedQuoteIds = new Set();

document.getElementById('quote-select-all').addEventListener('change', (e) => {
  document.querySelectorAll('.quote-select-checkbox').forEach((cb) => {
    cb.checked = e.target.checked;
    const id = Number(cb.value);
    if (e.target.checked) selectedQuoteIds.add(id);
    else selectedQuoteIds.delete(id);
  });
  updateDeleteSelectedButton('quote', selectedQuoteIds);
});

document.getElementById('btn-delete-selected-quotes').addEventListener('click', async () => {
  const count = selectedQuoteIds.size;
  if (!confirm(`Delete ${count} estimate(s)? This can't be undone.`)) return;

  const btn = document.getElementById('btn-delete-selected-quotes');
  btn.disabled = true;
  btn.textContent = 'Deleting…';

  for (const id of selectedQuoteIds) {
    await window.api.quotes.delete(id);
  }
  selectedQuoteIds.clear();
  btn.disabled = false;

  await loadQuotes();
});

function createLineItemRow(item, onChange) {
  lineItemCounter += 1;
  const row = document.createElement('div');
  row.className = 'line-item-row';
  row.innerHTML = `
    <div class="li-main-row">
      <input type="text" class="li-desc" placeholder="Description" value="${escapeHtml(item.description || '')}" />
      <input type="number" class="li-qty" min="0" step="any" value="${item.quantity ?? 1}" />
      <input type="number" class="li-price" min="0" step="0.01" value="${item.unit_price ?? 0}" />
      <button type="button" class="line-item-remove" aria-label="Remove item">&times;</button>
    </div>
    <input type="text" class="li-notes" placeholder="Details (optional) — e.g. brand, model, specifics" value="${escapeHtml(item.notes || '')}" />
  `;

  row.querySelector('.li-qty').addEventListener('input', onChange);
  row.querySelector('.li-price').addEventListener('input', onChange);
  row.querySelector('.line-item-remove').addEventListener('click', () => {
    row.remove();
    onChange();
  });

  return row;
}

function collectLineItemsFrom(container) {
  return Array.from(container.querySelectorAll('.line-item-row'))
    .map((row) => ({
      description: row.querySelector('.li-desc').value.trim(),
      quantity: parseFloat(row.querySelector('.li-qty').value) || 0,
      unit_price: parseFloat(row.querySelector('.li-price').value) || 0,
      notes: row.querySelector('.li-notes').value.trim(),
    }))
    // Only drop rows that are completely untouched (no description AND no
    // price) -- e.g. a spare "+ Add item" row nobody filled in.
    .filter((item) => item.description || item.unit_price);
}

// Used for the live running total: counts every row's quantity × price as you
// type, even before a description is entered. collectLineItemsFrom (above) is
// only for the actual save, where blank rows should be skipped.
function sumLineItemsFrom(container) {
  return Array.from(container.querySelectorAll('.line-item-row')).reduce((sum, row) => {
    const qty = parseFloat(row.querySelector('.li-qty').value) || 0;
    const price = parseFloat(row.querySelector('.li-price').value) || 0;
    return sum + qty * price;
  }, 0);
}

function addLineItemRow(item = {}) {
  lineItemRowsEl.appendChild(createLineItemRow(item, updateQuoteTotal));
}

function collectLineItems() {
  return collectLineItemsFrom(lineItemRowsEl);
}

function updateQuoteTotal() {
  const subtotal = sumLineItemsFrom(lineItemRowsEl);
  const rate = parseFloat(quoteForm.elements.tax_rate.value) || 0;
  const tax = subtotal * (rate / 100);
  document.getElementById('quote-subtotal-display').textContent = formatCurrency(subtotal);
  document.getElementById('quote-tax-display').textContent = formatCurrency(tax);
  quoteTotalDisplay.textContent = formatCurrency(subtotal + tax);
}

function openQuoteDrawer(quote = null) {
  editingQuoteId = quote ? quote.id : null;
  quoteForm.reset();
  populateQuoteCustomerSelect();
  lineItemRowsEl.innerHTML = '';

  if (quote) {
    quoteDrawerTitle.textContent = 'Edit estimate';
    quoteDrawerIdTag.textContent = `E-${quote.number}`;
    currentQuoteNumber = quote.number;
    quoteDeleteBtn.hidden = false;
    quoteConvertBtn.hidden = !!quote.job_id;
    const customer = customers.find((c) => c.id === quote.customer_id);
    quoteEmailBtn.hidden = !(customer && customer.email);
    quoteTextBtn.hidden = !(customer && customer.phone && twilioEnabled);
    quoteForm.elements.customer_id.value = quote.customer_id;
    quoteForm.elements.title.value = quote.title || '';
    quoteForm.elements.status.value = quote.status || 'draft';
    quoteForm.elements.tax_rate.value = quote.tax_rate || 0;
    quoteForm.elements.notes.value = quote.notes || '';
    (quote.items && quote.items.length ? quote.items : [{}]).forEach(addLineItemRow);
  } else {
    quoteDrawerTitle.textContent = 'New estimate';
    quoteDrawerIdTag.textContent = 'NEW';
    quoteDeleteBtn.hidden = true;
    quoteConvertBtn.hidden = true;
    quoteEmailBtn.hidden = true;
    quoteTextBtn.hidden = true;
    currentQuoteNumber = null;
    quoteForm.elements.tax_rate.value = defaultTaxRate;
    addLineItemRow();
  }

  updateQuoteTotal();
  quoteOverlay.hidden = false;
  quoteDrawer.hidden = false;
}

function closeQuoteDrawer() {
  quoteOverlay.hidden = true;
  quoteDrawer.hidden = true;
  editingQuoteId = null;
}

function buildQuoteDataFromForm() {
  const data = Object.fromEntries(new FormData(quoteForm).entries());
  data.items = collectLineItems();
  return data;
}

async function saveCurrentQuote() {
  const data = buildQuoteDataFromForm();
  if (!data.title.trim() || !data.customer_id) return false;

  if (editingQuoteId) {
    await window.api.quotes.update(editingQuoteId, data);
  } else {
    const created = await window.api.quotes.create(data);
    editingQuoteId = created.id;
  }
  return true;
}

quoteForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const saved = await saveCurrentQuote();
  if (!saved) return;

  closeQuoteDrawer();
  await loadQuotes();
});

quoteDeleteBtn.addEventListener('click', async () => {
  if (!editingQuoteId) return;
  const confirmed = confirm('Delete this estimate? This cannot be undone.');
  if (!confirmed) return;

  await window.api.quotes.delete(editingQuoteId);
  closeQuoteDrawer();
  await loadQuotes();
});

quoteConvertBtn.addEventListener('click', async () => {
  if (!editingQuoteId) return;
  const confirmed = confirm('Convert this estimate into a scheduled job? You can set the date from the Jobs tab afterward.');
  if (!confirmed) return;

  await saveCurrentQuote();
  await window.api.quotes.convertToJob(editingQuoteId, {});
  closeQuoteDrawer();
  await loadQuotes();
  await loadJobs();
  alert('Job created. Open the Jobs tab to set a date and time.');
});

function buildQuoteCopyText() {
  const customerId = quoteForm.elements.customer_id.value;
  const customer = customers.find((c) => c.id === Number(customerId));
  const title = quoteForm.elements.title.value || 'Estimate';
  const items = collectLineItems();
  const subtotal = sumLineItemsFrom(lineItemRowsEl);
  const rate = parseFloat(quoteForm.elements.tax_rate.value) || 0;
  const tax = subtotal * (rate / 100);
  const total = subtotal + tax;
  const idTag = editingQuoteId ? `E-${currentQuoteNumber || editingQuoteId}` : 'NEW';

  const lines = [];
  lines.push(`EcoHaven Solutions LLC — Estimate ${idTag}`);
  lines.push(title);
  if (customer) lines.push(`For: ${customer.name}`);
  lines.push('');
  items.forEach((item) => {
    lines.push(`${item.description || 'Item'} x${item.quantity} — ${formatCurrency(item.quantity * item.unit_price)}`);
    if (item.notes) lines.push(`  (${item.notes})`);
  });
  lines.push('');
  lines.push(`Subtotal: ${formatCurrency(subtotal)}`);
  if (rate) lines.push(`Tax (${rate}%): ${formatCurrency(tax)}`);
  lines.push(`Total: ${formatCurrency(total)}`);
  lines.push('');
  lines.push('Questions? Call/text 509-866-6388 or visit ecohavenpro.com');
  return lines.join('\n');
}

document.getElementById('btn-copy-quote-text').addEventListener('click', async () => {
  const text = buildQuoteCopyText();
  const customerId = quoteForm.elements.customer_id.value;
  const customer = customers.find((c) => c.id === Number(customerId));
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    // clipboard failed -- the text is still pre-filled in the texting app below
  }
  if (customer && customer.phone) {
    openTextCompose(customer.phone, text);
  } else {
    prompt('No phone number on file. Copy this text manually:', text);
  }
});

quoteEmailBtn.addEventListener('click', async () => {
  if (!editingQuoteId) return;
  quoteEmailBtn.disabled = true;
  quoteEmailBtn.textContent = 'Saving…';
  await saveCurrentQuote();
  quoteEmailBtn.textContent = 'Sending…';
  const result = await window.api.email.sendEstimate(editingQuoteId);
  quoteEmailBtn.disabled = false;
  quoteEmailBtn.textContent = 'Email to customer';
  if (result.ok) {
    alert('Estimate emailed to the customer.');
    await loadQuotes();
  } else {
    alert(`Couldn't send email: ${result.error}`);
  }
});

quoteTextBtn.addEventListener('click', async () => {
  if (!editingQuoteId) return;
  quoteTextBtn.disabled = true;
  quoteTextBtn.textContent = 'Saving…';
  await saveCurrentQuote();
  quoteTextBtn.textContent = 'Texting…';
  const result = await window.api.sms.sendEstimateText(editingQuoteId);
  quoteTextBtn.disabled = false;
  quoteTextBtn.textContent = 'Text estimate';
  if (result.ok) {
    alert('Estimate texted to the customer.');
    await loadQuotes();
  } else {
    alert(`Couldn't send text: ${result.error}`);
  }
});

document.getElementById('btn-new-quote').addEventListener('click', () => {
  if (customers.length === 0) {
    alert('Add a customer first, then you can build an estimate for them.');
    return;
  }
  openQuoteDrawer();
});
document.getElementById('btn-close-quote-drawer').addEventListener('click', closeQuoteDrawer);
document.getElementById('btn-cancel-quote-drawer').addEventListener('click', closeQuoteDrawer);
document.getElementById('btn-add-line-item').addEventListener('click', () => addLineItemRow());
document.getElementById('quote-tax-rate').addEventListener('input', updateQuoteTotal);
quoteOverlay.addEventListener('click', closeQuoteDrawer);
quoteStatusFilter.addEventListener('change', renderQuotes);

// ===================== Invoices =====================

const invoiceRowsEl = document.getElementById('invoice-rows');
const invoiceEmptyEl = document.getElementById('invoice-empty-state');
const invoiceCountEl = document.getElementById('invoice-count');
const invoiceStatusFilter = document.getElementById('invoice-status-filter');

const invoiceOverlay = document.getElementById('invoice-overlay');
const invoiceDrawer = document.getElementById('invoice-drawer');
const invoiceForm = document.getElementById('invoice-form');
const invoiceDrawerTitle = document.getElementById('invoice-drawer-title');
const invoiceDrawerIdTag = document.getElementById('invoice-drawer-id-tag');
const invoiceDeleteBtn = document.getElementById('btn-delete-invoice');
const invoiceEmailBtn = document.getElementById('btn-email-invoice');
const invoicePaymentLinkBtn = document.getElementById('btn-create-payment-link');
const invoicePaymentLinkWrap = document.getElementById('invoice-payment-link-wrap');
const invoicePaymentLinkDisplay = document.getElementById('invoice-payment-link-display');
const invoiceCustomerSelect = document.getElementById('invoice-customer-select');
const invoiceJobSelect = document.getElementById('invoice-job-select');
const invoiceLineItemRowsEl = document.getElementById('invoice-line-item-rows');
const invoiceTotalDisplay = document.getElementById('invoice-total-display');

function populateInvoiceCustomerSelect() {
  const current = invoiceCustomerSelect.value;
  invoiceCustomerSelect.innerHTML = customers
    .map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`)
    .join('');
  if (current) invoiceCustomerSelect.value = current;
}

function populateInvoiceJobSelect() {
  const current = invoiceJobSelect.value;
  invoiceJobSelect.innerHTML =
    '<option value="">No linked job</option>' +
    jobs
      .map((j) => `<option value="${j.id}">J-${String(j.id).padStart(4, '0')} — ${escapeHtml(j.title)} (${escapeHtml(j.customer_name)})</option>`)
      .join('');
  if (current) invoiceJobSelect.value = current;
}

invoiceJobSelect.addEventListener('change', async () => {
  // Only auto-fill for a brand-new invoice, and only if nothing's been
  // typed in yet -- never overwrite something the user already entered.
  if (editingInvoiceId || !invoiceJobSelect.value) return;

  const job = jobs.find((j) => j.id === Number(invoiceJobSelect.value));
  if (!job) return;

  if (!invoiceForm.elements.title.value.trim()) {
    invoiceForm.elements.title.value = job.title;
  }

  const existingItems = collectLineItemsFrom(invoiceLineItemRowsEl);
  if (existingItems.length === 0) {
    const fullJob = await window.api.jobs.get(job.id);
    invoiceLineItemRowsEl.innerHTML = '';
    if (fullJob.items && fullJob.items.length) {
      fullJob.items.forEach(addInvoiceLineItemRow);
    } else {
      addInvoiceLineItemRow({ description: job.title, quantity: 1, unit_price: 0 });
    }
    updateInvoiceTotal();
  }
});

async function loadInvoices() {
  invoices = await window.api.invoices.list();
  renderInvoices();
}

function renderInvoices() {
  const statusQuery = invoiceStatusFilter.value;
  const filtered = statusQuery ? invoices.filter((i) => i.status === statusQuery) : invoices;

  invoiceCountEl.textContent = `${invoices.length} on file`;
  invoiceRowsEl.innerHTML = '';

  if (filtered.length === 0) {
    invoiceEmptyEl.hidden = false;
    return;
  }
  invoiceEmptyEl.hidden = true;

  for (const inv of filtered) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td onclick="event.stopPropagation()"><input type="checkbox" class="invoice-select-checkbox" value="${inv.id}" style="width:auto;" ${selectedInvoiceIds.has(inv.id) ? 'checked' : ''} /></td>
      <td class="cell-id">I-${inv.number}</td>
      <td>${escapeHtml(inv.customer_name)}</td>
      <td class="cell-name">${escapeHtml(inv.title)}</td>
      <td>${inv.due_date || '—'}</td>
      <td>${formatCurrency(inv.total)}</td>
      <td><span class="badge badge-${inv.status}">${INVOICE_STATUS_LABELS[inv.status] || inv.status}</span></td>
      <td class="cell-arrow">›</td>
    `;
    tr.addEventListener('click', async () => {
      const full = await window.api.invoices.get(inv.id);
      openInvoiceDrawer(full);
    });
    tr.querySelector('.invoice-select-checkbox').addEventListener('change', (e) => {
      if (e.target.checked) selectedInvoiceIds.add(inv.id);
      else selectedInvoiceIds.delete(inv.id);
      updateDeleteSelectedButton('invoice', selectedInvoiceIds);
    });
    invoiceRowsEl.appendChild(tr);
  }
}

const selectedInvoiceIds = new Set();

document.getElementById('invoice-select-all').addEventListener('change', (e) => {
  document.querySelectorAll('.invoice-select-checkbox').forEach((cb) => {
    cb.checked = e.target.checked;
    const id = Number(cb.value);
    if (e.target.checked) selectedInvoiceIds.add(id);
    else selectedInvoiceIds.delete(id);
  });
  updateDeleteSelectedButton('invoice', selectedInvoiceIds);
});

document.getElementById('btn-delete-selected-invoices').addEventListener('click', async () => {
  const count = selectedInvoiceIds.size;
  if (!confirm(`Delete ${count} invoice(s)? This can't be undone.`)) return;

  const btn = document.getElementById('btn-delete-selected-invoices');
  btn.disabled = true;
  btn.textContent = 'Deleting…';

  for (const id of selectedInvoiceIds) {
    await window.api.invoices.delete(id);
  }
  selectedInvoiceIds.clear();
  btn.disabled = false;

  await loadInvoices();
});

function addInvoiceLineItemRow(item = {}) {
  invoiceLineItemRowsEl.appendChild(createLineItemRow(item, updateInvoiceTotal));
}

function updateInvoiceTotal() {
  const subtotal = sumLineItemsFrom(invoiceLineItemRowsEl);
  const rate = parseFloat(invoiceForm.elements.tax_rate.value) || 0;
  const tax = subtotal * (rate / 100);
  document.getElementById('invoice-subtotal-display').textContent = formatCurrency(subtotal);
  document.getElementById('invoice-tax-display').textContent = formatCurrency(tax);
  invoiceTotalDisplay.textContent = formatCurrency(subtotal + tax);
}

function updateRecurringInvoiceFieldsVisibility() {
  const isRecurring = invoiceForm.elements.recurring_interval.value !== 'none';
  document.getElementById('invoice-next-date-wrap').hidden = !isRecurring;
  document.getElementById('invoice-recurring-hint').hidden = !isRecurring;
  if (isRecurring && !invoiceForm.elements.next_invoice_date.value) {
    invoiceForm.elements.next_invoice_date.value = dateStr(new Date());
  }
}

document.getElementById('invoice-recurring-interval').addEventListener('change', updateRecurringInvoiceFieldsVisibility);

function openInvoiceDrawer(invoice = null, fromJob = null) {
  editingInvoiceId = invoice ? invoice.id : null;
  invoiceForm.reset();
  populateInvoiceCustomerSelect();
  populateInvoiceJobSelect();
  invoiceLineItemRowsEl.innerHTML = '';

  if (invoice) {
    invoiceDrawerTitle.textContent = 'Edit invoice';
    invoiceDrawerIdTag.textContent = `I-${invoice.number}`;
    currentInvoiceNumber = invoice.number;
    invoiceDeleteBtn.hidden = false;
    const customer = customers.find((c) => c.id === invoice.customer_id);
    invoiceEmailBtn.hidden = !(customer && customer.email);
    invoicePaymentLinkBtn.hidden = false;
    invoicePaymentLinkBtn.textContent = invoice.payment_link_url ? 'Regenerate payment link' : 'Create payment link';
    if (invoice.payment_link_url) {
      invoicePaymentLinkDisplay.value = invoice.payment_link_url;
      invoicePaymentLinkWrap.hidden = false;
    } else {
      invoicePaymentLinkWrap.hidden = true;
    }
    invoiceForm.elements.customer_id.value = invoice.customer_id;
    invoiceForm.elements.job_id.value = invoice.job_id || '';
    invoiceForm.elements.title.value = invoice.title || '';
    invoiceForm.elements.due_date.value = invoice.due_date || '';
    invoiceForm.elements.status.value = invoice.status || 'unpaid';
    invoiceForm.elements.tax_rate.value = invoice.tax_rate || 0;
    invoiceForm.elements.notes.value = invoice.notes || '';
    invoiceForm.elements.recurring_interval.value = invoice.recurring_interval || 'none';
    invoiceForm.elements.next_invoice_date.value = invoice.next_invoice_date || '';
    updateRecurringInvoiceFieldsVisibility();
    (invoice.items && invoice.items.length ? invoice.items : [{}]).forEach(addInvoiceLineItemRow);
  } else {
    invoiceDrawerTitle.textContent = 'New invoice';
    invoiceDrawerIdTag.textContent = 'NEW';
    invoiceDeleteBtn.hidden = true;
    invoiceEmailBtn.hidden = true;
    invoicePaymentLinkBtn.hidden = true;
    invoicePaymentLinkWrap.hidden = true;
    currentInvoiceNumber = null;
    invoiceForm.elements.tax_rate.value = defaultTaxRate;
    updateRecurringInvoiceFieldsVisibility();
    if (fromJob) {
      invoiceForm.elements.customer_id.value = fromJob.customer_id;
      invoiceForm.elements.job_id.value = fromJob.id;
      invoiceForm.elements.title.value = fromJob.title;
      if (fromJob.items && fromJob.items.length) {
        fromJob.items.forEach(addInvoiceLineItemRow);
      } else {
        addInvoiceLineItemRow({ description: fromJob.title, quantity: 1, unit_price: 0 });
      }
    } else {
      addInvoiceLineItemRow();
    }
  }

  updateInvoiceTotal();
  invoiceOverlay.hidden = false;
  invoiceDrawer.hidden = false;
}

function closeInvoiceDrawer() {
  invoiceOverlay.hidden = true;
  invoiceDrawer.hidden = true;
  editingInvoiceId = null;
}

function buildInvoiceDataFromForm() {
  const data = Object.fromEntries(new FormData(invoiceForm).entries());
  data.items = collectLineItemsFrom(invoiceLineItemRowsEl);
  return data;
}

async function saveCurrentInvoice() {
  const data = buildInvoiceDataFromForm();
  if (!data.title.trim() || !data.customer_id) return false;

  if (editingInvoiceId) {
    await window.api.invoices.update(editingInvoiceId, data);
  } else {
    const created = await window.api.invoices.create(data);
    editingInvoiceId = created.id;
  }
  return true;
}

invoiceForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const saved = await saveCurrentInvoice();
  if (!saved) return;

  closeInvoiceDrawer();
  await loadInvoices();
});

invoiceDeleteBtn.addEventListener('click', async () => {
  if (!editingInvoiceId) return;
  const confirmed = confirm('Delete this invoice? This cannot be undone.');
  if (!confirmed) return;

  await window.api.invoices.delete(editingInvoiceId);
  closeInvoiceDrawer();
  await loadInvoices();
});

invoicePaymentLinkBtn.addEventListener('click', async () => {
  if (!editingInvoiceId) return;
  invoicePaymentLinkBtn.disabled = true;
  invoicePaymentLinkBtn.textContent = 'Saving…';
  await saveCurrentInvoice();
  invoicePaymentLinkBtn.textContent = 'Creating…';
  const result = await window.api.payments.createLinkForInvoice(editingInvoiceId);
  invoicePaymentLinkBtn.disabled = false;
  if (result.ok) {
    invoicePaymentLinkDisplay.value = result.invoice.payment_link_url;
    invoicePaymentLinkWrap.hidden = false;
    invoicePaymentLinkBtn.textContent = 'Regenerate payment link';
    await loadInvoices();
  } else {
    invoicePaymentLinkBtn.textContent = 'Create payment link';
    alert(`Couldn't create payment link: ${result.error}`);
  }
});

function buildInvoiceCopyText() {
  const customerId = invoiceForm.elements.customer_id.value;
  const customer = customers.find((c) => c.id === Number(customerId));
  const title = invoiceForm.elements.title.value || 'Invoice';
  const dueDate = invoiceForm.elements.due_date.value;
  const items = collectLineItemsFrom(invoiceLineItemRowsEl);
  const subtotal = sumLineItemsFrom(invoiceLineItemRowsEl);
  const rate = parseFloat(invoiceForm.elements.tax_rate.value) || 0;
  const tax = subtotal * (rate / 100);
  const total = subtotal + tax;
  const idTag = currentInvoiceNumber ? `I-${currentInvoiceNumber}` : 'NEW';
  const payLink = invoicePaymentLinkWrap.hidden ? null : invoicePaymentLinkDisplay.value;

  const lines = [];
  lines.push(`EcoHaven Solutions LLC — Invoice ${idTag}`);
  lines.push(title);
  if (customer) lines.push(`For: ${customer.name}`);
  lines.push('');
  items.forEach((item) => {
    lines.push(`${item.description || 'Item'} x${item.quantity} — ${formatCurrency(item.quantity * item.unit_price)}`);
    if (item.notes) lines.push(`  (${item.notes})`);
  });
  lines.push('');
  lines.push(`Subtotal: ${formatCurrency(subtotal)}`);
  if (rate) lines.push(`Tax (${rate}%): ${formatCurrency(tax)}`);
  lines.push(`Total: ${formatCurrency(total)}`);
  if (dueDate) lines.push(`Due: ${dueDate}`);
  if (payLink) {
    lines.push('');
    lines.push(`Pay online: ${payLink}`);
  }
  lines.push('');
  lines.push('Questions? Call/text 509-866-6388 or visit ecohavenpro.com');
  return lines.join('\n');
}

document.getElementById('btn-copy-invoice-text').addEventListener('click', async () => {
  const text = buildInvoiceCopyText();
  const customerId = invoiceForm.elements.customer_id.value;
  const customer = customers.find((c) => c.id === Number(customerId));
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    // clipboard failed -- the text is still pre-filled in the texting app below
  }
  if (customer && customer.phone) {
    openTextCompose(customer.phone, text);
  } else {
    prompt('No phone number on file. Copy this text manually:', text);
  }
});

invoiceEmailBtn.addEventListener('click', async () => {
  if (!editingInvoiceId) return;
  invoiceEmailBtn.disabled = true;
  invoiceEmailBtn.textContent = 'Saving…';
  await saveCurrentInvoice();
  invoiceEmailBtn.textContent = 'Sending…';
  const result = await window.api.email.sendInvoice(editingInvoiceId);
  invoiceEmailBtn.disabled = false;
  invoiceEmailBtn.textContent = 'Email to customer';
  if (result.ok) {
    alert('Invoice emailed to the customer.');
    await loadInvoices();
  } else {
    alert(`Couldn't send email: ${result.error}`);
  }
});

document.getElementById('btn-new-invoice').addEventListener('click', () => {
  if (customers.length === 0) {
    alert('Add a customer first, then you can create an invoice for them.');
    return;
  }
  openInvoiceDrawer();
});
document.getElementById('btn-close-invoice-drawer').addEventListener('click', closeInvoiceDrawer);
document.getElementById('btn-cancel-invoice-drawer').addEventListener('click', closeInvoiceDrawer);
document.getElementById('btn-add-invoice-line-item').addEventListener('click', () => addInvoiceLineItemRow());
document.getElementById('btn-add-job-line-item').addEventListener('click', () => addJobLineItemRow());
document.getElementById('invoice-tax-rate').addEventListener('input', updateInvoiceTotal);
invoiceOverlay.addEventListener('click', closeInvoiceDrawer);
invoiceStatusFilter.addEventListener('change', renderInvoices);

// ===================== Expenses =====================

function receiptUrl(filename) {
  if (!filename) return null;
  if (/^https?:\/\//.test(filename)) return filename; // already a full Supabase Storage URL
  if (window.api.isElectron) return `http://localhost:4000/receipts/${filename}`;
  return `${window.location.origin}/receipts/${filename}`;
}

let expenses = [];
let editingExpenseId = null;
let pendingReceiptData = null; // base64 of a newly-chosen photo, if any
let removeReceiptFlag = false;

const expenseRowsEl = document.getElementById('expense-rows');
const expenseEmptyEl = document.getElementById('expense-empty-state');
const expenseCountEl = document.getElementById('expense-count');

const expenseOverlay = document.getElementById('expense-overlay');
const expenseDrawer = document.getElementById('expense-drawer');
const expenseForm = document.getElementById('expense-form');
const expenseDrawerTitle = document.getElementById('expense-drawer-title');
const expenseDrawerIdTag = document.getElementById('expense-drawer-id-tag');
const expenseDeleteBtn = document.getElementById('btn-delete-expense');
const expenseReceiptInput = document.getElementById('expense-receipt-input');
const expenseReceiptPreviewWrap = document.getElementById('expense-receipt-preview-wrap');
const expenseReceiptPreview = document.getElementById('expense-receipt-preview');

async function loadExpenses() {
  expenses = await window.api.expenses.list();
  renderExpenses();
}

function renderExpenses() {
  expenseCountEl.textContent = `${expenses.length} on file`;
  expenseRowsEl.innerHTML = '';

  if (expenses.length === 0) {
    expenseEmptyEl.hidden = false;
    return;
  }
  expenseEmptyEl.hidden = true;

  for (const exp of expenses) {
    const tr = document.createElement('tr');
    const thumb = exp.receipt_filename
      ? `<img class="receipt-thumb" src="${receiptUrl(exp.receipt_filename)}" />`
      : `<div class="receipt-thumb-placeholder">—</div>`;
    tr.innerHTML = `
      <td>${thumb}</td>
      <td>${exp.expense_date}</td>
      <td class="cell-name">${escapeHtml(exp.vendor)}</td>
      <td>${escapeHtml(exp.category)}</td>
      <td>${formatCurrency(exp.amount)}</td>
      <td class="cell-arrow">›</td>
    `;
    tr.addEventListener('click', () => openExpenseDrawer(exp));
    expenseRowsEl.appendChild(tr);
  }
}

function populateExpenseJobSelect() {
  const select = document.getElementById('expense-job-select');
  const current = select.value;
  select.innerHTML = '<option value="">— None —</option>';
  for (const j of jobs) {
    const opt = document.createElement('option');
    opt.value = j.id;
    opt.textContent = `${j.title} — ${j.customer_name}`;
    select.appendChild(opt);
  }
  select.value = current;
}

function resetReceiptPicker() {
  pendingReceiptData = null;
  removeReceiptFlag = false;
  expenseReceiptInput.value = '';
  expenseReceiptPreviewWrap.hidden = true;
  expenseReceiptPreview.src = '';
}

function openExpenseDrawer(expense = null) {
  editingExpenseId = expense ? expense.id : null;
  expenseForm.reset();
  resetReceiptPicker();
  populateExpenseJobSelect();

  if (expense) {
    expenseDrawerTitle.textContent = 'Edit expense';
    expenseDrawerIdTag.textContent = `X-${String(expense.id).padStart(4, '0')}`;
    expenseDeleteBtn.hidden = false;
    expenseForm.elements.vendor.value = expense.vendor || '';
    expenseForm.elements.amount.value = expense.amount || 0;
    expenseForm.elements.expense_date.value = expense.expense_date || '';
    expenseForm.elements.category.value = expense.category || 'Other';
    expenseForm.elements.job_id.value = expense.job_id || '';
    expenseForm.elements.notes.value = expense.notes || '';
    if (expense.receipt_filename) {
      expenseReceiptPreview.src = receiptUrl(expense.receipt_filename);
      expenseReceiptPreviewWrap.hidden = false;
    }
  } else {
    expenseDrawerTitle.textContent = 'New expense';
    expenseDrawerIdTag.textContent = 'NEW';
    expenseDeleteBtn.hidden = true;
    expenseForm.elements.expense_date.value = dateStr(new Date());
  }

  expenseOverlay.hidden = false;
  expenseDrawer.hidden = false;
}

function closeExpenseDrawer() {
  expenseOverlay.hidden = true;
  expenseDrawer.hidden = true;
  editingExpenseId = null;
}

expenseReceiptInput.addEventListener('change', () => {
  const file = expenseReceiptInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    pendingReceiptData = reader.result;
    removeReceiptFlag = false;
    expenseReceiptPreview.src = pendingReceiptData;
    expenseReceiptPreviewWrap.hidden = false;
  };
  reader.readAsDataURL(file);
});

document.getElementById('btn-remove-receipt').addEventListener('click', () => {
  pendingReceiptData = null;
  removeReceiptFlag = true;
  expenseReceiptInput.value = '';
  expenseReceiptPreviewWrap.hidden = true;
  expenseReceiptPreview.src = '';
});

expenseForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(expenseForm).entries());
  if (!data.vendor.trim() || !data.expense_date) return;

  if (pendingReceiptData) data.receipt_data = pendingReceiptData;
  if (removeReceiptFlag) data.remove_receipt = true;

  if (editingExpenseId) {
    await window.api.expenses.update(editingExpenseId, data);
  } else {
    await window.api.expenses.create(data);
  }

  closeExpenseDrawer();
  await loadExpenses();
});

expenseDeleteBtn.addEventListener('click', async () => {
  if (!editingExpenseId) return;
  const confirmed = confirm('Delete this expense? This also removes its receipt photo and cannot be undone.');
  if (!confirmed) return;

  await window.api.expenses.delete(editingExpenseId);
  closeExpenseDrawer();
  await loadExpenses();
});

document.getElementById('btn-new-expense').addEventListener('click', () => openExpenseDrawer());
document.getElementById('btn-close-expense-drawer').addEventListener('click', closeExpenseDrawer);
document.getElementById('btn-cancel-expense-drawer').addEventListener('click', closeExpenseDrawer);
expenseOverlay.addEventListener('click', closeExpenseDrawer);

// ===================== Mileage =====================

let mileageTrips = [];
let editingMileageId = null;
const selectedMileageIds = new Set();

const mileageRowsEl = document.getElementById('mileage-rows');
const mileageEmptyEl = document.getElementById('mileage-empty-state');
const mileageCountEl = document.getElementById('mileage-count');

const mileageOverlay = document.getElementById('mileage-overlay');
const mileageDrawer = document.getElementById('mileage-drawer');
const mileageForm = document.getElementById('mileage-form');
const mileageDrawerTitle = document.getElementById('mileage-drawer-title');
const mileageDrawerIdTag = document.getElementById('mileage-drawer-id-tag');
const mileageDeleteBtn = document.getElementById('btn-delete-mileage');

async function loadMileage() {
  mileageTrips = await window.api.mileage.list();
  renderMileage();
  populateMileageJobSelect();
}

function populateMileageJobSelect() {
  const select = mileageForm.elements.job_id;
  const current = select.value;
  select.innerHTML = '<option value="">— None —</option>';
  for (const j of jobs) {
    const opt = document.createElement('option');
    opt.value = j.id;
    opt.textContent = `${j.title} — ${j.customer_name}`;
    select.appendChild(opt);
  }
  select.value = current;
}

function populateMileageEmployeeSelect() {
  const select = mileageForm.elements.employee_id;
  const current = select.value;
  select.innerHTML = '<option value="">— Unassigned —</option>';
  for (const e of employees.filter((e) => e.active)) {
    const opt = document.createElement('option');
    opt.value = e.id;
    opt.textContent = e.name;
    select.appendChild(opt);
  }
  select.value = current;
}

function renderMileage() {
  mileageCountEl.textContent = `${mileageTrips.length} trips logged`;
  mileageRowsEl.innerHTML = '';

  if (mileageTrips.length === 0) {
    mileageEmptyEl.hidden = false;
    return;
  }
  mileageEmptyEl.hidden = true;

  for (const trip of mileageTrips) {
    const job = trip.job_id ? jobs.find((j) => j.id === trip.job_id) : null;
    const employee = trip.employee_id ? employees.find((e) => e.id === trip.employee_id) : null;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td onclick="event.stopPropagation()"><input type="checkbox" class="mileage-select-checkbox" value="${trip.id}" style="width:auto;" ${selectedMileageIds.has(trip.id) ? 'checked' : ''} /></td>
      <td>${trip.trip_date}</td>
      <td>${trip.miles}</td>
      <td class="cell-name">${escapeHtml(trip.purpose || '—')}</td>
      <td>${employee ? escapeHtml(employee.name) : '—'}</td>
      <td>${job ? escapeHtml(job.title) : '—'}</td>
      <td class="cell-arrow">›</td>
    `;
    tr.addEventListener('click', () => openMileageDrawer(trip));
    tr.querySelector('.mileage-select-checkbox').addEventListener('change', (e) => {
      if (e.target.checked) selectedMileageIds.add(trip.id);
      else selectedMileageIds.delete(trip.id);
      updateDeleteSelectedButton('mileage', selectedMileageIds);
    });
    mileageRowsEl.appendChild(tr);
  }
}

document.getElementById('mileage-select-all').addEventListener('change', (e) => {
  document.querySelectorAll('.mileage-select-checkbox').forEach((cb) => {
    cb.checked = e.target.checked;
    const id = Number(cb.value);
    if (e.target.checked) selectedMileageIds.add(id);
    else selectedMileageIds.delete(id);
  });
  updateDeleteSelectedButton('mileage', selectedMileageIds);
});

document.getElementById('btn-delete-selected-mileage').addEventListener('click', async () => {
  const count = selectedMileageIds.size;
  if (!confirm(`Delete ${count} trip(s)? This can't be undone.`)) return;

  const btn = document.getElementById('btn-delete-selected-mileage');
  btn.disabled = true;
  btn.textContent = 'Deleting…';

  for (const id of selectedMileageIds) {
    await window.api.mileage.delete(id);
  }
  selectedMileageIds.clear();
  btn.disabled = false;

  await loadMileage();
});

function openMileageDrawer(trip = null) {
  editingMileageId = trip ? trip.id : null;
  mileageForm.reset();
  populateMileageJobSelect();
  populateMileageEmployeeSelect();

  if (trip) {
    mileageDrawerTitle.textContent = 'Edit trip';
    mileageDrawerIdTag.textContent = `M-${String(trip.id).padStart(4, '0')}`;
    mileageDeleteBtn.hidden = false;
    mileageForm.elements.trip_date.value = trip.trip_date || '';
    mileageForm.elements.miles.value = trip.miles || 0;
    mileageForm.elements.purpose.value = trip.purpose || '';
    mileageForm.elements.job_id.value = trip.job_id || '';
    mileageForm.elements.employee_id.value = trip.employee_id || '';
  } else {
    mileageDrawerTitle.textContent = 'Log trip';
    mileageDrawerIdTag.textContent = 'NEW';
    mileageDeleteBtn.hidden = true;
    mileageForm.elements.trip_date.value = dateStr(new Date());
  }

  mileageOverlay.hidden = false;
  mileageDrawer.hidden = false;
}

function closeMileageDrawer() {
  mileageOverlay.hidden = true;
  mileageDrawer.hidden = true;
  editingMileageId = null;
}

mileageForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(mileageForm).entries());
  if (!data.trip_date || !data.miles) return;

  if (editingMileageId) {
    await window.api.mileage.update(editingMileageId, data);
  } else {
    await window.api.mileage.create(data);
  }

  closeMileageDrawer();
  await loadMileage();
});

mileageDeleteBtn.addEventListener('click', async () => {
  if (!editingMileageId) return;
  if (!confirm('Delete this trip? This cannot be undone.')) return;

  await window.api.mileage.delete(editingMileageId);
  closeMileageDrawer();
  await loadMileage();
});

document.getElementById('btn-new-mileage').addEventListener('click', () => openMileageDrawer());
document.getElementById('btn-close-mileage-drawer').addEventListener('click', closeMileageDrawer);
document.getElementById('btn-cancel-mileage-drawer').addEventListener('click', closeMileageDrawer);
mileageOverlay.addEventListener('click', closeMileageDrawer);

// ===================== Send Announcement =====================

const selectedAnnouncementCustomerIds = new Set();

function openAnnouncementDrawer() {
  document.getElementById('announcement-form').reset();
  selectedAnnouncementCustomerIds.clear();
  document.getElementById('announcement-search').value = '';
  renderAnnouncementCustomerList();
  document.getElementById('announcement-overlay').hidden = false;
  document.getElementById('announcement-drawer').hidden = false;
}

function closeAnnouncementDrawer() {
  document.getElementById('announcement-overlay').hidden = true;
  document.getElementById('announcement-drawer').hidden = true;
}

function renderAnnouncementCustomerList() {
  const wrap = document.getElementById('announcement-customer-list');
  const query = document.getElementById('announcement-search').value.trim().toLowerCase();

  // Only customers with an email who haven't opted out are even eligible.
  const eligible = customers.filter((c) => c.email && !c.exclude_from_mass_comms);
  const filtered = query ? eligible.filter((c) => c.name.toLowerCase().includes(query)) : eligible;

  if (filtered.length === 0) {
    wrap.innerHTML = '<p class="empty-sub" style="margin:0;">No eligible customers found (need an email on file, and not opted out of mass communications).</p>';
    updateAnnouncementRecipientCount();
    return;
  }

  wrap.innerHTML = filtered
    .map(
      (c) => `
      <label class="batch-customer-row">
        <input type="checkbox" class="announcement-customer-checkbox" value="${c.id}" ${selectedAnnouncementCustomerIds.has(c.id) ? 'checked' : ''} />
        ${escapeHtml(c.name)}
      </label>`
    )
    .join('');

  wrap.querySelectorAll('.announcement-customer-checkbox').forEach((cb) => {
    cb.addEventListener('change', (e) => {
      const id = Number(e.target.value);
      if (e.target.checked) selectedAnnouncementCustomerIds.add(id);
      else selectedAnnouncementCustomerIds.delete(id);
      updateAnnouncementRecipientCount();
    });
  });

  updateAnnouncementRecipientCount();
}

function updateAnnouncementRecipientCount() {
  document.getElementById('announcement-recipient-count').textContent = `${selectedAnnouncementCustomerIds.size} recipient(s) selected`;
}

document.getElementById('announcement-search').addEventListener('input', renderAnnouncementCustomerList);

document.getElementById('btn-announcement-select-all').addEventListener('click', () => {
  document.querySelectorAll('.announcement-customer-checkbox').forEach((cb) => {
    cb.checked = true;
    selectedAnnouncementCustomerIds.add(Number(cb.value));
  });
  updateAnnouncementRecipientCount();
});

document.getElementById('btn-announcement-select-none').addEventListener('click', () => {
  document.querySelectorAll('.announcement-customer-checkbox').forEach((cb) => (cb.checked = false));
  selectedAnnouncementCustomerIds.clear();
  updateAnnouncementRecipientCount();
});

document.getElementById('announcement-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());

  if (selectedAnnouncementCustomerIds.size === 0) {
    alert('Select at least one recipient first.');
    return;
  }
  if (!confirm(`Send this to ${selectedAnnouncementCustomerIds.size} customer(s), BCC'd? This can't be undone.`)) return;

  const btn = document.getElementById('btn-send-announcement-submit');
  btn.disabled = true;
  btn.textContent = 'Sending…';

  const result = await window.api.email.sendAnnouncement(data.subject, data.message, Array.from(selectedAnnouncementCustomerIds));

  btn.disabled = false;
  btn.textContent = 'Send announcement';

  if (result.ok) {
    alert(`Sent to ${result.sentCount} recipient(s).`);
    closeAnnouncementDrawer();
  } else {
    alert(`Couldn't send: ${result.error}`);
  }
});

document.getElementById('btn-send-announcement').addEventListener('click', openAnnouncementDrawer);
document.getElementById('btn-close-announcement-drawer').addEventListener('click', closeAnnouncementDrawer);
document.getElementById('btn-cancel-announcement-drawer').addEventListener('click', closeAnnouncementDrawer);
document.getElementById('announcement-overlay').addEventListener('click', closeAnnouncementDrawer);

// ===================== Leads =====================

let leads = [];
let editingLeadId = null;
const selectedLeadIds = new Set();

const leadRowsEl = document.getElementById('lead-rows');
const leadEmptyEl = document.getElementById('lead-empty-state');
const leadCountEl = document.getElementById('lead-count');
const leadStatusFilter = document.getElementById('lead-status-filter');

const leadOverlay = document.getElementById('lead-overlay');
const leadDrawer = document.getElementById('lead-drawer');
const leadForm = document.getElementById('lead-form');
const leadDrawerTitle = document.getElementById('lead-drawer-title');
const leadDrawerIdTag = document.getElementById('lead-drawer-id-tag');
const leadDeleteBtn = document.getElementById('btn-delete-lead');
const leadConvertBtn = document.getElementById('btn-convert-lead');

async function loadLeads() {
  leads = await window.api.leads.list();
  renderLeads();
}

function renderLeads() {
  const statusQuery = leadStatusFilter.value;
  const filtered = statusQuery ? leads.filter((l) => l.status === statusQuery) : leads;

  leadCountEl.textContent = `${leads.length} on file`;
  leadRowsEl.innerHTML = '';

  if (filtered.length === 0) {
    leadEmptyEl.hidden = false;
    return;
  }
  leadEmptyEl.hidden = true;

  const LEAD_STATUS_LABELS = { new: 'New', contacted: 'Contacted', converted: 'Converted', lost: 'Lost' };

  for (const lead of filtered) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td onclick="event.stopPropagation()"><input type="checkbox" class="lead-select-checkbox" value="${lead.id}" style="width:auto;" ${selectedLeadIds.has(lead.id) ? 'checked' : ''} /></td>
      <td class="cell-name">${escapeHtml(lead.name)}</td>
      <td>${escapeHtml(lead.phone || '—')}</td>
      <td>${escapeHtml(lead.source || '—')}</td>
      <td><span class="badge badge-${lead.status === 'converted' ? 'paid' : lead.status === 'lost' ? 'cancelled' : 'unpaid'}">${LEAD_STATUS_LABELS[lead.status] || lead.status}</span></td>
      <td class="cell-arrow">›</td>
    `;
    tr.addEventListener('click', () => openLeadDrawer(lead));
    tr.querySelector('.lead-select-checkbox').addEventListener('change', (e) => {
      if (e.target.checked) selectedLeadIds.add(lead.id);
      else selectedLeadIds.delete(lead.id);
      updateDeleteSelectedButton('lead', selectedLeadIds);
    });
    leadRowsEl.appendChild(tr);
  }
}

leadStatusFilter.addEventListener('change', renderLeads);

document.getElementById('lead-select-all').addEventListener('change', (e) => {
  document.querySelectorAll('.lead-select-checkbox').forEach((cb) => {
    cb.checked = e.target.checked;
    const id = Number(cb.value);
    if (e.target.checked) selectedLeadIds.add(id);
    else selectedLeadIds.delete(id);
  });
  updateDeleteSelectedButton('lead', selectedLeadIds);
});

document.getElementById('btn-delete-selected-leads').addEventListener('click', async () => {
  const count = selectedLeadIds.size;
  if (!confirm(`Delete ${count} lead(s)? This can't be undone.`)) return;

  const btn = document.getElementById('btn-delete-selected-leads');
  btn.disabled = true;
  btn.textContent = 'Deleting…';

  for (const id of selectedLeadIds) {
    await window.api.leads.delete(id);
  }
  selectedLeadIds.clear();
  btn.disabled = false;

  await loadLeads();
});

function openLeadDrawer(lead = null) {
  editingLeadId = lead ? lead.id : null;
  leadForm.reset();

  if (lead) {
    leadDrawerTitle.textContent = 'Edit lead';
    leadDrawerIdTag.textContent = `#${lead.id}`;
    leadDeleteBtn.hidden = false;
    leadConvertBtn.hidden = lead.status === 'converted';
    leadForm.elements.name.value = lead.name || '';
    leadForm.elements.phone.value = lead.phone || '';
    leadForm.elements.email.value = lead.email || '';
    leadForm.elements.source.value = lead.source || '';
    leadForm.elements.status.value = lead.status || 'new';
    leadForm.elements.notes.value = lead.notes || '';
  } else {
    leadDrawerTitle.textContent = 'New lead';
    leadDrawerIdTag.textContent = 'NEW';
    leadDeleteBtn.hidden = true;
    leadConvertBtn.hidden = true;
  }

  leadOverlay.hidden = false;
  leadDrawer.hidden = false;
}

function closeLeadDrawer() {
  leadOverlay.hidden = true;
  leadDrawer.hidden = true;
  editingLeadId = null;
}

leadForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(leadForm).entries());
  if (!data.name.trim()) return;

  if (editingLeadId) {
    await window.api.leads.update(editingLeadId, data);
  } else {
    await window.api.leads.create(data);
  }

  closeLeadDrawer();
  await loadLeads();
});

leadDeleteBtn.addEventListener('click', async () => {
  if (!editingLeadId) return;
  if (!confirm('Delete this lead? This cannot be undone.')) return;

  await window.api.leads.delete(editingLeadId);
  closeLeadDrawer();
  await loadLeads();
});

leadConvertBtn.addEventListener('click', async () => {
  if (!editingLeadId) return;
  if (!confirm('Convert this lead to a full customer record?')) return;

  await window.api.leads.convertToCustomer(editingLeadId);
  closeLeadDrawer();
  await loadLeads();
  await loadCustomers();
  alert('Converted! Find them in Customers now.');
});

document.getElementById('btn-new-lead').addEventListener('click', () => openLeadDrawer());
document.getElementById('btn-close-lead-drawer').addEventListener('click', closeLeadDrawer);
document.getElementById('btn-cancel-lead-drawer').addEventListener('click', closeLeadDrawer);
leadOverlay.addEventListener('click', closeLeadDrawer);

// ===================== Employees =====================

let employees = [];
let editingEmployeeId = null;
const selectedEmployeeIds = new Set();

const employeeRowsEl = document.getElementById('employee-rows');
const employeeEmptyEl = document.getElementById('employee-empty-state');
const employeeCountEl = document.getElementById('employee-count');

const employeeOverlay = document.getElementById('employee-overlay');
const employeeDrawer = document.getElementById('employee-drawer');
const employeeForm = document.getElementById('employee-form');
const employeeDrawerTitle = document.getElementById('employee-drawer-title');
const employeeDrawerIdTag = document.getElementById('employee-drawer-id-tag');
const employeeDeleteBtn = document.getElementById('btn-delete-employee');

async function loadEmployees() {
  employees = await window.api.employees.list();
  renderEmployees();
  populateTimeclockEmployeeSelect();
}

function renderEmployees() {
  employeeCountEl.textContent = `${employees.length} on file`;
  employeeRowsEl.innerHTML = '';

  if (employees.length === 0) {
    employeeEmptyEl.hidden = false;
    return;
  }
  employeeEmptyEl.hidden = true;

  for (const emp of employees) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td onclick="event.stopPropagation()"><input type="checkbox" class="employee-select-checkbox" value="${emp.id}" style="width:auto;" ${selectedEmployeeIds.has(emp.id) ? 'checked' : ''} /></td>
      <td class="cell-name">${escapeHtml(emp.name)}</td>
      <td>${escapeHtml(emp.phone || '—')}</td>
      <td>${escapeHtml(emp.email || '—')}</td>
      <td><span class="badge badge-${emp.active ? 'paid' : 'unpaid'}">${emp.active ? 'Active' : 'Inactive'}</span></td>
      <td class="cell-arrow">›</td>
    `;
    tr.addEventListener('click', () => openEmployeeDrawer(emp));
    tr.querySelector('.employee-select-checkbox').addEventListener('change', (e) => {
      if (e.target.checked) selectedEmployeeIds.add(emp.id);
      else selectedEmployeeIds.delete(emp.id);
      updateDeleteSelectedButton('employee', selectedEmployeeIds);
    });
    employeeRowsEl.appendChild(tr);
  }
}

document.getElementById('employee-select-all').addEventListener('change', (e) => {
  document.querySelectorAll('.employee-select-checkbox').forEach((cb) => {
    cb.checked = e.target.checked;
    const id = Number(cb.value);
    if (e.target.checked) selectedEmployeeIds.add(id);
    else selectedEmployeeIds.delete(id);
  });
  updateDeleteSelectedButton('employee', selectedEmployeeIds);
});

document.getElementById('btn-delete-selected-employees').addEventListener('click', async () => {
  const count = selectedEmployeeIds.size;
  if (!confirm(`Delete ${count} employee(s)? This also deletes their time entries. This can't be undone.`)) return;

  const btn = document.getElementById('btn-delete-selected-employees');
  btn.disabled = true;
  btn.textContent = 'Deleting…';

  for (const id of selectedEmployeeIds) {
    await window.api.employees.delete(id);
  }
  selectedEmployeeIds.clear();
  btn.disabled = false;

  await loadEmployees();
});

function openEmployeeDrawer(emp = null) {
  editingEmployeeId = emp ? emp.id : null;
  employeeForm.reset();

  if (emp) {
    employeeDrawerTitle.textContent = 'Edit employee';
    employeeDrawerIdTag.textContent = `#${emp.id}`;
    employeeDeleteBtn.hidden = false;
    employeeForm.elements.name.value = emp.name || '';
    employeeForm.elements.phone.value = emp.phone || '';
    employeeForm.elements.email.value = emp.email || '';
    employeeForm.elements.active.checked = !!emp.active;
  } else {
    employeeDrawerTitle.textContent = 'New employee';
    employeeDrawerIdTag.textContent = 'NEW';
    employeeDeleteBtn.hidden = true;
  }

  employeeOverlay.hidden = false;
  employeeDrawer.hidden = false;
}

function closeEmployeeDrawer() {
  employeeOverlay.hidden = true;
  employeeDrawer.hidden = true;
  editingEmployeeId = null;
}

employeeForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(employeeForm).entries());
  if (!data.name.trim()) return;

  if (editingEmployeeId) {
    await window.api.employees.update(editingEmployeeId, data);
  } else {
    await window.api.employees.create(data);
  }

  closeEmployeeDrawer();
  await loadEmployees();
});

employeeDeleteBtn.addEventListener('click', async () => {
  if (!editingEmployeeId) return;
  if (!confirm('Delete this employee? This also deletes their time entries and cannot be undone.')) return;

  await window.api.employees.delete(editingEmployeeId);
  closeEmployeeDrawer();
  await loadEmployees();
});

document.getElementById('btn-new-employee').addEventListener('click', () => openEmployeeDrawer());
document.getElementById('btn-close-employee-drawer').addEventListener('click', closeEmployeeDrawer);
document.getElementById('btn-cancel-employee-drawer').addEventListener('click', closeEmployeeDrawer);
employeeOverlay.addEventListener('click', closeEmployeeDrawer);

// ===================== Time Clock =====================

let currentTimeEntry = null; // today's entry for whoever is selected in the picker

function populateTimeclockEmployeeSelect() {
  const select = document.getElementById('timeclock-employee-select');
  const current = select.value || localStorage.getItem('timeclock_employee_id') || '';
  select.innerHTML = employees
    .filter((e) => e.active)
    .map((e) => `<option value="${e.id}">${escapeHtml(e.name)}</option>`)
    .join('');
  if (current) select.value = current;
  refreshTimeclockStatus();
}

document.getElementById('timeclock-employee-select').addEventListener('change', (e) => {
  localStorage.setItem('timeclock_employee_id', e.target.value);
  refreshTimeclockStatus();
});

async function refreshTimeclockStatus() {
  const select = document.getElementById('timeclock-employee-select');
  const employeeId = Number(select.value);
  const statusEl = document.getElementById('timeclock-status');
  const inBtn = document.getElementById('btn-clock-in');
  const startLunchBtn = document.getElementById('btn-start-lunch');
  const endLunchBtn = document.getElementById('btn-end-lunch');
  const outBtn = document.getElementById('btn-clock-out');

  if (!employeeId) {
    statusEl.textContent = 'Add an employee first.';
    [inBtn, startLunchBtn, endLunchBtn, outBtn].forEach((b) => (b.hidden = true));
    return;
  }

  const today = dateStr(new Date());
  currentTimeEntry = await window.api.timeEntries.getToday(employeeId, today);

  const fmt = (iso) => (iso ? new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : null);

  if (!currentTimeEntry) {
    statusEl.textContent = "Not clocked in yet today.";
    inBtn.hidden = false;
    startLunchBtn.hidden = true;
    endLunchBtn.hidden = true;
    outBtn.hidden = true;
  } else if (!currentTimeEntry.clock_out) {
    const parts = [`Clocked in at ${fmt(currentTimeEntry.clock_in)}`];
    if (currentTimeEntry.lunch_start && !currentTimeEntry.lunch_end) parts.push(`on lunch since ${fmt(currentTimeEntry.lunch_start)}`);
    else if (currentTimeEntry.lunch_end) parts.push(`lunch ${fmt(currentTimeEntry.lunch_start)}–${fmt(currentTimeEntry.lunch_end)}`);
    statusEl.textContent = parts.join(', ');

    inBtn.hidden = true;
    const onLunch = currentTimeEntry.lunch_start && !currentTimeEntry.lunch_end;
    startLunchBtn.hidden = !!currentTimeEntry.lunch_start;
    endLunchBtn.hidden = !onLunch;
    outBtn.hidden = false;
  } else {
    statusEl.textContent = `Done for today — clocked out at ${fmt(currentTimeEntry.clock_out)}.`;
    [inBtn, startLunchBtn, endLunchBtn, outBtn].forEach((b) => (b.hidden = true));
  }
}

document.getElementById('btn-clock-in').addEventListener('click', async () => {
  const employeeId = Number(document.getElementById('timeclock-employee-select').value);
  if (!employeeId) return;
  await window.api.timeEntries.clockIn(employeeId, dateStr(new Date()));
  await refreshTimeclockStatus();
  await loadTimesheet();
});

document.getElementById('btn-start-lunch').addEventListener('click', async () => {
  if (!currentTimeEntry) return;
  await window.api.timeEntries.startLunch(currentTimeEntry.id);
  await refreshTimeclockStatus();
  await loadTimesheet();
});

document.getElementById('btn-end-lunch').addEventListener('click', async () => {
  if (!currentTimeEntry) return;
  await window.api.timeEntries.endLunch(currentTimeEntry.id);
  await refreshTimeclockStatus();
  await loadTimesheet();
});

document.getElementById('btn-clock-out').addEventListener('click', async () => {
  if (!currentTimeEntry) return;
  await window.api.timeEntries.clockOut(currentTimeEntry.id);
  await refreshTimeclockStatus();
  await loadTimesheet();
});

async function loadTimesheet() {
  const entries = await window.api.timeEntries.list();
  const rowsEl = document.getElementById('timesheet-rows');
  const emptyEl = document.getElementById('timesheet-empty-state');
  rowsEl.innerHTML = '';

  if (entries.length === 0) {
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;

  const fmt = (iso) => (iso ? new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : '—');

  for (const entry of entries.slice(0, 100)) {
    let hours = '—';
    if (entry.clock_in && entry.clock_out) {
      let ms = new Date(entry.clock_out) - new Date(entry.clock_in);
      if (entry.lunch_start && entry.lunch_end) ms -= new Date(entry.lunch_end) - new Date(entry.lunch_start);
      hours = (ms / 3600000).toFixed(2);
    }
    const lunch = entry.lunch_start ? `${fmt(entry.lunch_start)}–${fmt(entry.lunch_end)}` : '—';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${entry.work_date}</td>
      <td>${escapeHtml(entry.employee_name)}</td>
      <td>${fmt(entry.clock_in)}</td>
      <td>${lunch}</td>
      <td>${fmt(entry.clock_out)}</td>
      <td>${hours}</td>
    `;
    rowsEl.appendChild(tr);
  }
}

// ===================== Settings =====================

const settingsForm = document.getElementById('settings-form');
let defaultTaxRate = 0;
let mileageRate = 0.70;
let twilioEnabled = false;

async function loadSettings() {
  const settings = await window.api.settings.get();
  if (settings.default_tax_rate) {
    settingsForm.elements.default_tax_rate.value = settings.default_tax_rate;
    defaultTaxRate = parseFloat(settings.default_tax_rate) || 0;
  }
  if (settings.mileage_rate) {
    settingsForm.elements.mileage_rate.value = settings.mileage_rate;
    mileageRate = parseFloat(settings.mileage_rate) || 0;
  }
  twilioEnabled = settings.twilio_enabled === '1' || settings.twilio_enabled === 'on';
  settingsForm.elements.twilio_enabled.checked = twilioEnabled;
  if (settings.google_review_url) {
    reviewSettingsForm.elements.google_review_url.value = settings.google_review_url;
  }
  if (settings.mapbox_access_token) {
    mapboxSettingsForm.elements.mapbox_access_token.value = settings.mapbox_access_token;
    mapboxAccessToken = settings.mapbox_access_token;
  }
}

settingsForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(settingsForm).entries());
  await window.api.settings.set('default_tax_rate', data.default_tax_rate || '0');
  await window.api.settings.set('mileage_rate', data.mileage_rate || '0.70');
  await window.api.settings.set('twilio_enabled', data.twilio_enabled ? '1' : '0');
  twilioEnabled = !!data.twilio_enabled;
  defaultTaxRate = parseFloat(data.default_tax_rate) || 0;
  mileageRate = parseFloat(data.mileage_rate) || 0.70;
  alert('Settings saved.');
});

const reviewSettingsForm = document.getElementById('review-settings-form');
reviewSettingsForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(reviewSettingsForm).entries());
  await window.api.settings.set('google_review_url', data.google_review_url || '');
  alert('Review link saved.');
});

const mapboxSettingsForm = document.getElementById('mapbox-settings-form');
mapboxSettingsForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(mapboxSettingsForm).entries());
  await window.api.settings.set('mapbox_access_token', data.mapbox_access_token || '');
  mapboxAccessToken = data.mapbox_access_token || '';
  alert('Mapbox settings saved.');
});

// ===================== Saved Line Items =====================

let lineItemTemplates = [];
let serviceCategories = [];

async function loadTemplates() {
  lineItemTemplates = await window.api.lineItemTemplates.list();
  serviceCategories = await window.api.serviceCategories.list();
  renderLineItemTemplateList();
  renderCategoryList();
  populateCategorySelect();
}

function renderCategoryList() {
  const wrap = document.getElementById('category-list');
  if (serviceCategories.length === 0) {
    wrap.innerHTML = '<p class="empty-sub" style="margin:0;">No categories yet.</p>';
    return;
  }
  wrap.innerHTML = serviceCategories
    .map(
      (c) => `
      <div class="unscheduled-job-row" style="margin-bottom:6px;" data-edit-cat="${c.id}">
        <div style="display:flex; align-items:center; gap:10px;">
          ${c.image_url ? `<img src="${escapeHtml(c.image_url)}" style="width:36px; height:36px; object-fit:cover; border-radius:6px;" />` : ''}
          <div class="ujr-title">${escapeHtml(c.name)}</div>
        </div>
        <button type="button" class="btn btn-ghost btn-small" data-delete-cat="${c.id}" onclick="event.stopPropagation()">Delete</button>
      </div>`
    )
    .join('');
  wrap.querySelectorAll('[data-delete-cat]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this category?')) return;
      await window.api.serviceCategories.delete(Number(btn.dataset.deleteCat));
      if (editingCategoryId === Number(btn.dataset.deleteCat)) cancelCategoryEdit();
      await loadTemplates();
    });
  });
  wrap.querySelectorAll('[data-edit-cat]').forEach((row) => {
    row.style.cursor = 'pointer';
    row.addEventListener('click', () => {
      const cat = serviceCategories.find((c) => c.id === Number(row.dataset.editCat));
      if (cat) startCategoryEdit(cat);
    });
  });
}

function populateCategorySelect() {
  const select = document.getElementById('lit-category');
  const current = select.value;
  select.innerHTML = '<option value="">— None —</option>' + serviceCategories.map((c) => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`).join('');
  select.value = current;
}

let editingCategoryId = null;

function startCategoryEdit(cat) {
  editingCategoryId = cat.id;
  document.getElementById('cat-name').value = cat.name;
  document.getElementById('cat-image-url').value = cat.image_url || '';
  document.getElementById('btn-submit-category').textContent = 'Update category';
  document.getElementById('btn-cancel-category-edit').style.display = 'inline-block';
  document.getElementById('cat-name').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function cancelCategoryEdit() {
  editingCategoryId = null;
  document.getElementById('category-form').reset();
  document.getElementById('btn-submit-category').textContent = '+ Add category';
  document.getElementById('btn-cancel-category-edit').style.display = 'none';
}

document.getElementById('btn-cancel-category-edit').addEventListener('click', cancelCategoryEdit);

document.getElementById('category-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('cat-name').value.trim();
  const image_url = document.getElementById('cat-image-url').value.trim();
  if (!name) return;
  if (editingCategoryId) {
    await window.api.serviceCategories.update(editingCategoryId, { name, image_url });
  } else {
    await window.api.serviceCategories.create({ name, image_url });
  }
  cancelCategoryEdit();
  await loadTemplates();
});

function formatPriceOrRange(t) {
  if (t.unit_price_max && t.unit_price_max > t.unit_price) {
    return `${formatCurrency(t.unit_price)}–${formatCurrency(t.unit_price_max)}`;
  }
  return formatCurrency(t.unit_price);
}

function formatPremiumPriceOrRange(t) {
  if (!t.premium_price) return null;
  if (t.premium_price_max && t.premium_price_max > t.premium_price) {
    return `${formatCurrency(t.premium_price)}–${formatCurrency(t.premium_price_max)}`;
  }
  return formatCurrency(t.premium_price);
}

function renderLineItemTemplateList() {
  const wrap = document.getElementById('line-item-template-list');
  if (lineItemTemplates.length === 0) {
    wrap.innerHTML = '<p class="empty-sub" style="margin:0;">No saved items yet.</p>';
    return;
  }
  wrap.innerHTML = lineItemTemplates
    .map(
      (t) => `
      <div class="unscheduled-job-row" style="margin-bottom:6px;" data-edit-lit="${t.id}">
        <div>
          <div class="ujr-title">${escapeHtml(t.description)}${t.allow_quantity ? '' : ' <span style="font-weight:400; opacity:0.7;">(qty locked to 1)</span>'}${t.category ? ` <span style="font-weight:400; opacity:0.7;">[${escapeHtml(t.category)}]</span>` : ''}</div>
          <div class="ujr-customer">Budget: ${formatPriceOrRange(t)}${formatPremiumPriceOrRange(t) ? ' · Premium: ' + formatPremiumPriceOrRange(t) : ''}${t.notes ? ' — ' + escapeHtml(t.notes) : ''}</div>
        </div>
        <button type="button" class="btn btn-ghost btn-small" data-delete-lit="${t.id}" onclick="event.stopPropagation()">Delete</button>
      </div>`
    )
    .join('');
  wrap.querySelectorAll('[data-delete-lit]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this saved item?')) return;
      await window.api.lineItemTemplates.delete(Number(btn.dataset.deleteLit));
      if (editingLineItemTemplateId === Number(btn.dataset.deleteLit)) cancelLineItemTemplateEdit();
      await loadTemplates();
    });
  });
  wrap.querySelectorAll('[data-edit-lit]').forEach((row) => {
    row.style.cursor = 'pointer';
    row.addEventListener('click', () => {
      const t = lineItemTemplates.find((x) => x.id === Number(row.dataset.editLit));
      if (t) startLineItemTemplateEdit(t);
    });
  });
}

let editingLineItemTemplateId = null;

function startLineItemTemplateEdit(t) {
  editingLineItemTemplateId = t.id;
  document.getElementById('lit-description').value = t.description;
  document.getElementById('lit-price').value = t.unit_price;
  document.getElementById('lit-price-max').value = t.unit_price_max || '';
  document.getElementById('lit-premium-price').value = t.premium_price || '';
  document.getElementById('lit-premium-price-max').value = t.premium_price_max || '';
  document.getElementById('lit-notes').value = t.notes || '';
  document.getElementById('lit-allow-quantity').checked = !!t.allow_quantity;
  document.getElementById('lit-category').value = t.category || '';
  document.getElementById('btn-submit-lit').textContent = 'Update saved item';
  document.getElementById('btn-cancel-lit-edit').style.display = 'inline-block';
  document.getElementById('lit-description').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function cancelLineItemTemplateEdit() {
  editingLineItemTemplateId = null;
  document.getElementById('line-item-template-form').reset();
  document.getElementById('btn-submit-lit').textContent = '+ Add saved item';
  document.getElementById('btn-cancel-lit-edit').style.display = 'none';
}

document.getElementById('btn-cancel-lit-edit').addEventListener('click', cancelLineItemTemplateEdit);

document.getElementById('line-item-template-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const description = document.getElementById('lit-description').value.trim();
  const unit_price = document.getElementById('lit-price').value;
  const unit_price_max = document.getElementById('lit-price-max').value;
  const premium_price = document.getElementById('lit-premium-price').value;
  const premium_price_max = document.getElementById('lit-premium-price-max').value;
  const notes = document.getElementById('lit-notes').value.trim();
  const allow_quantity = document.getElementById('lit-allow-quantity').checked;
  const category = document.getElementById('lit-category').value;
  if (!description) return;
  if (editingLineItemTemplateId) {
    await window.api.lineItemTemplates.update(editingLineItemTemplateId, { description, unit_price, unit_price_max, premium_price, premium_price_max, notes, allow_quantity, category });
  } else {
    await window.api.lineItemTemplates.create({ description, unit_price, unit_price_max, premium_price, premium_price_max, notes, allow_quantity, category });
  }
  cancelLineItemTemplateEdit();
  await loadTemplates();
});

// ---- Quick Add picker (shared by Estimates and Invoices) ----
let quickAddTarget = null; // 'quote' or 'invoice'

function openQuickAddPicker(target) {
  quickAddTarget = target;
  const listEl = document.getElementById('quick-add-list');
  const emptyEl = document.getElementById('quick-add-empty');

  if (lineItemTemplates.length === 0) {
    listEl.innerHTML = '';
    emptyEl.hidden = false;
  } else {
    emptyEl.hidden = true;
    listEl.innerHTML = lineItemTemplates
      .map(
        (t, i) => `
        <div class="unscheduled-job-row" data-index="${i}">
          <div>
            <div class="ujr-title">${escapeHtml(t.description)}</div>
            <div class="ujr-customer">${formatPriceOrRange(t)}</div>
          </div>
          <span>›</span>
        </div>`
      )
      .join('');
    listEl.querySelectorAll('[data-index]').forEach((row) => {
      row.addEventListener('click', () => {
        const t = lineItemTemplates[Number(row.dataset.index)];
        const item = { description: t.description, quantity: 1, unit_price: t.unit_price, notes: t.notes || '' };
        if (quickAddTarget === 'quote') {
          addLineItemRow(item);
          updateQuoteTotal();
        } else if (quickAddTarget === 'job') {
          addJobLineItemRow(item);
          updateJobTotal();
        } else {
          addInvoiceLineItemRow(item);
          updateInvoiceTotal();
        }
        closeQuickAddPicker();
      });
    });
  }

  document.getElementById('quick-add-overlay').hidden = false;
  document.getElementById('quick-add-drawer').hidden = false;
}

function closeQuickAddPicker() {
  document.getElementById('quick-add-overlay').hidden = true;
  document.getElementById('quick-add-drawer').hidden = true;
}

document.getElementById('btn-quick-add-quote-item').addEventListener('click', () => openQuickAddPicker('quote'));
document.getElementById('btn-quick-add-invoice-item').addEventListener('click', () => openQuickAddPicker('invoice'));
document.getElementById('btn-quick-add-job-item').addEventListener('click', () => openQuickAddPicker('job'));
document.getElementById('btn-close-quick-add').addEventListener('click', closeQuickAddPicker);
document.getElementById('quick-add-overlay').addEventListener('click', closeQuickAddPicker);

document.getElementById('btn-download-backup').addEventListener('click', async () => {
  const btn = document.getElementById('btn-download-backup');
  btn.disabled = true;
  btn.textContent = 'Preparing backup…';

  try {
    const backup = {
      exported_at: new Date().toISOString(),
      customers: await window.api.customers.list(),
      jobs: await window.api.jobs.list(),
      quotes: await Promise.all((await window.api.quotes.list()).map((q) => window.api.quotes.get(q.id))),
      invoices: await Promise.all((await window.api.invoices.list()).map((i) => window.api.invoices.get(i.id))),
      expenses: await window.api.expenses.list(),
      settings: await window.api.settings.get(),
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateTag = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `ecohaven-backup-${dateTag}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    alert(`Backup failed: ${err.message}`);
  }

  btn.disabled = false;
  btn.textContent = 'Download full backup';
});

// ===================== Reports =====================

const reportYearSelect = document.getElementById('report-year-select');
const reportRowsEl = document.getElementById('report-rows');
const reportEmptyEl = document.getElementById('report-empty-state');
const reportExpenseRowsEl = document.getElementById('report-expense-rows');
const reportExpenseEmptyEl = document.getElementById('report-expense-empty-state');
let currentReportRows = [];
let currentReportExpenses = [];
let currentReportMileage = [];

async function loadReportYears() {
  const years = await window.api.reports.getAvailableYears();
  reportYearSelect.innerHTML = years.map((y) => `<option value="${y}">${y}</option>`).join('');
  if (years.length) await loadReportForYear(years[0]);
}

async function loadReportForYear(year) {
  currentReportRows = await window.api.reports.getYearlyInvoiceReport(year);
  currentReportExpenses = await window.api.expenses.listByYear(year);
  currentReportMileage = await window.api.mileage.listByYear(year);
  renderReport();
}

function renderReport() {
  const rows = currentReportRows;
  let invoiced = 0;
  let collected = 0;
  let outstanding = 0;
  let taxCollected = 0;

  // Quarter buckets, keyed by which quarter the invoice's date falls in.
  const quarters = [
    { label: 'Q1 (Jan–Mar)', invoiced: 0, collected: 0, expenses: 0 },
    { label: 'Q2 (Apr–Jun)', invoiced: 0, collected: 0, expenses: 0 },
    { label: 'Q3 (Jul–Sep)', invoiced: 0, collected: 0, expenses: 0 },
    { label: 'Q4 (Oct–Dec)', invoiced: 0, collected: 0, expenses: 0 },
  ];
  function quarterOf(dateStr) {
    const month = parseInt((dateStr || '').slice(5, 7), 10);
    return Math.min(3, Math.floor((month - 1) / 3));
  }

  reportRowsEl.innerHTML = '';

  if (rows.length === 0) {
    reportEmptyEl.hidden = false;
  } else {
    reportEmptyEl.hidden = true;
    for (const inv of rows) {
      const tax = inv.total - inv.subtotal;
      const dateForQuarter = inv.due_date || inv.created_at.slice(0, 10);
      const q = quarters[quarterOf(dateForQuarter)];

      invoiced += inv.total;
      q.invoiced += inv.total;
      if (inv.status === 'paid') {
        collected += inv.total;
        taxCollected += tax;
        q.collected += inv.total;
      } else {
        outstanding += inv.total;
      }

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="cell-id">I-${inv.number}</td>
        <td>${dateForQuarter}</td>
        <td>${escapeHtml(inv.customer_name)}</td>
        <td>${formatCurrency(inv.subtotal)}</td>
        <td>${formatCurrency(tax)}</td>
        <td>${formatCurrency(inv.total)}</td>
        <td><span class="badge badge-${inv.status}">${INVOICE_STATUS_LABELS[inv.status] || inv.status}</span></td>
      `;
      reportRowsEl.appendChild(tr);
    }
  }

  document.getElementById('report-total-invoiced').textContent = formatCurrency(invoiced);
  document.getElementById('report-total-collected').textContent = formatCurrency(collected);
  document.getElementById('report-total-outstanding').textContent = formatCurrency(outstanding);
  document.getElementById('report-total-tax').textContent = formatCurrency(taxCollected);

  // ---- Expenses: total, category breakdown, and 1099 tracking ----
  let totalExpenses = 0;
  const categoryTotals = {};
  const contractorTotals = {};
  reportExpenseRowsEl.innerHTML = '';
  if (currentReportExpenses.length === 0) {
    reportExpenseEmptyEl.hidden = false;
  } else {
    reportExpenseEmptyEl.hidden = true;
    for (const exp of currentReportExpenses) {
      totalExpenses += exp.amount;
      categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
      const q = quarters[quarterOf(exp.expense_date)];
      q.expenses += exp.amount;

      if (exp.category === 'Subcontractors') {
        contractorTotals[exp.vendor] = (contractorTotals[exp.vendor] || 0) + exp.amount;
      }

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${exp.expense_date}</td>
        <td>${escapeHtml(exp.vendor)}</td>
        <td>${escapeHtml(exp.category)}</td>
        <td>${formatCurrency(exp.amount)}</td>
      `;
      reportExpenseRowsEl.appendChild(tr);
    }
  }

  document.getElementById('report-total-expenses').textContent = formatCurrency(totalExpenses);

  // ---- Mileage: log + deduction total ----
  const totalMiles = currentReportMileage.reduce((s, t) => s + t.miles, 0);
  const mileageDeduction = totalMiles * mileageRate;
  document.getElementById('report-mileage-deduction').textContent = formatCurrency(mileageDeduction);
  document.getElementById('report-net-income').textContent = formatCurrency(collected - totalExpenses - mileageDeduction);

  const mileageRowsEl = document.getElementById('report-mileage-rows');
  const mileageEmptyEl = document.getElementById('report-mileage-empty-state');
  mileageRowsEl.innerHTML = '';
  if (currentReportMileage.length === 0) {
    mileageEmptyEl.hidden = false;
  } else {
    mileageEmptyEl.hidden = true;
    for (const trip of currentReportMileage) {
      const employee = trip.employee_id ? employees.find((e) => e.id === trip.employee_id) : null;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${trip.trip_date}</td>
        <td>${trip.miles}</td>
        <td>${escapeHtml(trip.purpose || '—')}</td>
        <td>${employee ? escapeHtml(employee.name) : '—'}</td>
        <td>${formatCurrency(trip.miles * mileageRate)}</td>
      `;
      mileageRowsEl.appendChild(tr);
    }
  }

  // ---- Quarterly summary table ----
  const quarterlyRowsEl = document.getElementById('report-quarterly-rows');
  quarterlyRowsEl.innerHTML = quarters
    .map(
      (q) => `<tr>
        <td>${q.label}</td>
        <td>${formatCurrency(q.invoiced)}</td>
        <td>${formatCurrency(q.collected)}</td>
        <td>${formatCurrency(q.expenses)}</td>
      </tr>`
    )
    .join('');

  // ---- Expenses by category table ----
  const categoryRowsEl = document.getElementById('report-category-rows');
  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  categoryRowsEl.innerHTML = sortedCategories
    .map(([category, total]) => `<tr><td>${escapeHtml(category)}</td><td>${formatCurrency(total)}</td></tr>`)
    .join('');

  // ---- 1099 tracking table (subcontractors paid, flagging the $600 threshold) ----
  const table1099RowsEl = document.getElementById('report-1099-rows');
  const empty1099El = document.getElementById('report-1099-empty-state');
  const contractorEntries = Object.entries(contractorTotals).sort((a, b) => b[1] - a[1]);
  if (contractorEntries.length === 0) {
    empty1099El.hidden = false;
    table1099RowsEl.innerHTML = '';
  } else {
    empty1099El.hidden = true;
    table1099RowsEl.innerHTML = contractorEntries
      .map(
        ([vendor, total]) => `<tr>
          <td>${escapeHtml(vendor)}</td>
          <td>${formatCurrency(total)}</td>
          <td>${total >= 600 ? '<span class="badge badge-unpaid">Yes — file 1099</span>' : 'No (under $600)'}</td>
        </tr>`
      )
      .join('');
  }
}

reportYearSelect.addEventListener('change', () => loadReportForYear(reportYearSelect.value));

document.getElementById('btn-export-expenses-csv').addEventListener('click', () => {
  if (currentReportExpenses.length === 0) {
    alert('No expenses to export for this year.');
    return;
  }
  const header = ['Date', 'Vendor', 'Category', 'Amount', 'Notes'];
  const lines = currentReportExpenses.map((exp) => [
    exp.expense_date,
    exp.vendor.replace(/,/g, ' '),
    exp.category.replace(/,/g, ' '),
    exp.amount.toFixed(2),
    (exp.notes || '').replace(/,/g, ' ').replace(/\n/g, ' '),
  ]);
  const csv = [header, ...lines].map((row) => row.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ecohaven-expenses-${reportYearSelect.value}.csv`;
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById('btn-export-report-csv').addEventListener('click', () => {
  const year = reportYearSelect.value;
  const lines = [];

  lines.push(`EcoHaven Solutions LLC — Tax Summary for ${year}`);
  lines.push('');

  lines.push('=== INCOME (Invoices) ===');
  lines.push(['Invoice', 'Date', 'Customer', 'Subtotal', 'Tax', 'Total', 'Status'].join(','));
  for (const inv of currentReportRows) {
    lines.push(
      [
        `I-${inv.number}`,
        inv.due_date || inv.created_at.slice(0, 10),
        inv.customer_name.replace(/,/g, ' '),
        inv.subtotal.toFixed(2),
        (inv.total - inv.subtotal).toFixed(2),
        inv.total.toFixed(2),
        inv.status,
      ].join(',')
    );
  }
  lines.push('');

  lines.push('=== EXPENSES ===');
  lines.push(['Date', 'Vendor', 'Category', 'Amount', 'Notes'].join(','));
  for (const exp of currentReportExpenses) {
    lines.push(
      [
        exp.expense_date,
        exp.vendor.replace(/,/g, ' '),
        exp.category.replace(/,/g, ' '),
        exp.amount.toFixed(2),
        (exp.notes || '').replace(/,/g, ' ').replace(/\n/g, ' '),
      ].join(',')
    );
  }
  lines.push('');

  lines.push('=== MILEAGE LOG ===');
  lines.push(['Date', 'Miles', 'Purpose', 'Employee', `Deduction (@ $${mileageRate}/mi)`].join(','));
  for (const trip of currentReportMileage) {
    const employee = trip.employee_id ? employees.find((e) => e.id === trip.employee_id) : null;
    lines.push([trip.trip_date, trip.miles, (trip.purpose || '').replace(/,/g, ' '), employee ? employee.name.replace(/,/g, ' ') : '', (trip.miles * mileageRate).toFixed(2)].join(','));
  }
  lines.push('');

  const totalExpenses = currentReportExpenses.reduce((s, e) => s + e.amount, 0);
  const totalMiles = currentReportMileage.reduce((s, t) => s + t.miles, 0);
  const mileageDeduction = totalMiles * mileageRate;
  const collected = currentReportRows.filter((i) => i.status === 'paid').reduce((s, i) => s + i.total, 0);

  lines.push('=== SUMMARY ===');
  lines.push(`Total invoiced,${currentReportRows.reduce((s, i) => s + i.total, 0).toFixed(2)}`);
  lines.push(`Total collected,${collected.toFixed(2)}`);
  lines.push(`Total expenses,${totalExpenses.toFixed(2)}`);
  lines.push(`Total mileage deduction,${mileageDeduction.toFixed(2)}`);
  lines.push(`Net income,${(collected - totalExpenses - mileageDeduction).toFixed(2)}`);

  const csv = lines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ecohaven-tax-summary-${year}.csv`;
  a.click();
  URL.revokeObjectURL(url);
});

// ===================== Route map =====================

let routeMap = null;
let routeMarkersLayer = null;
let routeLineLayer = null;
const geocodeCache = {};

window.initRouteMap = function initRouteMap() {
  if (routeMap) {
    setTimeout(() => routeMap.invalidateSize(), 50);
    return;
  }
  routeMap = L.map('route-map').setView([46.6, -119.9], 11); // roughly central WA; recenters once stops load
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(routeMap);
  routeMarkersLayer = L.layerGroup().addTo(routeMap);

  const dateInput = document.getElementById('route-date-input');
  const today = dateStr(new Date());
  const nextDateWithJobs = findNextDateWithJobs(today);
  dateInput.value = nextDateWithJobs || today;
  loadRoute(dateInput.value);
};

// Finds the earliest scheduled date on or after startDate that has at
// least one non-cancelled job -- so the route map opens showing something
// useful instead of an empty day by default.
function findNextDateWithJobs(startDate) {
  const upcoming = jobs
    .filter((j) => j.scheduled_date && j.scheduled_date >= startDate && j.status !== 'cancelled')
    .map((j) => j.scheduled_date)
    .sort();
  return upcoming[0] || null;
}

async function geocodeAddress(query) {
  if (!query) return null;
  if (geocodeCache[query]) return geocodeCache[query];

  try {
    const url = mapboxAccessToken
      ? `https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(query)}&access_token=${mapboxAccessToken}&country=us&limit=1`
      : `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
    const res = await fetch(url);
    const data = await res.json();

    let point = null;
    if (mapboxAccessToken && data.features && data.features[0]) {
      const [lon, lat] = data.features[0].geometry.coordinates;
      point = { lat, lon };
    } else if (!mapboxAccessToken && data && data[0]) {
      point = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
    }

    if (point) {
      geocodeCache[query] = point;
      return point;
    }
  } catch (err) {
    // network hiccup -- treat as un-geocodable, skip this stop
  }
  return null;
}

async function loadRoute(dateForRoute) {
  const statusEl = document.getElementById('route-status-text');
  const listEl = document.getElementById('route-list');
  listEl.innerHTML = '';
  routeMarkersLayer.clearLayers();
  if (routeLineLayer) {
    routeMap.removeLayer(routeLineLayer);
    routeLineLayer = null;
  }

  const dayJobs = jobs
    .filter((j) => j.scheduled_date === dateForRoute && j.status !== 'cancelled')
    .sort((a, b) => (a.scheduled_time || '').localeCompare(b.scheduled_time || ''));

  if (dayJobs.length === 0) {
    statusEl.textContent = 'No jobs scheduled that day.';
    return;
  }

  statusEl.textContent = `Looking up ${dayJobs.length} address(es)...`;

  const stops = [];
  const failedNames = [];
  for (const job of dayJobs) {
    const customer = customers.find((c) => c.id === job.customer_id);
    if (!customer) continue;

    // Try the full address first, then fall back to looser combinations --
    // a typo'd street number shouldn't mean the stop vanishes entirely.
    const attempts = [
      [customer.address, customer.city, customer.state, customer.zip],
      [customer.city, customer.state, customer.zip],
      [customer.city, customer.state],
    ].map((parts) => parts.filter(Boolean).join(', ')).filter(Boolean);

    if (attempts.length === 0) {
      failedNames.push(`${customer.name} (no address on file)`);
      continue;
    }

    let point = null;
    for (const attempt of attempts) {
      point = await geocodeAddress(attempt);
      await new Promise((resolve) => setTimeout(resolve, 350)); // be polite to the free service
      if (point) break;
    }

    if (point) {
      stops.push({ job, customer, point });
    } else {
      failedNames.push(customer.name);
    }
  }

  if (stops.length === 0) {
    statusEl.textContent = `Could not find map locations for: ${failedNames.join(', ')}. Double-check their addresses in Customers.`;
    return;
  }

  const dayNote = dateForRoute !== dateStr(new Date()) ? `No jobs today — showing ${dateForRoute}. ` : '';

  statusEl.textContent =
    dayNote +
    (failedNames.length > 0
      ? `${stops.length} of ${dayJobs.length} stop(s) mapped. Couldn't locate: ${failedNames.join(', ')}.`
      : `${stops.length} of ${dayJobs.length} stop(s) mapped, in visit order.`);

  const latLngs = stops.map((s) => [s.point.lat, s.point.lon]);

  stops.forEach((stop, index) => {
    const marker = L.marker([stop.point.lat, stop.point.lon]).addTo(routeMarkersLayer);
    marker.bindPopup(`<b>${index + 1}. ${escapeHtml(stop.job.title)}</b><br>${escapeHtml(stop.customer.name)}`);

    const row = document.createElement('div');
    row.className = 'route-stop';
    row.innerHTML = `
      <span class="route-stop-number">${index + 1}</span>
      <div class="route-stop-details">
        <div class="route-stop-title">${escapeHtml(stop.job.title)} — ${escapeHtml(stop.customer.name)}</div>
        <div class="route-stop-sub">${formatTimeRange(stop.job.scheduled_time, stop.job.scheduled_time_end) || 'No time set'} · ${escapeHtml(stop.customer.address || '')}</div>
      </div>
    `;
    row.addEventListener('click', () => {
      routeMap.setView([stop.point.lat, stop.point.lon], 15);
      marker.openPopup();
    });
    listEl.appendChild(row);
  });

  routeLineLayer = L.polyline(latLngs, { color: '#6E7A50', weight: 3, dashArray: '6 6' }).addTo(routeMap);
  routeMap.fitBounds(L.latLngBounds(latLngs), { padding: [30, 30] });
}

document.getElementById('btn-load-route').addEventListener('click', () => {
  const dateInput = document.getElementById('route-date-input');
  loadRoute(dateInput.value || dateStr(new Date()));
});

// ===================== Reminders =====================

async function loadReminders() {
  renderBackflowReminders();
  renderDueForServiceReminders();
}

function renderBackflowReminders() {
  const rowsEl = document.getElementById('backflow-rows');
  const emptyEl = document.getElementById('backflow-empty-state');
  const today = dateStr(new Date());
  const cutoff = dateStr(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

  const due = customers
    .filter((c) => c.backflow_due_date && c.backflow_due_date <= cutoff)
    .sort((a, b) => a.backflow_due_date.localeCompare(b.backflow_due_date));

  rowsEl.innerHTML = '';
  if (due.length === 0) {
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;

  for (const c of due) {
    const overdue = c.backflow_due_date < today;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="cell-name">${escapeHtml(c.name)}</td>
      <td>${c.backflow_due_date}</td>
      <td><span class="badge badge-${overdue ? 'unpaid' : 'paid'}">${overdue ? 'Overdue' : 'Due soon'}</span></td>
      <td class="cell-arrow">›</td>
    `;
    tr.addEventListener('click', () => {
      document.querySelector('.nav-item[data-view="customers"]').click();
      setTimeout(() => openCustomerDrawer(c), 50);
    });
    rowsEl.appendChild(tr);
  }
}

function renderDueForServiceReminders() {
  const rowsEl = document.getElementById('due-service-rows');
  const emptyEl = document.getElementById('due-service-empty-state');
  const months = Number(document.getElementById('service-window-select').value);
  document.getElementById('service-window-label').textContent = `${months} months`;

  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  const cutoffStr = dateStr(cutoff);

  // Most recent completed/scheduled job per customer.
  const lastJobByCustomer = {};
  for (const job of jobs) {
    if (!job.scheduled_date) continue;
    const existing = lastJobByCustomer[job.customer_id];
    if (!existing || job.scheduled_date > existing) lastJobByCustomer[job.customer_id] = job.scheduled_date;
  }

  const overdue = customers
    .filter((c) => {
      const last = lastJobByCustomer[c.id];
      return !last || last < cutoffStr;
    })
    .sort((a, b) => (lastJobByCustomer[a.id] || '').localeCompare(lastJobByCustomer[b.id] || ''));

  rowsEl.innerHTML = '';
  if (overdue.length === 0) {
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;

  for (const c of overdue) {
    const last = lastJobByCustomer[c.id];
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="cell-name">${escapeHtml(c.name)}</td>
      <td>${last || 'Never'}</td>
      <td class="cell-arrow">›</td>
    `;
    tr.addEventListener('click', () => {
      document.querySelector('.nav-item[data-view="customers"]').click();
      setTimeout(() => openCustomerDrawer(c), 50);
    });
    rowsEl.appendChild(tr);
  }
}

document.getElementById('service-window-select').addEventListener('change', renderDueForServiceReminders);

// ===================== Signature capture =====================

let signatureJobId = null;
let sigCanvas, sigCtx, sigDrawing = false;

function renderJobSignaturePreview(job) {
  const wrap = document.getElementById('job-signature-preview-wrap');
  if (job.signature_url) {
    document.getElementById('job-signature-preview').src = job.signature_url;
    document.getElementById('job-signature-meta').textContent = job.signed_at
      ? `Signed ${new Date(job.signed_at).toLocaleDateString()}`
      : '';
    wrap.hidden = false;
  } else {
    wrap.hidden = true;
  }
}

function setupSignatureCanvas() {
  sigCanvas = document.getElementById('signature-canvas');
  const rect = sigCanvas.getBoundingClientRect();
  sigCanvas.width = rect.width * 2;
  sigCanvas.height = rect.height * 2;
  sigCtx = sigCanvas.getContext('2d');
  sigCtx.scale(2, 2);
  sigCtx.lineWidth = 2;
  sigCtx.lineCap = 'round';
  sigCtx.strokeStyle = '#23261F';
  sigCtx.fillStyle = '#fff';
  sigCtx.fillRect(0, 0, rect.width, rect.height);

  function pos(e) {
    const r = sigCanvas.getBoundingClientRect();
    const point = e.touches ? e.touches[0] : e;
    return { x: point.clientX - r.left, y: point.clientY - r.top };
  }
  function start(e) {
    e.preventDefault();
    sigDrawing = true;
    const p = pos(e);
    sigCtx.beginPath();
    sigCtx.moveTo(p.x, p.y);
  }
  function move(e) {
    if (!sigDrawing) return;
    e.preventDefault();
    const p = pos(e);
    sigCtx.lineTo(p.x, p.y);
    sigCtx.stroke();
  }
  function end() {
    sigDrawing = false;
  }

  sigCanvas.onmousedown = start;
  sigCanvas.onmousemove = move;
  sigCanvas.onmouseup = end;
  sigCanvas.onmouseleave = end;
  sigCanvas.ontouchstart = start;
  sigCanvas.ontouchmove = move;
  sigCanvas.ontouchend = end;
}

document.getElementById('btn-capture-signature').addEventListener('click', () => {
  if (!editingJobId) {
    alert('Save the job first, then capture a signature.');
    return;
  }
  signatureJobId = editingJobId;
  document.getElementById('signature-overlay').hidden = false;
  document.getElementById('signature-drawer').hidden = false;
  setTimeout(setupSignatureCanvas, 50); // let the drawer finish rendering first
});

function closeSignatureDrawer() {
  document.getElementById('signature-overlay').hidden = true;
  document.getElementById('signature-drawer').hidden = true;
}

document.getElementById('btn-close-signature-drawer').addEventListener('click', closeSignatureDrawer);
document.getElementById('btn-cancel-signature').addEventListener('click', closeSignatureDrawer);
document.getElementById('signature-overlay').addEventListener('click', closeSignatureDrawer);

document.getElementById('btn-clear-signature').addEventListener('click', () => {
  const rect = sigCanvas.getBoundingClientRect();
  sigCtx.fillStyle = '#fff';
  sigCtx.fillRect(0, 0, rect.width, rect.height);
});

document.getElementById('btn-save-signature').addEventListener('click', async () => {
  const btn = document.getElementById('btn-save-signature');
  btn.disabled = true;
  btn.textContent = 'Saving…';

  const dataUrl = sigCanvas.toDataURL('image/png');
  const updatedJob = await window.api.jobs.saveSignature(signatureJobId, dataUrl);

  btn.disabled = false;
  btn.textContent = 'Save signature';
  closeSignatureDrawer();
  renderJobSignaturePreview(updatedJob);
  await loadJobs();
});

// ===================== Init =====================

(async function init() {
  await loadCustomers();
  await loadLeads();
  await loadJobs();
  await loadQuotes();
  await loadInvoices();
  await loadExpenses();
  await loadMileage();
  await loadEmployees();
  await loadTimesheet();
  await loadTemplates();
  await loadSettings();
  await loadReportYears();
  await loadReminders();

  if (window.api.app && window.api.app.getPhoneAccessUrl) {
    const url = await window.api.app.getPhoneAccessUrl();
    if (url) {
      const el = document.getElementById('phone-access-url');
      el.textContent = `Phone: ${url}`;
      el.hidden = false;
    }
  }

  if (window.api.app && window.api.app.getCalendarUrl) {
    const calUrl = await window.api.app.getCalendarUrl();
    if (calUrl) {
      document.getElementById('calendar-url-display').value = calUrl;
    }
  }

  if (!window.api.isElectron && window.api.auth) {
    const signOutWrap = document.getElementById('sign-out-wrap');
    signOutWrap.hidden = false;
    document.getElementById('btn-sign-out').addEventListener('click', (e) => {
      e.preventDefault();
      window.api.auth.logout();
    });
  }

  if (window.initRouteMap) window.initRouteMap();
})();
