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


# Lets you pick several photos at once (the file input below gets the
# "multiple" attribute in the matching index.html patch) and enforces a
# 10-photos-per-invoice cap: uploads however many fit under that cap, and
# tells you if some were skipped because the invoice was already full.
apply(
    """invoicePhotoInput.addEventListener('change', () => {
  const file = invoicePhotoInput.files[0];
  if (!file || !editingInvoiceId) return;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      await window.api.invoicePhotos.add(editingInvoiceId, reader.result);
      invoicePhotoInput.value = '';
      renderInvoicePhotoGallery(editingInvoiceId);
    } catch (err) {
      alert(err.message);
      invoicePhotoInput.value = '';
    }
  };
  reader.readAsDataURL(file);
});""",
    """const INVOICE_PHOTO_LIMIT = 10;

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

invoicePhotoInput.addEventListener('change', async () => {
  const files = Array.from(invoicePhotoInput.files || []);
  if (!files.length || !editingInvoiceId) return;

  const existing = await window.api.invoicePhotos.list(editingInvoiceId);
  const remaining = INVOICE_PHOTO_LIMIT - existing.length;
  if (remaining <= 0) {
    alert(`This invoice already has the max of ${INVOICE_PHOTO_LIMIT} photos. Remove one before adding another.`);
    invoicePhotoInput.value = '';
    return;
  }

  const toUpload = files.slice(0, remaining);
  if (files.length > toUpload.length) {
    alert(`Only ${remaining} more photo${remaining === 1 ? '' : 's'} can be added (${INVOICE_PHOTO_LIMIT} max per invoice) -- the rest weren't uploaded.`);
  }

  try {
    for (const file of toUpload) {
      const dataUrl = await readFileAsDataURL(file);
      await window.api.invoicePhotos.add(editingInvoiceId, dataUrl);
    }
  } catch (err) {
    alert(err.message);
  }
  invoicePhotoInput.value = '';
  renderInvoicePhotoGallery(editingInvoiceId);
});""",
    "invoice photo multi-select + 10-photo cap",
)

path.write_text(content)
print("DONE: phone-app/app.js patched successfully.")
