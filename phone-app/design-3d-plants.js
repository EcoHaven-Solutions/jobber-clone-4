// ============================================================================
// design-3d-plants.js — realistic plant models for the 3D view.
//
// Instead of generic green blobs, every plant in the catalog is grown from a
// recipe that matches how that plant really looks: real branching skeletons
// with bark, leafy canopies made of leaf-cluster cards, conifer sprays and pine
// tufts, multi-stem shrubs, arching grasses with plumes, perennials with the
// right flower shape, and groundcover mats. It follows the seasons: spring leaf-
// out, summer green, fall color (each plant has its own), bare winter branches,
// and the months each plant actually blooms.
//
// Used by design-3d.js (editor + customer page). No images are downloaded:
// every texture is drawn with code, so it works offline and loads instantly.
// ============================================================================
(function () {
  'use strict';
  const DPRO = (window.DPRO = window.DPRO || {});

  // ---------------------------------------------------------------- helpers
  function rng(seed) { let s = (Math.floor(seed * 100000) >>> 0) || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const hashStr = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; };

  // ---------------------------------------------------------------- species
  // form params: crown0 (fraction of height that is bare trunk), peak (where the crown is widest, 0 bottom..1 top),
  // exp (fullness), baseR/topR (radius at bottom/top of crown), stems, br (main branches), lift/droop (branch angle)
  const D = { // defaults per category
    Tree: { form: 'tree', crown0: 0.28, peak: 0.5, exp: 0.62, baseR: 0.3, topR: 0, stems: 1, br: 10, lift: 0.45, droop: 0, leaf: 'broad', dens: 1.35, size: 1, bark: 'brown', summer: '#4B8A3A', fall: '#D9A82E', tw: 3 },
    Shrub: { form: 'shrub', crown0: 0.05, peak: 0.42, exp: 0.6, baseR: 0.7, topR: 0, stems: 5, br: 5, lift: 0.7, droop: 0, leaf: 'broad', dens: 1.4, size: 1, bark: 'grey', summer: '#5A9444', fall: '#C9A33A', tw: 2 },
  };
  const SP = {
    // ---- trees ----
    'norway-maple': { crown0: 0.24, peak: 0.5, exp: 0.5, baseR: 0.38, dens: 1.5, summer: '#3F7A34', fall: '#E6B02A', bark: 'brown' },
    'autumn-blaze-maple': { crown0: 0.26, peak: 0.45, exp: 0.66, baseR: 0.28, dens: 1.4, summer: '#4A8A38', fall: '#C8381E' },
    'honeylocust': { crown0: 0.3, peak: 0.42, exp: 0.62, baseR: 0.3, dens: 0.85, leaf: 'small', size: 1.15, summer: '#86B04A', fall: '#EAD64A', bark: 'dark' },
    'colorado-blue-spruce': { form: 'conifer', crown0: 0.06, peak: 0.07, exp: 0.9, baseR: 0.05, br: 22, droop: 0.28, leaf: 'needle', summer: '#5D8FA6', bark: 'dark', evergreen: true },
    'austrian-pine': { form: 'pine', wf: 0.85, crown0: 0.3, peak: 0.55, exp: 0.55, baseR: 0.3, br: 16, leaf: 'tuft', summer: '#2F5535', bark: 'dark', evergreen: true, dens: 1.2 },
    'quaking-aspen': { crown0: 0.34, peak: 0.5, exp: 0.82, baseR: 0.25, dens: 1.0, leaf: 'small', size: 1.1, summer: '#7FB04A', fall: '#F2CE2E', bark: 'white', stems: 1, tw: 3 },
    'flowering-crabapple': { crown0: 0.2, peak: 0.5, exp: 0.55, baseR: 0.4, dens: 1.35, summer: '#4C7F3A', fall: '#B88A30', bloom: { hex: '#F6B9D0', months: [3, 4], amount: 0.8 }, leafDelay: true },
    'serviceberry': { crown0: 0.1, peak: 0.55, exp: 0.7, baseR: 0.2, stems: 3, br: 8, summer: '#5F9246', fall: '#E8742A', bloom: { hex: '#FFFFFF', months: [3], amount: 0.7 }, bark: 'grey' },
    'autumn-brilliance-serviceberry': { crown0: 0.1, peak: 0.55, exp: 0.7, baseR: 0.2, stems: 3, br: 8, summer: '#5A8F45', fall: '#D2481E', bloom: { hex: '#FFFFFF', months: [3], amount: 0.7 }, bark: 'grey' },
    'ponderosa-pine': { form: 'pine', wf: 0.62, crown0: 0.5, peak: 0.5, exp: 0.7, baseR: 0.2, br: 14, leaf: 'tuft', summer: '#4F7A3A', bark: 'orange', evergreen: true, dens: 0.85, size: 1.15 },
    'eastern-redbud': { crown0: 0.12, peak: 0.45, exp: 0.62, baseR: 0.3, stems: 3, br: 9, dens: 1.3, summer: '#4E8F4A', fall: '#E0C040', bloom: { hex: '#D44A9E', months: [2, 3], amount: 1 }, leafDelay: true, bark: 'dark' },
    'paperbark-maple': { crown0: 0.28, peak: 0.5, exp: 0.7, baseR: 0.25, dens: 1.2, summer: '#4B8A3E', fall: '#D9502A', bark: 'cinnamon' },
    'silver-linden': { crown0: 0.2, peak: 0.35, exp: 0.7, baseR: 0.3, dens: 1.5, summer: '#6A9A62', fall: '#D8C640', bark: 'grey' },
    // ---- shrubs ----
    'green-mountain-boxwood': { form: 'dome', leaf: 'small', size: 0.8, dens: 2.4, summer: '#2F6030', evergreen: true, peak: 0.35, exp: 0.5, baseR: 0.8, stems: 3 },
    'burning-bush': { peak: 0.4, exp: 0.55, baseR: 0.75, stems: 6, summer: '#5B9040', fall: '#D8202C', size: 1.05, dens: 1.5 },
    'blue-mist-spirea': { peak: 0.45, exp: 0.5, baseR: 0.7, leaf: 'small', size: 0.9, summer: '#7FA578', bloom: { hex: '#7C8EE0', months: [6, 7, 8], amount: 0.85 } },
    'lilac': { peak: 0.55, exp: 0.7, baseR: 0.45, crown0: 0.15, stems: 7, summer: '#4C7F3F', fall: '#B8B860', bloom: { hex: '#B38FD6', months: [4], amount: 1, kind: 'panicle' } },
    'rose-of-sharon': { peak: 0.6, exp: 0.7, baseR: 0.3, crown0: 0.2, stems: 5, lift: 0.9, summer: '#5E9446', fall: '#C9B850', bloom: { hex: '#E888C4', months: [6, 7, 8], amount: 0.7 } },
    'potentilla': { peak: 0.4, exp: 0.5, baseR: 0.75, leaf: 'small', size: 0.8, dens: 1.8, summer: '#7FA84C', bloom: { hex: '#F7D420', months: [5, 6, 7, 8, 9], amount: 0.9 } },
    'dwarf-korean-lilac': { peak: 0.4, exp: 0.5, baseR: 0.75, dens: 1.8, size: 0.85, summer: '#4F8A40', bloom: { hex: '#C9A0DD', months: [4, 5], amount: 0.9, kind: 'panicle' } },
    'arborvitae-emerald': { form: 'column', leaf: 'frond', size: 1.7, dens: 2.0, summer: '#2E6A3A', evergreen: true, peak: 0.42, exp: 0.85, baseR: 0.45, crown0: 0.02, stems: 1 },
    'juniper-blue-rug': { form: 'mat', leaf: 'frond', size: 1.0, summer: '#6E9AA8', evergreen: true },
    'red-twig-dogwood': { peak: 0.5, exp: 0.6, baseR: 0.55, stems: 13, br: 4, lift: 1.0, summer: '#5C9444', fall: '#A8403A', bark: 'red', dens: 1.2, tw: 3 },
    'elderberry': { peak: 0.55, exp: 0.6, baseR: 0.45, crown0: 0.12, stems: 6, summer: '#4A7A3C', fall: '#C0B040', size: 1.1, bloom: { hex: '#FFF6E2', months: [5], amount: 0.8 } },
    'smoke-tree': { crown0: 0.12, peak: 0.55, exp: 0.55, baseR: 0.35, stems: 4, summer: '#7A4A68', fall: '#E0652A', bloom: { hex: '#D8A8C8', months: [5, 6, 7, 8], amount: 1, kind: 'puff' }, dens: 1.2 },
    'mock-orange': { peak: 0.6, exp: 0.65, baseR: 0.4, crown0: 0.12, stems: 6, summer: '#5A9446', fall: '#C8C050', bloom: { hex: '#FFFFFF', months: [4, 5], amount: 0.9 } },
    'golden-currant': { peak: 0.5, exp: 0.6, baseR: 0.55, stems: 6, summer: '#6FA34C', fall: '#E07A2E', size: 0.95, bloom: { hex: '#F2C61F', months: [3, 4], amount: 0.9 } },
    'oregon-grape': { form: 'shrub', leaf: 'holly', evergreen: true, peak: 0.45, exp: 0.55, baseR: 0.6, stems: 6, summer: '#2F6A3A', dens: 1.6, size: 0.85, bloom: { hex: '#F4D624', months: [3, 4], amount: 0.8 } },
    'red-currant': { peak: 0.5, exp: 0.6, baseR: 0.5, stems: 6, summer: '#5F9A4C', fall: '#D0A040', bloom: { hex: '#E24E80', months: [3, 4], amount: 0.9 } },
    'spirea': { peak: 0.42, exp: 0.5, baseR: 0.7, leaf: 'small', size: 0.9, dens: 1.7, summer: '#6FA04A', fall: '#C88A3A', bloom: { hex: '#E470A2', months: [5, 6], amount: 0.95 } },
    'ninebark': { peak: 0.5, exp: 0.6, baseR: 0.5, stems: 6, summer: '#55263F', fall: '#7A3A3A', bloom: { hex: '#F4E0E6', months: [5], amount: 0.8 } },
    'upright-juniper': { form: 'column', leaf: 'frond', size: 1.7, dens: 2.0, summer: '#6A8F99', evergreen: true, peak: 0.4, exp: 0.9, baseR: 0.5, crown0: 0.02, stems: 1 },
  };
  const FORM_OVR = {
    conifer: { crown0: 0.06, peak: 0.07, exp: 0.9, baseR: 0.05, stems: 1, br: 22, droop: 0.28, leaf: 'needle', dens: 1, bark: 'dark' },
    pine: { crown0: 0.3, peak: 0.55, exp: 0.55, baseR: 0.3, stems: 1, br: 14, leaf: 'tuft', dens: 1, bark: 'dark' },
    column: { stems: 1, br: 0 },
    dome: { br: 0 },
    mat: {},
  };
  function specOf(plant) {
    const cat = plant.category === 'Tree' ? 'Tree' : 'Shrub';
    const s = Object.assign({}, D[cat], SP[plant.key] || {});
    if (s.form && FORM_OVR[s.form]) { const o = FORM_OVR[s.form]; Object.keys(o).forEach((k) => { if (!(SP[plant.key] && SP[plant.key][k] != null)) s[k] = o[k]; }); }
    if (!SP[plant.key] && plant.color) { s.summer = plant.color; s.fall = plant.color; }
    if (s.evergreen == null) s.evergreen = !!plant.evergreen;
    return s;
  }

  const PER = { // perennials / grasses
    'russian-sage': { fol: 'airy', leaf: '#8FA78F', fl: { form: 'airy', hex: '#8C90D6', months: [6, 7, 8, 9], tall: 0.95, n: 14 } },
    'black-eyed-susan': { fol: 'mound', leaf: '#4E8A3A', fl: { form: 'daisy', hex: '#EDAA22', center: '#3A2A18', months: [6, 7, 8, 9], tall: 0.9, n: 12 } },
    'daylily': { fol: 'blade', leaf: '#5B9444', fl: { form: 'star', hex: '#E8782A', months: [5, 6, 7], tall: 1.0, n: 8 } },
    'coneflower': { fol: 'mound', leaf: '#4E8A3C', fl: { form: 'cone', hex: '#C055A8', center: '#8A4A1E', months: [6, 7, 8, 9], tall: 1.0, n: 8 } },
    'sedum-autumn-joy': { fol: 'sedum', leaf: '#8DB07F', fl: { form: 'umbel', hex: '#C04F72', months: [7, 8, 9, 10], tall: 0.85, n: 9 }, pre: { hex: '#A3BE86', months: [5, 6] } },
    'lavender': { fol: 'airy', leaf: '#91A88C', evergreen: true, fl: { form: 'spike', hex: '#7E6EC4', months: [5, 6, 7], tall: 1.0, n: 20 } },
    'hosta': { fol: 'rosette', leaf: '#4F8E62', fl: { form: 'spike', hex: '#CDB9EA', months: [6, 7], tall: 1.5, n: 3 } },
    'peony': { fol: 'mound', leaf: '#3F7A3A', fl: { form: 'ball', hex: '#EE8DB8', months: [4, 5], tall: 0.95, n: 7 } },
    'catmint': { fol: 'airy', leaf: '#8AA48A', fl: { form: 'spike', hex: '#8C9AE4', months: [4, 5, 6, 7, 8], tall: 0.9, n: 22 } },
    'blanket-flower-gaillardia': { fol: 'mound', leaf: '#6C9A50', fl: { form: 'daisy', hex: '#E0552A', center: '#8A2A18', months: [5, 6, 7, 8, 9], tall: 0.9, n: 11 } },
    'yarrow': { fol: 'airy', leaf: '#6E9A58', fl: { form: 'umbel', hex: '#F2EBC4', months: [5, 6, 7, 8], tall: 1.0, n: 8 } },
    'bee-balm-monarda': { fol: 'mound', leaf: '#4E8A44', fl: { form: 'ball', hex: '#C27AD0', months: [6, 7, 8], tall: 1.0, n: 7 } },
    'penstemon': { fol: 'rosette', leaf: '#4E8A50', fl: { form: 'spike', hex: '#5C66D2', months: [5, 6], tall: 1.0, n: 5 } },
    'lupine': { fol: 'mound', leaf: '#4A8450', fl: { form: 'spike', hex: '#6E55C4', months: [4, 5, 6], tall: 1.0, n: 7 } },
    'lenten-rose-hellebore': { fol: 'rosette', leaf: '#3F6E48', evergreen: true, fl: { form: 'star', hex: '#C9A0B6', months: [1, 2, 3], tall: 0.75, n: 6 } },
    'karl-foerster': { grass: 'upright', leaf: '#8DAA55', tan: '#D9C58A', plume: { hex: '#E0CD94', months: [5, 6, 7, 8, 9, 10, 11, 0, 1], tall: 1.0, n: 11, kind: 'feather' } },
    'blue-oat-grass': { grass: 'dome', leaf: '#86AAB2', tan: '#CFC49A', plume: { hex: '#D8C98E', months: [5, 6, 7, 8], tall: 1.25, n: 12, kind: 'oat' } },
    'fountain-grass': { grass: 'fountain', leaf: '#9AB057', tan: '#CFB27C', plume: { hex: '#C7A0A0', months: [6, 7, 8, 9, 10], tall: 1.0, n: 12, kind: 'brush' } },
  };
  const GC = {
    'creeping-thyme': { leaf: '#6F9A5C', bloom: { hex: '#B488CC', months: [5, 6] } },
    'vinca-minor': { leaf: '#3E6F4C', evergreen: true, bloom: { hex: '#6F80DA', months: [3, 4] } },
    'sedum-groundcover': { leaf: '#9AB35C', bloom: { hex: '#F2D640', months: [6, 7] } },
    'sweet-woodruff': { leaf: '#5A9A60', bloom: { hex: '#FFFFFF', months: [4, 5] } },
    'kinnikinnick': { leaf: '#4F6B4A', evergreen: true, bloom: { hex: '#F2C4CC', months: [3, 4] }, berry: { hex: '#C9302C', months: [8, 9, 10] } },
    'wild-strawberry': { leaf: '#4F8C4C', bloom: { hex: '#FFFFFF', months: [4, 5] }, berry: { hex: '#D02C2A', months: [6, 7] } },
    'ice-plant-delosperma': { leaf: '#6FA060', evergreen: true, bloom: { hex: '#E0408F', months: [5, 6, 7] } },
  };

  // ---------------------------------------------------------------- textures
  const texCache = new Map();
  function cnv(n, m) { const c = document.createElement('canvas'); c.width = n; c.height = m || n; return [c, c.getContext('2d')]; }
  function leafPath(g, x, y, len, wid, ang, pointy) {
    g.save(); g.translate(x, y); g.rotate(ang);
    g.beginPath(); g.moveTo(0, 0);
    g.bezierCurveTo(wid * 0.9, len * 0.2, wid * 0.8, len * 0.7, 0, len * (pointy ? 1.05 : 0.98));
    g.bezierCurveTo(-wid * 0.8, len * 0.7, -wid * 0.9, len * 0.2, 0, 0); g.closePath(); g.restore();
  }
  function paintLeaf(g, x, y, len, wid, ang, R, pointy, vein) {
    const v = 190 + R() * 65; g.save(); g.translate(x, y); g.rotate(ang);
    leafPath(g, 0, 0, len, wid, 0, pointy);
    const gr = g.createLinearGradient(-wid, 0, wid, len * 0.7); gr.addColorStop(0, `rgb(${v | 0},${v | 0},${v | 0})`); gr.addColorStop(1, `rgb(${(v * 0.86) | 0},${(v * 0.86) | 0},${(v * 0.86) | 0})`);
    g.fillStyle = gr; g.fill(); g.strokeStyle = 'rgba(40,40,40,0.4)'; g.lineWidth = 1; g.stroke();
    if (vein) { g.strokeStyle = 'rgba(40,40,40,0.35)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, len * 0.9); g.stroke(); }
    g.restore();
  }
  const TEX = {
    broad(T) { const [c, g] = cnv(128); const R = rng(11); const items = [];
      for (let i = 0; i < 44; i++) { const a = R() * 6.283, d = Math.sqrt(R()) * 46; items.push([64 + Math.cos(a) * d, 64 + Math.sin(a) * d, 14 + R() * 12, 5 + R() * 4, R() * 6.283]); }
      items.sort((p, q) => p[1] - q[1]).forEach((it) => paintLeaf(g, it[0], it[1], it[2], it[3], it[4], R, true, true)); return c; },
    small(T) { const [c, g] = cnv(128); const R = rng(12);
      for (let i = 0; i < 110; i++) { const a = R() * 6.283, d = Math.sqrt(R()) * 52; paintLeaf(g, 64 + Math.cos(a) * d, 64 + Math.sin(a) * d, 8 + R() * 5, 3.4 + R() * 2, R() * 6.283, R, false, false); } return c; },
    holly(T) { const [c, g] = cnv(128); const R = rng(13);
      for (let i = 0; i < 30; i++) { const a = R() * 6.283, d = Math.sqrt(R()) * 46; const x = 64 + Math.cos(a) * d, y = 64 + Math.sin(a) * d, L = 17 + R() * 8;
        g.save(); g.translate(x, y); g.rotate(R() * 6.283); const v = 160 + R() * 95; g.fillStyle = `rgb(${v | 0},${v | 0},${v | 0})`; g.strokeStyle = 'rgba(30,30,30,0.6)'; g.lineWidth = 1;
        g.beginPath(); g.moveTo(0, 0); for (let k = 1; k <= 5; k++) { g.lineTo(5 + (k % 2 ? 3 : 0), L * k / 5); } g.lineTo(0, L * 1.05); for (let k = 5; k >= 1; k--) { g.lineTo(-5 - (k % 2 ? 3 : 0), L * k / 5); } g.closePath(); g.fill(); g.stroke(); g.restore(); } return c; },
    needle(T) { const [c, g] = cnv(128); const R = rng(14);
      // a spray: central stem top->bottom with side sprigs, each covered in short needles
      const spr = (x0, y0, ang, len, depth) => {
        const steps = Math.max(5, Math.round(len / 4));
        for (let s = 0; s < steps; s++) { const f = s / steps; const px = x0 + Math.sin(ang) * len * f, py = y0 + Math.cos(ang) * len * f;
          for (const side of [-1, 1]) { const na = ang + side * (0.9 + R() * 0.3); const L = 6 + (1 - f) * 6; const v = 120 + R() * 130; g.strokeStyle = `rgb(${v | 0},${v | 0},${v | 0})`; g.lineWidth = 1.4; g.beginPath(); g.moveTo(px, py); g.lineTo(px + Math.sin(na) * L, py + Math.cos(na) * L); g.stroke(); }
          if (depth < 1 && s % 3 === 1) spr(px, py, ang + (s % 2 ? 0.7 : -0.7), len * 0.42, depth + 1); }
        g.strokeStyle = 'rgba(70,55,40,0.9)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + Math.sin(ang) * len, y0 + Math.cos(ang) * len); g.stroke(); };
      spr(64, 4, 0, 118, 0); spr(64, 30, 0.55, 70, 1); spr(64, 30, -0.55, 70, 1); return c; },
    frond(T) { const [c, g] = cnv(128); const R = rng(15);
      for (let i = 0; i < 9; i++) { const a = -0.9 + i * 0.22 + (R() - 0.5) * 0.1, L = 100 + R() * 22; const x0 = 64, y0 = 6;
        for (let s = 0; s < 30; s++) { const f = s / 30; const px = x0 + Math.sin(a) * L * f, py = y0 + Math.cos(a) * L * f; const v = 130 + R() * 125; g.fillStyle = `rgb(${v | 0},${v | 0},${v | 0})`; g.beginPath(); g.ellipse(px, py, 7 * (1 - f * 0.5), 3.4, a + 1.5708, 0, 6.283); g.fill(); } }
      return c; },
    tuft(T) { const [c, g] = cnv(128); const R = rng(16);
      for (let i = 0; i < 140; i++) { const a = R() * 6.283, L = 36 + R() * 26, bend = (R() - 0.5) * 0.5; const v = 120 + R() * 135; g.strokeStyle = `rgb(${v | 0},${v | 0},${v | 0})`; g.lineWidth = 1.3;
        g.beginPath(); g.moveTo(64 + Math.cos(a) * 4, 64 + Math.sin(a) * 4); g.quadraticCurveTo(64 + Math.cos(a + bend) * L * 0.55, 64 + Math.sin(a + bend) * L * 0.55, 64 + Math.cos(a + bend * 1.6) * L, 64 + Math.sin(a + bend * 1.6) * L); g.stroke(); }
      g.fillStyle = 'rgba(90,70,50,0.9)'; g.beginPath(); g.arc(64, 64, 4, 0, 6.283); g.fill(); return c; },
    blossom(T) { const [c, g] = cnv(128); const R = rng(17);
      for (let i = 0; i < 20; i++) { const a = R() * 6.283, d = Math.sqrt(R()) * 48; const x = 64 + Math.cos(a) * d, y = 64 + Math.sin(a) * d, r = 7 + R() * 4;
        for (let p = 0; p < 5; p++) { const pa = p * 1.2566 + R(); g.fillStyle = `rgb(${(225 + R() * 30) | 0},${(225 + R() * 30) | 0},${(225 + R() * 30) | 0})`; g.beginPath(); g.ellipse(x + Math.cos(pa) * r * 0.55, y + Math.sin(pa) * r * 0.55, r * 0.55, r * 0.4, pa, 0, 6.283); g.fill(); }
        g.fillStyle = 'rgb(190,170,130)'; g.beginPath(); g.arc(x, y, r * 0.22, 0, 6.283); g.fill(); } return c; },
    panicle(T) { const [c, g] = cnv(128, 128); const R = rng(18);
      for (let i = 0; i < 170; i++) { const f = R(); const y = 8 + f * 112; const half = (1 - f) * 30 + 5; const x = 64 + (R() * 2 - 1) * half; const v = 215 + R() * 40; g.fillStyle = `rgb(${v | 0},${v | 0},${v | 0})`; g.beginPath(); g.arc(x, y, 3.2 + R() * 2.2, 0, 6.283); g.fill(); } return c; },
    puff(T) { const [c, g] = cnv(128); const R = rng(19);
      for (let i = 0; i < 90; i++) { const a = R() * 6.283, d = Math.sqrt(R()) * 46; const x = 64 + Math.cos(a) * d, y = 64 + Math.sin(a) * d; const gr = g.createRadialGradient(x, y, 0, x, y, 14); gr.addColorStop(0, 'rgba(255,255,255,0.95)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, 14, 0, 6.283); g.fill(); } return c; },
    hostaLeaf(T) { const [c, g] = cnv(128); g.save(); g.translate(64, 120); const gr = g.createLinearGradient(0, 0, 0, -112); gr.addColorStop(0, 'rgb(150,150,150)'); gr.addColorStop(1, 'rgb(250,250,250)');
      g.fillStyle = gr; g.strokeStyle = 'rgba(30,30,30,0.6)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(60, -16, 58, -90, 0, -116); g.bezierCurveTo(-58, -90, -60, -16, 0, 0); g.fill(); g.stroke();
      g.strokeStyle = 'rgba(30,30,30,0.35)'; for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(0, -4); g.quadraticCurveTo(i * 12, -50, i * 17, -88 + Math.abs(i) * 14); g.stroke(); } g.restore(); return c; },
  };
  function tex(T, name) {
    const k = name; if (texCache.has(k)) return texCache.get(k);
    const t = new T.CanvasTexture(TEX[name](T)); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; texCache.set(k, t); return t;
  }
  // flower textures with the color baked in (so the center can be a different color)
  function flowerTex(T, form, hex, center) {
    const k = 'f|' + form + hex + (center || ''); if (texCache.has(k)) return texCache.get(k);
    const [c, g] = cnv(128); const R = rng(hashStr(k) * 100 + 5); const col = new T.Color(hex);
    const css = (m, a) => { const o = col.clone().multiplyScalar(m); o.convertLinearToSRGB(); return `rgba(${(clamp(o.r, 0, 1) * 255) | 0},${(clamp(o.g, 0, 1) * 255) | 0},${(clamp(o.b, 0, 1) * 255) | 0},${a == null ? 1 : a})`; };
    const petal = (x, y, ang, L, W, m) => { g.save(); g.translate(x, y); g.rotate(ang); g.fillStyle = css(m || 1); g.beginPath(); g.ellipse(0, L * 0.5, W, L * 0.5, 0, 0, 6.283); g.fill(); g.restore(); };
    if (form === 'daisy') {
      for (let i = 0; i < 16; i++) petal(64, 64, i * 0.3927, 50, 8, 0.85 + R() * 0.25);
      g.fillStyle = center || '#3A2A18'; g.beginPath(); g.arc(64, 64, 15, 0, 6.283); g.fill();
    } else if (form === 'cone') {
      for (let i = 0; i < 13; i++) petal(64, 70, i * 0.4833 + 3.14, 48, 7, 0.85 + R() * 0.25); // drooping petals
      g.fillStyle = center || '#8A4A1E'; g.beginPath(); g.ellipse(64, 56, 16, 18, 0, 0, 6.283); g.fill(); g.fillStyle = 'rgba(255,200,90,0.55)'; for (let i = 0; i < 20; i++) { g.beginPath(); g.arc(58 + R() * 12, 46 + R() * 16, 1.6, 0, 6.283); g.fill(); }
    } else if (form === 'star') {
      for (let i = 0; i < 6; i++) petal(64, 64, i * 1.0472, 52, 12, 0.9 + (i % 2) * 0.15);
      g.fillStyle = css(0.55); g.beginPath(); g.arc(64, 64, 8, 0, 6.283); g.fill();
    } else if (form === 'ball') {
      for (let i = 0; i < 60; i++) { const a = R() * 6.283, d = Math.sqrt(R()) * 44; petal(64 + Math.cos(a) * d, 64 + Math.sin(a) * d, R() * 6.283, 20, 7, 0.78 + R() * 0.4); }
    } else if (form === 'umbel') {
      for (let i = 0; i < 90; i++) { const a = R() * 6.283, d = Math.sqrt(R()) * 52; g.fillStyle = css(0.8 + R() * 0.35); g.beginPath(); g.arc(64 + Math.cos(a) * d, 64 + Math.sin(a) * d * 0.8, 4 + R() * 3, 0, 6.283); g.fill(); }
    } else if (form === 'spike') {
      g.strokeStyle = 'rgba(70,110,60,0.9)'; g.lineWidth = 3; g.beginPath(); g.moveTo(64, 126); g.lineTo(64, 70); g.stroke();
      for (let i = 0; i < 90; i++) { const f = Math.pow(R(), 0.9); const y = 6 + f * 100; const half = 6 + (1 - f) * 8 + 5; g.fillStyle = css(0.75 + R() * 0.45); g.beginPath(); g.ellipse(64 + (R() * 2 - 1) * half, y, 4.2 + R() * 2, 3.4, 0, 0, 6.283); g.fill(); }
    } else if (form === 'airy') {
      for (let b = 0; b < 7; b++) { const bx = 64 + (b - 3) * 7, tilt = (b - 3) * 0.13; g.strokeStyle = 'rgba(130,140,150,0.75)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(64, 126); g.lineTo(bx + tilt * 60, 20); g.stroke();
        for (let i = 0; i < 26; i++) { const f = i / 26; const x = lerp(64, bx + tilt * 60, 0.35 + f * 0.65) + (R() - 0.5) * 12, y = lerp(100, 12, f) + (R() - 0.5) * 6; g.fillStyle = css(0.8 + R() * 0.4); g.beginPath(); g.arc(x, y, 2.4 + R() * 1.5, 0, 6.283); g.fill(); } }
    } else if (form === 'feather') {
      g.strokeStyle = css(0.75); g.lineWidth = 2; g.beginPath(); g.moveTo(64, 126); g.lineTo(64, 6); g.stroke();
      for (let i = 0; i < 80; i++) { const f = R(); const y = 8 + f * 100; const side = R() > 0.5 ? 1 : -1; const L = 6 + (1 - Math.abs(f - 0.45) * 1.4) * 8; g.strokeStyle = css(0.8 + R() * 0.4); g.lineWidth = 1.5; g.beginPath(); g.moveTo(64, y); g.lineTo(64 + side * L, y - 8 - R() * 4); g.stroke(); }
    } else if (form === 'oat') {
      g.strokeStyle = css(0.7); g.lineWidth = 1.4; g.beginPath(); g.moveTo(40, 126); g.quadraticCurveTo(60, 20, 100, 30); g.stroke();
      for (let i = 0; i < 10; i++) { const f = 0.45 + i * 0.055; const x = lerp(40, 100, f) + Math.sin(f * 4) * 4, y = 126 - (126 - 28) * Math.sqrt(f); g.fillStyle = css(0.85 + R() * 0.3); g.beginPath(); g.ellipse(x, y + 8, 3.4, 7, 0.4, 0, 6.283); g.fill(); }
    } else if (form === 'brush') {
      g.strokeStyle = css(0.65); g.lineWidth = 2; g.beginPath(); g.moveTo(30, 126); g.quadraticCurveTo(60, 30, 104, 50); g.stroke();
      for (let i = 0; i < 90; i++) { const f = R(); const x = lerp(54, 104, f), y = lerp(40, 52, f) + (R() - 0.5) * 6; const a = -0.6 + (R() - 0.5) * 2.4; g.strokeStyle = css(0.85 + R() * 0.35, 0.95); g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 11, y + Math.sin(a) * 11); g.stroke(); }
    }
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; texCache.set(k, t); return t;
  }
  function barkTex(T, kind) {
    const k = 'b|' + kind; if (texCache.has(k)) return texCache.get(k);
    const base = { brown: '#6A5240', dark: '#463A30', grey: '#7C766E', white: '#E8E4D8', cinnamon: '#A8602E', orange: '#B5683A', red: '#B8302A' }[kind] || '#6A5240';
    const [c, g] = cnv(64, 128); const R = rng(hashStr(kind) * 99 + 3);
    g.fillStyle = base; g.fillRect(0, 0, 64, 128);
    if (kind === 'white') { g.fillStyle = 'rgba(30,28,24,0.75)'; for (let i = 0; i < 26; i++) { const y = R() * 128, x = R() * 64, w = 6 + R() * 12; g.beginPath(); g.moveTo(x, y); g.lineTo(x + w / 2, y - 3); g.lineTo(x + w, y); g.lineTo(x + w / 2, y + 2); g.fill(); } }
    else if (kind === 'orange') { for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(${R() > 0.5 ? '60,34,22' : '230,140,80'},0.5)`; g.fillRect(R() * 56, R() * 120, 6 + R() * 10, 12 + R() * 22); } }
    else if (kind === 'cinnamon') { for (let i = 0; i < 24; i++) { g.fillStyle = `rgba(${R() > 0.5 ? '230,170,120' : '110,50,25'},0.55)`; g.fillRect(R() * 58, R() * 120, 4 + R() * 6, 14 + R() * 22); } }
    else if (kind !== 'red') { g.strokeStyle = 'rgba(0,0,0,0.38)'; g.lineWidth = 2; for (let i = 0; i < 12; i++) { const x = R() * 64; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 6, 40, x - 6, 80, x + 2, 128); g.stroke(); } g.strokeStyle = 'rgba(255,255,255,0.10)'; for (let i = 0; i < 8; i++) { const x = R() * 64; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 3, 128); g.stroke(); } }
    const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; texCache.set(k, t); return t;
  }

  // ---------------------------------------------------------------- geometry
  let NIGHT = false; // night scenes: add a little self-light so foliage reads against the dark (moonlight is faint)
  const geoCache = new Map();
  function quadGeo(T, plane) { // plane: 'h' (horizontal), 'x' (vertical in XY), 'z' (vertical in ZY)
    const pos = [], uv = [], nor = [], idx = [];
    const corners = { h: [[-.5, 0, .5], [.5, 0, .5], [.5, 0, -.5], [-.5, 0, -.5]], x: [[-.5, -.5, 0], [.5, -.5, 0], [.5, .5, 0], [-.5, .5, 0]], z: [[0, -.5, -.5], [0, -.5, .5], [0, .5, .5], [0, .5, -.5]] }[plane];
    const uvs = plane === 'h' ? [[0, 0], [1, 0], [1, 1], [0, 1]] : [[0, 0], [1, 0], [1, 1], [0, 1]];
    for (let side = 0; side < 2; side++) {
      const base = pos.length / 3;
      corners.forEach((c, i) => { pos.push(c[0], c[1], c[2]); uv.push(uvs[i][0], uvs[i][1]); nor.push(0, 1, 0); });
      if (side === 0) idx.push(base, base + 1, base + 2, base, base + 2, base + 3); else idx.push(base, base + 2, base + 1, base, base + 3, base + 2);
    }
    return { pos, uv, nor, idx };
  }
  function cardGeo(T, kind) {
    const k = kind; if (geoCache.has(k)) return geoCache.get(k);
    const planes = kind === 'cross' ? ['x', 'z', 'h'] : kind === 'vert' ? ['x', 'z'] : ['h'];
    const pos = [], uv = [], nor = [], idx = [];
    planes.forEach((p) => { const q = quadGeo(T, p); const off = pos.length / 3; pos.push(...q.pos); uv.push(...q.uv); nor.push(...q.nor); q.idx.forEach((i) => idx.push(i + off)); });
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setAttribute('normal', new T.Float32BufferAttribute(nor, 3)); g.setIndex(idx);
    geoCache.set(k, g); return g;
  }
  // cards: [{x,y,z,s,sy,yaw,tilt,col}]  -> InstancedMesh
  function cardMesh(T, texture, kind, cards, opt) {
    opt = opt || {}; if (!cards.length) return null;
    const mat = new T.MeshLambertMaterial({ map: texture, alphaTest: opt.alphaTest || 0.42, side: T.FrontSide });
    if (NIGHT) { mat.emissiveMap = texture; mat.emissive = new T.Color(opt.emissive || '#3C6048'); } else if (opt.emissive) mat.emissive = new T.Color(opt.emissive);
    const mesh = new T.InstancedMesh(cardGeo(T, kind), mat, cards.length); const o = new T.Object3D();
    cards.forEach((c, i) => {
      o.position.set(c.x, c.y, c.z); o.rotation.set(c.tilt || 0, c.yaw || 0, c.roll || 0, 'YXZ'); o.scale.set(c.s, c.sy == null ? c.s : c.sy, c.sz == null ? c.s : c.sz); o.updateMatrix(); mesh.setMatrixAt(i, o.matrix);
      mesh.setColorAt(i, c.col || new T.Color(1, 1, 1));
    });
    mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.castShadow = opt.cast !== false; mesh.receiveShadow = false; mesh.frustumCulled = false; return mesh;
  }
  // skeleton segments -> one merged mesh. seg: {a:[x,y,z], b:[...], r0, r1, v0}
  function branchMesh(T, segs, bark, color) {
    if (!segs.length) return null;
    const sides = 5, pos = [], uv = [], idx = [];
    segs.forEach((s) => {
      const ax = s.a[0], ay = s.a[1], az = s.a[2], bx = s.b[0], by = s.b[1], bz = s.b[2];
      let dx = bx - ax, dy = by - ay, dz = bz - az; const len = Math.hypot(dx, dy, dz) || 1e-6; dx /= len; dy /= len; dz /= len;
      let ux = 0, uy = 1, uz = 0; if (Math.abs(dy) > 0.9) { ux = 1; uy = 0; }
      let px = dy * uz - dz * uy, py = dz * ux - dx * uz, pz = dx * uy - dy * ux; const pl = Math.hypot(px, py, pz) || 1; px /= pl; py /= pl; pz /= pl;
      const qx = dy * pz - dz * py, qy = dz * px - dx * pz, qz = dx * py - dy * px;
      const base = pos.length / 3;
      for (let ring = 0; ring < 2; ring++) {
        const r = ring ? s.r1 : s.r0, cx = ring ? bx : ax, cy = ring ? by : ay, cz = ring ? bz : az, v = (s.v0 || 0) + (ring ? len * 0.3 : 0);
        for (let i = 0; i <= sides; i++) { const a = (i / sides) * 6.2832, ca = Math.cos(a), sa = Math.sin(a); pos.push(cx + (px * ca + qx * sa) * r, cy + (py * ca + qy * sa) * r, cz + (pz * ca + qz * sa) * r); uv.push(i / sides * 2, v); }
      }
      for (let i = 0; i < sides; i++) { const a = base + i, b = base + i + 1, c2 = base + sides + 1 + i, d = base + sides + 2 + i; idx.push(a, c2, b, b, c2, d); }
    });
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const bk = new T.MeshLambertMaterial({ map: bark ? barkTex(T, bark) : null, color: color || 0xffffff }); if (NIGHT) bk.emissive = new T.Color('#2a2420');
    const m = new T.Mesh(g, bk);
    m.castShadow = true; m.receiveShadow = false; m.frustumCulled = false; return m;
  }
  // grass blades / thin stalks: ribbons with vertex colors
  function bladeMesh(T, blades) {
    if (!blades.length) return null; const pos = [], col = [], idx = [];
    blades.forEach((b) => {
      const seg = b.seg || 5; const base = pos.length / 3; const ca = Math.cos(b.az), sa = Math.sin(b.az), px = -sa, pz = ca;
      let x = b.x, y = 0, z = b.z; let ang = b.lean || 0; const L = b.len / seg;
      for (let j = 0; j <= seg; j++) {
        const f = j / seg, wd = b.w * (1 - Math.pow(f, 1.4) * 0.92) * 0.5; const sh = lerp(b.c0 == null ? 0.8 : b.c0, b.c1 == null ? 1.35 : b.c1, f);
        const c = b.col; col.push(c.r * sh, c.g * sh, c.b * sh, c.r * sh, c.g * sh, c.b * sh);
        pos.push(x - px * wd, y, z - pz * wd, x + px * wd, y, z + pz * wd);
        const step = (b.bend || 0) * (1 / seg) * (0.4 + f * 1.2); ang += step; x += ca * Math.sin(ang) * L; z += sa * Math.sin(ang) * L; y += Math.cos(ang) * L;
      }
      for (let j = 0; j < seg; j++) { const a = base + j * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2, a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    });
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new T.Float32BufferAttribute(col, 3));
    const n = new Float32Array(pos.length); for (let i = 1; i < n.length; i += 3) n[i] = 1; g.setAttribute('normal', new T.BufferAttribute(n, 3)); g.setIndex(idx);
    const bmat = new T.MeshLambertMaterial({ vertexColors: true, side: T.DoubleSide }); if (NIGHT) bmat.emissive = new T.Color('#1e3523'); const m = new T.Mesh(g, bmat); m.castShadow = true; m.frustumCulled = false; return m;
  }

  // ---------------------------------------------------------------- seasons
  function seasonFor(sp, month, plant) {
    const m = month; const evergreen = !!sp.evergreen;
    const bloom = sp.bloom && sp.bloom.months.indexOf(m) >= 0 ? sp.bloom : null;
    let leaf = 1, fall = 0, spring = 0;
    if (!evergreen) {
      if (m >= 10 || m <= 1) leaf = 0;
      else if (m === 2) leaf = sp.leafDelay || sp.bloom ? 0 : 0;
      else if (m === 3) { leaf = sp.leafDelay ? 0.3 : 0.6; spring = 1; }
      else if (m === 4) { leaf = 0.95; spring = 0.35; }
      else if (m === 8) { leaf = 1; fall = 0.4; }
      else if (m === 9) { leaf = 0.85; fall = 1; }
    }
    if (m === 2 && !evergreen && sp.bloom && sp.bloom.months.indexOf(2) >= 0) leaf = 0;
    return { leaf, fall, spring, bloom };
  }
  function tint(T, sp, S, R, shadeF) {
    const c = new T.Color(sp.summer || '#4B8A3A');
    if (S.spring > 0) c.lerp(new T.Color('#B7D77A'), 0.5 * S.spring);
    if (S.fall > 0 && sp.fall && R() < S.fall) c.set(sp.fall);
    c.offsetHSL((R() - 0.5) * 0.035, (R() - 0.5) * 0.1, (R() - 0.5) * 0.09);
    c.multiplyScalar(shadeF * 1.45);
    return c;
  }

  // ---------------------------------------------------------------- woody plants (trees + shrubs)
  function envR(sp, t) {
    const pk = clamp(sp.peak, 0.02, 0.98); const tt = t < pk ? 0.5 * t / pk : 0.5 + 0.5 * (t - pk) / (1 - pk);
    const e = Math.pow(Math.max(0, Math.sin(Math.PI * tt)), sp.exp);
    const edge = t < pk ? sp.baseR * (1 - t / pk) : (sp.topR || 0) * ((t - pk) / (1 - pk));
    return clamp(e + (1 - e) * edge, 0.02, 1);
  }
  function woody(T, plant, sp, H, W, month, seed) {
    W = W * (sp.wf || 1);
    const R = rng(seed + hashStr(plant.key) * 7.7); const g = new T.Group();
    const S = seasonFor(sp, month, plant);
    const form = sp.form;
    const crownBase = H * sp.crown0, crownH = Math.max(0.5, H - crownBase);
    const segs = [], tips = [], bpts = [];
    const stems = Math.max(1, sp.stems || 1);
    const trunkR = clamp((W * 0.011 + H * 0.011) / Math.sqrt(stems), 0.035, 1.05) * (form === 'conifer' ? 0.8 : 1);
    const stemList = [];
    for (let s = 0; s < stems; s++) {
      const az = stems === 1 ? R() * 6.28 : (s / stems) * 6.283 + R() * 0.6;
      const tilt = stems === 1 ? 0.02 : (sp.form === 'shrub' || form === 'tree' ? 0.12 + R() * 0.2 : 0.1);
      const Hs = H * (stems === 1 ? 0.94 : 0.72 + R() * 0.25), ph = R() * 6;
      const pt = (f) => { const y = f * Hs; const off = Math.tan(tilt) * y * (stems === 1 ? 0.3 : 1); return [Math.cos(az) * off + Math.sin(f * 3 + ph) * 0.012 * Hs, y, Math.sin(az) * off + Math.cos(f * 2.6 + ph) * 0.012 * Hs]; };
      stemList.push({ pt, Hs, az });
      const n = form === 'conifer' || form === 'pine' || form === 'column' || stems === 1 ? 7 : 4;
      for (let i = 0; i < n; i++) {
        const f0 = i / n, f1 = (i + 1) / n; const r0 = trunkR * (i === 0 ? 1.35 : 1) * (1 - f0 * 0.8), r1 = trunkR * (1 - f1 * 0.8);
        segs.push({ a: pt(f0), b: pt(f1), r0: Math.max(0.02, r0), r1: Math.max(0.012, r1), v0: f0 * Hs * 0.3 });
      }
    }
    const barkKind = sp.bark || 'brown';
    // ---- branches
    const nB = form === 'mat' || form === 'dome' || form === 'column' ? 0 : Math.round(sp.br * clamp(Math.sqrt(W * H) / 14, 0.55, 2.2) * (form === 'conifer' ? 1.5 : 1));
    const sprayCards = [];
    for (let i = 0; i < nB; i++) {
      const t = (i + R() * 0.7) / nB; const st = stemList[i % stemList.length];
      const y = crownBase + t * crownH * 0.96; const f = clamp(y / st.Hs, 0, 1); const S0 = st.pt(f);
      const phi = i * 2.39996 + R() * 0.5; const reach = Math.max(0.3, envR(sp, t) * W * 0.5 * (0.88 + R() * 0.2));
      const ex = Math.cos(phi) * reach, ez = Math.sin(phi) * reach; let ey = y + (sp.lift - (sp.droop || 0)) * reach * (form === 'conifer' ? 0.6 : 1);
      ey = Math.min(ey, H * 1.01);
      const E = [ex, ey, ez]; const mid = [lerp(S0[0], E[0], 0.5), lerp(S0[1], E[1], 0.5) + (sp.lift > 0 ? reach * 0.18 : 0) - (sp.droop ? reach * sp.droop * 0.15 : 0), lerp(S0[2], E[2], 0.5)];
      const br0 = Math.max(0.03, trunkR * (0.42 - t * 0.2)); const N = 4; let prev = S0; const pts = [S0];
      for (let k = 1; k <= N; k++) { const u = k / N; const q = [lerp(lerp(S0[0], mid[0], u), lerp(mid[0], E[0], u), u), lerp(lerp(S0[1], mid[1], u), lerp(mid[1], E[1], u), u), lerp(lerp(S0[2], mid[2], u), lerp(mid[2], E[2], u), u)];
        segs.push({ a: prev, b: q, r0: br0 * (1 - (k - 1) / N * 0.85), r1: br0 * (1 - k / N * 0.85) + 0.008, v0: k * 0.8 }); prev = q; pts.push(q); bpts.push(q); }
      tips.push(E);
      // twigs
      const tw = sp.tw || 2; const dir = [E[0] - S0[0], E[1] - S0[1], E[2] - S0[2]]; const dl = Math.hypot(...dir) || 1;
      for (let k = 2; k <= N; k++) for (let w = 0; w < tw; w++) {
        const base = pts[k]; const a2 = R() * 6.283, el = (R() - 0.2) * 1.0; const L = dl * (0.22 + R() * 0.16) * (1 - (k - 2) * 0.12);
        const d = [dir[0] / dl * 0.55 + Math.cos(a2) * 0.7, dir[1] / dl * 0.3 + 0.5 + el * 0.4, dir[2] / dl * 0.55 + Math.sin(a2) * 0.7]; const dd = Math.hypot(...d) || 1;
        const m1 = [base[0] + d[0] / dd * L * 0.55, base[1] + d[1] / dd * L * 0.55, base[2] + d[2] / dd * L * 0.55]; const m2 = [base[0] + d[0] / dd * L, base[1] + d[1] / dd * L, base[2] + d[2] / dd * L];
        const tr = Math.max(0.012, br0 * 0.3);
        segs.push({ a: base, b: m1, r0: tr, r1: tr * 0.7 }); segs.push({ a: m1, b: m2, r0: tr * 0.7, r1: 0.008 });
        // little end twigs (winter detail)
        if (!S.leaf || R() < 0.6) for (let e = 0; e < 2; e++) { const a3 = R() * 6.283; segs.push({ a: m2, b: [m2[0] + Math.cos(a3) * L * 0.3, m2[1] + L * 0.18 + R() * L * 0.1, m2[2] + Math.sin(a3) * L * 0.3], r0: 0.009, r1: 0.005 }); }
        tips.push(m2);
        if (form === 'conifer') { /* sprays handled below */ }
      }
      if (form === 'conifer') {
        // drooping flat sprays along the whole branch, big near the trunk, smaller toward the tip
        const sz = clamp(reach * 0.75, 1.0, 4.6) * (sp.size || 1);
        for (let k = 1; k <= N; k++) {
          const p1 = pts[k], p0 = pts[k - 1]; const ang = Math.atan2(p1[2] - S0[2], p1[0] - S0[0]); const fk = 1.15 - 0.75 * (k / N);
          [[0.5, 0.0], [1, 0.0]].forEach((q, qi) => {
            const px = lerp(p0[0], p1[0], q[0]), py = lerp(p0[1], p1[1], q[0]), pz = lerp(p0[2], p1[2], q[0]); const L = sz * fk * 1.25;
            sprayCards.push({ x: px + Math.cos(ang) * L * 0.38, y: py - 0.1 - qi * 0.1, z: pz + Math.sin(ang) * L * 0.38, s: sz * fk * 0.95, sz: L, yaw: Math.PI / 2 - ang + (R() - 0.5) * 0.25, tilt: 0.22 + (sp.droop || 0) * 0.8 + (R() - 0.5) * 0.12, shade: 0.6 + t * 0.35 + 0.15 * (k / N) });
            sprayCards.push({ x: px + Math.cos(ang) * L * 0.38, y: py + 0.2, z: pz + Math.sin(ang) * L * 0.38, s: sz * fk * 0.8, sz: L * 0.9, yaw: Math.PI / 2 - ang + (R() - 0.5) * 0.7, tilt: 0.05, shade: 0.85 + t * 0.3 });
          });
        }
      }
    }
    // ---- foliage cards
    const leafSize = clamp(W * 0.125, 0.5, 5) * (sp.size || 1); const surf = W * (W * 0.5 + crownH);
    const want = clamp(Math.round(sp.dens * 3.2 * surf / (leafSize * leafSize)), 40, 640);
    const leafCards = [], flowerCards = [];
    const mk = (x, y, z, shadeF, sc) => ({ x, y, z, s: leafSize * sc, yaw: R() * 6.283, tilt: (R() - 0.5) * 0.8, roll: (R() - 0.5) * 0.8, shadeF });
    const tipsShare = form === 'tree' ? 0.45 : 0.25;
    const shell = () => { const t = Math.pow(R(), 0.85), r = envR(sp, t) * W * 0.5 * (0.78 + R() * 0.26), a = R() * 6.283; return { x: Math.cos(a) * r, y: crownBase + t * crownH, z: Math.sin(a) * r, t, rr: r / (W * 0.5) }; };
    if (form === 'mat') {
      const n = clamp(Math.round(W * W * 3.2), 30, 200);
      for (let i = 0; i < n; i++) { const a = R() * 6.283, d = Math.sqrt(R()) * W * 0.5; const x = Math.cos(a) * d, z = Math.sin(a) * d; leafCards.push({ x, y: R() * H * 0.9 + 0.05, z, s: Math.max(0.5, W * 0.17), sy: Math.max(0.5, W * 0.2), yaw: R() * 6.283, tilt: (R() - 0.5) * 0.3, shadeF: 0.7 + R() * 0.4, flat: true }); }
    } else if (form === 'conifer') {
      sprayCards.forEach((c) => leafCards.push(Object.assign(c, { flat: true, shadeF: c.shade })));
      // top leader spray
      for (let i = 0; i < 4; i++) leafCards.push({ x: (R() - 0.5) * 0.4, y: H * (0.9 + i * 0.025), z: (R() - 0.5) * 0.4, s: leafSize * 1.0 * (1 - i * 0.2), sy: leafSize * 1.4, yaw: R() * 6.283, tilt: -0.4, shadeF: 1.0, flat: true });
    } else if (form === 'pine') {
      const ts = tips.slice(); ts.forEach((p) => { const n = 2 + (R() * 3 | 0); for (let k = 0; k < n; k++) leafCards.push(Object.assign(mk(p[0] + (R() - 0.5) * leafSize * 0.8, p[1] + (R() - 0.3) * leafSize * 0.5, p[2] + (R() - 0.5) * leafSize * 0.8, 0.75 + R() * 0.4, 1.5), { cross: true })); });
      for (let i = 0; i < Math.round(want * 0.14); i++) { const sh = shell(); leafCards.push(Object.assign(mk(sh.x, sh.y, sh.z, 0.65 + sh.t * 0.4, 1.5), { cross: true })); }
    } else {
      const nTip = Math.round(want * tipsShare);
      for (let i = 0; i < nTip && tips.length; i++) { const p = tips[(R() * tips.length) | 0]; leafCards.push(mk(p[0] + (R() - 0.5) * leafSize * 0.6, Math.min(H * 0.97, p[1] + (R() - 0.3) * leafSize * 0.4), p[2] + (R() - 0.5) * leafSize * 0.6, 0.85 + R() * 0.3, 0.95)); }
      for (let i = leafCards.length; i < want; i++) { const sh = shell(); const edge = clamp(sh.rr, 0, 1); leafCards.push(mk(sh.x, sh.y, sh.z, 0.55 + 0.3 * sh.t + 0.25 * edge, 0.85 + R() * 0.3)); }
    }
    // ---- assemble foliage (seasonal)
    const tx = tex(T, sp.leaf);
    const kindCards = { cross: [], flat: [] };
    if (S.leaf > 0) {
      leafCards.forEach((c) => {
        if (R() > S.leaf) return; const col = tint(T, sp, S, R, c.shadeF == null ? 1 : c.shadeF);
        if (S.bloom && sp.leafDelay && form === 'tree' && R() < 0.4) return;
        const card = Object.assign({}, c, { col });
        if (sp.leaf === 'tuft') { card.s *= 1.0; }
        (c.flat ? kindCards.flat : kindCards.cross).push(card);
      });
    }
    const m1 = cardMesh(T, tx, 'cross', kindCards.cross, { alphaTest: 0.4 }); if (m1) g.add(m1);
    const m2 = cardMesh(T, tx, 'flat', kindCards.flat, { alphaTest: 0.4 }); if (m2) g.add(m2);
    // ---- flowers
    if (S.bloom) {
      const b = S.bloom; const bt = tex(T, b.kind === 'panicle' ? 'panicle' : b.kind === 'puff' ? 'puff' : 'blossom');
      const src = [];
      tips.forEach((p) => src.push(p)); bpts.forEach((p) => { if (R() < 0.5) src.push(p); });
      for (let i = 0; i < Math.round(want * 0.2); i++) { const sh = shell(); src.push([sh.x, sh.y, sh.z]); }
      const bs = leafSize * (b.kind === 'panicle' ? 0.8 : b.kind === 'puff' ? 1.5 : 0.9) * (form === 'shrub' ? 0.9 : 1);
      src.forEach((p) => { if (R() > b.amount) return; const c = new T.Color(b.hex); c.offsetHSL((R() - 0.5) * 0.02, (R() - 0.5) * 0.08, (R() - 0.5) * 0.07);
        flowerCards.push({ x: p[0] + (R() - 0.5) * bs * 0.5, y: p[1] + (R() - 0.3) * bs * 0.3, z: p[2] + (R() - 0.5) * bs * 0.5, s: bs * (0.75 + R() * 0.5), yaw: R() * 6.283, tilt: (R() - 0.5) * 0.6, col: c }); });
      const mf = cardMesh(T, bt, 'cross', flowerCards, { alphaTest: b.kind === 'puff' ? 0.2 : 0.4 }); if (mf) g.add(mf);
    }
    // ---- bark (drawn last so group order is stable)
    const winterRed = sp.bark === 'red';
    const bm = branchMesh(T, segs, barkKind, winterRed ? 0xffffff : 0xffffff); if (bm) g.add(bm);
    return { group: g, trunkH: crownBase };
  }

  // ---------------------------------------------------------------- grasses
  function grass(T, plant, gs, H, W, month, seed) {
    const R = rng(seed + hashStr(plant.key) * 5.1); const g = new T.Group();
    const winter = month >= 11 || month <= 1, cut = month === 2, newG = month === 3;
    const hh = cut ? H * 0.12 : newG ? H * 0.55 : month === 4 ? H * 0.85 : H;
    const leaf = new T.Color(winter || cut ? gs.tan : month >= 9 && month <= 10 ? gs.tan : gs.leaf); if (month === 9) leaf.lerp(new T.Color(gs.leaf), 0.4);
    const blades = []; const n = gs.grass === 'upright' ? 70 : 90;
    for (let i = 0; i < n; i++) {
      const a = R() * 6.283, d = Math.sqrt(R()) * W * (gs.grass === 'upright' ? 0.1 : 0.12); const len = hh * (0.7 + R() * 0.3) * (gs.grass === 'upright' ? 1 : 0.95);
      const col = leaf.clone().offsetHSL((R() - 0.5) * 0.03, (R() - 0.5) * 0.1, (R() - 0.5) * 0.08);
      let lean, bend;
      if (gs.grass === 'upright') { lean = 0.05 + R() * 0.18; bend = 0.25 + R() * 0.3; }
      else if (gs.grass === 'dome') { lean = 0.22 + R() * 0.5; bend = 0.9 + R() * 0.6; }
      else { lean = 0.3 + R() * 0.45; bend = 1.2 + R() * 0.8; }
      blades.push({ x: Math.cos(a) * d, z: Math.sin(a) * d, az: a, len: len * (gs.grass === 'upright' ? 0.75 : 0.9), w: Math.max(0.06, W * 0.04), lean, bend, col, seg: 5 });
    }
    const bm = bladeMesh(T, blades); if (bm) g.add(bm);
    const pl = gs.plume; const inBloom = pl && pl.months.indexOf(month) >= 0 && !cut && !newG && month !== 4;
    if (inBloom) {
      const stalks = [], heads = []; const tallY = H * pl.tall * (pl.kind === 'oat' ? 1 : 1.0);
      for (let i = 0; i < pl.n; i++) {
        const a = R() * 6.283, d = Math.sqrt(R()) * W * 0.1; const sx = Math.cos(a) * d, sz = Math.sin(a) * d; const lean = pl.kind === 'feather' ? 0.04 + R() * 0.08 : 0.25 + R() * 0.3; const az = a;
        const sc = new T.Color(gs.tan).multiplyScalar(0.9);
        stalks.push({ x: sx, z: sz, az, len: tallY * (0.82 + R() * 0.15), w: 0.045, lean, bend: pl.kind === 'feather' ? 0.1 : 0.9, col: sc, seg: 5, c0: 0.8, c1: 1 });
        // head position = end of stalk approx
        const L = tallY * 0.9; const ex = sx + Math.cos(az) * Math.sin(lean + (pl.kind === 'feather' ? 0.05 : 0.45)) * L * (pl.kind === 'feather' ? 0.6 : 0.8); const ez = sz + Math.sin(az) * Math.sin(lean + (pl.kind === 'feather' ? 0.05 : 0.45)) * L * (pl.kind === 'feather' ? 0.6 : 0.8);
        const ey = pl.kind === 'feather' ? tallY * 0.78 : tallY * (pl.kind === 'oat' ? 0.9 : 0.82);
        heads.push({ x: ex, y: ey, z: ez, s: Math.max(0.5, tallY * (pl.kind === 'feather' ? 0.42 : 0.38)), yaw: R() * 6.283, tilt: (R() - 0.5) * 0.4, col: new T.Color(1, 1, 1).multiplyScalar(0.85 + R() * 0.2) });
      }
      const sm = bladeMesh(T, stalks); if (sm) g.add(sm);
      const hm = cardMesh(T, flowerTex(T, pl.kind, pl.hex), 'vert', heads, { alphaTest: 0.35 }); if (hm) g.add(hm);
    }
    return { group: g, trunkH: 0 };
  }

  // ---------------------------------------------------------------- perennials
  function perennial(T, plant, ps, H, W, month, seed) {
    const R = rng(seed + hashStr(plant.key) * 3.3); const g = new T.Group();
    const dormant = !ps.evergreen && (month >= 11 || month <= 2); const dying = !ps.evergreen && month === 10; const early = month === 3 ? 0.5 : month === 4 ? 0.8 : 1;
    const fscale = dormant ? 0.14 : dying ? 0.7 : early;
    const leaf = new T.Color(dormant || dying ? '#8A7452' : ps.leaf).multiplyScalar(1.45);
    const fh = H * (ps.fol === 'rosette' ? 0.5 : ps.fol === 'blade' ? 0.65 : 0.55) * fscale, fw = W * (dormant ? 0.4 : 1);
    const cards = [], flats = [];
    if (ps.fol === 'rosette') {
      const n = 11; for (let i = 0; i < n; i++) { const a = i * 2.39996 + R(); const r = fw * 0.22 * (0.3 + 0.7 * (i / n)); const col = leaf.clone().offsetHSL((R() - 0.5) * 0.03, 0, (R() - 0.5) * 0.08);
        const ls = fw * 0.42; flats.push({ x: Math.cos(a) * (r + ls * 0.36), y: fh * (0.25 + 0.5 * (i / n)), z: Math.sin(a) * (r + ls * 0.36), s: ls, sz: ls * 1.1, yaw: -a - Math.PI / 2, tilt: 0.3 + R() * 0.25, col, hosta: true }); }
    } else if (ps.fol === 'blade') {
      const blades = []; for (let i = 0; i < 34; i++) { const a = R() * 6.283, d = Math.sqrt(R()) * fw * 0.1; blades.push({ x: Math.cos(a) * d, z: Math.sin(a) * d, az: a, len: fh * (0.9 + R() * 0.5), w: Math.max(0.07, fw * 0.06), lean: 0.25 + R() * 0.3, bend: 1.1 + R() * 0.6, col: leaf.clone().offsetHSL(0, 0, (R() - 0.5) * 0.08), seg: 5 }); }
      const bm = bladeMesh(T, blades); if (bm) g.add(bm);
    } else {
      const n = ps.fol === 'airy' ? 34 : 24; const sz = Math.max(0.28, fw * (ps.fol === 'airy' ? 0.26 : 0.34));
      for (let i = 0; i < n; i++) { const a = R() * 6.283, d = Math.sqrt(R()) * fw * 0.42; const y = fh * (0.12 + 0.8 * Math.pow(R(), 0.7)) * (1 - d / fw * 0.7);
        cards.push({ x: Math.cos(a) * d, y, z: Math.sin(a) * d, s: sz, yaw: R() * 6.283, tilt: (R() - 0.5) * 0.9, roll: (R() - 0.5) * 0.9, col: leaf.clone().offsetHSL((R() - 0.5) * 0.03, 0, (R() - 0.5) * 0.1).multiplyScalar(0.7 + 0.4 * (y / fh)) }); }
    }
    const lt = tex(T, ps.fol === 'airy' ? 'small' : 'broad');
    const mc = cardMesh(T, lt, 'cross', cards, { alphaTest: 0.4 }); if (mc) g.add(mc);
    const mh = cardMesh(T, tex(T, 'hostaLeaf'), 'flat', flats, { alphaTest: 0.4 }); if (mh) g.add(mh);
    // flowers
    const fl = ps.fl; let fcol = null, form = null;
    if (fl && !dormant && !dying && fl.months.indexOf(month) >= 0) { fcol = fl.hex; form = fl.form; }
    else if (ps.pre && !dormant && ps.pre.months.indexOf(month) >= 0) { fcol = ps.pre.hex; form = fl.form; }
    if (fcol) {
      const stalks = [], heads = []; const tall = H * fl.tall;
      for (let i = 0; i < fl.n; i++) {
        const a = R() * 6.283, d = Math.sqrt(R()) * W * 0.3; const x = Math.cos(a) * d, z = Math.sin(a) * d; const th = tall * (0.78 + R() * 0.25); const lean = 0.05 + R() * 0.16; const ax = a;
        const hx = x + Math.cos(ax) * Math.sin(lean) * th, hz = z + Math.sin(ax) * Math.sin(lean) * th, hy = Math.cos(lean) * th;
        if (form !== 'spike' && form !== 'airy') stalks.push({ x, z, az: ax, len: th, w: 0.035, lean, bend: 0, col: new T.Color('#5E8F48'), seg: 2, c0: 0.8, c1: 1 });
        const sz = form === 'spike' || form === 'airy' ? Math.max(0.4, th * (form === 'airy' ? 0.7 : 0.45)) : form === 'umbel' || form === 'ball' ? Math.max(0.35, W * 0.3) : Math.max(0.3, W * 0.3);
        const yoff = form === 'spike' ? hy - sz * 0.35 : form === 'airy' ? hy - sz * 0.38 : hy;
        const kindFlat = form === 'umbel' || form === 'daisy' || form === 'cone' || form === 'star';
        heads.push({ x: hx, y: yoff, z: hz, s: sz, yaw: R() * 6.283, tilt: kindFlat ? -0.9 + (R() - 0.5) * 0.4 : (R() - 0.5) * 0.3, roll: 0, col: new T.Color(1, 1, 1).multiplyScalar(0.85 + R() * 0.2), kindFlat });
      }
      const sm = bladeMesh(T, stalks); if (sm) g.add(sm);
      const flatHeads = heads.filter((h) => h.kindFlat), vertHeads = heads.filter((h) => !h.kindFlat); const t2 = flowerTex(T, form, fcol, fl.center);
      const f1 = cardMesh(T, t2, 'flat', flatHeads.map((h) => Object.assign({}, h, { tilt: h.tilt })), { alphaTest: 0.35 }); if (f1) g.add(f1);
      const f2 = cardMesh(T, t2, 'vert', vertHeads, { alphaTest: 0.35 }); if (f2) g.add(f2);
    }
    return { group: g, trunkH: 0 };
  }

  // ---------------------------------------------------------------- groundcover
  function groundcover(T, plant, gc, H, W, month, seed) {
    const R = rng(seed + hashStr(plant.key) * 9.1); const g = new T.Group();
    const dormant = !gc.evergreen && (month >= 11 || month <= 2); const col0 = new T.Color(dormant ? '#8A7552' : gc.leaf).multiplyScalar(1.5);
    const n = clamp(Math.round(W * W * 5), 24, 170); const cards = [], bl = [], ber = [];
    const bloomOn = gc.bloom && gc.bloom.months.indexOf(month) >= 0 && !dormant; const berryOn = gc.berry && gc.berry.months.indexOf(month) >= 0 && !dormant;
    const sz = Math.max(0.35, W * 0.22);
    for (let i = 0; i < n; i++) {
      const a = R() * 6.283, d = Math.sqrt(R()) * W * 0.5; const x = Math.cos(a) * d, z = Math.sin(a) * d; const y = Math.max(0.03, R() * Math.max(0.1, H) * (dormant ? 0.3 : 0.9));
      cards.push({ x, y, z, s: sz, yaw: R() * 6.283, tilt: (R() - 0.5) * 0.35, col: col0.clone().offsetHSL((R() - 0.5) * 0.03, 0, (R() - 0.5) * 0.1).multiplyScalar(0.7 + 0.4 * R()) });
      if (bloomOn && R() < 0.5) bl.push({ x: x + (R() - 0.5) * 0.15, y: y + 0.05, z, s: sz * 0.55, yaw: R() * 6.283, tilt: -1.2 + (R() - 0.5) * 0.4, col: new T.Color(gc.bloom.hex).offsetHSL(0, 0, (R() - 0.5) * 0.08) });
      if (berryOn && R() < 0.3) ber.push({ x, y: y + 0.04, z, s: sz * 0.22, yaw: 0, tilt: 0, col: new T.Color(gc.berry.hex) });
    }
    const m1 = cardMesh(T, tex(T, 'broad'), 'flat', cards, { alphaTest: 0.4 }); if (m1) g.add(m1);
    const m2 = cardMesh(T, tex(T, 'blossom'), 'flat', bl, { alphaTest: 0.4 }); if (m2) g.add(m2);
    const m3 = cardMesh(T, tex(T, 'puff'), 'flat', ber, { alphaTest: 0.3 }); if (m3) g.add(m3);
    return { group: g, trunkH: 0 };
  }

  // ---------------------------------------------------------------- public
  // build(THREE, plant, { h, w, month, seed }) -> { group, trunkH, top }
  function build(T, plant, o) {
    const H = Math.max(0.3, o.h), W = Math.max(0.4, o.w), month = o.month == null ? 5 : o.month, seed = o.seed || 1;
    const cat = plant.category; NIGHT = !!o.night;
    if (cat === 'Tree' || cat === 'Shrub') { const sp = specOf(plant); const r = woody(T, plant, sp, H, W, month, seed); r.top = H; return r; }
    if (cat === 'Ornamental Grass' && PER[plant.key] && PER[plant.key].grass) { const r = grass(T, plant, PER[plant.key], H, W, month, seed); r.top = H; return r; }
    if (cat === 'Perennial') { const ps = PER[plant.key] || { fol: 'mound', leaf: plant.color || '#4F8A3C', fl: { form: 'ball', hex: plant.color || '#E8A0C8', months: [5, 6, 7], tall: 0.9, n: 6 } }; const r = perennial(T, plant, ps, H, W, month, seed); r.top = H; return r; }
    const gc = GC[plant.key] || { leaf: plant.color || '#5A9444' }; const r = groundcover(T, plant, gc, Math.max(H, 0.2), W, month, seed); r.top = Math.max(0.3, H); return r;
  }
  DPRO.plants3d = { build, specOf, SP, PER, GC };
})();
