#!/usr/bin/env python3
"""Makes the "Copy for text" buttons open Google Messages on a Pixel/Android phone
with the customer's number and the message already filled in.

Run from ~/Downloads/jobber-clone :   python3 patch_android_text.py
Edits phone-app/app.js and phone-app/index.html.
"""
import sys, os, re

MARK = 'ANDROID-TEXT-PATCH'

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
 ('text compose',
  """  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (isMobile && digits) {
    window.open(`sms:${digits}?&body=${encodeURIComponent(text)}`, '_blank');
  } else {""",
  """  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isAndroid = /Android/i.test(navigator.userAgent);

  if (isMobile && digits && isAndroid) {
    // ANDROID-TEXT-PATCH: Google Messages wants "sms:number?body=text", and a
    // normal link-style navigation (not a new tab) so the phone hands it to Messages.
    window.location.href = `sms:${digits}?body=${encodeURIComponent(text)}`;
  } else if (isMobile && digits) {
    window.open(`sms:${digits}?&body=${encodeURIComponent(text)}`, '_blank');
  } else {"""),
], regex_edits=[])

patch('phone-app/index.html', [], regex_edits=[
 ('cache-bust', r'(style\.css|supabase-api\.js|design-data\.js|app\.js|design\.js)\?v=\d{8}[a-z]', r'\1?v=20261108a', 5),
])
