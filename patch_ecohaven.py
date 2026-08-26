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

# ================= quote-page/index.html =================
patch('quote-page/index.html', [
(
'''    /* ---- Budget-Friendly / Premium tier toggle ---- */
    .tier-explainer {
      font-size: 12.5px;
      color: #D6E9F1;
      background: #23261F;
      border: 1px solid #2E6178;
      border-radius: 8px;
      padding: 8px 10px;
      margin: 0 0 10px;
      line-height: 1.4;
    }
    .tier-row {''',
'''    /* ---- Budget-Friendly / Premium tier toggle ---- */
    .tier-row {''',
),
(
'''        <div id="category-selection-title"></div>
        <p class="tier-explainer">For each item you select, choose one: <strong>Budget-Friendly</strong> — final results may take multiple sessions. <strong>Premium</strong> — more expensive, but meant to be a one-and-done job.</p>
        <div id="services-list"></div>''',
'''        <div id="category-selection-title"></div>
        <div id="services-list"></div>''',
),
(
'''          var tierHtml = '<div class="tier-row' + (checked ? ' is-visible' : '') + '" data-tier-row="' + s.id + '">' +
            '<div class="tier-toggle" data-id="' + s.id + '">' +
            '<button type="button" class="tier-btn tier-budget' + (tier === 'budget' ? ' is-selected' : '') + '">Budget-Friendly</button>' +
            '<button type="button" class="tier-btn tier-premium' + (tier === 'premium' ? ' is-selected' : '') + '">Premium</button>' +
            '</div>' +
            '</div>';''',
'''          var tierHtml = s.has_tier_pricing
            ? '<div class="tier-row' + (checked ? ' is-visible' : '') + '" data-tier-row="' + s.id + '">' +
              '<div class="tier-toggle" data-id="' + s.id + '">' +
              '<button type="button" class="tier-btn tier-budget' + (tier === 'budget' ? ' is-selected' : '') + '">Budget-Friendly</button>' +
              '<button type="button" class="tier-btn tier-premium' + (tier === 'premium' ? ' is-selected' : '') + '">Premium</button>' +
              '</div>' +
              '</div>'
            : '';''',
),
])

# ================= phone-app/index.html =================
patch('phone-app/index.html', [
(
'''                <input type="number" id="lit-price" placeholder="Price (or min)" min="0" step="0.01" required />
                <input type="number" id="lit-price-max" placeholder="Max (optional)" min="0" step="0.01" />
              </div>
              <p class="empty-sub" style="margin-top:10px; margin-bottom:2px;"><strong>Premium price</strong> — shown to customers who pick Premium instead. Leave blank to reuse the Budget-Friendly price.</p>
              <div class="field-row">
                <input type="number" id="lit-premium-price" placeholder="Price (or min)" min="0" step="0.01" />
                <input type="number" id="lit-premium-price-max" placeholder="Max (optional)" min="0" step="0.01" />
              </div>
              <p class="empty-sub" style="margin-top:6px;">Leave a "Max" field blank for a flat price, or fill it in for a range (e.g. $50–$150).</p>
              <label>Category (optional)''',
'''                <input type="number" id="lit-price" placeholder="Price (or min)" min="0" step="0.01" required />
                <input type="number" id="lit-price-max" placeholder="Max (optional)" min="0" step="0.01" />
              </div>
              <label style="flex-direction:row; align-items:center; gap:8px; margin-top:10px;">
                <input type="checkbox" id="lit-has-tier-pricing" style="width:auto;" />
                Offer a Budget-Friendly / Premium choice for this item on the public estimate form
              </label>
              <div id="lit-premium-fields" style="display:none;">
                <p class="empty-sub" style="margin-top:10px; margin-bottom:2px;"><strong>Premium price</strong> — shown to customers who pick Premium instead. Leave blank to reuse the Budget-Friendly price.</p>
                <div class="field-row">
                  <input type="number" id="lit-premium-price" placeholder="Price (or min)" min="0" step="0.01" />
                  <input type="number" id="lit-premium-price-max" placeholder="Max (optional)" min="0" step="0.01" />
                </div>
              </div>
              <p class="empty-sub" style="margin-top:6px;">Leave a "Max" field blank for a flat price, or fill it in for a range (e.g. $50–$150).</p>
              <label>Category (optional)''',
),
])

# ================= phone-app/app.js =================
patch('phone-app/app.js', [
(
'''          <div class="ujr-customer">Budget: ${formatPriceOrRange(t)}${formatPremiumPriceOrRange(t) ? ' · Premium: ' + formatPremiumPriceOrRange(t) : ''}${t.notes ? ' — ' + escapeHtml(t.notes) : ''}</div>''',
'''          <div class="ujr-customer">${t.has_tier_pricing ? 'Budget: ' : ''}${formatPriceOrRange(t)}${t.has_tier_pricing && formatPremiumPriceOrRange(t) ? ' · Premium: ' + formatPremiumPriceOrRange(t) : ''}${t.notes ? ' — ' + escapeHtml(t.notes) : ''}</div>''',
),
(
'''  document.getElementById('lit-price-max').value = t.unit_price_max || '';
  document.getElementById('lit-premium-price').value = t.premium_price || '';''',
'''  document.getElementById('lit-price-max').value = t.unit_price_max || '';
  document.getElementById('lit-has-tier-pricing').checked = !!t.has_tier_pricing;
  document.getElementById('lit-premium-fields').style.display = t.has_tier_pricing ? 'block' : 'none';
  document.getElementById('lit-premium-price').value = t.premium_price || '';''',
),
(
'''  editingLineItemTemplateId = null;
  document.getElementById('line-item-template-form').reset();
  document.getElementById('btn-submit-lit').textContent = '+ Add saved item';
  document.getElementById('btn-cancel-lit-edit').style.display = 'none';
}

document.getElementById('btn-cancel-lit-edit').addEventListener('click', cancelLineItemTemplateEdit);

document.getElementById('line-item-template-form').addEventListener('submit', async (e) => {''',
'''  editingLineItemTemplateId = null;
  document.getElementById('line-item-template-form').reset();
  document.getElementById('lit-premium-fields').style.display = 'none';
  document.getElementById('btn-submit-lit').textContent = '+ Add saved item';
  document.getElementById('btn-cancel-lit-edit').style.display = 'none';
}

document.getElementById('btn-cancel-lit-edit').addEventListener('click', cancelLineItemTemplateEdit);

document.getElementById('lit-has-tier-pricing').addEventListener('change', function () {
  document.getElementById('lit-premium-fields').style.display = this.checked ? 'block' : 'none';
});

document.getElementById('line-item-template-form').addEventListener('submit', async (e) => {''',
),
(
'''  const unit_price_max = document.getElementById('lit-price-max').value;
  const premium_price = document.getElementById('lit-premium-price').value;''',
'''  const unit_price_max = document.getElementById('lit-price-max').value;
  const has_tier_pricing = document.getElementById('lit-has-tier-pricing').checked;
  const premium_price = document.getElementById('lit-premium-price').value;''',
),
(
'''  if (editingLineItemTemplateId) {
    await window.api.lineItemTemplates.update(editingLineItemTemplateId, { description, unit_price, unit_price_max, premium_price, premium_price_max, notes, allow_quantity, category });
  } else {
    await window.api.lineItemTemplates.create({ description, unit_price, unit_price_max, premium_price, premium_price_max, notes, allow_quantity, category });
  }''',
'''  if (editingLineItemTemplateId) {
    await window.api.lineItemTemplates.update(editingLineItemTemplateId, { description, unit_price, unit_price_max, has_tier_pricing, premium_price, premium_price_max, notes, allow_quantity, category });
  } else {
    await window.api.lineItemTemplates.create({ description, unit_price, unit_price_max, has_tier_pricing, premium_price, premium_price_max, notes, allow_quantity, category });
  }''',
),
])

# ================= phone-app/supabase-api.js =================
patch('phone-app/supabase-api.js', [
(
"""    create: async (t) => unwrap(await sb.from('line_item_templates').insert({ description: t.description, unit_price: toNumOrDefault(t.unit_price, 0), unit_price_max: t.unit_price_max ? toNumOrDefault(t.unit_price_max, null) : null, premium_price: t.premium_price ? toNumOrDefault(t.premium_price, null) : null, premium_price_max: t.premium_price_max ? toNumOrDefault(t.premium_price_max, null) : null, notes: toNullableText(t.notes), allow_quantity: toBoolInt(t.allow_quantity), category: toNullableText(t.category) }).select().single()),
    update: async (id, t) => unwrap(await sb.from('line_item_templates').update({ description: t.description, unit_price: toNumOrDefault(t.unit_price, 0), unit_price_max: t.unit_price_max ? toNumOrDefault(t.unit_price_max, null) : null, premium_price: t.premium_price ? toNumOrDefault(t.premium_price, null) : null, premium_price_max: t.premium_price_max ? toNumOrDefault(t.premium_price_max, null) : null, notes: toNullableText(t.notes), allow_quantity: toBoolInt(t.allow_quantity), category: toNullableText(t.category) }).eq('id', id).select().single()),""",
"""    create: async (t) => unwrap(await sb.from('line_item_templates').insert({ description: t.description, unit_price: toNumOrDefault(t.unit_price, 0), unit_price_max: t.unit_price_max ? toNumOrDefault(t.unit_price_max, null) : null, has_tier_pricing: toBoolInt(t.has_tier_pricing), premium_price: t.premium_price ? toNumOrDefault(t.premium_price, null) : null, premium_price_max: t.premium_price_max ? toNumOrDefault(t.premium_price_max, null) : null, notes: toNullableText(t.notes), allow_quantity: toBoolInt(t.allow_quantity), category: toNullableText(t.category) }).select().single()),
    update: async (id, t) => unwrap(await sb.from('line_item_templates').update({ description: t.description, unit_price: toNumOrDefault(t.unit_price, 0), unit_price_max: t.unit_price_max ? toNumOrDefault(t.unit_price_max, null) : null, has_tier_pricing: toBoolInt(t.has_tier_pricing), premium_price: t.premium_price ? toNumOrDefault(t.premium_price, null) : null, premium_price_max: t.premium_price_max ? toNumOrDefault(t.premium_price_max, null) : null, notes: toNullableText(t.notes), allow_quantity: toBoolInt(t.allow_quantity), category: toNullableText(t.category) }).eq('id', id).select().single()),""",
),
])

print("")
print("All 4 files patched successfully. Now check git status / git diff to review, then commit and push.")
