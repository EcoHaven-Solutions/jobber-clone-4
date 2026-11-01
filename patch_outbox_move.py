#!/usr/bin/env python3
"""Moves the Outbox from its own tab into the Reminders tab.
Only for people who already ran the first patch_outbox.py.

Run from ~/Downloads/jobber-clone :   python3 patch_outbox_move.py
"""
import sys, os

MARK = 'OUTBOX-MOVE'

def patch(path, edits):
    if not os.path.exists(path):
        sys.exit(f"Can't find {path} -- run this from your jobber-clone folder.")
    src = open(path, encoding='utf-8').read()
    if MARK in src:
        print(f"{path}: already moved, skipping"); return
    for label, old, new in edits:
        n = src.count(old)
        if n != 1:
            sys.exit(f"{path}: '{label}' matched {n} times (expected 1). Nothing saved for this file.")
        src = src.replace(old, new)
    open(path, 'w', encoding='utf-8').write(src)
    print(f"{path}: patched ({len(edits)} edits)")

OLD_NAV = """        <button class="nav-item" data-view="outbox">
          <span class="nav-tag">&#9993;</span> Outbox <span class="nav-badge" id="outbox-badge" hidden>0</span>
        </button>
"""

OLD_VIEW = """      <!-- ===== Outbox view (OUTBOX-PATCH) ===== -->
      <section class="view" id="view-outbox" hidden>
        <header class="content-header">
          <div>
            <h1>Outbox</h1>
            <p class="subtitle">Automatic emails wait here until you approve them</p>
          </div>
          <button class="btn btn-ghost" id="btn-outbox-refresh" type="button">Refresh</button>
        </header>
        <p class="empty-sub" id="outbox-message" hidden></p>
        <div id="outbox-list"></div>
        <p class="empty-sub" id="outbox-empty" hidden>Nothing waiting. Automatic emails (estimate follow-ups, job reminders, website estimate confirmations) will show up here for your OK before they go out.</p>
        <details class="outbox-history" id="outbox-history" hidden>
          <summary>Recently sent / skipped</summary>
          <div id="outbox-history-list"></div>
        </details>
      </section>

"""

patch('phone-app/index.html', [
 ('remove old tab button', OLD_NAV, ''),
 ('badge on Reminders button',
  """<span class="nav-tag">11</span> Reminders""",
  """<span class="nav-tag">11</span> Reminders <span class="nav-badge" id="outbox-badge" hidden>0</span>"""),
 ('remove old view', OLD_VIEW, ''),
 ('add section to Reminders',
  """            <p class="subtitle">Backflow tests due &amp; customers overdue for service</p>
          </div>
        </header>
""",
  """            <p class="subtitle">Emails to approve, backflow tests due &amp; customers overdue for service</p>
          </div>
        </header>

        <!-- OUTBOX-MOVE: approval queue for automatic emails -->
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
 ('cache css', 'style.css?v=20261101a', 'style.css?v=20261101b'),
 ('cache api', 'supabase-api.js?v=20261101a', 'supabase-api.js?v=20261101b'),
 ('cache data', 'design-data.js?v=20261101a', 'design-data.js?v=20261101b'),
 ('cache app', 'app.js?v=20261101a', 'app.js?v=20261101b'),
 ('cache design', 'design.js?v=20261101a', 'design.js?v=20261101b'),
])

patch('phone-app/app.js', [
 ('load when Reminders opens',
  "    if (target === 'outbox') loadOutbox(); // OUTBOX-PATCH",
  "    if (target === 'reminders') loadOutbox(); // OUTBOX-MOVE"),
])
