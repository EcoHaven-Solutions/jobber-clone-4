#!/usr/bin/env python3
"""Makes "Copy for text" always open your phone's default texting app (Two Lines)
when you are on your phone, even if Chrome is in "Desktop site" mode.
Run from ~/Downloads/jobber-clone :   python3 patch_mobile_text.py
Edits phone-app/app.js and phone-app/index.html (version stamp only)."""
import sys, re

MARK = 'MOBILE-TEXT-PATCH'
STAMP = '202611210300'
OLD = "const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);"
NEW = ("const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || " 
       "(navigator.maxTouchPoints > 0 && Math.min(screen.width, screen.height) <= 700); // MOBILE-TEXT-PATCH: Chrome 'Desktop site' mode hides the phone's user-agent")

def read(p):
    try: return open(p, encoding='utf-8').read()
    except OSError: sys.exit("Can't find %s -- run this from your jobber-clone folder." % p)

p = 'phone-app/app.js'; src = read(p)
if MARK in src: print(p + ': already patched, skipping')
else:
    if src.count(OLD) != 1: sys.exit("%s: expected to find the text-message check once but found %d. Nothing was changed." % (p, src.count(OLD)))
    open(p, 'w', encoding='utf-8').write(src.replace(OLD, NEW)); print(p + ': patched')

p = 'phone-app/index.html'; src = read(p)
new, n = re.subn(r'(app\.js\?v=)[\w.\-]+', r'\g<1>' + STAMP, src)
if n: open(p, 'w', encoding='utf-8').write(new); print('index.html: version stamp updated')
else: print('index.html: no version stamp found (skipping); hard-refresh the app if the change does not show')
print('\nDONE. Open GitHub Desktop, commit, and push. Wait about 2 minutes, then open the app.')
