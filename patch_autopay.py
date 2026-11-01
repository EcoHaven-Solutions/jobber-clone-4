#!/usr/bin/env python3
"""Adds saved cards + automatic payments to the app.

Run from ~/Downloads/jobber-clone :   python3 patch_autopay.py
Edits phone-app/index.html, app.js, supabase-api.js.
(Run add_autopay.sql in Supabase first. Needs the Outbox patch already applied.)
"""
import sys, os, re

MARK = 'AUTOPAY-PATCH'

def patch(path, edits, regex_edits=()):
    if not os.path.exists(path):
        sys.exit(f"Can't find {path} -- run this from your jobber-clone folder.")
    src = open(path, encoding='utf-8').read()
    if MARK in src:
        print(f"{path}: already patched, skipping"); return
    for label, old, new in edits:
        n = src.count(old)
        if n != 1:
            sys.exit(f"{path}: '{label}' matched {n} times (expected 1). Nothing saved for this file.")
        src = src.replace(old, new)
    for label, pattern, new, expected in regex_edits:
        src, n = re.subn(pattern, new, src)
        if n != expected:
            sys.exit(f"{path}: '{label}' matched {n} times (expected {expected}). Nothing saved for this file.")
    open(path, 'w', encoding='utf-8').write(src)
    print(f"{path}: patched ({len(edits) + len(regex_edits)} edits)")

# ------------------------------------------------------------ supabase-api.js
patch('phone-app/supabase-api.js', [
 ('autopay api',
  "  quotes: {\n    list: async () => withTotals('quotes'",
  """  // AUTOPAY-PATCH: saved cards + automatic card charges (Stripe).
  autopay: {
    cardSetupLink: (customerId, email) => invokeFunction('send-notifications', { type: 'card-setup-link', id: customerId, email: !!email }),
    approveCharge: (outboxId) => invokeFunction('send-notifications', { type: 'autocharge-approve', id: outboxId }),
    removeCard: async (customerId) => {
      const { error } = await sb
        .from('customers')
        .update({ stripe_payment_method_id: null, card_brand: null, card_last4: null, autopay_authorized_at: null })
        .eq('id', customerId);
      if (error) throw new Error(error.message);
    },
  },

  quotes: {
    list: async () => withTotals('quotes'"""),
])

# ------------------------------------------------------------ index.html
patch('phone-app/index.html', [
 ('customer card section',
  """      <label style="flex-direction:row; align-items:center; gap:8px;">
        <input type="checkbox" name="exclude_from_mass_comms" style="width:auto;" />""",
  """      <!-- AUTOPAY-PATCH -->
      <div class="drawer-section-label">Automatic payments (card on file)</div>
      <p class="empty-sub" id="customer-card-status">Save the customer first, then you can send a card setup link.</p>
      <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:12px;">
        <button type="button" class="btn btn-ghost btn-small" id="btn-email-card-link" hidden>Email card setup link</button>
        <button type="button" class="btn btn-ghost btn-small" id="btn-copy-card-link" hidden>Copy link (to text)</button>
        <button type="button" class="btn btn-ghost btn-small" id="btn-remove-card" hidden>Remove saved card</button>
      </div>

      <label style="flex-direction:row; align-items:center; gap:8px;">
        <input type="checkbox" name="exclude_from_mass_comms" style="width:auto;" />"""),
 ('invoice auto-charge checkbox',
  """      <p class="empty-sub" id="invoice-recurring-hint" hidden style="margin-top:-8px;">
        A fresh copy of this invoice (same items) will be created automatically on that date, and going forward on the same schedule.
      </p>
""",
  """      <p class="empty-sub" id="invoice-recurring-hint" hidden style="margin-top:-8px;">
        A fresh copy of this invoice (same items) will be created automatically on that date, and going forward on the same schedule.
      </p>

      <label style="flex-direction:row; align-items:center; gap:8px;">
        <input type="checkbox" name="auto_charge" id="invoice-auto-charge" style="width:auto;" />
        Charge the customer's saved card automatically
      </label>
      <p class="empty-sub" id="invoice-auto-charge-hint" style="margin-top:-8px;">
        You approve each charge first in Reminders. The customer is emailed the invoice and charged a few days later.
      </p>
"""),
], regex_edits=[
 ('cache-bust', r'(style\.css|supabase-api\.js|design-data\.js|app\.js|design\.js)\?v=\d{8}[a-z]', r'\1?v=20261102a', 5),
])

# ------------------------------------------------------------ app.js
patch('phone-app/app.js', [
 # ---- customer drawer
 ('customer drawer shows card status',
  "  overlay.hidden = false;\n  drawer.hidden = false;\n}\n\nfunction closeCustomerDrawer() {",
  "  renderCustomerCardStatus(customer); // AUTOPAY-PATCH\n  overlay.hidden = false;\n  drawer.hidden = false;\n}\n\nfunction closeCustomerDrawer() {"),
 # ---- invoice drawer
 ('invoice drawer loads switch',
  "    invoiceForm.elements.next_invoice_date.value = invoice.next_invoice_date || '';\n    updateRecurringInvoiceFieldsVisibility();",
  "    invoiceForm.elements.next_invoice_date.value = invoice.next_invoice_date || '';\n    invoiceForm.elements.auto_charge.checked = !!invoice.auto_charge;\n    currentInvoiceForAutoCharge = invoice;\n    updateRecurringInvoiceFieldsVisibility();"),
 ('new invoice resets switch',
  "    currentInvoiceNumber = null;\n    invoiceForm.elements.tax_rate.value = defaultTaxRate;",
  "    currentInvoiceNumber = null;\n    currentInvoiceForAutoCharge = null;\n    invoiceForm.elements.auto_charge.checked = false;\n    invoiceForm.elements.tax_rate.value = defaultTaxRate;"),
 ('invoice drawer refreshes hint',
  "  updateInvoiceTotal();\n  invoiceOverlay.hidden = false;\n  invoiceDrawer.hidden = false;\n}",
  "  updateInvoiceTotal();\n  refreshInvoiceAutoChargeHint();\n  invoiceOverlay.hidden = false;\n  invoiceDrawer.hidden = false;\n}"),
 ('save switch with invoice',
  "  data.items = collectLineItemsFrom(invoiceLineItemRowsEl);\n  return data;",
  "  data.items = collectLineItemsFrom(invoiceLineItemRowsEl);\n  data.auto_charge = !!invoiceForm.elements.auto_charge.checked; // AUTOPAY-PATCH\n  return data;"),
 # ---- outbox: automatic-charge items
 ('outbox label',
  "  'web-estimate': 'Website estimate confirmation',\n};",
  "  'web-estimate': 'Website estimate confirmation',\n  autocharge: 'Automatic card charge (needs your OK)',\n};"),
 ('outbox buttons',
  """`<button type="button" class="btn btn-primary" data-act="send">Send</button>` +""",
  """`<button type="button" class="btn btn-primary" data-act="send">${row.kind === 'autocharge' ? 'Approve &amp; notify customer' : 'Send'}</button>` +
      (row.kind === 'autocharge' ? `<button type="button" class="btn btn-ghost" data-act="open-invoice">Open invoice</button>` : '') +"""),
 ('outbox send branch',
  """      if (!confirm('Send this email to ' + (row.to_email || 'the customer') + ' now?')) return;
      btn.disabled = true; btn.textContent = 'Sending...';
      const result = await window.api.outbox.send(row.id);""",
  """      if (row.kind === 'autocharge') {
        if (!confirm('Email ' + (row.to_name || 'the customer') + ' their invoice now, and charge their saved card in a few days?')) return;
        btn.disabled = true; btn.textContent = 'Working...';
        const approved = await window.api.autopay.approveCharge(row.id);
        if (!approved || approved.ok === false) {
          alert('Could not approve: ' + ((approved && approved.error) || 'unknown error'));
        } else {
          alert('Done. The customer was emailed, and the card will be charged on ' + approved.chargeOn + '.');
        }
        await loadOutbox();
        if (typeof loadInvoices === 'function') await loadInvoices();
        return;
      }
      if (!confirm('Send this email to ' + (row.to_email || 'the customer') + ' now?')) return;
      btn.disabled = true; btn.textContent = 'Sending...';
      const result = await window.api.outbox.send(row.id);"""),
 ('outbox open invoice',
  "    } else if (act === 'skip') {\n      await window.api.outbox.discard(row.id);",
  """    } else if (act === 'open-invoice') {
      const inv = invoices.find((i) => String(i.id) === String(row.invoice_id));
      if (inv) openInvoiceDrawer(inv); else alert('Could not find that invoice.');
      return;
    } else if (act === 'skip') {
      await window.api.outbox.discard(row.id);"""),
 # ---- new code
 ('autopay code',
  "// ===================== Email Outbox (approval queue) =====================",
  r"""// ===================== Saved cards / automatic payments =====================
// AUTOPAY-PATCH

let currentInvoiceForAutoCharge = null;

function cardOnFileText(c) {
  if (!c || !c.stripe_payment_method_id) return '';
  const brand = c.card_brand ? c.card_brand.charAt(0).toUpperCase() + c.card_brand.slice(1) : 'Card';
  return brand + ' ending ' + (c.card_last4 || '????');
}

function renderCustomerCardStatus(customer) {
  const statusEl = document.getElementById('customer-card-status');
  const emailBtn = document.getElementById('btn-email-card-link');
  const copyBtn = document.getElementById('btn-copy-card-link');
  const removeBtn = document.getElementById('btn-remove-card');
  if (!statusEl) return;
  if (!customer || !customer.id) {
    statusEl.textContent = 'Save the customer first, then you can send a card setup link.';
    emailBtn.hidden = true; copyBtn.hidden = true; removeBtn.hidden = true;
    return;
  }
  const has = !!customer.stripe_payment_method_id;
  statusEl.textContent = has
    ? 'Card on file: ' + cardOnFileText(customer) + (customer.autopay_authorized_at ? ' (saved ' + new Date(customer.autopay_authorized_at).toLocaleDateString() + ')' : '')
    : 'No card saved. Send the customer a link to save one (the link works for 24 hours).';
  emailBtn.hidden = !customer.email;
  emailBtn.textContent = has ? 'Email link to replace card' : 'Email card setup link';
  copyBtn.hidden = false;
  removeBtn.hidden = !has;
}

function currentCardCustomer() {
  return customers.find((c) => String(c.id) === String(editingCustomerId)) || null;
}

async function refreshCustomersAndCardStatus() {
  await loadCustomers();
  renderCustomerCardStatus(currentCardCustomer());
}

document.getElementById('btn-email-card-link').addEventListener('click', async (e) => {
  const btn = e.currentTarget;
  if (!editingCustomerId) return;
  btn.disabled = true;
  try {
    const result = await window.api.autopay.cardSetupLink(editingCustomerId, true);
    if (!result || result.ok === false) alert('Could not send: ' + ((result && result.error) || 'unknown error'));
    else alert('Card setup link emailed. You will get an email when they save their card.');
  } catch (err) { alert('Something went wrong: ' + (err && err.message ? err.message : err)); }
  btn.disabled = false;
});

document.getElementById('btn-copy-card-link').addEventListener('click', async (e) => {
  const btn = e.currentTarget;
  if (!editingCustomerId) return;
  btn.disabled = true;
  try {
    const result = await window.api.autopay.cardSetupLink(editingCustomerId, false);
    if (!result || result.ok === false || !result.url) {
      alert('Could not create the link: ' + ((result && result.error) || 'unknown error'));
    } else {
      try { await navigator.clipboard.writeText(result.url); alert('Link copied. Paste it into a text message (it works for 24 hours).'); }
      catch (clipErr) { prompt('Copy this link:', result.url); }
    }
  } catch (err) { alert('Something went wrong: ' + (err && err.message ? err.message : err)); }
  btn.disabled = false;
});

document.getElementById('btn-remove-card').addEventListener('click', async () => {
  if (!editingCustomerId) return;
  if (!confirm('Remove the saved card from this customer? Automatic charges will stop for them.')) return;
  try {
    await window.api.autopay.removeCard(editingCustomerId);
    await refreshCustomersAndCardStatus();
  } catch (err) { alert('Something went wrong: ' + (err && err.message ? err.message : err)); }
});

function refreshInvoiceAutoChargeHint() {
  const hint = document.getElementById('invoice-auto-charge-hint');
  if (!hint) return;
  const cust = customers.find((c) => String(c.id) === String(invoiceForm.elements.customer_id.value));
  const parts = [];
  if (cust && cust.stripe_payment_method_id) parts.push('Card on file: ' + cardOnFileText(cust) + '.');
  else if (cust) parts.push('This customer has no saved card yet. Open the customer and send a card setup link.');
  parts.push('You approve each charge first in Reminders; the customer is emailed the invoice and charged a few days later.');
  const inv = currentInvoiceForAutoCharge;
  if (inv && inv.charge_on) parts.push('Charge scheduled for ' + inv.charge_on + '.');
  if (inv && inv.charge_error) parts.push('Note: ' + inv.charge_error);
  if (inv && inv.stripe_note) parts.push('Stripe: ' + inv.stripe_note);
  hint.textContent = parts.join(' ');
}
invoiceForm.elements.customer_id.addEventListener('change', refreshInvoiceAutoChargeHint);

// ===================== Email Outbox (approval queue) ====================="""),
])
