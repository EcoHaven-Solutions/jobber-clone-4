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


# Adds a "Photos" section to the invoice drawer, right after Notes -- same
# idea/markup as the job drawer's existing Photos section, minus the
# Before/After type dropdown (that distinction doesn't apply to an
# invoice). Reuses the same .photo-gallery/.photo-gallery-item CSS already
# used by job photos, so no stylesheet changes needed.
apply(
    """      <label>Notes
        <textarea name="notes" rows="3"></textarea>
      </label>

      <div id="invoice-payment-link-wrap" hidden>""",
    """      <label>Notes
        <textarea name="notes" rows="3"></textarea>
      </label>

      <div class="drawer-section-label">Photos</div>
      <input type="file" id="invoice-photo-input" accept="image/*" />
      <div id="invoice-photo-gallery" class="photo-gallery"></div>

      <div id="invoice-payment-link-wrap" hidden>""",
    "add invoice photos section",
)

path.write_text(content)
print("DONE: phone-app/index.html patched successfully.")
