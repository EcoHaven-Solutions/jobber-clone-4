import pathlib

path = pathlib.Path("phone-app/app.js")
content = path.read_text()


def apply(old, new, label):
    global content
    count = content.count(old)
    if count != 1:
        raise SystemExit(f"ABORT: expected exactly 1 match for '{label}', found {count}. No changes written.")
    content = content.replace(old, new)
    print(f"OK: patched '{label}'")


# URGENT FIX: my earlier invoice-photos patch put the
# invoicePhotoInput.addEventListener(...) call WAY earlier in the file
# than the "const invoicePhotoInput = document.getElementById(...)" line
# that defines it -- the listener line ran immediately as the script
# loaded (it's not inside a function), before its own const existed yet.
# That's a genuine bug (not a browser quirk) and it's exactly what threw
# "Cannot access uninitialized variable" and broke the whole app: once
# that line throws, none of the rest of app.js below it ever runs, which
# is also why the app then loaded with no data at all. This removes the
# misplaced block and puts it back right after the const it actually
# depends on, where it belongs.
apply(
    "  reader.readAsDataURL(file);\n"
    "});\n"
    "\n"
    "invoicePhotoInput.addEventListener('change', () => {\n"
    "  const file = invoicePhotoInput.files[0];\n"
    "  if (!file || !editingInvoiceId) return;\n"
    "  const reader = new FileReader();\n"
    "  reader.onload = async () => {\n"
    "    try {\n"
    "      await window.api.invoicePhotos.add(editingInvoiceId, reader.result);\n"
    "      invoicePhotoInput.value = '';\n"
    "      renderInvoicePhotoGallery(editingInvoiceId);\n"
    "    } catch (err) {\n"
    "      alert(err.message);\n"
    "      invoicePhotoInput.value = '';\n"
    "    }\n"
    "  };\n"
    "  reader.readAsDataURL(file);\n"
    "});\n"
    "\n"
    "jobNextOccurrenceBtn.addEventListener('click', async () => {",
    "  reader.readAsDataURL(file);\n"
    "});\n"
    "\n"
    "jobNextOccurrenceBtn.addEventListener('click', async () => {",
    "remove misplaced invoicePhotoInput listener",
)

apply(
    "const invoicePhotoInput = document.getElementById('invoice-photo-input');\n"
    "const invoicePhotoGallery = document.getElementById('invoice-photo-gallery');\n"
    "\n"
    "function populateInvoiceCustomerSelect() {",
    "const invoicePhotoInput = document.getElementById('invoice-photo-input');\n"
    "const invoicePhotoGallery = document.getElementById('invoice-photo-gallery');\n"
    "\n"
    "invoicePhotoInput.addEventListener('change', () => {\n"
    "  const file = invoicePhotoInput.files[0];\n"
    "  if (!file || !editingInvoiceId) return;\n"
    "  const reader = new FileReader();\n"
    "  reader.onload = async () => {\n"
    "    try {\n"
    "      await window.api.invoicePhotos.add(editingInvoiceId, reader.result);\n"
    "      invoicePhotoInput.value = '';\n"
    "      renderInvoicePhotoGallery(editingInvoiceId);\n"
    "    } catch (err) {\n"
    "      alert(err.message);\n"
    "      invoicePhotoInput.value = '';\n"
    "    }\n"
    "  };\n"
    "  reader.readAsDataURL(file);\n"
    "});\n"
    "\n"
    "function populateInvoiceCustomerSelect() {",
    "re-add invoicePhotoInput listener in the right place",
)

path.write_text(content)
print("DONE: phone-app/app.js fixed successfully. This was the actual bug crashing the app.")
