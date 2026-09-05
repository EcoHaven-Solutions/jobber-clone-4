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


# Main quote form: email is now required, same as phone/address already are.
# It's what actually delivers the instant estimate + Accept link, so this
# matches the existing pattern of just adding the "required" attribute --
# the browser's own validation blocks submission until it's filled in,
# exactly like it already does for Phone and Address.
apply(
    """        <label>Email</label>
        <input type="email" id="f-email" />""",
    """        <label>Email *</label>
        <input type="email" id="f-email" required />""",
    "main form email required",
)

path.write_text(content)
print("DONE: quote-page/index.html patched successfully.")
