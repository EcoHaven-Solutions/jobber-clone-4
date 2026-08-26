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
'''    .tier-row {
      display: none;
      margin-top: 8px;
      padding-left: 27px;''',
'''    .service-desc {
      font-size: 12.5px;
      color: #C4D9E0;
      margin: 4px 0 0;
      padding-left: 27px;
      line-height: 1.35;
    }
    .tier-row {
      display: none;
      margin-top: 8px;
      padding-left: 27px;''',
),
(
'''          return '<div class="service-item">' +
            '<div class="service-row">' +
            '<label class="service-row-check"><input type="checkbox" class="service-checkbox" value="' + s.id + '"' + (checked ? ' checked' : '') + ' />' +
            esc(s.description) + '</label>' +
            qtyHtml +
            '</div>' +
            tierHtml +
            '</div>';''',
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
),
])

# ================= phone-app/index.html =================
patch('phone-app/index.html', [
(
'''              <input type="text" id="lit-notes" placeholder="Details (optional) — e.g. what's included, notes for yourself" style="margin-top:8px;" />''',
'''              <textarea id="lit-notes" rows="3" placeholder="Details (optional) — e.g. what's included, warranty, timeline. Shown to customers on the public estimate page and in their confirmation email." style="margin-top:8px;"></textarea>''',
),
])

print("")
print("All files patched successfully. Now check git status / git diff to review, then commit and push.")
