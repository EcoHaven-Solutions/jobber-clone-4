#!/usr/bin/env python3
"""Adds a Settings choice for what "Copy for text" does on your phone, because Android
keeps sending the text to Google Messages instead of Two Lines:
  1. Open my default texting app (how it works now)
  2. Open the Share menu -- you pick Two Lines from the list
  3. Just copy the message -- you open Two Lines and paste
Run from ~/Downloads/jobber-clone :   python3 patch_text_mode.py
Edits phone-app/app.js and phone-app/index.html (version stamp only)."""
import sys, re

MARK = 'TEXT-MODE-PATCH'
STAMP = '202611210400'
ANCHOR = "  if (isMobile && digits) {\n    window.open(`sms:"

HOOK = r"""  // TEXT-MODE-PATCH: choose what "Copy for text" does on a phone (Settings -> Texting)
  if (isMobile) {
    let mode = 'sms';
    try { mode = localStorage.getItem('eh_text_mode') || 'sms'; } catch (e) { /* optional */ }
    if (mode === 'copy' || mode === 'share') {
      try { navigator.clipboard.writeText(text); } catch (e) { /* optional */ }
      if (mode === 'share' && navigator.share && text) {
        navigator.share({ text }).catch(() => {});
        return;
      }
      alert('The message is copied.' + (phone ? '\n\nOpen Two Lines, start a text to ' + phone + ', and paste it.' : '\n\nOpen your texting app and paste it.'));
      return;
    }
  }
"""

CARD = r"""
/* TEXT-MODE-PATCH: Settings card */
(function () {
  const view = document.getElementById('view-settings');
  if (!view || document.getElementById('text-mode-card')) return;
  const host = view.querySelector('.settings-card');
  if (!host) return;
  let mode = 'sms';
  try { mode = localStorage.getItem('eh_text_mode') || 'sms'; } catch (e) { /* optional */ }
  const card = document.createElement('div');
  card.className = 'table-wrap settings-card'; card.id = 'text-mode-card'; card.style.marginBottom = '16px';
  card.innerHTML = '<div class="drawer-body" style="padding:24px;"><label>When I tap "Copy for text" on my phone' +
    '<select id="text-mode-select">' +
    '<option value="sms">Open my default texting app</option>' +
    '<option value="share">Open the Share menu (pick Two Lines from the list)</option>' +
    '<option value="copy">Just copy the message (I will open Two Lines and paste)</option>' +
    '</select></label><p class="empty-sub">Saved on this phone only. The message is always copied first.</p></div>';
  host.parentNode.insertBefore(card, host);
  const sel = document.getElementById('text-mode-select'); sel.value = mode;
  sel.addEventListener('change', () => { try { localStorage.setItem('eh_text_mode', sel.value); } catch (e) { /* optional */ } });
})();
"""

def read(p):
    try: return open(p, encoding='utf-8').read()
    except OSError: sys.exit("Can't find %s -- run this from your jobber-clone folder." % p)

p = 'phone-app/app.js'; src = read(p)
if MARK in src: print(p + ': already patched, skipping')
else:
    if src.count(ANCHOR) != 1: sys.exit("%s: expected to find the text-message code once but found %d. Nothing was changed." % (p, src.count(ANCHOR)))
    src = src.replace(ANCHOR, HOOK + ANCHOR)
    open(p, 'w', encoding='utf-8').write(src.rstrip('\n') + '\n' + CARD); print(p + ': patched')

p = 'phone-app/index.html'; src = read(p)
new, n = re.subn(r'(app\.js\?v=)[\w.\-]+', r'\g<1>' + STAMP, src)
if n: open(p, 'w', encoding='utf-8').write(new); print('index.html: version stamp updated')
else: print('index.html: no version stamp found (skipping); hard-refresh the app if the change does not show')
print('\nDONE. Open GitHub Desktop, commit, and push. Wait about 2 minutes, then open the app.')
