#!/usr/bin/env python3
"""On a computer, "Copy for text" now opens Google Messages for web (linked to your
Pixel, so texts send from your Pixel's number) instead of Google Voice.
Phones are not affected.

Run from ~/Downloads/jobber-clone :   python3 patch_messages_web.py
Edits phone-app/app.js and phone-app/index.html. Works whether or not you ran
patch_android_text.py first.
"""
import sys, os, re

MARK = 'MESSAGES-WEB-PATCH'

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

patch('phone-app/app.js', [
 ('desktop branch',
  """    window.open('https://voice.google.com/u/0/messages', '_blank');
    alert("Opened Google Voice. The message is copied -- just paste it (Cmd+V) into a new text.");""",
  """    // MESSAGES-WEB-PATCH: send from the computer through Google Messages for web
    // (paired with your Pixel, so it goes out from your Pixel's number).
    window.open('https://messages.google.com/web/', '_blank');
    alert(
      'Opened Google Messages for web.\\n\\n' +
      '1. Click "Start chat"' + (digits ? ' and type ' + phone : '') + '.\\n' +
      '2. Paste the message (Cmd+V on a Mac, Ctrl+V on Windows) -- it is already copied.\\n' +
      '3. Press Send.'
    );"""),
])

patch('phone-app/index.html', [], regex_edits=[
 ('cache-bust', r'(style\.css|supabase-api\.js|design-data\.js|app\.js|design\.js)\?v=\d{8}[a-z]', r'\1?v=20261108b', 5),
])
