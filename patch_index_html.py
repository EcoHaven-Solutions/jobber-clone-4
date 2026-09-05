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


# Add an Address field to the Lead drawer (leads coming from the website now
# always have one), and a read-only spot to show a linked Estimate, if any.
apply(
    """      <label>How'd they find you?
        <input type="text" name="source" placeholder="e.g. Google, referral from Jane, Facebook ad" />
      </label>
      <label>Status
        <select name="status">
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="converted">Converted</option>
          <option value="lost">Lost</option>
        </select>
      </label>
      <label>Notes
        <textarea name="notes" rows="3"></textarea>
      </label>

      <div class="drawer-actions">""",
    """      <label>Address
        <input type="text" name="address" placeholder="Street address, city" />
      </label>
      <label>How'd they find you?
        <input type="text" name="source" placeholder="e.g. Google, referral from Jane, Facebook ad" />
      </label>
      <label>Status
        <select name="status">
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="converted">Converted</option>
          <option value="lost">Lost</option>
        </select>
      </label>
      <label>Notes
        <textarea name="notes" rows="3"></textarea>
      </label>
      <div id="lead-quote-info" style="font-size:13px;color:#A9AC9E;margin-top:-8px;" hidden></div>

      <div class="drawer-actions">""",
    "lead drawer address field + linked-estimate readout",
)

path.write_text(content)
print("DONE: phone-app/index.html patched successfully.")
