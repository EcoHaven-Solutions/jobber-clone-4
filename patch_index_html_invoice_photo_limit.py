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


# Lets the file picker select several photos in one go (paired with the
# app.js patch that uploads all of them, up to 10 per invoice), and adds a
# small hint so it's clear there's a cap.
apply(
    """      <div class="drawer-section-label">Photos</div>
      <input type="file" id="invoice-photo-input" accept="image/*" />
      <div id="invoice-photo-gallery" class="photo-gallery"></div>""",
    """      <div class="drawer-section-label">Photos</div>
      <input type="file" id="invoice-photo-input" accept="image/*" multiple />
      <p class="empty-sub">Up to 10 photos per invoice.</p>
      <div id="invoice-photo-gallery" class="photo-gallery"></div>""",
    "invoice photo input multiple + hint text",
)

path.write_text(content)
print("DONE: phone-app/index.html patched successfully.")
