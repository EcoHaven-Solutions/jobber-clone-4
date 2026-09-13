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


# New element type: 'photo' -- a reference photo (materials, samples, product
# shots) the user pins onto the plan. Unlike 'image' (the satellite backdrop,
# always forced to the back layer as one big underlay), a 'photo' is a normal
# movable/resizable/captioned element like a label or fixture.

apply(
    "let scaleClickPoints = [];      // for the \"Set scale\" tool",
    "let scaleClickPoints = [];      // for the \"Set scale\" tool\n"
    "let pendingPhotoPos = null;     // world-space click point waiting on the photo file picker",
    "add pendingPhotoPos state",
)

apply(
    "  layerVisibility = Object.assign(\n"
    "    { image: true, boundary: true, lawn: true, bed: true, hardscape: true, flagstone: true, water: true, plant: true, zone: true, head: true, pipe: true, fixture: true, label: true },\n"
    "    data.layerVisibility || {}\n"
    "  );",
    "  layerVisibility = Object.assign(\n"
    "    { image: true, boundary: true, lawn: true, bed: true, hardscape: true, flagstone: true, water: true, plant: true, zone: true, head: true, pipe: true, fixture: true, label: true, photo: true },\n"
    "    data.layerVisibility || {}\n"
    "  );",
    "default photo layer to visible",
)

apply(
    "    label: 'Click the plan to place a text label.',\n"
    "  };",
    "    label: 'Click the plan to place a text label.',\n"
    "    photo: 'Click the plan to pin a reference photo (opens your photo picker).',\n"
    "  };",
    "add photo draw hint",
)

apply(
    "  if (activeTool === 'label') { placeLabel(pos); return; }\n"
    "  if (activeTool === 'select' && e.target === stage) deselect();",
    "  if (activeTool === 'label') { placeLabel(pos); return; }\n"
    "  if (activeTool === 'photo') { placePhotoAt(pos); return; }\n"
    "  if (activeTool === 'select' && e.target === stage) deselect();",
    "wire photo tool into onStageClick",
)

apply(
    "  else if (el.type === 'label') node = buildLabelNode(el);\n"
    "  else if (el.type === 'image') node = buildImageNode(el);",
    "  else if (el.type === 'label') node = buildLabelNode(el);\n"
    "  else if (el.type === 'image') node = buildImageNode(el);\n"
    "  else if (el.type === 'photo') node = buildPhotoNode(el);",
    "wire photo type into renderElement",
)

apply(
    "  if (typeof el.x === 'number' && el.type !== 'image') positionSelectionRing(el);",
    "  if (typeof el.x === 'number' && el.type !== 'image' && el.type !== 'photo') positionSelectionRing(el);",
    "exclude photo from the circular selection ring (rectangular, like the backdrop image)",
)

apply(
    "function deleteElement(id) {\n"
    "  const idx = elements.findIndex((e) => e.id === id);\n"
    "  if (idx === -1) return;\n"
    "  elements.splice(idx, 1);\n"
    "  const node = nodesById.get(id);",
    "function deleteElement(id) {\n"
    "  const idx = elements.findIndex((e) => e.id === id);\n"
    "  if (idx === -1) return;\n"
    "  const [removedEl] = elements.splice(idx, 1);\n"
    "  if (removedEl.type === 'photo' && removedEl.src) deleteFromStorage(removedEl.src).catch(() => {});\n"
    "  const node = nodesById.get(id);",
    "clean up uploaded photo from storage on delete",
)

apply(
    "  } else if (el.type === 'image') {\n"
    "    box.innerHTML = `\n"
    "      <div class=\"design-properties-field\"><label>Source</label><div>${escapeHtml(el.address || 'Satellite image')}</div></div>\n"
    "      <div class=\"design-properties-field\"><label>Coverage</label><div>${el.coverageFt || Math.round(el.width / pxPerFt)} ft wide</div></div>\n"
    "      <div class=\"design-properties-field\"><label>Opacity</label><input id=\"pf-opacity\" type=\"range\" min=\"0.2\" max=\"1\" step=\"0.05\" value=\"${el.opacity != null ? el.opacity : 0.85}\" /></div>\n"
    "      <p class=\"empty-sub\">Drag to nudge it into position. Delete and re-add from the Satellite backdrop button to change the address or coverage.</p>\n"
    "    `;\n"
    "    document.getElementById('pf-opacity').addEventListener('input', (e) => {\n"
    "      el.opacity = Number(e.target.value);\n"
    "      const node = nodesById.get(el.id);\n"
    "      if (node) { node.opacity(el.opacity); mainLayer.batchDraw(); }\n"
    "      markDirty();\n"
    "    });\n"
    "  }\n"
    "}",
    "  } else if (el.type === 'image') {\n"
    "    box.innerHTML = `\n"
    "      <div class=\"design-properties-field\"><label>Source</label><div>${escapeHtml(el.address || 'Satellite image')}</div></div>\n"
    "      <div class=\"design-properties-field\"><label>Coverage</label><div>${el.coverageFt || Math.round(el.width / pxPerFt)} ft wide</div></div>\n"
    "      <div class=\"design-properties-field\"><label>Opacity</label><input id=\"pf-opacity\" type=\"range\" min=\"0.2\" max=\"1\" step=\"0.05\" value=\"${el.opacity != null ? el.opacity : 0.85}\" /></div>\n"
    "      <p class=\"empty-sub\">Drag to nudge it into position. Delete and re-add from the Satellite backdrop button to change the address or coverage.</p>\n"
    "    `;\n"
    "    document.getElementById('pf-opacity').addEventListener('input', (e) => {\n"
    "      el.opacity = Number(e.target.value);\n"
    "      const node = nodesById.get(el.id);\n"
    "      if (node) { node.opacity(el.opacity); mainLayer.batchDraw(); }\n"
    "      markDirty();\n"
    "    });\n"
    "  } else if (el.type === 'photo') {\n"
    "    box.innerHTML = `\n"
    "      <div class=\"design-properties-field\"><label>Caption</label><input id=\"pf-photo-caption\" type=\"text\" value=\"${escapeHtml(el.caption || '')}\" placeholder=\"e.g. Belgard paver -- tan\" /></div>\n"
    "      <div class=\"design-properties-field\"><label>Size</label><input id=\"pf-photo-size\" type=\"range\" min=\"60\" max=\"500\" step=\"10\" value=\"${el.width}\" /></div>\n"
    "      <p class=\"empty-sub\">Drag to reposition. Deleting this also removes the uploaded photo.</p>\n"
    "    `;\n"
    "    document.getElementById('pf-photo-caption').addEventListener('change', (e) => { el.caption = e.target.value; rerenderThis(); });\n"
    "    document.getElementById('pf-photo-size').addEventListener('input', (e) => {\n"
    "      const newWidth = Number(e.target.value);\n"
    "      const aspect = el.width ? el.height / el.width : 1;\n"
    "      el.width = newWidth;\n"
    "      el.height = Math.round(newWidth * aspect);\n"
    "      rerenderThis();\n"
    "    });\n"
    "  }\n"
    "}",
    "add photo branch to the properties panel",
)

apply(
    "function hexToRgba(hex, alpha) {",
    "function buildPhotoNode(el) {\n"
    "  const group = new Konva.Group({ x: el.x, y: el.y, draggable: activeTool === 'select' });\n"
    "  const cached = imageObjCache.get(el.id);\n"
    "  if (cached) {\n"
    "    group.add(new Konva.Image({ image: cached, width: el.width, height: el.height }));\n"
    "    group.add(new Konva.Rect({ width: el.width, height: el.height, stroke: '#FFD84A', strokeWidth: 2 }));\n"
    "  } else {\n"
    "    group.add(new Konva.Rect({ width: el.width, height: el.height, fill: '#2A2A28', stroke: '#FFD84A', strokeWidth: 2 }));\n"
    "    group.add(new Konva.Text({ text: 'Loading photo\\u2026', x: 8, y: 8, fontSize: 11, fill: '#C4C4BC', width: el.width - 16 }));\n"
    "    const img = new Image();\n"
    "    img.crossOrigin = 'anonymous';\n"
    "    img.onload = () => {\n"
    "      imageObjCache.set(el.id, img);\n"
    "      const node = nodesById.get(el.id);\n"
    "      if (node) {\n"
    "        node.destroyChildren();\n"
    "        node.add(new Konva.Image({ image: img, width: el.width, height: el.height }));\n"
    "        node.add(new Konva.Rect({ width: el.width, height: el.height, stroke: '#FFD84A', strokeWidth: 2 }));\n"
    "        if (el.caption) node.add(new Konva.Text({ text: el.caption, x: 0, y: el.height + 6, fontSize: 12, fill: '#F5F5F0', width: el.width, align: 'center' }));\n"
    "        mainLayer.batchDraw();\n"
    "      }\n"
    "    };\n"
    "    img.onerror = () => {\n"
    "      const node = nodesById.get(el.id);\n"
    "      if (node) { const t = node.findOne('Text'); if (t) t.text('Photo failed to load'); mainLayer.batchDraw(); }\n"
    "    };\n"
    "    img.src = el.src;\n"
    "  }\n"
    "  if (cached && el.caption) {\n"
    "    group.add(new Konva.Text({ text: el.caption, x: 0, y: el.height + 6, fontSize: 12, fill: '#F5F5F0', width: el.width, align: 'center' }));\n"
    "  }\n"
    "  group.on('dragend', () => { el.x = group.x(); el.y = group.y(); markDirty(); });\n"
    "  attachSelectHandler(group, el);\n"
    "  return group;\n"
    "}\n"
    "\n"
    "function hexToRgba(hex, alpha) {",
    "add buildPhotoNode",
)

apply(
    "function placeLabel(pos) {\n"
    "  const text = prompt('Label text:', '');\n"
    "  if (!text) return;\n"
    "  addElement({ id: uid(), type: 'label', x: pos.x, y: pos.y, text });\n"
    "}",
    "function placeLabel(pos) {\n"
    "  const text = prompt('Label text:', '');\n"
    "  if (!text) return;\n"
    "  addElement({ id: uid(), type: 'label', x: pos.x, y: pos.y, text });\n"
    "}\n"
    "\n"
    "function loadImageDimensions(src) {\n"
    "  return new Promise((resolve) => {\n"
    "    const img = new Image();\n"
    "    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });\n"
    "    img.onerror = () => resolve(null);\n"
    "    img.src = src;\n"
    "  });\n"
    "}\n"
    "\n"
    "function placePhotoAt(pos) {\n"
    "  if (!currentDesign) return;\n"
    "  pendingPhotoPos = pos;\n"
    "  designPhotoInput.value = '';\n"
    "  designPhotoInput.click();\n"
    "}\n"
    "\n"
    "const designPhotoInput = document.getElementById('design-photo-input');\n"
    "designPhotoInput.addEventListener('change', async () => {\n"
    "  const file = designPhotoInput.files && designPhotoInput.files[0];\n"
    "  const pos = pendingPhotoPos || { x: 0, y: 0 };\n"
    "  pendingPhotoPos = null;\n"
    "  if (!file || !currentDesign) { designPhotoInput.value = ''; return; }\n"
    "  try {\n"
    "    const dataUrl = await readFileAsDataURL(file);\n"
    "    const url = await uploadToStorage(dataUrl, `designs/${currentDesign.id}`);\n"
    "    const dims = await loadImageDimensions(url);\n"
    "    const defaultWidth = 160;\n"
    "    const defaultHeight = dims ? Math.round(defaultWidth * (dims.height / dims.width)) : defaultWidth;\n"
    "    addElement({\n"
    "      id: uid(), type: 'photo', src: url, caption: '',\n"
    "      x: pos.x - defaultWidth / 2, y: pos.y - defaultHeight / 2,\n"
    "      width: defaultWidth, height: defaultHeight,\n"
    "    });\n"
    "  } catch (err) {\n"
    "    alert(err.message);\n"
    "  }\n"
    "  designPhotoInput.value = '';\n"
    "});",
    "add photo placement + upload handler",
)

path.write_text(content)
print("DONE: phone-app/design.js patched successfully.")
