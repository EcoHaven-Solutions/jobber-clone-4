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

# ================= phone-app/index.html =================
patch('phone-app/index.html', [
(
'''              <p class="empty-sub" style="margin-top:10px; margin-bottom:2px;"><strong>Budget-Friendly price</strong> — shown to customers who pick Budget-Friendly on the public estimate page.</p>
              <div class="field-row">
                <input type="number" id="lit-price" placeholder="Price (or min)" min="0" step="0.01" required />
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
              </div>''',
'''              <p class="empty-sub" id="lit-premium-price-label" style="display:none; margin-top:10px; margin-bottom:2px;"><strong>Premium price</strong> — this is the default price shown to customers (or the only price, if you don't offer a Budget-Friendly option below).</p>
              <div class="field-row">
                <input type="number" id="lit-price" placeholder="Price (or min)" min="0" step="0.01" required />
                <input type="number" id="lit-price-max" placeholder="Max (optional)" min="0" step="0.01" />
              </div>
              <label style="flex-direction:row; align-items:center; gap:8px; margin-top:10px;">
                <input type="checkbox" id="lit-has-tier-pricing" style="width:auto;" />
                Also offer a cheaper Budget-Friendly option for this item on the public estimate form
              </label>
              <div id="lit-budget-fields" style="display:none;">
                <p class="empty-sub" style="margin-top:10px; margin-bottom:2px;"><strong>Budget-Friendly price</strong> — shown to customers who pick Budget-Friendly instead. Leave blank to reuse the Premium price.</p>
                <div class="field-row">
                  <input type="number" id="lit-budget-price" placeholder="Price (or min)" min="0" step="0.01" />
                  <input type="number" id="lit-budget-price-max" placeholder="Max (optional)" min="0" step="0.01" />
                </div>
              </div>''',
),
])

# ================= phone-app/app.js =================
patch('phone-app/app.js', [
(
'''function formatPremiumPriceOrRange(t) {
  if (!t.premium_price) return null;
  if (t.premium_price_max && t.premium_price_max > t.premium_price) {
    return `${formatCurrency(t.premium_price)}–${formatCurrency(t.premium_price_max)}`;
  }
  return formatCurrency(t.premium_price);
}''',
'''function formatBudgetPriceOrRange(t) {
  if (!t.budget_price) return null;
  if (t.budget_price_max && t.budget_price_max > t.budget_price) {
    return `${formatCurrency(t.budget_price)}–${formatCurrency(t.budget_price_max)}`;
  }
  return formatCurrency(t.budget_price);
}''',
),
(
'''          <div class="ujr-customer">${t.has_tier_pricing ? 'Budget: ' : ''}${formatPriceOrRange(t)}${t.has_tier_pricing && formatPremiumPriceOrRange(t) ? ' · Premium: ' + formatPremiumPriceOrRange(t) : ''}${t.notes ? ' — ' + escapeHtml(t.notes) : ''}</div>''',
'''          <div class="ujr-customer">${t.has_tier_pricing ? 'Premium: ' : ''}${formatPriceOrRange(t)}${t.has_tier_pricing && formatBudgetPriceOrRange(t) ? ' · Budget: ' + formatBudgetPriceOrRange(t) : ''}${t.notes ? ' — ' + escapeHtml(t.notes) : ''}</div>''',
),
(
'''  document.getElementById('lit-has-tier-pricing').checked = !!t.has_tier_pricing;
  document.getElementById('lit-premium-fields').style.display = t.has_tier_pricing ? 'block' : 'none';
  document.getElementById('lit-premium-price').value = t.premium_price || '';
  document.getElementById('lit-premium-price-max').value = t.premium_price_max || '';''',
'''  document.getElementById('lit-has-tier-pricing').checked = !!t.has_tier_pricing;
  document.getElementById('lit-premium-price-label').style.display = t.has_tier_pricing ? 'block' : 'none';
  document.getElementById('lit-budget-fields').style.display = t.has_tier_pricing ? 'block' : 'none';
  document.getElementById('lit-budget-price').value = t.budget_price || '';
  document.getElementById('lit-budget-price-max').value = t.budget_price_max || '';''',
),
(
'''  document.getElementById('line-item-template-form').reset();
  document.getElementById('lit-premium-fields').style.display = 'none';
  document.getElementById('btn-submit-lit').textContent = '+ Add saved item';''',
'''  document.getElementById('line-item-template-form').reset();
  document.getElementById('lit-premium-price-label').style.display = 'none';
  document.getElementById('lit-budget-fields').style.display = 'none';
  document.getElementById('btn-submit-lit').textContent = '+ Add saved item';''',
),
(
'''document.getElementById('lit-has-tier-pricing').addEventListener('change', function () {
  document.getElementById('lit-premium-fields').style.display = this.checked ? 'block' : 'none';
});''',
'''document.getElementById('lit-has-tier-pricing').addEventListener('change', function () {
  document.getElementById('lit-premium-price-label').style.display = this.checked ? 'block' : 'none';
  document.getElementById('lit-budget-fields').style.display = this.checked ? 'block' : 'none';
});''',
),
(
'''  const has_tier_pricing = document.getElementById('lit-has-tier-pricing').checked;
  const premium_price = document.getElementById('lit-premium-price').value;
  const premium_price_max = document.getElementById('lit-premium-price-max').value;''',
'''  const has_tier_pricing = document.getElementById('lit-has-tier-pricing').checked;
  const budget_price = document.getElementById('lit-budget-price').value;
  const budget_price_max = document.getElementById('lit-budget-price-max').value;''',
),
(
'''  if (editingLineItemTemplateId) {
    await window.api.lineItemTemplates.update(editingLineItemTemplateId, { description, unit_price, unit_price_max, has_tier_pricing, premium_price, premium_price_max, notes, allow_quantity, category });
  } else {
    await window.api.lineItemTemplates.create({ description, unit_price, unit_price_max, has_tier_pricing, premium_price, premium_price_max, notes, allow_quantity, category });
  }''',
'''  if (editingLineItemTemplateId) {
    await window.api.lineItemTemplates.update(editingLineItemTemplateId, { description, unit_price, unit_price_max, has_tier_pricing, budget_price, budget_price_max, notes, allow_quantity, category });
  } else {
    await window.api.lineItemTemplates.create({ description, unit_price, unit_price_max, has_tier_pricing, budget_price, budget_price_max, notes, allow_quantity, category });
  }''',
),
])

# ================= phone-app/supabase-api.js =================
patch('phone-app/supabase-api.js', [
(
"""    create: async (t) => unwrap(await sb.from('line_item_templates').insert({ description: t.description, unit_price: toNumOrDefault(t.unit_price, 0), unit_price_max: t.unit_price_max ? toNumOrDefault(t.unit_price_max, null) : null, has_tier_pricing: toBoolInt(t.has_tier_pricing), premium_price: t.premium_price ? toNumOrDefault(t.premium_price, null) : null, premium_price_max: t.premium_price_max ? toNumOrDefault(t.premium_price_max, null) : null, notes: toNullableText(t.notes), allow_quantity: toBoolInt(t.allow_quantity), category: toNullableText(t.category) }).select().single()),
    update: async (id, t) => unwrap(await sb.from('line_item_templates').update({ description: t.description, unit_price: toNumOrDefault(t.unit_price, 0), unit_price_max: t.unit_price_max ? toNumOrDefault(t.unit_price_max, null) : null, has_tier_pricing: toBoolInt(t.has_tier_pricing), premium_price: t.premium_price ? toNumOrDefault(t.premium_price, null) : null, premium_price_max: t.premium_price_max ? toNumOrDefault(t.premium_price_max, null) : null, notes: toNullableText(t.notes), allow_quantity: toBoolInt(t.allow_quantity), category: toNullableText(t.category) }).eq('id', id).select().single()),""",
"""    create: async (t) => unwrap(await sb.from('line_item_templates').insert({ description: t.description, unit_price: toNumOrDefault(t.unit_price, 0), unit_price_max: t.unit_price_max ? toNumOrDefault(t.unit_price_max, null) : null, has_tier_pricing: toBoolInt(t.has_tier_pricing), budget_price: t.budget_price ? toNumOrDefault(t.budget_price, null) : null, budget_price_max: t.budget_price_max ? toNumOrDefault(t.budget_price_max, null) : null, notes: toNullableText(t.notes), allow_quantity: toBoolInt(t.allow_quantity), category: toNullableText(t.category) }).select().single()),
    update: async (id, t) => unwrap(await sb.from('line_item_templates').update({ description: t.description, unit_price: toNumOrDefault(t.unit_price, 0), unit_price_max: t.unit_price_max ? toNumOrDefault(t.unit_price_max, null) : null, has_tier_pricing: toBoolInt(t.has_tier_pricing), budget_price: t.budget_price ? toNumOrDefault(t.budget_price, null) : null, budget_price_max: t.budget_price_max ? toNumOrDefault(t.budget_price_max, null) : null, notes: toNullableText(t.notes), allow_quantity: toBoolInt(t.allow_quantity), category: toNullableText(t.category) }).eq('id', id).select().single()),""",
),
])

# ================= quote-page/index.html =================
patch('quote-page/index.html', [
(
'''          var tier = checked ? selectedServices[s.id].tier : 'budget';''',
'''          var tier = checked ? selectedServices[s.id].tier : 'premium';''',
),
(
'''            selectedServices[id] = { quantity: 1, tier: 'budget' };''',
'''            selectedServices[id] = { quantity: 1, tier: 'premium' };''',
),
])

print("")
print("All files patched successfully. Now check git status / git diff to review, then commit and push.")
