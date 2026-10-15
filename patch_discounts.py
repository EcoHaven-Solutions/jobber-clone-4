#!/usr/bin/env python3
"""Adds a Discount button to invoices and estimates (dollar or percent).

Run from ~/Downloads/jobber-clone :   python3 patch_discounts.py
Edits phone-app/index.html, phone-app/app.js, phone-app/style.css.
Each edit must match exactly once or the script stops without saving that file.
"""
import sys, os

def patch(path, edits):
    if not os.path.exists(path):
        sys.exit(f"Can't find {path} -- run this from your jobber-clone folder.")
    src = open(path, encoding='utf-8').read()
    if 'DISCOUNT-PATCH' in src:
        print(f"{path}: already patched, skipping")
        return
    for label, old, new in edits:
        n = src.count(old)
        if n != 1:
            sys.exit(f"{path}: '{label}' matched {n} times (expected 1). Nothing saved for this file.")
        src = src.replace(old, new)
    open(path, 'w', encoding='utf-8').write(src)
    print(f"{path}: patched ({len(edits)} edits)")

# ---------------------------------------------------------------- index.html
patch('phone-app/index.html', [
 ('invoice discount button',
  '<button type="button" class="btn btn-ghost btn-small" id="btn-add-invoice-line-item">+ Add item</button>',
  '<!-- DISCOUNT-PATCH -->\n            <button type="button" class="btn btn-ghost btn-small" id="btn-add-invoice-discount">Discount</button>\n            <button type="button" class="btn btn-ghost btn-small" id="btn-add-invoice-line-item">+ Add item</button>'),
 ('quote discount button',
  '<button type="button" class="btn btn-ghost btn-small" id="btn-add-line-item">+ Add item</button>',
  '<button type="button" class="btn btn-ghost btn-small" id="btn-add-quote-discount">Discount</button>\n            <button type="button" class="btn btn-ghost btn-small" id="btn-add-line-item">+ Add item</button>'),
 ('invoice discount totals row',
  '<div class="totals-row"><span>Tax</span><span id="invoice-tax-display">',
  '<div class="totals-row" id="invoice-discount-row" hidden><span>Discount</span><span id="invoice-discount-display">$0.00</span></div>\n          <div class="totals-row"><span>Tax</span><span id="invoice-tax-display">'),
 ('quote discount totals row',
  '<div class="totals-row"><span>Tax</span><span id="quote-tax-display">',
  '<div class="totals-row" id="quote-discount-row" hidden><span>Discount</span><span id="quote-discount-display">$0.00</span></div>\n          <div class="totals-row"><span>Tax</span><span id="quote-tax-display">'),
])

# ----------------------------------------------------------------- style.css
css = open('phone-app/style.css', encoding='utf-8').read() if os.path.exists('phone-app/style.css') else None
if css is None:
    sys.exit("Can't find phone-app/style.css")
if 'DISCOUNT-PATCH' not in css:
    css += '''

/* DISCOUNT-PATCH: discount rows in estimate/invoice line items */
.line-item-row select {
  padding: 7px 4px;
  border: 1px solid var(--line);
  border-radius: 6px;
  font-family: var(--font-body);
  font-size: 13px;
  background: var(--paper);
}
.line-item-row.li-discount {
  border-left: 3px solid #5FBF3E;
  padding-left: 8px;
}
.li-disc-hint {
  font-size: 12px;
  color: var(--ink-soft);
  font-family: var(--font-mono);
  min-height: 0;
}
.li-disc-hint:empty {
  display: none;
}
'''
    open('phone-app/style.css', 'w', encoding='utf-8').write(css)
    print("phone-app/style.css: patched")
else:
    print("phone-app/style.css: already patched, skipping")

# -------------------------------------------------------------------- app.js
OLD_ROW = r'''function createLineItemRow(item, onChange) {
  lineItemCounter += 1;
  const row = document.createElement('div');
  row.className = 'line-item-row';
  row.innerHTML = `'''
NEW_ROW = r'''// DISCOUNT-PATCH: a discount is stored as an ordinary line item with a
// NEGATIVE price (so subtotal/tax/total, reports, Stripe and recurring
// invoices all keep working with no database change). In the editor it is
// shown as a "$ or %" row so you never have to type a minus sign.
function isDiscountRow(row) {
  return row.classList.contains('li-discount');
}

function discountRowAmount(row, grossBase) {
  const value = Math.max(0, parseFloat(row.querySelector('.li-disc-value').value) || 0);
  if (row.querySelector('.li-disc-type').value === 'percent') {
    return Math.round(grossBase * (Math.min(value, 100) / 100) * 100) / 100;
  }
  return value;
}

function lineItemRowsSummary(container) {
  const rows = Array.from(container.querySelectorAll('.line-item-row'));
  const gross = rows.filter((r) => !isDiscountRow(r)).reduce((sum, row) => {
    const qty = parseFloat(row.querySelector('.li-qty').value) || 0;
    const price = parseFloat(row.querySelector('.li-price').value) || 0;
    return sum + qty * price;
  }, 0);
  let discount = 0;
  rows.filter(isDiscountRow).forEach((row) => {
    const amt = discountRowAmount(row, gross);
    discount += amt;
    const hint = row.querySelector('.li-disc-hint');
    if (hint) hint.textContent = amt ? `Takes off ${formatCurrency(amt)}` : '';
  });
  return { gross, discount, net: gross - discount };
}

function createDiscountRow(item, onChange) {
  const row = document.createElement('div');
  row.className = 'line-item-row li-discount';
  const stored = Math.abs((Number(item.unit_price) || 0) * (Number(item.quantity) || 1));
  const startValue = item.discount_value !== undefined ? item.discount_value : (stored || '');
  row.innerHTML = `
    <div class="li-main-row">
      <input type="text" class="li-desc" placeholder="Discount name" value="${escapeHtml(item.description || 'Discount')}" />
      <select class="li-disc-type" aria-label="Discount type"><option value="amount">$</option><option value="percent">%</option></select>
      <input type="number" class="li-disc-value" min="0" step="0.01" inputmode="decimal" placeholder="0" value="${startValue}" />
      <button type="button" class="line-item-remove" aria-label="Remove discount">&times;</button>
    </div>
    <input type="text" class="li-notes" placeholder="Reason (optional) — e.g. repeat customer, referral" value="${escapeHtml(item.notes || '')}" />
    <div class="li-disc-hint"></div>
  `;
  if (item.discount_type === 'percent') row.querySelector('.li-disc-type').value = 'percent';
  row.querySelector('.li-disc-value').addEventListener('input', onChange);
  row.querySelector('.li-disc-type').addEventListener('change', onChange);
  row.querySelector('.line-item-remove').addEventListener('click', () => {
    row.remove();
    onChange();
  });
  return row;
}

function createLineItemRow(item, onChange) {
  if (item.discount || Number(item.unit_price) < 0) {
    return createDiscountRow(item, onChange);
  }
  lineItemCounter += 1;
  const row = document.createElement('div');
  row.className = 'line-item-row';
  row.innerHTML = `'''

OLD_COLLECT = r'''function collectLineItemsFrom(container) {
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
}'''
NEW_COLLECT = r'''function collectLineItemsFrom(container) {
  const { gross } = lineItemRowsSummary(container);
  return Array.from(container.querySelectorAll('.line-item-row'))
    .map((row) => {
      if (isDiscountRow(row)) {
        const amt = discountRowAmount(row, gross);
        if (!amt) return null; // empty discount row -- skip it
        const isPercent = row.querySelector('.li-disc-type').value === 'percent';
        let desc = row.querySelector('.li-desc').value.trim() || 'Discount';
        if (isPercent && !desc.includes('%')) {
          desc += ` (${parseFloat(row.querySelector('.li-disc-value').value) || 0}%)`;
        }
        return { description: desc, quantity: 1, unit_price: -amt, notes: row.querySelector('.li-notes').value.trim() };
      }
      return {
        description: row.querySelector('.li-desc').value.trim(),
        quantity: parseFloat(row.querySelector('.li-qty').value) || 0,
        unit_price: parseFloat(row.querySelector('.li-price').value) || 0,
        notes: row.querySelector('.li-notes').value.trim(),
      };
    })
    // Only drop rows that are completely untouched (no description AND no
    // price) -- e.g. a spare "+ Add item" row nobody filled in.
    .filter((item) => item && (item.description || item.unit_price));
}'''

OLD_SUM = r'''function sumLineItemsFrom(container) {
  return Array.from(container.querySelectorAll('.line-item-row')).reduce((sum, row) => {
    const qty = parseFloat(row.querySelector('.li-qty').value) || 0;
    const price = parseFloat(row.querySelector('.li-price').value) || 0;
    return sum + qty * price;
  }, 0);
}'''
NEW_SUM = r'''function sumLineItemsFrom(container) {
  // Net amount: item total minus any discount rows.
  return lineItemRowsSummary(container).net;
}'''

OLD_QTOT = r'''  const subtotal = sumLineItemsFrom(lineItemRowsEl);
  const rate = parseFloat(quoteForm.elements.tax_rate.value) || 0;
  const tax = subtotal * (rate / 100);
  document.getElementById('quote-subtotal-display').textContent = formatCurrency(subtotal);
  document.getElementById('quote-tax-display').textContent = formatCurrency(tax);
  quoteTotalDisplay.textContent = formatCurrency(subtotal + tax);'''
NEW_QTOT = r'''  const { gross, discount, net } = lineItemRowsSummary(lineItemRowsEl);
  const rate = parseFloat(quoteForm.elements.tax_rate.value) || 0;
  const tax = net * (rate / 100);
  document.getElementById('quote-subtotal-display').textContent = formatCurrency(gross);
  document.getElementById('quote-discount-row').hidden = !discount;
  document.getElementById('quote-discount-display').textContent = formatCurrency(-discount);
  document.getElementById('quote-tax-display').textContent = formatCurrency(tax);
  quoteTotalDisplay.textContent = formatCurrency(net + tax);'''

OLD_ITOT = r'''  const subtotal = sumLineItemsFrom(invoiceLineItemRowsEl);
  const rate = parseFloat(invoiceForm.elements.tax_rate.value) || 0;
  const tax = subtotal * (rate / 100);
  document.getElementById('invoice-subtotal-display').textContent = formatCurrency(subtotal);
  document.getElementById('invoice-tax-display').textContent = formatCurrency(tax);
  invoiceTotalDisplay.textContent = formatCurrency(subtotal + tax);'''
NEW_ITOT = r'''  const { gross, discount, net } = lineItemRowsSummary(invoiceLineItemRowsEl);
  const rate = parseFloat(invoiceForm.elements.tax_rate.value) || 0;
  const tax = net * (rate / 100);
  document.getElementById('invoice-subtotal-display').textContent = formatCurrency(gross);
  document.getElementById('invoice-discount-row').hidden = !discount;
  document.getElementById('invoice-discount-display').textContent = formatCurrency(-discount);
  document.getElementById('invoice-tax-display').textContent = formatCurrency(tax);
  invoiceTotalDisplay.textContent = formatCurrency(net + tax);'''

OLD_QCOPY_A = r'''  const subtotal = sumLineItemsFrom(lineItemRowsEl);
  const rate = parseFloat(quoteForm.elements.tax_rate.value) || 0;
  const tax = subtotal * (rate / 100);
  const total = subtotal + tax;
  const idTag = editingQuoteId'''
NEW_QCOPY_A = r'''  const { gross: subtotal, discount, net } = lineItemRowsSummary(lineItemRowsEl);
  const rate = parseFloat(quoteForm.elements.tax_rate.value) || 0;
  const tax = net * (rate / 100);
  const total = net + tax;
  const idTag = editingQuoteId'''
OLD_QCOPY_B = r'''  lines.push(`Subtotal: ${formatCurrency(subtotal)}`);
  if (rate) lines.push(`Tax (${rate}%): ${formatCurrency(tax)}`);
  lines.push(`Total: ${formatCurrency(total)}`);
  lines.push('');'''
NEW_QCOPY_B = r'''  lines.push(`Subtotal: ${formatCurrency(subtotal)}`);
  if (discount) lines.push(`Discount: ${formatCurrency(-discount)}`);
  if (rate) lines.push(`Tax (${rate}%): ${formatCurrency(tax)}`);
  lines.push(`Total: ${formatCurrency(total)}`);
  lines.push('');'''

OLD_ICOPY_A = r'''  const subtotal = sumLineItemsFrom(invoiceLineItemRowsEl);
  const rate = parseFloat(invoiceForm.elements.tax_rate.value) || 0;
  const tax = subtotal * (rate / 100);
  const total = subtotal + tax;
  const idTag = currentInvoiceNumber'''
NEW_ICOPY_A = r'''  const { gross: subtotal, discount, net } = lineItemRowsSummary(invoiceLineItemRowsEl);
  const rate = parseFloat(invoiceForm.elements.tax_rate.value) || 0;
  const tax = net * (rate / 100);
  const total = net + tax;
  const idTag = currentInvoiceNumber'''
OLD_ICOPY_B = r'''  lines.push(`Subtotal: ${formatCurrency(subtotal)}`);
  if (rate) lines.push(`Tax (${rate}%): ${formatCurrency(tax)}`);
  lines.push(`Total: ${formatCurrency(total)}`);
  if (dueDate)'''
NEW_ICOPY_B = r'''  lines.push(`Subtotal: ${formatCurrency(subtotal)}`);
  if (discount) lines.push(`Discount: ${formatCurrency(-discount)}`);
  if (rate) lines.push(`Tax (${rate}%): ${formatCurrency(tax)}`);
  lines.push(`Total: ${formatCurrency(total)}`);
  if (dueDate)'''

OLD_FMT = r'''function formatCurrency(amount) {
  return `$${Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}'''
NEW_FMT = r'''function formatCurrency(amount) {
  const n = Number(amount || 0);
  const text = `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return n < 0 ? `-${text}` : text;
}'''

OLD_BTN = r'''document.getElementById('btn-add-invoice-line-item').addEventListener('click', () => addInvoiceLineItemRow());'''
NEW_BTN = r'''document.getElementById('btn-add-invoice-line-item').addEventListener('click', () => addInvoiceLineItemRow());
document.getElementById('btn-add-invoice-discount').addEventListener('click', () => {
  addInvoiceLineItemRow({ discount: true, description: 'Discount' });
  const valueInput = invoiceLineItemRowsEl.lastElementChild.querySelector('.li-disc-value');
  if (valueInput) valueInput.focus();
});'''
OLD_BTN2 = r'''document.getElementById('btn-add-line-item').addEventListener('click', () => addLineItemRow());'''
NEW_BTN2 = r'''document.getElementById('btn-add-line-item').addEventListener('click', () => addLineItemRow());
document.getElementById('btn-add-quote-discount').addEventListener('click', () => {
  addLineItemRow({ discount: true, description: 'Discount' });
  const valueInput = lineItemRowsEl.lastElementChild.querySelector('.li-disc-value');
  if (valueInput) valueInput.focus();
});'''

patch('phone-app/app.js', [
 ('formatCurrency', OLD_FMT, NEW_FMT),
 ('createLineItemRow', OLD_ROW, NEW_ROW),
 ('collect', OLD_COLLECT, NEW_COLLECT),
 ('sum', OLD_SUM, NEW_SUM),
 ('updateQuoteTotal', OLD_QTOT, NEW_QTOT),
 ('updateInvoiceTotal', OLD_ITOT, NEW_ITOT),
 ('quote copy a', OLD_QCOPY_A, NEW_QCOPY_A),
 ('quote copy b', OLD_QCOPY_B, NEW_QCOPY_B),
 ('invoice copy a', OLD_ICOPY_A, NEW_ICOPY_A),
 ('invoice copy b', OLD_ICOPY_B, NEW_ICOPY_B),
 ('invoice button', OLD_BTN, NEW_BTN),
 ('quote button', OLD_BTN2, NEW_BTN2),
])
print("Done. Commit + push with GitHub Desktop.")
