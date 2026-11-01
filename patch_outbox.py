#!/usr/bin/env python3
"""Adds an "Emails waiting for your OK" section to the Reminders tab: automatic estimate follow-ups wait there until you approve them.

Run from ~/Downloads/jobber-clone :   python3 patch_outbox.py
Edits phone-app/index.html, app.js, supabase-api.js, style.css.
(You ALSO need to run add_email_outbox.sql once in Supabase.)
"""
import sys, os

MARK = 'OUTBOX-PATCH'

def patch(path, edits):
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
    open(path, 'w', encoding='utf-8').write(src)
    print(f"{path}: patched ({len(edits)} edits)")

# ------------------------------------------------------------ supabase-api.js
patch('phone-app/supabase-api.js', [
 ('outbox api',
  "  quotes: {\n    list: async () => withTotals('quotes'",
  """  // OUTBOX-PATCH: automatic emails wait in email_outbox until approved.
  outbox: {
    listPending: async () => unwrap(await sb.from('email_outbox').select('*').eq('status', 'pending').order('created_at')),
    listRecent: async () =>
      unwrap(await sb.from('email_outbox').select('id, created_at, kind, to_email, to_name, subject, status, decided_at').neq('status', 'pending').order('decided_at', { ascending: false }).limit(15)),
    send: (id) => invokeFunction('send-notifications', { type: 'outbox-send', id }),
    discard: async (id) => {
      const { error } = await sb.from('email_outbox').update({ status: 'discarded', decided_at: new Date().toISOString() }).eq('id', id);
      if (error) throw new Error(error.message);
    },
    // Customer told you yes/no in person: set the estimate's status and drop any waiting emails for it.
    markQuote: async (quoteId, status) => {
      const r1 = await sb.from('quotes').update({ status }).eq('id', quoteId);
      if (r1.error) throw new Error(r1.error.message);
      const r2 = await sb.from('email_outbox').update({ status: 'discarded', decided_at: new Date().toISOString() }).eq('quote_id', quoteId).eq('status', 'pending');
      if (r2.error) throw new Error(r2.error.message);
    },
  },

  quotes: {
    list: async () => withTotals('quotes'"""),
])

# ------------------------------------------------------------ index.html
patch('phone-app/index.html', [
 ('nav badge',
  """<span class="nav-tag">11</span> Reminders""",
  """<span class="nav-tag">11</span> Reminders <span class="nav-badge" id="outbox-badge" hidden>0</span>"""),
 ('outbox section inside Reminders',
  """            <p class="subtitle">Backflow tests due &amp; customers overdue for service</p>
          </div>
        </header>
""",
  """            <p class="subtitle">Emails to approve, backflow tests due &amp; customers overdue for service</p>
          </div>
        </header>

        <!-- OUTBOX-PATCH: approval queue for automatic emails -->
        <div class="content-header">
          <div>
            <h1 style="font-size:18px;">Emails waiting for your OK</h1>
            <p class="subtitle">Automatic estimate follow-ups wait here until you approve them</p>
          </div>
          <button class="btn btn-ghost" id="btn-outbox-refresh" type="button">Refresh</button>
        </div>
        <p class="empty-sub" id="outbox-message" hidden></p>
        <div id="outbox-list"></div>
        <p class="empty-sub" id="outbox-empty" hidden>Nothing waiting. Estimate follow-ups will show up here for your OK before they go out.</p>
        <details class="outbox-history" id="outbox-history" hidden>
          <summary>Recently sent / skipped</summary>
          <div id="outbox-history-list"></div>
        </details>
"""),
 ('cache css', 'style.css?v=20261017a', 'style.css?v=20261101a'),
 ('cache api', 'supabase-api.js?v=20261017a', 'supabase-api.js?v=20261101a'),
 ('cache data', 'design-data.js?v=20261017a', 'design-data.js?v=20261101a'),
 ('cache app', 'app.js?v=20261017a', 'app.js?v=20261101a'),
 ('cache design', 'design.js?v=20261017a', 'design.js?v=20261101a'),
])

# ------------------------------------------------------------ style.css
css_path = 'phone-app/style.css'
if os.path.exists(css_path):
    s = open(css_path, encoding='utf-8').read()
    if MARK in s:
        print(f"{css_path}: already patched, skipping")
    else:
        s += """

/* OUTBOX-PATCH */
.nav-badge {
  margin-left: auto;
  background: var(--danger, #c0392b);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  min-width: 18px;
  padding: 1px 6px;
  border-radius: 999px;
  text-align: center;
}
.nav-badge[hidden] { display: none; }
.outbox-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 12px;
}
.outbox-card.is-stale { border-color: var(--danger, #c0392b); }
.outbox-kind { font-size: 11px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--ink-soft); }
.outbox-subject { font-size: 16px; font-weight: 700; margin: 2px 0; }
.outbox-meta { font-size: 13px; color: var(--ink-soft); margin-bottom: 8px; }
.outbox-warn { background: var(--danger-soft, #fde8e6); color: var(--danger, #c0392b); font-size: 13px; font-weight: 600; padding: 8px 10px; border-radius: 6px; margin-bottom: 8px; }
.outbox-card details { margin: 8px 0; }
.outbox-card summary { cursor: pointer; font-size: 13px; font-weight: 600; }
.outbox-card iframe { width: 100%; height: 380px; border: 1px solid var(--line); border-radius: 6px; margin-top: 8px; background: #fff; }
.outbox-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
.outbox-actions .btn { flex: 0 0 auto; }
.outbox-history { margin-top: 18px; }
.outbox-history summary { cursor: pointer; font-weight: 600; margin-bottom: 8px; }
.outbox-history-row { font-size: 13px; color: var(--ink-soft); padding: 4px 0; border-bottom: 1px solid var(--line); }
"""
        open(css_path, 'w', encoding='utf-8').write(s)
        print(f"{css_path}: patched (appended styles)")
else:
    sys.exit(f"Can't find {css_path}")

# ------------------------------------------------------------ app.js
patch('phone-app/app.js', [
 ('open view loads outbox',
  "    if (target === 'reports' && reportYearSelect.value) loadReportForYear(reportYearSelect.value);",
  "    if (target === 'reports' && reportYearSelect.value) loadReportForYear(reportYearSelect.value);\n    if (target === 'reminders') loadOutbox(); // OUTBOX-PATCH"),
 ('outbox code',
  "// ===================== Init =====================",
  r"""// ===================== Email Outbox (approval queue) =====================
// OUTBOX-PATCH: automatic emails are parked in email_outbox; nothing goes to a
// customer until you press Send here.

const OUTBOX_KIND_LABELS = {
  followup1: 'Estimate follow-up (14 days)',
  followup2: 'Final estimate follow-up (28 days)',
  'job-reminder': 'Job reminder (tomorrow)',
  'web-estimate': 'Website estimate confirmation',
};

let outboxPending = [];

function outboxQuoteFor(row) {
  if (!row.quote_id || typeof quotes === 'undefined') return null;
  return quotes.find((q) => String(q.id) === String(row.quote_id)) || null;
}

function updateOutboxBadge() {
  const badge = document.getElementById('outbox-badge');
  if (!badge) return;
  badge.textContent = String(outboxPending.length);
  badge.hidden = outboxPending.length === 0;
}

async function loadOutbox() {
  const msg = document.getElementById('outbox-message');
  if (!msg) return;
  try {
    outboxPending = await window.api.outbox.listPending();
    msg.hidden = true;
  } catch (err) {
    outboxPending = [];
    msg.hidden = false;
    msg.textContent = 'The Outbox is not set up yet. Run add_email_outbox.sql in Supabase (SQL Editor) one time, then tap Refresh. (' + (err && err.message ? err.message : err) + ')';
  }
  updateOutboxBadge();
  renderOutbox();
  try {
    const recent = await window.api.outbox.listRecent();
    renderOutboxHistory(recent);
  } catch (err) { /* history is optional */ }
}

function renderOutbox() {
  const list = document.getElementById('outbox-list');
  const empty = document.getElementById('outbox-empty');
  const msg = document.getElementById('outbox-message');
  if (!list) return;
  list.innerHTML = '';
  empty.hidden = outboxPending.length > 0 || !msg.hidden;
  outboxPending.forEach((row) => {
    const q = outboxQuoteFor(row);
    const stale = q && (q.status === 'approved' || q.status === 'declined');
    const card = document.createElement('div');
    card.className = 'outbox-card' + (stale ? ' is-stale' : '');
    card.dataset.id = row.id;
    const when = row.created_at ? new Date(row.created_at).toLocaleDateString() : '';
    card.innerHTML =
      `<div class="outbox-kind">${escapeHtml(OUTBOX_KIND_LABELS[row.kind] || row.kind)}</div>` +
      `<div class="outbox-subject">${escapeHtml(row.subject || '')}</div>` +
      `<div class="outbox-meta">To: ${escapeHtml(row.to_name || '')} &lt;${escapeHtml(row.to_email || '')}&gt; &middot; queued ${escapeHtml(when)}</div>` +
      (stale ? `<div class="outbox-warn">This estimate is already marked ${escapeHtml(QUOTE_STATUS_LABELS[q.status] || q.status)}. You probably should NOT send this.</div>` : '') +
      (row.error ? `<div class="outbox-warn">Last send failed: ${escapeHtml(row.error)}</div>` : '') +
      `<details><summary>Preview email</summary><iframe sandbox="" class="outbox-frame"></iframe></details>` +
      `<div class="outbox-actions">` +
      `<button type="button" class="btn btn-primary" data-act="send">Send</button>` +
      `<button type="button" class="btn btn-ghost" data-act="skip">Don't send</button>` +
      (row.quote_id ? `<button type="button" class="btn btn-ghost" data-act="approved">Customer accepted</button><button type="button" class="btn btn-ghost" data-act="declined">Customer declined</button>` : '') +
      `</div>`;
    card.querySelector('iframe').srcdoc = row.html || '';
    list.appendChild(card);
  });
}

function renderOutboxHistory(rows) {
  const wrap = document.getElementById('outbox-history');
  const list = document.getElementById('outbox-history-list');
  if (!wrap || !list) return;
  list.innerHTML = '';
  wrap.hidden = !rows.length;
  rows.forEach((r) => {
    const d = document.createElement('div');
    d.className = 'outbox-history-row';
    const when = r.decided_at ? new Date(r.decided_at).toLocaleDateString() : '';
    d.textContent = `${r.status === 'sent' ? 'Sent' : 'Skipped'} ${when} — ${r.to_name || r.to_email}: ${r.subject}`;
    list.appendChild(d);
  });
}

document.addEventListener('click', async (e) => {
  const refresh = e.target.closest('#btn-outbox-refresh');
  if (refresh) { await loadOutbox(); return; }
  const btn = e.target.closest('.outbox-card [data-act]');
  if (!btn) return;
  const card = btn.closest('.outbox-card');
  const row = outboxPending.find((r) => String(r.id) === card.dataset.id);
  if (!row) return;
  const act = btn.dataset.act;
  const q = outboxQuoteFor(row);
  try {
    if (act === 'send') {
      if (q && (q.status === 'approved' || q.status === 'declined') &&
          !confirm('This estimate is already marked ' + (QUOTE_STATUS_LABELS[q.status] || q.status) + '. Send the email anyway?')) return;
      if (!confirm('Send this email to ' + (row.to_email || 'the customer') + ' now?')) return;
      btn.disabled = true; btn.textContent = 'Sending...';
      const result = await window.api.outbox.send(row.id);
      if (!result || result.ok === false) {
        alert('Could not send: ' + ((result && result.error) || 'unknown error'));
      }
    } else if (act === 'skip') {
      await window.api.outbox.discard(row.id);
    } else if (act === 'approved' || act === 'declined') {
      const label = act === 'approved' ? 'accepted' : 'declined';
      if (!confirm('Mark this estimate as ' + label + ' and remove its waiting emails?')) return;
      await window.api.outbox.markQuote(row.quote_id, act);
      if (typeof loadQuotes === 'function') await loadQuotes();
    }
  } catch (err) {
    alert('Something went wrong: ' + (err && err.message ? err.message : err));
  }
  await loadOutbox();
});

setInterval(() => { loadOutbox().catch(() => {}); }, 120000);

// ===================== Init ====================="""),
 ('init loads outbox',
  "  await loadReminders();\n\n  if (window.api.app && window.api.app.getPhoneAccessUrl) {",
  "  await loadReminders();\n  await loadOutbox();\n\n  if (window.api.app && window.api.app.getPhoneAccessUrl) {"),
])
