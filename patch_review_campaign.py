#!/usr/bin/env python3
"""Adds a "Review campaign" button on the Customers tab: email a batch of
customers asking for a Google review (one personalized email each).

Run from ~/Downloads/jobber-clone :   python3 patch_review_campaign.py
Edits phone-app/index.html, app.js, supabase-api.js.
(Run add_review_campaign.sql in Supabase first.)
"""
import sys, os, re

MARK = 'REVIEW-CAMPAIGN-PATCH'

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
 ('api',
  "    sendAnnouncement: (subject, message, customerIds) => invokeFunction('send-announcement', { subject, heading: subject, message, customerIds }),",
  "    sendAnnouncement: (subject, message, customerIds) => invokeFunction('send-announcement', { subject, heading: subject, message, customerIds }),\n    // REVIEW-CAMPAIGN-PATCH\n    sendReviewCampaign: (customerIds, message, test) => invokeFunction('send-notifications', { type: 'review-campaign', customerIds, message, test: !!test }),"),
])

patch('phone-app/index.html', [
 ('button',
  """            <button class="btn btn-ghost" id="btn-send-announcement">Send announcement</button>""",
  """            <button class="btn btn-ghost" id="btn-send-announcement">Send announcement</button>
            <button class="btn btn-ghost" id="btn-review-campaign">Review campaign</button>"""),
 ('drawer',
  """  <!-- Send Announcement (BCC'd group email) -->""",
  """  <!-- Review campaign (REVIEW-CAMPAIGN-PATCH) -->
  <div class="overlay" id="review-overlay" hidden></div>
  <div class="drawer drawer-wide" id="review-drawer" hidden>
    <div class="drawer-header">
      <h2>Review campaign</h2>
      <button class="icon-btn" id="btn-close-review-drawer" aria-label="Close">&times;</button>
    </div>
    <form id="review-form" class="drawer-body">
      <p class="empty-sub" style="margin-top:0;">
        Each customer gets their own personal email ("Hi Nick, thanks for choosing us...") with a
        "Leave a Review" button that goes to your Google review link (set in Settings).
        Customers marked "exclude from mass communications" are always skipped.
      </p>
      <label>Optional personal line (added under the thank-you)
        <textarea id="review-message" rows="3" maxlength="1000" placeholder="e.g. It was a pleasure working on your yard this year."></textarea>
      </label>
      <label style="flex-direction:row; align-items:center; gap:8px;">
        <input type="checkbox" id="review-only-completed" style="width:auto;" checked />
        Only customers with a completed job
      </label>
      <label style="flex-direction:row; align-items:center; gap:8px;">
        <input type="checkbox" id="review-skip-asked" style="width:auto;" checked />
        Skip anyone already asked for a review in the last 6 months
      </label>

      <div class="drawer-section-label">Recipients</div>
      <div class="toolbar" style="margin-bottom:8px;">
        <input type="text" id="review-search" placeholder="Search customers…" style="flex:1;" />
        <button type="button" class="btn btn-ghost btn-small" id="btn-review-select-all">Select all</button>
        <button type="button" class="btn btn-ghost btn-small" id="btn-review-select-none">Select none</button>
      </div>
      <div id="review-customer-list" class="batch-customer-list" style="width:100%; max-height:280px;"></div>
      <p class="empty-sub" id="review-recipient-count">0 recipients selected</p>

      <div class="drawer-actions">
        <button type="button" class="btn btn-ghost" id="btn-review-test">Send a test to myself</button>
        <div class="drawer-actions-right">
          <button type="button" class="btn btn-ghost" id="btn-cancel-review-drawer">Cancel</button>
          <button type="submit" class="btn btn-primary" id="btn-send-review-submit">Send review requests</button>
        </div>
      </div>
    </form>
  </div>

  <!-- Send Announcement (BCC'd group email) -->"""),
], regex_edits=[
 ('cache-bust', r'(style\.css|supabase-api\.js|design-data\.js|app\.js|design\.js)\?v=\d{8}[a-z]', r'\1?v=20261107a', 5),
])

patch('phone-app/app.js', [
 ('review campaign code',
  "// ===================== Leads =====================\n\nlet leads = [];",
  r"""// ===================== Review campaign =====================
// REVIEW-CAMPAIGN-PATCH

const selectedReviewCustomerIds = new Set();
const REVIEW_SKIP_DAYS = 180;
const REVIEW_BATCH_SIZE = 15; // customers per server call, so nothing times out

function reviewAskedInfo(c) {
  // Returns text like "asked 3/4/2026" if this customer was already asked, else ''.
  if (c.review_requested_at) {
    const ageDays = (Date.now() - new Date(c.review_requested_at).getTime()) / 86400000;
    if (ageDays < REVIEW_SKIP_DAYS) return 'asked ' + new Date(c.review_requested_at).toLocaleDateString();
  }
  const askedOnJob = jobs.some((j) => j.customer_id === c.id && Number(j.review_requested) === 1);
  return askedOnJob ? 'asked on a job' : '';
}

function reviewEligibleCustomers() {
  const onlyCompleted = document.getElementById('review-only-completed').checked;
  const skipAsked = document.getElementById('review-skip-asked').checked;
  const query = document.getElementById('review-search').value.trim().toLowerCase();
  return customers.filter((c) => {
    if (!c.email || c.exclude_from_mass_comms) return false;
    if (onlyCompleted && !jobs.some((j) => j.customer_id === c.id && j.status === 'completed')) return false;
    if (skipAsked && reviewAskedInfo(c)) return false;
    if (query && !c.name.toLowerCase().includes(query)) return false;
    return true;
  });
}

function updateReviewRecipientCount() {
  document.getElementById('review-recipient-count').textContent = `${selectedReviewCustomerIds.size} recipient(s) selected`;
}

function renderReviewCustomerList() {
  const wrap = document.getElementById('review-customer-list');
  const list = reviewEligibleCustomers();
  // Anyone no longer shown (filters changed) is dropped from the selection.
  const shownIds = new Set(list.map((c) => c.id));
  Array.from(selectedReviewCustomerIds).forEach((id) => { if (!shownIds.has(id)) selectedReviewCustomerIds.delete(id); });

  if (!list.length) {
    wrap.innerHTML = '<p class="empty-sub" style="margin:0;">No matching customers (they need an email on file, not opted out, and match the checkboxes above).</p>';
    updateReviewRecipientCount();
    return;
  }
  wrap.innerHTML = list
    .map((c) => {
      const asked = reviewAskedInfo(c);
      return `
      <label class="batch-customer-row">
        <input type="checkbox" class="review-customer-checkbox" value="${c.id}" ${selectedReviewCustomerIds.has(c.id) ? 'checked' : ''} />
        ${escapeHtml(c.name)}${asked ? ` <span style="color:#A9AC9E;font-size:12px;">(${escapeHtml(asked)})</span>` : ''}
      </label>`;
    })
    .join('');
  wrap.querySelectorAll('.review-customer-checkbox').forEach((cb) => {
    cb.addEventListener('change', (e) => {
      const id = Number(e.target.value);
      if (e.target.checked) selectedReviewCustomerIds.add(id);
      else selectedReviewCustomerIds.delete(id);
      updateReviewRecipientCount();
    });
  });
  updateReviewRecipientCount();
}

function openReviewDrawer() {
  document.getElementById('review-form').reset();
  document.getElementById('review-message').value = '';
  document.getElementById('review-search').value = '';
  selectedReviewCustomerIds.clear();
  renderReviewCustomerList();
  document.getElementById('review-overlay').hidden = false;
  document.getElementById('review-drawer').hidden = false;
}

function closeReviewDrawer() {
  document.getElementById('review-overlay').hidden = true;
  document.getElementById('review-drawer').hidden = true;
}

['review-only-completed', 'review-skip-asked'].forEach((id) => document.getElementById(id).addEventListener('change', renderReviewCustomerList));
document.getElementById('review-search').addEventListener('input', renderReviewCustomerList);
document.getElementById('btn-review-select-all').addEventListener('click', () => {
  document.querySelectorAll('.review-customer-checkbox').forEach((cb) => { cb.checked = true; selectedReviewCustomerIds.add(Number(cb.value)); });
  updateReviewRecipientCount();
});
document.getElementById('btn-review-select-none').addEventListener('click', () => {
  document.querySelectorAll('.review-customer-checkbox').forEach((cb) => (cb.checked = false));
  selectedReviewCustomerIds.clear();
  updateReviewRecipientCount();
});

document.getElementById('btn-review-test').addEventListener('click', async (e) => {
  const btn = e.currentTarget;
  btn.disabled = true;
  btn.textContent = 'Sending…';
  try {
    const result = await window.api.email.sendReviewCampaign([], document.getElementById('review-message').value, true);
    if (result && result.ok) alert('Test sent to your own email. Check your inbox (and spam folder).');
    else alert("Couldn't send the test: " + ((result && result.error) || 'unknown error'));
  } catch (err) { alert('Something went wrong: ' + (err && err.message ? err.message : err)); }
  btn.disabled = false;
  btn.textContent = 'Send a test to myself';
});

document.getElementById('review-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const ids = Array.from(selectedReviewCustomerIds);
  if (!ids.length) { alert('Select at least one customer first.'); return; }
  if (!confirm(`Send a review request to ${ids.length} customer(s)? Each gets their own email. This can't be undone.`)) return;

  const btn = document.getElementById('btn-send-review-submit');
  const message = document.getElementById('review-message').value;
  btn.disabled = true;
  let sent = 0;
  const failed = [];
  let skipped = 0;
  let stopError = '';
  for (let i = 0; i < ids.length; i += REVIEW_BATCH_SIZE) {
    btn.textContent = `Sending ${Math.min(i + REVIEW_BATCH_SIZE, ids.length)}/${ids.length}…`;
    try {
      const result = await window.api.email.sendReviewCampaign(ids.slice(i, i + REVIEW_BATCH_SIZE), message, false);
      if (!result || result.ok === false) { stopError = (result && result.error) || 'unknown error'; break; }
      sent += result.sentCount || 0;
      skipped += result.skipped || 0;
      (result.failed || []).forEach((f) => failed.push(f));
    } catch (err) { stopError = err && err.message ? err.message : String(err); break; }
  }
  btn.disabled = false;
  btn.textContent = 'Send review requests';

  let summary = `Sent ${sent} review request(s).`;
  if (skipped) summary += ` Skipped ${skipped} (no email or opted out).`;
  if (failed.length) summary += `\n\nCouldn't send to: ${failed.map((f) => f.name).join(', ')}.`;
  if (stopError) summary += `\n\nStopped early: ${stopError}`;
  alert(summary);
  if (typeof loadCustomers === 'function') await loadCustomers();
  if (!stopError) closeReviewDrawer(); else renderReviewCustomerList();
});

document.getElementById('btn-review-campaign').addEventListener('click', openReviewDrawer);
document.getElementById('btn-close-review-drawer').addEventListener('click', closeReviewDrawer);
document.getElementById('btn-cancel-review-drawer').addEventListener('click', closeReviewDrawer);
document.getElementById('review-overlay').addEventListener('click', closeReviewDrawer);

// ===================== Leads =====================

let leads = [];"""),
])
