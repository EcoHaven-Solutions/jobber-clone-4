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
    { key: 'poly-sand-tan', name: 'Polymeric sand (tan)', group: G.SOIL, kind: 'sand', ft: 1.5, base: '#c7b189', pal: ['#d3bf98', '#bfa97f', '#b39d74'], depthIn: 1.5, ton: 1.4, bump: 0.6, rough: 1, note: 'Joint sand that hardens between flagstone and pavers' },
    { key: 'poly-sand-grey', name: 'Polymeric sand (grey)', group: G.SOIL, kind: 'sand', ft: 1.5, base: '#a3a198', pal: ['#b1afa6', '#97958c', '#85837b'], depthIn: 1.5, ton: 1.4, bump: 0.6, rough: 1, note: 'Grey joint sand that hardens between stones' },
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


  // ========================================================================
  // Flagstone & stone paths: many stone types, 4 layouts, and a choice of what
  // fills the joints (polymeric sand, stone dust, mulch, pebbles, grass ...).
  // The same picture is used on the 2D plan and on the 3D ground, so they match.
  // ========================================================================
  const FLAG_FT = 6;
  const FLAG_STONES = [
    { key: 'arizona-buff', name: 'Arizona buff sandstone', pal: ['#c9a574', '#d6b585', '#bf9a68', '#cdb08a', '#b89466'], strata: 0.35, grain: 0.1, note: 'Warm tan, the classic flagstone' },
    { key: 'arizona-rose', name: 'Arizona rose sandstone', pal: ['#b9735a', '#c78466', '#a9654d', '#d09a7e', '#b4806a'], strata: 0.4, grain: 0.1, note: 'Pinkish red-tan' },
    { key: 'colorado-red', name: 'Colorado red flagstone', pal: ['#9a4a38', '#a9573f', '#86402f', '#b8654a'], strata: 0.25, grain: 0.12, note: 'Deep brick red' },
    { key: 'rainbow', name: 'Rainbow (multicolor) flagstone', pal: ['#c0845a', '#8d8a82', '#b9a37a', '#a5635a', '#7f8a78', '#cfc0a0'], strata: 0.2, grain: 0.1, note: 'Mixed rust, tan, grey and olive' },
    { key: 'bluestone', name: 'Pennsylvania bluestone', pal: ['#6f7b88', '#7b8794', '#66727e', '#85909b', '#5d6975'], strata: 0.1, grain: 0.07, note: 'Blue-grey, smooth, formal' },
    { key: 'slate', name: 'Slate (charcoal)', pal: ['#3f4549', '#4a5155', '#394044', '#525a52', '#454b4e'], cleft: 1, grain: 0.08, note: 'Dark layered slate' },
    { key: 'limestone', name: 'Cream limestone', pal: ['#ddd2b8', '#d3c7a9', '#e6dcc5', '#c9bc9b', '#d9cdb0'], pits: 0.6, grain: 0.09, note: 'Soft cream, lightly pitted' },
    { key: 'travertine', name: 'Travertine (tan)', pal: ['#d8c6a4', '#cdb994', '#e0d1b2', '#bfaa82'], pits: 1, grain: 0.08, note: 'Warm tan with small pits' },
    { key: 'quartzite-silver', name: 'Silver quartzite', pal: ['#b3b6b8', '#a3a8ab', '#c3c6c7', '#9aa0a3'], speck: 0.7, grain: 0.1, note: 'Silvery grey with sparkle' },
    { key: 'quartzite-gold', name: 'Idaho gold quartzite', pal: ['#c8a95e', '#b99a52', '#d6b96f', '#a98a48', '#8f8c82'], speck: 0.5, grain: 0.1, note: 'Gold, rust and grey with sparkle' },
    { key: 'granite-grey', name: 'Grey granite', pal: ['#8f9194', '#a2a4a6', '#7c7e82', '#b0b1b2'], speck: 0.9, grain: 0.12, note: 'Speckled granite' },
  ];
  const FLAG_BY = {}; FLAG_STONES.forEach((f) => { FLAG_BY[f.key] = f; });
  const FLAG_PATTERNS = [['irregular', 'Natural (irregular)'], ['ashlar', 'Rectangular mix'], ['square', 'Square cut (2 ft)'], ['stepping', 'Stepping stones']];
  const FLAG_JOINTS = [1, 1.5, 2, 3, 4, 6, 8, 12];
  const FLAG_STYLES = [['fill', 'Full flagstone fill'], ['single', 'Single row of big pavers'], ['pairs', 'Two big stones side by side'], ['zipper', 'Zipper (staggered)']];
  const FLAG_LENS = [1.5, 2, 2.5, 3, 4, 5, 6];
  const STYLE_WIDTH = { fill: 3, single: 2, pairs: 4, zipper: 3.5 };
  const INFILLS = ['poly-sand-tan', 'poly-sand-grey', 'dg-gold', 'dg-gray', 'sand', 'pea-gravel', 'river-rock', 'beach-pebble', 'lava-black', 'lava-red', 'marble-white', 'bark-dark', 'cedar-red', 'mulch-black', 'wood-chips', 'topsoil', 'lawn'];
  const INFILL_NAME = (k) => (k === 'lawn' ? 'Grass (lawn)' : (BY[k] ? BY[k].name : k));
  const FLAGDEF = { stone: 'arizona-buff', pattern: 'irregular', infill: 'poly-sand-tan', joint: 2 };
  function flagSpec(el) {
    el = el || {};
    return {
      stone: FLAG_BY[el.stone] ? el.stone : FLAGDEF.stone,
      pattern: FLAG_PATTERNS.some((p) => p[0] === el.pattern) ? el.pattern : FLAGDEF.pattern,
      infill: (BY[el.infill] || el.infill === 'lawn') ? el.infill : FLAGDEF.infill,
      joint: clamp(Number(el.joint) || FLAGDEF.joint, 0.5, 12),
      // older paths that used the 'Stepping stones' layout become two big stones side by side
      style: FLAG_STYLES.some((p) => p[0] === el.style) ? el.style : (el.type === 'stonepath' && el.pattern === 'stepping' ? 'pairs' : 'fill'),
      cut: el.cut === 'natural' ? 'natural' : 'square',
      len: FLAG_LENS.includes(Number(el.stoneLen)) ? Number(el.stoneLen) : 2,
    };
  }
  const flagKeyOf = (sp) => `flag|${sp.stone}|${sp.infill}|${sp.joint}|${sp.pattern}`;
  const flagKey = (el) => flagKeyOf(flagSpec(el));
  function flagLabel(el) { const sp = flagSpec(el); return `${FLAG_BY[sp.stone].name}, ${INFILL_NAME(sp.infill).toLowerCase()} between the stones`; }
  const styleName = (k) => (FLAG_STYLES.find((p) => p[0] === k) || FLAG_STYLES[0])[1];

  // tileable value noise on a random lattice (cheap: lattices are built once)
  const LAT = {};
  function lat(fx, fy, seed) { const k = fx + 'x' + fy + '/' + seed; if (!LAT[k]) { const R = rng(seed * 7919 + fx * 31 + fy); const a = new Float32Array(fx * fy); for (let i = 0; i < a.length; i++) a[i] = R(); LAT[k] = a; } return LAT[k]; }
  function tn(a, fx, fy, x, y, N) {
    const u = (x / N) * fx, v = (y / N) * fy; const xi = Math.floor(u), yi = Math.floor(v); let xf = u - xi, yf = v - yi; xf = xf * xf * (3 - 2 * xf); yf = yf * yf * (3 - 2 * yf);
    const x0 = ((xi % fx) + fx) % fx, y0 = ((yi % fy) + fy) % fy, x1 = (x0 + 1) % fx, y1 = (y0 + 1) % fy;
    const a00 = a[y0 * fx + x0], a10 = a[y0 * fx + x1], a01 = a[y1 * fx + x0], a11 = a[y1 * fx + x1];
    const t = a00 + (a10 - a00) * xf, b = a01 + (a11 - a01) * xf; return t + (b - t) * yf;
  }
  const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
  const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const hash2 = (x, y, s) => { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 2147483647)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

  function flagLayout(pattern, N, R, jPx) {
    const ppf = N / FLAG_FT; const wrapN = (v) => ((v % N) + N) % N;
    if (pattern === 'irregular') {
      const C = 3, cs = N / C, seeds = [];
      for (let j = 0; j < C; j++) for (let i = 0; i < C; i++) seeds.push({ x: (i + 0.5 + (R() - 0.5) * 0.9) * cs, y: (j + 0.5 + (R() - 0.5) * 0.9) * cs, id: j * C + i });
      const near = [];
      for (let k = 0; k < 9; k++) near.push({ x: 0, y: 0, id: 0, d: 0 });
      return (x, y, o) => {
        x = wrapN(x); y = wrapN(y); const ci = Math.floor(x / cs), cj = Math.floor(y / cs); let n = 0, best = 0;
        for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
          const ii = ci + di, jj = cj + dj; const s = seeds[(((jj % C) + C) % C) * C + (((ii % C) + C) % C)]; const q = near[n++];
          q.x = s.x + Math.floor(ii / C) * N; q.y = s.y + Math.floor(jj / C) * N; q.id = s.id; q.d = (x - q.x) * (x - q.x) + (y - q.y) * (y - q.y); if (q.d < near[best].d || n === 1) best = n - 1;
        }
        const s1 = near[best]; let e1 = 1e9, e2 = 1e9;
        for (let k = 0; k < 9; k++) { if (k === best) continue; const q = near[k]; const e = (q.d - s1.d) / (2 * Math.hypot(q.x - s1.x, q.y - s1.y)); if (e < e1) { e2 = e1; e1 = e; } else if (e < e2) e2 = e; }
        o.id = s1.id; o.sd = smin(e1, e2, cs * 0.1) - jPx / 2;
      };
    }
    if (pattern === 'ashlar' || pattern === 'square') {
      const rows = []; let y = 0, id = 0; const hs = pattern === 'square' ? [2] : [1, 1.25, 1.5, 2], ws = pattern === 'square' ? [2] : [1.25, 1.75, 2.25, 2.75, 3];
      while (y < N - 2) {
        let h = hs[(R() * hs.length) | 0] * ppf; if (y + h > N - 0.6 * ppf) h = N - y;
        const row = { y0: y, y1: y + h, cells: [] }; let x = 0;
        while (x < N - 2) { let w = ws[(R() * ws.length) | 0] * ppf; if (x + w > N - 0.7 * ppf) w = N - x; row.cells.push({ x0: x, x1: x + w, id: id++ }); x += w; }
        rows.push(row); y += h;
      }
      const rowAt = new Int16Array(N + 1); rows.forEach((r, i) => { for (let yy = Math.floor(r.y0); yy <= Math.min(N, Math.ceil(r.y1)); yy++) rowAt[yy] = i; });
      return (x, y, o) => {
        x = wrapN(x); y = wrapN(y); const row = rows[rowAt[Math.floor(y)]]; let c = row.cells[0];
        for (let i = 0; i < row.cells.length; i++) if (x >= row.cells[i].x0 && x < row.cells[i].x1) { c = row.cells[i]; break; }
        const dx = Math.min(x - c.x0, c.x1 - x), dy = Math.min(y - row.y0, row.y1 - y);
        o.id = c.id; o.sd = smin(dx, dy, 18) - jPx / 2;
      };
    }
    // stepping stones: separate rounded stones, wide gaps
    const C = 3, cs = N / C, st = [];
    for (let j = 0; j < C; j++) for (let i = 0; i < C; i++) {
      const rx = 0.8 * ppf * (0.92 + R() * 0.2); st.push({ x: (i + 0.5) * cs + (R() - 0.5) * 0.26 * ppf, y: (j + 0.5) * cs + (R() - 0.5) * 0.26 * ppf, rx, ry: rx * (0.72 + R() * 0.18), a: R() * 3.14159, p: 2.2 + R() * 0.8, id: j * C + i });
    }
    return (x, y, o) => {
      x = wrapN(x); y = wrapN(y); const ci = Math.floor(x / cs), cj = Math.floor(y / cs); let best = -1e9, id = 0;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        const ii = ci + di, jj = cj + dj; const s = st[(((jj % C) + C) % C) * C + (((ii % C) + C) % C)];
        const px = x - (s.x + Math.floor(ii / C) * N), py = y - (s.y + Math.floor(jj / C) * N); const ca = Math.cos(s.a), sa = Math.sin(s.a), u = (px * ca + py * sa) / s.rx, v = (-px * sa + py * ca) / s.ry;
        const dist = Math.pow(Math.pow(Math.abs(u), s.p) + Math.pow(Math.abs(v), s.p), 1 / s.p); const sd = (1 - dist) * s.ry;
        if (sd > best) { best = sd; id = s.id; }
      }
      o.id = id; o.sd = best;
    };
  }

  function genFlagTile(sp, N) {
    const st = FLAG_BY[sp.stone], pal = st.pal.map(hex), seed = hashStr(sp.stone + sp.pattern) + (sp.pattern === 'irregular' ? 3 : 0);
    const R = rng(seed), ppf = N / FLAG_FT, jPx = (sp.joint / 12) * ppf;
    const layout = flagLayout(sp.pattern, N, R, jPx);
    // what goes between the stones (colour + height), tiled exactly so the repeat has no seam
    const [ic, ig] = cv(N), [ih, ihg] = cv(N); let src, hsrc, ftIn;
    if (sp.infill === 'lawn') { const t = tex('lawn'); src = t.canvas; hsrc = t.height; ftIn = t.ft; } else { const t = tex(sp.infill); src = t.canvas; hsrc = t.height; ftIn = t.ft; }
    const k = Math.max(1, Math.round(FLAG_FT / ftIn)), sc = N / (k * src.width);
    [[ic, ig, src], [ih, ihg, hsrc]].forEach(([c, g, im]) => { g.setTransform(sc, 0, 0, sc, 0, 0); g.fillStyle = g.createPattern(im, 'repeat'); g.fillRect(0, 0, N / sc, N / sc); g.setTransform(1, 0, 0, 1, 0, 0); });
    const inD = ig.getImageData(0, 0, N, N).data, inH = ihg.getImageData(0, 0, N, N).data;
    const [c, g] = cv(N), [h, hg] = cv(N); const img = g.createImageData(N, N), him = hg.createImageData(N, N);
    const A1 = lat(6, 6, 1), A2 = lat(18, 18, 2), W1 = lat(5, 5, 3), W2 = lat(5, 5, 4), SA = lat(4, 4, 5), CL = lat(5, 34, 6), PT = lat(46, 46, 7), A3 = lat(9, 9, 8);
    const nId = 64, L = [], P = []; for (let i = 0; i < nId; i++) { L.push(0.9 + R() * 0.2); P.push(pal[(R() * pal.length) | 0]); }
    const cut = sp.infill === 'lawn'; // grass between the stones: the lawn underneath shows through
    const warp = ppf * 0.045, o = { id: 0, sd: 0 };
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const wx = x + (tn(W1, 5, 5, x, y, N) - 0.5) * 2 * warp, wy = y + (tn(W2, 5, 5, x, y, N) - 0.5) * 2 * warp;
      layout(wx, wy, o); const sd = o.sd, id = o.id % nId, p = (y * N + x) * 4;
      let ar = 0, ag = 0, ab = 0, ah = 0;
      const a = sstep(-1.1, 1.1, sd);
      if (a > 0) {
        const col = P[id]; const n1 = tn(A1, 6, 6, x, y, N), n2 = tn(A2, 18, 18, x, y, N); let m = L[id] * (1 + st.grain * ((n1 - 0.5) * 1.3 + (n2 - 0.5) * 0.9 + (hash2(x, y, 9) - 0.5) * 0.5));
        if (st.strata) m *= 1 + st.strata * 0.14 * Math.sin(6.2832 * ((y / N) * 14 + n1 * 0.7 + id * 0.37));
        if (st.cleft) m *= 0.8 + 0.4 * tn(CL, 5, 34, x, y, N) + 0.1 * (tn(A3, 9, 9, x, y, N) - 0.5);
        if (st.speck) { const r = hash2(x, y, 3); if (r > 1 - 0.05 * st.speck) m *= 1.55; else if (r < 0.05 * st.speck) m *= 0.6; }
        if (st.pits && tn(PT, 46, 46, x, y, N) > 0.8) m *= 0.74;
        const edge = sstep(0, 8, sd); m *= 0.82 + 0.18 * edge;
        ar = col[0] * m; ag = col[1] * m; ab = col[2] * m; ah = 175 + 36 * (n1 - 0.5) - (1 - edge) * 70;
      }
      let jr = 0, jg = 0, jb = 0, jh = 0;
      if (a < 1) {
        const ao = 0.5 + 0.5 * sstep(0, 8, -sd), q = (y * N + x) * 4; jr = inD[q] * ao; jg = inD[q + 1] * ao; jb = inD[q + 2] * ao; jh = 25 + inH[q] * 0.3;
      }
      img.data[p] = clamp(ar * a + jr * (1 - a), 0, 255); img.data[p + 1] = clamp(ag * a + jg * (1 - a), 0, 255); img.data[p + 2] = clamp(ab * a + jb * (1 - a), 0, 255); img.data[p + 3] = cut ? Math.round(255 * a) : 255;
      const hv = clamp(ah * a + jh * (1 - a), 0, 255); him.data[p] = him.data[p + 1] = him.data[p + 2] = hv; him.data[p + 3] = 255;
    }
    g.putImageData(img, 0, 0); hg.putImageData(him, 0, 0);
    return { canvas: c, height: h };
  }
  function genFlagKey(key, N) {
    const q = key.split('|'); const sp = flagSpec({ stone: q[1], infill: q[2], joint: Number(q[3]), pattern: q[4] });
    const t = genFlagTile(sp, N || 512); const [c2, g2] = cv(256); g2.imageSmoothingQuality = 'high'; g2.drawImage(t.canvas, 0, 0, 256, 256);
    return { canvas: t.canvas, height: t.height, ft: FLAG_FT, canvas2d: c2, ft2d: FLAG_FT };
  }
  const flagThumbs = {};
  function flagThumb(spec, size) {
    const sp = flagSpec(spec); size = size || 64; const k = flagKeyOf(sp) + '@' + size; if (flagThumbs[k]) return flagThumbs[k];
    const t = genFlagTile(sp, 192); const [c, g] = cv(size); g.imageSmoothingQuality = 'high'; g.drawImage(t.canvas, 0, 0, 120, 120, 0, 0, size, size); return (flagThumbs[k] = c.toDataURL('image/png'));
  }


  // one stone's surface (seamless), used for individually placed stones and pavers
  function genSwatchTile(stoneKey, N) {
    const st = FLAG_BY[stoneKey] || FLAG_STONES[0], pal = st.pal.map(hex); const [c, g] = cv(N), [h, hg] = cv(N); const img = g.createImageData(N, N), him = hg.createImageData(N, N);
    const A1 = lat(5, 5, 11), A2 = lat(15, 15, 12), CL = lat(4, 28, 13), PT = lat(38, 38, 14), B = lat(3, 3, 15), n = pal.length;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const nb = tn(B, 3, 3, x, y, N) * n * 0.999, i0 = Math.floor(nb), f = sstep(0.25, 0.75, nb - i0), c0 = pal[i0 % n], c1 = pal[(i0 + 1) % n];
      const n1 = tn(A1, 5, 5, x, y, N), n2 = tn(A2, 15, 15, x, y, N); let m = 1 + st.grain * ((n1 - 0.5) * 1.3 + (n2 - 0.5) * 0.9 + (hash2(x, y, 9) - 0.5) * 0.5);
      if (st.strata) m *= 1 + st.strata * 0.14 * Math.sin(6.2832 * ((y / N) * 8 + n1 * 0.7));
      if (st.cleft) m *= 0.8 + 0.4 * tn(CL, 4, 28, x, y, N);
      if (st.speck) { const r = hash2(x, y, 3); if (r > 1 - 0.05 * st.speck) m *= 1.55; else if (r < 0.05 * st.speck) m *= 0.6; }
      let pit = 0; if (st.pits && tn(PT, 38, 38, x, y, N) > 0.8) { m *= 0.74; pit = 1; }
      const p = (y * N + x) * 4; img.data[p] = clamp((c0[0] + (c1[0] - c0[0]) * f) * m, 0, 255); img.data[p + 1] = clamp((c0[1] + (c1[1] - c0[1]) * f) * m, 0, 255); img.data[p + 2] = clamp((c0[2] + (c1[2] - c0[2]) * f) * m, 0, 255); img.data[p + 3] = 255;
      const hv = clamp(150 + 70 * (n1 - 0.5) + 40 * (n2 - 0.5) - pit * 50, 0, 255); him.data[p] = him.data[p + 1] = him.data[p + 2] = hv; him.data[p + 3] = 255;
    }
    g.putImageData(img, 0, 0); hg.putImageData(him, 0, 0); return { canvas: c, height: h };
  }
  function genSwatchKey(key) {
    const t = genSwatchTile(key.split('|')[1], 384); const [c2, g2] = cv(192); g2.imageSmoothingQuality = 'high'; g2.drawImage(t.canvas, 0, 0, 192, 192);
    return { canvas: t.canvas, height: t.height, ft: 4, canvas2d: c2, ft2d: 4 };
  }

  // Individually placed stones along a path: one big paver, two side by side, or a zipper.
  // Returns stones in plan pixels: centre, direction, and an outline relative to the centre.
  function stoneLayout(el, ppf) {
    const sp = flagSpec(el); if (sp.style === 'fill' || el.type !== 'stonepath') return null;
    ppf = ppf || window.pxPerFt || 10;
    const c = pathCenter(el), n = c.length / 2; if (n < 2) return null;
    const cum = [0]; for (let i = 1; i < n; i++) cum.push(cum[i - 1] + Math.hypot(c[i * 2] - c[i * 2 - 2], c[i * 2 + 1] - c[i * 2 - 1]));
    const total = cum[n - 1]; if (total < 4) return null;
    const at = (d) => { d = clamp(d, 0, total); let i = 1; while (i < n - 1 && cum[i] < d) i++; const a = cum[i - 1], b = cum[i], t = b > a ? (d - a) / (b - a) : 0; return [c[i * 2 - 2] + (c[i * 2] - c[i * 2 - 2]) * t, c[i * 2 - 1] + (c[i * 2 + 1] - c[i * 2 - 1]) * t]; };
    const L = sp.len * ppf, gap = (sp.joint / 12) * ppf, pw = (el.widthFt || 3) * ppf;
    const lanes = sp.style === 'single' ? [{ off: 0, w: pw, shift: 0 }] : [{ off: -(pw - gap) / 4 - gap / 4, w: (pw - gap) / 2, shift: 0 }, { off: (pw - gap) / 4 + gap / 4, w: (pw - gap) / 2, shift: sp.style === 'zipper' ? (L + gap) / 2 : 0 }];
    const step = L + gap, rows = Math.max(1, Math.floor((total + gap) / step)); const lead = (total - (rows * step - gap)) / 2 + L / 2;
    const R = rng(hashStr(el.id || 'p') + 7 + Math.round(total)); const stones = [];
    lanes.forEach((ln, li) => {
      for (let j = -1; j <= rows; j++) {
        const s = lead + j * step + ln.shift; if (s - L / 2 < -0.5 || s + L / 2 > total + 0.5) continue;
        const p = at(s), a1 = at(s - L / 2), a2 = at(s + L / 2); let tx = a2[0] - a1[0], ty = a2[1] - a1[1]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
        const ang = Math.atan2(ty, tx), nx = -ty, ny = tx; const cx = p[0] + nx * ln.off, cy = p[1] + ny * ln.off;
        const hl = L / 2, hw = ln.w / 2, poly = [];
        if (sp.cut === 'natural') {
          const jj = (k) => (R() - 0.5) * 2 * k * ppf;
          poly.push([-hl + jj(0.1), -hw + jj(0.1)], [jj(0.05), -hw + jj(0.04)], [hl + jj(0.1), -hw + jj(0.1)], [hl + jj(0.04), jj(0.06)], [hl + jj(0.1), hw + jj(0.1)], [jj(0.05), hw + jj(0.04)], [-hl + jj(0.1), hw + jj(0.1)], [-hl + jj(0.04), jj(0.06)]);
        } else {
          const r = Math.min(0.08 * ppf, hl * 0.4, hw * 0.4), cs = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
          cs.forEach(([sx, sy], k) => { const cxk = sx * (hl - r), cyk = sy * (hw - r), a0 = [Math.PI, 1.5 * Math.PI, 0, 0.5 * Math.PI][k]; for (let q = 0; q <= 3; q++) { const aa = a0 + (q / 3) * (Math.PI / 2); poly.push([cxk + Math.cos(aa) * r, cyk + Math.sin(aa) * r]); } });
        }
        stones.push({ cx, cy, ang, poly, tone: 0.9 + R() * 0.2, lane: li, w: ln.w, l: L, off: R() });
      }
    });
    return { stones, total, L, pw };
  }

  // the outline of a stone path (a centre line with a width) as a polygon, in plan pixels
  function pathCenter(el) {
    const p = el.points || []; if (!el.curved || p.length < 6) return p.slice();
    const n = p.length / 2, out = []; const g = (i) => [p[Math.max(0, Math.min(n - 1, i)) * 2], p[Math.max(0, Math.min(n - 1, i)) * 2 + 1]];
    for (let i = 0; i < n - 1; i++) {
      const P0 = g(i - 1), P1 = g(i), P2 = g(i + 1), P3 = g(i + 2);
      for (let s = 0; s < 10; s++) { const t = s / 10, t2 = t * t, t3 = t2 * t; out.push(0.5 * ((2 * P1[0]) + (-P0[0] + P2[0]) * t + (2 * P0[0] - 5 * P1[0] + 4 * P2[0] - P3[0]) * t2 + (-P0[0] + 3 * P1[0] - 3 * P2[0] + P3[0]) * t3), 0.5 * ((2 * P1[1]) + (-P0[1] + P2[1]) * t + (2 * P0[1] - 5 * P1[1] + 4 * P2[1] - P3[1]) * t2 + (-P0[1] + 3 * P1[1] - 3 * P2[1] + P3[1]) * t3)); }
    }
    out.push(p[(n - 1) * 2], p[(n - 1) * 2 + 1]); return out;
  }
  function pathPoly(el, ppf) {
    ppf = ppf || window.pxPerFt || 10; const c = pathCenter(el), n = c.length / 2; if (n < 2) return [];
    const half = (((el.widthFt || 3) + (flagSpec(el).style !== 'fill' ? 1 : 0)) * ppf) / 2; const L = [], Rr = [];
    // drop repeated points
    const pts = []; for (let i = 0; i < n; i++) { if (!pts.length || Math.hypot(c[i * 2] - pts[pts.length - 1][0], c[i * 2 + 1] - pts[pts.length - 1][1]) > 0.5) pts.push([c[i * 2], c[i * 2 + 1]]); }
    if (pts.length < 2) return [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[i], d = pts[Math.min(pts.length - 1, i + 1)];
      let d0 = [b[0] - a[0], b[1] - a[1]], d1 = [d[0] - b[0], d[1] - b[1]]; const l0 = Math.hypot(d0[0], d0[1]), l1 = Math.hypot(d1[0], d1[1]);
      if (l0) d0 = [d0[0] / l0, d0[1] / l0]; if (l1) d1 = [d1[0] / l1, d1[1] / l1]; if (!l0) d0 = d1; if (!l1) d1 = d0;
      let nx = -(d0[1] + d1[1]), ny = d0[0] + d1[0]; const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
      const cosH = Math.max(0.5, nx * -d0[1] + ny * d0[0]); const m = half / cosH;
      L.push(b[0] + nx * m, b[1] + ny * m); Rr.push(b[0] - nx * m, b[1] - ny * m);
    }
    const out = L.slice(); for (let i = Rr.length - 2; i >= 0; i -= 2) out.push(Rr[i], Rr[i + 1]); return out;
  }
  function flagQty(el) { // stone and joint-fill needed for one flagstone area / path
    const sp = flagSpec(el); const pts = el.type === 'stonepath' ? pathPoly(el) : el.points; const sq = pts && pts.length >= 6 ? polyAreaPx(pts) / (Math.pow(window.pxPerFt || 10, 2)) : 0;
    const lay = el.type === 'stonepath' ? stoneLayout(el) : null;
    if (lay) {
      const pp = window.pxPerFt || 10; const stoneSq = lay.stones.reduce((a, t) => a + polyAreaPx(t.poly.reduce((f, q) => f.concat(q), [])) / (pp * pp), 0); const gapSq = Math.max(0, sq - stoneSq), cf = gapSq * (1.5 / 12);
      return { sq, stoneSq, count: lay.stones.length, tons: stoneSq / 100, cuft: cf, cuyd: cf / 27, bags: cf / 0.5, sp, layout: true };
    }
    const frac = sp.pattern === 'stepping' ? 0.65 : Math.min(0.6, (sp.joint / 12) * (sp.pattern === 'ashlar' ? 1.2 : 1));
    const cuft = sq * frac * (1.5 / 12); return { sq, tons: sq / 100, cuft, cuyd: cuft / 27, bags: cuft / 0.5, sp };
  }
  function polyAreaPx(p) { let a = 0; const n = p.length / 2; for (let i = 0; i < n; i++) { const j = (i + 1) % n; a += p[i * 2] * p[j * 2 + 1] - p[j * 2] * p[i * 2 + 1]; } return Math.abs(a) / 2; }

  const cache = {};
  function tex(key) { if (cache[key] === undefined) { const m = BY[key]; cache[key] = m ? genMaterial(m) : (SURF[key] ? SURF[key]() : (String(key).indexOf('flag|') === 0 ? genFlagKey(key, 512) : (String(key).indexOf('stone|') === 0 ? genSwatchKey(key) : null))); } return cache[key]; }
  function tex2d(key) { const t = tex(key); if (!t) return null; return t.canvas2d ? { canvas: t.canvas2d, ft: t.ft2d } : { canvas: t.canvas, ft: t.ft }; }
  const thumbCache = {};
  function thumb(key, size) {
    size = size || 56; const k = key + size; if (thumbCache[k]) return thumbCache[k];
    const t = tex(key); if (!t) return ''; const [c, g] = cv(size); g.imageSmoothingQuality = 'high';
    const src = t.canvas; const crop = Math.min(src.width, Math.round(src.width * Math.min(1, 1.2 / t.ft))); g.drawImage(src, 0, 0, crop, crop, 0, 0, size, size);
    return (thumbCache[k] = c.toDataURL('image/png'));
  }

  DPRO.mat = { flag: { styles: FLAG_STYLES, lens: FLAG_LENS, styleWidth: STYLE_WIDTH, styleName, layout: stoneLayout, stones: FLAG_STONES, stoneBy: FLAG_BY, patterns: FLAG_PATTERNS.filter((p) => p[0] !== 'stepping'), joints: FLAG_JOINTS, infills: INFILLS, infillName: INFILL_NAME, def: FLAGDEF, spec: flagSpec, key: flagKey, label: flagLabel, thumb: flagThumb, pathPoly, qty: flagQty }, list: MATS, by: BY, groups: G, rocks: ROCKS, rockBy: ROCK_BY, boulderSizes: BOULDER_SIZES, keyFor, tex, tex2d, thumb, legacy: LEGACY, rng, hashStr };

  // ============================================================================
  // Editor integration (skipped on the customer 3D page)
  // ============================================================================
  if (!DPRO.types || !DPRO.addToolGroup || typeof Konva === 'undefined') return;
  const $ = (id) => document.getElementById(id);
  const esc = DPRO.esc || ((s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])));
  const armed = { mat: 'bark-dark', rock: 'granite', size: 2.5, fromCard: false };
  const flagArm = { stone: FLAGDEF.stone, pattern: FLAGDEF.pattern, infill: FLAGDEF.infill, joint: FLAGDEF.joint, width: 3, curved: true, style: 'fill', cut: 'square', len: 2 };
  const money = (n) => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // new beds/gravel areas pick up the material chosen in the library
  const origAdd = window.addElement;
  window.addElement = function (el) {
    if (el && el.type === 'area' && (el.subtype === 'bed' || el.subtype === 'gravel') && !el.material && armed.active) el.material = armed.mat;
    if (el && el.type === 'area' && el.subtype === 'flagstone' && !el.stone) Object.assign(el, { stone: flagArm.stone, pattern: flagArm.pattern, infill: flagArm.infill, joint: flagArm.joint });
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
    const flagTool = tool === 'line-flagpath' || tool === 'area-flagstone';
    if (!armed.fromCard) { armed.active = false; if (tool !== 'boulder') armed.boulder = false; }
    armed.fromCard = false;
    const empty = $('design-catalog-empty');
    if (mine) { renderCatalog(); sec.hidden = false; if (empty) empty.hidden = true; switchSidePanel('catalog'); } else sec.hidden = true;
    if (flagTool) { renderFlagCatalog(tool); flagSec.hidden = false; if (empty) empty.hidden = true; switchSidePanel('catalog'); } else flagSec.hidden = true;
  };
  DPRO.hints.boulder = 'Click to place a boulder. Pick the rock type and size in the Catalog tab. Drag to move it.';
  DPRO.pointTools.boulder = function (pos) {
    addElement({ id: uid(), type: 'boulder', rock: armed.rock, sizeFt: armed.size, x: pos.x, y: pos.y, rotationDeg: Math.round(Math.random() * 360), seed: 1 + Math.floor(Math.random() * 9999) });
  };


  // ---- flagstone & stone paths ----
  const flagSec = document.createElement('div'); flagSec.id = 'design-catalog-flag'; flagSec.className = 'design-catalog-section'; flagSec.hidden = true;
  if (catPanel) catPanel.appendChild(flagSec);
  const F = DPRO.mat.flag;
  function renderFlagCatalog(tool) {
    const isPath = tool === 'line-flagpath';
    let h = `<div class="design-tool-group-label">${isPath ? 'Flagstone path' : 'Flagstone area'}</div><p class="empty-sub" style="margin:4px 0 8px">${isPath ? 'Pick the stone and what goes between the stones, then click along the path. Enter to finish. You can change everything later.' : 'Pick the stone and what goes between the stones, then click the corners of the area. Enter to finish.'}</p>`;
    if (isPath) {
      h += `<div class="design-tool-group-label">Path style</div><div class="dpm-row">`;
      F.styles.forEach(([k, l]) => { h += `<button type="button" class="dpm-chip${flagArm.style === k ? ' on' : ''}" data-fstyle="${k}">${l}</button>`; });
      h += '</div>';
      if (flagArm.style !== 'fill') {
        h += `<div class="design-tool-group-label" style="margin-top:10px">Stone cut</div><div class="dpm-row"><button type="button" class="dpm-chip${flagArm.cut === 'square' ? ' on' : ''}" data-fcut="square">Square-cut pavers</button><button type="button" class="dpm-chip${flagArm.cut === 'natural' ? ' on' : ''}" data-fcut="natural">Natural-cut</button></div>`;
        h += `<div class="design-tool-group-label" style="margin-top:10px">Stone length</div><div class="dpm-row">`;
        F.lens.forEach((n) => { h += `<button type="button" class="dpm-chip${flagArm.len === n ? ' on' : ''}" data-flen="${n}">${n} ft</button>`; });
        h += '</div>';
      }
      h += '<div style="height:10px"></div>';
    }
    h += `<div class="design-tool-group-label">Stone</div><div class="dpm-grid">`;
    F.stones.forEach((st) => { h += `<button type="button" class="dpm-card${flagArm.stone === st.key ? ' on' : ''}" data-fstone="${st.key}" title="${esc(st.note)}"><img alt="" src="${F.thumb({ stone: st.key, pattern: flagArm.pattern, infill: flagArm.infill, joint: flagArm.joint }, 64)}" /><span>${esc(st.name)}</span></button>`; });
    h += '</div>';
    if (!isPath || flagArm.style === 'fill') {
      h += `<div class="design-tool-group-label" style="margin-top:10px">Layout</div><div class="dpm-row">`;
      F.patterns.forEach(([k, l]) => { h += `<button type="button" class="dpm-chip${flagArm.pattern === k ? ' on' : ''}" data-fpat="${k}">${l}</button>`; });
      h += '</div>';
    }
    h += `<div class="design-tool-group-label" style="margin-top:10px">Fill between the stones</div><div class="dpm-grid">`;
    F.infills.forEach((k) => { const src = k === 'lawn' ? thumb('lawn', 44) : thumb(k, 44); h += `<button type="button" class="dpm-card dpm-small${flagArm.infill === k ? ' on' : ''}" data-finfill="${k}"><img alt="" src="${src}" /><span>${esc(F.infillName(k))}</span></button>`; });
    h += `</div><div class="design-tool-group-label" style="margin-top:10px">Gap between stones</div><div class="dpm-row">`;
    F.joints.forEach((j) => { h += `<button type="button" class="dpm-chip${flagArm.joint === j ? ' on' : ''}" data-fjoint="${j}">${j} in</button>`; });
    h += '</div>';
    if (isPath) {
      h += `<div class="design-tool-group-label" style="margin-top:10px">Path</div><div class="dpm-row"><label class="dpm-price">Width (ft) <input id="fl-width" type="number" min="1" max="12" step="0.5" value="${flagArm.width}" /></label><button type="button" class="dpm-chip${flagArm.curved ? ' on' : ''}" id="fl-curved">Smooth curves</button></div>`;
    }
    flagSec.innerHTML = h;
    const again = () => renderFlagCatalog(tool);
    flagSec.querySelectorAll('[data-fstyle]').forEach((b) => b.addEventListener('click', () => { flagArm.style = b.dataset.fstyle; flagArm.width = F.styleWidth[flagArm.style] || 3; again(); }));
    flagSec.querySelectorAll('[data-fcut]').forEach((b) => b.addEventListener('click', () => { flagArm.cut = b.dataset.fcut; again(); }));
    flagSec.querySelectorAll('[data-flen]').forEach((b) => b.addEventListener('click', () => { flagArm.len = Number(b.dataset.flen); again(); }));
    flagSec.querySelectorAll('[data-fstone]').forEach((b) => b.addEventListener('click', () => { flagArm.stone = b.dataset.fstone; again(); }));
    flagSec.querySelectorAll('[data-fpat]').forEach((b) => b.addEventListener('click', () => { flagArm.pattern = b.dataset.fpat; again(); }));
    flagSec.querySelectorAll('[data-finfill]').forEach((b) => b.addEventListener('click', () => { flagArm.infill = b.dataset.finfill; again(); }));
    flagSec.querySelectorAll('[data-fjoint]').forEach((b) => b.addEventListener('click', () => { flagArm.joint = Number(b.dataset.fjoint); again(); }));
    const w = $('fl-width'); if (w) w.addEventListener('change', () => { flagArm.width = clamp(Number(w.value) || 3, 1, 12); });
    const cu = $('fl-curved'); if (cu) cu.addEventListener('click', () => { flagArm.curved = !flagArm.curved; again(); });
  }
  DPRO.hints['line-flagpath'] = 'Click along the path. Press Enter to finish (Esc to cancel). Pick the stone and fill in the Catalog tab.';
  DPRO.drawHandlers['line-flagpath'] = function (pts) {
    addElement({ id: uid(), type: 'stonepath', points: pts, widthFt: flagArm.width, curved: flagArm.curved, stone: flagArm.stone, pattern: flagArm.pattern, infill: flagArm.infill, joint: flagArm.joint, style: flagArm.style, cut: flagArm.cut, stoneLen: flagArm.len });
  };
  function flagFields(el, box, isPath) {
    const sp = F.spec(el);
    const stoneOpts = F.stones.map((st) => `<option value="${st.key}" ${st.key === sp.stone ? 'selected' : ''}>${esc(st.name)}</option>`).join('');
    const patOpts = (sp.pattern === 'stepping' ? [['stepping', 'Stepping stones (old)']].concat(F.patterns) : F.patterns).map(([k, l]) => `<option value="${k}" ${k === sp.pattern ? 'selected' : ''}>${l}</option>`).join('');
    const infOpts = F.infills.map((k) => `<option value="${k}" ${k === sp.infill ? 'selected' : ''}>${esc(F.infillName(k))}</option>`).join('');
    const jOpts = F.joints.map((j) => `<option value="${j}" ${j === sp.joint ? 'selected' : ''}>${j} in</option>`).join('');
    const q = F.qty(el);
    const styOpts = F.styles.map(([k, l]) => `<option value="${k}" ${k === sp.style ? 'selected' : ''}>${l}</option>`).join('');
    const lenOpts = F.lens.map((n) => `<option value="${n}" ${n === sp.len ? 'selected' : ''}>${n} ft</option>`).join('');
    const placed = isPath && sp.style !== 'fill';
    let h = (isPath ? DPRO.fieldHtml('Path style', `<select id="fp-style">${styOpts}</select>`) : '') + (placed ? DPRO.fieldHtml('Stone cut', `<select id="fp-cut"><option value="square" ${sp.cut === 'square' ? 'selected' : ''}>Square-cut pavers</option><option value="natural" ${sp.cut === 'natural' ? 'selected' : ''}>Natural-cut</option></select>`) + DPRO.fieldHtml('Stone length', `<select id="fp-len">${lenOpts}</select>`) : '') + `<div class="design-properties-field"><label>Flagstone</label><div class="dpm-propwrap"><img alt="" src="${F.thumb(sp, 56)}" /><select id="fp-stone">${stoneOpts}</select></div></div>` +
      (placed ? '' : DPRO.fieldHtml('Layout', `<select id="fp-pat">${patOpts}</select>`)) +
      `<div class="design-properties-field"><label>Fill between the stones</label><div class="dpm-propwrap"><img alt="" src="${sp.infill === 'lawn' ? thumb('lawn', 40) : thumb(sp.infill, 40)}" /><select id="fp-inf">${infOpts}</select></div></div>` +
      DPRO.fieldHtml('Gap between stones', `<select id="fp-joint">${jOpts}</select>`);
    if (isPath) h += DPRO.fieldHtml('Path width (ft)', `<input id="fp-w" type="number" min="1" max="12" step="0.5" value="${el.widthFt || 3}" />`) + `<div class="design-properties-field"><label><input type="checkbox" id="fp-curve" ${el.curved ? 'checked' : ''} /> Smooth curves</label></div>` + DPRO.fieldHtml('Length', `<div>${(polylineLengthFt(el.points)).toFixed(1)} ft</div>`);
    if (q.layout) h += `<p class="empty-sub"><strong>${q.count} stones</strong> (${sp.len} ft long) &middot; ${q.stoneSq.toFixed(0)} sq ft of stone, about <strong>${(q.tons * 1.1).toFixed(1)} tons</strong> &middot; <strong>${q.cuft.toFixed(1)} cu ft</strong> of ${esc(F.infillName(sp.infill).toLowerCase())}${/^poly/.test(sp.infill) ? ` (about ${Math.ceil(q.bags)} 50-lb bags)` : ''}</p>`;
    else h += `<p class="empty-sub">${q.sq.toFixed(0)} sq ft &middot; about <strong>${(q.tons * 1.1).toFixed(1)} tons</strong> of stone (1.5 in thick, 10% extra for cuts) &middot; <strong>${q.cuft.toFixed(1)} cu ft</strong> of ${esc(F.infillName(sp.infill).toLowerCase())}${/^poly/.test(sp.infill) ? ` (about ${Math.ceil(q.bags)} 50-lb bags)` : ''}</p>`;
    if (isPath) h += '<p class="empty-sub">Drag the white dots to reshape the path. Click a small dot between two to add a point. Double-click a dot to remove it.</p>';
    box.insertAdjacentHTML('beforeend', h);
    const upd = (k, v) => { el[k] = v; DPRO.rerender(el); markDirty(); DPRO.runLegend(); DPRO.renderProps(el); };
    $('fp-stone').addEventListener('change', (e) => upd('stone', e.target.value)); if ($('fp-pat')) $('fp-pat').addEventListener('change', (e) => upd('pattern', e.target.value));
    if ($('fp-style')) $('fp-style').addEventListener('change', (e) => { const v = e.target.value; el.widthFt = F.styleWidth[v] || el.widthFt || 3; upd('style', v); });
    if ($('fp-cut')) $('fp-cut').addEventListener('change', (e) => upd('cut', e.target.value)); if ($('fp-len')) $('fp-len').addEventListener('change', (e) => upd('stoneLen', Number(e.target.value)));
    $('fp-inf').addEventListener('change', (e) => upd('infill', e.target.value)); $('fp-joint').addEventListener('change', (e) => upd('joint', Number(e.target.value)));
    if (isPath) { $('fp-w').addEventListener('change', (e) => upd('widthFt', clamp(Number(e.target.value) || 3, 1, 12))); $('fp-curve').addEventListener('change', (e) => upd('curved', e.target.checked)); }
  }
  DPRO.types.stonepath = {
    layerKey: () => 'stonepaths',
    build(el) {
      const poly = F.pathPoly(el); const g = new Konva.Group({ draggable: activeTool === 'select' });
      if (poly.length < 6) return g;
      g.add(new Konva.Line({ points: el.points, stroke: 'rgba(0,0,0,0)', strokeWidth: 1, name: 'main', listening: false })); // follows the handles while you reshape
      const lay = F.layout(el, pxPerFt);
      if (lay) {
        const sp = F.spec(el);
        if (sp.infill !== 'lawn') { const it = DPRO.texture(sp.infill); const isc = (pxPerFt * it.ft) / it.canvas.width; g.add(new Konva.Line({ points: poly, closed: true, fillPatternImage: it.canvas, fillPatternRepeat: 'repeat', fillPatternScaleX: isc, fillPatternScaleY: isc, stroke: 'rgba(40,30,20,0.35)', strokeWidth: 1, lineJoin: 'round' })); }
        else g.add(new Konva.Line({ points: poly, closed: true, fill: 'rgba(0,0,0,0.001)' }));
        const st = DPRO.texture('stone|' + sp.stone); const ssc = (pxPerFt * st.ft) / st.canvas.width;
        lay.stones.forEach((s) => {
          const ca = Math.cos(s.ang), sa = Math.sin(s.ang); const pts = []; s.poly.forEach(([x, y]) => pts.push(s.cx + x * ca - y * sa, s.cy + x * sa + y * ca));
          g.add(new Konva.Line({ points: pts, closed: true, fillPatternImage: st.canvas, fillPatternRepeat: 'repeat', fillPatternScaleX: ssc, fillPatternScaleY: ssc, fillPatternOffsetX: s.off * 40 * pxPerFt / 4, fillPatternOffsetY: (s.off * 7 % 1) * 40 * pxPerFt / 4, stroke: 'rgba(30,22,15,0.6)', strokeWidth: 0.5, lineJoin: 'round', shadowColor: 'rgba(0,0,0,0.45)', shadowBlur: 3, shadowOffset: { x: 1, y: 1.5 }, shadowOpacity: 0.7 }));
          if (Math.abs(s.tone - 1) > 0.02) g.add(new Konva.Line({ points: pts, closed: true, fill: s.tone > 1 ? 'rgba(255,255,255,' + ((s.tone - 1) * 0.9).toFixed(3) + ')' : 'rgba(0,0,0,' + ((1 - s.tone) * 1.1).toFixed(3) + ')', listening: false }));
        });
      } else {
      const key = F.key(el); const t = DPRO.texture(key); const sc = (pxPerFt * t.ft) / t.canvas.width;
      g.add(new Konva.Line({ points: poly, closed: true, fillPatternImage: t.canvas, fillPatternRepeat: 'repeat', fillPatternScaleX: sc, fillPatternScaleY: sc, stroke: F.spec(el).infill === 'lawn' ? undefined : 'rgba(40,30,20,0.55)', strokeWidth: F.spec(el).infill === 'lawn' ? 0 : 1, lineJoin: 'round' }));
      }
      if (el.label) { const c = el.points; const mi = Math.floor(c.length / 4) * 2; g.add(new Konva.Text({ text: el.label, x: c[mi] + 6, y: c[mi + 1] - 6, fontSize: 11, fontStyle: 'bold', fill: DPRO.ink(), stroke: DPRO.halo(), strokeWidth: 3, fillAfterStrokeEnabled: true, listening: false })); }
      g.on('dragend', () => { const ox = g.x(), oy = g.y(); for (let i = 0; i < el.points.length; i += 2) { el.points[i] += ox; el.points[i + 1] += oy; } g.position({ x: 0, y: 0 }); markDirty(); DPRO.rerender(el); if (selectedElementId === el.id) DPRO.showHandles(el); });
      attachSelectHandler(g, el);
      return g;
    },
    props(el, box) {
      box.innerHTML = DPRO.fieldHtml('Label (optional)', `<input id="fp-label" type="text" value="${esc(el.label || '')}" placeholder="e.g. Front walk" />`);
      $('fp-label').addEventListener('change', (e) => { el.label = e.target.value; DPRO.rerender(el); markDirty(); });
      flagFields(el, box, true);
    },
  };
  DPRO.addLayer('stonepaths', 'Flagstone paths');
  DPRO.propHooks.push(function (el, box) { if (el.type === 'area' && el.subtype === 'flagstone') flagFields(el, box, false); });

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
  function flagTakeoff() {
    const stone = new Map(), fill = new Map();
    elements.forEach((el) => {
      if (!(el.type === 'stonepath' || (el.type === 'area' && el.subtype === 'flagstone'))) return;
      const q = F.qty(el); if (!q.sq) return; const a = stone.get(q.sp.stone) || { sq: 0, tons: 0, count: 0 }; a.sq += q.layout ? q.stoneSq : q.sq; a.tons += q.tons * 1.1; a.count += q.count || 0; stone.set(q.sp.stone, a);
      if (q.sp.infill === 'lawn') return; // grass between the stones needs no material
      const b = fill.get(q.sp.infill) || { cuft: 0, bags: 0 }; b.cuft += q.cuft; b.bags += q.bags; fill.set(q.sp.infill, b);
    });
    return { stone: [...stone.entries()].map(([k, v]) => Object.assign({ name: F.stoneBy[k].name }, v)), fill: [...fill.entries()].map(([k, v]) => Object.assign({ key: k, name: F.infillName(k) }, v)) };
  }
  DPRO.mat.takeoff = takeoff; DPRO.mat.flagTakeoff = flagTakeoff;
  function prices() { if (!DPRO.extras.matPrices || typeof DPRO.extras.matPrices !== 'object') DPRO.extras.matPrices = {}; return DPRO.extras.matPrices; }
  DPRO.addSideTab('materials', 'Rock & mulch', function (panel) {
    const t = takeoff(); const P = prices(); let total = 0;
    let h = `<div class="design-legend-group"><h4>Rock, gravel &amp; mulch needed</h4>`;
    if (!t.rows.length && !t.boulders.length && !flagTakeoff().stone.length) h += `<p class="empty-sub">Draw a bed, gravel area or flagstone path, or place boulders, and the quantities show up here.</p>`;
    t.rows.forEach((r) => {
      const price = Number(P[r.m.key]) || 0; const cost = r.cy * price; total += cost;
      h += `<div class="dpm-qrow"><img alt="" src="${thumb(r.m.key, 40)}" /><div><strong>${esc(r.m.name)}</strong><div class="empty-sub" style="margin:0">${r.sq.toFixed(0)} sq ft &middot; <strong>${r.cy.toFixed(2)} cu yd</strong>${r.m.ton ? ` &middot; ~${(r.cy * r.m.ton).toFixed(1)} tons` : ''}</div>
        <label class="dpm-price">$ per cu yd <input type="number" min="0" step="1" data-price="${r.m.key}" value="${price || ''}" placeholder="0" /></label>${price ? `<span class="dpm-cost">${money(cost)}</span>` : ''}</div></div>`;
    });
    const ft = flagTakeoff();
    if (ft.stone.length) {
      h += `<h4 style="margin-top:12px">Flagstone</h4>`;
      ft.stone.forEach((r) => { h += `<div class="design-legend-row"><span>${esc(r.name)} &middot; ${r.count ? r.count + ' stones, ' : ''}${r.sq.toFixed(0)} sq ft</span><span>~${r.tons.toFixed(1)} tons</span></div>`; });
      ft.fill.forEach((r) => { h += `<div class="design-legend-row"><span>Fill: ${esc(r.name)}</span><span>${r.cuft.toFixed(1)} cu ft${/^poly/.test(r.key) ? ` (~${Math.ceil(r.bags)} bags)` : ''}</span></div>`; });
    }
    if (t.boulders.length) { h += `<h4 style="margin-top:12px">Boulders</h4>`; t.boulders.forEach((b) => { h += `<div class="design-legend-row"><span>${esc(b.rock.name)} &mdash; ${b.size} ft</span><span>&times;${b.n}</span></div>`; }); }
    if (total) h += `<div class="design-legend-row design-legend-total"><span>Estimated material cost</span><span>${money(total)}</span></div>`;
    h += `<p class="empty-sub" style="margin-top:8px">Quantities use the depth set on each area (default depth for the material). Add 5-10% for settling and waste.</p></div>`;
    panel.innerHTML = h;
    panel.querySelectorAll('[data-price]').forEach((n) => n.addEventListener('change', () => { P[n.dataset.price] = Math.max(0, Number(n.value) || 0); markDirty(); setTimeout(() => DPRO.sidePanels.materials(), 0); }));
  });
  DPRO.legendHooks.push(function () {
    const t = takeoff(), ft = flagTakeoff(); if (!t.rows.length && !t.boulders.length && !ft.stone.length) return '';
    let h = `<div class="design-legend-group"><h4>Rock, gravel &amp; mulch</h4>`;
    ft.stone.forEach((r) => { h += `<div class="design-legend-row"><span>${esc(r.name)} flagstone</span><span>${r.count ? r.count + ' stones / ' : ''}${r.sq.toFixed(0)} sq ft</span></div>`; });
    ft.fill.forEach((r) => { h += `<div class="design-legend-row"><span>Fill: ${esc(r.name)}</span><span>${r.cuft.toFixed(1)} cu ft</span></div>`; });
    t.rows.forEach((r) => { h += `<div class="design-legend-row"><span>${esc(r.m.name)}</span><span>${r.cy.toFixed(1)} cu yd</span></div>`; });
    t.boulders.forEach((b) => { h += `<div class="design-legend-row"><span>${esc(b.rock.name)} ${b.size} ft</span><span>&times;${b.n}</span></div>`; });
    return h + '</div>';
  });
  DPRO.printHooks.push(function () {
    const t = takeoff(), ft = flagTakeoff(); if (!t.rows.length && !t.boulders.length && !ft.stone.length) return '';
    let h = `<div class="design-print-section"><h3>Rock, gravel &amp; mulch</h3>`;
    ft.stone.forEach((r) => { h += `<div class="design-print-row"><span>${esc(r.name)} flagstone (${r.count ? r.count + ' stones, ' : ''}${r.sq.toFixed(0)} sq ft)</span><span>~${r.tons.toFixed(1)} tons</span></div>`; });
    ft.fill.forEach((r) => { h += `<div class="design-print-row"><span>Fill: ${esc(r.name)}</span><span>${r.cuft.toFixed(1)} cu ft</span></div>`; });
    t.rows.forEach((r) => { h += `<div class="design-print-row"><span>${esc(r.m.name)} (${r.sq.toFixed(0)} sq ft)</span><span>${r.cy.toFixed(1)} cu yd${r.m.ton ? ' / ' + (r.cy * r.m.ton).toFixed(1) + ' tons' : ''}</span></div>`; });
    t.boulders.forEach((b) => { h += `<div class="design-print-row"><span>${esc(b.rock.name)} &mdash; ${b.size} ft</span><span>&times;${b.n}</span></div>`; });
    return h + '</div>';
  });

  DPRO.addToolGroup('dpro-group-rock', 'Rock, gravel & mulch', [
    { id: 'btn-dpm-lib', label: 'Rock & mulch library', title: 'Pick river rock, lava rock, pea gravel, bark mulch and more, then draw the area', onclick: () => { armed.active = true; armed.fromCard = true; setActiveTool('area-bed'); } },
    { tool: 'line-flagpath', label: 'Flagstone path', title: 'Draw a stone path, then choose the stone and what goes between the stones' },
    { tool: 'boulder', label: 'Boulder', title: 'Place decorative boulders' },
    { id: 'btn-dpm-list', label: 'Quantities', title: 'Cubic yards and tons of each material', onclick: () => switchSidePanel('materials') },
  ]);
})();
