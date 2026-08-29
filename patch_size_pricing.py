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

# ================= phone-app/index.html: add the Small/Medium/Large section to the saved-item form =================
patch('phone-app/index.html', [
(
'''                <textarea id="lit-budget-notes" rows="3" placeholder="Budget-Friendly details (optional) — shown INSTEAD of the description above, only when a customer picks Budget-Friendly." style="margin-top:8px;"></textarea>
              </div>
              <p class="empty-sub" style="margin-top:6px;">Leave a "Max" field blank for a flat price, or fill it in for a range (e.g. $50–$150).</p>''',
'''                <textarea id="lit-budget-notes" rows="3" placeholder="Budget-Friendly details (optional) — shown INSTEAD of the description above, only when a customer picks Budget-Friendly." style="margin-top:8px;"></textarea>
              </div>
              <label style="flex-direction:row; align-items:center; gap:8px; margin-top:10px;">
                <input type="checkbox" id="lit-has-size-pricing" style="width:auto;" />
                Also offer different pricing for Small / Medium / Large yards on the public estimate form
              </label>
              <div id="lit-size-fields" style="display:none;">
                <p class="empty-sub" style="margin-top:10px; margin-bottom:2px;">"Medium" always uses the Premium price above (or the Budget-Friendly price, for customers who pick that tier). Set Small and Large below — leave either blank to reuse the Medium price for that same tier.</p>
                <p class="empty-sub" style="margin-top:10px; margin-bottom:2px;"><strong>Small yard</strong> (Premium)</p>
                <div class="field-row">
                  <input type="number" id="lit-small-price" placeholder="Price (or min)" min="0" step="0.01" />
                  <input type="number" id="lit-small-price-max" placeholder="Max (optional)" min="0" step="0.01" />
                </div>
                <p class="empty-sub" style="margin-top:10px; margin-bottom:2px;"><strong>Large yard</strong> (Premium)</p>
                <div class="field-row">
                  <input type="number" id="lit-large-price" placeholder="Price (or min)" min="0" step="0.01" />
                  <input type="number" id="lit-large-price-max" placeholder="Max (optional)" min="0" step="0.01" />
                </div>
                <div id="lit-size-budget-fields" style="display:none;">
                  <p class="empty-sub" style="margin-top:10px; margin-bottom:2px;"><strong>Small yard</strong> (Budget-Friendly)</p>
                  <div class="field-row">
                    <input type="number" id="lit-small-budget-price" placeholder="Price (or min)" min="0" step="0.01" />
                    <input type="number" id="lit-small-budget-price-max" placeholder="Max (optional)" min="0" step="0.01" />
                  </div>
                  <p class="empty-sub" style="margin-top:10px; margin-bottom:2px;"><strong>Large yard</strong> (Budget-Friendly)</p>
                  <div class="field-row">
                    <input type="number" id="lit-large-budget-price" placeholder="Price (or min)" min="0" step="0.01" />
                    <input type="number" id="lit-large-budget-price-max" placeholder="Max (optional)" min="0" step="0.01" />
                  </div>
                </div>
              </div>
              <p class="empty-sub" style="margin-top:6px;">Leave a "Max" field blank for a flat price, or fill it in for a range (e.g. $50–$150).</p>''',
),
])

# ================= phone-app/app.js =================
patch('phone-app/app.js', [
(
'''  document.getElementById('lit-budget-notes').value = t.budget_notes || '';
  document.getElementById('lit-notes').value = t.notes || '';''',
'''  document.getElementById('lit-budget-notes').value = t.budget_notes || '';
  document.getElementById('lit-has-size-pricing').checked = !!t.has_size_pricing;
  document.getElementById('lit-size-fields').style.display = t.has_size_pricing ? 'block' : 'none';
  document.getElementById('lit-size-budget-fields').style.display = (t.has_size_pricing && t.has_tier_pricing) ? 'block' : 'none';
  document.getElementById('lit-small-price').value = t.small_price || '';
  document.getElementById('lit-small-price-max').value = t.small_price_max || '';
  document.getElementById('lit-large-price').value = t.large_price || '';
  document.getElementById('lit-large-price-max').value = t.large_price_max || '';
  document.getElementById('lit-small-budget-price').value = t.small_budget_price || '';
  document.getElementById('lit-small-budget-price-max').value = t.small_budget_price_max || '';
  document.getElementById('lit-large-budget-price').value = t.large_budget_price || '';
  document.getElementById('lit-large-budget-price-max').value = t.large_budget_price_max || '';
  document.getElementById('lit-notes').value = t.notes || '';''',
),
(
'''function cancelLineItemTemplateEdit() {
  editingLineItemTemplateId = null;
  document.getElementById('line-item-template-form').reset();
  document.getElementById('lit-premium-price-label').style.display = 'none';
  document.getElementById('lit-budget-fields').style.display = 'none';
  document.getElementById('btn-submit-lit').textContent = '+ Add saved item';
  document.getElementById('btn-cancel-lit-edit').style.display = 'none';
}''',
'''function cancelLineItemTemplateEdit() {
  editingLineItemTemplateId = null;
  document.getElementById('line-item-template-form').reset();
  document.getElementById('lit-premium-price-label').style.display = 'none';
  document.getElementById('lit-budget-fields').style.display = 'none';
  document.getElementById('lit-size-fields').style.display = 'none';
  document.getElementById('lit-size-budget-fields').style.display = 'none';
  document.getElementById('btn-submit-lit').textContent = '+ Add saved item';
  document.getElementById('btn-cancel-lit-edit').style.display = 'none';
}''',
),
(
'''document.getElementById('lit-has-tier-pricing').addEventListener('change', function () {
  document.getElementById('lit-premium-price-label').style.display = this.checked ? 'block' : 'none';
  document.getElementById('lit-budget-fields').style.display = this.checked ? 'block' : 'none';
});''',
'''document.getElementById('lit-has-tier-pricing').addEventListener('change', function () {
  document.getElementById('lit-premium-price-label').style.display = this.checked ? 'block' : 'none';
  document.getElementById('lit-budget-fields').style.display = this.checked ? 'block' : 'none';
  document.getElementById('lit-size-budget-fields').style.display = (this.checked && document.getElementById('lit-has-size-pricing').checked) ? 'block' : 'none';
});

document.getElementById('lit-has-size-pricing').addEventListener('change', function () {
  document.getElementById('lit-size-fields').style.display = this.checked ? 'block' : 'none';
  document.getElementById('lit-size-budget-fields').style.display = (this.checked && document.getElementById('lit-has-tier-pricing').checked) ? 'block' : 'none';
});''',
),
(
'''  const budget_notes = document.getElementById('lit-budget-notes').value.trim();
  const notes = document.getElementById('lit-notes').value.trim();
  const allow_quantity = document.getElementById('lit-allow-quantity').checked;
  const category = document.getElementById('lit-category').value;
  if (!description) return;
  if (editingLineItemTemplateId) {
    await window.api.lineItemTemplates.update(editingLineItemTemplateId, { description, unit_price, unit_price_max, has_tier_pricing, budget_price, budget_price_max, budget_notes, notes, allow_quantity, category });
  } else {
    await window.api.lineItemTemplates.create({ description, unit_price, unit_price_max, has_tier_pricing, budget_price, budget_price_max, budget_notes, notes, allow_quantity, category });
  }''',
'''  const budget_notes = document.getElementById('lit-budget-notes').value.trim();
  const has_size_pricing = document.getElementById('lit-has-size-pricing').checked;
  const small_price = document.getElementById('lit-small-price').value;
  const small_price_max = document.getElementById('lit-small-price-max').value;
  const large_price = document.getElementById('lit-large-price').value;
  const large_price_max = document.getElementById('lit-large-price-max').value;
  const small_budget_price = document.getElementById('lit-small-budget-price').value;
  const small_budget_price_max = document.getElementById('lit-small-budget-price-max').value;
  const large_budget_price = document.getElementById('lit-large-budget-price').value;
  const large_budget_price_max = document.getElementById('lit-large-budget-price-max').value;
  const notes = document.getElementById('lit-notes').value.trim();
  const allow_quantity = document.getElementById('lit-allow-quantity').checked;
  const category = document.getElementById('lit-category').value;
  if (!description) return;
  const payload = { description, unit_price, unit_price_max, has_tier_pricing, budget_price, budget_price_max, budget_notes, has_size_pricing, small_price, small_price_max, large_price, large_price_max, small_budget_price, small_budget_price_max, large_budget_price, large_budget_price_max, notes, allow_quantity, category };
  if (editingLineItemTemplateId) {
    await window.api.lineItemTemplates.update(editingLineItemTemplateId, payload);
  } else {
    await window.api.lineItemTemplates.create(payload);
  }''',
),
])

# ================= phone-app/supabase-api.js =================
patch('phone-app/supabase-api.js', [
(
"""    create: async (t) => unwrap(await sb.from('line_item_templates').insert({ description: t.description, unit_price: toNumOrDefault(t.unit_price, 0), unit_price_max: t.unit_price_max ? toNumOrDefault(t.unit_price_max, null) : null, has_tier_pricing: toBoolInt(t.has_tier_pricing), budget_price: t.budget_price ? toNumOrDefault(t.budget_price, null) : null, budget_price_max: t.budget_price_max ? toNumOrDefault(t.budget_price_max, null) : null, budget_notes: toNullableText(t.budget_notes), notes: toNullableText(t.notes), allow_quantity: toBoolInt(t.allow_quantity), category: toNullableText(t.category) }).select().single()),
    update: async (id, t) => unwrap(await sb.from('line_item_templates').update({ description: t.description, unit_price: toNumOrDefault(t.unit_price, 0), unit_price_max: t.unit_price_max ? toNumOrDefault(t.unit_price_max, null) : null, has_tier_pricing: toBoolInt(t.has_tier_pricing), budget_price: t.budget_price ? toNumOrDefault(t.budget_price, null) : null, budget_price_max: t.budget_price_max ? toNumOrDefault(t.budget_price_max, null) : null, budget_notes: toNullableText(t.budget_notes), notes: toNullableText(t.notes), allow_quantity: toBoolInt(t.allow_quantity), category: toNullableText(t.category) }).eq('id', id).select().single()),""",
"""    create: async (t) => unwrap(await sb.from('line_item_templates').insert({ description: t.description, unit_price: toNumOrDefault(t.unit_price, 0), unit_price_max: t.unit_price_max ? toNumOrDefault(t.unit_price_max, null) : null, has_tier_pricing: toBoolInt(t.has_tier_pricing), budget_price: t.budget_price ? toNumOrDefault(t.budget_price, null) : null, budget_price_max: t.budget_price_max ? toNumOrDefault(t.budget_price_max, null) : null, budget_notes: toNullableText(t.budget_notes), has_size_pricing: toBoolInt(t.has_size_pricing), small_price: t.small_price ? toNumOrDefault(t.small_price, null) : null, small_price_max: t.small_price_max ? toNumOrDefault(t.small_price_max, null) : null, large_price: t.large_price ? toNumOrDefault(t.large_price, null) : null, large_price_max: t.large_price_max ? toNumOrDefault(t.large_price_max, null) : null, small_budget_price: t.small_budget_price ? toNumOrDefault(t.small_budget_price, null) : null, small_budget_price_max: t.small_budget_price_max ? toNumOrDefault(t.small_budget_price_max, null) : null, large_budget_price: t.large_budget_price ? toNumOrDefault(t.large_budget_price, null) : null, large_budget_price_max: t.large_budget_price_max ? toNumOrDefault(t.large_budget_price_max, null) : null, notes: toNullableText(t.notes), allow_quantity: toBoolInt(t.allow_quantity), category: toNullableText(t.category) }).select().single()),
    update: async (id, t) => unwrap(await sb.from('line_item_templates').update({ description: t.description, unit_price: toNumOrDefault(t.unit_price, 0), unit_price_max: t.unit_price_max ? toNumOrDefault(t.unit_price_max, null) : null, has_tier_pricing: toBoolInt(t.has_tier_pricing), budget_price: t.budget_price ? toNumOrDefault(t.budget_price, null) : null, budget_price_max: t.budget_price_max ? toNumOrDefault(t.budget_price_max, null) : null, budget_notes: toNullableText(t.budget_notes), has_size_pricing: toBoolInt(t.has_size_pricing), small_price: t.small_price ? toNumOrDefault(t.small_price, null) : null, small_price_max: t.small_price_max ? toNumOrDefault(t.small_price_max, null) : null, large_price: t.large_price ? toNumOrDefault(t.large_price, null) : null, large_price_max: t.large_price_max ? toNumOrDefault(t.large_price_max, null) : null, small_budget_price: t.small_budget_price ? toNumOrDefault(t.small_budget_price, null) : null, small_budget_price_max: t.small_budget_price_max ? toNumOrDefault(t.small_budget_price_max, null) : null, large_budget_price: t.large_budget_price ? toNumOrDefault(t.large_budget_price, null) : null, large_budget_price_max: t.large_budget_price_max ? toNumOrDefault(t.large_budget_price_max, null) : null, notes: toNullableText(t.notes), allow_quantity: toBoolInt(t.allow_quantity), category: toNullableText(t.category) }).eq('id', id).select().single()),""",
),
])

# ================= quote-page/index.html =================
patch('quote-page/index.html', [
(
'''    .tier-btn + .tier-btn { border-left: 1px solid #2E6178; }
    .tier-btn.is-selected { background: #5FBF3E; color: #fff; }
  </style>''',
'''    .tier-btn + .tier-btn { border-left: 1px solid #2E6178; }
    .tier-btn.is-selected { background: #5FBF3E; color: #fff; }

    /* ---- Small/Medium/Large yard-size picker ---- */
    .size-row {
      display: none;
      margin-top: 8px;
      padding-left: 27px;
    }
    .size-row.is-visible { display: flex; }
    .size-toggle {
      display: flex;
      border: 1px solid #2E6178;
      border-radius: 8px;
      overflow: hidden;
      flex: none;
    }
    .size-btn {
      border: none;
      background: #23261F;
      color: #D6E9F1;
      font-size: 12px;
      font-weight: 700;
      padding: 7px 12px;
      cursor: pointer;
      touch-action: manipulation;
    }
    .size-btn + .size-btn { border-left: 1px solid #2E6178; }
    .size-btn.is-selected { background: #5FBF3E; color: #fff; }
  </style>''',
),
(
'''    var selectedServices = {}; // { serviceId: { quantity, tier: 'budget'|'premium' } } -- persists across category switches''',
'''    var selectedServices = {}; // { serviceId: { quantity, tier: 'budget'|'premium', size: 'small'|'medium'|'large' } } -- persists across category switches''',
),
(
'''          var checked = selectedServices[s.id] !== undefined;
          var qtyVal = checked ? selectedServices[s.id].quantity : 1;
          var tier = checked ? selectedServices[s.id].tier : 'premium';
          var qtyHtml = s.allow_quantity''',
'''          var checked = selectedServices[s.id] !== undefined;
          var qtyVal = checked ? selectedServices[s.id].quantity : 1;
          var tier = checked ? selectedServices[s.id].tier : 'premium';
          var size = checked ? selectedServices[s.id].size : 'medium';
          var qtyHtml = s.allow_quantity''',
),
(
'''          var tierHtml = s.has_tier_pricing
            ? '<div class="tier-row' + (checked ? ' is-visible' : '') + '" data-tier-row="' + s.id + '">' +
              '<div class="tier-toggle" data-id="' + s.id + '">' +
              '<button type="button" class="tier-btn tier-budget' + (tier === 'budget' ? ' is-selected' : '') + '">Budget-Friendly</button>' +
              '<button type="button" class="tier-btn tier-premium' + (tier === 'premium' ? ' is-selected' : '') + '">Premium</button>' +
              '</div>' +
              '</div>'
            : '';
          return '<div class="service-item">' +
            '<div class="service-row">' +
            '<label class="service-row-check"><input type="checkbox" class="service-checkbox" value="' + s.id + '"' + (checked ? ' checked' : '') + ' />' +
            esc(s.description) + '</label>' +
            qtyHtml +
            '</div>' +
            tierHtml +
            '</div>';''',
'''          var tierHtml = s.has_tier_pricing
            ? '<div class="tier-row' + (checked ? ' is-visible' : '') + '" data-tier-row="' + s.id + '">' +
              '<div class="tier-toggle" data-id="' + s.id + '">' +
              '<button type="button" class="tier-btn tier-budget' + (tier === 'budget' ? ' is-selected' : '') + '">Budget-Friendly</button>' +
              '<button type="button" class="tier-btn tier-premium' + (tier === 'premium' ? ' is-selected' : '') + '">Premium</button>' +
              '</div>' +
              '</div>'
            : '';
          var sizeHtml = s.has_size_pricing
            ? '<div class="size-row' + (checked ? ' is-visible' : '') + '" data-size-row="' + s.id + '">' +
              '<div class="size-toggle" data-id="' + s.id + '">' +
              '<button type="button" class="size-btn size-small' + (size === 'small' ? ' is-selected' : '') + '">Small yard</button>' +
              '<button type="button" class="size-btn size-medium' + (size === 'medium' ? ' is-selected' : '') + '">Medium yard</button>' +
              '<button type="button" class="size-btn size-large' + (size === 'large' ? ' is-selected' : '') + '">Large yard</button>' +
              '</div>' +
              '</div>'
            : '';
          return '<div class="service-item">' +
            '<div class="service-row">' +
            '<label class="service-row-check"><input type="checkbox" class="service-checkbox" value="' + s.id + '"' + (checked ? ' checked' : '') + ' />' +
            esc(s.description) + '</label>' +
            qtyHtml +
            '</div>' +
            tierHtml +
            sizeHtml +
            '</div>';''',
),
(
'''          var stepper = listEl.querySelector('.qty-stepper[data-id="' + id + '"]');
          var tierRow = listEl.querySelector('.tier-row[data-tier-row="' + id + '"]');
          if (cb.checked) {
            if (stepper) {
              stepper.querySelectorAll('.qty-btn').forEach(function (b) { b.disabled = false; });
              stepper.querySelector('.qty-value').textContent = '1';
            }
            if (tierRow) tierRow.classList.add('is-visible');
            selectedServices[id] = { quantity: 1, tier: 'premium' };
          } else {
            if (stepper) stepper.querySelectorAll('.qty-btn').forEach(function (b) { b.disabled = true; });
            if (tierRow) tierRow.classList.remove('is-visible');
            delete selectedServices[id];
          }''',
'''          var stepper = listEl.querySelector('.qty-stepper[data-id="' + id + '"]');
          var tierRow = listEl.querySelector('.tier-row[data-tier-row="' + id + '"]');
          var sizeRow = listEl.querySelector('.size-row[data-size-row="' + id + '"]');
          if (cb.checked) {
            if (stepper) {
              stepper.querySelectorAll('.qty-btn').forEach(function (b) { b.disabled = false; });
              stepper.querySelector('.qty-value').textContent = '1';
            }
            if (tierRow) tierRow.classList.add('is-visible');
            if (sizeRow) sizeRow.classList.add('is-visible');
            selectedServices[id] = { quantity: 1, tier: 'premium', size: 'medium' };
          } else {
            if (stepper) stepper.querySelectorAll('.qty-btn').forEach(function (b) { b.disabled = true; });
            if (tierRow) tierRow.classList.remove('is-visible');
            if (sizeRow) sizeRow.classList.remove('is-visible');
            delete selectedServices[id];
          }''',
),
(
'''      listEl.querySelectorAll('.tier-toggle').forEach(function (toggle) {
        var id = Number(toggle.dataset.id);
        var budgetBtn = toggle.querySelector('.tier-budget');
        var premiumBtn = toggle.querySelector('.tier-premium');
        budgetBtn.addEventListener('click', function () {
          if (selectedServices[id] === undefined) return;
          selectedServices[id].tier = 'budget';
          budgetBtn.classList.add('is-selected');
          premiumBtn.classList.remove('is-selected');
        });
        premiumBtn.addEventListener('click', function () {
          if (selectedServices[id] === undefined) return;
          selectedServices[id].tier = 'premium';
          premiumBtn.classList.add('is-selected');
          budgetBtn.classList.remove('is-selected');
        });
      });
    }''',
'''      listEl.querySelectorAll('.tier-toggle').forEach(function (toggle) {
        var id = Number(toggle.dataset.id);
        var budgetBtn = toggle.querySelector('.tier-budget');
        var premiumBtn = toggle.querySelector('.tier-premium');
        budgetBtn.addEventListener('click', function () {
          if (selectedServices[id] === undefined) return;
          selectedServices[id].tier = 'budget';
          budgetBtn.classList.add('is-selected');
          premiumBtn.classList.remove('is-selected');
        });
        premiumBtn.addEventListener('click', function () {
          if (selectedServices[id] === undefined) return;
          selectedServices[id].tier = 'premium';
          premiumBtn.classList.add('is-selected');
          budgetBtn.classList.remove('is-selected');
        });
      });

      listEl.querySelectorAll('.size-toggle').forEach(function (toggle) {
        var id = Number(toggle.dataset.id);
        var smallBtn = toggle.querySelector('.size-small');
        var mediumBtn = toggle.querySelector('.size-medium');
        var largeBtn = toggle.querySelector('.size-large');
        function selectSize(size, btn) {
          if (selectedServices[id] === undefined) return;
          selectedServices[id].size = size;
          [smallBtn, mediumBtn, largeBtn].forEach(function (b) { b.classList.remove('is-selected'); });
          btn.classList.add('is-selected');
        }
        smallBtn.addEventListener('click', function () { selectSize('small', smallBtn); });
        mediumBtn.addEventListener('click', function () { selectSize('medium', mediumBtn); });
        largeBtn.addEventListener('click', function () { selectSize('large', largeBtn); });
      });
    }''',
),
(
'''        var selectedList = Object.keys(selectedServices).map(function (id) {
          return { id: Number(id), quantity: selectedServices[id].quantity, tier: selectedServices[id].tier };
        });''',
'''        var selectedList = Object.keys(selectedServices).map(function (id) {
          return { id: Number(id), quantity: selectedServices[id].quantity, tier: selectedServices[id].tier, size: selectedServices[id].size };
        });''',
),
])

print("")
print("All files patched successfully. Now check git status / git diff to review, then commit and push.")
