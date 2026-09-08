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


# GitHub Pages has no equivalent of the Netlify _headers file used to fix
# this same problem on the main website -- there's no way to tell browsers
# "don't cache this file." So when supabase-api.js/app.js/design-data.js/
# design.js get updated and pushed, some phones/browsers keep running an
# old cached copy indefinitely, silently, with no error -- exactly what
# happened with the Reports-tab fix. This replaces the four static local
# script tags with a tiny loader that appends a fresh timestamp to each
# file's URL on every page load, so the browser always treats it as a new
# file and fetches the real current version. document.write is used (not
# a nicer dynamic-append trick) specifically because it keeps the four
# files loading in the same guaranteed order as the original plain tags --
# app.js depends on supabase-api.js and design-data.js already having run.
# The CDN scripts (leaflet/sheetjs/supabase-js/konva) are untouched since
# they're already pinned to an exact version and don't change.
apply(
    '  <script src="supabase-api.js"></script>\n'
    '  <script src="design-data.js"></script>\n'
    '  <script src="app.js"></script>\n'
    '  <script src="design.js"></script>\n',
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
    "cache-bust local script tags",
)

path.write_text(content)
print("DONE: phone-app/index.html patched successfully.")
