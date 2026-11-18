// ============================================================================
// design-lighting.js — lighting design for the Site Design editor.
//
// Three kinds of lighting, all drawn on the same plan:
//   * Permanent  — permanent LED track along rooflines / soffits
//   * Holiday    — Christmas lights: C9 / C7 / mini / icicle / net, tree wraps,
//                  wreaths, garland
//   * Landscape  — low-voltage path, up, spot and well lights
// Draw runs along edges (or click a building to trace its roofline in one
// tap), place fixtures, flip to NIGHT VIEW to see it glow, and get a materials
// list (feet, strands, bulbs, clips, watts, circuits, transformer size) that
// can carry your prices.
//
// Wattages, strand lengths and spacings below are TYPICAL LED values so the
// numbers are sensible out of the box. Every one of them can be overridden in
// the Lighting tab to match the products you actually buy.
// ============================================================================
(function () {
  'use strict';
  const DPRO = window.DPRO;
  if (!DPRO) return;
  const $ = (id) => document.getElementById(id);
  const esc = DPRO.esc;
  const fmt = DPRO.fmtFtIn;

  const COLORS = {
    warm: { name: 'Warm white', hex: '#FFD08A' }, cool: { name: 'Cool white', hex: '#DDEBFF' },
    red: { name: 'Red', hex: '#FF3B30' }, green: { name: 'Green', hex: '#2EC746' }, blue: { name: 'Blue', hex: '#2F6BFF' },
    purple: { name: 'Purple', hex: '#A24BFF' }, orange: { name: 'Orange', hex: '#FF8A1E' },
    multi: { name: 'Multi-color', hex: '#FFFFFF', multi: ['#FF3B30', '#2EC746', '#2F6BFF', '#FFD08A', '#FF8A1E'] },
  };

  // kind: run (drawn along a line, priced per foot) | point (placed, priced each)
  const PRODUCTS = [
    // ---- Permanent ----
    { key: 'perm-track', mode: 'perm', kind: 'run', name: 'Permanent LED track (roofline)', color: 'warm', wattsPerFt: 1.2, maxRunFt: 100, unit: 'ft', note: 'Programmable color track mounted under the fascia' },
    { key: 'perm-accent', mode: 'perm', kind: 'run', name: 'Permanent accent / soffit strip', color: 'warm', wattsPerFt: 0.8, maxRunFt: 100, unit: 'ft', note: 'Soffit, gable, fascia accent' },
    { key: 'perm-controller', mode: 'perm', kind: 'point', name: 'Permanent controller / power supply', color: 'cool', watts: 0, unit: 'ea', sym: 'ctrl' },
    // ---- Holiday ----
    { key: 'xmas-c9', mode: 'holiday', kind: 'run', name: 'C9 LED strand (12" spacing)', color: 'multi', spacingIn: 12, strandFt: [25, 50, 100], wattsPerFt: 0.5, unit: 'ft', clips: 1 },
    { key: 'xmas-c7', mode: 'holiday', kind: 'run', name: 'C7 LED strand (12" spacing)', color: 'warm', spacingIn: 12, strandFt: [25, 50, 100], wattsPerFt: 0.4, unit: 'ft', clips: 1 },
    { key: 'xmas-mini', mode: 'holiday', kind: 'run', name: 'Mini LED string (4" spacing)', color: 'warm', spacingIn: 4, strandFt: [25, 50, 100], wattsPerFt: 0.15, unit: 'ft', clips: 0.5 },
    { key: 'xmas-icicle', mode: 'holiday', kind: 'run', name: 'Icicle LED strand', color: 'cool', spacingIn: 4, strandFt: [10, 25], wattsPerFt: 0.5, unit: 'ft', clips: 1 },
    { key: 'xmas-rope', mode: 'holiday', kind: 'run', name: 'LED rope light', color: 'warm', spacingIn: 2, strandFt: [25, 50, 150], wattsPerFt: 1.2, unit: 'ft', clips: 0.5 },
    { key: 'xmas-pixel', mode: 'holiday', kind: 'run', name: 'Commercial pixel string (RGB)', color: 'multi', spacingIn: 4, strandFt: [50, 100], wattsPerFt: 1.5, unit: 'ft', clips: 1 },
    { key: 'xmas-garland', mode: 'holiday', kind: 'run', name: 'Lighted garland', color: 'warm', spacingIn: 6, strandFt: [9, 25], wattsPerFt: 0.4, unit: 'ft', clips: 0.5 },
    { key: 'wreath', mode: 'holiday', kind: 'point', name: 'Lighted wreath', color: 'warm', watts: 6, unit: 'ea', sym: 'wreath' },
    { key: 'bow', mode: 'holiday', kind: 'point', name: 'Bow', color: 'red', watts: 0, unit: 'ea', sym: 'bow' },
    { key: 'stakes', mode: 'holiday', kind: 'point', name: 'Ground stake lights (set of 10)', color: 'multi', watts: 5, unit: 'set', sym: 'stakes', throwFt: 0 },
    { key: 'projector', mode: 'holiday', kind: 'point', name: 'Holiday projector', color: 'red', watts: 15, throwFt: 22, beamDeg: 60, unit: 'ea', sym: 'proj' },
    { key: 'outlet', mode: 'holiday', kind: 'point', name: 'Power point / outlet', color: 'cool', watts: 0, unit: 'ea', sym: 'outlet' },
    // ---- Landscape (low voltage) ----
    { key: 'path-light', mode: 'landscape', kind: 'point', name: 'Path light', color: 'warm', watts: 4, throwFt: 6, beamDeg: 360, unit: 'ea', sym: 'path' },
    { key: 'up-light', mode: 'landscape', kind: 'point', name: 'Up light (trees / walls)', color: 'warm', watts: 7, throwFt: 12, beamDeg: 50, unit: 'ea', sym: 'up' },
    { key: 'spot-light', mode: 'landscape', kind: 'point', name: 'Spot / bullet light', color: 'warm', watts: 7, throwFt: 18, beamDeg: 30, unit: 'ea', sym: 'up' },
    { key: 'well-light', mode: 'landscape', kind: 'point', name: 'In-ground well light', color: 'warm', watts: 8, throwFt: 10, beamDeg: 60, unit: 'ea', sym: 'well' },
    { key: 'wall-wash', mode: 'landscape', kind: 'point', name: 'Wall wash light', color: 'warm', watts: 6, throwFt: 8, beamDeg: 120, unit: 'ea', sym: 'wash' },
    { key: 'step-light', mode: 'landscape', kind: 'point', name: 'Step / hardscape light', color: 'warm', watts: 2, throwFt: 4, beamDeg: 120, unit: 'ea', sym: 'step' },
    { key: 'transformer', mode: 'landscape', kind: 'point', name: 'Transformer (12V)', color: 'cool', watts: 0, unit: 'ea', sym: 'xfmr' },
  ];
  const MODE_LABEL = { perm: 'Permanent lighting', holiday: 'Holiday / Christmas', landscape: 'Landscape lighting (low voltage)' };
  const P = (key) => PRODUCTS.find((p) => p.key === key) || null;
  DPRO.light = { PRODUCTS, COLORS, P, MODE_LABEL };

  // ---------- settings (saved with the design) ----------
  function S() {
    const x = DPRO.extras;
    if (!x.lighting || typeof x.lighting !== 'object') x.lighting = {};
    const L = x.lighting;
    if (L.prices == null) L.prices = {}; if (L.strand == null) L.strand = {}; if (L.watts == null) L.watts = {};
    if (L.trunkDiaIn == null) L.trunkDiaIn = 8; if (L.trunkSpacingIn == null) L.trunkSpacingIn = 4;
    if (L.canopyDensity == null) L.canopyDensity = 0.8; if (L.circuitAmps == null) L.circuitAmps = 15; if (L.reservePct == null) L.reservePct = 20;
    return L;
  }
  DPRO.light.settings = S;
  const wattsPerFt = (p) => (S().watts[p.key] != null && S().watts[p.key] !== '' ? Number(S().watts[p.key]) : p.wattsPerFt);
  const wattsEach = (p) => (S().watts[p.key] != null && S().watts[p.key] !== '' ? Number(S().watts[p.key]) : p.watts || 0);
  const strandFt = (p) => Number(S().strand[p.key]) || (p.strandFt ? p.strandFt[p.strandFt.length > 1 ? 1 : 0] : 0);
  function colorOf(el, prod) {
    const k = el.color || prod.color || 'warm';
    return COLORS[k] ? { key: k, hex: COLORS[k].hex, multi: COLORS[k].multi || null } : { key: 'custom', hex: k, multi: null };
  }
  DPRO.light.colorOf = colorOf;
  const layerKeyFor = (el) => 'light-' + ((P(el.key) || {}).mode || 'holiday');
  const isNight = () => !!DPRO.extras.night;
  function rgba(hex, a) { const h = String(hex).replace('#', ''); return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`; }

  // ======================= Night view =======================
  DPRO.buildNightOverlay = function () {
    if (!DPRO.lightLayer) return;
    DPRO.nightRect = new Konva.Rect({ x: -9000, y: -9000, width: 18000, height: 18000, fill: '#060A18', opacity: isNight() ? 0.72 : 0, listening: false });
    DPRO.lightLayer.add(DPRO.nightRect);
    DPRO.nightRect.moveToBottom();
  };
  DPRO.setNight = function (on) {
    DPRO.extras.night = !!on;
    if (DPRO.nightRect) DPRO.nightRect.opacity(on ? 0.72 : 0);
    markDirty();
    renderAllElements();
    if (DPRO.nightRect) DPRO.nightRect.moveToBottom();
    DPRO.lightLayer.batchDraw();
    const b = $('btn-dpro-night'); if (b) { b.textContent = on ? 'Night view: on' : 'Night view: off'; b.classList.toggle('is-active', !!on); }
  };
  DPRO.openHooks.push(() => {
    if (DPRO.nightRect) { DPRO.nightRect.opacity(isNight() ? 0.72 : 0); DPRO.nightRect.moveToBottom(); DPRO.lightLayer.batchDraw(); }
    const b = $('btn-dpro-night'); if (b) { b.textContent = isNight() ? 'Night view: on' : 'Night view: off'; b.classList.toggle('is-active', isNight()); }
  });

  // ======================= Light runs =======================
  DPRO.types.lightrun = {
    layer: 'light',
    layerKey: layerKeyFor,
    build(el) {
      const prod = P(el.key) || P('xmas-c9');
      const col = colorOf(el, prod);
      const night = isNight();
      const g = new Konva.Group({ draggable: false });
      const ppf = pxPerFt;
      const spacingPx = Math.max(3.5, ((prod.spacingIn || 12) / 12) * ppf);
      const bulbW = Math.max(3.5, 0.18 * ppf);
      const viz = (cfg) => g.add(new Konva.Line(Object.assign({ points: el.points, listening: false, name: 'viz', lineCap: 'round', lineJoin: 'round' }, cfg)));
      if (prod.mode === 'perm') {
        if (night) viz({ stroke: col.hex, strokeWidth: bulbW * 5, opacity: 0.3, globalCompositeOperation: 'lighter', shadowColor: col.hex, shadowBlur: 22, shadowOpacity: 1 });
        viz({ stroke: night ? '#2A2A2A' : '#CFCBC0', strokeWidth: Math.max(4, 0.32 * ppf), lineCap: 'butt' });
        viz({ stroke: col.hex, strokeWidth: Math.max(2, 0.16 * ppf), shadowColor: night ? col.hex : undefined, shadowBlur: night ? 12 : 0, shadowOpacity: 1 });
      } else {
        viz({ stroke: night ? 'rgba(20,20,20,0.9)' : '#6B6B66', strokeWidth: 1.2, lineCap: 'butt' });
        const colors = col.multi || [col.hex];
        const n = colors.length;
        if (night) {
          colors.forEach((c, i) => viz({ stroke: c, strokeWidth: bulbW * 4.5, opacity: 0.35, dash: [0.01, spacingPx * n - 0.01], dashOffset: -i * spacingPx, globalCompositeOperation: 'lighter', shadowColor: c, shadowBlur: 14, shadowOpacity: 1 }));
        }
        colors.forEach((c, i) => viz({ stroke: c, strokeWidth: bulbW, dash: [0.01, spacingPx * n - 0.01], dashOffset: -i * spacingPx, shadowColor: night ? c : undefined, shadowBlur: night ? 8 : 0, shadowOpacity: 1 }));
      }
      const main = new Konva.Line({ points: el.points, stroke: 'rgba(0,0,0,0)', strokeWidth: 12, hitStrokeWidth: 16, name: 'main', draggable: activeTool === 'select' });
      main.on('dragend', () => { onShapeDragEnd(el, main); DPRO.rerender(el); });
      attachSelectHandler(main, el);
      g.add(main);
      return g;
    },
    props(el, box) {
      const prod = P(el.key) || P('xmas-c9');
      const runs = PRODUCTS.filter((p) => p.kind === 'run');
      const ft = polylineLengthFt(el.points);
      const strands = prod.mode === 'holiday' ? Math.ceil(ft / strandFt(prod)) : 0;
      box.innerHTML = DPRO.fieldHtml('Product', `<select id="pl-prod">${runs.map((p) => `<option value="${p.key}" ${p.key === el.key ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select>`) +
        DPRO.fieldHtml('Color', `<select id="pl-color">${Object.keys(COLORS).map((k) => `<option value="${k}" ${(el.color || prod.color) === k ? 'selected' : ''}>${COLORS[k].name}</option>`).join('')}</select>`) +
        DPRO.fieldHtml('Length', `<div><strong>${ft.toFixed(1)} ft</strong>${strands ? ` &middot; ${strands} &times; ${strandFt(prod)} ft strand${strands === 1 ? '' : 's'}` : ''}</div>`) +
        DPRO.fieldHtml('Load', `<div>${(ft * wattsPerFt(prod)).toFixed(0)} W (${((ft * wattsPerFt(prod)) / 120).toFixed(1)} A)</div>`) +
        '<p class="empty-sub">Drag the white dots to reshape the run. Click a small dot to add a point, double-click a dot to remove it.</p>';
      $('pl-prod').addEventListener('change', (e) => { el.key = e.target.value; const np = P(el.key); el.color = np.color; DPRO.rerender(el); markDirty(); DPRO.runLegend(); DPRO.renderProps(el); });
      $('pl-color').addEventListener('change', (e) => { el.color = e.target.value; DPRO.rerender(el); markDirty(); });
    },
  };

  // ======================= Light fixtures (points) =======================
  function symbolFor(prod, col, night) {
    const g = new Konva.Group({ listening: false });
    const hex = col.hex, edge = night ? 'rgba(255,255,255,0.8)' : '#1E1E1C';
    const fill = night ? hex : hex;
    const stroke = { stroke: edge, strokeWidth: 1 };
    const glow = night ? { shadowColor: hex, shadowBlur: 14, shadowOpacity: 1 } : {};
    switch (prod.sym) {
      case 'path': g.add(new Konva.Circle(Object.assign({ radius: 5, fill }, stroke, glow))); g.add(new Konva.Circle({ radius: 1.8, fill: '#1E1E1C' })); break;
      case 'up': g.add(new Konva.RegularPolygon(Object.assign({ sides: 3, radius: 7, fill }, stroke, glow))); break;
      case 'well': g.add(new Konva.Circle(Object.assign({ radius: 6, fill: '#3A3A38' }, stroke))); g.add(new Konva.Circle(Object.assign({ radius: 3, fill }, glow))); break;
      case 'wash': g.add(new Konva.Rect(Object.assign({ x: -8, y: -3, width: 16, height: 6, fill }, stroke, glow))); break;
      case 'step': g.add(new Konva.Rect(Object.assign({ x: -4, y: -4, width: 8, height: 8, fill }, stroke, glow))); break;
      case 'xfmr': g.add(new Konva.Rect({ x: -9, y: -7, width: 18, height: 14, fill: '#2B2B2B', stroke: '#F2F2F2', strokeWidth: 1 })); g.add(new Konva.Text({ text: 'T', x: -9, y: -6, width: 18, align: 'center', fontSize: 12, fontStyle: 'bold', fill: '#FFD08A' })); break;
      case 'ctrl': g.add(new Konva.Rect({ x: -9, y: -7, width: 18, height: 14, fill: '#2B2B2B', stroke: '#F2F2F2', strokeWidth: 1 })); g.add(new Konva.Text({ text: 'C', x: -9, y: -6, width: 18, align: 'center', fontSize: 12, fontStyle: 'bold', fill: '#9BD1FF' })); break;
      case 'outlet': g.add(new Konva.Rect({ x: -7, y: -7, width: 14, height: 14, fill: '#FFFFFF', stroke: '#1E6BFF', strokeWidth: 2 })); g.add(new Konva.Line({ points: [-3, -3, -3, 1, 3, -3, 3, 1], stroke: '#1E6BFF', strokeWidth: 1.6 })); g.add(new Konva.Line({ points: [-2, 4, 2, 4], stroke: '#1E6BFF', strokeWidth: 1.6 })); break;
      case 'wreath': g.add(new Konva.Circle(Object.assign({ radius: 8, stroke: '#2F6B3A', strokeWidth: 4 }, glow))); [0, 1, 2, 3, 4].forEach((i) => g.add(new Konva.Circle({ x: Math.cos(i * 1.256) * 8, y: Math.sin(i * 1.256) * 8, radius: 1.8, fill: night ? '#FFD08A' : '#D9342B' }))); break;
      case 'bow': g.add(new Konva.Line({ points: [-7, -5, 0, 0, -7, 5], closed: true, fill: '#D9342B', stroke: '#7A1410', strokeWidth: 1 })); g.add(new Konva.Line({ points: [7, -5, 0, 0, 7, 5], closed: true, fill: '#D9342B', stroke: '#7A1410', strokeWidth: 1 })); g.add(new Konva.Circle({ radius: 2, fill: '#7A1410' })); break;
      case 'stakes': { const cs = col.multi || [hex]; for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; g.add(new Konva.Circle(Object.assign({ x: Math.cos(a) * 7, y: Math.sin(a) * 7, radius: 2.4, fill: cs[i % cs.length] }, glow))); } g.add(new Konva.Circle({ radius: 1.5, fill: '#1E1E1C' })); break; }
      case 'proj': g.add(new Konva.Rect(Object.assign({ x: -7, y: -5, width: 14, height: 10, fill: '#2B2B2B' }, { stroke: hex, strokeWidth: 1.5 }))); g.add(new Konva.Circle(Object.assign({ x: 7, radius: 3, fill: hex }, glow))); break;
      default: g.add(new Konva.Circle(Object.assign({ radius: 5, fill }, stroke, glow)));
    }
    return g;
  }
  DPRO.types.lightpoint = {
    layer: 'light',
    layerKey: layerKeyFor,
    build(el) {
      const prod = P(el.key) || P('path-light');
      const col = colorOf(el, prod);
      const night = isNight();
      const g = new Konva.Group({ x: el.x, y: el.y, draggable: activeTool === 'select' });
      g.add(new Konva.Circle({ radius: 11, fill: 'rgba(0,0,0,0)' }));
      const throwPx = (prod.throwFt || 0) * pxPerFt;
      if (throwPx > 0) {
        const beam = prod.beamDeg || 360, rot = el.rotationDeg || 0;
        const stops = [0, rgba(col.hex, night ? 0.85 : 0.2), 0.6, rgba(col.hex, night ? 0.3 : 0.1), 1, rgba(col.hex, 0)];
        const common = { fillRadialGradientStartPoint: { x: 0, y: 0 }, fillRadialGradientStartRadius: 0, fillRadialGradientEndPoint: { x: 0, y: 0 }, fillRadialGradientEndRadius: throwPx, fillRadialGradientColorStops: stops, listening: false };
        if (night) common.globalCompositeOperation = 'lighter';
        if (beam >= 359) g.add(new Konva.Circle(Object.assign({ radius: throwPx }, common)));
        else g.add(new Konva.Wedge(Object.assign({ radius: throwPx, angle: beam, rotation: rot - beam / 2 }, common)));
        if (!night && beam < 359) g.add(new Konva.Wedge({ radius: throwPx, angle: beam, rotation: rot - beam / 2, stroke: rgba(col.hex, 0.6), strokeWidth: 0.8, dash: [3, 3], listening: false }));
      }
      const sym = symbolFor(prod, col, night);
      if (['up', 'wash', 'proj'].includes(prod.sym)) sym.rotation((el.rotationDeg || 0) + (prod.sym === 'up' ? 90 : 0));
      g.add(sym);
      if (el.label) g.add(new Konva.Text({ text: el.label, x: 9, y: -6, fontSize: 10, fontStyle: 'bold', fill: night ? '#FFFFFF' : DPRO.ink(), stroke: night ? '#000' : DPRO.halo(), strokeWidth: 3, fillAfterStrokeEnabled: true, listening: false }));
      if ((el.qty || 1) > 1) g.add(new Konva.Text({ text: '×' + el.qty, x: 9, y: 4, fontSize: 10, fontStyle: 'bold', fill: night ? '#FFFFFF' : DPRO.ink(), listening: false }));
      g.on('dragend', () => { el.x = g.x(); el.y = g.y(); markDirty(); if (selectedElementId === el.id) positionSelectionRing(el); });
      attachSelectHandler(g, el);
      return g;
    },
    props(el, box) {
      const prod = P(el.key) || P('path-light');
      const pts = PRODUCTS.filter((p) => p.kind === 'point');
      let h = DPRO.fieldHtml('Fixture', `<select id="pl-prod">${['perm', 'holiday', 'landscape'].map((m) => `<optgroup label="${MODE_LABEL[m]}">${pts.filter((p) => p.mode === m).map((p) => `<option value="${p.key}" ${p.key === el.key ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</optgroup>`).join('')}</select>`);
      h += DPRO.fieldHtml('Color', `<select id="pl-color">${Object.keys(COLORS).map((k) => `<option value="${k}" ${(el.color || prod.color) === k ? 'selected' : ''}>${COLORS[k].name}</option>`).join('')}</select>`);
      if (prod.throwFt || ['up', 'wash', 'proj'].includes(prod.sym)) h += DPRO.fieldHtml('Aim direction (degrees)', `<input id="pl-rot" type="number" min="0" max="359" step="15" value="${el.rotationDeg || 0}" />`);
      h += DPRO.fieldHtml('Quantity', `<input id="pl-qty" type="number" min="1" step="1" value="${el.qty || 1}" />`);
      h += DPRO.fieldHtml('Label (optional)', `<input id="pl-label" type="text" value="${esc(el.label || '')}" placeholder="e.g. Front walk, Maple" />`);
      h += `<p class="empty-sub">${wattsEach(prod) ? `${wattsEach(prod)} W each` : 'No load'}. Edit wattage in the Lighting tab.</p>`;
      box.innerHTML = h;
      $('pl-prod').addEventListener('change', (e) => { el.key = e.target.value; el.color = P(el.key).color; DPRO.rerender(el); markDirty(); DPRO.runLegend(); DPRO.renderProps(el); });
      $('pl-color').addEventListener('change', (e) => { el.color = e.target.value; DPRO.rerender(el); markDirty(); });
      const r = $('pl-rot'); if (r) r.addEventListener('change', (e) => { el.rotationDeg = Number(e.target.value) || 0; DPRO.rerender(el); markDirty(); });
      $('pl-qty').addEventListener('change', (e) => { el.qty = Math.max(1, Math.round(Number(e.target.value) || 1)); DPRO.rerender(el); markDirty(); DPRO.runLegend(); });
      $('pl-label').addEventListener('change', (e) => { el.label = e.target.value; DPRO.rerender(el); markDirty(); });
    },
  };

  // ======================= Tree / shrub lighting =======================
  DPRO.plantDecor = DPRO.plantDecor || [];
  DPRO.plantDecor.push(function (group, el, plant, radius) {
    if (!el.holiday || (!el.holiday.trunk && !el.holiday.canopy)) return;
    const hex = (COLORS[el.holiday.color] || COLORS.warm).hex;
    const night = isNight();
    if (el.holiday.canopy) {
      group.add(new Konva.Circle({ radius: radius * 0.92, stroke: hex, strokeWidth: Math.max(2, radius * 0.06), dash: [0.01, Math.max(5, radius * 0.22)], lineCap: 'round', listening: false, shadowColor: night ? hex : undefined, shadowBlur: night ? 12 : 0, shadowOpacity: 1 }));
      group.add(new Konva.Circle({ radius: radius * 0.6, stroke: hex, strokeWidth: Math.max(2, radius * 0.05), dash: [0.01, Math.max(5, radius * 0.2)], lineCap: 'round', listening: false }));
      if (night) group.add(new Konva.Circle({ radius: radius, fill: rgba(hex, 0.25), globalCompositeOperation: 'lighter', listening: false }));
    }
    if (el.holiday.trunk) group.add(new Konva.Circle({ radius: Math.max(3, radius * 0.1), stroke: hex, strokeWidth: 2, listening: false, shadowColor: night ? hex : undefined, shadowBlur: night ? 10 : 0, shadowOpacity: 1 }));
  });
  DPRO.propHooks.push(function (el, box) {
    if (el.type === 'plant') {
      const p = window.DESIGN_CATALOG.PLANT_CATALOG.find((x) => x.key === el.plantKey) || {};
      if (p.category !== 'Tree' && p.category !== 'Shrub') return;
      const cur = el.holiday ? (el.holiday.trunk && el.holiday.canopy ? 'both' : el.holiday.trunk ? 'trunk' : el.holiday.canopy ? 'canopy' : 'none') : 'none';
      box.insertAdjacentHTML('beforeend', DPRO.fieldHtml('Holiday lights on this plant', `<select id="pf-hol"><option value="none" ${cur === 'none' ? 'selected' : ''}>None</option><option value="trunk" ${cur === 'trunk' ? 'selected' : ''}>Trunk wrap</option><option value="canopy" ${cur === 'canopy' ? 'selected' : ''}>Canopy wrap</option><option value="both" ${cur === 'both' ? 'selected' : ''}>Trunk + canopy</option></select>`) +
        DPRO.fieldHtml('Light color', `<select id="pf-holc">${Object.keys(COLORS).map((k) => `<option value="${k}" ${((el.holiday && el.holiday.color) || 'warm') === k ? 'selected' : ''}>${COLORS[k].name}</option>`).join('')}</select>`));
      const apply = () => {
        const v = $('pf-hol').value;
        el.holiday = v === 'none' ? null : { trunk: v === 'trunk' || v === 'both', canopy: v === 'canopy' || v === 'both', color: $('pf-holc').value };
        DPRO.rerender(el); markDirty(); DPRO.runLegend();
      };
      $('pf-hol').addEventListener('change', apply); $('pf-holc').addEventListener('change', apply);
    }
    if (el.type === 'area' && el.subtype === 'building') {
      const runs = PRODUCTS.filter((p) => p.kind === 'run' && p.mode !== 'landscape');
      box.insertAdjacentHTML('beforeend', DPRO.fieldHtml('Trace the roofline with lights', `<select id="pf-roofprod">${['perm', 'holiday'].map((m) => `<optgroup label="${MODE_LABEL[m]}">${runs.filter((p) => p.mode === m).map((p) => `<option value="${p.key}">${esc(p.name)}</option>`).join('')}</optgroup>`).join('')}</select><button type="button" class="btn btn-ghost btn-small" id="pf-roofgo" style="margin-top:6px;">Add roofline run</button><p class="empty-sub">Adds a light run around the whole outline. Reshape it afterward, or delete the sides you don't need.</p>`));
      $('pf-roofgo').addEventListener('click', () => {
        const key = $('pf-roofprod').value, prod = P(key);
        const pts = el.points.slice(); pts.push(el.points[0], el.points[1]);
        addElement({ id: uid(), type: 'lightrun', key, color: prod.color, points: pts });
      });
    }
  });

  // ======================= Tools, catalog, toolbar =======================
  const armed = { run: 'xmas-c9', point: 'path-light' };
  DPRO.light.armed = armed;
  DPRO.hints.lrun = 'Click along the roofline or edge. Enter to finish, Esc to cancel. Hold Shift for straight lines. Pick the product in the Catalog tab.';
  DPRO.hints.lpoint = 'Click to place the fixture. Pick which one in the Catalog tab.';
  DPRO.drawHandlers.lrun = function (pts) {
    const key = armed.run, prod = P(key);
    addElement({ id: uid(), type: 'lightrun', key, color: prod.color, points: pts });
  };
  DPRO.pointTools.lpoint = function (pos) {
    const key = armed.point, prod = P(key);
    addElement({ id: uid(), type: 'lightpoint', key, color: prod.color, x: pos.x, y: pos.y, rotationDeg: 0, qty: 1 });
  };

  const catPanel = $('design-panel-catalog');
  const lightSec = document.createElement('div');
  lightSec.id = 'design-catalog-light'; lightSec.className = 'design-catalog-section'; lightSec.hidden = true;
  if (catPanel) catPanel.appendChild(lightSec);
  function renderLightCatalog() {
    let html = '';
    ['perm', 'holiday', 'landscape'].forEach((m) => {
      html += `<div class="design-tool-group-label" style="margin-top:8px;">${MODE_LABEL[m]}</div>`;
      PRODUCTS.filter((p) => p.mode === m).forEach((p) => {
        const on = armed[p.kind] === p.key && ((p.kind === 'run' && activeTool === 'lrun') || (p.kind === 'point' && activeTool === 'lpoint'));
        const c = COLORS[p.color];
        const spec = p.kind === 'run' ? `drawn along a line${p.wattsPerFt ? ` · ${wattsPerFt(p)} W/ft` : ''}` : `placed${wattsEach(p) ? ` · ${wattsEach(p)} W` : ''}`;
        html += `<div class="design-catalog-item${on ? ' is-armed' : ''}" data-lkey="${p.key}"><span class="design-catalog-swatch" style="background:${c.multi ? 'linear-gradient(90deg,#FF3B30,#2EC746,#2F6BFF)' : c.hex}"></span><span><strong>${esc(p.name)}</strong><span class="design-catalog-item-sub">${spec}</span></span></div>`;
      });
    });
    lightSec.innerHTML = html;
    lightSec.querySelectorAll('[data-lkey]').forEach((n) => n.addEventListener('click', () => {
      const p = P(n.dataset.lkey); armed[p.kind] = p.key;
      setActiveTool(p.kind === 'run' ? 'lrun' : 'lpoint');
    }));
  }
  DPRO.toolHook = function (tool) {
    if (tool === 'lrun' || tool === 'lpoint') {
      renderLightCatalog();
      lightSec.hidden = false;
      const empty = $('design-catalog-empty'); if (empty) empty.hidden = true;
      switchSidePanel('catalog');
    }
  };
  DPRO.addToolGroup('dpro-group-lighting', 'Lighting', [
    { tool: 'lrun', label: 'Light run (line)', title: 'Roofline, eave, fence or tree-line lights drawn along a path' },
    { tool: 'lpoint', label: 'Light fixture', title: 'Path, up, spot, wreath, outlet, controller...' },
    { id: 'btn-dpro-night', label: 'Night view: off', title: 'See the design lit at night', onclick: () => DPRO.setNight(!isNight()) },
    { id: 'btn-dpro-lightlist', label: 'Lighting list & prices', onclick: () => switchSidePanel('lighting') },
  ]);
  [['light-perm', 'Permanent lighting'], ['light-holiday', 'Holiday lighting'], ['light-landscape', 'Landscape lighting']].forEach(([k, l]) => DPRO.addLayer(k, l));

  // ======================= Material takeoff =======================
  const XFMR = [100, 150, 200, 300, 600, 900, 1200];
  function plantOf(key) { return window.DESIGN_CATALOG.PLANT_CATALOG.find((p) => p.key === key); }
  function trunkFt(p) { const L = S(); const h = Math.min(8, Math.max(3, p.heightFt * 0.3)); return Math.PI * (L.trunkDiaIn / 12) * ((h * 12) / L.trunkSpacingIn); }
  function canopyFt(p) { return Math.PI * (p.spreadFt / 2) * (p.heightFt * 0.6) * S().canopyDensity; }
  function takeoff() {
    const L = S();
    const runs = elements.filter((e) => e.type === 'lightrun');
    const pts = elements.filter((e) => e.type === 'lightpoint');
    const trees = elements.filter((e) => e.type === 'plant' && e.holiday && (e.holiday.trunk || e.holiday.canopy));
    const ft = new Map(); const qty = new Map();
    runs.forEach((r) => ft.set(r.key, (ft.get(r.key) || 0) + polylineLengthFt(r.points)));
    let trunkTot = 0, canopyTot = 0, trunkN = 0, canopyN = 0;
    trees.forEach((t) => {
      const p = plantOf(t.plantKey); if (!p) return;
      if (t.holiday.trunk && p.category === 'Tree') { trunkTot += trunkFt(p); trunkN += 1; }
      if (t.holiday.canopy) { canopyTot += canopyFt(p); canopyN += 1; }
    });
    if (trunkTot + canopyTot > 0) ft.set('xmas-mini', (ft.get('xmas-mini') || 0) + trunkTot + canopyTot);
    pts.forEach((e) => qty.set(e.key, (qty.get(e.key) || 0) + (e.qty || 1)));
    const rows = []; const modeW = { perm: 0, holiday: 0, landscape: 0 };
    ft.forEach((len, key) => {
      const p = P(key); if (!p) return;
      const w = len * wattsPerFt(p); modeW[p.mode] += w;
      let detail = '';
      if (p.mode === 'holiday') {
        const sf = strandFt(p);
        detail = `${Math.ceil(len / sf)} × ${sf} ft strands (${Math.ceil(len / sf) * sf} ft)`;
        const sp = Number(S().spacing && S().spacing[key]) || p.spacingIn;
        detail += ` · about ${Math.round((len * 12) / sp)} bulbs`;
        if (p.clips) detail += ` · ${Math.ceil(len * p.clips)} clips`;
      } else {
        detail = `${Math.ceil(len / p.maxRunFt)} power supply/controller feed${Math.ceil(len / p.maxRunFt) === 1 ? '' : 's'} (about ${p.maxRunFt} ft each)`;
      }
      if (key === 'xmas-mini' && (trunkTot || canopyTot)) detail += ` · includes ${trunkN ? `${trunkN} trunk wrap${trunkN === 1 ? '' : 's'} (${trunkTot.toFixed(0)} ft)` : ''}${trunkN && canopyN ? ' and ' : ''}${canopyN ? `${canopyN} canopy wrap${canopyN === 1 ? '' : 's'} (${canopyTot.toFixed(0)} ft)` : ''}`;
      rows.push({ mode: p.mode, key, name: p.name, qty: `${len.toFixed(0)} ft`, detail, watts: w, priceQty: len, unit: 'ft' });
    });
    qty.forEach((n, key) => {
      const p = P(key); if (!p) return;
      const w = n * wattsEach(p); modeW[p.mode] += w;
      rows.push({ mode: p.mode, key, name: p.name, qty: `${n} ${p.unit}`, detail: wattsEach(p) ? `${wattsEach(p)} W each` : '', watts: w, priceQty: n, unit: p.unit });
    });
    const perCircuit = L.circuitAmps * 120 * 0.8;
    const circuits = { perm: Math.ceil(modeW.perm / perCircuit), holiday: Math.ceil(modeW.holiday / perCircuit) };
    const need = modeW.landscape / (1 - L.reservePct / 100);
    const xf = modeW.landscape > 0 ? (XFMR.find((s) => s >= need) || 1200) : 0;
    const xfCount = modeW.landscape > 0 && need > 1200 ? Math.ceil(need / 1200) : (xf ? 1 : 0);
    let subtotal = 0, anyPrice = false;
    rows.forEach((r) => { const pr = Number(L.prices[r.key]); if (pr > 0) { r.price = pr; r.total = pr * r.priceQty; subtotal += r.total; anyPrice = true; } });
    return { rows, modeW, circuits, xf, xfCount, subtotal, anyPrice, empty: rows.length === 0 };
  }
  DPRO.light.takeoff = takeoff;
  const money = (n) => '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function totalsHtml(t, cls) {
    const row = (label, val) => (cls === 'design-print-row' ? `<div class="design-print-row"><span>${label}</span><span>${val}</span></div>` : `<div class="dpro-load"><strong>${label}</strong><br>${val}</div>`);
    let h = '';
    if (t.modeW.holiday > 0) h += row('Holiday load', `${t.modeW.holiday.toFixed(0)} W (${(t.modeW.holiday / 120).toFixed(1)} A) &mdash; needs ${t.circuits.holiday} circuit${t.circuits.holiday === 1 ? '' : 's'}`);
    if (t.modeW.perm > 0) h += row('Permanent load', `${t.modeW.perm.toFixed(0)} W (${(t.modeW.perm / 120).toFixed(1)} A) &mdash; ${t.circuits.perm} circuit${t.circuits.perm === 1 ? '' : 's'}`);
    if (t.modeW.landscape > 0) h += row('Landscape load', `${t.modeW.landscape.toFixed(0)} W &mdash; ${t.xfCount > 1 ? t.xfCount + ' \u00d7 ' : ''}${t.xf} W transformer`);
    return h;
  }

  DPRO.legendHooks.push(function () {
    const t = takeoff(); if (t.empty) return '';
    let h = '<div class="design-legend-group"><h4>Lighting</h4>';
    t.rows.forEach((r) => { h += `<div class="design-legend-row"><span>${esc(r.name)}</span><span>${esc(r.qty)}</span></div>`; });
    h += totalsHtml(t, 'design-legend-row');
    if (t.anyPrice) h += `<div class="design-legend-row design-legend-total"><span>Lighting subtotal</span><span>${money(t.subtotal)}</span></div>`;
    return h + '</div>';
  });
  DPRO.printHooks.push(function () {
    const t = takeoff(); if (t.empty) return '';
    let h = '<div class="design-print-section dpro-takeoff"><h3>Lighting materials</h3><table><thead><tr><th>Item</th><th>Qty</th><th>Details</th>' + (t.anyPrice ? '<th>Price</th>' : '') + '</tr></thead><tbody>';
    ['perm', 'holiday', 'landscape'].forEach((m) => {
      const rs = t.rows.filter((r) => r.mode === m); if (!rs.length) return;
      h += `<tr><td colspan="${t.anyPrice ? 4 : 3}" style="background:#f4f4f4;font-weight:700;">${MODE_LABEL[m]}</td></tr>`;
      rs.forEach((r) => { h += `<tr><td>${esc(r.name)}</td><td>${esc(r.qty)}</td><td>${esc(r.detail)}</td>${t.anyPrice ? `<td>${r.total ? money(r.total) : ''}</td>` : ''}</tr>`; });
    });
    h += '</tbody></table>' + totalsHtml(t, 'design-print-row');
    if (t.anyPrice) h += `<div class="design-print-row"><span><strong>Lighting subtotal</strong></span><span><strong>${money(t.subtotal)}</strong></span></div>`;
    h += '<div style="font-size:11px;color:#555;margin-top:4px;">Quantities are design estimates from the plan. Strand counts round up to full strands.</div></div>';
    return h;
  });

  // ======================= Lighting tab =======================
  function renderLightingPanel(panel) {
    const L = S(); const t = takeoff();
    const lv = (k) => layerVisibility[k] !== false;
    let html = `<div class="design-legend-group"><h4>View</h4>
      <button class="btn btn-ghost btn-small" id="lt-night" type="button">${isNight() ? 'Switch to day view' : 'Switch to night view'}</button>
      ${[['light-perm', 'Permanent'], ['light-holiday', 'Holiday'], ['light-landscape', 'Landscape']].map(([k, l]) => `<label class="design-layer-toggle"><input type="checkbox" data-lt-layer="${k}" ${lv(k) ? 'checked' : ''} /> Show ${l} lighting</label>`).join('')}</div>`;
    if (t.empty) {
      html += `<div class="design-legend-group"><h4>Materials</h4><p class="empty-sub">No lights placed yet. Use <strong>Light run</strong> to draw along a roofline or edge, <strong>Light fixture</strong> to place path lights, wreaths and outlets, or select your house outline and tap <strong>Add roofline run</strong>. Trees and shrubs get Holiday lights in their properties.</p></div>`;
    } else {
      html += '<div class="design-legend-group"><h4>Materials</h4>';
      ['perm', 'holiday', 'landscape'].forEach((m) => {
        const rs = t.rows.filter((r) => r.mode === m); if (!rs.length) return;
        html += `<div class="design-tool-group-label" style="margin-top:6px;">${MODE_LABEL[m]}</div>`;
        rs.forEach((r) => { html += `<div class="design-legend-row"><span>${esc(r.name)}<br><span class="design-catalog-item-sub">${esc(r.detail)}</span></span><span>${esc(r.qty)}</span></div>`; });
      });
      html += totalsHtml(t, 'design-legend-row') + '</div>';
      html += '<div class="design-legend-group"><h4>Prices &amp; product details</h4><p class="empty-sub">Price per foot for runs, each for fixtures. Change strand length or wattage to match what you buy.</p><table class="dpro-mini-table"><thead><tr><th>Item</th><th>Price</th><th>Strand ft</th><th>Watts</th></tr></thead><tbody>';
      t.rows.forEach((r) => {
        const p = P(r.key);
        const strandCell = p.kind === 'run' && p.strandFt ? `<select data-lt-strand="${p.key}">${p.strandFt.map((s) => `<option value="${s}" ${strandFt(p) === s ? 'selected' : ''}>${s}</option>`).join('')}</select>` : '&ndash;';
        const wv = L.watts[p.key] != null && L.watts[p.key] !== '' ? L.watts[p.key] : (p.kind === 'run' ? p.wattsPerFt : p.watts || 0);
        html += `<tr><td>${esc(p.name)}</td><td><input type="number" min="0" step="0.01" data-lt-price="${p.key}" value="${L.prices[p.key] != null ? L.prices[p.key] : ''}" placeholder="${r.unit === 'ft' ? '$/ft' : '$ ea'}" /></td><td>${strandCell}</td><td><input type="number" min="0" step="0.1" data-lt-watts="${p.key}" value="${wv}" /></td></tr>`;
      });
      html += '</tbody></table>';
      if (t.anyPrice) html += `<div class="design-legend-row design-legend-total"><span>Lighting subtotal</span><span>${money(t.subtotal)}</span></div>`;
      html += '</div>';
    }
    html += `<div class="design-legend-group"><h4>Estimating settings</h4>
      <div class="dpro-row2"><div class="design-properties-field"><label>Trunk width (in)</label><input id="lt-tdia" type="number" min="2" value="${L.trunkDiaIn}" /></div><div class="design-properties-field"><label>Wrap spacing (in)</label><input id="lt-tsp" type="number" min="2" value="${L.trunkSpacingIn}" /></div></div>
      <div class="dpro-row2"><div class="design-properties-field"><label>Canopy ft per sq ft</label><input id="lt-can" type="number" min="0.1" step="0.1" value="${L.canopyDensity}" /></div><div class="design-properties-field"><label>Circuit (amps)</label><input id="lt-amps" type="number" min="10" step="5" value="${L.circuitAmps}" /></div></div>
      <div class="design-properties-field"><label>Transformer spare capacity (%)</label><input id="lt-res" type="number" min="0" max="50" value="${L.reservePct}" /></div>
      <p class="empty-sub">Circuits are sized at 80% of the breaker rating. Typical LED wattages are pre-filled; change them above to match your products.</p></div>`;
    panel.innerHTML = html;
    const redo = () => { const sy = panel.scrollTop; renderLightingPanel(panel); panel.scrollTop = sy; };
    const bindNum = (sel, store, key, rerenderAll) => panel.querySelectorAll(sel).forEach((n) => n.addEventListener('change', (e) => { store[n.dataset[key]] = e.target.value === '' ? '' : Number(e.target.value); markDirty(); redo(); }));
    bindNum('[data-lt-price]', L.prices, 'ltPrice'); bindNum('[data-lt-watts]', L.watts, 'ltWatts'); bindNum('[data-lt-strand]', L.strand, 'ltStrand');
    const setS = (id, key, min) => { const n = $(id); if (n) n.addEventListener('change', (e) => { L[key] = Math.max(min, Number(e.target.value) || min); markDirty(); redo(); }); };
    setS('lt-tdia', 'trunkDiaIn', 2); setS('lt-tsp', 'trunkSpacingIn', 2); setS('lt-can', 'canopyDensity', 0.1); setS('lt-amps', 'circuitAmps', 10); setS('lt-res', 'reservePct', 0);
    $('lt-night').addEventListener('click', () => { DPRO.setNight(!isNight()); redo(); });
    panel.querySelectorAll('[data-lt-layer]').forEach((cb) => cb.addEventListener('change', (e) => {
      const key = cb.dataset.ltLayer; layerVisibility[key] = e.target.checked; markDirty();
      elements.forEach((el) => { if (el.type === 'lightrun' || el.type === 'lightpoint') { if (layerKeyFor(el) === key) { const n = nodesById.get(el.id); if (n) n.visible(e.target.checked); } } });
      DPRO.lightLayer.batchDraw();
      const lc = document.querySelector(`#design-panel-layers input[data-layer="${key}"]`); if (lc) lc.checked = e.target.checked;
    }));
  }
  DPRO.addSideTab('lighting', 'Lighting', renderLightingPanel);

  // ======================= Lighting checks =======================
  DPRO.checks.push(function lightingChecks() {
    const items = [];
    const t = takeoff(); if (t.empty) return items;
    const outlets = elements.filter((e) => e.type === 'lightpoint' && e.key === 'outlet').length;
    const hol = t.rows.some((r) => r.mode === 'holiday');
    if (t.modeW.holiday > 0) {
      if (!outlets) items.push({ cat: 'Lighting', sev: 'info', text: `Holiday lights draw ${t.modeW.holiday.toFixed(0)} W and need about ${t.circuits.holiday} circuit${t.circuits.holiday === 1 ? '' : 's'}. No power points are marked on the plan. Place outlets with the Light fixture tool.` });
      else if (outlets < t.circuits.holiday) items.push({ cat: 'Lighting', sev: 'warn', text: `Holiday load needs about ${t.circuits.holiday} circuits but only ${outlets} outlet${outlets === 1 ? '' : 's'} ${outlets === 1 ? 'is' : 'are'} marked. Add outlets or spread the load across more circuits.` });
    }
    if (t.modeW.landscape > 0) {
      if (!elements.some((e) => e.type === 'lightpoint' && e.key === 'transformer')) items.push({ cat: 'Lighting', sev: 'info', text: `Landscape lights total ${t.modeW.landscape.toFixed(0)} W. Add a transformer (${t.xfCount > 1 ? t.xfCount + ' × ' : ''}${t.xf} W recommended) to the plan.` });
      if (t.xfCount > 1) items.push({ cat: 'Lighting', sev: 'warn', text: `Landscape load is above one 1200 W transformer. Split the design across ${t.xfCount} transformers.` });
      const small = elements.filter((e) => e.type === 'lightpoint' && P(e.key) && P(e.key).mode === 'landscape' && e.key !== 'transformer');
      if (small.length > 12) items.push({ cat: 'Lighting', sev: 'info', text: `${small.length} landscape fixtures. Run cable in more than one loop and keep each cable run short (about 100 ft or less at 100 W on 12-gauge wire) to avoid dim lights at the end.` });
    }
    elements.filter((e) => e.type === 'lightrun' && polylineLengthFt(e.points) < 1).forEach((e) => items.push({ cat: 'Lighting', sev: 'info', text: 'A light run is shorter than 1 ft.', ids: [e.id] }));
    void hol;
    return items;
  });
})();
