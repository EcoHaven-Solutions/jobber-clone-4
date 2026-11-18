// ============================================================================
// design-photo.js — Photo mockup for the Site Design editor.
//
// Upload a photo of the customer's yard or house, then drop on it:
//   * plants (stylized illustrations sized to real mature height, with a
//     At install / Year 3 / Year 5 / Mature growth switch),
//   * ground surfaces (mulch, rock, gravel, pavers, flagstone, turf, concrete),
//   * roofline / permanent / Christmas light runs and landscape fixtures,
//   * a Night switch that darkens the photo and makes the lights glow,
//   * and a before/after slider.
// Nothing here is AI-generated: it is your photo plus items you place.
// Saved mockups are stored with the design and can be reopened and edited.
// ============================================================================
(function () {
  'use strict';
  const DPRO = window.DPRO;
  if (!DPRO) return;
  const $ = (id) => document.getElementById(id);
  const esc = DPRO.esc;
  const CATP = window.DESIGN_CATALOG;
  const SURFACES = [
    { key: 'bark', name: 'Bark mulch', tex: 'bark' }, { key: 'rock', name: 'Decorative rock', tex: 'rock' }, { key: 'gravel', name: 'Gravel', tex: 'gravel' },
    { key: 'pavers', name: 'Pavers', tex: 'pavers' }, { key: 'conc', name: 'Concrete', tex: 'conc' }, { key: 'lawn', name: 'Lawn', tex: 'lawn' },
    { key: 'turf', name: 'Artificial turf', tex: 'turf' }, { key: 'deck', name: 'Deck', tex: 'deck' }, { key: 'soil', name: 'Soil', tex: 'soil' },
  ];
  const GROWTH_LABELS = CATP.GROWTH_LABELS;

  // ======================= UI shell =======================
  const css = document.createElement('style');
  css.textContent = `
  #dpro-ph{position:fixed;inset:0;z-index:5000;background:#0f1318;color:#EDEDED;display:flex;flex-direction:column;font-family:inherit}
  #dpro-ph[hidden]{display:none}
  .ph-top{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:8px 10px;background:#161b22;border-bottom:1px solid #2a313b}
  .ph-top h3{margin:0 8px 0 0;font-size:15px}
  .ph-btn{background:#232a34;color:#EDEDED;border:1px solid #37404d;border-radius:8px;padding:7px 11px;font-size:13px;cursor:pointer;touch-action:manipulation}
  .ph-btn.on{background:#2F7F9E;border-color:#5BB6D6;color:#fff} .ph-btn.pri{background:#3E8E41;border-color:#5FBF3E}
  .ph-btn[disabled]{opacity:.45;cursor:default}
  .ph-sp{flex:1}
  .ph-body{flex:1;min-height:0;display:flex}
  #ph-stagewrap{flex:1;min-width:0;position:relative;background:#0b0e12;overflow:hidden}
  #ph-stage{position:absolute;inset:0}
  #ph-hint{position:absolute;left:10px;bottom:10px;background:rgba(11,15,20,.82);padding:6px 10px;border-radius:8px;font-size:12px;max-width:80%;pointer-events:none}
  #ph-hint:empty{display:none}
  .ph-side{width:300px;flex:none;background:#161b22;border-left:1px solid #2a313b;display:flex;flex-direction:column;min-height:0}
  .ph-tabs{display:flex;border-bottom:1px solid #2a313b}
  .ph-tabs button{flex:1;background:none;border:0;color:#9fb0c3;padding:10px 4px;font-size:13px;cursor:pointer;border-bottom:2px solid transparent}
  .ph-tabs button.on{color:#fff;border-bottom-color:#5BB6D6}
  .ph-panel{padding:10px;overflow:auto;flex:1;font-size:13px}
  .ph-panel h4{margin:12px 0 6px;font-size:12px;color:#9fb0c3;text-transform:uppercase;letter-spacing:.04em} .ph-panel h4:first-child{margin-top:0}
  .ph-panel input[type=text],.ph-panel input[type=number],.ph-panel select{width:100%;background:#232a34;color:#EDEDED;border:1px solid #37404d;border-radius:6px;padding:6px;box-sizing:border-box}
  .ph-panel input[type=range]{width:100%;accent-color:#5BB6D6}
  .ph-item{display:flex;align-items:center;gap:8px;padding:7px 8px;border:1px solid #2f3742;border-radius:8px;margin-bottom:5px;cursor:pointer;background:#1b212a}
  .ph-item.on{border-color:#5BB6D6;background:#23394a} .ph-sw{width:14px;height:14px;border-radius:50%;flex:none}
  .ph-item small{display:block;color:#9fb0c3}
  .ph-row{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0}
  .ph-gal[hidden]{display:none}
  .ph-gal{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;padding:14px;overflow:auto;flex:1}
  .ph-card{background:#1b212a;border:1px solid #2f3742;border-radius:10px;overflow:hidden}
  .ph-card img{display:block;width:100%;height:110px;object-fit:cover;background:#000}
  .ph-card div{padding:8px;font-size:12px}
  #ph-compare{position:absolute;top:0;bottom:0;width:36px;margin-left:-18px;cursor:ew-resize;display:none;touch-action:none}
  #ph-compare::before{content:'';position:absolute;left:17px;top:0;bottom:0;width:2px;background:#fff;box-shadow:0 0 6px rgba(0,0,0,.6)}
  #ph-compare::after{content:'\\2194';position:absolute;left:4px;top:50%;margin-top:-14px;width:28px;height:28px;line-height:28px;text-align:center;background:#fff;color:#222;border-radius:50%;font-weight:700}
  @media (max-width:800px){.ph-body{flex-direction:column}.ph-side{width:auto;height:42%;border-left:0;border-top:1px solid #2a313b}}
  `;
  document.head.appendChild(css);
  const modal = document.createElement('div');
  modal.id = 'dpro-ph'; modal.hidden = true;
  modal.innerHTML = `
   <div class="ph-top"><h3>Photo mockup</h3>
     <button class="ph-btn" id="ph-newbtn" type="button">New photo</button>
     <button class="ph-btn" id="ph-undo" type="button">Undo</button>
     <button class="ph-btn" id="ph-night" type="button">Night</button>
     <button class="ph-btn" id="ph-compare-btn" type="button">Before / after</button>
     <span class="ph-sp"></span>
     <button class="ph-btn pri" id="ph-save" type="button">Save mockup</button>
     <button class="ph-btn" id="ph-close" type="button">Close</button></div>
   <div id="ph-gallery" class="ph-gal"></div>
   <div class="ph-body" id="ph-body" hidden>
     <div id="ph-stagewrap"><div id="ph-stage"></div><div id="ph-compare"></div><div id="ph-hint"></div></div>
     <div class="ph-side">
       <div class="ph-tabs"><button data-ptab="plants" class="on" type="button">Plants</button><button data-ptab="ground" type="button">Ground</button><button data-ptab="lights" type="button">Lights</button><button data-ptab="set" type="button">Settings</button></div>
       <div class="ph-panel" id="ph-panel"></div>
     </div>
   </div>
   <input type="file" id="ph-file" accept="image/*" hidden />`;
  document.body.appendChild(modal);

  // ======================= State =======================
  let M = null;                 // current mockup {id,name,photoUrl,afterUrl,items,pxPerFt,growth,night,fs,patSize}
  let photoImg = null;          // HTMLImageElement of the original photo
  let stage, layerPhoto, layerItems, layerNight, layerLights, layerUI, layerBefore, tr, nightRect, fit = 1, PW = 0, PH = 0;
  let tool = 'select', armed = { plant: null, surface: 'bark', lights: 'xmas-c9', fixture: 'path-light', color: null };
  let drawing = [], selId = null, tab = 'plants', scaleClicks = [], undoStack = [], compareOn = false, plantFilter = '';
  const nodeById = new Map();
  const uid2 = () => 'm' + Math.random().toString(36).slice(2, 9);
  const getMockups = () => (DPRO.extras.mockups = Array.isArray(DPRO.extras.mockups) ? DPRO.extras.mockups : []);

  // ======================= Plant illustrations =======================
  function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function hexToRgb(h) { h = String(h || '#4F8A3C').replace('#', ''); if (h.length === 3) h = h.split('').map((c) => c + c).join(''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  const rgbStr = (c, a) => `rgba(${Math.round(clamp(c[0], 0, 255))},${Math.round(clamp(c[1], 0, 255))},${Math.round(clamp(c[2], 0, 255))},${a == null ? 1 : a})`;
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const shade = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
  const greenish = (c) => c[1] >= c[0] * 0.95 && c[1] >= c[2];
  function foliageAndFlower(plant) {
    const base = hexToRgb(plant.color); const leaf = hexToRgb(plant.category === 'Tree' ? '#4D8738' : '#5A9444');
    if (plant.evergreen) return { leaf: base, flower: null };
    if (greenish(base)) return { leaf: mix(leaf, base, 0.55), flower: null };
    if (plant.category === 'Tree') return { leaf: mix(leaf, base, 0.18), flower: null };          // fall-colored trees shown in summer green
    return { leaf, flower: base };                                                                 // non-green color = bloom color
  }
  function blobCircle(g, x, y, r, col) {
    const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
    gr.addColorStop(0, rgbStr(shade(col, 1.28))); gr.addColorStop(0.55, rgbStr(col)); gr.addColorStop(1, rgbStr(shade(col, 0.66)));
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
  const plantCache = new Map();
  function plantCanvas(plant, w, h, seed) {
    w = Math.max(8, Math.round(w)); h = Math.max(8, Math.round(h));
    const key = plant.key + '|' + w + '|' + h + '|' + seed; if (plantCache.has(key)) return plantCache.get(key);
    if (plantCache.size > 120) plantCache.clear();
    const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); const R = rng(seed + plant.key.length * 977);
    const { leaf, flower } = foliageAndFlower(plant); const bark = [92, 70, 52];
    // ground shadow
    g.save(); g.translate(w / 2, h - 2); g.scale(1, 0.14); const sh = g.createRadialGradient(0, 0, 0, 0, 0, w * 0.5); sh.addColorStop(0, 'rgba(0,0,0,0.42)'); sh.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = sh; g.beginPath(); g.arc(0, 0, w * 0.5, 0, Math.PI * 2); g.fill(); g.restore();
    const cat = plant.category;
    if (cat === 'Tree' && plant.evergreen) {
      const tw = w * 0.07, th = h * 0.1; g.fillStyle = rgbStr(bark); g.fillRect(w / 2 - tw / 2, h - th, tw, th);
      const tiers = 7;
      for (let i = tiers - 1; i >= 0; i--) {
        const f = i / (tiers - 1); const y1 = h - th - f * (h - th) * 0.93, ww = (w / 2) * (1 - f * 0.86) * (0.95 + R() * 0.1), hh = (h - th) / tiers * 1.9;
        const col = mix(shade(leaf, 0.78), shade(leaf, 1.15), (tiers - i) / tiers * 0.7 + R() * 0.15);
        g.fillStyle = rgbStr(col); g.beginPath(); g.moveTo(w / 2, y1 - hh);
        const n = 7; for (let k = 0; k <= n; k++) { const t = k / n; g.lineTo(w / 2 + ww * t + (R() - 0.5) * 3, y1 - hh + hh * t + (k % 2 ? 2 : 0)); }
        g.lineTo(w / 2 + ww * 0.55, y1 + 1); g.lineTo(w / 2 - ww * 0.55, y1 + 1);
        for (let k = n; k >= 0; k--) { const t = k / n; g.lineTo(w / 2 - ww * t - (R() - 0.5) * 3, y1 - hh + hh * t + (k % 2 ? 2 : 0)); }
        g.closePath(); g.fill();
        g.strokeStyle = rgbStr(shade(leaf, 0.55), 0.5); g.lineWidth = 1; g.stroke();
      }
    } else if (cat === 'Tree') {
      const trunkH = h * 0.42, tw = Math.max(4, w * 0.075);
      g.fillStyle = rgbStr(bark); g.beginPath(); g.moveTo(w / 2 - tw * 0.8, h - 2); g.quadraticCurveTo(w / 2 - tw * 0.4, h - trunkH * 0.6, w / 2 - tw * 0.3, h - trunkH); g.lineTo(w / 2 + tw * 0.3, h - trunkH); g.quadraticCurveTo(w / 2 + tw * 0.4, h - trunkH * 0.6, w / 2 + tw * 0.8, h - 2); g.closePath(); g.fill();
      g.strokeStyle = rgbStr(shade(bark, 0.6), 0.6); g.lineWidth = 2; g.beginPath(); g.moveTo(w / 2, h - trunkH * 0.85); g.lineTo(w / 2 - w * 0.12, h - trunkH * 1.12); g.moveTo(w / 2, h - trunkH * 0.85); g.lineTo(w / 2 + w * 0.13, h - trunkH * 1.1); g.stroke();
      const cx = w / 2, cy = h * 0.40, rx = w * 0.5, ry = h * 0.38, n = 34; const blobs = [];
      for (let i = 0; i < n; i++) { const a = R() * Math.PI * 2, d = Math.sqrt(R()); blobs.push({ x: cx + Math.cos(a) * d * rx * 0.78, y: cy + Math.sin(a) * d * ry * 0.78, r: (0.1 + R() * 0.07) * Math.max(w, h * 0.7) }); }
      blobs.sort((p, q) => p.y - q.y);
      blobs.forEach((b) => blobCircle(g, b.x, b.y, b.r, mix(shade(leaf, 0.9), shade(leaf, 1.1), R())));
      for (let i = 0; i < 160; i++) { const b = blobs[Math.floor(R() * blobs.length)]; g.fillStyle = rgbStr(shade(leaf, R() > 0.5 ? 1.35 : 0.6), 0.5); g.beginPath(); g.arc(b.x + (R() - 0.5) * b.r * 1.4, b.y + (R() - 0.5) * b.r * 1.4, 1 + R() * 1.6, 0, 6.28); g.fill(); }
    } else if (cat === 'Shrub') {
      const n = 22; const blobs = [];
      for (let i = 0; i < n; i++) { const a = Math.PI * (0.05 + 0.9 * R()), d = Math.sqrt(R()); blobs.push({ x: w / 2 - Math.cos(a) * d * w * 0.38, y: h * 0.96 - Math.sin(a) * d * h * 0.78, r: (0.12 + R() * 0.09) * Math.max(w * 0.9, h) }); }
      blobs.sort((p, q) => p.y - q.y);
      blobs.forEach((b) => blobCircle(g, b.x, b.y, b.r, mix(shade(leaf, 0.88), shade(leaf, 1.12), R())));
      if (flower) for (let i = 0; i < 70; i++) { const b = blobs[Math.floor(R() * blobs.length)]; g.fillStyle = rgbStr(mix(flower, [255, 255, 255], R() * 0.35), 0.92); g.beginPath(); g.arc(b.x + (R() - 0.5) * b.r * 1.5, b.y + (R() - 0.7) * b.r * 1.2, 1.6 + R() * 2.6, 0, 6.28); g.fill(); }
    } else if (cat === 'Ornamental Grass') {
      const n = 46; const gold = plant.key.indexOf('karl') >= 0 || plant.key.indexOf('feather') >= 0;
      for (let i = 0; i < n; i++) {
        const t = (i / (n - 1)) * 2 - 1, x0 = w / 2 + t * w * 0.14, lean = t * w * 0.42 + (R() - 0.5) * w * 0.1, hh = h * (0.7 + R() * 0.3);
        g.strokeStyle = rgbStr(mix(leaf, gold ? [214, 185, 110] : [150, 190, 110], R() * 0.5)); g.lineWidth = Math.max(1, w * 0.018); g.lineCap = 'round';
        g.beginPath(); g.moveTo(x0, h - 2); g.quadraticCurveTo(x0 + lean * 0.35, h - hh * 0.9, x0 + lean, h - hh * (0.55 + R() * 0.3)); g.stroke();
      }
      if (gold) for (let i = 0; i < 7; i++) { const t = (i / 6) * 2 - 1; g.strokeStyle = 'rgba(205,176,108,0.95)'; g.lineWidth = Math.max(2, w * 0.03); g.beginPath(); g.moveTo(w / 2 + t * w * 0.1, h - 2); g.lineTo(w / 2 + t * w * 0.22, h * 0.06 + R() * h * 0.1); g.stroke(); }
    } else if (cat === 'Perennial') {
      const n = 26; for (let i = 0; i < n; i++) { const a = Math.PI * (0.1 + 0.8 * R()); const x = w / 2 - Math.cos(a) * w * 0.4 * R(), y = h - Math.sin(a) * h * 0.4 * R(); blobCircle(g, x, y - h * 0.08, (0.06 + R() * 0.05) * w, mix(shade(leaf, 0.9), shade(leaf, 1.12), R())); }
      const fc = flower || [232, 140, 190];
      for (let i = 0; i < 9; i++) { const x = w * (0.2 + 0.6 * R()), top = h * (0.06 + 0.4 * R()); g.strokeStyle = rgbStr(shade(leaf, 0.85)); g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, h * 0.75); g.quadraticCurveTo(x + (R() - 0.5) * 8, (h * 0.75 + top) / 2, x + (R() - 0.5) * 6, top); g.stroke(); blobCircle(g, x + (R() - 0.5) * 4, top, Math.max(3, w * 0.07), mix(fc, [255, 255, 255], R() * 0.3)); }
    } else {
      const n = 40; for (let i = 0; i < n; i++) blobCircle(g, w * (0.08 + 0.84 * R()), h * (0.45 + 0.5 * R()), (0.07 + R() * 0.05) * Math.max(w, h * 2), mix(shade(leaf, 0.9), shade(leaf, 1.15), R()));
    }
    plantCache.set(key, c); return c;
  }

  // ======================= Helpers =======================
  const ppf = () => (M && M.pxPerFt) || (PH ? PH / 30 : 20);
  const plantOf = (k) => CATP.PLANT_CATALOG.find((p) => p.key === k);
  const gfOf = (plant) => ((CATP.GROWTH[M.growth] || CATP.GROWTH.mature)[plant.category] || 1);
  function plantSize(it, plant) { const gf = gfOf(plant), h = plant.heightFt * gf * ppf() * (it.sizeMul || 1); return { h: Math.max(10, h), w: Math.max(10, Math.min(h * 2.4, plant.spreadFt * gf * ppf() * (it.sizeMul || 1) * 0.95)) }; }
  function hint(t) { $('ph-hint').textContent = t || ''; }
  function snapshot() { undoStack.push(JSON.stringify(M.items)); if (undoStack.length > 40) undoStack.shift(); }
  function polyDots(points, step) {
    const out = []; let carry = 0;
    for (let i = 0; i + 3 < points.length; i += 2) {
      const ax = points[i], ay = points[i + 1], bx = points[i + 2], by = points[i + 3], len = Math.hypot(bx - ax, by - ay);
      let d = carry; while (d <= len) { const t = len ? d / len : 0; out.push([ax + (bx - ax) * t, ay + (by - ay) * t]); d += step; } carry = d - len;
    }
    return out;
  }
  function lightProd(key) { return DPRO.light && DPRO.light.P(key); }
  function drawGlow(g, x, y, r, hex, a) {
    const c = hexToRgb(hex); const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, rgbStr(c, a)); gr.addColorStop(0.4, rgbStr(c, a * 0.35)); gr.addColorStop(1, rgbStr(c, 0));
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }

  // ======================= Stage =======================
  function buildStage() {
    const host = $('ph-stage'); host.innerHTML = '';
    stage = new Konva.Stage({ container: host, width: host.clientWidth, height: host.clientHeight });
    layerPhoto = new Konva.Layer(); layerItems = new Konva.Layer(); layerNight = new Konva.Layer(); layerLights = new Konva.Layer(); layerBefore = new Konva.Layer({ visible: false }); layerUI = new Konva.Layer();
    [layerPhoto, layerItems, layerNight, layerLights, layerBefore, layerUI].forEach((l) => stage.add(l));
    layerPhoto.add(new Konva.Image({ image: photoImg, x: 0, y: 0, width: PW, height: PH, listening: false }));
    layerBefore.add(new Konva.Image({ image: photoImg, x: 0, y: 0, width: PW, height: PH, listening: false }));
    nightRect = new Konva.Rect({ x: 0, y: 0, width: PW, height: PH, fill: '#2B3A6B', opacity: 0, globalCompositeOperation: 'multiply', listening: false });
    layerNight.add(nightRect);
    tr = new Konva.Transformer({ rotateEnabled: false, keepRatio: true, enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'], borderStroke: '#5BB6D6', anchorStroke: '#5BB6D6', anchorSize: 10, ignoreStroke: true, boundBoxFunc: (o, n) => (n.width < 14 || n.height < 14 ? o : n) });
    layerUI.add(tr);
    stage.on('click tap', onStageClick);
    stage.on('mousemove touchmove', onMove);
    fitStage();
  }
  function fitStage() {
    if (!stage) return; const host = $('ph-stage'); const W = host.clientWidth, H = host.clientHeight; if (!W || !H) return;
    stage.size({ width: W, height: H }); fit = Math.min(W / PW, H / PH);
    const ox = (W - PW * fit) / 2, oy = (H - PH * fit) / 2; stage.scale({ x: fit, y: fit }); stage.position({ x: ox, y: oy }); stage.batchDraw(); placeCompare();
  }
  window.addEventListener('resize', () => { if (!modal.hidden && stage) fitStage(); });

  // ======================= Rendering items =======================
  function renderItems() {
    if (!stage) return;
    layerItems.destroyChildren(); layerLights.destroyChildren(); nodeById.clear();
    const night = !!M.night; nightRect.opacity(night ? 0.92 : 0);
    const items = M.items;
    items.filter((i) => i.type === 'ground').forEach(addGround);
    items.filter((i) => i.type === 'plant').sort((a, b) => a.y - b.y).forEach(addPlant);
    items.filter((i) => i.type === 'lights').forEach(addLights);
    items.filter((i) => i.type === 'fixture').forEach(addFixture);
    $('ph-night').classList.toggle('on', night);
    attachTransformer();
    layerItems.batchDraw(); layerLights.batchDraw(); layerNight.batchDraw();
  }
  function addGround(it) {
    const s = SURFACES.find((x) => x.key === it.surface) || SURFACES[0]; const t = DPRO.texture(s.tex);
    const sc = (ppf() * t.ft / t.canvas.width) * (M.patSize || 1);
    const ln = new Konva.Line({ points: it.points, closed: true, fillPatternImage: t.canvas, fillPatternRepeat: 'repeat', fillPatternScale: { x: sc, y: sc * (M.fs || 0.5) }, opacity: 0.93, stroke: it.id === selId ? '#5BB6D6' : 'rgba(0,0,0,0.25)', strokeWidth: it.id === selId ? 3 : 1, dash: it.id === selId ? [8, 5] : null, shadowColor: '#000', shadowBlur: 8, shadowOpacity: 0.25, lineJoin: 'round' });
    ln.on('click tap', (e) => { if (tool === 'select') { select(it.id); e.cancelBubble = true; } });
    nodeById.set(it.id, ln); layerItems.add(ln);
  }
  function addPlant(it) {
    const plant = plantOf(it.plantKey); if (!plant) return; const sz = plantSize(it, plant);
    const img = new Konva.Image({ image: plantCanvas(plant, sz.w, sz.h, it.seed || 1), x: it.x, y: it.y, width: sz.w, height: sz.h, offsetX: sz.w / 2, offsetY: sz.h, scaleX: it.flip ? -1 : 1, draggable: tool === 'select', name: 'plant' });
    img.on('click tap', (e) => { if (tool === 'select') { select(it.id); e.cancelBubble = true; } });
    img.on('dragstart', () => { snapshot(); select(it.id); });
    img.on('dragend', () => { it.x = img.x(); it.y = img.y(); renderItems(); });
    img.on('transformend', () => {
      const newH = img.height() * Math.abs(img.scaleY()); const base = plant.heightFt * gfOf(plant) * ppf();
      snapshot(); it.sizeMul = clamp(newH / base, 0.05, 12); it.x = img.x(); it.y = img.y(); renderItems();
    });
    nodeById.set(it.id, img); layerItems.add(img);
  }
  function addLights(it) {
    const prod = lightProd(it.key); if (!prod) return; const L = DPRO.light; const col = L.colorOf({ color: it.color }, prod); const night = !!M.night;
    const cols = col.multi || [col.hex]; let step = Math.max(7, ((prod.spacingIn || 12) / 12) * ppf() * 0.9); let est = 0;
    for (let i = 0; i + 3 < it.points.length; i += 2) est += Math.hypot(it.points[i + 2] - it.points[i], it.points[i + 3] - it.points[i + 1]);
    if (est / step > 700) step = est / 700;
    const dots = polyDots(it.points, step); const r = Math.max(2.4, ppf() * 0.15);
    const sel = it.id === selId;
    const shape = new Konva.Shape({
      sceneFunc(ctx) {
        const g = ctx._context; g.save();
        g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = night ? 'rgba(0,0,0,0.6)' : 'rgba(60,60,60,0.7)'; g.lineWidth = Math.max(1, r * 0.35);
        g.beginPath(); it.points.forEach((v, i) => { if (i % 2 === 0) { if (i === 0) g.moveTo(v, it.points[1]); else g.lineTo(v, it.points[i + 1]); } }); g.stroke();
        if (sel) { g.strokeStyle = '#5BB6D6'; g.setLineDash([6, 5]); g.lineWidth = 2; g.stroke(); g.setLineDash([]); }
        if (night) { g.globalCompositeOperation = 'lighter'; dots.forEach((d, i) => drawGlow(g, d[0], d[1], r * 6.5, cols[i % cols.length], 0.9)); g.globalCompositeOperation = 'source-over'; }
        dots.forEach((d, i) => { const c = hexToRgb(cols[i % cols.length]); g.fillStyle = night ? '#FFFFFF' : rgbStr(c); g.beginPath(); g.arc(d[0], d[1], night ? r * 0.8 : r, 0, 6.2832); g.fill(); if (!night) { g.fillStyle = 'rgba(255,255,255,0.55)'; g.beginPath(); g.arc(d[0] - r * 0.3, d[1] - r * 0.3, r * 0.35, 0, 6.2832); g.fill(); } });
        g.restore();
      },
      hitFunc(ctx, sh) { ctx.beginPath(); it.points.forEach((v, i) => { if (i % 2 === 0) { if (i === 0) ctx.moveTo(v, it.points[1]); else ctx.lineTo(v, it.points[i + 1]); } }); ctx.strokeShape(sh); }, stroke: '#000', strokeWidth: 14,
    });
    shape.on('click tap', (e) => { if (tool === 'select') { select(it.id); e.cancelBubble = true; } });
    nodeById.set(it.id, shape); layerLights.add(shape);
  }
  function addFixture(it) {
    const prod = lightProd(it.key); if (!prod) return; const col = DPRO.light.colorOf({ color: it.color }, prod); const night = !!M.night; const u = ppf(); const sel = it.id === selId;
    const shape = new Konva.Shape({
      sceneFunc(ctx) {
        const g = ctx._context; g.save();
        const hh = (prod.sym === 'path' ? 1.7 : 0.4) * u;
        if (night) { g.globalCompositeOperation = 'lighter'; const pool = Math.max(18, (prod.throwFt || 6) * u * 0.5); g.save(); g.translate(it.x, it.y); g.scale(1, 0.38); drawGlow(g, 0, 0, pool, col.hex, 0.85); g.restore(); if (prod.sym === 'path') drawGlow(g, it.x, it.y - hh, u * 1.1, col.hex, 0.95); else { g.beginPath(); const L = (prod.throwFt || 10) * u * 0.9; const gr = g.createLinearGradient(it.x, it.y, it.x, it.y - L); gr.addColorStop(0, rgbStr(hexToRgb(col.hex), 0.5)); gr.addColorStop(1, rgbStr(hexToRgb(col.hex), 0)); g.fillStyle = gr; g.moveTo(it.x - 3, it.y); g.lineTo(it.x + 3, it.y); g.lineTo(it.x + L * 0.32, it.y - L); g.lineTo(it.x - L * 0.32, it.y - L); g.closePath(); g.fill(); } g.globalCompositeOperation = 'source-over'; }
        g.fillStyle = '#26262A'; g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 1;
        if (prod.sym === 'path') { g.fillRect(it.x - u * 0.04, it.y - hh, u * 0.08, hh); g.beginPath(); g.moveTo(it.x - u * 0.28, it.y - hh); g.lineTo(it.x + u * 0.28, it.y - hh); g.lineTo(it.x + u * 0.12, it.y - hh - u * 0.28); g.lineTo(it.x - u * 0.12, it.y - hh - u * 0.28); g.closePath(); g.fill(); g.fillStyle = night ? '#fff' : rgbStr(hexToRgb(col.hex)); g.fillRect(it.x - u * 0.2, it.y - hh - 3, u * 0.4, 3); }
        else { g.beginPath(); g.ellipse(it.x, it.y - u * 0.1, u * 0.22, u * 0.14, 0, 0, 6.2832); g.fill(); g.fillStyle = night ? '#fff' : rgbStr(hexToRgb(col.hex)); g.beginPath(); g.arc(it.x, it.y - u * 0.16, u * 0.07, 0, 6.2832); g.fill(); }
        if (sel) { g.strokeStyle = '#5BB6D6'; g.lineWidth = 2; g.setLineDash([5, 4]); g.beginPath(); g.arc(it.x, it.y - hh / 2, Math.max(16, hh * 0.7), 0, 6.2832); g.stroke(); }
        g.restore();
      },
      hitFunc(ctx, sh) { ctx.beginPath(); ctx.arc(it.x, it.y - 8, 22, 0, Math.PI * 2); ctx.fillShape(sh); }, fill: '#000',
    });
    shape.on('click tap', (e) => { if (tool === 'select') { select(it.id); e.cancelBubble = true; } });
    nodeById.set(it.id, shape); layerLights.add(shape);
  }
  function attachTransformer() {
    const it = M.items.find((i) => i.id === selId); const n = it && nodeById.get(it.id);
    if (it && it.type === 'plant' && n && !compareOn) { tr.nodes([n]); tr.visible(true); } else { tr.nodes([]); tr.visible(false); }
    layerUI.batchDraw();
  }
  function select(id) { selId = id; renderItems(); renderPanel(); }

  // ======================= Tools =======================
  let preview = null, lastDraw = { t: 0, x: 0, y: 0 };
  function setTool(t) {
    if (drawing.length >= 2 && (tool === 'ground' || tool === 'lights') && t !== tool) finishDraw(); else cancelDraw();
    tool = t; scaleClicks = [];
    if (stage) stage.container().style.cursor = t === 'select' ? 'default' : 'crosshair';
    const hints = { select: 'Click an item to select it. Drag plants to move them, drag the corners to resize.', plant: 'Click the photo where the base of the plant meets the ground. Keep clicking to add more.', ground: 'Click around the area to cover, then press Enter or double-click to finish.', lights: 'Click along the roofline or edge. Press Enter or double-click to finish.', fixture: 'Click where the fixture sits on the ground.', scale: 'Click the bottom, then the top of something you know the height of (a door, a fence).' };
    hint(hints[t] || '');
    if (stage) renderItems();
    renderPanel();
  }
  function cancelDraw() { drawing = []; if (preview) { preview.destroy(); preview = null; layerUI && layerUI.batchDraw(); } }
  function finishDraw() {
    const pts = drawing.slice(); const t = tool; cancelDraw();
    if (t === 'ground' && pts.length >= 6) { snapshot(); const it = { id: uid2(), type: 'ground', surface: armed.surface, points: pts }; M.items.push(it); selId = it.id; }
    else if (t === 'lights' && pts.length >= 4) { snapshot(); const p = lightProd(armed.lights); const it = { id: uid2(), type: 'lights', key: armed.lights, color: armed.color || (p && p.color) || 'warm', points: pts }; M.items.push(it); selId = it.id; }
    renderItems(); renderPanel();
  }
  function onStageClick() {
    if (compareOn) return;
    const pos = stage.getRelativePointerPosition(); if (!pos) return;
    if (pos.x < 0 || pos.y < 0 || pos.x > PW || pos.y > PH) return;
    if (tool === 'select') { if (selId) { selId = null; renderItems(); renderPanel(); } return; }
    if (tool === 'plant') {
      if (!armed.plant) { hint('Pick a plant from the list first.'); return; }
      snapshot(); const it = { id: uid2(), type: 'plant', plantKey: armed.plant, x: pos.x, y: pos.y, sizeMul: 1, flip: Math.random() > 0.5, seed: 1 + Math.floor(Math.random() * 9999) };
      M.items.push(it); selId = it.id; renderItems(); renderPanel(); return;
    }
    if (tool === 'fixture') { snapshot(); const p = lightProd(armed.fixture); const it = { id: uid2(), type: 'fixture', key: armed.fixture, color: (p && p.color) || 'warm', x: pos.x, y: pos.y }; M.items.push(it); selId = it.id; renderItems(); renderPanel(); return; }
    if (tool === 'ground' || tool === 'lights') {
      const now = Date.now(), n = drawing.length;
      // double-click (same spot, quickly) finishes the shape
      if (n >= 2 && now - lastDraw.t < 400 && Math.hypot(pos.x - lastDraw.x, pos.y - lastDraw.y) * fit < 10) { finishDraw(); return; }
      lastDraw = { t: now, x: pos.x, y: pos.y }; drawing.push(pos.x, pos.y); drawPreview(pos); return;
    }
    if (tool === 'scale') {
      scaleClicks.push(pos); drawPreview(pos);
      if (scaleClicks.length === 2) { const px = Math.abs(scaleClicks[1].y - scaleClicks[0].y) || Math.hypot(scaleClicks[1].x - scaleClicks[0].x, scaleClicks[1].y - scaleClicks[0].y); M._scalePx = px; hint('Now type how tall that is (in feet) in the Settings tab and press Set.'); tab = 'set'; renderPanel(); }
    }
  }
  function onMove() { if ((drawing.length || scaleClicks.length === 1) && stage) { const p = stage.getRelativePointerPosition(); if (p) drawPreview(p); } }
  function drawPreview(cur) {
    if (!layerUI) return; if (preview) preview.destroy();
    const pts = tool === 'scale' ? scaleClicks.flatMap((p) => [p.x, p.y]) : drawing.slice();
    if (cur) pts.push(cur.x, cur.y);
    preview = new Konva.Line({ points: pts, stroke: '#FFE45E', strokeWidth: 2.5 / fit, dash: [8 / fit, 5 / fit], closed: tool === 'ground' && pts.length >= 6, fill: tool === 'ground' ? 'rgba(255,228,94,0.12)' : null, listening: false });
    layerUI.add(preview); layerUI.batchDraw();
  }

  // ======================= Side panel =======================
  function swatch(hex) { return `<span class="ph-sw" style="background:${hex}"></span>`; }
  function renderPanel() {
    const p = $('ph-panel'); if (!p || !M) return;
    modal.querySelectorAll('[data-ptab]').forEach((b) => b.classList.toggle('on', b.dataset.ptab === tab));
    let h = '';
    const it = M.items.find((i) => i.id === selId);
    if (it) {
      const name = it.type === 'plant' ? (plantOf(it.plantKey) || {}).name : it.type === 'ground' ? (SURFACES.find((s) => s.key === it.surface) || {}).name : (lightProd(it.key) || {}).name;
      h += `<h4>Selected: ${esc(name || it.type)}</h4><div class="ph-row"><button class="ph-btn" id="ph-del" type="button">Delete</button>${it.type === 'plant' ? '<button class="ph-btn" id="ph-flip" type="button">Flip</button>' : ''}</div>`;
      if (it.type === 'plant') h += `<label>Size adjust</label><input id="ph-sz" type="range" min="40" max="220" value="${Math.round((it.sizeMul || 1) * 100)}" />`;
      if (it.type === 'ground') h += `<label>Surface</label><select id="ph-gsurf">${SURFACES.map((s) => `<option value="${s.key}" ${s.key === it.surface ? 'selected' : ''}>${s.name}</option>`).join('')}</select>`;
      if (it.type === 'lights' || it.type === 'fixture') h += `<label>Color</label><select id="ph-lcol">${Object.keys(DPRO.light.COLORS).map((k) => `<option value="${k}" ${it.color === k ? 'selected' : ''}>${DPRO.light.COLORS[k].name}</option>`).join('')}</select>`;
    }
    if (tab === 'plants') {
      const cats = ['All'].concat(CATP.PLANT_CATEGORIES || ['Tree', 'Shrub', 'Perennial', 'Ornamental Grass', 'Groundcover']);
      h += `<h4>Plants</h4><input id="ph-psearch" type="text" placeholder="Search plants" value="${esc(plantFilter)}" />`;
      const q = plantFilter.trim().toLowerCase();
      CATP.PLANT_CATALOG.filter((pl) => !q || pl.name.toLowerCase().includes(q) || pl.category.toLowerCase().includes(q)).forEach((pl) => {
        h += `<div class="ph-item ${armed.plant === pl.key && tool === 'plant' ? 'on' : ''}" data-plant="${pl.key}">${swatch(pl.color)}<span><strong>${esc(pl.name)}</strong><small>${pl.category} &middot; ${pl.heightFt}&prime; &times; ${pl.spreadFt}&prime;</small></span></div>`;
      });
      void cats;
    } else if (tab === 'ground') {
      h += '<h4>Cover an area</h4><p style="color:#9fb0c3;margin:0 0 8px">Pick a surface, then click around the area on the photo.</p>';
      SURFACES.forEach((s) => { h += `<div class="ph-item ${armed.surface === s.key && tool === 'ground' ? 'on' : ''}" data-surf="${s.key}"><span><strong>${s.name}</strong></span></div>`; });
    } else if (tab === 'lights') {
      const P = DPRO.light.PRODUCTS;
      h += '<h4>Light runs (click along a line)</h4>';
      P.filter((x) => x.kind === 'run' && x.mode !== 'landscape').forEach((x) => { h += `<div class="ph-item ${tool === 'lights' && armed.lights === x.key ? 'on' : ''}" data-lrun="${x.key}">${swatch(DPRO.light.COLORS[x.color].multi ? '#E04545' : DPRO.light.COLORS[x.color].hex)}<span><strong>${esc(x.name)}</strong></span></div>`; });
      h += '<h4>Fixtures (click to place)</h4>';
      P.filter((x) => x.kind === 'point' && ['path', 'up', 'well'].includes(x.sym)).forEach((x) => { h += `<div class="ph-item ${tool === 'fixture' && armed.fixture === x.key ? 'on' : ''}" data-lfix="${x.key}">${swatch(DPRO.light.COLORS[x.color].hex)}<span><strong>${esc(x.name)}</strong></span></div>`; });
      h += '<h4>Light color</h4><select id="ph-colpick"><option value="">Product default</option>' + Object.keys(DPRO.light.COLORS).map((k) => `<option value="${k}" ${armed.color === k ? 'selected' : ''}>${DPRO.light.COLORS[k].name}</option>`).join('') + '</select><p style="color:#9fb0c3">Press Night (top bar) to see them glow.</p>';
    } else {
      h += '<h4>Plant size</h4><div class="ph-row">' + Object.keys(GROWTH_LABELS).map((k) => `<button class="ph-btn ${M.growth === k ? 'on' : ''}" data-grow="${k}" type="button">${GROWTH_LABELS[k]}</button>`).join('') + '</div>';
      h += `<h4>Scale (makes plants true to size)</h4><p style="color:#9fb0c3;margin:0 0 6px">${M.pxPerFt ? 'Scale is set.' : 'Not set yet. Plants use a rough default size.'} Click Set scale, then tap the bottom and top of something you know the height of.</p><div class="ph-row"><button class="ph-btn ${tool === 'scale' ? 'on' : ''}" id="ph-scalebtn" type="button">Set scale</button></div>`;
      if (M._scalePx) h += `<label>That height is (feet)</label><div class="ph-row"><input id="ph-scaleft" type="number" min="0.5" step="0.5" value="6.8" style="width:90px" /><button class="ph-btn pri" id="ph-scaleset" type="button">Set</button></div>`;
      h += `<h4>Ground look</h4><label>Flatten surfaces (perspective)</label><input id="ph-fs" type="range" min="25" max="100" value="${Math.round((M.fs || 0.5) * 100)}" /><label>Surface pattern size</label><input id="ph-pat" type="range" min="40" max="300" value="${Math.round((M.patSize || 1) * 100)}" />`;
      h += `<h4>Name</h4><input id="ph-name" type="text" value="${esc(M.name || '')}" />`;
    }
    p.innerHTML = h;
    const b = (id, fn, ev) => { const n = $(id); if (n) n.addEventListener(ev || 'click', fn); };
    b('ph-del', () => { snapshot(); M.items = M.items.filter((x) => x.id !== selId); selId = null; renderItems(); renderPanel(); });
    b('ph-flip', () => { const x = M.items.find((i) => i.id === selId); if (x) { snapshot(); x.flip = !x.flip; renderItems(); } });
    b('ph-sz', (e) => { const x = M.items.find((i) => i.id === selId); if (x) { x.sizeMul = Number(e.target.value) / 100; renderItems(); } }, 'input');
    b('ph-gsurf', (e) => { const x = M.items.find((i) => i.id === selId); if (x) { snapshot(); x.surface = e.target.value; renderItems(); } }, 'change');
    b('ph-lcol', (e) => { const x = M.items.find((i) => i.id === selId); if (x) { snapshot(); x.color = e.target.value; renderItems(); } }, 'change');
    b('ph-psearch', (e) => { plantFilter = e.target.value; const pos = e.target.selectionStart; renderPanel(); const n = $('ph-psearch'); if (n) { n.focus(); n.setSelectionRange(pos, pos); } }, 'input');
    p.querySelectorAll('[data-plant]').forEach((n) => n.addEventListener('click', () => { armed.plant = n.dataset.plant; setTool('plant'); }));
    p.querySelectorAll('[data-surf]').forEach((n) => n.addEventListener('click', () => { armed.surface = n.dataset.surf; setTool('ground'); }));
    p.querySelectorAll('[data-lrun]').forEach((n) => n.addEventListener('click', () => { armed.lights = n.dataset.lrun; setTool('lights'); }));
    p.querySelectorAll('[data-lfix]').forEach((n) => n.addEventListener('click', () => { armed.fixture = n.dataset.lfix; setTool('fixture'); }));
    b('ph-colpick', (e) => { armed.color = e.target.value || null; }, 'change');
    p.querySelectorAll('[data-grow]').forEach((n) => n.addEventListener('click', () => { M.growth = n.dataset.grow; renderItems(); renderPanel(); }));
    b('ph-scalebtn', () => setTool('scale'));
    b('ph-scaleset', () => { const ft = Number($('ph-scaleft').value); if (ft > 0 && M._scalePx) { M.pxPerFt = M._scalePx / ft; M._scalePx = null; cancelDraw(); setTool('select'); renderItems(); renderPanel(); hint('Scale set. Plants now size to their real heights.'); } });
    b('ph-fs', (e) => { M.fs = Number(e.target.value) / 100; renderItems(); }, 'input');
    b('ph-pat', (e) => { M.patSize = Number(e.target.value) / 100; renderItems(); }, 'input');
    b('ph-name', (e) => { M.name = e.target.value; }, 'change');
  }
  modal.querySelectorAll('[data-ptab]').forEach((b) => b.addEventListener('click', () => { tab = b.dataset.ptab; renderPanel(); }));
  window.addEventListener('keydown', (e) => {
    if (modal.hidden || !M || $('ph-body').hidden) return;
    if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName || '')) return;
    if (e.key === 'Enter') { finishDraw(); }
    else if (e.key === 'Escape') { if (drawing.length) cancelDraw(); else setTool('select'); }
    else if ((e.key === 'Delete' || e.key === 'Backspace') && selId) { snapshot(); M.items = M.items.filter((x) => x.id !== selId); selId = null; renderItems(); renderPanel(); e.preventDefault(); }
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { undo(); e.preventDefault(); }
  });
  function undo() { if (!undoStack.length) return; M.items = JSON.parse(undoStack.pop()); selId = null; renderItems(); renderPanel(); }
  $('ph-undo').addEventListener('click', undo);
  $('ph-night').addEventListener('click', () => { if (!M) return; M.night = !M.night; renderItems(); });

  // ======================= Before / after =======================
  let cmpX = 0.5;
  function placeCompare() { const el = $('ph-compare'); if (!el || !stage) return; const x = stage.x() + PW * fit * cmpX; el.style.left = x + 'px'; layerBefore.clip({ x: 0, y: 0, width: PW * cmpX, height: PH }); layerBefore.batchDraw(); }
  $('ph-compare-btn').addEventListener('click', () => {
    if (!M) return; compareOn = !compareOn; layerBefore.visible(compareOn); $('ph-compare').style.display = compareOn ? 'block' : 'none';
    $('ph-compare-btn').classList.toggle('on', compareOn); if (compareOn) { setTool('select'); selId = null; renderItems(); renderPanel(); hint('Drag the handle. Left side is the original photo.'); placeCompare(); } else hint('');
    attachTransformer();
  });
  (function () {
    const el = $('ph-compare'); let drag = false;
    el.addEventListener('pointerdown', (e) => { drag = true; el.setPointerCapture(e.pointerId); });
    el.addEventListener('pointerup', () => { drag = false; });
    el.addEventListener('pointermove', (e) => { if (!drag) return; const r = $('ph-stagewrap').getBoundingClientRect(); cmpX = clamp((e.clientX - r.left - stage.x()) / (PW * fit), 0.02, 0.98); placeCompare(); });
  })();

  // ======================= Gallery / new / open / save =======================
  let lastSaved = '', saving = false;
  const sig = () => JSON.stringify([M.items, M.growth, M.pxPerFt, M.fs, M.patSize, M.name]);
  function showGallery() {
    $('ph-body').hidden = true; $('ph-gallery').hidden = false;
    ['ph-undo', 'ph-night', 'ph-compare-btn', 'ph-save'].forEach((id) => { $(id).style.display = 'none'; });
    M = null; photoImg = null; if (stage) { stage.destroy(); stage = null; }
    const list = getMockups();
    let h = `<div class="ph-card" style="display:flex;align-items:center;justify-content:center;min-height:150px;cursor:pointer" id="ph-newcard"><div style="text-align:center;font-size:14px"><div style="font-size:30px">+</div>New photo mockup<br><span style="color:#9fb0c3;font-size:12px">Upload or take a photo of the yard</span></div></div>`;
    list.forEach((m) => { h += `<div class="ph-card"><img src="${esc(m.afterUrl || m.photoUrl)}" alt="" /><div><strong>${esc(m.name || 'Mockup')}</strong><div class="ph-row"><button class="ph-btn" data-open="${m.id}" type="button">Open</button><button class="ph-btn" data-del="${m.id}" type="button">Delete</button></div></div></div>`; });
    if (!list.length) h += '<div style="grid-column:1/-1;color:#9fb0c3;font-size:13px">No mockups yet. A mockup puts plants, ground surfaces and lights on a real photo of the property, with a before/after slider.</div>';
    $('ph-gallery').innerHTML = h;
    $('ph-newcard').addEventListener('click', () => $('ph-file').click());
    $('ph-gallery').querySelectorAll('[data-open]').forEach((b) => b.addEventListener('click', () => openMockup(b.dataset.open)));
    $('ph-gallery').querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => deleteMockup(b.dataset.del)));
  }
  function readImage(file) {
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(file); const im = new Image();
      im.onload = () => {
        const k = Math.min(1, 1600 / Math.max(im.naturalWidth, im.naturalHeight)); const c = document.createElement('canvas'); c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
        const out = new Image(); out.onload = () => res(out); out.onerror = rej; out.src = c.toDataURL('image/jpeg', 0.9);
      };
      im.onerror = () => { URL.revokeObjectURL(url); rej(new Error('That file could not be read as a photo.')); }; im.src = url;
    });
  }
  $('ph-file').addEventListener('change', async () => {
    const f = $('ph-file').files && $('ph-file').files[0]; $('ph-file').value = ''; if (!f) return;
    try { const im = await readImage(f); startEditor({ id: uid2(), name: 'Mockup ' + (getMockups().length + 1), items: [], pxPerFt: null, growth: 'mature', night: false, fs: 0.5, patSize: 1 }, im); }
    catch (e) { alert(e.message); }
  });
  $('ph-newbtn').addEventListener('click', () => { if (M && sig() !== lastSaved && !window.confirm('Leave this mockup without saving?')) return; showGallery(); $('ph-file').click(); });
  function startEditor(m, im) {
    M = m; photoImg = im; PW = im.naturalWidth; PH = im.naturalHeight; selId = null; undoStack = []; tool = 'select'; drawing = []; compareOn = false; cmpX = 0.5; tab = M.pxPerFt ? 'plants' : 'set';
    $('ph-gallery').hidden = true; $('ph-body').hidden = false; $('ph-compare').style.display = 'none'; $('ph-compare-btn').classList.remove('on');
    ['ph-undo', 'ph-night', 'ph-compare-btn', 'ph-save'].forEach((id) => { $(id).style.display = ''; });
    requestAnimationFrame(() => { if (stage) stage.destroy(); buildStage(); renderItems(); renderPanel(); lastSaved = M.photoUrl ? sig() : ''; hint(M.pxPerFt ? '' : 'Tip: open the Settings tab and set the scale first so plants come out true to size.'); });
  }
  function openMockup(id) {
    const src = getMockups().find((m) => m.id === id); if (!src) return;
    const copy = JSON.parse(JSON.stringify(src)); const im = new Image(); im.crossOrigin = 'anonymous';
    im.onload = () => startEditor(copy, im);
    im.onerror = () => alert('Could not load the saved photo. Check your connection and try again.');
    im.src = src.photoUrl;
  }
  async function deleteMockup(id) {
    const list = getMockups(); const m = list.find((x) => x.id === id); if (!m) return;
    if (!window.confirm('Delete this mockup and its images?')) return;
    DPRO.extras.mockups = list.filter((x) => x.id !== id); markDirty();
    [m.photoUrl, m.afterUrl, m.afterNightUrl].forEach((u) => { if (u && typeof deleteFromStorage === 'function') deleteFromStorage(u).catch(() => {}); });
    showGallery(); if (typeof saveDesign === 'function') saveDesign(true);
  }
  function exportImage(night) {
    const pn = M.night, ps = selId, trv = tr.visible(), compare = layerBefore.visible();
    M.night = night; selId = null; compareOn = false; renderItems(); tr.visible(false); layerUI.visible(false); layerBefore.visible(false); stage.batchDraw();
    const url = stage.toDataURL({ x: stage.x(), y: stage.y(), width: PW * fit, height: PH * fit, pixelRatio: 1 / fit, mimeType: 'image/jpeg', quality: 0.9 });
    layerUI.visible(true); layerBefore.visible(compare); compareOn = compare; M.night = pn; selId = ps; tr.visible(trv); renderItems(); return url;
  }
  async function saveMockup() {
    if (!M || saving) return; if (!currentDesign) { alert('Open a design first.'); return; }
    saving = true; const btn = $('ph-save'); btn.disabled = true; btn.textContent = 'Saving...';
    try {
      const folder = `designs/${currentDesign.id}/mockups`;
      let photoUrl = M.photoUrl;
      if (!photoUrl) { const c = document.createElement('canvas'); c.width = PW; c.height = PH; c.getContext('2d').drawImage(photoImg, 0, 0); photoUrl = await uploadToStorage(c.toDataURL('image/jpeg', 0.88), folder); }
      const day = exportImage(false); const afterUrl = await uploadToStorage(day, folder);
      const hasLights = M.items.some((i) => i.type === 'lights' || i.type === 'fixture');
      let nightUrl = null; if (hasLights) nightUrl = await uploadToStorage(exportImage(true), folder);
      [M.afterUrl, M.afterNightUrl].forEach((u) => { if (u && typeof deleteFromStorage === 'function') deleteFromStorage(u).catch(() => {}); });
      M.photoUrl = photoUrl; M.afterUrl = afterUrl; M.afterNightUrl = nightUrl; M.updatedAt = new Date().toISOString(); M.createdAt = M.createdAt || M.updatedAt;
      const rec = JSON.parse(JSON.stringify(Object.assign({}, M, { _scalePx: undefined, night: false, w: PW, h: PH })));
      const list = getMockups(); const i = list.findIndex((x) => x.id === M.id); if (i >= 0) list[i] = rec; else list.push(rec);
      markDirty(); if (typeof saveDesign === 'function') await saveDesign(true);
      lastSaved = sig(); hint('Saved. It will appear in the customer presentation.');
    } catch (e) { alert('Could not save the mockup: ' + (e && e.message ? e.message : e)); }
    saving = false; btn.disabled = false; btn.textContent = 'Save mockup';
  }
  $('ph-save').addEventListener('click', saveMockup);
  function openModal() {
    if (!currentDesign) return; modal.hidden = false; showGallery();
  }
  function closeModal() {
    if (M && !$('ph-body').hidden && sig() !== lastSaved && !window.confirm('Close without saving this mockup?')) return;
    modal.hidden = true; M = null; if (stage) { stage.destroy(); stage = null; }
  }
  $('ph-close').addEventListener('click', closeModal);
  const topbar = document.querySelector('.design-editor-topbar');
  if (topbar && !$('btn-design-photo-mockup')) {
    const b = document.createElement('button'); b.className = 'btn btn-ghost'; b.id = 'btn-design-photo-mockup'; b.type = 'button'; b.textContent = 'Photo mockup';
    const ref = $('btn-design-3d') || $('btn-design-print'); topbar.insertBefore(b, ref ? ref.nextSibling : null); b.addEventListener('click', openModal);
  }
  DPRO.photo = { open: openModal, getMockups, get editing() { return M; } };
})();
