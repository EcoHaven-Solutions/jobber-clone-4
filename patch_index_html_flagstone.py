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


# Toolbar button, right next to Hardscape.
apply(
    '<button class="design-tool-btn" data-tool="area-hardscape" title="Draw hardscape (patio/walk/deck)">Hardscape</button>',
    '<button class="design-tool-btn" data-tool="area-hardscape" title="Draw hardscape (patio/walk/deck)">Hardscape</button>\n'
    '              <button class="design-tool-btn" data-tool="area-flagstone" title="Draw a flagstone/stone path">Flagstone</button>',
    "add Flagstone toolbar button",
)

# Layers panel toggle, right next to Hardscape's.
apply(
    '<label class="design-layer-toggle"><input type="checkbox" data-layer="hardscape" checked /> Hardscape</label>',
    '<label class="design-layer-toggle"><input type="checkbox" data-layer="hardscape" checked /> Hardscape</label>\n'
    '              <label class="design-layer-toggle"><input type="checkbox" data-layer="flagstone" checked /> Flagstone</label>',
    "add Flagstone layer toggle",
)

path.write_text(content)
print("DONE: phone-app/index.html patched successfully.")
