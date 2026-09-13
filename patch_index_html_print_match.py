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


# html2canvas rasterizes the *actual* print sheet (#design-print-sheet) so
# Download PNG/PDF show the same title/plan/photos/tables as Print, instead
# of the bare plan-plus-text-list the first version of this feature had.
apply(
    '<script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"></script>',
    '<script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"></script>\n'
    '  <script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>',
    "add html2canvas library",
)

path.write_text(content)
print("DONE: phone-app/index.html patched successfully.")
