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


# jsPDF (client-side, no backend needed) so "Download PDF" makes a real
# file the browser downloads directly -- no print dialog involved. Pinned
# version, loaded the same way the other CDN libraries (Konva, Leaflet,
# etc.) already are.
apply(
    '<script src="https://cdn.jsdelivr.net/npm/konva@9/konva.min.js"></script>',
    '<script src="https://cdn.jsdelivr.net/npm/konva@9/konva.min.js"></script>\n'
    '  <script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"></script>',
    "add jsPDF library",
)

# Two new real-download buttons, plus shorten the old button's label now
# that "export" isn't the print button's only job.
apply(
    '<button class="btn btn-ghost" id="btn-design-print">Print / Export</button>',
    '<button class="btn btn-ghost" id="btn-design-download-png">Download PNG</button>\n'
    '          <button class="btn btn-ghost" id="btn-design-download-pdf">Download PDF</button>\n'
    '          <button class="btn btn-ghost" id="btn-design-print">Print</button>',
    "add Download PNG/PDF buttons",
)

path.write_text(content)
print("DONE: phone-app/index.html patched successfully.")
