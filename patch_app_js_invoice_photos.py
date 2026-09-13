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


# 1) DOM refs for the new invoice photo input/gallery.
apply(
    "const invoiceLineItemRowsEl = document.getElementById('invoice-line-item-rows');\n"
    "const invoiceTotalDisplay = document.getElementById('invoice-total-display');",
    "const invoiceLineItemRowsEl = document.getElementById('invoice-line-item-rows');\n"
    "const invoiceTotalDisplay = document.getElementById('invoice-total-display');\n"
    "const invoicePhotoInput = document.getElementById('invoice-photo-input');\n"
    "const invoicePhotoGallery = document.getElementById('invoice-photo-gallery');",
    "invoice photo DOM refs",
)

# 2) Render function, same shape as renderJobPhotoGallery -- no "type" tag
# since invoice photos aren't before/after.
apply(
    "function openInvoiceDrawer(invoice = null, fromJob = null) {\n"
    "  editingInvoiceId = invoice ? invoice.id : null;\n"
    "  invoiceForm.reset();\n"
    "  populateInvoiceCustomerSelect();\n"
    "  populateInvoiceJobSelect();\n"
    "  invoiceLineItemRowsEl.innerHTML = '';",
    "async function renderInvoicePhotoGallery(invoiceId) {\n"
    "  invoicePhotoGallery.innerHTML = '';\n"
    "  if (!invoiceId) return;\n"
    "  const photos = await window.api.invoicePhotos.list(invoiceId);\n"
    "  for (const photo of photos) {\n"
    "    const item = document.createElement('div');\n"
    "    item.className = 'photo-gallery-item';\n"
    "    item.innerHTML = `\n"
    "      <img src=\"${receiptUrl(photo.filename)}\" />\n"
    "      <button type=\"button\" class=\"photo-remove\" aria-label=\"Remove photo\">&times;</button>\n"
    "    `;\n"
    "    item.querySelector('.photo-remove').addEventListener('click', async () => {\n"
    "      await window.api.invoicePhotos.delete(photo.id, invoiceId);\n"
    "      renderInvoicePhotoGallery(invoiceId);\n"
    "    });\n"
    "    invoicePhotoGallery.appendChild(item);\n"
    "  }\n"
    "}\n"
    "\n"
    "function openInvoiceDrawer(invoice = null, fromJob = null) {\n"
    "  editingInvoiceId = invoice ? invoice.id : null;\n"
    "  invoiceForm.reset();\n"
    "  populateInvoiceCustomerSelect();\n"
    "  populateInvoiceJobSelect();\n"
    "  invoiceLineItemRowsEl.innerHTML = '';\n"
    "  invoicePhotoGallery.innerHTML = '';",
    "add renderInvoicePhotoGallery + clear it on open",
)

# 3) Actually load the gallery when editing an existing invoice (mirrors
# the "renderJobPhotoGallery(job.id);" call in openJobDrawer).
apply(
    "    (invoice.items && invoice.items.length ? invoice.items : [{}]).forEach(addInvoiceLineItemRow);",
    "    (invoice.items && invoice.items.length ? invoice.items : [{}]).forEach(addInvoiceLineItemRow);\n"
    "    renderInvoicePhotoGallery(invoice.id);",
    "call renderInvoicePhotoGallery when editing",
)

# 4) File-input change handler, mirrors jobPhotoInput's handler exactly
# (silently no-ops on a brand-new unsaved invoice, same as job photos do
# for a brand-new unsaved job -- save the invoice first, then add photos).
apply(
    "jobPhotoInput.addEventListener('change', () => {\n"
    "  const file = jobPhotoInput.files[0];\n"
    "  if (!file || !editingJobId) return;\n"
    "  const reader = new FileReader();\n"
    "  reader.onload = async () => {\n"
    "    try {\n"
    "      await window.api.jobPhotos.add(editingJobId, jobPhotoTypeSelect.value, reader.result);\n"
    "      jobPhotoInput.value = '';\n"
    "      renderJobPhotoGallery(editingJobId);\n"
    "    } catch (err) {\n"
    "      alert(err.message);\n"
    "      jobPhotoInput.value = '';\n"
    "    }\n"
    "  };\n"
    "  reader.readAsDataURL(file);\n"
    "});",
    "jobPhotoInput.addEventListener('change', () => {\n"
    "  const file = jobPhotoInput.files[0];\n"
    "  if (!file || !editingJobId) return;\n"
    "  const reader = new FileReader();\n"
    "  reader.onload = async () => {\n"
    "    try {\n"
    "      await window.api.jobPhotos.add(editingJobId, jobPhotoTypeSelect.value, reader.result);\n"
    "      jobPhotoInput.value = '';\n"
    "      renderJobPhotoGallery(editingJobId);\n"
    "    } catch (err) {\n"
    "      alert(err.message);\n"
    "      jobPhotoInput.value = '';\n"
    "    }\n"
    "  };\n"
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
    "});",
    "invoicePhotoInput change handler",
)

path.write_text(content)
print("DONE: phone-app/app.js patched successfully.")
