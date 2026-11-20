// ============================================================================
// design-materials.js — decorative rock, gravel, mulch and surface materials.
//
//  * A library of ~23 ground materials (river rock, cobble, lava rock, black
//    Mexican beach pebbles, marble chips, decomposed granite, pea gravel, bark
//    mulch ...) that are drawn with code, so they look like what they are in
//    the 2D plan AND in the 3D view (real stones with relief, not flat color).
//  * Boulders you can place (granite, basalt, moss rock, sandstone ...).
//  * Realistic surface textures for lawn, turf, concrete, pavers, flagstone
//    and decking (used by the 3D view).
//  * Editor tools: pick a material card, draw the bed, and get a quantity list
//    (square feet, cubic yards, tons) with optional pricing.
//
// The first half (catalog + textures) also runs on the customer 3D page; the
// editor half only runs inside the design editor.
// ============================================================================
(function () {
  'use strict';
  const DPRO = (window.DPRO = window.DPRO || {});
  if (DPRO.mat) return;

  // ----------------------------------------------------------------- helpers
  function rng(seed) { let s = (Math.floor(seed) >>> 0) || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
  const hashStr = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function hex(h) { h = String(h).replace('#', ''); if (h.length === 3) h = h.split('').map((c) => c + c).join(''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  const rgb = (c, k, a) => `rgba(${clamp(Math.round(c[0] * k), 0, 255)},${clamp(Math.round(c[1] * k), 0, 255)},${clamp(Math.round(c[2] * k), 0, 255)},${a == null ? 1 : a})`;
  function cv(n, m) { const c = document.createElement('canvas'); c.width = n; c.height = m || n; return [c, c.getContext('2d')]; }
  function wrap(n, x, y, r, fn) { // draw at wrapped offsets so tiles repeat with no seams
    const xs = [0], ys = [0]; if (x < r) xs.push(n); if (x > n - r) xs.push(-n); if (y < r) ys.push(n); if (y > n - r) ys.push(-n);
    for (const dx of xs) for (const dy of ys) fn(x + dx, y + dy);
  }

  // ----------------------------------------------------------------- catalog
  const G = { MULCH: 'Mulch', SOIL: 'Soil & sand', ROCK: 'Decorative rock', GRAVEL: 'Gravel & granite' };
  // kind: round | angular | flat | chip | shred | fine | soil | sand
  // r: stone radius range in texture pixels (tile = ft feet across 512px).  d3: instanced 3D stone size (ft), if large enough.
  const MATS = [
    // ---- mulch
    { key: 'bark-dark', name: 'Dark bark mulch', group: G.MULCH, kind: 'chip', ft: 3, r: [20, 34], base: '#2e1c10', pal: ['#5a3a22', '#4a2e1b', '#6b4429', '#3d2616', '#7a4f2e'], depthIn: 3, ton: 0, bump: 3, rough: 1, note: 'Classic brown bark nuggets' },
    { key: 'cedar-red', name: 'Red cedar mulch', group: G.MULCH, kind: 'shred', ft: 3, base: '#4a2014', pal: ['#9a4a2a', '#8a3f22', '#b05a34', '#7a3820', '#c06a40'], depthIn: 3, ton: 0, bump: 2, rough: 1, note: 'Shredded cedar, warm red-brown' },
    { key: 'mulch-black', name: 'Black mulch', group: G.MULCH, kind: 'shred', ft: 3, base: '#0e0b09', pal: ['#241d19', '#2a2420', '#15110f', '#33291f', '#3b3029'], depthIn: 3, ton: 0, bump: 2, rough: 1, note: 'Dyed black shredded hardwood' },
    { key: 'wood-chips', name: 'Natural wood chips', group: G.MULCH, kind: 'chip', ft: 3, r: [22, 40], base: '#5f4426', pal: ['#b88a55', '#a57a49', '#c9a06a', '#8e6b40', '#d2ae7a'], depthIn: 3, ton: 0, bump: 3, rough: 1, note: 'Light arborist chips' },
    // ---- soil & sand
    { key: 'topsoil', name: 'Topsoil', group: G.SOIL, kind: 'soil', ft: 3, base: '#4a3626', pal: ['#6a5038', '#3a2a1c', '#5a4430'], depthIn: 4, ton: 1.1, bump: 1.2, rough: 1, note: 'Planting soil' },
    { key: 'sand', name: 'Sand', group: G.SOIL, kind: 'sand', ft: 2, base: '#d6c398', pal: ['#e3d2a8', '#c9b584', '#bfa970'], depthIn: 2, ton: 1.3, bump: 0.8, rough: 1, note: 'Play / paver sand' },
    // ---- decorative rock
    { key: 'river-rock', name: 'River rock (2-4 in)', group: G.ROCK, kind: 'round', ft: 2.5, r: [17, 34], base: '#3a362f', pal: ['#b9b2a2', '#9c9484', '#cfc7b4', '#8a8478', '#a69a85', '#7e7a70', '#c4b8a0'], depthIn: 3, ton: 1.4, bump: 5, rough: 0.9, d3: 0.24, cover: 0.55, note: 'Smooth rounded stones, mixed tan and grey' },
    { key: 'cobble', name: 'Cobblestone (4-8 in)', group: G.ROCK, kind: 'round', ft: 4, r: [26, 50], base: '#34312b', pal: ['#8f897c', '#a39c8b', '#7c776b', '#b0a893', '#6f6a5f', '#99917f'], depthIn: 5, ton: 1.5, bump: 6, rough: 0.92, d3: 0.5, cover: 0.62, note: 'Large rounded cobbles for dry creek beds and borders' },
    { key: 'rainbow-rock', name: 'Rainbow river rock (1-3 in)', group: G.ROCK, kind: 'round', ft: 2, r: [14, 28], base: '#3b342c', pal: ['#b8704a', '#8f8a80', '#c9b48a', '#6f7a5e', '#a4573b', '#d8cfc0', '#7d6a58', '#5e6670'], depthIn: 3, ton: 1.4, bump: 5, rough: 0.88, d3: 0.17, cover: 0.55, note: 'Multicolor river stones (rust, tan, grey, olive)' },
    { key: 'lava-red', name: 'Red lava rock', group: G.ROCK, kind: 'angular', ft: 2, r: [10, 24], base: '#2a1410', pal: ['#8a3b27', '#a14a30', '#7a3322', '#b85a3a', '#6a2a1c'], pores: true, depthIn: 3, ton: 0.7, bump: 6, rough: 1, note: 'Lightweight porous volcanic rock' },
    { key: 'lava-black', name: 'Black lava rock', group: G.ROCK, kind: 'angular', ft: 2, r: [10, 24], base: '#0c0b0b', pal: ['#2a2523', '#38312e', '#1d1a19', '#4a403b', '#2f2926'], pores: true, depthIn: 3, ton: 0.7, bump: 6, rough: 1, note: 'Dark porous volcanic rock' },
    { key: 'beach-pebble', name: 'Black Mexican beach pebbles', group: G.ROCK, kind: 'round', ft: 2, r: [12, 24], base: '#050505', pal: ['#111113', '#1a1a1c', '#232326', '#2c2c30', '#0c0c0d'], gloss: true, depthIn: 2, ton: 1.4, bump: 4, rough: 0.42, d3: 0.15, cover: 0.62, note: 'Polished black river pebbles (1-3 in)' },
    { key: 'marble-white', name: 'White marble chips', group: G.ROCK, kind: 'angular', ft: 1.5, r: [9, 19], base: '#a9a69c', pal: ['#f4f1ea', '#e6e2d8', '#ddd8cc', '#fbfaf6', '#cfcabd'], depthIn: 3, ton: 1.4, bump: 4, rough: 0.6, note: 'Bright white crushed marble' },
    { key: 'red-rock', name: 'Colorado red rock', group: G.ROCK, kind: 'angular', ft: 1.6, r: [10, 21], base: '#5a2c1e', pal: ['#a8553a', '#b86445', '#964a32', '#c0714f', '#8a4430'], depthIn: 3, ton: 1.4, bump: 4, rough: 0.95, note: 'Brick-red crushed rock, 1-2 in' },
    { key: 'basalt', name: 'Black basalt chips', group: G.ROCK, kind: 'angular', ft: 1.6, r: [9, 20], base: '#18191b', pal: ['#3a3d42', '#2e3034', '#464a50', '#25272a', '#50555c'], depthIn: 3, ton: 1.5, bump: 4, rough: 0.85, note: 'Dark blue-grey crushed basalt' },
    { key: 'granite-pink', name: 'Pink granite chips', group: G.ROCK, kind: 'angular', ft: 1.4, r: [8, 17], base: '#6b5249', pal: ['#c79a8e', '#b58a7d', '#d6b0a2', '#9c7468', '#e0c2b6'], speckle: true, depthIn: 3, ton: 1.5, bump: 4, rough: 0.8, note: 'Speckled pink and grey granite' },
    { key: 'sandstone', name: 'Tan sandstone chips', group: G.ROCK, kind: 'angular', ft: 1.6, r: [10, 21], base: '#6a5538', pal: ['#c9a77a', '#b8935f', '#d8b98f', '#a98250', '#e0c8a0'], depthIn: 3, ton: 1.4, bump: 4, rough: 0.95, note: 'Warm desert sandstone' },
    { key: 'slate-chips', name: 'Blue-grey slate chips', group: G.ROCK, kind: 'flat', ft: 1.8, r: [11, 24], base: '#2a3036', pal: ['#5b6670', '#4a545d', '#6e7a85', '#3d454d', '#7f8b96'], depthIn: 2, ton: 1.3, bump: 3.5, rough: 0.75, note: 'Flat layered slate pieces' },
    // ---- gravel & granite
    { key: 'pea-gravel', name: 'Pea gravel (3/8 in)', group: G.GRAVEL, kind: 'round', ft: 0.9, r: [7, 12], base: '#4d4538', pal: ['#c9b999', '#a89678', '#d6c8aa', '#8f826c', '#b5a58a', '#9a9486', '#c2a888'], depthIn: 3, ton: 1.45, bump: 3, rough: 0.9, note: 'Small smooth pebbles for paths and patios' },
    { key: 'gravel-34', name: '3/4 in crushed gravel (grey)', group: G.GRAVEL, kind: 'angular', ft: 1.2, r: [7, 15], base: '#4a4a46', pal: ['#9a9a96', '#7e7e7a', '#b0aea6', '#68675f', '#a6a49a'], depthIn: 3, ton: 1.4, bump: 4, rough: 0.95, note: 'Angular grey crushed stone, locks together' },
    { key: 'dg-gold', name: 'Decomposed granite (gold)', group: G.GRAVEL, kind: 'fine', ft: 0.6, base: '#a58a64', pal: ['#b59a73', '#a58a64', '#c6ab84', '#8f7653', '#d2b88f'], depthIn: 3, ton: 1.5, bump: 1.5, rough: 1, note: 'Fine tan granite fines, compacts for paths' },
    { key: 'dg-gray', name: 'Decomposed granite (grey)', group: G.GRAVEL, kind: 'fine', ft: 0.6, base: '#8d8b85', pal: ['#8d8b85', '#a09e97', '#797771', '#b3b1aa', '#6b6a64'], depthIn: 3, ton: 1.5, bump: 1.5, rough: 1, note: 'Fine grey granite fines' },
    { key: 'road-base', name: 'Crushed road base (1-1/2 minus)', group: G.GRAVEL, kind: 'angular', fines: true, ft: 1.4, r: [6, 14], base: '#8a877d', pal: ['#b9b6aa', '#a5a296', '#cdc9bb', '#8f8c80', '#c2bdae'], depthIn: 4, ton: 1.5, bump: 2.5, rough: 1, note: 'Compactable base under pavers and patios' },
  ];
  const BY = {}; MATS.forEach((m) => { BY[m.key] = m; });
  const LEGACY = { bark: 'bark-dark', rock: 'river-rock', soil: 'topsoil' };
  const DEFAULT_FOR = { bed: 'bark-dark', gravel: 'gravel-34' };
  function keyFor(el) {
    if (el.material && BY[el.material]) return el.material;
    if (el.type === 'area' && el.subtype === 'bed') return LEGACY[el.surface] || DEFAULT_FOR.bed;
    return DEFAULT_FOR[el.subtype] || null;
  }

  // boulders
  const ROCKS = [
    { key: 'granite', name: 'Granite boulder (grey)', pal: ['#8d8f92', '#a4a6a9', '#7a7c80', '#b4b5b6'], rough: 0.85, flat: true },
    { key: 'basalt', name: 'Basalt boulder (dark)', pal: ['#3d4046', '#2f3237', '#4a4e55', '#25282c'], rough: 0.8, flat: true },
    { key: 'moss', name: 'Moss rock (green-grey)', pal: ['#7d8a6c', '#6a7a5a', '#8d9a7c', '#5a6a4c'], rough: 1, flat: false },
    { key: 'sandstone', name: 'Sandstone boulder (tan)', pal: ['#c4a176', '#b48f62', '#d2b48a', '#a07d52'], rough: 0.95, flat: false },
    { key: 'redstone', name: 'Red sandstone boulder', pal: ['#a95a3c', '#b96a48', '#964b32', '#c47a56'], rough: 0.95, flat: false },
    { key: 'limestone', name: 'Limestone boulder (cream)', pal: ['#d8d0bc', '#c8bfa8', '#e6dfcc', '#b8ae96'], rough: 0.9, flat: false },
    { key: 'lava', name: 'Lava boulder (red-black)', pal: ['#4a2a22', '#5a3026', '#3a211b', '#6a382c'], rough: 1, flat: true },
  ];
  const ROCK_BY = {}; ROCKS.forEach((r) => { ROCK_BY[r.key] = r; });
  const BOULDER_SIZES = [['Small', 1.5], ['Medium', 2.5], ['Large', 3.5], ['Huge', 5]];

  // ------------------------------------------------------------- stone drawing
  function stoneShape(R, kind, r) {
    if (kind === 'round') { const n = 10 + (R() * 4 | 0), rx = r * (0.9 + 0.2 * R()), ry = r * (0.62 + 0.3 * R()); const rot = R() * 3.1416; const v = []; for (let i = 0; i < n; i++) { const a = (i / n) * 6.2832; const k = 0.92 + 0.16 * R(); v.push([Math.cos(a) * rx * k, Math.sin(a) * ry * k]); } return { v, rot, smooth: true }; }
    if (kind === 'flat') { const n = 5 + (R() * 3 | 0), rx = r * (1.0 + 0.3 * R()), ry = r * (0.4 + 0.2 * R()); const rot = R() * 3.1416; const v = []; for (let i = 0; i < n; i++) { const a = (i / n) * 6.2832 + R() * 0.4; const k = 0.7 + 0.4 * R(); v.push([Math.cos(a) * rx * k, Math.sin(a) * ry * k]); } return { v, rot, smooth: false }; }
    if (kind === 'chip') { const n = 6 + (R() * 3 | 0), rx = r * (1.0 + 0.3 * R()), ry = r * (0.45 + 0.25 * R()); const rot = R() * 3.1416; const v = []; for (let i = 0; i < n; i++) { const a = (i / n) * 6.2832 + R() * 0.3; const k = 0.8 + 0.3 * R(); v.push([Math.cos(a) * rx * k, Math.sin(a) * ry * k]); } return { v, rot, smooth: false, bark: true }; }
    const n = 5 + (R() * 4 | 0), rr = r; const rot = R() * 3.1416; const v = []; for (let i = 0; i < n; i++) { const a = (i / n) * 6.2832 + R() * 0.5; const k = 0.62 + 0.5 * R(); v.push([Math.cos(a) * rr * k, Math.sin(a) * rr * k * (0.8 + 0.3 * R())]); } return { v, rot, smooth: false };
  }
  function pathOf(g, sh, x, y) {
    const c = Math.cos(sh.rot), s = Math.sin(sh.rot); const P = sh.v.map((p) => [x + p[0] * c - p[1] * s, y + p[0] * s + p[1] * c]);
    g.beginPath();
    if (sh.smooth) { const n = P.length; const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; let m0 = mid(P[n - 1], P[0]); g.moveTo(m0[0], m0[1]); for (let i = 0; i < n; i++) { const m = mid(P[i], P[(i + 1) % n]); g.quadraticCurveTo(P[i][0], P[i][1], m[0], m[1]); } }
    else { g.moveTo(P[0][0], P[0][1]); for (let i = 1; i < P.length; i++) g.lineTo(P[i][0], P[i][1]); }
    g.closePath(); return P;
  }
  function drawStone(g, hg, sh, x, y, col, o) {
    const P = pathOf(g, sh, x, y); const [cx, cy] = [x, y];
    if (sh.smooth) {
      const rr = Math.max(...sh.v.map((p) => Math.hypot(p[0], p[1])));
      const gr = g.createRadialGradient(cx - rr * 0.35, cy - rr * 0.4, rr * 0.1, cx, cy, rr * 1.05); gr.addColorStop(0, rgb(col, 1.22)); gr.addColorStop(0.6, rgb(col, 0.95)); gr.addColorStop(1, rgb(col, 0.6));
      g.fillStyle = gr; g.fill(); g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = Math.max(1, rr * 0.07); g.stroke();
      if (o.gloss) { g.fillStyle = 'rgba(255,255,255,0.22)'; g.beginPath(); g.ellipse(cx - rr * 0.3, cy - rr * 0.35, rr * 0.28, rr * 0.14, -0.6, 0, 6.28); g.fill(); }
      pathOf(hg, sh, x, y); const hgr = hg.createRadialGradient(cx, cy, 0, cx, cy, rr * 1.05); hgr.addColorStop(0, '#fff'); hgr.addColorStop(0.65, '#a8a8a8'); hgr.addColorStop(1, '#404040'); hg.fillStyle = hgr; hg.fill();
    } else {
      // faceted: shade every wedge by how much it faces the light (top-left)
      const n = P.length; for (let i = 0; i < n; i++) {
        const a = P[i], b = P[(i + 1) % n]; const ang = Math.atan2((a[1] + b[1]) / 2 - cy, (a[0] + b[0]) / 2 - cx); const sh2 = 0.72 + 0.4 * Math.max(0, Math.cos(ang - 3.9));
        g.fillStyle = rgb(col, sh2 + (o.jit || 0)); g.beginPath(); g.moveTo(cx, cy); g.lineTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.closePath(); g.fill();
        hg.fillStyle = `rgb(${Math.round(110 + 120 * (sh2 - 0.6))},${Math.round(110 + 120 * (sh2 - 0.6))},${Math.round(110 + 120 * (sh2 - 0.6))})`; hg.beginPath(); hg.moveTo(cx, cy); hg.lineTo(a[0], a[1]); hg.lineTo(b[0], b[1]); hg.closePath(); hg.fill();
      }
      g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 1.1; pathOf(g, sh, x, y); g.stroke(); hg.strokeStyle = 'rgba(0,0,0,0.9)'; hg.lineWidth = 2; pathOf(hg, sh, x, y); hg.stroke();
      if (sh.bark) { g.strokeStyle = 'rgba(20,10,5,0.35)'; g.lineWidth = 0.9; const c2 = Math.cos(sh.rot), s2 = Math.sin(sh.rot); for (let k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(x + (-0.6 * 20) * c2 - k * 4 * s2, y + (-0.6 * 20) * s2 + k * 4 * c2); g.lineTo(x + (0.6 * 20) * c2 - k * 4 * s2, y + (0.6 * 20) * s2 + k * 4 * c2); g.stroke(); } }
    }
    if (o.speckle) { g.save(); pathOf(g, sh, x, y); g.clip(); for (let i = 0; i < 12; i++) { g.fillStyle = Math.random() > 0.5 ? 'rgba(20,20,20,0.35)' : 'rgba(255,255,255,0.3)'; g.fillRect(x + (Math.random() - 0.5) * 26, y + (Math.random() - 0.5) * 20, 2, 2); } g.restore(); }
    if (o.pores) { g.save(); pathOf(g, sh, x, y); g.clip(); for (let i = 0; i < 7; i++) { g.fillStyle = 'rgba(0,0,0,0.55)'; g.beginPath(); g.arc(x + (Math.random() - 0.5) * 24, y + (Math.random() - 0.5) * 18, 1 + Math.random() * 2.2, 0, 6.28); g.fill(); } g.restore(); }
  }

  // ------------------------------------------------------- material generators
  const N = 512;
  function genStones(m) {
    const [c, g] = cv(N), [h, hg] = cv(N); const R = rng(hashStr(m.key));
    g.fillStyle = m.base; g.fillRect(0, 0, N, N); hg.fillStyle = '#1c1c1c'; hg.fillRect(0, 0, N, N);
    if (m.fines) { for (let i = 0; i < 9000; i++) { const p = hex(m.pal[(R() * m.pal.length) | 0]); g.fillStyle = rgb(p, 0.7 + R() * 0.4, 0.8); g.fillRect(R() * N, R() * N, 1 + R() * 2, 1 + R() * 2); } }
    const pal = m.pal.map(hex); const avg = (m.r[0] + m.r[1]) / 2; const cover = m.kind === 'flat' ? 0.9 : 1.25;
    let count = Math.min(4200, Math.round(N * N / (Math.PI * avg * avg * (m.kind === 'round' ? 0.7 : 0.55)) * cover));
    const items = [];
    for (let i = 0; i < count; i++) { const r = lerp(m.r[0], m.r[1], Math.pow(R(), 1.2)); items.push({ x: R() * N, y: R() * N, r, sh: stoneShape(R, m.kind, r), col: pal[(R() * pal.length) | 0], jit: (R() - 0.5) * 0.18 }); }
    items.forEach((it) => { wrap(N, it.x, it.y, it.r * 1.5, (x, y) => drawStone(g, hg, it.sh, x, y, it.col, { jit: it.jit, gloss: m.gloss, speckle: m.speckle, pores: m.pores })); });
    return [c, h];
  }
  function genFine(m) {
    const [c, g] = cv(N), [h, hg] = cv(N); const R = rng(hashStr(m.key)); const pal = m.pal.map(hex);
    g.fillStyle = m.base; g.fillRect(0, 0, N, N); hg.fillStyle = '#808080'; hg.fillRect(0, 0, N, N);
    for (let i = 0; i < 26000; i++) { const x = R() * N, y = R() * N, s = 1 + R() * 2.6; g.fillStyle = rgb(pal[(R() * pal.length) | 0], 0.8 + R() * 0.45, 0.9); g.fillRect(x, y, s, s * (0.7 + R() * 0.5)); const v = Math.round(60 + R() * 170); hg.fillStyle = `rgb(${v},${v},${v})`; hg.fillRect(x, y, s, s); }
    for (let i = 0; i < 260; i++) { const x = R() * N, y = R() * N, r = 3 + R() * 6; const sh = stoneShape(R, 'angular', r); const col = pal[(R() * pal.length) | 0]; wrap(N, x, y, r * 1.4, (xx, yy) => drawStone(g, hg, sh, xx, yy, col, { jit: 0 })); }
    return [c, h];
  }
  function genShred(m) {
    const [c, g] = cv(N), [h, hg] = cv(N); const R = rng(hashStr(m.key)); const pal = m.pal.map(hex);
    g.fillStyle = m.base; g.fillRect(0, 0, N, N); hg.fillStyle = '#2a2a2a'; hg.fillRect(0, 0, N, N);
    for (let i = 0; i < 2600; i++) {
      const x = R() * N, y = R() * N, L = 26 + R() * 70, a = R() * 6.2832, bend = (R() - 0.5) * 24, w = 2.2 + R() * 2.4; const col = pal[(R() * pal.length) | 0], k = 0.75 + R() * 0.5;
      wrap(N, x, y, L, (xx, yy) => {
        const ex = xx + Math.cos(a) * L, ey = yy + Math.sin(a) * L, mx = (xx + ex) / 2 - Math.sin(a) * bend, my = (yy + ey) / 2 + Math.cos(a) * bend;
        g.strokeStyle = 'rgba(0,0,0,0.45)'; g.lineWidth = w + 1.4; g.lineCap = 'round'; g.beginPath(); g.moveTo(xx, yy); g.quadraticCurveTo(mx, my, ex, ey); g.stroke();
        g.strokeStyle = rgb(col, k); g.lineWidth = w; g.beginPath(); g.moveTo(xx, yy); g.quadraticCurveTo(mx, my, ex, ey); g.stroke();
        hg.strokeStyle = `rgb(${Math.round(150 + R() * 100)},${Math.round(150 + R() * 100)},${Math.round(150 + R() * 100)})`; hg.lineWidth = w; hg.lineCap = 'round'; hg.beginPath(); hg.moveTo(xx, yy); hg.quadraticCurveTo(mx, my, ex, ey); hg.stroke();
      });
    }
    return [c, h];
  }
  function genSoil(m) {
    const [c, g] = cv(N), [h, hg] = cv(N); const R = rng(hashStr(m.key)); const pal = m.pal.map(hex);
    g.fillStyle = m.base; g.fillRect(0, 0, N, N); hg.fillStyle = '#707070'; hg.fillRect(0, 0, N, N);
    for (let i = 0; i < 220; i++) { const x = R() * N, y = R() * N, r = 6 + R() * 16; const col = pal[(R() * pal.length) | 0]; wrap(N, x, y, r, (xx, yy) => { const gr = g.createRadialGradient(xx, yy, 0, xx, yy, r); gr.addColorStop(0, rgb(col, 1.05, 0.55)); gr.addColorStop(1, rgb(col, 1, 0)); g.fillStyle = gr; g.beginPath(); g.arc(xx, yy, r, 0, 6.28); g.fill(); const hh = hg.createRadialGradient(xx, yy, 0, xx, yy, r); hh.addColorStop(0, 'rgba(255,255,255,0.6)'); hh.addColorStop(1, 'rgba(255,255,255,0)'); hg.fillStyle = hh; hg.beginPath(); hg.arc(xx, yy, r, 0, 6.28); hg.fill(); }); }
    for (let i = 0; i < 14000; i++) { const x = R() * N, y = R() * N, s = 1 + R() * 2.2; g.fillStyle = R() > 0.5 ? 'rgba(0,0,0,0.22)' : 'rgba(190,150,110,0.24)'; g.fillRect(x, y, s, s); const v = Math.round(40 + R() * 200); hg.fillStyle = `rgb(${v},${v},${v})`; hg.fillRect(x, y, s, s); }
    return [c, h];
  }
  function genSand(m) {
    const [c, g] = cv(N), [h, hg] = cv(N); const R = rng(hashStr(m.key)); const pal = m.pal.map(hex);
    g.fillStyle = m.base; g.fillRect(0, 0, N, N); hg.fillStyle = '#808080'; hg.fillRect(0, 0, N, N);
    for (let i = 0; i < 40; i++) { const y0 = R() * N; g.strokeStyle = 'rgba(120,100,60,0.08)'; g.lineWidth = 3 + R() * 6; g.beginPath(); for (let x = 0; x <= N; x += 16) g.lineTo(x, y0 + Math.sin(x * 0.03 + i) * 6); g.stroke(); }
    for (let i = 0; i < 30000; i++) { const x = R() * N, y = R() * N; g.fillStyle = rgb(pal[(R() * pal.length) | 0], 0.9 + R() * 0.2, 0.5); g.fillRect(x, y, 1.4, 1.4); const v = Math.round(90 + R() * 80); hg.fillStyle = `rgb(${v},${v},${v})`; hg.fillRect(x, y, 1.4, 1.4); }
    return [c, h];
  }
  function genMaterial(m) {
    const gen = { round: genStones, angular: genStones, flat: genStones, chip: genStones, shred: genShred, fine: genFine, soil: genSoil, sand: genSand }[m.kind] || genStones;
    const [c, h] = gen(m);
    // small copy for the 2D plan (tile = 6 ft there; the real-size version is used in 3D)
    const [c2, g2] = cv(128); g2.imageSmoothingQuality = 'high'; g2.drawImage(c, 0, 0, 128, 128);
    return { canvas: c, height: h, ft: m.ft, canvas2d: c2, ft2d: 6 };
  }

  // ------------------------------------------------------------ surface textures (3D)
  const SURF = {
    lawn() { return genLawn(false); },
    turf() { return genLawn(true); },
    conc() {
      const [c, g] = cv(N), [h, hg] = cv(N); const R = rng(71);
      g.fillStyle = '#c6c4bc'; g.fillRect(0, 0, N, N); hg.fillStyle = '#909090'; hg.fillRect(0, 0, N, N);
      for (let i = 0; i < 16000; i++) { const x = R() * N, y = R() * N; g.fillStyle = R() > 0.5 ? 'rgba(255,255,255,0.16)' : 'rgba(70,70,64,0.14)'; g.fillRect(x, y, 1 + R() * 1.8, 1 + R() * 1.8); const v = Math.round(100 + R() * 110); hg.fillStyle = `rgb(${v},${v},${v})`; hg.fillRect(x, y, 1.6, 1.6); }
      for (let y = 0; y < N; y += 4) { g.fillStyle = 'rgba(90,90,84,0.045)'; g.fillRect(0, y, N, 1.5); }
      for (let i = 0; i < 18; i++) { const x = R() * N, y = R() * N, r = 20 + R() * 50; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(90,90,84,0.07)'); gr.addColorStop(1, 'rgba(90,90,84,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 6.28); g.fill(); }
      g.strokeStyle = 'rgba(70,70,64,0.7)'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 1.5); g.lineTo(N, 1.5); g.moveTo(1.5, 0); g.lineTo(1.5, N); g.stroke();
      hg.strokeStyle = '#000'; hg.lineWidth = 4; hg.beginPath(); hg.moveTo(0, 2); hg.lineTo(N, 2); hg.moveTo(2, 0); hg.lineTo(2, N); hg.stroke();
      return { canvas: c, height: h, ft: 8 };
    },
    pavers() {
      const [c, g] = cv(N), [h, hg] = cv(N); const R = rng(81); const tones = ['#b39a82', '#a88d74', '#bca58d', '#9f8670', '#b8a088', '#a0958a', '#b09078'].map(hex);
      g.fillStyle = '#6e6252'; g.fillRect(0, 0, N, N); hg.fillStyle = '#000'; hg.fillRect(0, 0, N, N);
      const rows = 8, bh = N / rows, bw = bh * 2;
      for (let r = 0; r < rows; r++) { const off = r % 2 ? bw / 2 : 0; for (let col = -1; col < 4; col++) {
        const x = col * bw + off, y = r * bh, t = tones[(R() * tones.length) | 0], k = 0.9 + R() * 0.2;
        g.fillStyle = rgb(t, k); g.fillRect(x + 2, y + 2, bw - 4, bh - 4);
        for (let i = 0; i < 70; i++) { g.fillStyle = R() > 0.5 ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'; g.fillRect(x + 3 + R() * (bw - 8), y + 3 + R() * (bh - 8), 1.6, 1.6); }
        g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(x + 2, y + 2, bw - 4, 3); g.fillRect(x + 2, y + 2, 3, bh - 4); g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(x + 2, y + bh - 6, bw - 4, 4); g.fillRect(x + bw - 6, y + 2, 4, bh - 4);
        const v = Math.round(150 + R() * 60); hg.fillStyle = `rgb(${v},${v},${v})`; hg.fillRect(x + 3, y + 3, bw - 6, bh - 6);
      } }
      return { canvas: c, height: h, ft: 2.667 };
    },
    flagstone() {
      const [c, g] = cv(N), [h, hg] = cv(N); const R = rng(93); const cells = 5, cw = N / cells; const pts = [];
      for (let j = 0; j < cells; j++) for (let i = 0; i < cells; i++) pts.push({ x: (i + 0.15 + R() * 0.7) * cw, y: (j + 0.15 + R() * 0.7) * cw, ci: i, cj: j });
      const tones = ['#a39a85', '#948b78', '#b0a68f', '#8c8470', '#a89b84', '#9a9080', '#b8a98a', '#857d70'].map(hex);
      pts.forEach((p) => { p.col = tones[(R() * tones.length) | 0]; p.k = 0.88 + R() * 0.24; p.lvl = 120 + R() * 90; p.gx = (R() - 0.5) * 0.12; });
      const img = g.createImageData(N, N), him = hg.createImageData(N, N);
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        const ci = Math.floor(x / cw), cj = Math.floor(y / cw); let d1 = 1e9, d2 = 1e9, b = null;
        for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
          const ii = (ci + di + cells) % cells, jj = (cj + dj + cells) % cells; const p = pts[jj * cells + ii]; const px = p.x + (ci + di < 0 ? -N : ci + di >= cells ? N : 0), py = p.y + (cj + dj < 0 ? -N : cj + dj >= cells ? N : 0);
          const d = Math.hypot(x - px, y - py); if (d < d1) { d2 = d1; d1 = d; b = p; } else if (d < d2) d2 = d;
        }
        const edge = d2 - d1; const o = (y * N + x) * 4;
        if (edge < 4.5) { img.data[o] = 70; img.data[o + 1] = 64; img.data[o + 2] = 54; img.data[o + 3] = 255; him.data[o] = him.data[o + 1] = him.data[o + 2] = 0; him.data[o + 3] = 255; continue; }
        const n = (Math.sin(x * 0.07 + b.x) + Math.sin(y * 0.09 + b.y)) * 0.04 + (((x * 7 + y * 13) % 11) / 11 - 0.5) * 0.09; const k = b.k + n + (x - b.x) * b.gx * 0.01;
        const bevel = edge < 14 ? 0.82 + 0.18 * ((edge - 4.5) / 9.5) : 1;
        img.data[o] = clamp(b.col[0] * k * bevel, 0, 255); img.data[o + 1] = clamp(b.col[1] * k * bevel, 0, 255); img.data[o + 2] = clamp(b.col[2] * k * bevel, 0, 255); img.data[o + 3] = 255;
        const hv = clamp(b.lvl * (edge < 14 ? 0.55 + 0.45 * ((edge - 4.5) / 9.5) : 1) + n * 140, 0, 255); him.data[o] = him.data[o + 1] = him.data[o + 2] = hv; him.data[o + 3] = 255;
      }
      g.putImageData(img, 0, 0); hg.putImageData(him, 0, 0);
      return { canvas: c, height: h, ft: 6 };
    },
    deck() {
      const [c, g] = cv(N), [h, hg] = cv(N); const R = rng(91); const tones = ['#a9713f', '#9a6636', '#b77c48', '#8e5e31', '#a56d3b'].map(hex); const planks = 4, ph = N / planks;
      g.fillStyle = '#2a1a0e'; g.fillRect(0, 0, N, N); hg.fillStyle = '#000'; hg.fillRect(0, 0, N, N);
      for (let r = 0; r < planks; r++) {
        const y = r * ph, t = tones[(R() * tones.length) | 0], k = 0.92 + R() * 0.16; const joint = (R() * 0.6 + 0.2) * N;
        [[0, joint], [joint, N]].forEach(([x0, x1], si) => {
          const kk = k * (si ? 1.04 : 0.97); g.fillStyle = rgb(t, kk); g.fillRect(x0 + 1.5, y + 3, x1 - x0 - 3, ph - 6); hg.fillStyle = '#b0b0b0'; hg.fillRect(x0 + 1.5, y + 3, x1 - x0 - 3, ph - 6);
          for (let i = 0; i < 46; i++) { const gy = y + 5 + R() * (ph - 10); g.strokeStyle = `rgba(${R() > 0.5 ? '60,35,15' : '210,160,110'},${0.12 + R() * 0.16})`; g.lineWidth = 0.8 + R(); g.beginPath(); g.moveTo(x0 + R() * 40, gy); g.bezierCurveTo(x0 + (x1 - x0) * 0.3, gy + (R() - 0.5) * 6, x0 + (x1 - x0) * 0.7, gy + (R() - 0.5) * 6, x1 - R() * 40, gy + (R() - 0.5) * 4); g.stroke(); }
          if (R() > 0.4) { const kx = x0 + 30 + R() * (x1 - x0 - 60), ky = y + 20 + R() * (ph - 40); g.fillStyle = 'rgba(55,30,12,0.55)'; g.beginPath(); g.ellipse(kx, ky, 9, 5, 0, 0, 6.28); g.fill(); g.strokeStyle = 'rgba(55,30,12,0.3)'; g.lineWidth = 1; g.beginPath(); g.ellipse(kx, ky, 15, 8, 0, 0, 6.28); g.stroke(); }
          g.fillStyle = 'rgba(40,40,40,0.75)'; for (const sx of [x0 + 14, x1 - 14]) { g.beginPath(); g.arc(sx, y + ph * 0.28, 2.2, 0, 6.28); g.arc(sx, y + ph * 0.72, 2.2, 0, 6.28); g.fill(); }
        });
      }
      return { canvas: c, height: h, ft: 1.9 };
    },
  };
  function genLawn(turf) {
    const [c, g] = cv(N), [h, hg] = cv(N); const R = rng(turf ? 29 : 17);
    const base = turf ? ['#5fa046', '#68ab4c', '#559a3e'] : ['#5f9a3f', '#6aa648', '#548f38', '#76b052', '#4d8434'];
    g.fillStyle = base[0]; g.fillRect(0, 0, N, N); hg.fillStyle = '#707070'; hg.fillRect(0, 0, N, N);
    for (let i = 0; i < 46; i++) { const x = R() * N, y = R() * N, r = 30 + R() * 80; const col = hex(base[(R() * base.length) | 0]); wrap(N, x, y, r, (xx, yy) => { const gr = g.createRadialGradient(xx, yy, 0, xx, yy, r); gr.addColorStop(0, rgb(col, 1, 0.4)); gr.addColorStop(1, rgb(col, 1, 0)); g.fillStyle = gr; g.beginPath(); g.arc(xx, yy, r, 0, 6.28); g.fill(); }); }
    const blades = turf ? 26000 : 20000;
    for (let i = 0; i < blades; i++) { const x = R() * N, y = R() * N, L = 6 + R() * 10, a = -1.5708 + (R() - 0.5) * (turf ? 0.7 : 1.5); const col = hex(base[(R() * base.length) | 0]); const k = 0.7 + R() * 0.55;
      wrap(N, x, y, L, (xx, yy) => { g.strokeStyle = rgb(col, k, 0.9); g.lineWidth = 1 + R() * 0.8; g.lineCap = 'round'; g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx + Math.cos(a) * L, yy + Math.sin(a) * L); g.stroke(); const v = Math.round(90 + k * 90); hg.strokeStyle = `rgb(${v},${v},${v})`; hg.lineWidth = 1.2; hg.beginPath(); hg.moveTo(xx, yy); hg.lineTo(xx + Math.cos(a) * L, yy + Math.sin(a) * L); hg.stroke(); }); }
    if (!turf) { for (let i = 0; i < 90; i++) { g.fillStyle = 'rgba(190,170,90,0.35)'; g.fillRect(R() * N, R() * N, 1.5, 3); } } else { g.fillStyle = 'rgba(30,70,20,0.08)'; for (let y = 0; y < N; y += 6) g.fillRect(0, y, N, 1.5); }
    return { canvas: c, height: h, ft: turf ? 3 : 4 };
  }

  const cache = {};
  function tex(key) { if (cache[key] === undefined) { const m = BY[key]; cache[key] = m ? genMaterial(m) : (SURF[key] ? SURF[key]() : null); } return cache[key]; }
  function tex2d(key) { const t = tex(key); if (!t) return null; return t.canvas2d ? { canvas: t.canvas2d, ft: t.ft2d } : { canvas: t.canvas, ft: t.ft }; }
  const thumbCache = {};
  function thumb(key, size) {
    size = size || 56; const k = key + size; if (thumbCache[k]) return thumbCache[k];
    const t = tex(key); if (!t) return ''; const [c, g] = cv(size); g.imageSmoothingQuality = 'high';
    const src = t.canvas; const crop = Math.min(src.width, Math.round(src.width * Math.min(1, 1.2 / t.ft))); g.drawImage(src, 0, 0, crop, crop, 0, 0, size, size);
    return (thumbCache[k] = c.toDataURL('image/png'));
  }

  DPRO.mat = { list: MATS, by: BY, groups: G, rocks: ROCKS, rockBy: ROCK_BY, boulderSizes: BOULDER_SIZES, keyFor, tex, tex2d, thumb, legacy: LEGACY, rng, hashStr };

  // ============================================================================
  // Editor integration (skipped on the customer 3D page)
  // ============================================================================
  if (!DPRO.types || !DPRO.addToolGroup || typeof Konva === 'undefined') return;
  const $ = (id) => document.getElementById(id);
  const esc = DPRO.esc || ((s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])));
  const armed = { mat: 'bark-dark', rock: 'granite', size: 2.5, fromCard: false };
  const money = (n) => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // new beds/gravel areas pick up the material chosen in the library
  const origAdd = window.addElement;
  window.addElement = function (el) {
    if (el && el.type === 'area' && (el.subtype === 'bed' || el.subtype === 'gravel') && !el.material && armed.active) el.material = armed.mat;
    return origAdd.apply(this, arguments);
  };

  // ---- catalog panel ----
  const catPanel = $('design-panel-catalog');
  const sec = document.createElement('div'); sec.id = 'design-catalog-mat'; sec.className = 'design-catalog-section'; sec.hidden = true;
  if (catPanel) catPanel.appendChild(sec);
  function renderCatalog() {
    let h = `<div class="design-tool-group-label">Rock, gravel &amp; mulch</div><p class="empty-sub" style="margin:4px 0 8px">Tap a material, then click points on the plan to draw the area. Enter to finish.</p>`;
    Object.keys(G).forEach((gk) => {
      const list = MATS.filter((m) => m.group === G[gk]); if (!list.length) return;
      h += `<div class="design-tool-group-label" style="margin-top:10px">${G[gk]}</div><div class="dpm-grid">`;
      list.forEach((m) => { h += `<button type="button" class="dpm-card${armed.mat === m.key && armed.active ? ' on' : ''}" data-mat="${m.key}" title="${esc(m.note)}"><img alt="" src="${thumb(m.key, 64)}" /><span>${esc(m.name)}</span></button>`; });
      h += '</div>';
    });
    h += `<div class="design-tool-group-label" style="margin-top:12px">Boulders</div><div class="dpm-row">`;
    ROCKS.forEach((r) => { h += `<button type="button" class="dpm-chip${armed.rock === r.key && armed.boulder ? ' on' : ''}" data-rock="${r.key}"><i style="background:${r.pal[0]}"></i>${esc(r.name)}</button>`; });
    h += `</div><div class="dpm-row" style="margin-top:6px">`;
    BOULDER_SIZES.forEach(([l, ft]) => { h += `<button type="button" class="dpm-chip${armed.size === ft ? ' on' : ''}" data-bsize="${ft}">${l} (${ft} ft)</button>`; });
    h += '</div><p class="empty-sub" style="margin-top:6px">Pick a boulder type and size, then click the plan to place it.</p>';
    sec.innerHTML = h;
    sec.querySelectorAll('[data-mat]').forEach((b) => b.addEventListener('click', () => {
      armed.mat = b.dataset.mat; armed.active = true; armed.boulder = false; armed.fromCard = true;
      setActiveTool(BY[armed.mat].group === G.GRAVEL ? 'area-gravel' : 'area-bed'); renderCatalog();
    }));
    sec.querySelectorAll('[data-rock]').forEach((b) => b.addEventListener('click', () => { armed.rock = b.dataset.rock; armed.boulder = true; armed.fromCard = true; setActiveTool('boulder'); renderCatalog(); }));
    sec.querySelectorAll('[data-bsize]').forEach((b) => b.addEventListener('click', () => { armed.size = Number(b.dataset.bsize); armed.boulder = true; armed.fromCard = true; setActiveTool('boulder'); renderCatalog(); }));
  }
  const prevHook = DPRO.toolHook;
  DPRO.toolHook = function (tool) {
    if (prevHook) prevHook(tool);
    const mine = tool === 'area-bed' || tool === 'area-gravel' || tool === 'boulder';
    if (!armed.fromCard) { armed.active = false; if (tool !== 'boulder') armed.boulder = false; }
    armed.fromCard = false;
    if (mine) {
      renderCatalog(); sec.hidden = false; const empty = $('design-catalog-empty'); if (empty) empty.hidden = true; switchSidePanel('catalog');
    } else sec.hidden = true;
  };
  DPRO.hints.boulder = 'Click to place a boulder. Pick the rock type and size in the Catalog tab. Drag to move it.';
  DPRO.pointTools.boulder = function (pos) {
    addElement({ id: uid(), type: 'boulder', rock: armed.rock, sizeFt: armed.size, x: pos.x, y: pos.y, rotationDeg: Math.round(Math.random() * 360), seed: 1 + Math.floor(Math.random() * 9999) });
  };

  // ---- boulder element ----
  function boulderPoints(el) {
    const R = rng((el.seed || 1) * 7919); const n = 11 + (R() * 3 | 0), rad = ((el.sizeFt || 2.5) / 2) * pxPerFt; const pts = [];
    for (let i = 0; i < n; i++) { const a = (i / n) * 6.2832; const k = 0.8 + 0.3 * R(); pts.push(Math.cos(a) * rad * k * 1.05, Math.sin(a) * rad * k * 0.88); }
    return pts;
  }
  DPRO.types.boulder = {
    layerKey: () => 'boulders',
    build(el) {
      const rock = ROCK_BY[el.rock] || ROCKS[0]; const g = new Konva.Group({ x: el.x, y: el.y, rotation: el.rotationDeg || 0, draggable: activeTool === 'select' });
      const pts = boulderPoints(el); const rad = ((el.sizeFt || 2.5) / 2) * pxPerFt; const base = hex(rock.pal[0]);
      g.add(new Konva.Line({ points: pts, closed: true, x: 1.5, y: 2.5, fill: 'rgba(0,0,0,0.28)', listening: false }));
      g.add(new Konva.Line({ points: pts, closed: true, tension: 0.18, stroke: '#2a2a28', strokeWidth: 1.4, lineJoin: 'round', fillLinearGradientStartPoint: { x: -rad, y: -rad }, fillLinearGradientEndPoint: { x: rad, y: rad }, fillLinearGradientColorStops: [0, rgb(base, 1.3), 0.45, rgb(base, 1), 1, rgb(base, 0.62)], name: 'main' }));
      const R = rng((el.seed || 1) * 31);
      for (let i = 0; i < 3; i++) { const a = R() * 6.28, d = rad * (0.15 + R() * 0.35); g.add(new Konva.Line({ points: [Math.cos(a) * d, Math.sin(a) * d, Math.cos(a + 0.6) * d * 1.7, Math.sin(a + 0.6) * d * 1.7], stroke: 'rgba(0,0,0,0.35)', strokeWidth: 0.9, listening: false })); }
      g.add(new Konva.Ellipse({ x: -rad * 0.3, y: -rad * 0.3, radiusX: rad * 0.28, radiusY: rad * 0.16, rotation: -30, fill: 'rgba(255,255,255,0.25)', listening: false }));
      if (el.label) g.add(new Konva.Text({ text: el.label, x: rad * 0.7, y: -6, fontSize: 10, fontStyle: 'bold', fill: DPRO.ink(), stroke: DPRO.halo(), strokeWidth: 3, fillAfterStrokeEnabled: true, listening: false, rotation: -(el.rotationDeg || 0) }));
      g.on('dragend', () => { el.x = g.x(); el.y = g.y(); markDirty(); if (selectedElementId === el.id) positionSelectionRing(el); });
      attachSelectHandler(g, el); return g;
    },
    props(el, box) {
      let h = DPRO.fieldHtml('Rock type', `<select id="bd-rock">${ROCKS.map((r) => `<option value="${r.key}" ${el.rock === r.key ? 'selected' : ''}>${esc(r.name)}</option>`).join('')}</select>`);
      h += DPRO.fieldHtml('Size across (feet)', `<input id="bd-size" type="number" min="0.5" max="12" step="0.5" value="${el.sizeFt || 2.5}" />`);
      h += DPRO.fieldHtml('Turn (degrees)', `<input id="bd-rot" type="number" min="0" max="359" step="15" value="${el.rotationDeg || 0}" />`);
      h += DPRO.fieldHtml('Label (optional)', `<input id="bd-label" type="text" value="${esc(el.label || '')}" />`);
      box.innerHTML = h;
      const upd = (k, v) => { el[k] = v; DPRO.rerender(el); markDirty(); DPRO.runLegend(); };
      $('bd-rock').addEventListener('change', (e) => upd('rock', e.target.value));
      $('bd-size').addEventListener('change', (e) => upd('sizeFt', clamp(Number(e.target.value) || 2.5, 0.5, 12)));
      $('bd-rot').addEventListener('change', (e) => upd('rotationDeg', Number(e.target.value) || 0));
      $('bd-label').addEventListener('change', (e) => upd('label', e.target.value));
    },
  };
  DPRO.addLayer('boulders', 'Boulders');

  // ---- material picker on beds / gravel areas ----
  DPRO.propHooks.push(function (el, box) {
    if (el.type !== 'area' || (el.subtype !== 'bed' && el.subtype !== 'gravel')) return;
    const old = $('pf-x-surface'); if (old) { const f = old.closest('.design-properties-field'); if (f) f.remove(); }
    const cur = keyFor(el), m = BY[cur];
    let opts = ''; Object.keys(G).forEach((gk) => { opts += `<optgroup label="${G[gk]}">${MATS.filter((x) => x.group === G[gk]).map((x) => `<option value="${x.key}" ${x.key === cur ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</optgroup>`; });
    const sq = DPRO.areaSqFt ? DPRO.areaSqFt(el) : polygonAreaSqFt(el.points); const depth = el.depthIn || m.depthIn; const cy = sq * depth / 12 / 27;
    const html = `<div class="design-properties-field dpm-prop"><label>Material</label><div class="dpm-propwrap"><img alt="" id="mp-thumb" src="${thumb(cur, 56)}" /><select id="mp-mat">${opts}</select></div><small>${esc(m.note)}</small></div>` +
      DPRO.fieldHtml('Depth (inches)', `<input id="mp-depth" type="number" min="1" max="12" step="0.5" value="${depth}" />`) +
      `<p class="empty-sub" id="mp-qty">${sq.toFixed(0)} sq ft at ${depth} in deep = <strong>${cy.toFixed(2)} cu yd</strong>${m.ton ? ` (about ${(cy * m.ton).toFixed(1)} tons)` : ''}</p>`;
    box.insertAdjacentHTML('beforeend', html);
    $('mp-mat').addEventListener('change', (e) => { el.material = e.target.value; delete el.depthIn; DPRO.rerender(el); markDirty(); DPRO.runLegend(); DPRO.renderProps(el); });
    $('mp-depth').addEventListener('change', (e) => { el.depthIn = clamp(Number(e.target.value) || m.depthIn, 1, 12); markDirty(); DPRO.runLegend(); DPRO.renderProps(el); });
  });

  // ---- quantities ----
  function takeoff() {
    const rows = new Map();
    elements.forEach((el) => {
      if (el.type !== 'area' || (el.subtype !== 'bed' && el.subtype !== 'gravel')) return;
      const k = keyFor(el), m = BY[k]; if (!m) return; const sq = polygonAreaSqFt(el.points); const depth = el.depthIn || m.depthIn;
      const r = rows.get(k) || { m, sq: 0, cy: 0 }; r.sq += sq; r.cy += sq * depth / 12 / 27; rows.set(k, r);
    });
    const boulders = elements.filter((e) => e.type === 'boulder'); const bm = new Map();
    boulders.forEach((b) => { const k = (b.rock || 'granite') + '|' + (b.sizeFt || 2.5); bm.set(k, (bm.get(k) || 0) + 1); });
    return { rows: [...rows.values()], boulders: [...bm.entries()].map(([k, n]) => { const [r, s] = k.split('|'); return { rock: ROCK_BY[r] || ROCKS[0], size: Number(s), n }; }) };
  }
  DPRO.mat.takeoff = takeoff;
  function prices() { if (!DPRO.extras.matPrices || typeof DPRO.extras.matPrices !== 'object') DPRO.extras.matPrices = {}; return DPRO.extras.matPrices; }
  DPRO.addSideTab('materials', 'Rock & mulch', function (panel) {
    const t = takeoff(); const P = prices(); let total = 0;
    let h = `<div class="design-legend-group"><h4>Rock, gravel &amp; mulch needed</h4>`;
    if (!t.rows.length && !t.boulders.length) h += `<p class="empty-sub">Draw a bed or gravel area, or place boulders, and the quantities show up here.</p>`;
    t.rows.forEach((r) => {
      const price = Number(P[r.m.key]) || 0; const cost = r.cy * price; total += cost;
      h += `<div class="dpm-qrow"><img alt="" src="${thumb(r.m.key, 40)}" /><div><strong>${esc(r.m.name)}</strong><div class="empty-sub" style="margin:0">${r.sq.toFixed(0)} sq ft &middot; <strong>${r.cy.toFixed(2)} cu yd</strong>${r.m.ton ? ` &middot; ~${(r.cy * r.m.ton).toFixed(1)} tons` : ''}</div>
        <label class="dpm-price">$ per cu yd <input type="number" min="0" step="1" data-price="${r.m.key}" value="${price || ''}" placeholder="0" /></label>${price ? `<span class="dpm-cost">${money(cost)}</span>` : ''}</div></div>`;
    });
    if (t.boulders.length) { h += `<h4 style="margin-top:12px">Boulders</h4>`; t.boulders.forEach((b) => { h += `<div class="design-legend-row"><span>${esc(b.rock.name)} &mdash; ${b.size} ft</span><span>&times;${b.n}</span></div>`; }); }
    if (total) h += `<div class="design-legend-row design-legend-total"><span>Estimated material cost</span><span>${money(total)}</span></div>`;
    h += `<p class="empty-sub" style="margin-top:8px">Quantities use the depth set on each area (default depth for the material). Add 5-10% for settling and waste.</p></div>`;
    panel.innerHTML = h;
    panel.querySelectorAll('[data-price]').forEach((n) => n.addEventListener('change', () => { P[n.dataset.price] = Math.max(0, Number(n.value) || 0); markDirty(); setTimeout(() => DPRO.sidePanels.materials(), 0); }));
  });
  DPRO.legendHooks.push(function () {
    const t = takeoff(); if (!t.rows.length && !t.boulders.length) return '';
    let h = `<div class="design-legend-group"><h4>Rock, gravel &amp; mulch</h4>`;
    t.rows.forEach((r) => { h += `<div class="design-legend-row"><span>${esc(r.m.name)}</span><span>${r.cy.toFixed(1)} cu yd</span></div>`; });
    t.boulders.forEach((b) => { h += `<div class="design-legend-row"><span>${esc(b.rock.name)} ${b.size} ft</span><span>&times;${b.n}</span></div>`; });
    return h + '</div>';
  });
  DPRO.printHooks.push(function () {
    const t = takeoff(); if (!t.rows.length && !t.boulders.length) return '';
    let h = `<div class="design-print-section"><h3>Rock, gravel &amp; mulch</h3>`;
    t.rows.forEach((r) => { h += `<div class="design-print-row"><span>${esc(r.m.name)} (${r.sq.toFixed(0)} sq ft)</span><span>${r.cy.toFixed(1)} cu yd${r.m.ton ? ' / ' + (r.cy * r.m.ton).toFixed(1) + ' tons' : ''}</span></div>`; });
    t.boulders.forEach((b) => { h += `<div class="design-print-row"><span>${esc(b.rock.name)} &mdash; ${b.size} ft</span><span>&times;${b.n}</span></div>`; });
    return h + '</div>';
  });

  DPRO.addToolGroup('dpro-group-rock', 'Rock, gravel & mulch', [
    { id: 'btn-dpm-lib', label: 'Rock & mulch library', title: 'Pick river rock, lava rock, pea gravel, bark mulch and more, then draw the area', onclick: () => { armed.active = true; armed.fromCard = true; setActiveTool('area-bed'); } },
    { tool: 'boulder', label: 'Boulder', title: 'Place decorative boulders' },
    { id: 'btn-dpm-list', label: 'Quantities', title: 'Cubic yards and tons of each material', onclick: () => switchSidePanel('materials') },
  ]);
})();
