// ============================================================================
// design-pro.js — professional drawing upgrades for the Site Design editor.
//
// Loads AFTER design.js and plugs into it by wrapping its global functions
// (no edits to design.js needed). Adds: rendered plant symbols, textured
// surfaces, curved edges, vertex editing, undo/redo, snapping + live
// measurements, dimension lines, walls/fences, north arrow + scale bar,
// title-block exports, and a "Plan" settings tab.
//
// Settings that belong to the whole design (plan style, north direction,
// title block, growth view...) live in DPRO.extras and are saved inside
// design_projects.canvas_data.extras -- no database change required.
// ============================================================================
(function () {
  'use strict';
  const CATP = window.DESIGN_CATALOG;
  const $ = (id) => document.getElementById(id);
  const DPRO = (window.DPRO = window.DPRO || {});
  DPRO.version = 'pro-1';
  DPRO.extras = {};
  DPRO.types = {};          // custom element types -> { build(el), layer, props(el, box), layerKey(el) }
  DPRO.drawHandlers = {};   // 'line-wall' -> fn(points)
  DPRO.pointTools = {};     // tool name -> fn(pos)
  DPRO.checks = [];         // fn() -> [{ sev, text, ids }]
  DPRO.legendHooks = [];    // fn() -> html
  DPRO.printHooks = [];     // fn() -> html
  DPRO.propHooks = [];      // fn(el, box)
  DPRO.openHooks = [];      // fn()
  DPRO.sidePanels = {};     // name -> render fn
  DPRO.shift = false;

  const DEFAULTS = {
    style: 'rendered', plantLabels: 'code', growth: 'mature', snap: true, grid: true,
    exportGrid: false, night: false, smoothNew: false, northDeg: 0, showDecor: true,
    titleBlock: { company: 'EcoHaven Solutions LLC', contact: 'Call/Text 509-866-6388 · ecohavenpro.com', sheet: 'Landscape Plan', designer: '', notes: '' },
    irrigation: { staticPsi: 60, availGpm: 15 },
  };
  function deepFill(target, defaults) {
    Object.keys(defaults).forEach((k) => {
      const d = defaults[k];
      if (d && typeof d === 'object' && !Array.isArray(d)) {
        if (!target[k] || typeof target[k] !== 'object') target[k] = {};
        deepFill(target[k], d);
      } else if (target[k] === undefined) target[k] = d;
    });
    return target;
  }
  DPRO.applyDefaults = () => deepFill(DPRO.extras, DEFAULTS);
  DPRO.applyDefaults();
  DPRO.paper = () => DPRO.extras.style !== 'simple';
  const ink = () => (DPRO.paper() ? '#1E1E1C' : '#F5F5F0');
  const halo = () => (DPRO.paper() ? '#FFFFFF' : '#1A1A1A');
  DPRO.ink = ink; DPRO.halo = halo;
  function esc(s) { return typeof escapeHtml === 'function' ? escapeHtml(String(s == null ? '' : s)) : String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  DPRO.esc = esc;

  // ---- keep originals so "Simple" style can fall back to them ----
  const O = {
    buildPlantNode, buildAreaNode, buildLabelNode, buildFixtureNode, buildHeadNode, drawGrid,
    renderElement, renderProperties, finishCurrentDraw, cancelCurrentDraw, onStageClick,
    handlePolygonClick, handlePolylineClick, setActiveTool, switchSidePanel, ensureStage,
    openDesign, markDirty, buildPrintSheet, renderLegend, elementMatchesLayer, layerLookupKey,
    selectElement, deselect, updateTempDraw, plantDisplayRadiusPx, positionSelectionRing,
    fitViewToContent, deleteElement,
  };
  DPRO.O = O;

  function fmtFtIn(ft) {
    const totalIn = Math.round(ft * 12);
    const f = Math.floor(totalIn / 12);
    const i = totalIn % 12;
    return i === 0 ? `${f}'` : `${f}'-${i}"`;
  }
  DPRO.fmtFtIn = fmtFtIn;

  function rerender(el) {
    const node = nodesById.get(el.id);
    if (node) node.destroy();
    nodesById.delete(el.id);
    renderElement(el);
    mainLayer.add(selectionRing);
    mainLayer.batchDraw();
    if (DPRO.lightLayer) DPRO.lightLayer.batchDraw();
  }
  DPRO.rerender = rerender;
  function refreshAll() {
    drawGrid();
    renderAllElements();
    DPRO.applyTheme();
    DPRO.placeDecor(true);
    if (typeof renderLegend === 'function') refreshLegendIfVisible();
  }
  DPRO.refreshAll = refreshAll;
  DPRO.set = function (key, val, noRefresh) {
    DPRO.extras[key] = val;
    markDirty();
    if (!noRefresh) refreshAll();
  };

  // ======================= Undo / redo =======================
  const hist = { stack: [], idx: -1, lock: false, timer: null };
  function snap() { return JSON.stringify({ elements, extras: DPRO.extras }); }
  DPRO.resetHistory = function () { hist.stack = [snap()]; hist.idx = 0; DPRO.updateUndoButtons(); };
  DPRO.pushHistory = function () {
    if (hist.lock) return;
    const s = snap();
    if (hist.stack[hist.idx] === s) return;
    hist.stack = hist.stack.slice(0, hist.idx + 1);
    hist.stack.push(s);
    if (hist.stack.length > 60) hist.stack.shift();
    hist.idx = hist.stack.length - 1;
    DPRO.updateUndoButtons();
  };
  function restore(i) {
    if (i < 0 || i >= hist.stack.length) return;
    hist.lock = true;
    hist.idx = i;
    const data = JSON.parse(hist.stack[i]);
    elements = data.elements;
    DPRO.extras = data.extras || {};
    DPRO.applyDefaults();
    selectedElementId = null;
    DPRO.hideHandles();
    refreshAll();
    deselect();
    O.markDirty();
    hist.lock = false;
    DPRO.updateUndoButtons();
  }
  DPRO.undo = () => { clearTimeout(hist.timer); DPRO.pushHistory(); restore(hist.idx - 1); };
  DPRO.redo = () => restore(hist.idx + 1);
  DPRO.updateUndoButtons = function () {
    const u = $('btn-dpro-undo'), r = $('btn-dpro-redo');
    if (u) u.disabled = hist.idx <= 0;
    if (r) r.disabled = hist.idx >= hist.stack.length - 1;
  };
  window.markDirty = function () {
    O.markDirty();
    if (hist.lock) return;
    clearTimeout(hist.timer);
    hist.timer = setTimeout(DPRO.pushHistory, 250);
  };

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Shift') DPRO.shift = true;
    const ed = $('view-design-editor');
    if (!ed || ed.hidden) return;
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) DPRO.redo(); else DPRO.undo(); }
    else if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); DPRO.redo(); }
  });
  document.addEventListener('keyup', (e) => { if (e.key === 'Shift') DPRO.shift = false; });

  // ======================= Theme (paper vs. dark) =======================
  let origBg = null;
  DPRO.applyTheme = function () {
    const st = $('design-stage');
    if (!st) return;
    if (origBg === null) origBg = st.style.background || '';
    st.style.background = DPRO.paper() ? '#F4F2EB' : origBg;
    const wrap = st.parentElement;
    if (wrap) wrap.style.background = DPRO.paper() ? '#F4F2EB' : '';
    if (selectionRing) selectionRing.stroke(DPRO.paper() ? '#1E6BFF' : '#FFD84A');
    DPRO.updateToolbarState && DPRO.updateToolbarState();
  };

  window.drawGrid = function () {
    if (!gridLayer) return;
    gridLayer.destroyChildren();
    if (DPRO.extras.grid !== false) {
      const paper = DPRO.paper();
      let spacing = pxPerFt * 5;
      const extent = 6000;
      while ((extent * 2) / spacing > 260) spacing *= 2;
      const n = Math.floor(extent / spacing);
      for (let i = -n; i <= n; i++) {
        const major = i % 5 === 0;
        const col = paper ? (major ? '#CFC9BA' : '#E3DFD4') : (major ? '#5A5A55' : '#4A4A46');
        const w = major ? 1.3 : 1;
        gridLayer.add(new Konva.Line({ points: [i * spacing, -extent, i * spacing, extent], stroke: col, strokeWidth: w, listening: false }));
        gridLayer.add(new Konva.Line({ points: [-extent, i * spacing, extent, i * spacing], stroke: col, strokeWidth: w, listening: false }));
      }
    }
    gridLayer.batchDraw();
  };

  // ======================= Snapping + live measurement =======================
  function lastDrawPoint() {
    if (drawingPoints.length >= 2) return { x: drawingPoints[drawingPoints.length - 2], y: drawingPoints[drawingPoints.length - 1] };
    return DPRO.dimFirst || null;
  }
  function snapPos(pos, ignoreEl) {
    let p = { x: pos.x, y: pos.y };
    const snapOn = DPRO.extras.snap !== false;
    if (!snapOn && !DPRO.shift) return p;
    const tol = 10 / (stage ? stage.scaleX() : 1);
    if (snapOn) {
      let best = null, bd = tol;
      for (const el of elements) {
        if (!Array.isArray(el.points) || el === ignoreEl) continue;
        for (let i = 0; i < el.points.length; i += 2) {
          const d = Math.hypot(el.points[i] - p.x, el.points[i + 1] - p.y);
          if (d < bd) { bd = d; best = { x: el.points[i], y: el.points[i + 1] }; }
        }
      }
      for (let i = 0; i < drawingPoints.length - 2; i += 2) { // close on own first point
        const d = Math.hypot(drawingPoints[i] - p.x, drawingPoints[i + 1] - p.y);
        if (d < bd) { bd = d; best = { x: drawingPoints[i], y: drawingPoints[i + 1] }; }
      }
      if (best) return best;
    }
    const last = lastDrawPoint();
    if (DPRO.shift && last) {
      const dx = p.x - last.x, dy = p.y - last.y;
      const a = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4);
      const d = Math.hypot(dx, dy);
      return { x: last.x + Math.cos(a) * d, y: last.y + Math.sin(a) * d };
    }
    if (snapOn) {
      const g = pxPerFt * 0.5;
      p = { x: Math.round(p.x / g) * g, y: Math.round(p.y / g) * g };
    }
    return p;
  }
  DPRO.snapPos = snapPos;

  window.handlePolygonClick = function (pos) { O.handlePolygonClick(snapPos(pos)); };
  window.handlePolylineClick = function (pos) { O.handlePolylineClick(snapPos(pos)); };

  function onMove() {
    if (!stage || !DPRO.overlayLayer) return;
    const last = lastDrawPoint();
    const drawing = last && (activeTool.startsWith('area-') || activeTool === 'zone' || activeTool.startsWith('pipe-') || activeTool.startsWith('line-') || activeTool === 'lrun' || activeTool === 'dim');
    if (!drawing) { clearRubber(); return; }
    const pos = snapPos(mainLayer.getRelativePointerPosition());
    if (!DPRO.rubber) {
      DPRO.rubber = new Konva.Line({ points: [0, 0, 0, 0], stroke: '#1E6BFF', strokeWidth: 1.5, dash: [5, 4], listening: false });
      DPRO.measure = new Konva.Text({ text: '', fontSize: 12, fontStyle: 'bold', fill: '#1E6BFF', stroke: '#FFFFFF', strokeWidth: 3, fillAfterStrokeEnabled: true, listening: false });
      DPRO.overlayLayer.add(DPRO.rubber);
      DPRO.overlayLayer.add(DPRO.measure);
    }
    DPRO.rubber.points([last.x, last.y, pos.x, pos.y]);
    const segFt = Math.hypot(pos.x - last.x, pos.y - last.y) / pxPerFt;
    let total = segFt;
    if (drawingPoints.length >= 4) total += polylineLengthFt(drawingPoints);
    const s = stage.scaleX();
    DPRO.measure.text(drawingPoints.length >= 4 ? `${fmtFtIn(segFt)}   (total ${fmtFtIn(total)})` : fmtFtIn(segFt));
    DPRO.measure.scale({ x: 1 / s, y: 1 / s });
    DPRO.measure.position({ x: pos.x + 14 / s, y: pos.y + 12 / s });
    DPRO.overlayLayer.batchDraw();
  }
  function clearRubber() {
    if (DPRO.rubber) { DPRO.rubber.destroy(); DPRO.rubber = null; }
    if (DPRO.measure) { DPRO.measure.destroy(); DPRO.measure = null; }
    if (DPRO.overlayLayer) DPRO.overlayLayer.batchDraw();
  }
  window.cancelCurrentDraw = function () { O.cancelCurrentDraw(); DPRO.dimFirst = null; clearRubber(); };

  // ======================= Stage / extra layers =======================
  window.ensureStage = function () {
    const had = !!stage;
    O.ensureStage();
    if (had || !stage) return;
    DPRO.lightLayer = new Konva.Layer();
    DPRO.overlayLayer = new Konva.Layer();
    stage.add(DPRO.lightLayer);
    stage.add(DPRO.overlayLayer);
    // reposition decorations whenever pan/zoom changes
    stage.on('scaleXChange.dpro xChange.dpro yChange.dpro', () => DPRO.placeDecor());
    stage.on('mousemove.dpro', onMove);
    DPRO.buildDecor();
    if (DPRO.buildNightOverlay) DPRO.buildNightOverlay();
    DPRO.applyTheme();
  };

  // ======================= North arrow + scale bar =======================
  DPRO.buildDecor = function () {
    DPRO.decor = { north: new Konva.Group({ listening: false }), bar: new Konva.Group({ listening: false }) };
    DPRO.overlayLayer.add(DPRO.decor.north);
    DPRO.overlayLayer.add(DPRO.decor.bar);
    DPRO.placeDecor(true);
  };
  function buildNorth(group) {
    group.destroyChildren();
    const col = DPRO.paper() ? '#1E1E1C' : '#F5F5F0';
    const bg = DPRO.paper() ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.35)';
    group.add(new Konva.Circle({ radius: 30, fill: bg, stroke: col, strokeWidth: 1 }));
    const a = new Konva.Group({ rotation: Number(DPRO.extras.northDeg) || 0 });
    a.add(new Konva.Line({ points: [0, -22, 8, 12, 0, 6], closed: true, fill: col, stroke: col, strokeWidth: 1 }));
    a.add(new Konva.Line({ points: [0, -22, -8, 12, 0, 6], closed: true, fill: DPRO.paper() ? '#FFFFFF' : '#454542', stroke: col, strokeWidth: 1 }));
    a.add(new Konva.Text({ text: 'N', fontSize: 15, fontStyle: 'bold', fill: col, x: -6, y: -42, width: 12, align: 'center' }));
    group.add(a);
  }
  function buildBar(group, s) {
    group.destroyChildren();
    const col = DPRO.paper() ? '#1E1E1C' : '#F5F5F0';
    const cands = [1, 2, 5, 10, 20, 25, 50, 100, 200, 500];
    let ft = cands[cands.length - 1];
    for (const c of cands) { if (c * pxPerFt * s >= 90) { ft = c; break; } }
    const w = ft * pxPerFt * s;
    group.add(new Konva.Rect({ x: -8, y: -22, width: w + 50, height: 40, fill: DPRO.paper() ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.35)', cornerRadius: 4 }));
    group.add(new Konva.Rect({ x: 0, y: 0, width: w / 2, height: 6, fill: col, stroke: col, strokeWidth: 1 }));
    group.add(new Konva.Rect({ x: w / 2, y: 0, width: w / 2, height: 6, fill: DPRO.paper() ? '#FFFFFF' : '#454542', stroke: col, strokeWidth: 1 }));
    [[0, '0'], [w / 2, fmtFtIn(ft / 2)], [w, `${fmtFtIn(ft)}`]].forEach(([x, t]) => {
      group.add(new Konva.Text({ text: t, x: x - 20, y: -16, width: 40, align: 'center', fontSize: 11, fill: col }));
    });
    DPRO.barScale = s; DPRO.barPpf = pxPerFt;
  }
  DPRO.placeDecor = function (rebuild) {
    if (!stage || !DPRO.decor) return;
    const s = stage.scaleX();
    const show = DPRO.extras.showDecor !== false && !!currentDesign;
    const { north, bar } = DPRO.decor;
    north.visible(show); bar.visible(show);
    if (show) {
      if (rebuild || north.getChildren().length === 0) buildNorth(north);
      if (rebuild || DPRO.barScale !== s || DPRO.barPpf !== pxPerFt) buildBar(bar, s);
      north.scale({ x: 1 / s, y: 1 / s });
      north.position({ x: (stage.width() - 46 - stage.x()) / s, y: (56 - stage.y()) / s });
      bar.scale({ x: 1 / s, y: 1 / s });
      bar.position({ x: (28 - stage.x()) / s, y: (stage.height() - 30 - stage.y()) / s });
    }
    DPRO.resizeHandles && DPRO.resizeHandles();
    DPRO.overlayLayer.batchDraw();
  };

  // ======================= Rendered plant symbols =======================
  function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function hexRgb(hex) { const h = String(hex || '#6B8F4E').replace('#', ''); return [parseInt(h.slice(0, 2), 16) || 0, parseInt(h.slice(2, 4), 16) || 0, parseInt(h.slice(4, 6), 16) || 0]; }
  function shade(hex, f) { const [r, g, b] = Array.isArray(hex) ? hex : hexRgb(hex); const t = f < 0 ? 0 : 255, a = Math.abs(f); return `rgb(${Math.round(r + (t - r) * a)},${Math.round(g + (t - g) * a)},${Math.round(b + (t - b) * a)})`; }
  function foliage(plant) {
    const rgb = hexRgb(plant.color);
    if (rgb[1] >= rgb[0] && rgb[1] >= rgb[2]) return { base: rgb, bloom: null };
    const lg = [88, 132, 68], m = 0.7;
    return { base: [Math.round(lg[0] * m + rgb[0] * (1 - m)), Math.round(lg[1] * m + rgb[1] * (1 - m)), Math.round(lg[2] * m + rgb[2] * (1 - m))], bloom: plant.color };
  }
  const symCache = new Map();
  function plantSymbol(plant, rPx) {
    const r = Math.max(rPx, 2);
    const key = `${plant.key}|${Math.round(r * 2) / 2}`;
    if (symCache.has(key)) return symCache.get(key);
    const pad = Math.max(3, r * 0.3);
    const size = Math.ceil(2 * (r + pad));
    const k = Math.min(2, 640 / size);
    const c = document.createElement('canvas');
    c.width = Math.max(2, Math.ceil(size * k));
    c.height = c.width;
    const ctx = c.getContext('2d');
    ctx.scale(k, k);
    ctx.translate(size / 2, size / 2);
    drawSymbol(ctx, plant, r, k);
    const out = { canvas: c, size };
    symCache.set(key, out);
    if (symCache.size > 500) symCache.delete(symCache.keys().next().value);
    return out;
  }
  function withShadow(ctx, r, k, fn) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.36)';
    ctx.shadowBlur = r * 0.22 * k;
    ctx.shadowOffsetX = r * 0.14 * k;
    ctx.shadowOffsetY = r * 0.18 * k;
    fn();
    ctx.restore();
  }
  function drawSymbol(ctx, plant, r, k) {
    const rand = mulberry32(hashStr(plant.key));
    const { base, bloom } = foliage(plant);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    const cat = plant.category;
    if (cat === 'Tree' || cat === 'Shrub') drawCanopy(ctx, r, k, base, bloom, rand, cat === 'Tree', plant.evergreen);
    else if (cat === 'Perennial') drawClump(ctx, r, k, base, bloom, rand);
    else if (cat === 'Ornamental Grass') drawGrassSym(ctx, r, k, base, rand);
    else drawGround(ctx, r, k, base, bloom, rand);
  }
  function drawCanopy(ctx, r, k, base, bloom, rand, isTree, evergreen) {
    const path = new Path2D();
    const lobes = [];
    if (evergreen) {
      const n = Math.max(16, Math.min(34, Math.round(r / 1.8)));
      for (let i = 0; i < n * 2; i++) {
        const a = (i / (n * 2)) * Math.PI * 2;
        const rad = i % 2 === 0 ? r * (0.94 + rand() * 0.06) : r * (0.66 + rand() * 0.08);
        const x = Math.cos(a) * rad, y = Math.sin(a) * rad;
        if (i === 0) path.moveTo(x, y); else path.lineTo(x, y);
      }
      path.closePath();
    } else {
      const n = isTree ? Math.max(14, Math.min(44, Math.round(r / 2.4) + 12)) : Math.max(8, Math.min(22, Math.round(r / 2.2) + 6));
      const ringR = r * (isTree ? 0.8 : 0.68);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + rand() * 0.25;
        const lr = r * (isTree ? 0.2 : 0.34) * (0.8 + rand() * 0.45);
        const cx = Math.cos(a) * ringR, cy = Math.sin(a) * ringR;
        lobes.push({ cx, cy, lr });
        path.moveTo(cx + lr, cy);
        path.arc(cx, cy, lr, 0, Math.PI * 2);
      }
      path.moveTo(r * 0.86, 0);
      path.arc(0, 0, r * 0.86, 0, Math.PI * 2);
    }
    withShadow(ctx, r, k, () => { ctx.fillStyle = shade(base, -0.05); ctx.fill(path); });
    ctx.save();
    ctx.clip(path);
    const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r * 1.08);
    g.addColorStop(0, shade(base, evergreen ? 0.14 : 0.34));
    g.addColorStop(0.5, shade(base, 0.04));
    g.addColorStop(1, shade(base, -0.34));
    ctx.fillStyle = g;
    ctx.fillRect(-r * 1.2, -r * 1.2, r * 2.4, r * 2.4);
    if (evergreen) {
      const n = Math.max(24, Math.round(r * 1.6));
      for (let i = 0; i < n; i++) {
        const a = rand() * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r * 0.12, Math.sin(a) * r * 0.12);
        ctx.lineTo(Math.cos(a) * r * (0.7 + rand() * 0.28), Math.sin(a) * r * (0.7 + rand() * 0.28));
        ctx.strokeStyle = i % 2 ? 'rgba(255,255,255,0.13)' : 'rgba(0,0,0,0.22)';
        ctx.lineWidth = Math.max(0.6, r * 0.018);
        ctx.stroke();
      }
    } else {
      lobes.forEach((l) => {
        ctx.beginPath();
        ctx.arc(l.cx, l.cy, l.lr, -0.2 * Math.PI, 0.85 * Math.PI);
        ctx.strokeStyle = 'rgba(10,35,10,0.2)';
        ctx.lineWidth = Math.max(0.8, l.lr * 0.2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(l.cx - l.lr * 0.3, l.cy - l.lr * 0.34, l.lr * 0.52, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,225,0.13)';
        ctx.fill();
      });
      const specks = Math.min(520, Math.floor(r * 4));
      for (let i = 0; i < specks; i++) {
        const a = rand() * Math.PI * 2, d = Math.sqrt(rand()) * r * 0.95;
        ctx.save();
        ctx.translate(Math.cos(a) * d, Math.sin(a) * d);
        ctx.rotate(rand() * Math.PI);
        ctx.beginPath();
        ctx.ellipse(0, 0, 1 + rand() * 1.8, 0.5 + rand() * 0.6, 0, 0, Math.PI * 2);
        ctx.fillStyle = rand() > 0.5 ? shade(base, 0.25) : shade(base, -0.3);
        ctx.globalAlpha = 0.5;
        ctx.fill();
        ctx.restore();
      }
    }
    if (bloom) {
      const nb = Math.floor(r * 1.3);
      for (let i = 0; i < nb; i++) {
        const a = rand() * Math.PI * 2, d = Math.sqrt(rand()) * r * 0.9;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * d, Math.sin(a) * d, 0.8 + rand() * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = bloom;
        ctx.globalAlpha = 0.85;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    ctx.strokeStyle = shade(base, -0.42);
    ctx.globalAlpha = 0.75;
    ctx.lineWidth = Math.max(0.8, r * 0.014);
    ctx.stroke(path);
    ctx.globalAlpha = 1;
    if (isTree && r > 7) {
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(1.4, r * 0.05), 0, Math.PI * 2);
      ctx.fillStyle = '#4A3520';
      ctx.fill();
    }
  }
  function drawClump(ctx, r, k, base, bloom, rand) {
    const n = 7;
    const leaves = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rand() * 0.4;
      leaves.push({ a, cx: Math.cos(a) * r * 0.45, cy: Math.sin(a) * r * 0.45, rx: r * 0.52, ry: r * 0.25 });
    }
    const sh = new Path2D();
    leaves.forEach((l) => { sh.moveTo(l.cx + Math.cos(l.a) * l.rx, l.cy + Math.sin(l.a) * l.rx); sh.ellipse(l.cx, l.cy, l.rx, l.ry, l.a, 0, Math.PI * 2); });
    withShadow(ctx, r, k, () => { ctx.fillStyle = shade(base, -0.1); ctx.fill(sh); });
    leaves.forEach((l, i) => {
      ctx.beginPath();
      ctx.ellipse(l.cx, l.cy, l.rx, l.ry, l.a, 0, Math.PI * 2);
      ctx.fillStyle = shade(base, i % 2 ? 0.1 : -0.06);
      ctx.fill();
      ctx.strokeStyle = shade(base, -0.45);
      ctx.lineWidth = Math.max(0.6, r * 0.03);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(l.cx - Math.cos(l.a) * l.rx * 0.8, l.cy - Math.sin(l.a) * l.rx * 0.8);
      ctx.lineTo(l.cx + Math.cos(l.a) * l.rx * 0.8, l.cy + Math.sin(l.a) * l.rx * 0.8);
      ctx.strokeStyle = 'rgba(255,255,255,0.22)';
      ctx.stroke();
    });
    const fc = bloom || '#F2E48A';
    for (let i = 0; i < 8; i++) {
      const l = leaves[i % n];
      const x = l.cx + Math.cos(l.a) * l.rx * (0.4 + rand() * 0.5), y = l.cy + Math.sin(l.a) * l.rx * (0.4 + rand() * 0.5);
      ctx.beginPath();
      ctx.arc(x, y, Math.max(1.2, r * 0.1), 0, Math.PI * 2);
      ctx.fillStyle = fc;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
  }
  function drawGrassSym(ctx, r, k, base, rand) {
    const n = Math.round(Math.max(18, Math.min(46, r * 2.4)));
    withShadow(ctx, r, k, () => {
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.05)';
      ctx.fill();
    });
    for (let i = 0; i < n; i++) {
      const a = rand() * Math.PI * 2;
      const len = r * (0.55 + rand() * 0.45);
      const bend = (rand() - 0.5) * len * 0.6;
      const ex = Math.cos(a) * len, ey = Math.sin(a) * len;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.06, Math.sin(a) * r * 0.06);
      ctx.quadraticCurveTo(Math.cos(a) * len * 0.5 - Math.sin(a) * bend, Math.sin(a) * len * 0.5 + Math.cos(a) * bend, ex, ey);
      ctx.strokeStyle = shade(base, rand() * 0.55 - 0.25);
      ctx.lineWidth = 1 + rand() * 0.9;
      ctx.stroke();
      if (rand() > 0.82) { ctx.beginPath(); ctx.arc(ex, ey, 1.1, 0, Math.PI * 2); ctx.fillStyle = '#E8DCA6'; ctx.fill(); }
    }
  }
  function drawGround(ctx, r, k, base, bloom, rand) {
    const n = Math.round(Math.max(12, Math.min(60, r * 1.5)));
    const dots = [];
    for (let i = 0; i < n; i++) {
      const a = rand() * Math.PI * 2, d = Math.sqrt(rand()) * r * 0.78;
      dots.push({ x: Math.cos(a) * d, y: Math.sin(a) * d, rr: r * (0.16 + rand() * 0.14) });
    }
    const sh = new Path2D();
    dots.forEach((d) => { sh.moveTo(d.x + d.rr, d.y); sh.arc(d.x, d.y, d.rr, 0, Math.PI * 2); });
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.2)';
    ctx.shadowBlur = r * 0.1 * k;
    ctx.shadowOffsetX = r * 0.06 * k;
    ctx.shadowOffsetY = r * 0.08 * k;
    ctx.fillStyle = shade(base, -0.1);
    ctx.fill(sh);
    ctx.restore();
    dots.forEach((d, i) => {
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.rr, 0, Math.PI * 2);
      ctx.fillStyle = shade(base, (rand() - 0.4) * 0.4);
      ctx.fill();
      ctx.strokeStyle = shade(base, -0.4);
      ctx.lineWidth = 0.5;
      ctx.stroke();
      if (bloom && i % 3 === 0) { ctx.beginPath(); ctx.arc(d.x, d.y, Math.max(0.8, d.rr * 0.35), 0, Math.PI * 2); ctx.fillStyle = bloom; ctx.fill(); }
    });
  }
  DPRO.plantSymbol = plantSymbol;

  function growthFactor(plant) {
    const t = CATP.GROWTH[DPRO.extras.growth] || CATP.GROWTH.mature;
    return t[plant.category] || 1;
  }
  DPRO.growthFactor = growthFactor;
  window.plantDisplayRadiusPx = function (plant) { return Math.max((plant.spreadFt / 2) * growthFactor(plant) * pxPerFt, 2); };

  window.buildPlantNode = function (el) {
    if (!DPRO.paper()) return O.buildPlantNode(el);
    const plant = CATP.PLANT_CATALOG.find((p) => p.key === el.plantKey) || { key: 'unknown', color: '#8FA65C', spreadFt: 3, name: '?', category: 'Shrub', code: '?' };
    const radius = plantDisplayRadiusPx(plant);
    const group = new Konva.Group({ x: el.x, y: el.y, draggable: activeTool === 'select' });
    group.add(new Konva.Circle({ radius: Math.max(radius, 9), fill: 'transparent' }));
    const sym = plantSymbol(plant, radius);
    group.add(new Konva.Image({ image: sym.canvas, x: -sym.size / 2, y: -sym.size / 2, width: sym.size, height: sym.size, listening: false }));
    const mode = DPRO.extras.plantLabels;
    if (mode === 'code' && radius >= 8) {
      group.add(new Konva.Text({ text: plant.code || '', fontSize: Math.max(8, Math.min(13, radius * 0.55)), fontStyle: 'bold', fill: '#FFFFFF', stroke: 'rgba(0,0,0,0.75)', strokeWidth: 2.5, fillAfterStrokeEnabled: true, listening: false, x: -radius, y: -Math.max(8, Math.min(13, radius * 0.55)) / 2, width: radius * 2, align: 'center' }));
    } else if (mode === 'name' && radius >= 10) {
      group.add(new Konva.Text({ text: plant.name, fontSize: 10, fill: ink(), stroke: halo(), strokeWidth: 3, fillAfterStrokeEnabled: true, listening: false, x: -60, y: radius + 3, width: 120, align: 'center' }));
    }
    if (DPRO.plantDecor) DPRO.plantDecor.forEach((fn) => fn(group, el, plant, radius));
    group.on('dragend', () => { el.x = group.x(); el.y = group.y(); markDirty(); if (selectedElementId === el.id) positionSelectionRing(el); });
    attachSelectHandler(group, el);
    return group;
  }

  // ======================= Textured surfaces =======================
  const texCache = {};
  function mk(size) { const c = document.createElement('canvas'); c.width = size; c.height = size; return [c, c.getContext('2d')]; }
  function tile(ctx, size, x, y, margin, fn) { // draw fn at wrapped offsets so tiles have no seams
    for (const dx of [-size, 0, size]) for (const dy of [-size, 0, size]) {
      if (dx && !(x < margin && dx < 0) && !(x > size - margin && dx > 0)) continue;
      if (dy && !(y < margin && dy < 0) && !(y > size - margin && dy > 0)) continue;
      fn(x + dx, y + dy);
    }
  }
  const TEXTURES = {
    lawn() {
      const [c, ctx] = mk(64); const rand = mulberry32(7);
      const g = ctx.createLinearGradient(0, 0, 64, 64); g.addColorStop(0, '#6DA84C'); g.addColorStop(1, '#5C9440');
      ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
      const tones = ['#7DBB57', '#4F8636', '#8CC864', '#5B9A3F', '#44762E'];
      ctx.lineCap = 'round';
      for (let i = 0; i < 170; i++) {
        const x = rand() * 64, y = rand() * 64, a = -Math.PI / 2 + (rand() - 0.5) * 1.1, l = 3 + rand() * 5;
        ctx.strokeStyle = tones[Math.floor(rand() * tones.length)]; ctx.lineWidth = 0.9 + rand() * 0.6; ctx.globalAlpha = 0.55 + rand() * 0.4;
        tile(ctx, 64, x, y, 8, (px, py) => { ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l); ctx.stroke(); });
      }
      ctx.globalAlpha = 1; return { canvas: c, ft: 4 };
    },
    turf() {
      const [c, ctx] = mk(48); const rand = mulberry32(21);
      ctx.fillStyle = '#58A63C'; ctx.fillRect(0, 0, 48, 48);
      for (let y = 3; y < 48; y += 4) for (let x = 2; x < 48; x += 4) {
        ctx.strokeStyle = rand() > 0.5 ? '#6BBF4B' : '#4A9031'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(x, y + 2); ctx.lineTo(x + (rand() - 0.5) * 2, y - 1.5); ctx.stroke();
      }
      return { canvas: c, ft: 2 };
    },
    bark() {
      const [c, ctx] = mk(64); const rand = mulberry32(31);
      ctx.fillStyle = '#4A2E1B'; ctx.fillRect(0, 0, 64, 64);
      const tones = ['#6B4226', '#5A3A20', '#7A4F2B', '#3E2616', '#8A5A33'];
      for (let i = 0; i < 80; i++) {
        const x = rand() * 64, y = rand() * 64, w = 6 + rand() * 9, h = 2 + rand() * 2.5, a = rand() * Math.PI;
        const col = tones[Math.floor(rand() * tones.length)];
        tile(ctx, 64, x, y, 12, (px, py) => {
          ctx.save(); ctx.translate(px, py); ctx.rotate(a);
          ctx.fillStyle = col; ctx.strokeStyle = 'rgba(20,10,5,0.55)'; ctx.lineWidth = 0.6;
          ctx.beginPath(); ctx.rect(-w / 2, -h / 2, w, h); ctx.fill(); ctx.stroke(); ctx.restore();
        });
      }
      return { canvas: c, ft: 3 };
    },
    soil() {
      const [c, ctx] = mk(64); const rand = mulberry32(41);
      ctx.fillStyle = '#5A4430'; ctx.fillRect(0, 0, 64, 64);
      for (let i = 0; i < 260; i++) { ctx.fillStyle = rand() > 0.5 ? 'rgba(0,0,0,0.18)' : 'rgba(160,125,90,0.25)'; ctx.fillRect(rand() * 64, rand() * 64, 1 + rand() * 1.5, 1 + rand() * 1.5); }
      return { canvas: c, ft: 3 };
    },
    rock() {
      const [c, ctx] = mk(64); const rand = mulberry32(51);
      ctx.fillStyle = '#7B766B'; ctx.fillRect(0, 0, 64, 64);
      const tones = [['#B9B2A2', '#8E887A'], ['#A39C8B', '#7C7667'], ['#C9C2B0', '#9B9484'], ['#8F8A7E', '#6B665B']];
      for (let i = 0; i < 40; i++) {
        const x = rand() * 64, y = rand() * 64, rx = 3 + rand() * 4.5, ry = 2.5 + rand() * 3.5, a = rand() * Math.PI, t = tones[i % tones.length];
        tile(ctx, 64, x, y, 9, (px, py) => {
          const g = ctx.createRadialGradient(px - rx * 0.3, py - ry * 0.3, 0.5, px, py, rx);
          g.addColorStop(0, t[0]); g.addColorStop(1, t[1]);
          ctx.beginPath(); ctx.ellipse(px, py, rx, ry, a, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
          ctx.strokeStyle = 'rgba(40,35,28,0.45)'; ctx.lineWidth = 0.6; ctx.stroke();
        });
      }
      return { canvas: c, ft: 3 };
    },
    gravel() {
      const [c, ctx] = mk(64); const rand = mulberry32(61);
      ctx.fillStyle = '#A29E92'; ctx.fillRect(0, 0, 64, 64);
      const tones = ['#C8C4B8', '#8B877B', '#B3A793', '#6F6B61', '#D8D3C4', '#9C8B76'];
      for (let i = 0; i < 260; i++) {
        ctx.beginPath(); ctx.arc(rand() * 64, rand() * 64, 0.6 + rand() * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = tones[Math.floor(rand() * tones.length)]; ctx.globalAlpha = 0.85; ctx.fill();
      }
      ctx.globalAlpha = 1; return { canvas: c, ft: 3 };
    },
    conc() {
      const [c, ctx] = mk(128); const rand = mulberry32(71);
      ctx.fillStyle = '#C4C2BA'; ctx.fillRect(0, 0, 128, 128);
      for (let i = 0; i < 380; i++) { ctx.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.14)' : 'rgba(60,60,55,0.12)'; ctx.fillRect(rand() * 128, rand() * 128, 1 + rand() * 1.6, 1 + rand() * 1.6); }
      ctx.strokeStyle = 'rgba(80,80,74,0.55)'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(0, 0.8); ctx.lineTo(128, 0.8); ctx.moveTo(0.8, 0); ctx.lineTo(0.8, 128); ctx.stroke();
      return { canvas: c, ft: 6 };
    },
    pavers() {
      const [c, ctx] = mk(96); const rand = mulberry32(81);
      const tones = ['#B39A82', '#A88D74', '#BCA58D', '#9F8670', '#B8A088'];
      for (let row = 0; row < 6; row++) {
        const off = row % 2 ? 16 : 0;
        for (let col = -1; col < 4; col++) {
          const x = col * 32 + off, y = row * 16;
          ctx.fillStyle = tones[Math.floor(rand() * tones.length)]; ctx.fillRect(x, y, 32, 16);
          for (let i = 0; i < 10; i++) { ctx.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'; ctx.fillRect(x + rand() * 30, y + rand() * 14, 1.5, 1.5); }
          ctx.strokeStyle = 'rgba(60,48,38,0.7)'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, 31, 15);
        }
      }
      return { canvas: c, ft: 3 };
    },
    deck() {
      const [c, ctx] = mk(64); const rand = mulberry32(91);
      const tones = ['#A9713F', '#9A6636', '#B77C48', '#8E5E31'];
      for (let row = 0; row < 4; row++) {
        const y = row * 16; ctx.fillStyle = tones[Math.floor(rand() * tones.length)]; ctx.fillRect(0, y, 64, 16);
        for (let i = 0; i < 7; i++) { const gy = y + 2 + rand() * 12; ctx.strokeStyle = 'rgba(60,35,15,0.28)'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(rand() * 20, gy); ctx.lineTo(30 + rand() * 34, gy + (rand() - 0.5) * 1.5); ctx.stroke(); }
        ctx.strokeStyle = 'rgba(30,18,8,0.75)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, y + 0.6); ctx.lineTo(64, y + 0.6); ctx.stroke();
        const sx = (row * 23 + 11) % 64; ctx.beginPath(); ctx.moveTo(sx, y); ctx.lineTo(sx, y + 16); ctx.stroke();
      }
      return { canvas: c, ft: 2 };
    },
    roof() {
      const [c, ctx] = mk(64); const rand = mulberry32(101);
      ctx.fillStyle = '#7C766E'; ctx.fillRect(0, 0, 64, 64);
      for (let row = 0; row < 8; row++) {
        const y = row * 8, off = row % 2 ? 8 : 0;
        for (let col = -1; col < 4; col++) {
          const x = col * 16 + off; const v = 0.85 + rand() * 0.3;
          ctx.fillStyle = `rgb(${Math.round(124 * v)},${Math.round(118 * v)},${Math.round(110 * v)})`; ctx.fillRect(x, y, 16, 8);
          ctx.strokeStyle = 'rgba(30,26,22,0.35)'; ctx.lineWidth = 0.8; ctx.strokeRect(x + 0.4, y + 0.4, 15.2, 7.2);
        }
        ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(0, y + 6.5, 64, 1.5);
      }
      return { canvas: c, ft: 3 };
    },
    water() {
      const [c, ctx] = mk(96); const rand = mulberry32(111);
      const g = ctx.createLinearGradient(0, 0, 96, 96); g.addColorStop(0, '#74B6E2'); g.addColorStop(1, '#4E94C4');
      ctx.fillStyle = g; ctx.fillRect(0, 0, 96, 96);
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1.2; ctx.lineCap = 'round';
      for (let i = 0; i < 12; i++) { const x = rand() * 96, y = rand() * 96, w = 10 + rand() * 14; tile(ctx, 96, x, y, 26, (px, py) => { ctx.beginPath(); ctx.moveTo(px, py); ctx.quadraticCurveTo(px + w / 2, py - 3, px + w, py); ctx.stroke(); }); }
      return { canvas: c, ft: 6 };
    },
  };
  function texture(name) {
    if (!texCache[name]) {
      const m = DPRO.mat && DPRO.mat.by && DPRO.mat.by[name]; // rock / gravel / mulch library (design-materials.js)
      texCache[name] = m ? DPRO.mat.tex2d(name) : TEXTURES[name]();
    }
    return texCache[name];
  }
  DPRO.texture = texture;

  const SURFACE_FOR = { lawn: () => 'lawn', turf: () => 'turf', bed: (el) => (DPRO.mat ? DPRO.mat.keyFor(el) : ({ rock: 'rock', soil: 'soil' }[el.surface] || 'bark')), hardscape: () => 'conc', driveway: () => 'conc', pavers: () => 'pavers', gravel: (el) => (DPRO.mat ? DPRO.mat.keyFor(el) : 'gravel'), deck: () => 'deck', building: () => 'roof', water: () => 'water' };
  const STROKE_FOR = { lawn: '#4F7F3A', turf: '#3F7A2E', bed: '#6B4A2A', hardscape: '#7A7A74', driveway: '#85857F', pavers: '#8A7A6A', gravel: '#7D7868', deck: '#6B4A2A', building: '#2B2B2B', water: '#2E6FA6', flagstone: '#7A6F5C', boundary: '#1A1A1A' };
  const SHADOWED = { building: 1, deck: 0.6, hardscape: 0.4, pavers: 0.4, driveway: 0.3, flagstone: 0.3 };

  function addEdgeDims(group, el, closed) {
    const pts = el.points, n = pts.length / 2;
    const c = closed ? polygonCentroid(pts) : null;
    const lim = closed ? n : n - 1;
    for (let i = 0; i < lim; i++) {
      const x1 = pts[i * 2], y1 = pts[i * 2 + 1], j = (i + 1) % n, x2 = pts[j * 2], y2 = pts[j * 2 + 1];
      const len = Math.hypot(x2 - x1, y2 - y1) / pxPerFt;
      if (len < 2.5) continue;
      let ang = Math.atan2(y2 - y1, x2 - x1);
      let nx = -Math.sin(ang), ny = Math.cos(ang);
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      if (c && (c.x - mx) * nx + (c.y - my) * ny > 0) { nx = -nx; ny = -ny; } // push label outside
      let deg = (ang * 180) / Math.PI;
      if (deg > 90 || deg < -90) deg += 180;
      const t = new Konva.Text({ text: fmtFtIn(len), fontSize: 10, fontStyle: 'bold', fill: ink(), stroke: halo(), strokeWidth: 3, fillAfterStrokeEnabled: true, listening: false });
      t.offsetX(t.width() / 2); t.offsetY(t.height() / 2);
      t.position({ x: mx + nx * 9, y: my + ny * 9 });
      t.rotation(deg);
      group.add(t);
    }
  }

  window.buildAreaNode = function (el) {
    if (!DPRO.paper()) return O.buildAreaNode(el);
    const preset = CATP.AREA_PRESETS.find((p) => p.key === el.subtype) || CATP.AREA_PRESETS[1];
    const sub = el.subtype;
    const opts = { points: el.points, closed: true, stroke: STROKE_FOR[sub] || preset.stroke, strokeWidth: preset.strokeWidth || 2, dash: preset.dash || null, draggable: activeTool === 'select', lineJoin: 'round', name: 'main' };
    if (sub === 'boundary') { opts.fill = 'rgba(0,0,0,0)'; opts.strokeWidth = 3; opts.dash = [14, 6, 3, 6]; }
    else if (sub === 'flagstone') {
      opts.fillPatternImage = getFlagstonePatternCanvas(); opts.fillPatternRepeat = 'repeat';
      opts.fillPatternScaleX = pxPerFt / 35; opts.fillPatternScaleY = pxPerFt / 35;
    } else if (SURFACE_FOR[sub]) {
      const t = texture(SURFACE_FOR[sub](el));
      const sc = (pxPerFt * t.ft) / t.canvas.width;
      opts.fillPatternImage = t.canvas; opts.fillPatternRepeat = 'repeat'; opts.fillPatternScaleX = sc; opts.fillPatternScaleY = sc;
    } else opts.fill = preset.fill;
    if (SHADOWED[sub]) {
      opts.shadowColor = '#000'; opts.shadowBlur = pxPerFt * 0.9; opts.shadowOpacity = 0.3 * SHADOWED[sub] + 0.05;
      opts.shadowOffset = { x: pxPerFt * 0.5 * SHADOWED[sub] + 1, y: pxPerFt * 0.6 * SHADOWED[sub] + 1 };
    }
    const line = new Konva.Line(opts);
    const group = new Konva.Group({ draggable: false });
    line.on('dragend', () => { onShapeDragEnd(el, line); rerender(el); });
    attachSelectHandler(line, el);
    group.add(line);
    if (el.showDims) addEdgeDims(group, el, true);
    const label = buildAreaLabelText(el);
    if (label) group.add(label);
    return group;
  };

  // ---- dark/light-aware versions of simple text-bearing symbols ----
  window.buildLabelNode = function (el) {
    if (!DPRO.paper()) return O.buildLabelNode(el);
    const text = new Konva.Text({ x: el.x, y: el.y, text: el.text || '', fontSize: 14, fontStyle: 'bold', fill: ink(), stroke: halo(), strokeWidth: 3, fillAfterStrokeEnabled: true, draggable: activeTool === 'select' });
    text.on('dragend', () => { el.x = text.x(); el.y = text.y(); markDirty(); });
    attachSelectHandler(text, el);
    return text;
  };
  window.buildFixtureNode = function (el) {
    if (!DPRO.paper()) return O.buildFixtureNode(el);
    const fixture = CATP.FIXTURE_CATALOG.find((f) => f.key === el.fixtureKey) || { color: '#B0632E', name: '?' };
    const group = new Konva.Group({ x: el.x, y: el.y, draggable: activeTool === 'select' });
    group.add(new Konva.Rect({ x: 0, y: 0, offsetX: 6, offsetY: 6, width: 12, height: 12, fill: fixture.color, stroke: '#1E1E1C', strokeWidth: 1, rotation: 45 }));
    group.add(new Konva.Text({ text: el.label || fixture.name, fontSize: 10, fontStyle: 'bold', fill: ink(), stroke: halo(), strokeWidth: 3, fillAfterStrokeEnabled: true, x: 11, y: -6, listening: false }));
    group.on('dragend', () => { el.x = group.x(); el.y = group.y(); markDirty(); if (selectedElementId === el.id) positionSelectionRing(el); });
    attachSelectHandler(group, el);
    return group;
  };
  window.buildHeadNode = function (el) {
    const node = O.buildHeadNode(el);
    if (DPRO.paper() && node && node.getChildren) {
      node.getChildren().forEach((ch) => { if (ch instanceof Konva.Text) { ch.stroke(halo()); ch.strokeWidth(2.5); ch.fillAfterStrokeEnabled(true); ch.fontStyle('bold'); } });
    }
    return node;
  };
  window.updateTempDraw = function (closed) {
    O.updateTempDraw(closed);
    if (DPRO.paper()) {
      if (tempDrawLine) tempDrawLine.stroke('#1E6BFF');
      tempDrawDots.forEach((d) => d.fill('#1E6BFF'));
      mainLayer.batchDraw();
    }
  };

  // ======================= Custom element types: dimension, barrier =======================
  function fieldHtml(label, inner) { return `<div class="design-properties-field"><label>${label}</label>${inner}</div>`; }
  DPRO.fieldHtml = fieldHtml;

  DPRO.types.dimension = {
    layerKey: () => 'dimension',
    build(el) {
      const g = new Konva.Group({ draggable: activeTool === 'select' });
      const col = ink();
      const dx = el.x2 - el.x1, dy = el.y2 - el.y1, len = Math.hypot(dx, dy);
      if (len < 1) return g;
      const nx = -dy / len, ny = dx / len;
      g.add(new Konva.Arrow({ points: [el.x1, el.y1, el.x2, el.y2], stroke: col, fill: col, strokeWidth: 1.3, pointerLength: 7, pointerWidth: 5, pointerAtBeginning: true }));
      [[el.x1, el.y1], [el.x2, el.y2]].forEach(([x, y]) => g.add(new Konva.Line({ points: [x - nx * 7, y - ny * 7, x + nx * 7, y + ny * 7], stroke: col, strokeWidth: 1.3 })));
      let deg = (Math.atan2(dy, dx) * 180) / Math.PI;
      if (deg > 90 || deg < -90) deg += 180;
      const t = new Konva.Text({ text: el.text || fmtFtIn(len / pxPerFt), fontSize: 12, fontStyle: 'bold', fill: col, stroke: halo(), strokeWidth: 3.5, fillAfterStrokeEnabled: true });
      t.offsetX(t.width() / 2); t.offsetY(t.height() + 3);
      t.position({ x: (el.x1 + el.x2) / 2, y: (el.y1 + el.y2) / 2 });
      t.rotation(deg);
      g.add(t);
      g.add(new Konva.Line({ points: [el.x1, el.y1, el.x2, el.y2], stroke: 'rgba(0,0,0,0)', strokeWidth: 12 })); // easy to click
      g.on('dragend', () => { const ox = g.x(), oy = g.y(); el.x1 += ox; el.x2 += ox; el.y1 += oy; el.y2 += oy; g.position({ x: 0, y: 0 }); markDirty(); rerender(el); });
      attachSelectHandler(g, el);
      return g;
    },
    props(el, box) {
      const len = Math.hypot(el.x2 - el.x1, el.y2 - el.y1) / pxPerFt;
      box.innerHTML = fieldHtml('Dimension', `<div><strong>${fmtFtIn(len)}</strong> (${len.toFixed(1)} ft)</div>`) +
        fieldHtml('Custom text (optional)', `<input id="pf-dim-text" type="text" value="${esc(el.text || '')}" placeholder="leave blank to auto-measure" />`);
      $('pf-dim-text').addEventListener('change', (e) => { el.text = e.target.value; rerender(el); markDirty(); });
    },
  };

  function alongPolyline(points, stepPx, fn) {
    let carry = 0;
    for (let i = 0; i < points.length - 2; i += 2) {
      const x1 = points[i], y1 = points[i + 1], x2 = points[i + 2], y2 = points[i + 3];
      const L = Math.hypot(x2 - x1, y2 - y1);
      let d = carry === 0 ? 0 : stepPx - carry;
      while (d <= L) { const t = L ? d / L : 0; fn(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, Math.atan2(y2 - y1, x2 - x1)); d += stepPx; }
      carry = (L - (d - stepPx)) % stepPx;
    }
  }
  DPRO.alongPolyline = alongPolyline;

  DPRO.types.barrier = {
    layerKey: () => 'barrier',
    build(el) {
      const bt = CATP.BARRIER_TYPES.find((b) => b.key === el.subtype) || CATP.BARRIER_TYPES[0];
      const thick = Math.max(el.thicknessFt || bt.thicknessFt, 0.1) * pxPerFt;
      const g = new Konva.Group({ draggable: false });
      let main;
      if (el.subtype === 'fence') {
        main = new Konva.Line({ points: el.points, stroke: '#5A4025', strokeWidth: Math.max(1.6, thick), name: 'main', draggable: activeTool === 'select', hitStrokeWidth: 14 });
        g.add(main);
        const post = Math.max(4, pxPerFt * 0.45);
        alongPolyline(el.points, pxPerFt * 6, (x, y) => g.add(new Konva.Rect({ x: x - post / 2, y: y - post / 2, width: post, height: post, fill: '#8B6B43', stroke: '#3E2A14', strokeWidth: 0.8, listening: false })));
      } else if (el.subtype === 'curb') {
        main = new Konva.Line({ points: el.points, stroke: '#6F6F6A', strokeWidth: Math.max(2, thick), lineJoin: 'round', name: 'main', draggable: activeTool === 'select', hitStrokeWidth: 12 });
        g.add(main);
      } else {
        main = new Konva.Line({ points: el.points, stroke: '#6E6E68', strokeWidth: Math.max(3, thick), lineJoin: 'miter', name: 'main', draggable: activeTool === 'select', shadowColor: '#000', shadowBlur: pxPerFt * 0.5, shadowOpacity: 0.3, shadowOffset: { x: pxPerFt * 0.3, y: pxPerFt * 0.35 }, hitStrokeWidth: 14 });
        g.add(main);
        g.add(new Konva.Line({ points: el.points, stroke: '#A9A9A1', strokeWidth: Math.max(1.5, thick * 0.55), lineJoin: 'miter', listening: false }));
      }
      main.on('dragend', () => { onShapeDragEnd(el, main); rerender(el); });
      attachSelectHandler(main, el);
      return g;
    },
    props(el, box) {
      const bt = CATP.BARRIER_TYPES.find((b) => b.key === el.subtype) || CATP.BARRIER_TYPES[0];
      box.innerHTML = fieldHtml('Type', `<select id="pf-bar-type">${CATP.BARRIER_TYPES.map((b) => `<option value="${b.key}" ${b.key === el.subtype ? 'selected' : ''}>${b.name}</option>`).join('')}</select>`) +
        fieldHtml('Height (ft)', `<input id="pf-bar-h" type="number" min="0.25" step="0.25" value="${el.heightFt || bt.heightFt}" />`) +
        fieldHtml('Length', `<div>${polylineLengthFt(el.points).toFixed(1)} ft</div>`) +
        '<p class="empty-sub">Drag the white dots to reshape. Click a small dot between two to add a point. Double-click a dot to remove it.</p>';
      $('pf-bar-type').addEventListener('change', (e) => { el.subtype = e.target.value; const nb = CATP.BARRIER_TYPES.find((b) => b.key === el.subtype); el.heightFt = nb.heightFt; el.thicknessFt = nb.thicknessFt; rerender(el); markDirty(); DPRO.runLegend(); DPRO.renderProps(el); });
      $('pf-bar-h').addEventListener('change', (e) => { el.heightFt = Math.max(0.25, Number(e.target.value) || 1); markDirty(); });
    },
  };
  DPRO.runLegend = () => { if (typeof refreshLegendIfVisible === 'function') refreshLegendIfVisible(); };
  DPRO.renderProps = (el) => { if (selectedElementId === el.id) renderProperties(el); };

  // dispatch for custom types
  window.renderElement = function (el) {
    const t = DPRO.types[el.type];
    if (!t) return O.renderElement(el);
    const node = t.build(el);
    if (!node) return;
    const key = t.layerKey ? t.layerKey(el) : el.type;
    node.visible(layerVisibility[key] !== false);
    (t.layer === 'light' && DPRO.lightLayer ? DPRO.lightLayer : mainLayer).add(node);
    nodesById.set(el.id, node);
  };
  window.layerLookupKey = function (el) {
    const t = DPRO.types[el.type];
    if (t && t.layerKey) return t.layerKey(el);
    return O.layerLookupKey(el);
  };
  window.elementMatchesLayer = function (el, layerKey) {
    const t = DPRO.types[el.type];
    if (t && t.layerKey) return t.layerKey(el) === layerKey;
    return O.elementMatchesLayer(el, layerKey);
  };

  // ======================= Smooth curves =======================
  function cr(a, b, c, d, t) { return 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t); }
  DPRO.smooth = function (raw, closed) {
    const n = raw.length / 2;
    if (n < 3) return raw.slice();
    const P = (i) => (closed ? { x: raw[((i + n) % n) * 2], y: raw[((i + n) % n) * 2 + 1] } : { x: raw[Math.max(0, Math.min(n - 1, i)) * 2], y: raw[Math.max(0, Math.min(n - 1, i)) * 2 + 1] });
    const out = [];
    const segs = closed ? n : n - 1;
    for (let i = 0; i < segs; i++) {
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      const steps = Math.max(4, Math.round(Math.hypot(p2.x - p1.x, p2.y - p1.y) / (pxPerFt * 1.2)));
      for (let s = 0; s < steps; s++) { const t = s / steps; out.push(cr(p0.x, p1.x, p2.x, p3.x, t), cr(p0.y, p1.y, p2.y, p3.y, t)); }
    }
    if (!closed) out.push(raw[(n - 1) * 2], raw[(n - 1) * 2 + 1]);
    return out;
  };
  const SMOOTHABLE = { lawn: 1, bed: 1, water: 1, gravel: 1, turf: 1, flagstone: 1 };
  function smoothEl(el) { if (!el.rawPoints) el.rawPoints = el.points.slice(); el.points = DPRO.smooth(el.rawPoints, true); }
  function straightenEl(el) { if (el.rawPoints) { el.points = el.rawPoints; delete el.rawPoints; } }

  // ======================= Vertex handles =======================
  DPRO.handles = [];
  DPRO.hideHandles = function () {
    DPRO.handles.forEach((h) => h.destroy());
    DPRO.handles = [];
    if (DPRO.overlayLayer) DPRO.overlayLayer.batchDraw();
  };
  DPRO.resizeHandles = function () {
    if (!DPRO.handles.length || !stage) return;
    const s = stage.scaleX();
    DPRO.handles.forEach((h) => { const mid = h.getAttr('mid'); h.radius((mid ? 4 : 6) / s); h.strokeWidth(2 / s); });
  };
  function mainLine(node) {
    if (!node) return null;
    if (node instanceof Konva.Line) return node;
    return node.findOne('.main') || node.getChildren((c) => c instanceof Konva.Line)[0] || null;
  }
  function applyPts(el) {
    const closed = el.type === 'area' || el.type === 'zone';
    if (el.rawPoints) el.points = DPRO.smooth(el.rawPoints, closed);
    const ln = mainLine(nodesById.get(el.id));
    if (ln) { ln.points(el.points); ln.getLayer() && ln.getLayer().batchDraw(); }
    const nd = nodesById.get(el.id);
    if (nd && nd.find) nd.find('.viz').forEach((l) => l.points(el.points));
    if (DPRO.lightLayer) DPRO.lightLayer.batchDraw();
  }
  DPRO.showHandles = function (el) {
    DPRO.hideHandles();
    if (!DPRO.overlayLayer || !Array.isArray(el.points) || !isEditableViewport() || activeTool !== 'select') return;
    const pts = el.rawPoints || el.points;
    const closed = el.type === 'area' || el.type === 'zone';
    const minPts = closed ? 3 : 2;
    const s = stage.scaleX();
    const n = pts.length / 2;
    const lim = closed ? n : n - 1;
    for (let i = 0; i < lim; i++) { // midpoints first so real vertices sit on top
      const j = (i + 1) % n;
      const mid = new Konva.Circle({ x: (pts[i * 2] + pts[j * 2]) / 2, y: (pts[i * 2 + 1] + pts[j * 2 + 1]) / 2, radius: 4 / s, fill: 'rgba(30,107,255,0.35)', stroke: '#1E6BFF', strokeWidth: 2 / s, name: 'dpro-handle' });
      mid.setAttr('mid', true);
      mid.on('click tap', (e) => { e.cancelBubble = true; pts.splice((i + 1) * 2, 0, mid.x(), mid.y()); applyPts(el); rerender(el); markDirty(); DPRO.runLegend(); DPRO.showHandles(el); });
      DPRO.overlayLayer.add(mid); DPRO.handles.push(mid);
    }
    for (let i = 0; i < n; i++) {
      const h = new Konva.Circle({ x: pts[i * 2], y: pts[i * 2 + 1], radius: 6 / s, fill: '#FFFFFF', stroke: '#1E6BFF', strokeWidth: 2 / s, draggable: true, name: 'dpro-handle' });
      h.on('dragmove', () => {
        const sp = snapPos({ x: h.x(), y: h.y() }, el);
        h.position(sp);
        pts[i * 2] = sp.x; pts[i * 2 + 1] = sp.y;
        applyPts(el);
      });
      h.on('dragend', () => { rerender(el); markDirty(); DPRO.runLegend(); DPRO.showHandles(el); });
      h.on('dblclick dbltap', (e) => {
        e.cancelBubble = true;
        if (pts.length / 2 <= minPts) return;
        pts.splice(i * 2, 2); applyPts(el); rerender(el); markDirty(); DPRO.runLegend(); DPRO.showHandles(el);
      });
      h.on('mouseenter', () => { stage.container().style.cursor = 'move'; });
      h.on('mouseleave', () => { stage.container().style.cursor = ''; });
      DPRO.overlayLayer.add(h); DPRO.handles.push(h);
    }
    DPRO.overlayLayer.batchDraw();
  };
  window.selectElement = function (id) {
    O.selectElement(id);
    const el = elements.find((e) => e.id === id);
    if (el) DPRO.showHandles(el);
  };
  window.deselect = function () { DPRO.hideHandles(); O.deselect(); };
  const origDragEnd = onShapeDragEnd;
  window.onShapeDragEnd = function (el, line) {
    const dx = line.x(), dy = line.y();
    origDragEnd(el, line);
    if (el.rawPoints) { for (let i = 0; i < el.rawPoints.length; i += 2) { el.rawPoints[i] += dx; el.rawPoints[i + 1] += dy; } }
    if (selectedElementId === el.id) DPRO.showHandles(el);
  };

  // ======================= Drawing: finish / click / tools =======================
  window.finishCurrentDraw = function () {
    const tool = activeTool;
    if (tool.startsWith('line-') || DPRO.drawHandlers[tool]) {
      const h = DPRO.drawHandlers[tool];
      if (drawingPoints.length >= 4 && h) h(drawingPoints.slice(), tool);
      cancelCurrentDraw();
      return;
    }
    const before = elements.length;
    O.finishCurrentDraw();
    if (elements.length > before) {
      const el = elements[elements.length - 1];
      if (el.type === 'area' && DPRO.extras.smoothNew && SMOOTHABLE[el.subtype]) { smoothEl(el); rerender(el); }
    }
  };
  DPRO.drawHandlers['line-wall'] = DPRO.drawHandlers['line-fence'] = DPRO.drawHandlers['line-curb'] = function (pts, tool) {
    const key = tool.replace('line-', '');
    const bt = CATP.BARRIER_TYPES.find((b) => b.key === key) || CATP.BARRIER_TYPES[0];
    addElement({ id: uid(), type: 'barrier', subtype: bt.key, points: pts, heightFt: bt.heightFt, thicknessFt: bt.thicknessFt });
  };

  window.onStageClick = function (e) {
    if (!isEditableViewport()) return;
    const t = activeTool;
    if (t === 'dim') {
      const pos = snapPos(mainLayer.getRelativePointerPosition());
      if (!DPRO.dimFirst) { DPRO.dimFirst = pos; return; }
      const a = DPRO.dimFirst; DPRO.dimFirst = null; clearRubber();
      if (Math.hypot(pos.x - a.x, pos.y - a.y) > 2) addElement({ id: uid(), type: 'dimension', x1: a.x, y1: a.y, x2: pos.x, y2: pos.y });
      return;
    }
    if (t.startsWith('line-') || DPRO.drawHandlers[t]) { handlePolylineClick(mainLayer.getRelativePointerPosition()); return; }
    if (DPRO.pointTools[t]) { DPRO.pointTools[t](mainLayer.getRelativePointerPosition()); return; }
    O.onStageClick(e);
  };

  const HINTS = {
    dim: 'Click the start and end of what you want to measure.',
    'line-wall': 'Click along the wall. Enter to finish, Esc to cancel. Hold Shift for straight lines.',
    'line-fence': 'Click along the fence. Enter to finish, Esc to cancel. Hold Shift for straight lines.',
    'line-curb': 'Click along the edging. Enter to finish, Esc to cancel.',
    'area-building': 'Trace the house or building outline. Enter to finish. Hold Shift for straight lines.',
  };
  DPRO.hints = HINTS;
  window.setActiveTool = function (tool) {
    DPRO.dimFirst = null; clearRubber();
    O.setActiveTool(tool);
    if (HINTS[tool] && isEditableViewport()) $('design-draw-hint').textContent = HINTS[tool];
    if (DPRO.toolHook) DPRO.toolHook(tool);
    if (tool !== 'select') DPRO.hideHandles();
    DPRO.updateToolbarState();
  };
  window.switchSidePanel = function (panel) {
    O.switchSidePanel(panel);
    Object.keys(DPRO.sidePanels).forEach((p) => {
      const el = $('design-panel-' + p);
      if (el) el.hidden = p !== panel;
    });
    if (DPRO.sidePanels[panel]) DPRO.sidePanels[panel]();
  };

  // ======================= Properties extras (areas) =======================
  DPRO.propHooks.push(function (el, box) {
    if (el.type !== 'area') return;
    const sub = el.subtype;
    let h = `<div class="design-properties-field"><label><input type="checkbox" id="pf-x-dims" ${el.showDims ? 'checked' : ''} /> Show edge lengths on the plan</label></div>`;
    if (SMOOTHABLE[sub]) h += `<div class="design-properties-field"><button type="button" class="btn btn-ghost btn-small" id="pf-x-smooth">${el.rawPoints ? 'Make edges straight' : 'Make edges curved'}</button></div>`;
    if (sub === 'bed') {
      h += fieldHtml('Mulch / surface', `<select id="pf-x-surface"><option value="bark" ${(!el.surface || el.surface === 'bark') ? 'selected' : ''}>Bark mulch</option><option value="rock" ${el.surface === 'rock' ? 'selected' : ''}>River rock</option><option value="soil" ${el.surface === 'soil' ? 'selected' : ''}>Bare soil</option></select>`);
      h += fieldHtml('Sun in this bed', `<select id="pf-x-sun"><option value="">Not set</option>${['full:Full sun', 'partial:Part shade', 'shade:Shade'].map((o) => { const [v, l] = o.split(':'); return `<option value="${v}" ${el.sun === v ? 'selected' : ''}>${l}</option>`; }).join('')}</select>`);
      h += fieldHtml('Water in this bed', `<select id="pf-x-water"><option value="">Not set</option>${['low:Low', 'moderate:Moderate', 'high:High'].map((o) => { const [v, l] = o.split(':'); return `<option value="${v}" ${el.water === v ? 'selected' : ''}>${l}</option>`; }).join('')}</select>`);
    }
    if (sub === 'building') h += fieldHtml('Wall height (ft)', `<input id="pf-x-wallh" type="number" min="6" step="1" value="${el.wallHeightFt || 12}" />`);
    box.insertAdjacentHTML('beforeend', h);
    $('pf-x-dims').addEventListener('change', (e) => { el.showDims = e.target.checked; rerender(el); markDirty(); });
    const sm = $('pf-x-smooth');
    if (sm) sm.addEventListener('click', () => { if (el.rawPoints) straightenEl(el); else smoothEl(el); rerender(el); DPRO.showHandles(el); markDirty(); DPRO.runLegend(); DPRO.renderProps(el); });
    const bind = (id, key) => { const n = $(id); if (n) n.addEventListener('change', (e) => { el[key] = e.target.value; if (key === 'surface') rerender(el); markDirty(); }); };
    bind('pf-x-surface', 'surface'); bind('pf-x-sun', 'sun'); bind('pf-x-water', 'water');
    const wh = $('pf-x-wallh'); if (wh) wh.addEventListener('change', (e) => { el.wallHeightFt = Math.max(6, Number(e.target.value) || 12); markDirty(); });
  });
  window.renderProperties = function (el) {
    const t = DPRO.types[el.type];
    if (t && t.props) { const box = $('design-properties-content'); box.innerHTML = ''; t.props(el, box); return; }
    O.renderProperties(el);
    const box = $('design-properties-content');
    DPRO.propHooks.forEach((fn) => { try { fn(el, box); } catch (e) { console.error(e); } });
  };

  // ======================= Legend + print additions =======================
  DPRO.legendHooks.push(function () {
    let html = '';
    const bars = elements.filter((e) => e.type === 'barrier');
    if (bars.length) {
      html += '<div class="design-legend-group"><h4>Walls, fences &amp; edging</h4>';
      CATP.BARRIER_TYPES.forEach((bt) => {
        const ft = bars.filter((b) => b.subtype === bt.key).reduce((sum, b) => sum + polylineLengthFt(b.points), 0);
        if (ft > 0) html += `<div class="design-legend-row"><span>${esc(bt.name)}</span><span>${ft.toFixed(0)} ft</span></div>`;
      });
      html += '</div>';
    }
    const plants = new Map();
    elements.filter((e) => e.type === 'plant').forEach((e) => plants.set(e.plantKey, (plants.get(e.plantKey) || 0) + 1));
    if (plants.size) {
      html += '<div class="design-legend-group"><h4>Plant codes</h4>';
      for (const [k] of plants) { const p = CATP.PLANT_CATALOG.find((x) => x.key === k); if (p) html += `<div class="design-legend-row"><span><strong>${esc(p.code)}</strong> &mdash; ${esc(p.name)}</span><span>${p.heightFt}&prime; &times; ${p.spreadFt}&prime;</span></div>`; }
      html += '</div>';
    }
    return html;
  });
  window.renderLegend = function () {
    O.renderLegend();
    const box = $('design-legend-content');
    if (!box) return;
    let html = '';
    DPRO.legendHooks.forEach((fn) => { try { html += fn(); } catch (e) { console.error(e); } });
    box.insertAdjacentHTML('beforeend', html);
  };

  function scheduleHtml() {
    const plants = new Map();
    elements.filter((e) => e.type === 'plant').forEach((e) => plants.set(e.plantKey, (plants.get(e.plantKey) || 0) + 1));
    if (!plants.size) return '';
    let rows = '';
    for (const [k, n] of plants) {
      const p = CATP.PLANT_CATALOG.find((x) => x.key === k); if (!p) continue;
      rows += `<tr><td><strong>${esc(p.code)}</strong></td><td>${esc(p.name)}</td><td style="text-align:center">${n}</td><td>${p.heightFt}&prime; &times; ${p.spreadFt}&prime;</td><td>${esc(p.sun)}</td><td>${esc(p.water)}</td></tr>`;
    }
    return `<div class="design-print-section dpro-schedule"><h3>Plant schedule</h3><table><thead><tr><th>Code</th><th>Plant</th><th>Qty</th><th>Mature size</th><th>Sun</th><th>Water</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  window.buildPrintSheet = function () {
    const hideGrid = DPRO.extras.exportGrid !== true && gridLayer;
    DPRO.hideHandles(); clearRubber();
    if (hideGrid) gridLayer.visible(false);
    try { O.buildPrintSheet(); } finally { if (hideGrid) { gridLayer.visible(true); gridLayer.batchDraw(); } }
    const box = $('design-print-sheet');
    if (!box || !currentDesign) return;
    const tb = DPRO.extras.titleBlock || {};
    const bits = [];
    if (currentDesign.customers && currentDesign.customers.name) bits.push(currentDesign.customers.name);
    if (currentDesign.jobs && currentDesign.jobs.title) bits.push(currentDesign.jobs.title);
    const titleHtml = `<div class="dpro-titleblock">
      <div class="dpro-tb-cell dpro-tb-brand"><div class="dpro-tb-company">${esc(tb.company)}</div><div class="dpro-tb-small">${esc(tb.contact)}</div></div>
      <div class="dpro-tb-cell dpro-tb-main"><div class="dpro-tb-sheet">${esc(tb.sheet)}</div><div class="dpro-tb-proj">${esc(currentDesign.name || 'Untitled design')}</div>${bits.length ? `<div class="dpro-tb-small">${esc(bits.join(' — '))}</div>` : ''}</div>
      <div class="dpro-tb-cell dpro-tb-meta"><div class="dpro-tb-small">Date: ${new Date().toLocaleDateString()}</div>${tb.designer ? `<div class="dpro-tb-small">Designed by: ${esc(tb.designer)}</div>` : ''}<div class="dpro-tb-small">${DPRO.extras.growth && DPRO.extras.growth !== 'mature' ? 'Plants shown: ' + esc(CATP.GROWTH_LABELS[DPRO.extras.growth]) : 'Plants shown at mature size'}</div></div>
    </div>`;
    const oldTitle = box.querySelector('.design-print-title');
    const oldMeta = box.querySelector('.design-print-meta');
    if (oldTitle) oldTitle.outerHTML = titleHtml; else box.insertAdjacentHTML('afterbegin', titleHtml);
    if (oldMeta) oldMeta.remove();
    const plan = box.querySelector('.design-print-plan');
    if (plan) plan.insertAdjacentHTML('afterend', scheduleHtml());
    let extra = '';
    DPRO.printHooks.forEach((fn) => { try { extra += fn(); } catch (e) { console.error(e); } });
    if (tb.notes) extra += `<div class="design-print-section"><h3>Notes</h3><div style="white-space:pre-wrap;font-size:12px;">${esc(tb.notes)}</div></div>`;
    box.insertAdjacentHTML('beforeend', extra);
  };

  // ======================= Toolbar + side panels =======================
  const toolbar = $('design-toolbar');
  DPRO.addToolGroup = function (id, label, items) {
    if (!toolbar) return null;
    const g = document.createElement('div');
    g.className = 'design-tool-group'; g.id = id;
    g.innerHTML = `<div class="design-tool-group-label">${label}</div>`;
    items.forEach((it) => {
      const b = document.createElement('button');
      b.className = 'design-tool-btn'; b.type = 'button'; b.textContent = it.label;
      if (it.title) b.title = it.title;
      if (it.tool) { b.dataset.tool = it.tool; b.addEventListener('click', () => { if (isEditableViewport()) setActiveTool(it.tool); }); }
      if (it.id) b.id = it.id;
      if (it.onclick) b.addEventListener('click', it.onclick);
      g.appendChild(b);
    });
    const del = $('btn-design-delete-selected');
    const editGroup = del ? del.closest('.design-tool-group') : null;
    if (editGroup && editGroup.parentNode === toolbar) toolbar.insertBefore(g, editGroup); else toolbar.appendChild(g);
    return g;
  };
  DPRO.addToolGroup('dpro-group-surfaces', 'Surfaces &amp; structures', [
    { tool: 'area-building', label: 'House / building', title: 'Trace the building outline (used for roofline lighting and 3D)' },
    { tool: 'area-driveway', label: 'Driveway' },
    { tool: 'area-pavers', label: 'Pavers' },
    { tool: 'area-gravel', label: 'Gravel / rock' },
    { tool: 'area-deck', label: 'Deck' },
    { tool: 'area-turf', label: 'Artificial turf' },
    { tool: 'line-wall', label: 'Wall' },
    { tool: 'line-fence', label: 'Fence' },
    { tool: 'line-curb', label: 'Edging / curb' },
    { tool: 'dim', label: 'Dimension line', title: 'Measure between any two points' },
  ]);
  DPRO.addToolGroup('dpro-group-view', 'Drawing aids', [
    { id: 'btn-dpro-undo', label: 'Undo', title: 'Undo (Ctrl/Cmd+Z)', onclick: () => DPRO.undo() },
    { id: 'btn-dpro-redo', label: 'Redo', title: 'Redo (Ctrl/Cmd+Shift+Z)', onclick: () => DPRO.redo() },
    { id: 'btn-dpro-snap', label: 'Snap: on', title: 'Snap to points and a half-foot grid. Hold Shift while drawing for straight lines.', onclick: () => { DPRO.set('snap', DPRO.extras.snap === false, true); DPRO.updateToolbarState(); } },
    { id: 'btn-dpro-curve', label: 'Curved shapes: off', title: 'New lawns, beds and water features get smooth curved edges', onclick: () => { DPRO.set('smoothNew', !DPRO.extras.smoothNew, true); DPRO.updateToolbarState(); } },
  ]);
  DPRO.updateToolbarState = function () {
    const sn = $('btn-dpro-snap'), cv = $('btn-dpro-curve');
    if (sn) { sn.textContent = DPRO.extras.snap === false ? 'Snap: off' : 'Snap: on'; sn.classList.toggle('is-active', DPRO.extras.snap !== false); }
    if (cv) { cv.textContent = DPRO.extras.smoothNew ? 'Curved shapes: on' : 'Curved shapes: off'; cv.classList.toggle('is-active', !!DPRO.extras.smoothNew); }
    DPRO.updateUndoButtons();
  };

  const sidePanel = document.querySelector('.design-side-panel');
  const tabsBox = document.querySelector('.design-side-tabs');
  DPRO.addSideTab = function (name, label, renderFn) {
    if (!sidePanel || !tabsBox) return;
    const tab = document.createElement('button');
    tab.className = 'design-side-tab'; tab.dataset.panel = name; tab.textContent = label; tab.type = 'button';
    tab.addEventListener('click', () => switchSidePanel(name));
    tabsBox.appendChild(tab);
    const panel = document.createElement('div');
    panel.className = 'design-side-panel-body'; panel.id = 'design-panel-' + name; panel.hidden = true;
    sidePanel.appendChild(panel);
    DPRO.sidePanels[name] = () => renderFn(panel);
  };
  DPRO.addLayer = function (key, label) {
    const box = $('design-panel-layers');
    if (!box || box.querySelector(`input[data-layer="${key}"]`)) return;
    const lab = document.createElement('label');
    lab.className = 'design-layer-toggle';
    lab.innerHTML = `<input type="checkbox" data-layer="${key}" checked /> ${label}`;
    box.appendChild(lab);
    lab.querySelector('input').addEventListener('change', (e) => {
      layerVisibility[key] = e.target.checked; markDirty();
      elements.forEach((el) => { if (elementMatchesLayer(el, key)) { const n = nodesById.get(el.id); if (n) n.visible(e.target.checked); } });
      mainLayer.batchDraw(); if (DPRO.lightLayer) DPRO.lightLayer.batchDraw();
    });
  };
  [['building', 'Buildings'], ['driveway', 'Driveways'], ['pavers', 'Pavers'], ['gravel', 'Gravel / rock'], ['deck', 'Decks'], ['turf', 'Artificial turf'], ['barrier', 'Walls, fences &amp; edging'], ['dimension', 'Dimension lines']].forEach(([k, l]) => DPRO.addLayer(k, l));

  // ---- Plan settings panel ----
  DPRO.addSideTab('plan', 'Plan', function (panel) {
    const x = DPRO.extras, tb = x.titleBlock;
    const sel = (id, opts, cur) => `<select id="${id}">${opts.map(([v, l]) => `<option value="${v}" ${String(cur) === String(v) ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
    panel.innerHTML = `
      <div class="design-legend-group"><h4>Look of the plan</h4>
        ${fieldHtml('Plan style', sel('px-style', [['rendered', 'Rendered (professional)'], ['simple', 'Simple (original)']], x.style))}
        ${fieldHtml('Plant labels', sel('px-labels', [['code', 'Short code (see schedule)'], ['name', 'Full name'], ['none', 'None']], x.plantLabels))}
        ${fieldHtml('Show plants at', sel('px-growth', Object.keys(CATP.GROWTH_LABELS).map((k) => [k, CATP.GROWTH_LABELS[k]]), x.growth))}
        <div class="design-properties-field"><label><input type="checkbox" id="px-grid" ${x.grid !== false ? 'checked' : ''} /> Show grid</label></div>
        <div class="design-properties-field"><label><input type="checkbox" id="px-exgrid" ${x.exportGrid ? 'checked' : ''} /> Include grid in PDF / PNG</label></div>
        <div class="design-properties-field"><label><input type="checkbox" id="px-decor" ${x.showDecor !== false ? 'checked' : ''} /> North arrow &amp; scale bar</label></div>
        ${fieldHtml('North arrow direction (degrees)', `<input id="px-north" type="number" min="0" max="359" step="1" value="${Number(x.northDeg) || 0}" /><p class="empty-sub">0 = north is straight up (satellite images are always north-up).</p>`)}
      </div>
      <div class="design-legend-group"><h4>Title block (PDF / print)</h4>
        ${fieldHtml('Company', `<input id="px-company" type="text" value="${esc(tb.company)}" />`)}
        ${fieldHtml('Contact line', `<input id="px-contact" type="text" value="${esc(tb.contact)}" />`)}
        ${fieldHtml('Sheet title', `<input id="px-sheet" type="text" value="${esc(tb.sheet)}" />`)}
        ${fieldHtml('Designed by', `<input id="px-designer" type="text" value="${esc(tb.designer)}" />`)}
        ${fieldHtml('Notes (printed under the plan)', `<textarea id="px-notes" rows="4">${esc(tb.notes)}</textarea>`)}
      </div>`;
    const on = (id, ev, fn) => { const n = $(id); if (n) n.addEventListener(ev, fn); };
    on('px-style', 'change', (e) => DPRO.set('style', e.target.value));
    on('px-labels', 'change', (e) => DPRO.set('plantLabels', e.target.value));
    on('px-growth', 'change', (e) => DPRO.set('growth', e.target.value));
    on('px-grid', 'change', (e) => DPRO.set('grid', e.target.checked));
    on('px-exgrid', 'change', (e) => DPRO.set('exportGrid', e.target.checked, true));
    on('px-decor', 'change', (e) => DPRO.set('showDecor', e.target.checked));
    on('px-north', 'change', (e) => DPRO.set('northDeg', ((Number(e.target.value) || 0) % 360 + 360) % 360));
    ['company', 'contact', 'sheet', 'designer', 'notes'].forEach((k) => on('px-' + k, 'change', (e) => { DPRO.extras.titleBlock[k] = e.target.value; markDirty(); }));
  });

  // ======================= Open / save hooks =======================
  window.openDesign = function (design) {
    const data = design && design.canvas_data && typeof design.canvas_data === 'object' ? design.canvas_data : {};
    DPRO.extras = data.extras && typeof data.extras === 'object' ? JSON.parse(JSON.stringify(data.extras)) : {};
    DPRO.applyDefaults();
    O.openDesign(design);
    DPRO.applyTheme();
    drawGrid();
    DPRO.placeDecor(true);
    DPRO.resetHistory();
    DPRO.updateToolbarState();
    if (stage) stage.draggable(activeTool === 'pan');
    DPRO.openHooks.forEach((fn) => { try { fn(); } catch (e) { console.error(e); } });
  };
  if (window.api && window.api.designs && !window.api.designs.__dpro) {
    const upd = window.api.designs.update;
    window.api.designs.update = function (id, u) {
      if (u && u.canvas_data && typeof u.canvas_data === 'object') u.canvas_data.extras = DPRO.extras;
      return upd.call(window.api.designs, id, u);
    };
    window.api.designs.__dpro = true;
  }
})();
