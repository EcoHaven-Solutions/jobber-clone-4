#!/usr/bin/env python3
"""Estimate and invoice "Copy for text" now texts a short message with a link, like:

   Hi Bill, thank you for choosing EcoHaven Solutions LLC! Here's your invoice,
   with a link to pay online: <link>

The link opens a page that looks like your emailed invoice/estimate, with a tappable
"Pay now" (invoices) or "Accept This Estimate" (estimates) button.
Messages still opens straight to the customer with the text ready -- you just press Send.

Run from ~/Downloads/jobber-clone :   python3 patch_view_link.py
Edits phone-app/app.js and phone-app/index.html.
Works whether or not you ran the earlier text patches. (Job texts are not changed.)
"""
import sys, os, re

MARK = 'VIEW-LINK-TEXT'
APP = 'phone-app/app.js'
IDX = 'phone-app/index.html'
for p in (APP, IDX):
    if not os.path.exists(p):
        sys.exit(f"Can't find {p} -- run this from your jobber-clone folder.")

HELPERS = r"""// VIEW-LINK-TEXT: estimate/invoice texts are a short message + a link to quote-page/view.html
const VIEW_PAGE_BASE = 'https://ecohaven-solutions.github.io/jobber-clone-4/quote-page/view.html';
function viewLinkFirstName(customer) {
  if (!customer || !customer.name) return 'there';
  const full = String(customer.name).trim();
  return /llc|inc\b|corp|company|\bco\b|&|\band\b/i.test(full) ? full : full.split(/\s+/)[0];
}
// Returns the private link code for a saved estimate/invoice, making one if it has none yet.
async function ensureViewToken(table, id, cached) {
  if (cached) return cached;
  const got = await sb.from(table).select('public_token').eq('id', id).single();
  if (!got.error && got.data && got.data.public_token) return got.data.public_token;
  if (got.error) throw new Error(table === 'invoices'
    ? 'Invoices are missing their link code. Run add_invoice_token.sql in Supabase first.'
    : got.error.message);
  const fresh = crypto.randomUUID();
  const upd = await sb.from(table).update({ public_token: fresh }).eq('id', id);
  if (upd.error) throw new Error(upd.error.message);
  return fresh;
}

"""

QUOTE = r"""async function buildQuoteCopyText() {
  const customer = customers.find((c) => c.id === Number(quoteForm.elements.customer_id.value));
  const saved = await saveCurrentQuote(); // the page shows what's saved, so save first
  if (!saved || !editingQuoteId) throw new Error('Add a title and choose a customer first.');
  const q = quotes.find((x) => String(x.id) === String(editingQuoteId));
  const token = await ensureViewToken('quotes', editingQuoteId, q && q.public_token);
  if (q) q.public_token = token;
  return `Hi ${viewLinkFirstName(customer)}, thank you for the opportunity! Here's your estimate from EcoHaven Solutions LLC, with a button to accept it online:\n${VIEW_PAGE_BASE}?t=${token}`;
}"""

INVOICE = r"""async function buildInvoiceCopyText() {
  const customer = customers.find((c) => c.id === Number(invoiceForm.elements.customer_id.value));
  const hasPayLink = !invoicePaymentLinkWrap.hidden && invoicePaymentLinkDisplay.value;
  if (!hasPayLink && !confirm("This invoice has no payment link yet, so the page won't have a Pay now button.\n\nPress OK to send it anyway, or Cancel and tap \"Create payment link\" first.")) {
    throw new Error('Cancelled');
  }
  const saved = await saveCurrentInvoice(); // the page shows what's saved, so save first
  if (!saved || !editingInvoiceId) throw new Error('Add a title and choose a customer first.');
  const inv = invoices.find((x) => String(x.id) === String(editingInvoiceId));
  const token = await ensureViewToken('invoices', editingInvoiceId, inv && inv.public_token);
  if (inv) inv.public_token = token;
  const lead = hasPayLink ? "Here's your invoice, with a link to pay online:" : "Here's your invoice:";
  return `Hi ${viewLinkFirstName(customer)}, thank you for choosing EcoHaven Solutions LLC! ${lead}\n${VIEW_PAGE_BASE}?t=${token}`;
}"""

app = open(APP, encoding='utf-8').read()
if MARK in app:
    print(f"{APP}: already patched, skipping")
else:
    def swap(src, name, new, prefix=''):
        key = f"function {name}() {{"
        start = src.find(key)
        if start == -1 or src.count(key) != 1:
            sys.exit(f"{APP}: couldn't find {name}. Nothing was changed.")
        end = src.find("\n}\n", start)
        if end == -1:
            sys.exit(f"{APP}: couldn't find the end of {name}. Nothing was changed.")
        return src[:start] + prefix + new + src[end + 2:]
    app = swap(app, 'buildQuoteCopyText', QUOTE, HELPERS)
    app = swap(app, 'buildInvoiceCopyText', INVOICE)

    # The two buttons: wait for the link to be ready, then open Messages as before.
    for fn, btn in (('buildQuoteCopyText', 'btn-copy-quote-text'), ('buildInvoiceCopyText', 'btn-copy-invoice-text')):
        head = f"document.getElementById('{btn}').addEventListener('click', async () => {{\n  const text = {fn}();\n"
        if app.count(head) != 1:
            sys.exit(f"{APP}: couldn't find the {btn} button code. Nothing was changed.")
        new_head = (f"document.getElementById('{btn}').addEventListener('click', async () => {{\n"
                    f"  let text;\n"
                    f"  try {{\n    text = await {fn}();\n  }} catch (err) {{\n"
                    f"    if (err.message !== 'Cancelled') alert(err.message || err);\n    return;\n  }}\n")
        app = app.replace(head, new_head)
    # the button handlers read the customer after this point exactly as before
    open(APP, 'w', encoding='utf-8').write(app)
    print(f"{APP}: patched (3 edits)")

idx = open(IDX, encoding='utf-8').read()
idx, n = re.subn(r'(style\.css|supabase-api\.js|design-data\.js|app\.js|design\.js)\?v=\d{8}[a-z]', r'\1?v=20261112a', idx)
if n != 5:
    sys.exit(f"{IDX}: expected 5 version tags, found {n}. Nothing changed in this file.")
open(IDX, 'w', encoding='utf-8').write(idx)
print(f"{IDX}: patched (refreshes the app's cached files)")
