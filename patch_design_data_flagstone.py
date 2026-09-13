import pathlib

path = pathlib.Path("phone-app/design-data.js")
content = path.read_text()


def apply(old, new, label):
    global content
    count = content.count(old)
    if count != 1:
        raise SystemExit(f"ABORT: expected exactly 1 match for '{label}', found {count}. No changes written.")
    content = content.replace(old, new)
    print(f"OK: patched '{label}'")


# New area preset, separate from plain Hardscape -- gets an actual
# flagstone-look texture (see design.js) instead of a flat fill.
apply(
    "  { key: 'hardscape', name: 'Hardscape (patio/walk/deck)', fill: 'rgba(150,150,150,0.35)', stroke: '#6B6B6B' },",
    "  { key: 'hardscape', name: 'Hardscape (patio/walk/deck)', fill: 'rgba(150,150,150,0.35)', stroke: '#6B6B6B' },\n"
    "  { key: 'flagstone', name: 'Flagstone / Stone Path', fill: 'rgba(160,148,120,0.4)', stroke: '#7A6F5C' },",
    "add flagstone area preset",
)

path.write_text(content)
print("DONE: phone-app/design-data.js patched successfully.")
