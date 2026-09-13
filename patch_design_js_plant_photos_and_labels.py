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


# 1) Plant photos KEEP their grid (you still want pictures) -- the actual bug
# is that html2canvas (used by Download PNG/PDF) can't read pixels from a
# cross-origin image unless that server sends CORS headers, and the outside
# sites plant photos come from (iNaturalist, Wikimedia Commons,
# gardenology.org) don't. Route those photos through a small Supabase Edge
# Function (image-proxy -- see the separate .js file and deploy instructions)
# that fetches them server-side and re-serves them with CORS allowed. If the
# function isn't deployed yet, or a fetch fails, it falls back to the same
# colored-box-with-category placeholder as before -- never a broken image.
apply(
    "  if (plantCounts.size) {\n"
    "    html += `<div class=\"design-print-section\"><h3>Plants</h3><div class=\"design-print-plant-grid\">`;\n"
    "    for (const [key, count] of plantCounts) {\n"
    "      const p = CAT.PLANT_CATALOG.find((x) => x.key === key);\n"
    "      if (!p) continue;\n"
    "      html += `\n"
    "        <div class=\"design-print-plant-card\">\n"
    "          ${p.photoUrl\n"
    "            ? `<img class=\"design-print-plant-photo\" src=\"${p.photoUrl}\" alt=\"${escapeHtml(p.name)}\" onerror=\"this.style.display='none'; this.nextElementSibling.style.display='flex';\" />`\n"
    "            : ''}\n"
    "          <div class=\"design-print-plant-fallback\" style=\"${p.photoUrl ? '' : 'display:flex;'} background:${p.color}\">${escapeHtml(p.category)}</div>\n"
    "          <div class=\"design-print-plant-name\">${escapeHtml(p.name)} &times;${count}</div>\n"
    "          <div class=\"design-print-plant-sub\">${p.heightFt}ft tall &times; ${p.spreadFt}ft spread</div>\n"
    "        </div>`;\n"
    "    }\n"
    "    html += `</div></div>`;\n"
    "  }",
    "  if (plantCounts.size) {\n"
    "    html += `<div class=\"design-print-section\"><h3>Plants</h3><div class=\"design-print-plant-grid\">`;\n"
    "    for (const [key, count] of plantCounts) {\n"
    "      const p = CAT.PLANT_CATALOG.find((x) => x.key === key);\n"
    "      if (!p) continue;\n"
    "      html += `\n"
    "        <div class=\"design-print-plant-card\">\n"
    "          ${p.photoUrl\n"
    "            ? `<img class=\"design-print-plant-photo\" crossorigin=\"anonymous\" src=\"${proxiedPlantPhotoUrl(p.photoUrl)}\" alt=\"${escapeHtml(p.name)}\" onerror=\"this.style.display='none'; this.nextElementSibling.style.display='flex';\" />`\n"
    "            : ''}\n"
    "          <div class=\"design-print-plant-fallback\" style=\"${p.photoUrl ? '' : 'display:flex;'} background:${p.color}\">${escapeHtml(p.category)}</div>\n"
    "          <div class=\"design-print-plant-name\">${escapeHtml(p.name)} &times;${count}</div>\n"
    "          <div class=\"design-print-plant-sub\">${p.heightFt}ft tall &times; ${p.spreadFt}ft spread</div>\n"
    "        </div>`;\n"
    "    }\n"
    "    html += `</div></div>`;\n"
    "  }",
    "route plant photos through the image-proxy edge function for the print sheet",
)

apply(
    "function buildPrintSheet() {",
    "// Plant photos are hotlinked from a few outside sites, none of which send\n"
    "// CORS headers -- fine for normal <img> display, but html2canvas\n"
    "// (Download PNG/PDF) can't read cross-origin pixels into a canvas without\n"
    "// them. This routes those photos through a Supabase Edge Function that\n"
    "// fetches them server-side (no CORS restriction there) and re-serves them\n"
    "// with CORS allowed. See image-proxy.js for the function itself.\n"
    "function proxiedPlantPhotoUrl(url) {\n"
    "  if (!url) return url;\n"
    "  return `${SUPABASE_URL}/functions/v1/image-proxy?url=${encodeURIComponent(url)}`;\n"
    "}\n"
    "\n"
    "function buildPrintSheet() {",
    "add proxiedPlantPhotoUrl helper",
)

# 2) "Site areas" used to lump every hardscape polygon into one aggregate
# row. Group by subtype + label instead, so a hardscape area you've labeled
# (e.g. "Firepit") gets its own row, while unlabeled areas of the same
# subtype still add up together -- in both the live Legend panel and the
# Print/PDF/PNG sheet.
apply(
    "  const areaTotals = {};\n"
    "  elements.filter((e) => e.type === 'area' && e.subtype !== 'boundary').forEach((e) => {\n"
    "    areaTotals[e.subtype] = (areaTotals[e.subtype] || 0) + polygonAreaSqFt(e.points);\n"
    "  });\n"
    "\n"
    "  const linkBits = [];",
    "  const areaGroups = new Map();\n"
    "  elements.filter((e) => e.type === 'area' && e.subtype !== 'boundary').forEach((e) => {\n"
    "    const label = (e.label || '').trim();\n"
    "    const key = `${e.subtype}||${label}`;\n"
    "    const existing = areaGroups.get(key) || { subtype: e.subtype, label, sqft: 0 };\n"
    "    existing.sqft += polygonAreaSqFt(e.points);\n"
    "    areaGroups.set(key, existing);\n"
    "  });\n"
    "\n"
    "  const linkBits = [];",
    "group Site areas by subtype+label in buildPrintSheet",
)

apply(
    "  html += `<div class=\"design-print-section\"><h3>Site areas</h3>`;\n"
    "  if (Object.keys(areaTotals).length === 0) {\n"
    "    html += `<div class=\"design-print-row\"><span>No areas drawn</span><span></span></div>`;\n"
    "  }\n"
    "  for (const key of Object.keys(areaTotals)) {\n"
    "    const preset = CAT.AREA_PRESETS.find((p) => p.key === key);\n"
    "    html += `<div class=\"design-print-row\"><span>${preset ? escapeHtml(preset.name) : key}</span><span>${areaTotals[key].toFixed(0)} sq ft</span></div>`;\n"
    "  }\n"
    "  html += `</div>`;",
    "  html += `<div class=\"design-print-section\"><h3>Site areas</h3>`;\n"
    "  if (areaGroups.size === 0) {\n"
    "    html += `<div class=\"design-print-row\"><span>No areas drawn</span><span></span></div>`;\n"
    "  }\n"
    "  for (const { subtype, label, sqft } of areaGroups.values()) {\n"
    "    const preset = CAT.AREA_PRESETS.find((p) => p.key === subtype);\n"
    "    const name = preset ? preset.name : subtype;\n"
    "    html += `<div class=\"design-print-row\"><span>${label ? `${escapeHtml(name)} \\u2014 ${escapeHtml(label)}` : escapeHtml(name)}</span><span>${sqft.toFixed(0)} sq ft</span></div>`;\n"
    "  }\n"
    "  html += `</div>`;",
    "render grouped Site areas rows in buildPrintSheet",
)

apply(
    "  const areaTotals = {};\n"
    "  elements.filter((e) => e.type === 'area' && e.subtype !== 'boundary').forEach((e) => {\n"
    "    areaTotals[e.subtype] = (areaTotals[e.subtype] || 0) + polygonAreaSqFt(e.points);\n"
    "  });\n"
    "\n"
    "  let html = '';\n"
    "\n"
    "  html += `<div class=\"design-legend-group\"><h4>Site areas</h4>`;\n"
    "  if (Object.keys(areaTotals).length === 0) html += `<div class=\"design-legend-row\"><span>No areas drawn yet</span><span></span></div>`;\n"
    "  for (const key of Object.keys(areaTotals)) {\n"
    "    const preset = CAT.AREA_PRESETS.find((p) => p.key === key);\n"
    "    html += `<div class=\"design-legend-row\"><span>${preset ? preset.name : key}</span><span>${areaTotals[key].toFixed(0)} sq ft</span></div>`;\n"
    "  }\n"
    "  html += `</div>`;",
    "  const areaGroups = new Map();\n"
    "  elements.filter((e) => e.type === 'area' && e.subtype !== 'boundary').forEach((e) => {\n"
    "    const label = (e.label || '').trim();\n"
    "    const key = `${e.subtype}||${label}`;\n"
    "    const existing = areaGroups.get(key) || { subtype: e.subtype, label, sqft: 0 };\n"
    "    existing.sqft += polygonAreaSqFt(e.points);\n"
    "    areaGroups.set(key, existing);\n"
    "  });\n"
    "\n"
    "  let html = '';\n"
    "\n"
    "  html += `<div class=\"design-legend-group\"><h4>Site areas</h4>`;\n"
    "  if (areaGroups.size === 0) html += `<div class=\"design-legend-row\"><span>No areas drawn yet</span><span></span></div>`;\n"
    "  for (const { subtype, label, sqft } of areaGroups.values()) {\n"
    "    const preset = CAT.AREA_PRESETS.find((p) => p.key === subtype);\n"
    "    const name = preset ? preset.name : subtype;\n"
    "    html += `<div class=\"design-legend-row\"><span>${label ? `${escapeHtml(name)} \\u2014 ${escapeHtml(label)}` : escapeHtml(name)}</span><span>${sqft.toFixed(0)} sq ft</span></div>`;\n"
    "  }\n"
    "  html += `</div>`;",
    "group Site areas by subtype+label in the live Legend panel",
)

# 3) Area labels (already a field you could type into) now actually show up
# on the plan itself, centered on the shape -- so clicking a hardscape shape
# and typing "Firepit" is visible immediately, not just saved invisibly.
apply(
    "function buildAreaNode(el) {\n"
    "  const preset = CAT.AREA_PRESETS.find((p) => p.key === el.subtype) || CAT.AREA_PRESETS[1];\n"
    "  const lineOpts = {\n"
    "    points: el.points,\n"
    "    closed: true,\n"
    "    stroke: preset.stroke,\n"
    "    strokeWidth: preset.strokeWidth || 2,\n"
    "    dash: preset.dash || null,\n"
    "    draggable: activeTool === 'select',\n"
    "  };\n"
    "  if (el.subtype === 'lawn') {\n"
    "    lineOpts.fillPatternImage = getGrassPatternCanvas();\n"
    "    lineOpts.fillPatternRepeat = 'repeat';\n"
    "  } else if (el.subtype === 'flagstone') {\n"
    "    lineOpts.fillPatternImage = getFlagstonePatternCanvas();\n"
    "    lineOpts.fillPatternRepeat = 'repeat';\n"
    "    // The texture's 140px tile is drawn to represent ~4ft of path;\n"
    "    // scale it so that holds at this design's actual ft-to-px ratio.\n"
    "    const flagstoneScale = pxPerFt / 35;\n"
    "    lineOpts.fillPatternScaleX = flagstoneScale;\n"
    "    lineOpts.fillPatternScaleY = flagstoneScale;\n"
    "  } else {\n"
    "    lineOpts.fill = preset.fill;\n"
    "  }\n"
    "  const line = new Konva.Line(lineOpts);\n"
    "  line.on('dragend', () => onShapeDragEnd(el, line));\n"
    "  attachSelectHandler(line, el);\n"
    "  return line;\n"
    "}",
    "function buildAreaLabelText(el) {\n"
    "  if (!el.label) return null;\n"
    "  const text = new Konva.Text({\n"
    "    text: el.label, fontSize: 13, fontStyle: 'bold',\n"
    "    fill: '#1A1A1A', stroke: '#FFFFFF', strokeWidth: 4, fillAfterStrokeEnabled: true,\n"
    "    listening: false,\n"
    "  });\n"
    "  const c = polygonCentroid(el.points);\n"
    "  text.position({ x: c.x - text.width() / 2, y: c.y - text.height() / 2 });\n"
    "  return text;\n"
    "}\n"
    "\n"
    "function buildAreaNode(el) {\n"
    "  const preset = CAT.AREA_PRESETS.find((p) => p.key === el.subtype) || CAT.AREA_PRESETS[1];\n"
    "  const lineOpts = {\n"
    "    points: el.points,\n"
    "    closed: true,\n"
    "    stroke: preset.stroke,\n"
    "    strokeWidth: preset.strokeWidth || 2,\n"
    "    dash: preset.dash || null,\n"
    "    draggable: activeTool === 'select',\n"
    "  };\n"
    "  if (el.subtype === 'lawn') {\n"
    "    lineOpts.fillPatternImage = getGrassPatternCanvas();\n"
    "    lineOpts.fillPatternRepeat = 'repeat';\n"
    "  } else if (el.subtype === 'flagstone') {\n"
    "    lineOpts.fillPatternImage = getFlagstonePatternCanvas();\n"
    "    lineOpts.fillPatternRepeat = 'repeat';\n"
    "    // The texture's 140px tile is drawn to represent ~4ft of path;\n"
    "    // scale it so that holds at this design's actual ft-to-px ratio.\n"
    "    const flagstoneScale = pxPerFt / 35;\n"
    "    lineOpts.fillPatternScaleX = flagstoneScale;\n"
    "    lineOpts.fillPatternScaleY = flagstoneScale;\n"
    "  } else {\n"
    "    lineOpts.fill = preset.fill;\n"
    "  }\n"
    "  const line = new Konva.Line(lineOpts);\n"
    "  const group = new Konva.Group({ draggable: false });\n"
    "  let text = buildAreaLabelText(el);\n"
    "  line.on('dragend', () => {\n"
    "    onShapeDragEnd(el, line);\n"
    "    if (text) {\n"
    "      const c = polygonCentroid(el.points);\n"
    "      text.position({ x: c.x - text.width() / 2, y: c.y - text.height() / 2 });\n"
    "    }\n"
    "  });\n"
    "  attachSelectHandler(line, el);\n"
    "  group.add(line);\n"
    "  if (text) group.add(text);\n"
    "  return group;\n"
    "}",
    "render area labels on the canvas",
)

# 4) The label field only saved data before (markDirty), it never redrew the
# shape -- so typing "Firepit" and tabbing away looked like nothing happened.
apply(
    "      <div class=\"design-properties-field\"><label>Label (optional)</label><input id=\"pf-label\" type=\"text\" value=\"${escapeHtml(el.label || '')}\" /></div>\n"
    "      <div class=\"design-properties-field\"><label>Area</label><div>${polygonAreaSqFt(el.points).toFixed(0)} sq ft</div></div>\n"
    "    `;\n"
    "    document.getElementById('pf-subtype').addEventListener('change', (e) => { el.subtype = e.target.value; rerenderThis(); });\n"
    "    document.getElementById('pf-label').addEventListener('change', (e) => { el.label = e.target.value; markDirty(); });",
    "      <div class=\"design-properties-field\"><label>Label (optional)</label><input id=\"pf-label\" type=\"text\" placeholder=\"e.g. Firepit, Front walkway\" value=\"${escapeHtml(el.label || '')}\" /></div>\n"
    "      <div class=\"design-properties-field\"><label>Area</label><div>${polygonAreaSqFt(el.points).toFixed(0)} sq ft</div></div>\n"
    "    `;\n"
    "    document.getElementById('pf-subtype').addEventListener('change', (e) => { el.subtype = e.target.value; rerenderThis(); });\n"
    "    document.getElementById('pf-label').addEventListener('change', (e) => { el.label = e.target.value; rerenderThis(); refreshLegendIfVisible(); });",
    "make the area label field redraw immediately and refresh the legend",
)

path.write_text(content)
print("DONE: phone-app/design.js patched successfully.")
