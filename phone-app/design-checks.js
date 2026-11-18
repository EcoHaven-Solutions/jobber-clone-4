// ============================================================================
// design-checks.js — design checks for the Site Design editor ("Checks" tab).
//
// Irrigation: GPM per zone, pipe size, pressure estimate, head spacing, mixed
// head types, dry-spot coverage map. Planting: crowding, plants too close to a
// building, sun/water mismatches. Other modules (lighting) can add their own
// checks through DPRO.checks.push(fn).
//
// These are planning aids built on typical manufacturer numbers and standard
// hydraulics formulas -- they catch obvious problems early, they do not
// replace a real hydraulic calculation for a tricky system.
// ============================================================================
(function () {
  'use strict';
  const DPRO = window.DPRO;
  if (!DPRO) return;
  const CATC = window.DESIGN_CATALOG;
  const $ = (id) => document.getElementById(id);
  const esc = DPRO.esc;

  // ---------- geometry helpers ----------
  function inPoly(x, y, pts) {
    let inside = false;
    for (let i = 0, j = pts.length / 2 - 1; i < pts.length / 2; j = i++) {
      const xi = pts[i * 2], yi = pts[i * 2 + 1], xj = pts[j * 2], yj = pts[j * 2 + 1];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  function polyAreaPx(pts) { let a = 0; const n = pts.length / 2; for (let i = 0; i < n; i++) { const j = (i + 1) % n; a += pts[i * 2] * pts[j * 2 + 1] - pts[j * 2] * pts[i * 2 + 1]; } return Math.abs(a / 2); }
  function distToSeg(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1; const l2 = dx * dx + dy * dy;
    let t = l2 ? ((px - x1) * dx + (py - y1) * dy) / l2 : 0; t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  }
  function distToPolyEdge(px, py, pts) {
    let best = Infinity; const n = pts.length / 2;
    for (let i = 0; i < n; i++) { const j = (i + 1) % n; best = Math.min(best, distToSeg(px, py, pts[i * 2], pts[i * 2 + 1], pts[j * 2], pts[j * 2 + 1])); }
    return best;
  }
  DPRO.geom = { inPoly, polyAreaPx, distToSeg, distToPolyEdge };
  const catHead = (key) => CATC.HEAD_CATALOG.find((h) => h.key === key) || null;
  const catPlant = (key) => CATC.PLANT_CATALOG.find((p) => p.key === key) || null;
  function elCenter(el) {
    if (typeof el.x === 'number') return { x: el.x, y: el.y };
    if (Array.isArray(el.points)) { const c = polygonCentroid(el.points); return c; }
    if (typeof el.x1 === 'number') return { x: (el.x1 + el.x2) / 2, y: (el.y1 + el.y2) / 2 };
    return { x: 0, y: 0 };
  }
  DPRO.focusElement = function (id) {
    const el = elements.find((e) => e.id === id);
    if (!el || !stage) return;
    const c = elCenter(el), s = stage.scaleX();
    stage.position({ x: stage.width() / 2 - c.x * s, y: stage.height() / 2 - c.y * s });
    stage.batchDraw();
    if (typeof selectElement === 'function') selectElement(id);
  };

  // ---------- hydraulics ----------
  const PIPES = [['1/2"', 0.622], ['3/4"', 0.824], ['1"', 1.049], ['1-1/4"', 1.38], ['1-1/2"', 1.61], ['2"', 2.067]];
  function pipeFor(gpm) { for (const p of PIPES) { if (12.24 * p[1] * p[1] >= gpm) return p; } return PIPES[PIPES.length - 1]; } // velocity <= 5 ft/s
  function hwLoss(gpm, id, ft) { if (!gpm || !ft) return 0; return 0.2083 * Math.pow(100 / 150, 1.852) * Math.pow(gpm, 1.852) / Math.pow(id, 4.8655) * (ft / 100); }
  const REQ_PSI = { rotor: 45, spray: 30, bubbler: 20, drip: 25 };
  const VALVE_LOSS = 3, BACKFLOW_LOSS = 8;
  function headGpm(h) {
    const c = catHead(h.headKey); if (!c) return 0;
    if (c.kind === 'drip') return (c.gph || 0) / 60;
    return (c.gpmFull || 0) * ((h.arc == null ? 360 : h.arc) / 360);
  }
  function headRadiusFt(h) { const c = catHead(h.headKey); return typeof h.radiusFt === 'number' ? h.radiusFt : (c ? c.defaultRadiusFt : 0); }

  function irrigationAnalysis() {
    const ir = DPRO.extras.irrigation || { staticPsi: 60, availGpm: 15 };
    const heads = elements.filter((e) => e.type === 'head');
    const zonesEls = elements.filter((e) => e.type === 'zone');
    const pipes = elements.filter((e) => e.type === 'pipe');
    const nums = new Set();
    zonesEls.forEach((z) => nums.add(z.zoneNumber));
    heads.forEach((h) => { if (h.zoneNumber) nums.add(h.zoneNumber); });
    const mainFt = pipes.filter((p) => p.subtype === 'mainline').reduce((s, p) => s + polylineLengthFt(p.points), 0);
    const backflow = elements.some((e) => e.type === 'fixture' && e.fixtureKey === 'backflow');
    const valves = elements.filter((e) => e.type === 'fixture' && e.fixtureKey === 'valve').length;
    const rows = [];
    const items = [];
    const zoneGpms = [];
    nums.forEach((n) => zoneGpms.push(heads.filter((h) => h.zoneNumber === n).reduce((s, h) => s + headGpm(h), 0)));
    const maxZone = zoneGpms.length ? Math.max(...zoneGpms) : 0;
    const mainPipe = pipeFor(maxZone);
    [...nums].sort((a, b) => a - b).forEach((n) => {
      const zh = heads.filter((h) => h.zoneNumber === n);
      const gpm = zh.reduce((s, h) => s + headGpm(h), 0);
      const latFt = pipes.filter((p) => p.subtype === 'lateral' && p.zoneNumber === n).reduce((s, p) => s + polylineLengthFt(p.points), 0);
      const lat = pipeFor(gpm);
      const loss = hwLoss(gpm, mainPipe[1], mainFt) + hwLoss(gpm, lat[1], latFt) + (gpm > 0 ? VALVE_LOSS : 0) + (backflow && gpm > 0 ? BACKFLOW_LOSS : 0);
      const residual = (Number(ir.staticPsi) || 0) - loss;
      let need = 0;
      zh.forEach((h) => { const c = catHead(h.headKey); if (c) need = Math.max(need, REQ_PSI[c.kind] || 0); });
      const kinds = new Set(zh.map((h) => (catHead(h.headKey) || {}).kind).filter(Boolean));
      const zEl = zonesEls.find((z) => z.zoneNumber === n);
      const ids = zEl ? [zEl.id] : zh.map((h) => h.id);
      rows.push({ n, heads: zh.length, gpm, lat: lat[0], latFt, residual, need });
      if (!zh.length) items.push({ cat: 'Irrigation', sev: 'warn', text: `Zone ${n} has no heads assigned.`, ids });
      if (gpm > (Number(ir.availGpm) || 0) * 0.75 && gpm > 0) items.push({ cat: 'Irrigation', sev: 'bad', text: `Zone ${n} needs about ${gpm.toFixed(1)} GPM but only ${(Number(ir.availGpm) * 0.75).toFixed(1)} GPM is usable (75% of ${ir.availGpm}). Split it into two zones.`, ids });
      if (gpm > 0 && need && residual < need) items.push({ cat: 'Irrigation', sev: 'warn', text: `Zone ${n}: estimated ${residual.toFixed(0)} psi at the heads, but ${need} psi is typical for these heads. Use bigger pipe, a shorter run, or fewer heads.`, ids });
      if (kinds.has('rotor') && kinds.has('spray')) items.push({ cat: 'Irrigation', sev: 'bad', text: `Zone ${n} mixes rotors and sprays. They put water down at very different rates, so keep them on separate zones.`, ids: zh.filter((h) => (catHead(h.headKey) || {}).kind === 'spray').map((h) => h.id).slice(0, 1).concat(ids).slice(0, 1) });
      if (kinds.has('drip') && (kinds.has('rotor') || kinds.has('spray'))) items.push({ cat: 'Irrigation', sev: 'warn', text: `Zone ${n} mixes drip with sprays or rotors. Drip needs its own zone (low pressure, long run time).`, ids });
    });
    const unz = heads.filter((h) => !h.zoneNumber);
    if (unz.length) items.push({ cat: 'Irrigation', sev: 'warn', text: `${unz.length} head${unz.length === 1 ? '' : 's'} not assigned to a zone. Use "Assign heads to zones automatically" below.`, ids: [unz[0].id] });
    if (rows.length && valves < rows.length) items.push({ cat: 'Irrigation', sev: 'info', text: `${rows.length} zone${rows.length === 1 ? '' : 's'} but ${valves} valve${valves === 1 ? '' : 's'} placed. Each zone needs its own valve.` });
    if (heads.length && !elements.some((e) => e.type === 'fixture' && e.fixtureKey === 'backflow')) items.push({ cat: 'Irrigation', sev: 'info', text: 'No backflow preventer on the plan. Irrigation systems need one to meet water-code requirements.' });
    // head-to-head spacing
    const sp = heads.filter((h) => { const c = catHead(h.headKey); return c && (c.kind === 'rotor' || c.kind === 'spray') && headRadiusFt(h) > 0 && (h.arc == null || h.arc > 0); });
    let gaps = 0;
    sp.forEach((h) => {
      const R = headRadiusFt(h);
      let best = Infinity;
      sp.forEach((o) => { if (o === h || (o.zoneNumber || 0) !== (h.zoneNumber || 0)) return; const d = Math.hypot(o.x - h.x, o.y - h.y) / pxPerFt; if (d < best) best = d; });
      if (best !== Infinity && best > R * 1.2) { gaps += 1; if (gaps <= 6) items.push({ cat: 'Irrigation', sev: 'warn', text: `A head is ${best.toFixed(0)} ft from its nearest neighbor but throws only ${R} ft. That leaves a gap in the middle. Aim for head-to-head spacing (about ${R} ft).`, ids: [h.id] }); }
    });
    if (gaps > 6) items.push({ cat: 'Irrigation', sev: 'warn', text: `...and ${gaps - 6} more heads spaced too far apart.` });
    return { rows, items, mainFt, mainPipe, valves, backflow };
  }
  DPRO.irrigationAnalysis = irrigationAnalysis;

  // ---------- coverage ----------
  function covered(x, y, heads) {
    for (const h of heads) {
      const R = headRadiusFt(h) * pxPerFt; if (R <= 0) continue;
      const dx = x - h.x, dy = y - h.y; const d = Math.hypot(dx, dy);
      if (d > R * 1.0) continue;
      const arc = h.arc == null ? 360 : h.arc;
      if (arc >= 359) return true;
      if (d < 1) return true;
      let a = (Math.atan2(dy, dx) * 180) / Math.PI - (h.rotationDeg || 0);
      a = ((a % 360) + 360) % 360;
      if (a <= arc) return true;
    }
    return false;
  }
  function coverageAnalysis() {
    const heads = elements.filter((e) => { const c = catHead(e.headKey); return e.type === 'head' && c && (c.kind === 'rotor' || c.kind === 'spray' || c.kind === 'bubbler'); });
    const lawns = elements.filter((e) => e.type === 'area' && (e.subtype === 'lawn'));
    const out = [];
    lawns.forEach((l) => {
      const pts = l.points; let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (let i = 0; i < pts.length; i += 2) { minX = Math.min(minX, pts[i]); maxX = Math.max(maxX, pts[i]); minY = Math.min(minY, pts[i + 1]); maxY = Math.max(maxY, pts[i + 1]); }
      const areaFt = polyAreaPx(pts) / (pxPerFt * pxPerFt);
      const stepFt = Math.max(1, Math.sqrt(areaFt / 2500)); const step = stepFt * pxPerFt;
      let tot = 0, dry = 0; const dryPts = [];
      for (let y = minY + step / 2; y < maxY; y += step) for (let x = minX + step / 2; x < maxX; x += step) {
        if (!inPoly(x, y, pts)) continue; tot += 1;
        if (!covered(x, y, heads)) { dry += 1; dryPts.push([x, y]); }
      }
      out.push({ el: l, pct: tot ? Math.round(((tot - dry) / tot) * 100) : 100, dryPts, step, areaFt });
    });
    return { heads, lawns: out };
  }
  DPRO.clearDry = function () {
    if (DPRO.dryGroup) { DPRO.dryGroup.destroy(); DPRO.dryGroup = null; if (DPRO.overlayLayer) DPRO.overlayLayer.batchDraw(); }
  };
  DPRO.showDry = function () {
    DPRO.clearDry();
    const cov = coverageAnalysis();
    if (!DPRO.overlayLayer) return cov;
    const g = new Konva.Group({ listening: false, name: 'dpro-dry' });
    cov.lawns.forEach((l) => l.dryPts.forEach(([x, y]) => g.add(new Konva.Rect({ x: x - l.step / 2, y: y - l.step / 2, width: l.step, height: l.step, fill: 'rgba(224,60,40,0.45)' }))));
    DPRO.overlayLayer.add(g); DPRO.dryGroup = g; DPRO.overlayLayer.batchDraw();
    return cov;
  };

  // ---------- planting ----------
  DPRO.checks.push(function plantingChecks() {
    const items = [];
    const plants = elements.filter((e) => e.type === 'plant');
    const bld = elements.filter((e) => e.type === 'area' && e.subtype === 'building');
    const beds = elements.filter((e) => e.type === 'area' && e.subtype === 'bed');
    // crowding
    let crowd = 0;
    for (let i = 0; i < plants.length; i++) for (let j = i + 1; j < plants.length; j++) {
      const a = plants[i], b = plants[j], pa = catPlant(a.plantKey), pb = catPlant(b.plantKey);
      if (!pa || !pb) continue;
      const mass = (p) => p.category === 'Groundcover' || p.category === 'Perennial' || p.category === 'Ornamental Grass';
      if (mass(pa) || mass(pb)) continue;
      const bothTrees = pa.category === 'Tree' && pb.category === 'Tree';
      const need = ((pa.spreadFt + pb.spreadFt) / 2) * (bothTrees ? 0.8 : 0.7);
      const d = Math.hypot(a.x - b.x, a.y - b.y) / pxPerFt;
      if (d < need) { crowd += 1; if (crowd <= 6) items.push({ cat: 'Planting', sev: 'warn', text: `${pa.name} and ${pb.name} are ${d.toFixed(1)} ft apart; at mature size they want about ${need.toFixed(0)} ft. They will crowd each other.`, ids: [a.id] }); }
    }
    if (crowd > 6) items.push({ cat: 'Planting', sev: 'warn', text: `...and ${crowd - 6} more crowded pairs.` });
    // near / inside building
    plants.forEach((pl) => {
      const p = catPlant(pl.plantKey); if (!p) return;
      bld.forEach((b) => {
        if (inPoly(pl.x, pl.y, b.points)) { items.push({ cat: 'Planting', sev: 'bad', text: `${p.name} is placed inside the building outline.`, ids: [pl.id] }); return; }
        const d = distToPolyEdge(pl.x, pl.y, b.points) / pxPerFt;
        const need = p.category === 'Tree' ? p.spreadFt / 2 + 5 : p.spreadFt / 2 + 0.5;
        if (d < need) items.push({ cat: 'Planting', sev: p.category === 'Tree' ? 'warn' : 'info', text: p.category === 'Tree' ? `${p.name} is ${d.toFixed(0)} ft from the house. At maturity its branches and roots will be on the building. Move it about ${Math.ceil(need)} ft away.` : `${p.name} is ${d.toFixed(1)} ft from the house and will touch the wall at mature width (${p.spreadFt} ft).`, ids: [pl.id] });
      });
    });
    // bed exposure / water
    plants.forEach((pl) => {
      const p = catPlant(pl.plantKey); if (!p) return;
      const inside = beds.filter((b) => inPoly(pl.x, pl.y, b.points)).sort((a, b) => polyAreaPx(a.points) - polyAreaPx(b.points))[0];
      if (!inside) return;
      if (inside.sun && ((p.sun === 'full' && inside.sun === 'shade') || (p.sun === 'shade' && inside.sun === 'full'))) items.push({ cat: 'Planting', sev: 'warn', text: `${p.name} wants ${p.sun === 'full' ? 'full sun' : 'shade'} but this bed is marked ${inside.sun === 'full' ? 'full sun' : 'shade'}.`, ids: [pl.id] });
      if (inside.water && ((p.water === 'high' && inside.water === 'low') || (p.water === 'low' && inside.water === 'high'))) items.push({ cat: 'Planting', sev: 'warn', text: `${p.name} needs ${p.water} water but this bed is set to ${inside.water}.`, ids: [pl.id] });
    });
    // mixed water needs within one irrigation zone
    const zones = elements.filter((e) => e.type === 'zone');
    zones.forEach((z) => {
      const lvl = new Set();
      plants.forEach((pl) => { const p = catPlant(pl.plantKey); if (p && inPoly(pl.x, pl.y, z.points)) lvl.add(p.water); });
      if (lvl.has('low') && lvl.has('high')) items.push({ cat: 'Planting', sev: 'warn', text: `Zone ${z.zoneNumber} covers both low-water and high-water plants. Group plants with similar water needs together so none are drowned or dried out.`, ids: [z.id] });
    });
    return items;
  });

  // ---------- run + render ----------
  DPRO.collectChecks = function () {
    const ana = irrigationAnalysis();
    let items = ana.items.slice();
    DPRO.checks.forEach((fn) => { try { items = items.concat(fn() || []); } catch (e) { console.error('check failed', e); } });
    return { ana, items };
  };
  function sevIcon(s) { return { bad: 'Problem', warn: 'Check', info: 'Note', ok: 'OK' }[s] || ''; }
  function renderChecks(panel) {
    const { ana, items } = DPRO.collectChecks();
    const ir = DPRO.extras.irrigation;
    const cats = ['Irrigation', 'Planting', 'Lighting'];
    const hasHeads = elements.some((e) => e.type === 'head');
    let html = `<div class="design-legend-group"><h4>Irrigation inputs</h4>
      <div class="dpro-row2"><div class="design-properties-field"><label>Static pressure (psi)</label><input id="ck-psi" type="number" min="10" max="150" value="${ir.staticPsi}" /></div>
      <div class="design-properties-field"><label>Available flow (GPM)</label><input id="ck-gpm" type="number" min="1" max="100" step="0.5" value="${ir.availGpm}" /></div></div>
      <p class="empty-sub">Measure these at the hose bib or point of connection. Use the pressure with the water running if you can.</p>
      <button class="btn btn-ghost btn-small" id="ck-assign" type="button">Assign heads to zones automatically</button>
      <button class="btn btn-ghost btn-small" id="ck-dry" type="button">${DPRO.dryGroup ? 'Hide dry spots' : 'Show dry spots on lawns'}</button></div>`;
    if (ana.rows.length) {
      html += `<div class="design-legend-group"><h4>Zone summary</h4><table class="dpro-mini-table"><thead><tr><th>Zone</th><th>Heads</th><th>GPM</th><th>Pipe</th><th>PSI</th></tr></thead><tbody>` +
        ana.rows.map((r) => `<tr><td>${r.n}</td><td>${r.heads}</td><td>${r.gpm.toFixed(1)}</td><td>${r.lat}</td><td style="${r.need && r.residual < r.need ? 'color:#E0A030;font-weight:700' : ''}">${r.residual.toFixed(0)}</td></tr>`).join('') +
        `</tbody></table><p class="empty-sub">Mainline ${ana.mainFt.toFixed(0)} ft (${ana.mainPipe[0]} suggested). Pipe sizes keep water under 5 ft/sec; PSI is estimated at the heads after pipe, valve${ana.backflow ? ' and backflow' : ''} loss.</p></div>`;
    }
    if (hasHeads) {
      const cov = coverageAnalysis();
      if (cov.lawns.length) {
        html += `<div class="design-legend-group"><h4>Lawn coverage</h4>` + cov.lawns.map((l) => `<div class="design-legend-row"><span>${esc(l.el.label || 'Lawn')} (${l.areaFt.toFixed(0)} sq ft)</span><span style="${l.pct < 90 ? 'color:#E0A030;font-weight:700' : ''}">${l.pct}% watered</span></div>`).join('') + `</div>`;
      }
    }
    cats.forEach((c) => {
      const list = items.filter((i) => i.cat === c);
      if (c === 'Lighting' && !list.length && !elements.some((e) => e.type === 'lightrun' || e.type === 'lightpoint')) return;
      html += `<div class="design-legend-group"><h4>${c}</h4><div class="dpro-warn-list">`;
      if (!list.length) html += `<div class="dpro-warn sev-ok">No problems found.</div>`;
      list.forEach((it, idx) => { html += `<div class="dpro-warn sev-${it.sev}" data-idx="${items.indexOf(it)}" ><strong>${sevIcon(it.sev)}:</strong> ${esc(it.text)}</div>`; });
      html += `</div></div>`;
    });
    html += `<p class="empty-sub">These checks use typical manufacturer numbers and standard formulas. They catch common mistakes early; they do not replace a field check of your actual pressure and flow.</p>`;
    panel.innerHTML = html;
    panel.querySelectorAll('.dpro-warn[data-idx]').forEach((n) => n.addEventListener('click', () => {
      const it = items[Number(n.dataset.idx)]; if (it && it.ids && it.ids[0]) DPRO.focusElement(it.ids[0]);
    }));
    const num = (id, key) => { const n = $(id); if (n) n.addEventListener('change', (e) => { DPRO.extras.irrigation[key] = Number(e.target.value) || 0; markDirty(); renderChecks(panel); }); };
    num('ck-psi', 'staticPsi'); num('ck-gpm', 'availGpm');
    $('ck-assign').addEventListener('click', () => {
      const zs = elements.filter((e) => e.type === 'zone'); let n = 0;
      elements.filter((e) => e.type === 'head').forEach((h) => {
        const inside = zs.filter((z) => inPoly(h.x, h.y, z.points)).sort((a, b) => polyAreaPx(a.points) - polyAreaPx(b.points))[0];
        if (inside && h.zoneNumber !== inside.zoneNumber) { h.zoneNumber = inside.zoneNumber; DPRO.rerender(h); n += 1; }
      });
      if (n) markDirty();
      renderChecks(panel);
      const note = document.createElement('p'); note.className = 'empty-sub'; note.textContent = zs.length ? `Assigned ${n} head${n === 1 ? '' : 's'} to the zone outline they sit inside.` : 'Draw zone outlines first (Irrigation > Zone).'; panel.prepend(note);
    });
    $('ck-dry').addEventListener('click', () => { if (DPRO.dryGroup) DPRO.clearDry(); else DPRO.showDry(); renderChecks(panel); });
    DPRO.updateBadge(items);
  }
  DPRO.updateBadge = function (items) {
    const tab = document.querySelector('.design-side-tab[data-panel="checks"]');
    if (!tab) return;
    const list = items || DPRO.collectChecks().items;
    const n = list.filter((i) => i.sev === 'bad' || i.sev === 'warn').length;
    tab.textContent = n ? `Checks (${n})` : 'Checks';
  };
  DPRO.addSideTab('checks', 'Checks', renderChecks);
  DPRO.sidePanels.checks.panelRender = renderChecks;

  // keep the badge fresh (cheap, debounced) and refresh the open panel
  let badgeTimer = null;
  const prevMark = window.markDirty;
  window.markDirty = function () {
    prevMark();
    clearTimeout(badgeTimer);
    badgeTimer = setTimeout(() => {
      try { DPRO.updateBadge(); } catch (e) { /* ignore */ }
      const p = $('design-panel-checks');
      if (p && !p.hidden) { const sy = p.scrollTop; renderChecks(p); p.scrollTop = sy; }
    }, 700);
  };
  DPRO.openHooks.push(() => { DPRO.clearDry(); DPRO.updateBadge(); });

  // print: zone summary + any warnings
  DPRO.printHooks.push(function () {
    const ana = irrigationAnalysis();
    if (!ana.rows.length) return '';
    const ir = DPRO.extras.irrigation;
    return `<div class="design-print-section dpro-takeoff"><h3>Irrigation zone summary</h3><table><thead><tr><th>Zone</th><th>Heads</th><th>GPM</th><th>Lateral</th><th>Est. PSI at heads</th></tr></thead><tbody>` +
      ana.rows.map((r) => `<tr><td>${r.n}</td><td>${r.heads}</td><td>${r.gpm.toFixed(1)}</td><td>${r.lat}</td><td>${r.residual.toFixed(0)}</td></tr>`).join('') +
      `</tbody></table><div style="font-size:11px;color:#555;margin-top:4px;">Design basis: ${ir.staticPsi} psi static, ${ir.availGpm} GPM available. Estimates use typical manufacturer data; verify on site.</div></div>`;
  });
})();
