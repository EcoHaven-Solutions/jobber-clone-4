#!/usr/bin/env python3
"""Follow-up to patch_discounts.py. Run from ~/Downloads/jobber-clone:
    python3 patch_discounts_fix.py
1) index.html: adds ?v=... to the script/style links so browsers can't keep serving an OLD app.js
2) style.css: the Discount totals row stays hidden until a discount exists
3) app.js: if the Discount button ever fails, it shows a popup saying why
"""
import sys, os

def patch(path, edits, marker):
    if not os.path.exists(path):
        sys.exit(f"Can't find {path} -- run this from your jobber-clone folder.")
    src = open(path, encoding='utf-8').read()
    if marker in src:
        print(f"{path}: already patched, skipping"); return
    for label, old, new in edits:
        n = src.count(old)
        if n != 1:
            sys.exit(f"{path}: '{label}' matched {n} times (expected 1). Nothing saved for this file.")
        src = src.replace(old, new)
    open(path, 'w', encoding='utf-8').write(src)
    print(f"{path}: patched")

V = '20261015a'
patch('phone-app/index.html', [
 ('css',  '<link rel="stylesheet" href="style.css" />', f'<link rel="stylesheet" href="style.css?v={V}" />'),
 ('api',  '<script src="supabase-api.js"></script>',   f'<script src="supabase-api.js?v={V}"></script>'),
 ('data', '<script src="design-data.js"></script>',    f'<script src="design-data.js?v={V}"></script>'),
 ('app',  '<script src="app.js"></script>',            f'<script src="app.js?v={V}"></script>'),
 ('dsg',  '<script src="design.js"></script>',         f'<script src="design.js?v={V}"></script>'),
], f'?v={V}')

css = open('phone-app/style.css', encoding='utf-8').read()
if 'DISCOUNT-FIX' not in css:
    css += '\n/* DISCOUNT-FIX: .totals-row sets display:flex, which beat the hidden attribute */\n.totals-row[hidden] { display: none; }\n'
    open('phone-app/style.css', 'w', encoding='utf-8').write(css)
    print('phone-app/style.css: patched')
else:
    print('phone-app/style.css: already patched, skipping')

patch('phone-app/app.js', [
 ('invoice btn',
  """document.getElementById('btn-add-invoice-discount').addEventListener('click', () => {
  addInvoiceLineItemRow({ discount: true, description: 'Discount' });
  const valueInput = invoiceLineItemRowsEl.lastElementChild.querySelector('.li-disc-value');
  if (valueInput) valueInput.focus();
});""",
  """document.getElementById('btn-add-invoice-discount').addEventListener('click', () => {
  // DISCOUNT-FIX
  try {
    addInvoiceLineItemRow({ discount: true, description: 'Discount' });
    const valueInput = invoiceLineItemRowsEl.lastElementChild.querySelector('.li-disc-value');
    if (valueInput) { valueInput.focus(); valueInput.scrollIntoView({ block: 'center' }); }
  } catch (err) {
    alert('Discount button error: ' + err.message);
  }
});"""),
 ('quote btn',
  """document.getElementById('btn-add-quote-discount').addEventListener('click', () => {
  addLineItemRow({ discount: true, description: 'Discount' });
  const valueInput = lineItemRowsEl.lastElementChild.querySelector('.li-disc-value');
  if (valueInput) valueInput.focus();
});""",
  """document.getElementById('btn-add-quote-discount').addEventListener('click', () => {
  try {
    addLineItemRow({ discount: true, description: 'Discount' });
    const valueInput = lineItemRowsEl.lastElementChild.querySelector('.li-disc-value');
    if (valueInput) { valueInput.focus(); valueInput.scrollIntoView({ block: 'center' }); }
  } catch (err) {
    alert('Discount button error: ' + err.message);
  }
});"""),
], 'DISCOUNT-FIX')
print('Done. Commit + push with GitHub Desktop, wait ~2 min, then reload.')
