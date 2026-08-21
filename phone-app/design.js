// ============================================================================
// Site Design tab — property/planting layout + basic sprinkler placement.
//
// Loads after app.js, so it shares the same global scope and reuses things
// app.js already set up: window.api, escapeHtml(), and the `customers` /
// `jobs` arrays that app.js keeps in sync. Nothing here is a module; it's
// plain script-tag JS like the rest of this app.
//
// Data model saved into design_projects.canvas_data (jsonb):
//   {
//     elements: [ {id, type, ...type-specific fields, points/x/y in "world"
//                  px -- an arbitrary drawing coordinate space, NOT tied to
//                  screen pixels so pan/zoom never touches stored data}, ... ],
//     layerVisibility: { boundary, lawn, bed, hardscape, water, plant, zone,
//                         head, pipe, fixture, label }
//   }
// Real-world size (plant spread, head radius) is stored in feet on the
// element and converted to on-screen px using the design's scale_px_per_ft
// at render time -- so recalibrating scale correctly resizes everything.
// ============================================================================

const CAT = window.DESIGN_CATALOG;

let designs = [];
let currentDesign = null;       // the design_projects row currently open in the editor
let elements = [];              // working copy of currentDesign.canvas_data.elements
let layerVisibility = {};       // working copy of currentDesign.canvas_data.layerVisibility
let pxPerFt = 10;
let designDirty = false;

let stage = null;
let gridLayer = null;
let mainLayer = null;
let nodesById = new Map();      // element id -> Konva node (Group or Line)
let imageObjCache = new Map();  // element id -> loaded HTMLImageElement (in-memory only, not persisted)
let selectionRing = null;       // reusable highlight for point-type elements
let selectedElementId = null;

let activeTool = 'select';
let armedPlantKey = null;
let armedHeadKey = null;
let armedFixtureKey = null;
let drawingPoints = [];         // world-space [x,y,x,y,...] for the shape in progress
let tempDrawLine = null;
let tempDrawDots = [];
let scaleClickPoints = [];      // for the "Set scale" tool

let autosaveTimer = null;

function isEditableViewport() {
  return window.innerWidth >= 900;
}

function uid() {
  return `el_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function markDirty() {
  designDirty = true;
  const statusEl = document.getElementById('design-save-status');
  if (statusEl) statusEl.textContent = 'Unsaved changes';
}

// ===================== Project list =====================

async function loadDesigns() {
  designs = await window.api.designs.list();
  renderDesignList();
}

function renderDesignList() {
  const query = (document.getElementById('design-search-input').value || '').trim().toLowerCase();
  const rowsEl = document.getElementById('design-rows');
  const countEl = document.getElementById('design-count');
  const emptyEl = document.getElementById('design-empty-state');

  const filtered = query
    ? designs.filter((d) => {
        const customerName = d.customers ? d.customers.name : '';
        return [d.name, customerName].some((f) => (f || '').toLowerCase().includes(query));
      })
    : designs;

  countEl.textContent = `${designs.length} design${designs.length === 1 ? '' : 's'}`;
  rowsEl.innerHTML = '';

  if (filtered.length === 0) {
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;

  for (const d of filtered) {
    const linkedBits = [];
    if (d.customers && d.customers.name) linkedBits.push(escapeHtml(d.customers.name));
    if (d.jobs && d.jobs.title) linkedBits.push(escapeHtml(d.jobs.title));
    const linked = linkedBits.length ? linkedBits.join(' / ') : '<span style="color:var(--ink-soft);">Not linked</span>';
    const updated = d.updated_at ? new Date(d.updated_at).toLocaleDateString() : '—';

    const tr = document.createElement('tr');
    tr.style.cursor = 'pointer';
    tr.innerHTML = `
      <td class="cell-id">D-${String(d.id).padStart(4, '0')}</td>
      <td class="cell-name">${escapeHtml(d.name)}</td>
      <td>${linked}</td>
      <td>${updated}</td>
      <td onclick="event.stopPropagation()">
        <button class="btn btn-ghost btn-small btn-open-design" data-id="${d.id}">Open</button>
        <button class="btn btn-danger btn-small btn-delete-design" data-id="${d.id}">Delete</button>
      </td>
    `;
    tr.addEventListener('click', () => openDesignById(d.id));
    rowsEl.appendChild(tr);
  }

  rowsEl.querySelectorAll('.btn-open-design').forEach((btn) => {
    btn.addEventListener('click', () => openDesignById(Number(btn.dataset.id)));
  });
  rowsEl.querySelectorAll('.btn-delete-design').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this design? This cannot be undone.')) return;
      await window.api.designs.delete(Number(btn.dataset.id));
      await loadDesigns();
    });
  });
}

document.getElementById('design-search-input').addEventListener('input', renderDesignList);

document.getElementById('btn-new-design').addEventListener('click', async () => {
  const name = prompt('Name this design (e.g. the property address):', 'Untitled design');
  if (name === null) return;
  const created = await window.api.designs.create({ name: name || 'Untitled design' });
  await loadDesigns();
  openDesign(created);
});

// Jump here from the Customers/Jobs nav tab click so the list is fresh.
document.querySelector('.nav-item[data-view="design"]').addEventListener('click', () => {
  loadDesigns();
});

// ===================== Open a design linked to a customer/job =====================
// Called from the "Site design" buttons in the customer/job drawers.

async function openOrCreateDesignForCustomer(customerId, customerName) {
  const existing = await window.api.designs.listByCustomer(customerId);
  if (existing.length > 0) {
    openDesignById(existing[0].id);
    return;
  }
  const created = await window.api.designs.create({
    name: `${customerName} — Site Design`,
    customer_id: customerId,
  });
  await loadDesigns();
  openDesign(created);
}

async function openOrCreateDesignForJob(jobId, jobTitle, customerId) {
  const existing = await window.api.designs.listByJob(jobId);
  if (existing.length > 0) {
    openDesignById(existing[0].id);
    return;
  }
  const created = await window.api.designs.create({
    name: `${jobTitle} — Site Design`,
    job_id: jobId,
    customer_id: customerId || null,
  });
  await loadDesigns();
  openDesign(created);
}

// ===================== Editor lifecycle =====================

async function openDesignById(id) {
  const design = await window.api.designs.get(id);
  openDesign(design);
}

function openDesign(design) {
  currentDesign = design;
  const data = design.canvas_data && typeof design.canvas_data === 'object' ? design.canvas_data : {};
  elements = Array.isArray(data.elements) ? data.elements : [];
  layerVisibility = Object.assign(
    { image: true, boundary: true, lawn: true, bed: true, hardscape: true, water: true, plant: true, zone: true, head: true, pipe: true, fixture: true, label: true },
    data.layerVisibility || {}
  );
  pxPerFt = Number(design.scale_px_per_ft) || 10;
  designDirty = false;
  imageObjCache.clear();
  selectedElementId = null;
  activeTool = 'select';
  armedPlantKey = null;
  armedHeadKey = null;
  armedFixtureKey = null;
  drawingPoints = [];

  document.getElementById('design-name-input').value = design.name || 'Untitled design';
  updateLinkLabel();
  document.getElementById('design-save-status').textContent = '';
  document.getElementById('design-scale-label').textContent = `1 ft ≈ ${pxPerFt.toFixed(1)} px`;
  syncLayerCheckboxes();
  setActiveTool('select');
  showPropertiesTab(false);

  document.querySelectorAll('.nav-item').forEach((b) => b.classList.remove('is-active'));
  document.querySelector('.nav-item[data-view="design"]').classList.add('is-active');
  document.querySelectorAll('.view').forEach((v) => { v.hidden = v.id !== 'view-design-editor'; });

  ensureStage();
  resizeStage();
  renderAllElements();
  fitViewToContent();
  renderLegend();

  clearInterval(autosaveTimer);
  autosaveTimer = setInterval(() => {
    // Deliberately NOT gated on the editor still being the visible view --
    // navigating to another tab used to skip this check entirely, so anything
    // drawn right before switching tabs (a lawn, a hardscape area, etc.) sat
    // dirty and unsaved until the user came back and might never get saved
    // if they didn't reopen the exact same design. This timer is a 60s
    // safety net; the real fix is saving immediately on nav-away below.
    if (designDirty && currentDesign) saveDesign(true);
  }, 60000);
}

// Save immediately when the user clicks away to any other tab while the
// editor has unsaved changes -- otherwise anything drawn since the last save
// (or the last 60s autosave tick) is silently lost, which looked like drawn
// areas/plants "disappearing" when navigating away and back.
document.querySelectorAll('.nav-item[data-view]').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (currentDesign && designDirty) saveDesign(true);
  });
});

function updateLinkLabel() {
  const bits = [];
  if (currentDesign.customers && currentDesign.customers.name) bits.push(currentDesign.customers.name);
  if (currentDesign.jobs && currentDesign.jobs.title) bits.push(currentDesign.jobs.title);
  document.getElementById('design-link-label').textContent = bits.length ? `Linked: ${bits.join(' / ')}` : 'Not linked to a customer/job';
}

function closeEditor() {
  clearInterval(autosaveTimer);
  document.querySelectorAll('.view').forEach((v) => { v.hidden = v.id !== 'view-design'; });
  document.querySelectorAll('.nav-item').forEach((b) => b.classList.remove('is-active'));
  document.querySelector('.nav-item[data-view="design"]').classList.add('is-active');
  loadDesigns();
}

document.getElementById('btn-design-back').addEventListener('click', async () => {
  if (designDirty) await saveDesign(true);
  closeEditor();
});

document.getElementById('design-name-input').addEventListener('change', (e) => {
  if (!currentDesign) return;
  currentDesign.name = e.target.value || 'Untitled design';
  markDirty();
});

async function saveDesign(silent) {
  if (!currentDesign) return;
  const statusEl = document.getElementById('design-save-status');
  try {
    if (!silent) statusEl.textContent = 'Saving…';
    const canvas_data = { elements, layerVisibility };
    const updated = await window.api.designs.update(currentDesign.id, {
      name: currentDesign.name,
      customer_id: currentDesign.customer_id || null,
      job_id: currentDesign.job_id || null,
      canvas_data,
      scale_px_per_ft: pxPerFt,
    });
    currentDesign = Object.assign(currentDesign, updated);
    designDirty = false;
    statusEl.textContent = `Saved ${new Date().toLocaleTimeString()}`;
  } catch (err) {
    statusEl.textContent = `Save failed — ${err.message}`;
  }
}

document.getElementById('btn-design-save').addEventListener('click', () => saveDesign(false));

window.addEventListener('beforeunload', (e) => {
  if (designDirty && currentDesign && !document.getElementById('view-design-editor').hidden) {
    e.preventDefault();
    e.returnValue = '';
  }
});

// ===================== Link customer/job drawer =====================

function populateDesignLinkSelects() {
  const custSel = document.getElementById('design-link-customer-select');
  custSel.innerHTML = '<option value="">Not linked to a customer</option>';
  (typeof customers !== 'undefined' ? customers : []).forEach((c) => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.name;
    if (currentDesign.customer_id === c.id) opt.selected = true;
    custSel.appendChild(opt);
  });

  const jobSel = document.getElementById('design-link-job-select');
  jobSel.innerHTML = '<option value="">Not linked to a job</option>';
  (typeof jobs !== 'undefined' ? jobs : []).forEach((j) => {
    const opt = document.createElement('option');
    opt.value = j.id;
    opt.textContent = j.title;
    if (currentDesign.job_id === j.id) opt.selected = true;
    jobSel.appendChild(opt);
  });
}

document.getElementById('btn-design-link').addEventListener('click', () => {
  if (!currentDesign) return;
  populateDesignLinkSelects();
  document.getElementById('design-link-overlay').hidden = false;
  document.getElementById('design-link-drawer').hidden = false;
});

function closeDesignLinkDrawer() {
  document.getElementById('design-link-overlay').hidden = true;
  document.getElementById('design-link-drawer').hidden = true;
}
document.getElementById('btn-close-design-link-drawer').addEventListener('click', closeDesignLinkDrawer);
document.getElementById('design-link-overlay').addEventListener('click', closeDesignLinkDrawer);

// If a job is picked, auto-select its customer too.
document.getElementById('design-link-job-select').addEventListener('change', (e) => {
  const jobId = Number(e.target.value) || null;
  if (!jobId) return;
  const job = (typeof jobs !== 'undefined' ? jobs : []).find((j) => j.id === jobId);
  if (job && job.customer_id) {
    document.getElementById('design-link-customer-select').value = job.customer_id;
  }
});

document.getElementById('btn-apply-design-link').addEventListener('click', async () => {
  if (!currentDesign) return;
  const customerId = Number(document.getElementById('design-link-customer-select').value) || null;
  const jobId = Number(document.getElementById('design-link-job-select').value) || null;
  currentDesign.customer_id = customerId;
  currentDesign.job_id = jobId;
  await saveDesign(true);
  currentDesign = await window.api.designs.get(currentDesign.id);
  updateLinkLabel();
  closeDesignLinkDrawer();
});

// ===================== Satellite backdrop =====================
// Pulls a satellite image centered on a geocoded address and uses its known
// real-world coverage to set the design's scale exactly -- no manual
// "click two points and guess the distance" needed for this path.

const FT_PER_DEG_LAT = 364000; // standard approximation, fine at this precision

function closeSatelliteDrawer() {
  document.getElementById('design-satellite-overlay').hidden = true;
  document.getElementById('design-satellite-drawer').hidden = true;
}

document.getElementById('btn-design-satellite').addEventListener('click', () => {
  if (!currentDesign || !isEditableViewport()) return;
  const addrInput = document.getElementById('design-satellite-address');
  document.getElementById('design-satellite-status').textContent = '';
  if (!addrInput.value && currentDesign.customer_id && typeof customers !== 'undefined') {
    const c = customers.find((x) => x.id === currentDesign.customer_id);
    if (c) addrInput.value = [c.address, c.city, c.state, c.zip].filter(Boolean).join(', ');
  }
  document.getElementById('design-satellite-overlay').hidden = false;
  document.getElementById('design-satellite-drawer').hidden = false;
});
document.getElementById('btn-close-design-satellite-drawer').addEventListener('click', closeSatelliteDrawer);
document.getElementById('design-satellite-overlay').addEventListener('click', closeSatelliteDrawer);

document.getElementById('btn-design-satellite-fetch').addEventListener('click', async () => {
  if (!currentDesign) return;
  const statusEl = document.getElementById('design-satellite-status');
  const address = document.getElementById('design-satellite-address').value.trim();
  const coverageFt = Math.max(30, Math.min(1000, Number(document.getElementById('design-satellite-coverage').value) || 200));

  if (!address) { statusEl.textContent = 'Enter an address first.'; return; }
  if (elements.length > 0) {
    const proceed = confirm("This design already has things drawn. Adding a satellite image resets the scale to match it exactly -- existing plant/head sizes will resize (their positions won't move). Continue?");
    if (!proceed) return;
  }

  statusEl.textContent = 'Looking up address…';
  const point = typeof geocodeAddress === 'function' ? await geocodeAddress(address) : null;
  if (!point) {
    statusEl.textContent = 'Could not find that address. Try adding city/state, or check the Mapbox token in Settings.';
    return;
  }

  statusEl.textContent = 'Fetching satellite image…';
  const sizePx = 640;
  const halfFt = coverageFt / 2;
  const deltaLat = halfFt / FT_PER_DEG_LAT;
  const deltaLon = halfFt / (FT_PER_DEG_LAT * Math.cos((point.lat * Math.PI) / 180));
  const bbox = [point.lon - deltaLon, point.lat - deltaLat, point.lon + deltaLon, point.lat + deltaLat];

  const url = (typeof mapboxAccessToken !== 'undefined' && mapboxAccessToken)
    ? `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/[${bbox.join(',')}]/${sizePx}x${sizePx}?access_token=${mapboxAccessToken}`
    : `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${bbox.join(',')}&bboxSR=4326&imageSR=4326&size=${sizePx},${sizePx}&format=jpg&f=image`;

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    pxPerFt = sizePx / coverageFt;
    document.getElementById('design-scale-label').textContent = `1 ft ≈ ${pxPerFt.toFixed(1)} px (from satellite image)`;

    const el = {
      id: uid(), type: 'image', src: url, x: -sizePx / 2, y: -sizePx / 2, width: sizePx, height: sizePx,
      opacity: 0.85, address, coverageFt,
    };
    imageObjCache.set(el.id, img);
    elements.unshift(el);
    drawGrid();
    renderAllElements();
    fitViewToContent();
    markDirty();
    statusEl.textContent = 'Added.';
    setTimeout(closeSatelliteDrawer, 400);
  };
  img.onerror = () => {
    const hasToken = typeof mapboxAccessToken !== 'undefined' && mapboxAccessToken;
    statusEl.textContent = hasToken
      ? 'Could not load the image -- double-check the Mapbox token in Settings.'
      : "Could not load the free satellite image right now. Try again, or add a Mapbox token in Settings for a more reliable source.";
  };
  img.src = url;
});

// ===================== Konva stage setup =====================

function ensureStage() {
  if (stage) return;
  const container = document.getElementById('design-stage');
  stage = new Konva.Stage({ container: 'design-stage', width: container.clientWidth || 800, height: container.clientHeight || 600 });
  gridLayer = new Konva.Layer({ listening: false });
  mainLayer = new Konva.Layer();
  stage.add(gridLayer);
  stage.add(mainLayer);

  selectionRing = new Konva.Circle({ radius: 14, stroke: '#FFD84A', strokeWidth: 2, dash: [4, 3], visible: false, listening: false });
  mainLayer.add(selectionRing);

  drawGrid();

  stage.on('click tap', onStageClick);
  stage.on('wheel', onStageWheel);
  // NOTE: deliberately NOT using Konva's dblclick/dbltap to finish a shape --
  // tried it, but Konva's dblclick synthesis is purely time-based with no
  // distance check, so two ordinary quick clicks in different spots while
  // placing vertices (completely normal) can misfire as "finish" and
  // truncate the shape. Enter-to-finish and auto-finish-on-tool-switch below
  // are both deliberate actions and don't have that failure mode.

  window.addEventListener('resize', () => { resizeStage(); drawGrid(); });
}

function resizeStage() {
  if (!stage) return;
  const container = document.getElementById('design-stage');
  stage.width(container.clientWidth || 800);
  stage.height(container.clientHeight || 600);
}

function drawGrid() {
  if (!gridLayer) return;
  gridLayer.destroyChildren();
  const spacingPx = pxPerFt * 5; // a line every 5 ft
  const extent = 6000; // world-space px covered in each direction
  for (let x = -extent; x <= extent; x += spacingPx) {
    gridLayer.add(new Konva.Line({ points: [x, -extent, x, extent], stroke: '#4A4A46', strokeWidth: 1, listening: false }));
  }
  for (let y = -extent; y <= extent; y += spacingPx) {
    gridLayer.add(new Konva.Line({ points: [-extent, y, extent, y], stroke: '#4A4A46', strokeWidth: 1, listening: false }));
  }
  gridLayer.add(new Konva.Line({ points: [0, -extent, 0, extent], stroke: '#5A5A55', strokeWidth: 1.5, listening: false }));
  gridLayer.add(new Konva.Line({ points: [-extent, 0, extent, 0], stroke: '#5A5A55', strokeWidth: 1.5, listening: false }));
  gridLayer.batchDraw();
}

function zoomStageBy(factor) {
  const oldScale = stage.scaleX();
  const center = { x: stage.width() / 2, y: stage.height() / 2 };
  const worldCenter = { x: (center.x - stage.x()) / oldScale, y: (center.y - stage.y()) / oldScale };
  const newScale = Math.max(0.1, Math.min(6, oldScale * factor));
  stage.scale({ x: newScale, y: newScale });
  stage.position({ x: center.x - worldCenter.x * newScale, y: center.y - worldCenter.y * newScale });
  stage.batchDraw();
  document.getElementById('design-zoom-label').textContent = `${Math.round(newScale * 100)}%`;
}

function onStageWheel(e) {
  e.evt.preventDefault();
  zoomStageBy(e.evt.deltaY < 0 ? 1.08 : 1 / 1.08);
}

document.getElementById('btn-design-zoom-in').addEventListener('click', () => zoomStageBy(1.2));
document.getElementById('btn-design-zoom-out').addEventListener('click', () => zoomStageBy(1 / 1.2));

function fitViewToContent() {
  if (!stage) return;
  const box = computeBoundingBox();
  let scale = 1;
  let cx = 0, cy = 0;
  if (box) {
    const w = Math.max(box.maxX - box.minX, 10);
    const h = Math.max(box.maxY - box.minY, 10);
    scale = Math.min((stage.width() - 80) / w, (stage.height() - 80) / h, 3);
    scale = Math.max(scale, 0.1);
    cx = (box.minX + box.maxX) / 2;
    cy = (box.minY + box.maxY) / 2;
  } else {
    // Nothing drawn yet -- default to showing roughly a 100x100ft area.
    scale = Math.min(stage.width(), stage.height()) / (pxPerFt * 120);
    scale = Math.max(Math.min(scale, 3), 0.1);
  }
  stage.scale({ x: scale, y: scale });
  stage.position({ x: stage.width() / 2 - cx * scale, y: stage.height() / 2 - cy * scale });
  stage.batchDraw();
  document.getElementById('design-zoom-label').textContent = `${Math.round(scale * 100)}%`;
}

function computeBoundingBox() {
  if (elements.length === 0) return null;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const consider = (x, y) => { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); };
  for (const el of elements) {
    if (Array.isArray(el.points)) {
      for (let i = 0; i < el.points.length; i += 2) consider(el.points[i], el.points[i + 1]);
    } else if (el.type === 'image' && typeof el.x === 'number') {
      // x,y is the top-left corner, not a point -- consider the full rect.
      consider(el.x, el.y);
      consider(el.x + el.width, el.y + el.height);
    } else if (typeof el.x === 'number') {
      consider(el.x, el.y);
    }
  }
  if (minX === Infinity) return null;
  return { minX, minY, maxX, maxY };
}

// ===================== Tool selection =====================

function setActiveTool(tool) {
  // Auto-finish an in-progress shape instead of silently discarding it.
  // Switching tools used to just cancel whatever you were drawing -- so
  // drawing a boundary, then clicking "Plant" to start placing pins (without
  // first pressing Enter) threw the boundary away with no warning. Now it
  // finishes the shape if there are enough points for a valid one, exactly
  // like pressing Enter would; Escape still explicitly discards a draw.
  finishCurrentDraw();
  activeTool = tool;
  document.querySelectorAll('.design-tool-btn[data-tool]').forEach((b) => {
    b.classList.toggle('is-active', b.dataset.tool === tool);
  });
  stage && stage.draggable(tool === 'pan');

  const catalogPanels = { plant: 'design-catalog-plant', head: 'design-catalog-head', fixture: 'design-catalog-fixture' };
  document.querySelectorAll('.design-catalog-section').forEach((el) => { el.hidden = true; });
  document.getElementById('design-catalog-empty').hidden = !!catalogPanels[tool];
  if (catalogPanels[tool]) document.getElementById(catalogPanels[tool]).hidden = false;
  if (tool === 'plant' || tool === 'head' || tool === 'fixture') switchSidePanel('catalog');

  const hints = {
    scale: 'Click two points, then enter the real distance between them.',
    'area-boundary': 'Click to add points. Press Enter (or pick another tool) to finish. Esc to cancel.',
    'area-lawn': 'Click to add points. Press Enter (or pick another tool) to finish. Esc to cancel.',
    'area-bed': 'Click to add points. Press Enter (or pick another tool) to finish. Esc to cancel.',
    'area-hardscape': 'Click to add points. Press Enter (or pick another tool) to finish. Esc to cancel.',
    'area-water': 'Click to add points. Press Enter (or pick another tool) to finish. Esc to cancel.',
    zone: 'Click to outline the zone. Press Enter (or pick another tool) to finish. Esc to cancel.',
    'pipe-lateral': 'Click along the pipe run. Press Enter (or pick another tool) to finish. Esc to cancel.',
    'pipe-mainline': 'Click along the pipe run. Press Enter (or pick another tool) to finish. Esc to cancel.',
    plant: armedPlantKey ? 'Click the plan to place this plant.' : 'Pick a plant from the Catalog panel first.',
    head: armedHeadKey ? 'Click the plan to place this head.' : 'Pick a head from the Catalog panel first.',
    fixture: armedFixtureKey ? 'Click the plan to place this fixture.' : 'Pick a fixture from the Catalog panel first.',
    label: 'Click the plan to place a text label.',
  };
  document.getElementById('design-draw-hint').textContent = isEditableViewport() ? (hints[tool] || '') : '';
}

document.querySelectorAll('.design-tool-btn[data-tool]').forEach((btn) => {
  btn.addEventListener('click', () => { if (isEditableViewport()) setActiveTool(btn.dataset.tool); });
});

document.getElementById('btn-design-delete-selected').addEventListener('click', () => {
  if (selectedElementId) deleteElement(selectedElementId);
});

// ===================== Side panel tabs =====================

function switchSidePanel(panel) {
  document.querySelectorAll('.design-side-tab').forEach((t) => t.classList.toggle('is-active', t.dataset.panel === panel));
  document.getElementById('design-panel-catalog').hidden = panel !== 'catalog';
  document.getElementById('design-panel-layers').hidden = panel !== 'layers';
  document.getElementById('design-panel-legend').hidden = panel !== 'legend';
  document.getElementById('design-panel-properties').hidden = panel !== 'properties';
  if (panel === 'legend') renderLegend();
}
document.querySelectorAll('.design-side-tab').forEach((tab) => {
  tab.addEventListener('click', () => switchSidePanel(tab.dataset.panel));
});

function showPropertiesTab(show) {
  const tab = document.getElementById('design-properties-tab');
  tab.hidden = !show;
  if (!show && !document.getElementById('design-panel-properties').hidden) switchSidePanel('catalog');
}

// ===================== Catalog panels =====================

function initCatalogPanels() {
  const catFilter = document.getElementById('design-plant-category-filter');
  CAT.PLANT_CATEGORIES.forEach((c) => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    catFilter.appendChild(opt);
  });
  renderPlantList();
  renderHeadList();
  renderFixtureList();

  document.getElementById('design-plant-search').addEventListener('input', renderPlantList);
  catFilter.addEventListener('change', renderPlantList);
}

function renderPlantList() {
  const q = (document.getElementById('design-plant-search').value || '').toLowerCase();
  const cat = document.getElementById('design-plant-category-filter').value;
  const list = document.getElementById('design-plant-list');
  list.innerHTML = '';
  CAT.PLANT_CATALOG
    .filter((p) => (!cat || p.category === cat) && p.name.toLowerCase().includes(q))
    .forEach((p) => {
      const row = document.createElement('div');
      row.className = 'design-catalog-item' + (armedPlantKey === p.key ? ' is-armed' : '');
      row.innerHTML = `${p.photoUrl
          ? `<img class="design-catalog-photo" src="${p.photoUrl}" alt="" onerror="this.outerHTML='<span class=&quot;design-catalog-swatch&quot; style=&quot;background:${p.color}&quot;></span>';" />`
          : `<span class="design-catalog-swatch" style="background:${p.color}"></span>`}
        <span><strong>${escapeHtml(p.name)}</strong><span class="design-catalog-item-sub">${p.category} · ${p.sun} sun · ${p.water} water · ${p.spreadFt}ft spread</span></span>`;
      row.addEventListener('click', () => { armedPlantKey = p.key; renderPlantList(); document.getElementById('design-draw-hint').textContent = 'Click the plan to place this plant.'; });
      list.appendChild(row);
    });
}

function renderHeadList() {
  const list = document.getElementById('design-head-list');
  list.innerHTML = '';
  const groups = { rotor: 'Rotors', spray: 'Sprays', drip: 'Drip', bubbler: 'Bubblers' };
  Object.keys(groups).forEach((kind) => {
    const heads = CAT.HEAD_CATALOG.filter((h) => h.kind === kind);
    if (!heads.length) return;
    const label = document.createElement('div');
    label.className = 'design-tool-group-label';
    label.textContent = groups[kind];
    list.appendChild(label);
    heads.forEach((h) => {
      const row = document.createElement('div');
      row.className = 'design-catalog-item' + (armedHeadKey === h.key ? ' is-armed' : '');
      const spec = h.kind === 'drip' ? `${h.gph} GPH/emitter` : `${h.defaultRadiusFt}ft radius · ${h.gpmFull} GPM`;
      row.innerHTML = `<span class="design-catalog-swatch" style="background:${h.color}"></span>
        <span><strong>${h.brand} ${escapeHtml(h.model)}</strong><span class="design-catalog-item-sub">${spec}</span></span>`;
      row.addEventListener('click', () => { armedHeadKey = h.key; renderHeadList(); document.getElementById('design-draw-hint').textContent = 'Click the plan to place this head.'; });
      list.appendChild(row);
    });
  });
}

function renderFixtureList() {
  const list = document.getElementById('design-fixture-list');
  list.innerHTML = '';
  CAT.FIXTURE_CATALOG.forEach((f) => {
    const row = document.createElement('div');
    row.className = 'design-catalog-item' + (armedFixtureKey === f.key ? ' is-armed' : '');
    row.innerHTML = `<span class="design-catalog-swatch" style="background:${f.color}"></span><span>${escapeHtml(f.name)}</span>`;
    row.addEventListener('click', () => { armedFixtureKey = f.key; renderFixtureList(); document.getElementById('design-draw-hint').textContent = 'Click the plan to place this fixture.'; });
    list.appendChild(row);
  });
}

// ===================== Layers panel =====================

function syncLayerCheckboxes() {
  document.querySelectorAll('#design-panel-layers input[data-layer]').forEach((cb) => {
    cb.checked = layerVisibility[cb.dataset.layer] !== false;
  });
}

function elementMatchesLayer(el, layerKey) {
  if (el.type === 'area') return el.subtype === layerKey;
  return el.type === layerKey;
}

document.querySelectorAll('#design-panel-layers input[data-layer]').forEach((cb) => {
  cb.addEventListener('change', () => {
    const key = cb.dataset.layer;
    layerVisibility[key] = cb.checked;
    markDirty();
    elements.forEach((el) => {
      if (!elementMatchesLayer(el, key)) return;
      const node = nodesById.get(el.id);
      if (node) node.visible(cb.checked);
    });
    mainLayer.batchDraw();
  });
});

// ===================== Element rendering =====================

function renderAllElements() {
  if (!mainLayer) return;
  nodesById.forEach((node) => node.destroy());
  nodesById.clear();
  // Images always render first so they stay behind every hand-drawn element,
  // regardless of where they happen to sit in the saved elements array.
  for (const el of elements) if (el.type === 'image') renderElement(el);
  for (const el of elements) if (el.type !== 'image') renderElement(el);
  mainLayer.add(selectionRing);
  mainLayer.batchDraw();
}

function renderElement(el) {
  let node;
  if (el.type === 'area') node = buildAreaNode(el);
  else if (el.type === 'zone') node = buildZoneNode(el);
  else if (el.type === 'pipe') node = buildPipeNode(el);
  else if (el.type === 'plant') node = buildPlantNode(el);
  else if (el.type === 'head') node = buildHeadNode(el);
  else if (el.type === 'fixture') node = buildFixtureNode(el);
  else if (el.type === 'label') node = buildLabelNode(el);
  else if (el.type === 'image') node = buildImageNode(el);
  if (!node) return;
  node.visible(elementMatchesLayer(el, layerLookupKey(el)) ? layerVisibility[layerLookupKey(el)] !== false : true);
  mainLayer.add(node);
  nodesById.set(el.id, node);
}

function layerLookupKey(el) {
  return el.type === 'area' ? el.subtype : el.type;
}

function attachSelectHandler(node, el) {
  node.on('click tap', (e) => {
    if (activeTool !== 'select') return;
    e.cancelBubble = true;
    selectElement(el.id);
  });
}

function polygonCentroid(points) {
  let x = 0, y = 0, n = points.length / 2;
  for (let i = 0; i < points.length; i += 2) { x += points[i]; y += points[i + 1]; }
  return { x: x / n, y: y / n };
}

// A small procedurally-drawn tileable texture (short blade strokes over a
// green wash) so a Lawn area reads as grass instead of a flat color fill --
// built once on an offscreen canvas and reused as a Konva pattern.
let grassPatternCanvas = null;
function getGrassPatternCanvas() {
  if (grassPatternCanvas) return grassPatternCanvas;
  const size = 24;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  ctx.fillStyle = 'rgba(122,180,90,0.35)';
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = 'rgba(92,140,62,0.6)';
  ctx.lineWidth = 1;
  const blades = [
    [3, 20, 2, 12], [7, 22, 6, 10], [11, 21, 13, 9], [15, 23, 14, 11],
    [19, 20, 21, 10], [2, 8, 4, 2], [9, 6, 8, 0], [16, 7, 18, 1], [22, 9, 20, 3],
  ];
  blades.forEach(([x1, y1, x2, y2]) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  });
  grassPatternCanvas = c;
  return c;
}

function buildAreaNode(el) {
  const preset = CAT.AREA_PRESETS.find((p) => p.key === el.subtype) || CAT.AREA_PRESETS[1];
  const lineOpts = {
    points: el.points,
    closed: true,
    stroke: preset.stroke,
    strokeWidth: preset.strokeWidth || 2,
    dash: preset.dash || null,
    draggable: activeTool === 'select',
  };
  if (el.subtype === 'lawn') {
    lineOpts.fillPatternImage = getGrassPatternCanvas();
    lineOpts.fillPatternRepeat = 'repeat';
  } else {
    lineOpts.fill = preset.fill;
  }
  const line = new Konva.Line(lineOpts);
  line.on('dragend', () => onShapeDragEnd(el, line));
  attachSelectHandler(line, el);
  return line;
}

function buildZoneNode(el) {
  const group = new Konva.Group({ draggable: false });
  const line = new Konva.Line({ points: el.points, closed: true, fill: 'rgba(79,159,214,0.12)', stroke: '#4F9FD6', strokeWidth: 2, dash: [6, 4], draggable: activeTool === 'select' });
  const c = polygonCentroid(el.points);
  const text = new Konva.Text({ x: c.x - 10, y: c.y - 8, text: `Z${el.zoneNumber}`, fontSize: 14, fontStyle: 'bold', fill: '#4F9FD6' });
  line.on('dragend', () => { onShapeDragEnd(el, line); const c2 = polygonCentroid(el.points); text.position({ x: c2.x - 10, y: c2.y - 8 }); mainLayer.batchDraw(); });
  attachSelectHandler(line, el);
  group.add(line);
  group.add(text);
  return group;
}

function buildPipeNode(el) {
  const isMain = el.subtype === 'mainline';
  const line = new Konva.Line({
    points: el.points,
    stroke: isMain ? '#2E6FA6' : '#4F9FD6',
    strokeWidth: isMain ? 4 : 2,
    dash: isMain ? null : [6, 3],
    draggable: activeTool === 'select',
  });
  line.on('dragend', () => onShapeDragEnd(el, line));
  attachSelectHandler(line, el);
  return line;
}

// True display radius from the plant's actual mature spread -- no artificial
// floor, so a 1.5ft perennial visibly reads smaller than an 8ft shrub at any
// given scale. Only a tiny floor (2px) to keep it from vanishing entirely.
function plantDisplayRadiusPx(plant) {
  return Math.max((plant.spreadFt / 2) * pxPerFt, 2);
}

// Minimum radius text can legibly sit inside; below this we skip the label
// (and just show a small solid dot) instead of letting 2 letters of text
// dwarf the actual circle, which made every small plant look the same size.
const PLANT_LABEL_MIN_RADIUS = 12;

function buildPlantNode(el) {
  const plant = CAT.PLANT_CATALOG.find((p) => p.key === el.plantKey) || { color: '#8FA65C', spreadFt: 3, name: '?' };
  const radius = plantDisplayRadiusPx(plant);
  const group = new Konva.Group({ x: el.x, y: el.y, draggable: activeTool === 'select' });
  // Invisible larger hit target so small plants stay easy to click/select
  // even though their true drawn circle is tiny.
  const hitRadius = Math.max(radius, 9);
  if (hitRadius > radius) group.add(new Konva.Circle({ radius: hitRadius, fill: 'transparent' }));
  group.add(new Konva.Circle({ radius, fill: hexToRgba(plant.color, 0.35), stroke: plant.color, strokeWidth: 1.5 }));
  if (radius >= PLANT_LABEL_MIN_RADIUS) {
    group.add(new Konva.Text({ text: plant.name.slice(0, 2).toUpperCase(), fontSize: 11, fill: '#F5F5F0', x: -8, y: -6, listening: false }));
  } else {
    group.add(new Konva.Circle({ radius: Math.min(2.5, radius), fill: plant.color, listening: false }));
  }
  group.on('dragend', () => { el.x = group.x(); el.y = group.y(); markDirty(); if (selectedElementId === el.id) positionSelectionRing(el); });
  attachSelectHandler(group, el);
  return group;
}

function buildHeadNode(el) {
  const catalog = CAT.HEAD_CATALOG.find((h) => h.key === el.headKey) || { color: '#2E6FA6', kind: 'spray', arc: 360 };
  const group = new Konva.Group({ x: el.x, y: el.y, draggable: activeTool === 'select' });
  const radiusFt = typeof el.radiusFt === 'number' ? el.radiusFt : (catalog.defaultRadiusFt || 0);
  const radiusPx = radiusFt * pxPerFt;
  if (radiusPx > 0 && catalog.kind !== 'drip') {
    if (el.arc >= 360) {
      group.add(new Konva.Circle({ radius: radiusPx, stroke: catalog.color, strokeWidth: 1, dash: [3, 3], fill: hexToRgba(catalog.color, 0.06) }));
    } else {
      group.add(new Konva.Wedge({ radius: radiusPx, angle: el.arc, rotation: el.rotationDeg || 0, fill: hexToRgba(catalog.color, 0.12), stroke: catalog.color, strokeWidth: 1, dash: [3, 3] }));
    }
  }
  group.add(new Konva.Circle({ radius: 4, fill: catalog.color }));
  if (el.zoneNumber) group.add(new Konva.Text({ text: `Z${el.zoneNumber}`, fontSize: 9, fill: catalog.color, x: 6, y: -14 }));
  group.on('dragend', () => { el.x = group.x(); el.y = group.y(); markDirty(); if (selectedElementId === el.id) positionSelectionRing(el); });
  attachSelectHandler(group, el);
  return group;
}

function buildFixtureNode(el) {
  const fixture = CAT.FIXTURE_CATALOG.find((f) => f.key === el.fixtureKey) || { color: '#B0632E', name: '?' };
  const group = new Konva.Group({ x: el.x, y: el.y, draggable: activeTool === 'select' });
  group.add(new Konva.Rect({ x: 0, y: 0, offsetX: 6, offsetY: 6, width: 12, height: 12, fill: fixture.color, rotation: 45 }));
  group.add(new Konva.Text({ text: el.label || fixture.name, fontSize: 10, fill: '#F5F5F0', x: 10, y: -6 }));
  group.on('dragend', () => { el.x = group.x(); el.y = group.y(); markDirty(); if (selectedElementId === el.id) positionSelectionRing(el); });
  attachSelectHandler(group, el);
  return group;
}

function buildLabelNode(el) {
  const text = new Konva.Text({ x: el.x, y: el.y, text: el.text || '', fontSize: 14, fill: '#F5F5F0', draggable: activeTool === 'select' });
  text.on('dragend', () => { el.x = text.x(); el.y = text.y(); markDirty(); });
  attachSelectHandler(text, el);
  return text;
}

function buildImageNode(el) {
  const group = new Konva.Group({ x: el.x, y: el.y, draggable: activeTool === 'select', opacity: el.opacity != null ? el.opacity : 0.85 });
  const cached = imageObjCache.get(el.id);
  if (cached) {
    group.add(new Konva.Image({ image: cached, width: el.width, height: el.height }));
  } else {
    group.add(new Konva.Rect({ width: el.width, height: el.height, fill: '#2A2A28', stroke: '#4A4A46' }));
    group.add(new Konva.Text({ text: 'Loading satellite image…', x: 8, y: 8, fontSize: 12, fill: '#C4C4BC' }));
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageObjCache.set(el.id, img);
      const node = nodesById.get(el.id);
      if (node) {
        node.destroyChildren();
        node.add(new Konva.Image({ image: img, width: el.width, height: el.height }));
        mainLayer.batchDraw();
      }
    };
    img.onerror = () => {
      const node = nodesById.get(el.id);
      if (node) { node.findOne('Text').text('Satellite image failed to load'); mainLayer.batchDraw(); }
    };
    img.src = el.src;
  }
  group.on('dragend', () => { el.x = group.x(); el.y = group.y(); markDirty(); });
  attachSelectHandler(group, el);
  return group;
}

function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16), g = parseInt(h.substring(2, 4), 16), b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function onShapeDragEnd(el, line) {
  const dx = line.x(), dy = line.y();
  const pts = el.points.slice();
  for (let i = 0; i < pts.length; i += 2) { pts[i] += dx; pts[i + 1] += dy; }
  el.points = pts;
  line.position({ x: 0, y: 0 });
  line.points(pts);
  markDirty();
}

// ===================== Selection & properties =====================

function selectElement(id) {
  selectedElementId = id;
  const el = elements.find((e) => e.id === id);
  if (!el) return;
  if (typeof el.x === 'number' && el.type !== 'image') positionSelectionRing(el);
  else selectionRing.visible(false);
  mainLayer.batchDraw();
  showPropertiesTab(true);
  switchSidePanel('properties');
  renderProperties(el);
}

function positionSelectionRing(el) {
  let radius = 16;
  if (el.type === 'plant') { const p = CAT.PLANT_CATALOG.find((x) => x.key === el.plantKey); if (p) radius = plantDisplayRadiusPx(p) + 4; }
  if (el.type === 'head') { radius = 12; }
  selectionRing.position({ x: el.x, y: el.y });
  selectionRing.radius(radius);
  selectionRing.visible(true);
}

function deselect() {
  selectedElementId = null;
  selectionRing.visible(false);
  mainLayer.batchDraw();
  showPropertiesTab(false);
}

function deleteElement(id) {
  const idx = elements.findIndex((e) => e.id === id);
  if (idx === -1) return;
  elements.splice(idx, 1);
  const node = nodesById.get(id);
  if (node) node.destroy();
  nodesById.delete(id);
  mainLayer.batchDraw();
  deselect();
  markDirty();
  refreshLegendIfVisible();
}

function refreshLegendIfVisible() {
  if (!document.getElementById('design-panel-legend').hidden) renderLegend();
}

function renderProperties(el) {
  const box = document.getElementById('design-properties-content');
  const rerenderThis = () => { const node = nodesById.get(el.id); if (node) node.destroy(); renderElement(el); if (selectedElementId === el.id && typeof el.x === 'number') positionSelectionRing(el); mainLayer.batchDraw(); markDirty(); refreshLegendIfVisible(); };

  if (el.type === 'area') {
    const preset = CAT.AREA_PRESETS.find((p) => p.key === el.subtype);
    box.innerHTML = `
      <div class="design-properties-field"><label>Area type</label>
        <select id="pf-subtype">${CAT.AREA_PRESETS.filter((p) => p.key !== 'boundary' || el.subtype === 'boundary').map((p) => `<option value="${p.key}" ${p.key === el.subtype ? 'selected' : ''}>${p.name}</option>`).join('')}</select>
      </div>
      <div class="design-properties-field"><label>Label (optional)</label><input id="pf-label" type="text" value="${escapeHtml(el.label || '')}" /></div>
      <div class="design-properties-field"><label>Area</label><div>${polygonAreaSqFt(el.points).toFixed(0)} sq ft</div></div>
    `;
    document.getElementById('pf-subtype').addEventListener('change', (e) => { el.subtype = e.target.value; rerenderThis(); });
    document.getElementById('pf-label').addEventListener('change', (e) => { el.label = e.target.value; markDirty(); });
  } else if (el.type === 'zone') {
    box.innerHTML = `
      <div class="design-properties-field"><label>Zone number</label><input id="pf-zone" type="number" min="1" value="${el.zoneNumber}" /></div>
      <div class="design-properties-field"><label>Label (optional)</label><input id="pf-label" type="text" value="${escapeHtml(el.label || '')}" /></div>
      <div class="design-properties-field"><label>Area</label><div>${polygonAreaSqFt(el.points).toFixed(0)} sq ft</div></div>
    `;
    document.getElementById('pf-zone').addEventListener('change', (e) => { el.zoneNumber = Number(e.target.value) || 1; rerenderThis(); });
    document.getElementById('pf-label').addEventListener('change', (e) => { el.label = e.target.value; markDirty(); });
  } else if (el.type === 'plant') {
    const p = CAT.PLANT_CATALOG.find((x) => x.key === el.plantKey) || {};
    box.innerHTML = `
      <div class="design-properties-field"><label>Plant</label><div><strong>${escapeHtml(p.name || '?')}</strong></div></div>
      <div class="design-properties-field"><label>Sun / Water</label><div>${p.sun} sun · ${p.water} water</div></div>
      <div class="design-properties-field"><label>Mature size</label><div>${p.heightFt}ft tall × ${p.spreadFt}ft spread</div></div>
      <p class="empty-sub">Use Delete selected, then re-place, to swap the plant.</p>
    `;
  } else if (el.type === 'head') {
    const h = CAT.HEAD_CATALOG.find((x) => x.key === el.headKey) || {};
    const radiusFt = typeof el.radiusFt === 'number' ? el.radiusFt : (h.defaultRadiusFt || 0);
    box.innerHTML = `
      <div class="design-properties-field"><label>Head</label><div><strong>${h.brand || ''} ${escapeHtml(h.model || '?')}</strong></div></div>
      <div class="design-properties-field"><label>Radius (ft)</label><input id="pf-radius" type="number" min="0" step="0.5" value="${radiusFt}" /></div>
      <div class="design-properties-field"><label>Arc (degrees, 360 = full circle)</label><input id="pf-arc" type="number" min="0" max="360" step="5" value="${el.arc}" /></div>
      <div class="design-properties-field"><label>Rotation (degrees)</label><input id="pf-rotation" type="number" min="0" max="360" step="5" value="${el.rotationDeg || 0}" /></div>
      <div class="design-properties-field"><label>Zone number</label><input id="pf-zone" type="number" min="0" value="${el.zoneNumber || ''}" placeholder="none" /></div>
      <p class="empty-sub">Radius/GPM are manufacturer typicals — adjust to match your actual nozzle and pressure.</p>
    `;
    document.getElementById('pf-radius').addEventListener('change', (e) => { el.radiusFt = Number(e.target.value) || 0; rerenderThis(); });
    document.getElementById('pf-arc').addEventListener('change', (e) => { el.arc = Math.max(0, Math.min(360, Number(e.target.value) || 360)); rerenderThis(); });
    document.getElementById('pf-rotation').addEventListener('change', (e) => { el.rotationDeg = Number(e.target.value) || 0; rerenderThis(); });
    document.getElementById('pf-zone').addEventListener('change', (e) => { el.zoneNumber = Number(e.target.value) || null; rerenderThis(); });
  } else if (el.type === 'pipe') {
    box.innerHTML = `
      <div class="design-properties-field"><label>Pipe type</label>
        <select id="pf-subtype"><option value="lateral" ${el.subtype === 'lateral' ? 'selected' : ''}>Lateral</option><option value="mainline" ${el.subtype === 'mainline' ? 'selected' : ''}>Mainline</option></select>
      </div>
      <div class="design-properties-field"><label>Zone number</label><input id="pf-zone" type="number" min="0" value="${el.zoneNumber || ''}" placeholder="none" /></div>
      <div class="design-properties-field"><label>Length</label><div>${polylineLengthFt(el.points).toFixed(1)} ft</div></div>
    `;
    document.getElementById('pf-subtype').addEventListener('change', (e) => { el.subtype = e.target.value; rerenderThis(); });
    document.getElementById('pf-zone').addEventListener('change', (e) => { el.zoneNumber = Number(e.target.value) || null; markDirty(); refreshLegendIfVisible(); });
  } else if (el.type === 'fixture') {
    const f = CAT.FIXTURE_CATALOG.find((x) => x.key === el.fixtureKey) || {};
    box.innerHTML = `
      <div class="design-properties-field"><label>Fixture</label><div><strong>${escapeHtml(f.name || '?')}</strong></div></div>
      <div class="design-properties-field"><label>Label</label><input id="pf-label" type="text" value="${escapeHtml(el.label || '')}" /></div>
    `;
    document.getElementById('pf-label').addEventListener('change', (e) => { el.label = e.target.value; rerenderThis(); });
  } else if (el.type === 'label') {
    box.innerHTML = `<div class="design-properties-field"><label>Text</label><textarea id="pf-text" rows="3">${escapeHtml(el.text || '')}</textarea></div>`;
    document.getElementById('pf-text').addEventListener('change', (e) => { el.text = e.target.value; rerenderThis(); });
  } else if (el.type === 'image') {
    box.innerHTML = `
      <div class="design-properties-field"><label>Source</label><div>${escapeHtml(el.address || 'Satellite image')}</div></div>
      <div class="design-properties-field"><label>Coverage</label><div>${el.coverageFt || Math.round(el.width / pxPerFt)} ft wide</div></div>
      <div class="design-properties-field"><label>Opacity</label><input id="pf-opacity" type="range" min="0.2" max="1" step="0.05" value="${el.opacity != null ? el.opacity : 0.85}" /></div>
      <p class="empty-sub">Drag to nudge it into position. Delete and re-add from the Satellite backdrop button to change the address or coverage.</p>
    `;
    document.getElementById('pf-opacity').addEventListener('input', (e) => {
      el.opacity = Number(e.target.value);
      const node = nodesById.get(el.id);
      if (node) { node.opacity(el.opacity); mainLayer.batchDraw(); }
      markDirty();
    });
  }
}

// ===================== Stage click handling (drawing/placing) =====================

function onStageClick(e) {
  if (!isEditableViewport()) return;
  const pos = mainLayer.getRelativePointerPosition();

  if (activeTool === 'scale') {
    handleScaleClick(pos, e);
    return;
  }
  if (activeTool.startsWith('area-') || activeTool === 'zone') {
    handlePolygonClick(pos);
    return;
  }
  if (activeTool.startsWith('pipe-')) {
    handlePolylineClick(pos);
    return;
  }
  if (activeTool === 'plant') { if (armedPlantKey) placePlant(pos); return; }
  if (activeTool === 'head') { if (armedHeadKey) placeHead(pos); return; }
  if (activeTool === 'fixture') { if (armedFixtureKey) placeFixture(pos); return; }
  if (activeTool === 'label') { placeLabel(pos); return; }
  if (activeTool === 'select' && e.target === stage) deselect();
}

function handleScaleClick(pos) {
  scaleClickPoints.push(pos);
  const dot = new Konva.Circle({ x: pos.x, y: pos.y, radius: 4, fill: '#FFD84A', listening: false });
  mainLayer.add(dot);
  tempDrawDots.push(dot);
  mainLayer.batchDraw();
  if (scaleClickPoints.length === 2) {
    const [a, b] = scaleClickPoints;
    const pixelDist = Math.hypot(b.x - a.x, b.y - a.y);
    const feet = parseFloat(prompt('Real-world distance between those two points, in feet:', ''));
    tempDrawDots.forEach((d) => d.destroy());
    tempDrawDots = [];
    scaleClickPoints = [];
    if (feet && feet > 0 && pixelDist > 0) {
      pxPerFt = pixelDist / feet;
      document.getElementById('design-scale-label').textContent = `1 ft ≈ ${pxPerFt.toFixed(1)} px`;
      drawGrid();
      renderAllElements();
      markDirty();
    }
    mainLayer.batchDraw();
  }
}

function handlePolygonClick(pos) {
  drawingPoints.push(pos.x, pos.y);
  updateTempDraw(true);
}

function handlePolylineClick(pos) {
  drawingPoints.push(pos.x, pos.y);
  updateTempDraw(false);
}

function updateTempDraw(closed) {
  if (tempDrawLine) tempDrawLine.destroy();
  tempDrawDots.forEach((d) => d.destroy());
  tempDrawDots = [];
  tempDrawLine = new Konva.Line({ points: drawingPoints, closed, stroke: '#FFD84A', strokeWidth: 2, dash: [6, 4], listening: false });
  mainLayer.add(tempDrawLine);
  for (let i = 0; i < drawingPoints.length; i += 2) {
    const dot = new Konva.Circle({ x: drawingPoints[i], y: drawingPoints[i + 1], radius: 3, fill: '#FFD84A', listening: false });
    mainLayer.add(dot);
    tempDrawDots.push(dot);
  }
  mainLayer.batchDraw();
}

function cancelCurrentDraw() {
  drawingPoints = [];
  scaleClickPoints = [];
  if (tempDrawLine) { tempDrawLine.destroy(); tempDrawLine = null; }
  tempDrawDots.forEach((d) => d.destroy());
  tempDrawDots = [];
  if (mainLayer) mainLayer.batchDraw();
}

function finishCurrentDraw() {
  if (drawingPoints.length < 4) { cancelCurrentDraw(); return; }
  if (activeTool.startsWith('area-')) {
    if (drawingPoints.length < 6) { cancelCurrentDraw(); return; } // need >= 3 points
    const subtype = activeTool.replace('area-', '');
    addElement({ id: uid(), type: 'area', subtype, points: drawingPoints.slice(), label: '' });
  } else if (activeTool === 'zone') {
    if (drawingPoints.length < 6) { cancelCurrentDraw(); return; }
    const nextZone = 1 + elements.filter((e) => e.type === 'zone').reduce((m, e) => Math.max(m, e.zoneNumber || 0), 0);
    addElement({ id: uid(), type: 'zone', zoneNumber: nextZone, points: drawingPoints.slice(), label: '' });
  } else if (activeTool.startsWith('pipe-')) {
    const subtype = activeTool.replace('pipe-', '');
    addElement({ id: uid(), type: 'pipe', subtype, points: drawingPoints.slice(), zoneNumber: null });
  }
  cancelCurrentDraw();
}

document.addEventListener('keydown', (e) => {
  if (document.getElementById('view-design-editor').hidden) return;
  const tag = document.activeElement && document.activeElement.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
  if (e.key === 'Enter') finishCurrentDraw();
  else if (e.key === 'Escape') { cancelCurrentDraw(); deselect(); }
  else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementId) { e.preventDefault(); deleteElement(selectedElementId); }
});

function addElement(el) {
  elements.push(el);
  renderElement(el);
  mainLayer.add(selectionRing);
  mainLayer.batchDraw();
  markDirty();
  refreshLegendIfVisible();
}

function placePlant(pos) {
  addElement({ id: uid(), type: 'plant', plantKey: armedPlantKey, x: pos.x, y: pos.y });
}

function placeHead(pos) {
  const catalog = CAT.HEAD_CATALOG.find((h) => h.key === armedHeadKey);
  const activeZoneEl = [...elements].reverse().find((e) => e.type === 'zone');
  addElement({
    id: uid(), type: 'head', headKey: armedHeadKey, x: pos.x, y: pos.y,
    radiusFt: catalog ? catalog.defaultRadiusFt : 10,
    arc: catalog ? catalog.arc : 360,
    rotationDeg: 0,
    zoneNumber: activeZoneEl ? activeZoneEl.zoneNumber : null,
  });
}

function placeFixture(pos) {
  const fixture = CAT.FIXTURE_CATALOG.find((f) => f.key === armedFixtureKey);
  addElement({ id: uid(), type: 'fixture', fixtureKey: armedFixtureKey, x: pos.x, y: pos.y, label: fixture ? fixture.name : '' });
}

function placeLabel(pos) {
  const text = prompt('Label text:', '');
  if (!text) return;
  addElement({ id: uid(), type: 'label', x: pos.x, y: pos.y, text });
}

// ===================== Geometry helpers =====================

function polygonAreaSqFt(points) {
  let area = 0;
  const n = points.length / 2;
  for (let i = 0; i < n; i++) {
    const [x1, y1] = [points[i * 2], points[i * 2 + 1]];
    const j = (i + 1) % n;
    const [x2, y2] = [points[j * 2], points[j * 2 + 1]];
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area / 2) / (pxPerFt * pxPerFt);
}

function polylineLengthFt(points) {
  let len = 0;
  for (let i = 0; i < points.length - 2; i += 2) {
    len += Math.hypot(points[i + 2] - points[i], points[i + 3] - points[i + 1]);
  }
  return len / pxPerFt;
}

// ===================== Legend & materials =====================

function renderLegend() {
  const box = document.getElementById('design-legend-content');
  if (!box) return;

  const plantCounts = new Map();
  elements.filter((e) => e.type === 'plant').forEach((e) => plantCounts.set(e.plantKey, (plantCounts.get(e.plantKey) || 0) + 1));

  const headEls = elements.filter((e) => e.type === 'head');
  const headCounts = new Map();
  headEls.forEach((e) => headCounts.set(e.headKey, (headCounts.get(e.headKey) || 0) + 1));

  const zoneEls = elements.filter((e) => e.type === 'zone').sort((a, b) => a.zoneNumber - b.zoneNumber);

  const pipeEls = elements.filter((e) => e.type === 'pipe');
  const lateralFt = pipeEls.filter((e) => e.subtype === 'lateral').reduce((s, e) => s + polylineLengthFt(e.points), 0);
  const mainlineFt = pipeEls.filter((e) => e.subtype === 'mainline').reduce((s, e) => s + polylineLengthFt(e.points), 0);

  const fixtureCounts = new Map();
  elements.filter((e) => e.type === 'fixture').forEach((e) => fixtureCounts.set(e.fixtureKey, (fixtureCounts.get(e.fixtureKey) || 0) + 1));

  const areaTotals = {};
  elements.filter((e) => e.type === 'area' && e.subtype !== 'boundary').forEach((e) => {
    areaTotals[e.subtype] = (areaTotals[e.subtype] || 0) + polygonAreaSqFt(e.points);
  });

  let html = '';

  html += `<div class="design-legend-group"><h4>Site areas</h4>`;
  if (Object.keys(areaTotals).length === 0) html += `<div class="design-legend-row"><span>No areas drawn yet</span><span></span></div>`;
  for (const key of Object.keys(areaTotals)) {
    const preset = CAT.AREA_PRESETS.find((p) => p.key === key);
    html += `<div class="design-legend-row"><span>${preset ? preset.name : key}</span><span>${areaTotals[key].toFixed(0)} sq ft</span></div>`;
  }
  html += `</div>`;

  html += `<div class="design-legend-group"><h4>Plants</h4>`;
  if (plantCounts.size === 0) html += `<div class="design-legend-row"><span>None placed yet</span><span></span></div>`;
  let totalPlants = 0;
  for (const [key, count] of plantCounts) {
    const p = CAT.PLANT_CATALOG.find((x) => x.key === key);
    totalPlants += count;
    html += `<div class="design-legend-row"><span>${p ? escapeHtml(p.name) : key}</span><span>&times;${count}</span></div>`;
  }
  if (plantCounts.size) html += `<div class="design-legend-row design-legend-total"><span>Total plants</span><span>${totalPlants}</span></div>`;
  html += `</div>`;

  html += `<div class="design-legend-group"><h4>Sprinkler heads</h4>`;
  if (headCounts.size === 0) html += `<div class="design-legend-row"><span>None placed yet</span><span></span></div>`;
  for (const [key, count] of headCounts) {
    const h = CAT.HEAD_CATALOG.find((x) => x.key === key);
    html += `<div class="design-legend-row"><span>${h ? `${h.brand} ${escapeHtml(h.model)}` : key}</span><span>&times;${count}</span></div>`;
  }
  html += `<div class="design-legend-row design-legend-total"><span>Total heads</span><span>${headEls.length}</span></div>`;
  html += `</div>`;

  html += `<div class="design-legend-group"><h4>Zones</h4>`;
  if (zoneEls.length === 0) html += `<div class="design-legend-row"><span>No zones drawn yet</span><span></span></div>`;
  for (const z of zoneEls) {
    const heads = headEls.filter((h) => h.zoneNumber === z.zoneNumber);
    const gpm = heads.reduce((s, h) => {
      const h2 = CAT.HEAD_CATALOG.find((x) => x.key === h.headKey);
      const full = h2 ? h2.gpmFull : 0;
      return s + full * ((h.arc || 360) / 360);
    }, 0);
    html += `<div class="design-legend-row"><span>Zone ${z.zoneNumber}${z.label ? ` (${escapeHtml(z.label)})` : ''}</span><span>${heads.length} heads · ~${gpm.toFixed(1)} GPM</span></div>`;
  }
  const unzoned = headEls.filter((h) => !h.zoneNumber).length;
  if (unzoned) html += `<div class="design-legend-row"><span>Not assigned to a zone</span><span>${unzoned} heads</span></div>`;
  html += `<p class="empty-sub">GPM is a rough per-zone estimate from catalog defaults × arc fraction — it does not check pipe sizing, friction loss, or your actual available flow/pressure.</p></div>`;

  html += `<div class="design-legend-group"><h4>Pipe (approx. footage)</h4>
    <div class="design-legend-row"><span>Mainline</span><span>${mainlineFt.toFixed(0)} ft</span></div>
    <div class="design-legend-row"><span>Lateral</span><span>${lateralFt.toFixed(0)} ft</span></div>
  </div>`;

  html += `<div class="design-legend-group"><h4>Fixtures</h4>`;
  if (fixtureCounts.size === 0) html += `<div class="design-legend-row"><span>None placed yet</span><span></span></div>`;
  for (const [key, count] of fixtureCounts) {
    const f = CAT.FIXTURE_CATALOG.find((x) => x.key === key);
    html += `<div class="design-legend-row"><span>${f ? escapeHtml(f.name) : key}</span><span>&times;${count}</span></div>`;
  }
  html += `</div>`;

  box.innerHTML = html;
}

// ===================== Print / export =====================
// window.print() lets the user "Save as PDF" in the browser's own print
// dialog -- no separate PDF library needed. #design-print-sheet is built
// fresh each time from current elements, and style.css's @media print rule
// hides the rest of the app and shows only this sheet.

function buildPrintSheet() {
  const box = document.getElementById('design-print-sheet');
  if (!box || !stage || !currentDesign) return;

  const plantCounts = new Map();
  elements.filter((e) => e.type === 'plant').forEach((e) => plantCounts.set(e.plantKey, (plantCounts.get(e.plantKey) || 0) + 1));
  const headEls = elements.filter((e) => e.type === 'head');
  const headCounts = new Map();
  headEls.forEach((e) => headCounts.set(e.headKey, (headCounts.get(e.headKey) || 0) + 1));
  const zoneEls = elements.filter((e) => e.type === 'zone').sort((a, b) => a.zoneNumber - b.zoneNumber);
  const pipeEls = elements.filter((e) => e.type === 'pipe');
  const lateralFt = pipeEls.filter((e) => e.subtype === 'lateral').reduce((s, e) => s + polylineLengthFt(e.points), 0);
  const mainlineFt = pipeEls.filter((e) => e.subtype === 'mainline').reduce((s, e) => s + polylineLengthFt(e.points), 0);
  const fixtureCounts = new Map();
  elements.filter((e) => e.type === 'fixture').forEach((e) => fixtureCounts.set(e.fixtureKey, (fixtureCounts.get(e.fixtureKey) || 0) + 1));
  const areaTotals = {};
  elements.filter((e) => e.type === 'area' && e.subtype !== 'boundary').forEach((e) => {
    areaTotals[e.subtype] = (areaTotals[e.subtype] || 0) + polygonAreaSqFt(e.points);
  });

  const linkBits = [];
  if (currentDesign.customers && currentDesign.customers.name) linkBits.push(currentDesign.customers.name);
  if (currentDesign.jobs && currentDesign.jobs.title) linkBits.push(currentDesign.jobs.title);

  let html = `
    <div class="design-print-title">${escapeHtml(currentDesign.name || 'Untitled design')}</div>
    <div class="design-print-meta">${linkBits.length ? escapeHtml(linkBits.join(' — ')) + ' &middot; ' : ''}Printed ${new Date().toLocaleDateString()} &middot; Scale: 1 ft &asymp; ${pxPerFt.toFixed(1)} px</div>
    <div class="design-print-plan"><img src="${stage.toDataURL({ pixelRatio: 2 })}" /></div>
  `;

  html += `<div class="design-print-section"><h3>Site areas</h3>`;
  if (Object.keys(areaTotals).length === 0) {
    html += `<div class="design-print-row"><span>No areas drawn</span><span></span></div>`;
  }
  for (const key of Object.keys(areaTotals)) {
    const preset = CAT.AREA_PRESETS.find((p) => p.key === key);
    html += `<div class="design-print-row"><span>${preset ? escapeHtml(preset.name) : key}</span><span>${areaTotals[key].toFixed(0)} sq ft</span></div>`;
  }
  html += `</div>`;

  if (plantCounts.size) {
    html += `<div class="design-print-section"><h3>Plants</h3><div class="design-print-plant-grid">`;
    for (const [key, count] of plantCounts) {
      const p = CAT.PLANT_CATALOG.find((x) => x.key === key);
      if (!p) continue;
      html += `
        <div class="design-print-plant-card">
          ${p.photoUrl
            ? `<img class="design-print-plant-photo" src="${p.photoUrl}" alt="${escapeHtml(p.name)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />`
            : ''}
          <div class="design-print-plant-fallback" style="${p.photoUrl ? '' : 'display:flex;'} background:${p.color}">${escapeHtml(p.category)}</div>
          <div class="design-print-plant-name">${escapeHtml(p.name)} &times;${count}</div>
          <div class="design-print-plant-sub">${p.heightFt}ft tall &times; ${p.spreadFt}ft spread</div>
        </div>`;
    }
    html += `</div></div>`;
  }

  if (headCounts.size) {
    html += `<div class="design-print-section"><h3>Sprinkler heads</h3>`;
    for (const [key, count] of headCounts) {
      const h = CAT.HEAD_CATALOG.find((x) => x.key === key);
      html += `<div class="design-print-row"><span>${h ? `${escapeHtml(h.brand)} ${escapeHtml(h.model)}` : key}</span><span>&times;${count}</span></div>`;
    }
    html += `</div>`;
  }

  if (zoneEls.length) {
    html += `<div class="design-print-section"><h3>Zones</h3>`;
    for (const z of zoneEls) {
      const heads = headEls.filter((h) => h.zoneNumber === z.zoneNumber);
      const gpm = heads.reduce((s, h) => {
        const h2 = CAT.HEAD_CATALOG.find((x) => x.key === h.headKey);
        return s + (h2 ? h2.gpmFull : 0) * ((h.arc || 360) / 360);
      }, 0);
      html += `<div class="design-print-row"><span>Zone ${z.zoneNumber}${z.label ? ` (${escapeHtml(z.label)})` : ''}</span><span>${heads.length} heads &middot; ~${gpm.toFixed(1)} GPM</span></div>`;
    }
    html += `</div>`;
  }

  if (mainlineFt || lateralFt) {
    html += `<div class="design-print-section"><h3>Pipe (approx.)</h3>
      <div class="design-print-row"><span>Mainline</span><span>${mainlineFt.toFixed(0)} ft</span></div>
      <div class="design-print-row"><span>Lateral</span><span>${lateralFt.toFixed(0)} ft</span></div>
    </div>`;
  }

  if (fixtureCounts.size) {
    html += `<div class="design-print-section"><h3>Fixtures</h3>`;
    for (const [key, count] of fixtureCounts) {
      const f = CAT.FIXTURE_CATALOG.find((x) => x.key === key);
      html += `<div class="design-print-row"><span>${f ? escapeHtml(f.name) : key}</span><span>&times;${count}</span></div>`;
    }
    html += `</div>`;
  }

  box.innerHTML = html;
}

document.getElementById('btn-design-print').addEventListener('click', () => {
  if (!currentDesign) return;
  deselect();
  fitViewToContent();
  setTimeout(() => { buildPrintSheet(); window.print(); }, 150);
});

// ===================== Wire up "Site design" buttons on Customer/Job drawers =====================

document.getElementById('btn-customer-site-design').addEventListener('click', () => {
  if (!editingCustomerId) return;
  // Capture before closing the drawer -- closeCustomerDrawer() clears
  // editingCustomerId, so reading it after that call (as this used to)
  // silently passed null and created designs with no customer link at all.
  const customerId = editingCustomerId;
  const c = customers.find((x) => x.id === customerId);
  if (typeof closeCustomerDrawer === 'function') closeCustomerDrawer();
  openOrCreateDesignForCustomer(customerId, c ? c.name : 'Customer');
});

document.getElementById('btn-job-site-design').addEventListener('click', () => {
  if (!editingJobId) return;
  // Same capture-before-close fix as above -- closeJobDrawer() clears
  // editingJobId.
  const jobId = editingJobId;
  const j = jobs.find((x) => x.id === jobId);
  if (typeof closeJobDrawer === 'function') closeJobDrawer();
  openOrCreateDesignForJob(jobId, j ? j.title : 'Job', j ? j.customer_id : null);
});

// Show/hide those buttons whenever a customer/job drawer opens for an
// *existing* record (a brand new unsaved one has nothing to link yet).
const origOpenCustomerDrawer = window.openCustomerDrawer;
if (typeof origOpenCustomerDrawer === 'function') {
  window.openCustomerDrawer = function (customer = null) {
    origOpenCustomerDrawer(customer);
    document.getElementById('btn-customer-site-design').hidden = !customer;
  };
}
const origOpenJobDrawer = window.openJobDrawer;
if (typeof origOpenJobDrawer === 'function') {
  window.openJobDrawer = function (job = null) {
    origOpenJobDrawer(job);
    document.getElementById('btn-job-site-design').hidden = !job;
  };
}

// ===================== Init =====================

initCatalogPanels();
