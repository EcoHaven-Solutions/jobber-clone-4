import pathlib

path = pathlib.Path("phone-app/style.css")
content = path.read_text()


def apply(old, new, label):
    global content
    count = content.count(old)
    if count != 1:
        raise SystemExit(f"ABORT: expected exactly 1 match for '{label}', found {count}. No changes written.")
    content = content.replace(old, new)
    print(f"OK: patched '{label}'")


# Temporary "render mode" for #design-print-sheet: Download PNG/PDF need the
# exact same look @media print gives it, but rendered off-screen (not via an
# actual print dialog) so html2canvas can screenshot it. Two-class selector
# already outranks the base ".design-print-sheet { display:none }" rule.
apply(
    ".design-print-plant-sub {\n"
    "  color: #666;\n"
    "}",
    ".design-print-plant-sub {\n"
    "  color: #666;\n"
    "}\n"
    "\n"
    ".design-print-sheet.design-print-render-mode {\n"
    "  display: block;\n"
    "  position: fixed;\n"
    "  top: 0;\n"
    "  left: -99999px;\n"
    "  width: 720px;\n"
    "  padding: 0.5in;\n"
    "  background: #fff;\n"
    "  color: #1a1a1a;\n"
    "  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;\n"
    "  z-index: -1;\n"
    "}",
    "add design-print-render-mode class",
)

path.write_text(content)
print("DONE: phone-app/style.css patched successfully.")
