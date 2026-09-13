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


# New "Photo" tool: click the plan, pick a photo (materials, samples, product
# shots, etc.), and it's dropped in as a movable, resizable, captioned pin --
# separate from the satellite backdrop image, which stays a fixed background.
apply(
    '<button class="design-tool-btn" data-tool="label" title="Add a text label">Label</button>',
    '<button class="design-tool-btn" data-tool="label" title="Add a text label">Label</button>\n'
    '              <button class="design-tool-btn" data-tool="photo" title="Pin a reference photo (materials, samples, etc.)">Photo</button>',
    "add Photo tool button",
)

# Hidden file input the Photo tool opens after you click a spot on the plan.
apply(
    '<div id="design-stage" class="design-stage"></div>',
    '<div id="design-stage" class="design-stage"></div>\n'
    '            <input type="file" id="design-photo-input" accept="image/*" style="display:none" />',
    "add hidden design-photo-input file picker",
)

# Layer toggle so photo pins can be hidden before printing/exporting a clean plan.
apply(
    '<label class="design-layer-toggle"><input type="checkbox" data-layer="label" checked /> Text labels</label>',
    '<label class="design-layer-toggle"><input type="checkbox" data-layer="label" checked /> Text labels</label>\n'
    '              <label class="design-layer-toggle"><input type="checkbox" data-layer="photo" checked /> Reference photos</label>',
    "add Reference photos layer toggle",
)

path.write_text(content)
print("DONE: phone-app/index.html patched successfully.")
