#!/usr/bin/env python3
"""Shows the photos customers attach on the estimate form inside each Lead in the app.

Run from ~/Downloads/jobber-clone :   python3 patch_lead_photos.py
Edits phone-app/index.html, app.js, supabase-api.js.
(Run add_lead_photos.sql in Supabase first.)
"""
import sys, os, re

MARK = 'LEAD-PHOTOS-PATCH'

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

patch('phone-app/supabase-api.js', [
 ('lead photos api',
  "  leads: {\n    list: async () => unwrap(await sb.from('leads')",
  """  // LEAD-PHOTOS-PATCH: photos customers attach on the public estimate form.
  leadPhotos: {
    list: async (leadId) => unwrap(await sb.from('lead_photos').select('*').eq('lead_id', leadId).order('created_at')),
    delete: async (id) => {
      const row = unwrap(await sb.from('lead_photos').select('*').eq('id', id).single());
      await deleteFromStorage(row.file_url);
      await sb.from('lead_photos').delete().eq('id', id);
    },
  },

  leads: {
    list: async () => unwrap(await sb.from('leads')"""),
])

patch('phone-app/index.html', [
 ('lead photos section',
  """      <div id="lead-quote-info" style="font-size:13px;color:#A9AC9E;margin-top:-8px;" hidden></div>
""",
  """      <div id="lead-quote-info" style="font-size:13px;color:#A9AC9E;margin-top:-8px;" hidden></div>

      <!-- LEAD-PHOTOS-PATCH -->
      <div id="lead-photos-wrap" hidden>
        <div class="drawer-section-label">Photos from the customer</div>
        <div id="lead-photo-gallery" class="photo-gallery"></div>
        <p class="empty-sub">Tap a photo to open it full size.</p>
      </div>
"""),
], regex_edits=[
 ('cache-bust', r'(style\.css|supabase-api\.js|design-data\.js|app\.js|design\.js)\?v=\d{8}[a-z]', r'\1?v=20261103a', 5),
])

patch('phone-app/app.js', [
 ('open lead drawer loads photos',
  "  refreshLeadQuoteInfo(lead ? lead.id : null);\n",
  "  refreshLeadQuoteInfo(lead ? lead.id : null);\n  renderLeadPhotos(lead ? lead.id : null); // LEAD-PHOTOS-PATCH\n"),
 ('lead photo code',
  "// Shows a small \"linked estimate\" readout on the Lead detail screen when",
  r"""// LEAD-PHOTOS-PATCH: photos the customer attached on the public estimate form.
async function renderLeadPhotos(leadId) {
  const wrap = document.getElementById('lead-photos-wrap');
  const gallery = document.getElementById('lead-photo-gallery');
  if (!wrap || !gallery) return;
  gallery.innerHTML = '';
  wrap.hidden = true;
  if (!leadId) return;
  let rows;
  try {
    rows = await window.api.leadPhotos.list(leadId);
  } catch (err) {
    return; // table not set up yet -- nothing to show
  }
  if (leadId !== editingLeadId || !rows.length) return;
  wrap.hidden = false;
  rows.forEach((photo) => {
    const item = document.createElement('div');
    item.className = 'photo-gallery-item';
    item.innerHTML = `
      <a href="${escapeHtml(photo.file_url)}" target="_blank" rel="noopener"><img src="${escapeHtml(photo.file_url)}" loading="lazy" alt="Customer photo" /></a>
      <button type="button" class="photo-remove" aria-label="Remove photo">&times;</button>
    `;
    item.querySelector('.photo-remove').addEventListener('click', async () => {
      if (!confirm('Remove this photo?')) return;
      try {
        await window.api.leadPhotos.delete(photo.id);
      } catch (err) {
        alert(err.message);
      }
      renderLeadPhotos(leadId);
    });
    gallery.appendChild(item);
  });
}

// Shows a small "linked estimate" readout on the Lead detail screen when"""),
])
