import io, sys

def patch(path, replacements):
    with io.open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    for old, new in replacements:
        count = content.count(old)
        if count != 1:
            print(f"ABORT: expected exactly 1 match for an anchor in {path}, found {count}. No changes written to this file. Stop and paste this message back to Claude.")
            sys.exit(1)
        content = content.replace(old, new)
    with io.open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Patched {path}")

# ================= quote-page/index.html: remove the under-item description =================
patch('quote-page/index.html', [
(
'''    /* ---- Budget-Friendly / Premium tier toggle ---- */
    .service-desc {
      font-size: 12.5px;
      color: #C4D9E0;
      margin: 4px 0 0;
      padding-left: 27px;
      line-height: 1.35;
    }
    .tier-row {''',
'''    /* ---- Budget-Friendly / Premium tier toggle ---- */
    .tier-row {''',
),
(
'''          var notesHtml = s.notes ? '<div class="service-desc">' + esc(s.notes) + '</div>' : '';
          return '<div class="service-item">' +
            '<div class="service-row">' +
            '<label class="service-row-check"><input type="checkbox" class="service-checkbox" value="' + s.id + '"' + (checked ? ' checked' : '') + ' />' +
            esc(s.description) + '</label>' +
            qtyHtml +
            '</div>' +
            notesHtml +
            tierHtml +
            '</div>';''',
'''          return '<div class="service-item">' +
            '<div class="service-row">' +
            '<label class="service-row-check"><input type="checkbox" class="service-checkbox" value="' + s.id + '"' + (checked ? ' checked' : '') + ' />' +
            esc(s.description) + '</label>' +
            qtyHtml +
            '</div>' +
            tierHtml +
            '</div>';''',
),
])

# ================= phone-app/index.html: add a separate Budget-Friendly description =================
patch('phone-app/index.html', [
(
'''              <textarea id="lit-notes" rows="3" placeholder="Details (optional) — e.g. what's included, warranty, timeline. Shown to customers on the public estimate page and in their confirmation email." style="margin-top:8px;"></textarea>''',
'''              <textarea id="lit-notes" rows="3" placeholder="Details (optional) — the description used for Premium/standard pricing. Shown in the confirmation email." style="margin-top:8px;"></textarea>''',
),
(
'''              <div id="lit-budget-fields" style="display:none;">
                <p class="empty-sub" style="margin-top:10px; margin-bottom:2px;"><strong>Budget-Friendly price</strong> — shown to customers who pick Budget-Friendly instead. Leave blank to reuse the Premium price.</p>
                <div class="field-row">
                  <input type="number" id="lit-budget-price" placeholder="Price (or min)" min="0" step="0.01" />
                  <input type="number" id="lit-budget-price-max" placeholder="Max (optional)" min="0" step="0.01" />
                </div>
              </div>''',
'''              <div id="lit-budget-fields" style="display:none;">
                <p class="empty-sub" style="margin-top:10px; margin-bottom:2px;"><strong>Budget-Friendly price</strong> — shown to customers who pick Budget-Friendly instead. Leave blank to reuse the Premium price.</p>
                <div class="field-row">
                  <input type="number" id="lit-budget-price" placeholder="Price (or min)" min="0" step="0.01" />
                  <input type="number" id="lit-budget-price-max" placeholder="Max (optional)" min="0" step="0.01" />
                </div>
                <textarea id="lit-budget-notes" rows="3" placeholder="Budget-Friendly details (optional) — shown INSTEAD of the description above, only when a customer picks Budget-Friendly." style="margin-top:8px;"></textarea>
              </div>''',
),
])

# ================= phone-app/app.js =================
patch('phone-app/app.js', [
(
'''  document.getElementById('lit-budget-price').value = t.budget_price || '';
  document.getElementById('lit-budget-price-max').value = t.budget_price_max || '';''',
'''  document.getElementById('lit-budget-price').value = t.budget_price || '';
  document.getElementById('lit-budget-price-max').value = t.budget_price_max || '';
  document.getElementById('lit-budget-notes').value = t.budget_notes || '';''',
),
(
'''  const budget_price = document.getElementById('lit-budget-price').value;
  const budget_price_max = document.getElementById('lit-budget-price-max').value;''',
'''  const budget_price = document.getElementById('lit-budget-price').value;
  const budget_price_max = document.getElementById('lit-budget-price-max').value;
  const budget_notes = document.getElementById('lit-budget-notes').value.trim();''',
),
(
'''  if (editingLineItemTemplateId) {
    await window.api.lineItemTemplates.update(editingLineItemTemplateId, { description, unit_price, unit_price_max, has_tier_pricing, budget_price, budget_price_max, notes, allow_quantity, category });
  } else {
    await window.api.lineItemTemplates.create({ description, unit_price, unit_price_max, has_tier_pricing, budget_price, budget_price_max, notes, allow_quantity, category });
  }''',
'''  if (editingLineItemTemplateId) {
    await window.api.lineItemTemplates.update(editingLineItemTemplateId, { description, unit_price, unit_price_max, has_tier_pricing, budget_price, budget_price_max, budget_notes, notes, allow_quantity, category });
  } else {
    await window.api.lineItemTemplates.create({ description, unit_price, unit_price_max, has_tier_pricing, budget_price, budget_price_max, budget_notes, notes, allow_quantity, category });
  }''',
),
])

# ================= phone-app/supabase-api.js =================
patch('phone-app/supabase-api.js', [
(
"""    create: async (t) => unwrap(await sb.from('line_item_templates').insert({ description: t.description, unit_price: toNumOrDefault(t.unit_price, 0), unit_price_max: t.unit_price_max ? toNumOrDefault(t.unit_price_max, null) : null, has_tier_pricing: toBoolInt(t.has_tier_pricing), budget_price: t.budget_price ? toNumOrDefault(t.budget_price, null) : null, budget_price_max: t.budget_price_max ? toNumOrDefault(t.budget_price_max, null) : null, notes: toNullableText(t.notes), allow_quantity: toBoolInt(t.allow_quantity), category: toNullableText(t.category) }).select().single()),
    update: async (id, t) => unwrap(await sb.from('line_item_templates').update({ description: t.description, unit_price: toNumOrDefault(t.unit_price, 0), unit_price_max: t.unit_price_max ? toNumOrDefault(t.unit_price_max, null) : null, has_tier_pricing: toBoolInt(t.has_tier_pricing), budget_price: t.budget_price ? toNumOrDefault(t.budget_price, null) : null, budget_price_max: t.budget_price_max ? toNumOrDefault(t.budget_price_max, null) : null, notes: toNullableText(t.notes), allow_quantity: toBoolInt(t.allow_quantity), category: toNullableText(t.category) }).eq('id', id).select().single()),""",
"""    create: async (t) => unwrap(await sb.from('line_item_templates').insert({ description: t.description, unit_price: toNumOrDefault(t.unit_price, 0), unit_price_max: t.unit_price_max ? toNumOrDefault(t.unit_price_max, null) : null, has_tier_pricing: toBoolInt(t.has_tier_pricing), budget_price: t.budget_price ? toNumOrDefault(t.budget_price, null) : null, budget_price_max: t.budget_price_max ? toNumOrDefault(t.budget_price_max, null) : null, budget_notes: toNullableText(t.budget_notes), notes: toNullableText(t.notes), allow_quantity: toBoolInt(t.allow_quantity), category: toNullableText(t.category) }).select().single()),
    update: async (id, t) => unwrap(await sb.from('line_item_templates').update({ description: t.description, unit_price: toNumOrDefault(t.unit_price, 0), unit_price_max: t.unit_price_max ? toNumOrDefault(t.unit_price_max, null) : null, has_tier_pricing: toBoolInt(t.has_tier_pricing), budget_price: t.budget_price ? toNumOrDefault(t.budget_price, null) : null, budget_price_max: t.budget_price_max ? toNumOrDefault(t.budget_price_max, null) : null, budget_notes: toNullableText(t.budget_notes), notes: toNullableText(t.notes), allow_quantity: toBoolInt(t.allow_quantity), category: toNullableText(t.category) }).eq('id', id).select().single()),""",
),
])

print("")
print("All files patched successfully. Now check git status / git diff to review, then commit and push.")
