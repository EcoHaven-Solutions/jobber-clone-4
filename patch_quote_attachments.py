#!/usr/bin/env python3
"""Adds file attachments (PDFs, photos, documents) to estimates.

Run from ~/Downloads/jobber-clone :   python3 patch_quote_attachments.py
Edits phone-app/index.html, app.js, supabase-api.js, style.css.
(You ALSO need to run add_quote_attachments.sql once in Supabase -- see instructions.)
"""
import sys, os

def patch(path, edits, marker='QUOTE-ATTACH-PATCH'):
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
    print(f"{path}: patched ({len(edits)} edits)")

# ------------------------------------------------------------ supabase-api.js
patch('phone-app/supabase-api.js', [
 ('upload helper',
  "window.api = {\n  isElectron: false,",
  """// QUOTE-ATTACH-PATCH: upload any file (PDF, Word, photo...) as-is, keeping its name in the path.
async function uploadFileToStorage(file, folder) {
  const safeName = (file.name || 'file').replace(/[^A-Za-z0-9._-]+/g, '_').slice(-80);
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
  const { error } = await sb.storage.from('attachments').upload(path, file, {
    contentType: file.type || 'application/octet-stream',
  });
  if (error) throw new Error(error.message);
  return sb.storage.from('attachments').getPublicUrl(path).data.publicUrl;
}

window.api = {
  isElectron: false,"""),
 ('quoteAttachments api',
  "  quotes: {\n    list: async () => withTotals('quotes', 'quote_items'",
  """  quoteAttachments: {
    list: async (quoteId) => unwrap(await sb.from('quote_attachments').select('*').eq('quote_id', quoteId).order('created_at')),
    add: async (quoteId, file) => {
      const url = await uploadFileToStorage(file, `quote-attachments/${quoteId}`);
      const { error } = await sb.from('quote_attachments').insert({ quote_id: quoteId, file_url: url, name: file.name || 'Attachment', size_bytes: file.size || null });
      if (error) {
        await deleteFromStorage(url); // don't leave an orphan file behind
        throw new Error(error.message);
      }
      return unwrap(await sb.from('quote_attachments').select('*').eq('quote_id', quoteId).order('created_at'));
    },
    delete: async (id, quoteId) => {
      const row = unwrap(await sb.from('quote_attachments').select('*').eq('id', id).single());
      await deleteFromStorage(row.file_url);
      await sb.from('quote_attachments').delete().eq('id', id);
      return unwrap(await sb.from('quote_attachments').select('*').eq('quote_id', quoteId).order('created_at'));
    },
  },

  quotes: {
    list: async () => withTotals('quotes', 'quote_items'"""),
])

# ---------------------------------------------------------------- index.html
patch('phone-app/index.html', [
 ('attachments section',
  """      <div class="drawer-actions">
        <button type="button" class="btn btn-danger" id="btn-delete-quote" hidden>Delete</button>""",
  """      <!-- QUOTE-ATTACH-PATCH -->
      <div class="drawer-section-label">Attachments</div>
      <input type="file" id="quote-attachment-input" multiple />
      <p class="empty-sub">PDFs, plans, photos, spec sheets -- up to 15 files, 20 MB each. They're listed as download links in the emailed estimate.</p>
      <div id="quote-attachment-list" class="attachment-list"></div>

      <div class="drawer-actions">
        <button type="button" class="btn btn-danger" id="btn-delete-quote" hidden>Delete</button>"""),
])

# ----------------------------------------------------------------- style.css
css = open('phone-app/style.css', encoding='utf-8').read()
if 'QUOTE-ATTACH-PATCH' not in css:
    css += '''

/* QUOTE-ATTACH-PATCH: estimate attachments */
.attachment-list { display: flex; flex-direction: column; gap: 6px; }
.attachment-row {
  display: flex; align-items: center; gap: 10px;
  padding: 7px 10px; border: 1px solid var(--line); border-radius: 6px;
  font-size: 13px;
}
.attachment-row .attachment-ext {
  flex: 0 0 auto; min-width: 38px; text-align: center;
  font-family: var(--font-mono); font-size: 10px; font-weight: 600;
  padding: 3px 5px; border-radius: 4px; background: var(--line); color: var(--ink-soft);
  text-transform: uppercase;
}
.attachment-row a { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.attachment-row .attachment-size { flex: 0 0 auto; color: var(--ink-soft); font-size: 12px; }
.attachment-row .attachment-remove {
  flex: 0 0 auto; background: none; border: none; color: var(--ink-soft);
  cursor: pointer; font-size: 16px; line-height: 1;
}
'''
    open('phone-app/style.css', 'w', encoding='utf-8').write(css)
    print('phone-app/style.css: patched')
else:
    print('phone-app/style.css: already patched, skipping')

# --------------------------------------------------------------------- app.js
patch('phone-app/app.js', [
 ('render on open',
  "  updateQuoteTotal();\n  quoteOverlay.hidden = false;\n  quoteDrawer.hidden = false;\n}",
  "  updateQuoteTotal();\n  renderQuoteAttachments(editingQuoteId);\n  quoteOverlay.hidden = false;\n  quoteDrawer.hidden = false;\n}"),
 ('attachment code',
  "quoteForm.addEventListener('submit', async (e) => {\n  e.preventDefault();\n  const saved = await saveCurrentQuote();",
  r"""// QUOTE-ATTACH-PATCH ---- estimate attachments ----
const quoteAttachmentInput = document.getElementById('quote-attachment-input');
const quoteAttachmentList = document.getElementById('quote-attachment-list');
const QUOTE_ATTACHMENT_MAX_FILES = 15;
const QUOTE_ATTACHMENT_MAX_BYTES = 20 * 1024 * 1024;

function formatFileSize(bytes) {
  const n = Number(bytes) || 0;
  if (!n) return '';
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

async function renderQuoteAttachments(quoteId) {
  quoteAttachmentList.innerHTML = '';
  if (!quoteId) return;
  let rows;
  try {
    rows = await window.api.quoteAttachments.list(quoteId);
  } catch (err) {
    quoteAttachmentList.innerHTML = '<p class="empty-sub">Attachments aren\'t set up yet -- run the add_quote_attachments.sql step in Supabase.</p>';
    return;
  }
  if (quoteId !== editingQuoteId) return; // drawer moved on while loading
  for (const att of rows) {
    const ext = ((att.name || '').split('.').pop() || 'file').slice(0, 4);
    const row = document.createElement('div');
    row.className = 'attachment-row';
    row.innerHTML = `
      <span class="attachment-ext">${escapeHtml(ext)}</span>
      <a href="${escapeHtml(att.file_url)}" target="_blank" rel="noopener">${escapeHtml(att.name || 'Attachment')}</a>
      <span class="attachment-size">${formatFileSize(att.size_bytes)}</span>
      <button type="button" class="attachment-remove" aria-label="Remove attachment">&times;</button>
    `;
    row.querySelector('.attachment-remove').addEventListener('click', async () => {
      if (!confirm(`Remove "${att.name || 'this attachment'}" from the estimate?`)) return;
      try {
        await window.api.quoteAttachments.delete(att.id, quoteId);
      } catch (err) {
        alert(err.message);
      }
      renderQuoteAttachments(quoteId);
    });
    quoteAttachmentList.appendChild(row);
  }
}

quoteAttachmentInput.addEventListener('change', async () => {
  const files = Array.from(quoteAttachmentInput.files || []);
  quoteAttachmentInput.value = '';
  if (!files.length) return;

  // A brand-new estimate has to be saved once before files can be attached to it.
  if (!editingQuoteId) {
    const saved = await saveCurrentQuote();
    if (!saved) {
      alert('Pick a customer and enter an estimate title first, then add attachments.');
      return;
    }
    await loadQuotes();
  }
  const quoteId = editingQuoteId;

  let existing = [];
  try {
    existing = await window.api.quoteAttachments.list(quoteId);
  } catch (err) {
    alert('Attachments aren\'t set up yet -- run the add_quote_attachments.sql step in Supabase first.');
    return;
  }
  const room = QUOTE_ATTACHMENT_MAX_FILES - existing.length;
  if (room <= 0) {
    alert(`This estimate already has the max of ${QUOTE_ATTACHMENT_MAX_FILES} attachments. Remove one first.`);
    return;
  }
  const toUpload = files.slice(0, room);
  if (files.length > toUpload.length) {
    alert(`Only ${room} more file${room === 1 ? '' : 's'} can be added (${QUOTE_ATTACHMENT_MAX_FILES} max) -- the rest weren't uploaded.`);
  }

  for (const file of toUpload) {
    if (file.size > QUOTE_ATTACHMENT_MAX_BYTES) {
      alert(`"${file.name}" is over 20 MB and was skipped.`);
      continue;
    }
    try {
      await window.api.quoteAttachments.add(quoteId, file);
    } catch (err) {
      alert(`Couldn't upload "${file.name}": ${err.message}`);
    }
  }
  renderQuoteAttachments(quoteId);
});

quoteForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const saved = await saveCurrentQuote();"""),
])
# Make browsers fetch the new scripts instead of an old cached copy.
import re
html = open('phone-app/index.html', encoding='utf-8').read()
V = '20261017a'
new_html, n = re.subn(r'(href|src)="(style\.css|supabase-api\.js|design-data\.js|app\.js|design\.js)(\?v=\w+)?"', lambda m: f'{m.group(1)}="{m.group(2)}?v={V}"', html)
if n:
    open('phone-app/index.html', 'w', encoding='utf-8').write(new_html)
    print(f"phone-app/index.html: cache-busting version set on {n} links")
print('Done. Commit + push with GitHub Desktop.')
