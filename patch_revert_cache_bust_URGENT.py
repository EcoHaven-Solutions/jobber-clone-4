import pathlib

path = pathlib.Path("phone-app/index.html")
content = path.read_text()


def apply(old, new, label):
    global content
    count = content.count(old)
    if count != 1:
        raise SystemExit(f"ABORT: expected exactly 1 match for '{label}', found {count}. No changes written.")
    content = content.replace(old, new)
    print(f"OK: patched '{label}'")


# URGENT REVERT: the document.write-based cache-busting loader broke the
# app on iPhone/Safari -- it either threw "Cannot access uninitialized
# variable" or loaded with no data, both symptoms of the four scripts
# executing out of the required order (supabase-api.js / design-data.js
# must fully run before app.js). document.write's ordering guarantee is
# not reliable enough across mobile Safari in practice. This restores the
# exact original plain <script src> tags so the app works again right now.
# A safer cache-busting approach (dynamic script tags chained via onload,
# no document.write) can be reintroduced separately and tested properly
# before going live again.
apply(
    '  <script>\n'
    '    // Cache-busting for local app files (see comment in patch script /\n'
    '    // repo history for why). Forces a fresh fetch of these four files\n'
    '    // on every page load, regardless of browser cache.\n'
    '    var __v = Date.now();\n'
    '    document.write(\'<script src="supabase-api.js?v=\' + __v + \'"><\\/script>\');\n'
    '    document.write(\'<script src="design-data.js?v=\' + __v + \'"><\\/script>\');\n'
    '    document.write(\'<script src="app.js?v=\' + __v + \'"><\\/script>\');\n'
    '    document.write(\'<script src="design.js?v=\' + __v + \'"><\\/script>\');\n'
    '  </script>\n',
    '  <script src="supabase-api.js"></script>\n'
    '  <script src="design-data.js"></script>\n'
    '  <script src="app.js"></script>\n'
    '  <script src="design.js"></script>\n',
    "URGENT revert cache-bust script loader",
)

path.write_text(content)
print("DONE: phone-app/index.html reverted successfully. The app should work normally again once this is pushed.")
