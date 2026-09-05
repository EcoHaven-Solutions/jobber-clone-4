import pathlib

path = pathlib.Path("quote-page/index.html")
content = path.read_text()

def apply(old, new, label):
    global content
    count = content.count(old)
    if count != 1:
        raise SystemExit(f"ABORT: expected exactly 1 match for '{label}', found {count}. No changes written.")
    content = content.replace(old, new)
    print(f"OK: patched '{label}'")

# 1. Catalog mini-form: phone required, add address field
apply(
    """        <p id="catalog-intro">Enter your name and email and we'll send over our free Drought-Tolerant Landscaping Catalog right away.</p>
        <label>Name *</label>
        <input type="text" id="c-name" />
        <label>Phone</label>
        <input type="tel" id="c-phone" />
        <label>Email *</label>
        <input type="email" id="c-email" />""",
    """        <p id="catalog-intro">Enter your info and we'll send over our free Drought-Tolerant Landscaping Catalog right away.</p>
        <label>Name *</label>
        <input type="text" id="c-name" />
        <label>Phone *</label>
        <input type="tel" id="c-phone" />
        <label>Address *</label>
        <input type="text" id="c-address" placeholder="Street address, city" />
        <label>Email *</label>
        <input type="email" id="c-email" />""",
    "catalog form fields",
)

# 2. Main quote form: phone required, add address field
apply(
    """        <label>Name *</label>
        <input type="text" id="f-name" required />

        <label>Phone</label>
        <input type="tel" id="f-phone" />

        <label>Email</label>
        <input type="email" id="f-email" />

        <label>Your job not on this list? Let us know what work you need done.</label>""",
    """        <label>Name *</label>
        <input type="text" id="f-name" required />

        <label>Phone *</label>
        <input type="tel" id="f-phone" required />

        <label>Address *</label>
        <input type="text" id="f-address" required placeholder="Street address, city" />

        <label>Email</label>
        <input type="email" id="f-email" />

        <label>Your job not on this list? Let us know what work you need done.</label>""",
    "main form fields",
)

# 3. Catalog submit JS: require phone + address, send them along
apply(
    """      var cName = document.getElementById('c-name').value.trim();
      var cEmail = document.getElementById('c-email').value.trim();
      msg.textContent = '';
      if (!cName) { msg.style.color = '#E08A6B'; msg.textContent = 'Name is required.'; return; }
      if (!cEmail) { msg.style.color = '#E08A6B'; msg.textContent = 'Email is required.'; return; }

      btn.disabled = true;
      btn.textContent = 'Sending…';

      try {
        var res = await fetch(SUPABASE_FN_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            catalogRequest: true,
            name: cName,
            phone: document.getElementById('c-phone').value,
            email: cEmail,
            website: document.getElementById('c-website').value,
          }),
        });""",
    """      var cName = document.getElementById('c-name').value.trim();
      var cPhone = document.getElementById('c-phone').value.trim();
      var cAddress = document.getElementById('c-address').value.trim();
      var cEmail = document.getElementById('c-email').value.trim();
      msg.textContent = '';
      if (!cName) { msg.style.color = '#E08A6B'; msg.textContent = 'Name is required.'; return; }
      if (!cPhone) { msg.style.color = '#E08A6B'; msg.textContent = 'Phone number is required.'; return; }
      if (!cAddress) { msg.style.color = '#E08A6B'; msg.textContent = 'Address is required.'; return; }
      if (!cEmail) { msg.style.color = '#E08A6B'; msg.textContent = 'Email is required.'; return; }

      btn.disabled = true;
      btn.textContent = 'Sending…';

      try {
        var res = await fetch(SUPABASE_FN_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            catalogRequest: true,
            name: cName,
            phone: cPhone,
            address: cAddress,
            email: cEmail,
            website: document.getElementById('c-website').value,
          }),
        });""",
    "catalog form JS",
)

# 4. Main form submit JS: send address, and don't tell people to "check
#    email" if they left it blank (email is optional now)
apply(
    """          body: JSON.stringify({
            name: document.getElementById('f-name').value,
            phone: document.getElementById('f-phone').value,
            email: document.getElementById('f-email').value,
            message: document.getElementById('f-message').value,
            website: document.getElementById('f-website').value,""",
    """          body: JSON.stringify({
            name: document.getElementById('f-name').value,
            phone: document.getElementById('f-phone').value,
            address: document.getElementById('f-address').value,
            email: document.getElementById('f-email').value,
            message: document.getElementById('f-message').value,
            website: document.getElementById('f-website').value,""",
    "main form JS payload",
)

apply(
    """        if (data.ok) {
          var confirmMsg = selectedList.length
            ? "Thanks! Check your email for your preliminary estimate — we'll follow up soon."
            : "Thanks! We'll be in touch soon.";""",
    """        if (data.ok) {
          var gaveEmail = !!document.getElementById('f-email').value.trim();
          var confirmMsg = (selectedList.length && gaveEmail)
            ? "Thanks! Check your email for your preliminary estimate — we'll follow up soon."
            : "Thanks! We'll be in touch soon.";""",
    "main form confirmation message",
)

path.write_text(content)
print("DONE: quote-page/index.html patched successfully.")
