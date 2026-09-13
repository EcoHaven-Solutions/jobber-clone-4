import pathlib

path = pathlib.Path("phone-app/design.js")
content = path.read_text()


def apply(old, new, label):
    global content
    count = content.count(old)
    if count != 1:
        raise SystemExit(f"ABORT: expected exactly 1 match for '{label}', found {count}. No changes written.")
    content = content.replace(old, new)
    print(f"OK: patched '{label}'")


# The flagstone texture canvas is a fixed 140x140 raw-pixel image -- fine
# for a big lawn, but a narrow path (a few feet wide) is often *smaller*
# than one tile, so you'd only ever see a tiny, blown-up crop of a single
# stone instead of several right-sized stones in a row. The texture was
# drawn assuming it represents roughly a 4ft-square patch of path; this
# tells Konva to scale the pattern so that assumption holds true at
# *this* design's actual real-world scale (pxPerFt), instead of always
# drawing it at its raw pixel size regardless of scale.
apply(
    "  } else if (el.subtype === 'flagstone') {\n"
    "    lineOpts.fillPatternImage = getFlagstonePatternCanvas();\n"
    "    lineOpts.fillPatternRepeat = 'repeat';\n"
    "  } else {",
    "  } else if (el.subtype === 'flagstone') {\n"
    "    lineOpts.fillPatternImage = getFlagstonePatternCanvas();\n"
    "    lineOpts.fillPatternRepeat = 'repeat';\n"
    "    // The texture's 140px tile is drawn to represent ~4ft of path;\n"
    "    // scale it so that holds at this design's actual ft-to-px ratio.\n"
    "    const flagstoneScale = pxPerFt / 35;\n"
    "    lineOpts.fillPatternScaleX = flagstoneScale;\n"
    "    lineOpts.fillPatternScaleY = flagstoneScale;\n"
    "  } else {",
    "scale flagstone pattern to the design's real-world ft/px ratio",
)

path.write_text(content)
print("DONE: phone-app/design.js patched successfully.")
