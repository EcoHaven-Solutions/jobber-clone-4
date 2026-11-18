// ============================================================================
// design-3d.js — 3D view generated from the 2D plan (three.js, no AI).
//
// Everything you drew becomes a 3D model: surfaces, house (walls, windows,
// gable roof), walls and fences, plants at install / year 3 / year 5 / mature
// size, irrigation (optional) and lighting. A sun slider (time of day + month,
// Spokane latitude) casts real shadows, winter shows deciduous trees bare, and
// Night turns on the lighting design. Orbit, top, front and walk-through views;
// works on phones too (view only).
// three.js is loaded only when you open the 3D view.
// ============================================================================
(function () {
  'use strict';
  const DPRO = window.DPRO;
  if (!DPRO) return;
  const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js';
  const $ = (id) => document.getElementById(id);
  const esc = DPRO.esc;
  const CATP = window.DESIGN_CATALOG;
  const LAT = 47.66; // Spokane, WA
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const MID_DOY = [15, 46, 74, 105, 135, 166, 196, 227, 258, 288, 319, 349];

  const state = { growth: 'mature', month: 5, hour: 15, night: false, labels: false, irrigation: false, mode: 'orbit', view: 'aerial' };
  let THREE = null, loading = null;
  let renderer, scene, camera, sun, hemi, sky, root, ground, ro;
  let bounds = { cx: 0, cz: 0, r: 60 };
  let spots = [];
  let open = false, dirty = true, raf = 0;
  const cam = { theta: 0.5, phi: 0.95, radius: 120, tx: 0, ty: 0, tz: 0 };           // orbit
  const walk = { x: 0, z: 0, yaw: 0, pitch: 0, keys: {} };                              // walk

  function loadThree() {
    if (window.THREE) { THREE = window.THREE; return Promise.resolve(); }
    if (loading) return loading;
    loading = new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = THREE_URL; s.onload = () => { THREE = window.THREE; THREE ? res() : rej(new Error('three.js did not load')); };
      s.onerror = () => { loading = null; rej(new Error('Could not load the 3D engine. Check your internet connection and try again.')); };
      document.head.appendChild(s);
    });
    return loading;
  }

  // ======================= UI =======================
  const css = document.createElement('style');
  css.textContent = `
  #dpro3d{position:fixed;inset:0;z-index:5000;background:#0b0f14;display:flex;flex-direction:column;color:#EDEDED;font-family:inherit}
  #dpro3d[hidden]{display:none}
  .d3-top{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:8px 10px;background:#161b22;border-bottom:1px solid #2a313b}
  .d3-top h3{margin:0 8px 0 0;font-size:15px;font-weight:700}
  .d3-btn{background:#232a34;color:#EDEDED;border:1px solid #37404d;border-radius:8px;padding:7px 11px;font-size:13px;cursor:pointer;touch-action:manipulation}
  .d3-btn.on{background:#2F7F9E;border-color:#5BB6D6;color:#fff}
  .d3-btn:active{filter:brightness(1.2)}
  .d3-sp{flex:1}
  #d3-wrap{position:relative;flex:1;min-height:0}
  #d3-wrap canvas{display:block;width:100%;height:100%;touch-action:none;outline:none}
  .d3-bottom{background:#161b22;border-top:1px solid #2a313b;padding:8px 10px;display:flex;flex-wrap:wrap;gap:10px 18px;align-items:center;font-size:12.5px;max-height:38vh;overflow:auto}
  .d3-grp{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
  .d3-grp label{color:#9fb0c3}
  .d3-grp select,.d3-grp input[type=range]{accent-color:#5BB6D6}
  .d3-grp select{background:#232a34;color:#EDEDED;border:1px solid #37404d;border-radius:6px;padding:5px}
  .d3-grp input[type=range]{width:150px}
  .d3-time{min-width:150px}
  #d3-msg:empty{display:none}
  #d3-msg{position:absolute;left:10px;top:10px;background:rgba(11,15,20,.78);padding:6px 10px;border-radius:8px;font-size:12px;max-width:70%;pointer-events:none}
  #d3-pad{position:absolute;right:12px;bottom:12px;display:none;grid-template-columns:repeat(3,46px);grid-template-rows:repeat(2,46px);gap:6px}
  #d3-pad.show{display:grid}
  #d3-pad button{background:rgba(35,42,52,.85);border:1px solid #37404d;border-radius:10px;color:#fff;font-size:18px;touch-action:none}
  #d3-loading[hidden]{display:none}
  #d3-loading{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:15px;background:#0b0f14}
  `;
  document.head.appendChild(css);

  const modal = document.createElement('div');
  modal.id = 'dpro3d'; modal.hidden = true;
  modal.innerHTML = `
    <div class="d3-top">
      <h3>3D view</h3>
      <button class="d3-btn on" data-view="aerial" type="button">Aerial</button>
      <button class="d3-btn" data-view="top" type="button">Top</button>
      <button class="d3-btn" data-view="front" type="button">Front</button>
      <button class="d3-btn" data-view="walk" type="button">Walk through</button>
      <span class="d3-sp"></span>
      <button class="d3-btn" id="d3-save" type="button">Save image</button>
      <button class="d3-btn" id="d3-close" type="button">Close</button>
    </div>
    <div id="d3-wrap"><div id="d3-loading">Building the 3D model...</div><div id="d3-msg"></div>
      <div id="d3-pad"><span></span><button data-k="w" type="button">&uarr;</button><span></span><button data-k="a" type="button">&larr;</button><button data-k="s" type="button">&darr;</button><button data-k="d" type="button">&rarr;</button></div>
    </div>
    <div class="d3-bottom">
      <div class="d3-grp"><label>Plant size</label>
        ${Object.keys(CATP.GROWTH_LABELS).map((k) => `<button class="d3-btn${k === 'mature' ? ' on' : ''}" data-growth="${k}" type="button">${CATP.GROWTH_LABELS[k]}</button>`).join('')}
      </div>
      <div class="d3-grp"><label for="d3-month">Month</label><select id="d3-month">${MONTHS.map((m, i) => `<option value="${i}">${m}</option>`).join('')}</select>
        <label for="d3-hour">Sun</label><input id="d3-hour" type="range" min="5" max="22" step="0.25" value="15" /><span class="d3-time" id="d3-time"></span></div>
      <div class="d3-grp"><button class="d3-btn" id="d3-night" type="button">Night lighting</button>
        <button class="d3-btn" id="d3-labels" type="button">Plant labels</button>
        <button class="d3-btn" id="d3-irr" type="button">Sprinklers</button></div>
    </div>`;
  document.body.appendChild(modal);

  // ======================= Sun =======================
  function sunInfo() {
    const n = MID_DOY[state.month];
    const decl = (23.44 * Math.PI / 180) * Math.sin(2 * Math.PI * (284 + n) / 365);
    const H = (state.hour - 12) * 15 * Math.PI / 180, phi = LAT * Math.PI / 180;
    const sinEl = Math.sin(phi) * Math.sin(decl) + Math.cos(phi) * Math.cos(decl) * Math.cos(H);
    const el = Math.asin(Math.max(-1, Math.min(1, sinEl)));
    const north = Math.sin(decl) * Math.cos(phi) - Math.cos(decl) * Math.sin(phi) * Math.cos(H);
    const east = -Math.cos(decl) * Math.sin(H);
    return { el, az: Math.atan2(east, north) };
  }
  function fmtHour(h) { const hh = Math.floor(h), mm = Math.round((h - hh) * 60); const ap = hh >= 12 ? 'PM' : 'AM'; return `${((hh + 11) % 12) + 1}:${String(mm).padStart(2, '0')} ${ap}`; }
  function bearingToVec(az) { const th = (Number(DPRO.extras.northDeg) || 0) * Math.PI / 180 + az; return { x: Math.sin(th), z: -Math.cos(th) }; }
  function lerpColor(a, b, t) { return new THREE.Color(a).lerp(new THREE.Color(b), Math.max(0, Math.min(1, t))); }

  function applySun() {
    if (!scene) return;
    const s = sunInfo(); const deg = (s.el * 180) / Math.PI;
    const night = state.night;
    const v = bearingToVec(s.az);
    const horiz = Math.cos(Math.max(s.el, 0.05));
    const d = bounds.r * 3 + 80;
    sun.position.set(bounds.cx + v.x * horiz * d, Math.max(Math.sin(s.el), 0.05) * d, bounds.cz + v.z * horiz * d);
    sun.target.position.set(bounds.cx, 0, bounds.cz); sun.target.updateMatrixWorld();
    const day = night ? 0 : Math.max(0, Math.min(1, (deg + 2) / 8));       // 0 night .. 1 full day
    sun.intensity = 3.1 * day; sun.visible = day > 0.02;
    sun.color.copy(lerpColor('#FFB070', '#FFF4E0', (deg - 2) / 25));
    const twilight = night ? 0 : Math.max(0, Math.min(1, (deg + 8) / 10));
    hemi.intensity = night ? 2.4 : 0.35 + 1.25 * twilight;
    hemi.color.set(night ? '#5F78B8' : '#CFE3FF'); hemi.groundColor.set(night ? '#27304A' : '#6B7A55');
    let bg;
    if (night) bg = new THREE.Color('#0B1226');
    else if (deg > 12) bg = new THREE.Color('#9CCBF0');
    else bg = lerpColor('#0E1630', deg > 0 ? '#F2B27A' : '#2A2F55', (deg + 8) / 20).lerp(new THREE.Color('#9CCBF0'), Math.max(0, (deg - 4) / 12));
    scene.background = bg; scene.fog.color.copy(bg);
    ground.material.color.set(night ? '#27402B' : '#86A76F');
    const label = $('d3-time'); if (label) label.textContent = `${fmtHour(state.hour)} · sun ${deg > 0 ? Math.round(deg) + '° high' : 'below horizon'}`;
    spots.forEach((sp) => { sp.visible = night; });
    dirty = true;
  }

  // ======================= Textures / materials =======================
  const texCache = {};
  function planTex(name, ftOverride) {
    if (!texCache[name]) {
      const t = DPRO.texture(name);
      const tx = new THREE.CanvasTexture(t.canvas);
      tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 4;
      tx.repeat.set(1 / t.ft, 1 / t.ft); texCache[name] = tx;
    }
    return texCache[name];
  }
  function glowTex() {
    if (texCache.glow) return texCache.glow;
    const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.75)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return (texCache.glow = t);
  }
  function sidingTex() {
    if (texCache.siding) return texCache.siding;
    const c = document.createElement('canvas'); c.width = 256; c.height = 256; const g = c.getContext('2d');
    g.fillStyle = '#D9D2C3'; g.fillRect(0, 0, 256, 256);
    g.strokeStyle = 'rgba(90,80,65,0.35)'; g.lineWidth = 1.2;
    for (let y = 8; y < 256; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); }
    // windows (tile = 10 ft wide x 12 ft tall)
    const win = (x, y, w, h) => { g.fillStyle = '#F4F1EA'; g.fillRect(x - 5, y - 5, w + 10, h + 10); g.fillStyle = '#6FA0C0'; g.fillRect(x, y, w, h); g.strokeStyle = '#F4F1EA'; g.lineWidth = 3; g.beginPath(); g.moveTo(x + w / 2, y); g.lineTo(x + w / 2, y + h); g.moveTo(x, y + h / 2); g.lineTo(x + w, y + h / 2); g.stroke(); g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(x, y, w * 0.45, h * 0.5); };
    win(52, 60, 56, 78); win(164, 60, 56, 78);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    return (texCache.siding = t);
  }
  function fenceTex() {
    if (texCache.fence) return texCache.fence;
    const c = document.createElement('canvas'); c.width = 128; c.height = 64; const g = c.getContext('2d');
    for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? '#8E6D45' : '#9C7A4F'; g.fillRect(i * 8, 0, 7, 64); g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(i * 8 + 7, 0, 1, 64); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return (texCache.fence = t);
  }
  const matCache = {};
  const std = (key, opts) => matCache[key] || (matCache[key] = new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.95, metalness: 0 }, opts)));

  // ======================= Geometry helpers =======================
  const ftPts = (el) => { const out = []; for (let i = 0; i < el.points.length; i += 2) out.push({ x: el.points[i] / pxPerFt, z: el.points[i + 1] / pxPerFt }); return out; };
  function shapeOf(pts) { const sh = new THREE.Shape(); pts.forEach((p, i) => (i ? sh.lineTo(p.x, -p.z) : sh.moveTo(p.x, -p.z))); sh.closePath(); return sh; }
  function slab(pts, top, base, topMat, sideMat) {
    const geo = new THREE.ExtrudeGeometry(shapeOf(pts), { depth: Math.max(0.02, top - base), bevelEnabled: false, curveSegments: 1 });
    geo.rotateX(-Math.PI / 2); geo.translate(0, base, 0);
    const m = new THREE.Mesh(geo, [topMat, sideMat || topMat]);
    m.receiveShadow = true; m.castShadow = top - base > 0.3; return m;
  }
  function dist2seg(px, pz, ax, az, bx, bz) {
    const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1e-9;
    let t = ((px - ax) * dx + (pz - az) * dz) / l2; t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (ax + t * dx), pz - (az + t * dz));
  }
  function sampleLine(pts, step) {
    const out = []; let carry = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], len = Math.hypot(b.x - a.x, b.z - a.z);
      let d = carry; while (d <= len) { const t = len ? d / len : 0; out.push({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t }); d += step; }
      carry = d - len;
    }
    return out;
  }
  function pointsObj(positions, colors, size, additive, opacity) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    if (colors) geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({ size, map: glowTex(), vertexColors: !!colors, transparent: true, depthWrite: false, sizeAttenuation: true, opacity: opacity == null ? 1 : opacity, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, alphaTest: 0.01 });
    if (!colors) mat.color.set('#fff');
    return new THREE.Points(geo, mat);
  }
  function labelSprite(text) {
    const c = document.createElement('canvas'); c.width = 128; c.height = 48; const g = c.getContext('2d');
    g.font = 'bold 28px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 6; g.strokeStyle = 'rgba(0,0,0,0.85)'; g.strokeText(text, 64, 24); g.fillStyle = '#fff'; g.fillText(text, 64, 24);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true }));
    s.scale.set(5, 1.9, 1); s.renderOrder = 10; return s;
  }

  // ======================= Building =======================
  function buildBuilding(el, g, info) {
    const pts = ftPts(el); const H = el.wallHeightFt || 12; const n = pts.length;
    if (n < 3) return;
    info.buildings.push({ pts, H });
    const wallMat = std('siding', { map: sidingTex(), side: THREE.DoubleSide, roughness: 0.9 });
    const roofMat = std('roof', { map: planTex('roof'), side: THREE.DoubleSide, roughness: 0.85 });
    // walls (per edge so window pattern lines up with real lengths)
    for (let i = 0; i < n; i++) {
      const a = pts[i], b = pts[(i + 1) % n]; const len = Math.hypot(b.x - a.x, b.z - a.z); if (len < 0.1) continue;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute([a.x, 0, a.z, b.x, 0, b.z, b.x, H, b.z, a.x, H, a.z], 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, len / 10, 0, len / 10, H / 12, 0, H / 12], 2));
      geo.setIndex([0, 1, 2, 0, 2, 3]); geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, wallMat); m.castShadow = true; m.receiveShadow = true; g.add(m);
    }
    if (n === 4) {
      // gable roof, ridge along the longer side
      const c = { x: (pts[0].x + pts[1].x + pts[2].x + pts[3].x) / 4, z: (pts[0].z + pts[1].z + pts[3].z + pts[2].z) / 4 };
      const e1 = { x: pts[1].x - pts[0].x, z: pts[1].z - pts[0].z }, e2 = { x: pts[3].x - pts[0].x, z: pts[3].z - pts[0].z };
      const l1 = Math.hypot(e1.x, e1.z), l2 = Math.hypot(e2.x, e2.z);
      const long = l1 >= l2 ? e1 : e2, ll = Math.max(l1, l2), sl = Math.min(l1, l2);
      const a = { x: long.x / ll, z: long.z / ll }, bv = { x: -a.z, z: a.x };
      const OH = 1.2, L = ll / 2 + OH, W = sl / 2 + OH, rise = Math.min(Math.max(sl * 0.22, 3), 9);
      const P = (u, w, y) => [c.x + a.x * u + bv.x * w, y, c.z + a.z * u + bv.z * w];
      const e0 = H - 0.3, rz = H + rise;
      const verts = [].concat(P(-L, -W, e0), P(L, -W, e0), P(L, 0, rz), P(-L, 0, rz), P(-L, W, e0), P(L, W, e0));
      const uv = [0, 0, L * 2, 0, L * 2, W, 0, W, 0, W * 2, L * 2, W * 2];
      // slopes: (0,1,2,3) and (3,2,5,4)
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      geo.setIndex([0, 1, 2, 0, 2, 3, 3, 2, 5, 3, 5, 4]); geo.computeVertexNormals();
      const roof = new THREE.Mesh(geo, roofMat); roof.castShadow = true; roof.receiveShadow = true; g.add(roof);
      // gable end triangles
      const tri = (i0, i1, i2) => { const gg = new THREE.BufferGeometry(); const pick = (i) => verts.slice(i * 3, i * 3 + 3); gg.setAttribute('position', new THREE.Float32BufferAttribute([].concat(pick(i0), pick(i1), pick(i2)), 3)); gg.computeVertexNormals(); const m = new THREE.Mesh(gg, std('gable', { color: '#CFC7B6', side: THREE.DoubleSide })); m.castShadow = true; g.add(m); };
      tri(0, 4, 3); tri(1, 5, 2);
      info.roofRise = rise;
    } else {
      const cap = new THREE.Mesh(new THREE.ShapeGeometry(shapeOf(pts)), roofMat);
      cap.rotation.x = -Math.PI / 2; cap.position.y = H + 0.1; cap.castShadow = true; cap.receiveShadow = true; g.add(cap);
    }
  }

  // ======================= Barriers =======================
  function buildBarrier(el, g, info) {
    const bt = CATP.BARRIER_TYPES.find((b) => b.key === el.subtype) || CATP.BARRIER_TYPES[0];
    const h = el.heightFt || bt.heightFt, t = el.thicknessFt || bt.thicknessFt; const pts = ftPts(el);
    info.barriers.push({ pts, h });
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], len = Math.hypot(b.x - a.x, b.z - a.z); if (len < 0.05) continue;
      let mat;
      if (el.subtype === 'fence') { const tx = fenceTex().clone(); tx.needsUpdate = true; tx.repeat.set(len / 8, 1); mat = new THREE.MeshStandardMaterial({ map: tx, roughness: 0.9 }); }
      else mat = std('wall-' + el.subtype, { color: bt.color, roughness: 1 });
      const m = new THREE.Mesh(new THREE.BoxGeometry(len + t, h, t), mat);
      m.position.set((a.x + b.x) / 2, h / 2, (a.z + b.z) / 2); m.rotation.y = -Math.atan2(b.z - a.z, b.x - a.x);
      m.castShadow = true; m.receiveShadow = true; g.add(m);
    }
  }

  // ======================= Plants =======================
  function blob(r, sx, sy, sz, mat, x, y, z, seed) {
    const geo = new THREE.IcosahedronGeometry(r, mat.wireframe ? 0 : 1);
    const m = new THREE.Mesh(geo, mat); m.scale.set(sx, sy, sz); m.position.set(x, y, z); m.rotation.set(seed * 1.3, seed * 2.1, 0);
    m.castShadow = true; m.receiveShadow = true; return m;
  }
  function isGreenish(c) { return c.g >= c.r * 0.95 && c.g >= c.b; }
  function seasonTint(plant) {
    const mo = state.month; const base = new THREE.Color(plant.color || '#4A7A3A');
    if (plant.evergreen) return { color: base, bare: false };
    if (mo >= 10 || mo <= 2) return { color: new THREE.Color('#6B5A48'), bare: plant.category === 'Tree' || plant.category === 'Shrub' };
    if (plant.category === 'Tree' || plant.category === 'Shrub') {
      const leaf = new THREE.Color(plant.category === 'Tree' ? '#4F8A3C' : '#5A9444');
      if (mo === 9) return { color: base, bare: false };                                                     // Oct: fall color
      if (mo === 8) return { color: leaf.clone().lerp(base, 0.5), bare: false };                             // Sep: turning
      if (mo === 3) return { color: leaf.clone().lerp(new THREE.Color('#B8D890'), 0.45), bare: false };     // Apr: new leaves
      return { color: leaf.clone().lerp(base, plant.color && /^#(?:[0-9a-f]{2})([0-9a-f]{2})/i.test(plant.color) && isGreenish(base) ? 0.6 : 0.2), bare: false };
    }
    return { color: base, bare: false };
  }
  function buildPlant(el, plant, g, info) {
    const gf = (CATP.GROWTH[state.growth] || CATP.GROWTH.mature)[plant.category] || 1;
    const h = Math.max(0.4, plant.heightFt * gf), w = Math.max(0.5, plant.spreadFt * gf), x = el.x / pxPerFt, z = el.y / pxPerFt;
    const grp = new THREE.Group(); grp.position.set(x, 0, z);
    const { color, bare } = seasonTint(plant);
    const seed = (x * 12.9898 + z * 78.233) % 6.28;
    let top = h, used = false;
    if (DPRO.plants3d) {
      try {
        const r = DPRO.plants3d.build(THREE, plant, { h, w, month: state.month, seed, night: state.night });
        grp.add(r.group); info.trunkH = Math.max(0.5, (r.trunkH || 0) * 1.05); top = r.top || h; used = true;
      } catch (err) { console.warn('plant model failed, using simple shape', err); }
    }
    if (!used) {
    const leafMat = bare ? new THREE.MeshStandardMaterial({ color: '#6B5A48', wireframe: true, roughness: 1 }) : new THREE.MeshStandardMaterial({ color: color.clone().multiplyScalar(0.9), flatShading: true, roughness: 0.9 });
    const leafMat2 = bare ? leafMat : new THREE.MeshStandardMaterial({ color: color.clone().offsetHSL(0.01, 0, 0.06), flatShading: true, roughness: 0.9 });
    if (plant.category === 'Tree') {
      const bark = std('bark', { color: '#5A4332' });
      if (plant.evergreen) {
        const tr = Math.max(0.08, w * 0.04), th = Math.max(0.5, h * 0.12);
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(tr * 0.8, tr, th, 6), bark); trunk.position.y = th / 2; trunk.castShadow = true; grp.add(trunk);
        const tiers = 4;
        for (let i = 0; i < tiers; i++) {
          const f = i / tiers; const rr = (w / 2) * (1 - f * 0.78), hh = (h - th) / tiers * 1.55;
          const cone = new THREE.Mesh(new THREE.ConeGeometry(rr, hh, 9), i % 2 ? leafMat2 : leafMat);
          cone.position.y = th + f * (h - th) + hh / 2 - (h - th) * 0.02; cone.castShadow = true; cone.receiveShadow = true; grp.add(cone);
        }
        info.trunkH = th;
      } else {
        const th = Math.max(0.8, h * 0.34), tr = Math.max(0.1, w * 0.028 + h * 0.006);
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(tr * 0.7, tr, th * 1.15, 7), bark); trunk.position.y = th * 0.575; trunk.castShadow = true; grp.add(trunk);
        const ch = h - th * 0.7;
        const spots = [[0, 0.5, 0, 0.5, 0.95], [0.28, 0.42, 0.1, 0.34, 0.7], [-0.27, 0.45, -0.1, 0.34, 0.72], [0.05, 0.4, -0.3, 0.32, 0.66], [-0.05, 0.38, 0.3, 0.3, 0.64], [0.0, 0.82, 0.0, 0.3, 0.62]];
        spots.forEach((s2, i) => { const b = blob(1, (w / 2) * s2[3] * 2 * 0.95, ch * s2[4] * 0.5, (w / 2) * s2[3] * 2 * 0.95, i % 2 ? leafMat2 : leafMat, s2[0] * w / 2, th * 0.7 + s2[1] * ch, s2[2] * w / 2, seed + i); if (bare) b.castShadow = false; grp.add(b); });
        info.trunkH = th;
      }
    } else if (plant.category === 'Shrub') {
      const n = 4;
      for (let i = 0; i < n; i++) { const a = seed + i * 1.9, off = i ? (w / 2) * 0.35 : 0; const b = blob(1, (w / 2) * (i ? 0.6 : 0.85), h * (i ? 0.38 : 0.5), (w / 2) * (i ? 0.6 : 0.85), i % 2 ? leafMat2 : leafMat, Math.cos(a) * off, h * (i ? 0.34 : 0.5), Math.sin(a) * off, seed + i); if (bare) b.castShadow = false; grp.add(b); }
    } else if (plant.category === 'Ornamental Grass') {
      const geo = new THREE.ConeGeometry(0.12, h, 4); geo.translate(0, h / 2, 0);
      const inst = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 0.9 }), 28); const dummy = new THREE.Object3D();
      for (let i = 0; i < 28; i++) { const a = seed + i * 2.399, rr = (w / 2) * 0.55 * Math.sqrt((i + 1) / 28); dummy.position.set(Math.cos(a) * rr, 0, Math.sin(a) * rr); dummy.rotation.set(Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35); dummy.scale.set(1, 0.7 + ((i * 37) % 10) / 25, 1); dummy.updateMatrix(); inst.setMatrixAt(i, dummy.matrix); }
      inst.castShadow = true; grp.add(inst);
    } else if (plant.category === 'Perennial') {
      for (let i = 0; i < 7; i++) { const a = seed + i * 2.2, rr = i ? (w / 2) * 0.5 : 0; const b = blob(1, w * 0.17, h * 0.45, w * 0.17, i % 2 ? leafMat2 : leafMat, Math.cos(a) * rr, h * 0.4, Math.sin(a) * rr, seed + i); grp.add(b); }
      const fl = new THREE.Mesh(new THREE.SphereGeometry(Math.max(0.12, w * 0.07), 8, 6), new THREE.MeshStandardMaterial({ color: plant.flowerColor || '#E8A0C8', roughness: 0.8 }));
      for (let i = 0; i < 5; i++) { const a = seed + i * 1.7, rr = (w / 2) * 0.45; const f = fl.clone(); f.position.set(Math.cos(a) * rr, h * 0.88, Math.sin(a) * rr); grp.add(f); }
    } else {
      const b = new THREE.Mesh(new THREE.CylinderGeometry(w / 2, w / 2, Math.max(0.15, h * 0.5), 14), leafMat); b.position.y = Math.max(0.15, h * 0.5) / 2; b.receiveShadow = true; grp.add(b);
      top = Math.max(0.3, h * 0.5);
    }
    }
    // holiday lights
    if (el.holiday && (el.holiday.trunk || el.holiday.canopy)) {
      const hex = (DPRO.light && DPRO.light.COLORS[el.holiday.color || 'warm'] || { hex: '#FFD08A' }).hex;
      const pos = [], base = new THREE.Color(hex);
      const th = info.trunkH || h * 0.3;
      if (el.holiday.trunk && plant.category === 'Tree') {
        const r = Math.max(0.12, w * 0.03 + 0.08), hh = Math.min(8, th * 0.95);
        for (let i = 0; i < 90; i++) { const f = i / 90; const a = f * Math.PI * 2 * (hh / 0.55); pos.push(Math.cos(a) * r, 0.4 + f * hh, Math.sin(a) * r); }
      }
      if (el.holiday.canopy) {
        const cb = th * 0.7, ch = h - cb; const cnt = Math.min(500, Math.round(60 + w * h * 0.5));
        for (let i = 0; i < cnt; i++) { const u = Math.acos(1 - 2 * ((i + 0.5) / cnt)), v = i * 2.39996; const rx = (w / 2) * 0.97, ry = ch * 0.5; pos.push(Math.sin(u) * Math.cos(v) * rx, cb + ch * 0.5 + Math.cos(u) * ry, Math.sin(u) * Math.sin(v) * rx); }
      }
      if (pos.length) {
        grp.add(pointsObj(pos, null, state.night ? 1.4 : 0.55, state.night, 1));
        grp.children[grp.children.length - 1].material.color.copy(base);
      }
    }
    if (state.labels) { const sp = labelSprite(plant.code || plant.name.slice(0, 3).toUpperCase()); sp.position.y = top + 2.2; grp.add(sp); }
    g.add(grp);
  }

  // ======================= Lighting =======================
  function mountHeight(x, z, info) {
    let best = null, bd = 3.2;
    info.buildings.forEach((b) => { const n = b.pts.length; for (let i = 0; i < n; i++) { const a = b.pts[i], c = b.pts[(i + 1) % n]; const d = dist2seg(x, z, a.x, a.z, c.x, c.z); if (d < bd) { bd = d; best = b.H - 0.15; } } });
    info.barriers.forEach((b) => { for (let i = 0; i < b.pts.length - 1; i++) { const d = dist2seg(x, z, b.pts[i].x, b.pts[i].z, b.pts[i + 1].x, b.pts[i + 1].z); if (d < Math.min(bd, 1.5)) { bd = d; best = b.h + 0.1; } } });
    return best;
  }
  function buildLightRun(el, g, info, budget) {
    const L = DPRO.light; if (!L) return;
    const prod = L.P(el.key); if (!prod) return;
    const col = L.colorOf(el, prod); const pts = ftPts(el);
    let step = prod.mode === 'perm' ? 0.5 : Math.max(0.3, (prod.spacingIn || 12) / 12);
    let total = 0; for (let i = 0; i < pts.length - 1; i++) total += Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].z - pts[i].z);
    if (total / step > budget) step = total / budget;
    const samples = sampleLine(pts, step);
    const pos = [], colors = [], cols = (col.multi || [col.hex]).map((h) => new THREE.Color(h));
    samples.forEach((s, i) => { const y = mountHeight(s.x, s.z, info); pos.push(s.x, y == null ? 1.0 : y, s.z); const c = cols[i % cols.length]; colors.push(c.r, c.g, c.b); });
    if (!pos.length) return;
    const wire = pts.map((p, i) => { const y = mountHeight(p.x, p.z, info); return new THREE.Vector3(p.x, y == null ? 1.0 : y, p.z); });
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(wire), new THREE.LineBasicMaterial({ color: state.night ? '#222' : '#555' })));
    const size = prod.mode === 'perm' ? (state.night ? 3.2 : 0.55) : (state.night ? 3.6 : 0.8);
    g.add(pointsObj(pos, colors, size, state.night, 1));
    if (state.night) g.add(pointsObj(pos, colors, size * 3.2, true, 0.18));
    info.litCount += samples.length;
  }
  function buildLightPoint(el, g, info) {
    const L = DPRO.light; if (!L) return;
    const prod = L.P(el.key); if (!prod) return;
    const col = L.colorOf(el, prod); const hex = col.hex; const night = state.night;
    const x = el.x / pxPerFt, z = el.y / pxPerFt; const grp = new THREE.Group(); grp.position.set(x, 0, z);
    const dark = std('fixture', { color: '#2B2B2B', roughness: 0.6, metalness: 0.4 });
    const glowPt = (y, size, alpha) => { const p = pointsObj([0, y, 0], null, size, night, alpha == null ? 1 : alpha); p.material.color.set(hex); grp.add(p); };
    const dirRad = ((el.rotationDeg || 0) * Math.PI) / 180;
    const pool = (r) => { if (!night) return; const m = new THREE.Mesh(new THREE.CircleGeometry(r, 32), new THREE.MeshBasicMaterial({ map: glowTex(), color: hex, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending })); m.rotation.x = -Math.PI / 2; m.position.y = 0.09; grp.add(m); };
    switch (prod.sym) {
      case 'path': { const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.7, 6), dark); pole.position.y = 0.85; pole.castShadow = true; grp.add(pole); const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.12, 0.28, 10), dark); cap.position.y = 1.78; grp.add(cap); glowPt(1.6, night ? 2.4 : 0.5); pool(prod.throwFt || 6); break; }
      case 'up': case 'well': case 'wash': {
        const b = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.35, 8), dark); b.position.y = 0.18; grp.add(b); glowPt(0.4, night ? 1.4 : 0.4);
        if (night && spots.length < 8 && prod.throwFt) {
          const sl = new THREE.SpotLight(hex, prod.sym === 'wash' ? 40 : 70, (prod.throwFt || 12) * 1.8, ((prod.beamDeg || 40) * Math.PI) / 360 + 0.12, 0.6, 1.2);
          sl.position.set(0, 0.4, 0); const tilt = prod.sym === 'wash' ? 0.6 : 1.1; sl.target.position.set(Math.cos(dirRad) * (prod.throwFt || 12) * 0.5, (prod.throwFt || 12) * tilt * 0.5 * (prod.sym === 'well' ? 1.6 : 1), Math.sin(dirRad) * (prod.throwFt || 12) * 0.5);
          sl.castShadow = false; grp.add(sl); grp.add(sl.target); spots.push(sl);
        }
        pool(prod.throwFt ? Math.min(prod.throwFt, 8) * 0.5 : 3); break; }
      case 'step': { const b = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.15), dark); b.position.y = 0.3; grp.add(b); glowPt(0.35, night ? 1.3 : 0.3); pool(3); break; }
      case 'wreath': { const hy = mountHeight(x, z, info) != null ? 6.5 : 3.8; const t = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.22, 8, 24), std('wreath', { color: '#2F6B3A', roughness: 1 })); t.position.y = hy; t.rotation.x = 0; grp.add(t); const dots = []; for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; dots.push(Math.cos(a) * 1.05, hy + Math.sin(a) * 1.05, 0.2); } const p = pointsObj(dots, null, night ? 0.9 : 0.35, night, 1); p.material.color.set(hex); grp.add(p); break; }
      case 'bow': { const hy = mountHeight(x, z, info) != null ? 6.5 : 3.8; const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.5), std('bow', { color: '#D9342B' })); m.position.y = hy; m.scale.set(1.4, 0.8, 0.5); grp.add(m); break; }
      case 'stakes': { const pos = [], cl = []; const cs = (col.multi || [hex]).map((h) => new THREE.Color(h)); for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; pos.push(Math.cos(a) * 1.4, 0.5, Math.sin(a) * 1.4); const c = cs[i % cs.length]; cl.push(c.r, c.g, c.b); } grp.add(pointsObj(pos, cl, night ? 1.8 : 0.7, night, 1)); break; }
      case 'proj': { const b = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.6), dark); b.position.y = 0.3; grp.add(b); glowPt(0.4, night ? 1.6 : 0.4); pool(10); break; }
      case 'outlet': { const b = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.9, 0.3), std('outlet', { color: '#1E6BFF' })); b.position.y = 0.6; grp.add(b); break; }
      case 'ctrl': case 'xfmr': { const b = new THREE.Mesh(new THREE.BoxGeometry(1, 1.2, 0.5), std('box-' + prod.sym, { color: prod.sym === 'xfmr' ? '#2B2B2B' : '#3A4A66' })); b.position.y = 0.6; b.castShadow = true; grp.add(b); break; }
      default: glowPt(0.5, night ? 1.4 : 0.4);
    }
    g.add(grp); info.litCount += 1;
  }

  // ======================= Irrigation =======================
  function buildIrrigation(g) {
    elements.forEach((el) => {
      if (el.type === 'head') {
        const cat = CATP.HEAD_CATALOG.find((h) => h.key === el.headKey) || {};
        const x = el.x / pxPerFt, z = el.y / pxPerFt, rad = typeof el.radiusFt === 'number' ? el.radiusFt : (cat.defaultRadiusFt || 8);
        const col = cat.color || '#2E6FA6';
        const b = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.3, 8), new THREE.MeshStandardMaterial({ color: col })); b.position.set(x, 0.18, z); g.add(b);
        const arc = el.arc == null ? 360 : el.arc, rot = el.rotationDeg || 0;
        const geo = arc >= 359 ? new THREE.CircleGeometry(rad, 40) : new THREE.CircleGeometry(rad, 32, (-(rot + arc) * Math.PI) / 180, (arc * Math.PI) / 180);
        const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.28, depthWrite: false, side: THREE.DoubleSide }));
        m.rotation.x = -Math.PI / 2; m.position.set(x, 0.22, z); g.add(m);
      } else if (el.type === 'pipe') {
        const pts = ftPts(el).map((p) => new THREE.Vector3(p.x, 0.2, p.z));
        g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: el.subtype === 'mainline' ? '#C0392B' : '#2E6FA6' })));
      }
    });
  }

  // ======================= Scene assembly =======================
  const LIFT = { lawn: 0.06, turf: 0.06, bed: 0.16, hardscape: 0.12, driveway: 0.12, pavers: 0.13, flagstone: 0.13, gravel: 0.1, deck: 0.7, water: 0.14 };
  const SURF = { lawn: 'lawn', turf: 'turf', hardscape: 'conc', driveway: 'conc', pavers: 'pavers', flagstone: 'pavers', gravel: 'gravel', deck: 'deck', water: 'water' };
  function computeBounds() {
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9, tall = 0;
    const add = (x, z) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); };
    elements.forEach((e) => {
      if (e.points) for (let i = 0; i < e.points.length; i += 2) add(e.points[i] / pxPerFt, e.points[i + 1] / pxPerFt);
      else if (typeof e.x === 'number') {
        let rr = 0; if (e.type === 'plant') { const pl = CATP.PLANT_CATALOG.find((p) => p.key === e.plantKey); if (pl) { rr = pl.spreadFt / 2; tall = Math.max(tall, pl.heightFt * ((CATP.GROWTH[state.growth] || CATP.GROWTH.mature)[pl.category] || 1)); } }
        add(e.x / pxPerFt - rr, e.y / pxPerFt - rr); add(e.x / pxPerFt + rr, e.y / pxPerFt + rr);
      }
    });
    if (x0 > x1) { x0 = -30; x1 = 30; z0 = -30; z1 = 30; }
    bounds = { cx: (x0 + x1) / 2, cz: (z0 + z1) / 2, r: Math.max(20, Math.hypot(x1 - x0, z1 - z0) / 2, tall * 0.85), x0, x1, z0, z1 };
  }
  function buildScene() {
    if (root) { scene.remove(root); root.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); }
    spots.forEach((s) => { if (s.parent) s.parent.remove(s); }); spots = [];
    root = new THREE.Group(); scene.add(root);
    const info = { buildings: [], barriers: [], litCount: 0 };
    let idx = 0;
    // surfaces first, then buildings/barriers (mounting heights), then plants, then lights
    elements.forEach((el) => {
      if (el.type !== 'area' || !el.points || el.points.length < 6) return;
      idx++;
      if (el.subtype === 'building') return;
      const pts = ftPts(el);
      if (el.subtype === 'boundary') { const ln = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts.map((p) => new THREE.Vector3(p.x, 0.2, p.z))), new THREE.LineBasicMaterial({ color: '#E5E5E5' })); root.add(ln); return; }
      const top = (LIFT[el.subtype] || 0.1) + idx * 0.0008;
      let topMat;
      if (el.subtype === 'bed') topMat = std('bed-' + (el.surface || 'bark'), { map: planTex({ rock: 'rock', soil: 'soil' }[el.surface] || 'bark'), roughness: 1 });
      else if (SURF[el.subtype]) topMat = el.subtype === 'water' ? new THREE.MeshStandardMaterial({ map: planTex('water'), roughness: 0.15, metalness: 0.25, transparent: true, opacity: 0.88 }) : std('surf-' + el.subtype, { map: planTex(SURF[el.subtype]) });
      else topMat = std('surf-default', { color: '#B5B0A0' });
      const side = el.subtype === 'deck' ? std('deck-side', { color: '#6B4A2A' }) : std('slab-side', { color: '#6F6F68' });
      root.add(slab(pts, top, el.subtype === 'deck' ? 0 : 0, topMat, side));
    });
    elements.forEach((el) => { if (el.type === 'area' && el.subtype === 'building') buildBuilding(el, root, info); });
    elements.forEach((el) => { if (el.type === 'barrier' && el.points) buildBarrier(el, root, info); });
    elements.forEach((el) => { if (el.type === 'plant') { const pl = CATP.PLANT_CATALOG.find((p) => p.key === el.plantKey); if (pl) buildPlant(el, pl, root, info); } });
    if (state.irrigation) buildIrrigation(root);
    let budget = 6000;
    elements.forEach((el) => { if (el.type === 'lightrun' && el.points) { buildLightRun(el, root, info, Math.max(300, budget / 4)); } });
    elements.forEach((el) => { if (el.type === 'lightpoint') buildLightPoint(el, root, info); });
    computeBounds();
    const sc = sun.shadow.camera, R = bounds.r * 1.25;
    sc.left = -R; sc.right = R; sc.top = R; sc.bottom = -R; sc.near = 1; sc.far = bounds.r * 8 + 400; sc.updateProjectionMatrix();
    applySun(); fixFrames = 1;
    const msg = $('d3-msg');
    if (msg) msg.textContent = elements.length ? '' : 'The plan is empty. Draw something in the editor, then open 3D again.';
  }

  // ======================= Camera / controls =======================
  function setView(name) {
    state.view = name; walk.keys = {};
    modal.querySelectorAll('[data-view]').forEach((b) => b.classList.toggle('on', b.dataset.view === name));
    $('d3-pad').classList.toggle('show', name === 'walk');
    state.mode = name === 'walk' ? 'walk' : 'orbit';
    cam.tx = bounds.cx; cam.tz = bounds.cz; cam.ty = 0;
    // distance that just fits the design in the frame (works for wide and tall screens), so it opens close, not far away
    const asp = camera && camera.aspect ? camera.aspect : 1.6, fit = (bounds.r * 1.08) / (Math.tan((48 / 2) * Math.PI / 180) * Math.min(1, asp * 1.05));
    const kk = asp >= 1.2 ? 0.64 : 0.64 + (0.98 - 0.64) * Math.min(1, (1.2 - asp) / 0.7); // tall/narrow screens need more room
    if (name === 'aerial') { cam.theta = 0.55; cam.phi = 0.95; cam.radius = fit * kk + 7; cam.ty = 1.5; }
    else if (name === 'top') { cam.theta = 0; cam.phi = 0.03; cam.radius = fit * (kk + 0.06) + 7; }
    else if (name === 'front') { cam.theta = 0; cam.phi = 1.38; cam.radius = fit * (kk + 0.06) + 7; cam.ty = 4; }
    else if (name === 'walk') { walk.x = bounds.cx; walk.z = bounds.z1 - Math.min(10, (bounds.z1 - bounds.z0) * 0.15); walk.yaw = 0; walk.pitch = -0.05; }
    updateCamera();
  }
  function updateCamera() {
    if (!camera) return;
    if (state.mode === 'walk') {
      camera.position.set(walk.x, 5.6, walk.z);
      camera.lookAt(walk.x + Math.sin(walk.yaw) * Math.cos(walk.pitch), 5.6 + Math.sin(walk.pitch), walk.z - Math.cos(walk.yaw) * Math.cos(walk.pitch));
    } else {
      const sp = Math.sin(cam.phi), r = cam.radius;
      camera.position.set(cam.tx + r * sp * Math.sin(cam.theta), cam.ty + r * Math.cos(cam.phi), cam.tz + r * sp * Math.cos(cam.theta));
      camera.lookAt(cam.tx, cam.ty, cam.tz);
    }
    dirty = true;
  }
  function bindPointer(el) {
    const ptrs = new Map(); let last = null;
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    el.addEventListener('pointerdown', (e) => { el.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY, btn: e.button, shift: e.shiftKey }); last = null; });
    el.addEventListener('pointerup', (e) => { ptrs.delete(e.pointerId); last = null; });
    el.addEventListener('pointercancel', (e) => { ptrs.delete(e.pointerId); last = null; });
    el.addEventListener('pointermove', (e) => {
      const p = ptrs.get(e.pointerId); if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      if (ptrs.size === 2) {
        const [a, b] = [...ptrs.values()]; const d0 = Math.hypot(a.x - b.x, a.y - b.y); const mid0 = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        p.x = e.clientX; p.y = e.clientY; const d1 = Math.hypot(a.x - b.x, a.y - b.y); const mid1 = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        if (state.mode === 'orbit') { if (d0 > 0) cam.radius = Math.max(8, Math.min(bounds.r * 8, cam.radius * (d0 / Math.max(1, d1)))); panBy(mid1.x - mid0.x, mid1.y - mid0.y); updateCamera(); }
        return;
      }
      p.x = e.clientX; p.y = e.clientY;
      if (state.mode === 'walk') { walk.yaw += dx * 0.005; walk.pitch = Math.max(-1.2, Math.min(1.2, walk.pitch - dy * 0.005)); updateCamera(); return; }
      if (p.btn === 2 || p.btn === 1 || p.shift) panBy(dx, dy);
      else { cam.theta -= dx * 0.006; cam.phi = Math.max(0.03, Math.min(1.54, cam.phi - dy * 0.005)); }
      updateCamera();
    });
    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (state.mode === 'walk') { moveWalk(-e.deltaY * 0.02, 0); return; }
      cam.radius = Math.max(8, Math.min(bounds.r * 8, cam.radius * Math.exp(e.deltaY * 0.0012))); updateCamera();
    }, { passive: false });
  }
  function panBy(dx, dy) {
    const k = cam.radius * 0.0016;
    const rx = Math.cos(cam.theta), rz = -Math.sin(cam.theta), fx = -Math.sin(cam.theta), fz = -Math.cos(cam.theta);
    cam.tx -= rx * dx * k - fx * dy * k; cam.tz -= rz * dx * k - fz * dy * k;
  }
  function moveWalk(fwd, side) {
    const fx = Math.sin(walk.yaw), fz = -Math.cos(walk.yaw), rx = Math.cos(walk.yaw), rz = Math.sin(walk.yaw);
    walk.x += fx * fwd + rx * side; walk.z += fz * fwd + rz * side; updateCamera();
  }
  let lastT = 0, fixFrames = 0;
  function tick(t) {
    raf = open ? requestAnimationFrame(tick) : 0;
    const dt = Math.min(0.1, (t - lastT) / 1000 || 0); lastT = t;
    if (state.mode === 'walk' && renderer) {
      const k = walk.keys; const f = (k.w || k.arrowup ? 1 : 0) - (k.s || k.arrowdown ? 1 : 0), sd = (k.d ? 1 : 0) - (k.a ? 1 : 0);
      const turn = (k.arrowright ? 1 : 0) - (k.arrowleft ? 1 : 0);
      if (turn) { walk.yaw += turn * dt * 1.6; updateCamera(); }
      if (f || sd) moveWalk(f * dt * 9, sd * dt * 9);
    }
    if (dirty && renderer) {
      dirty = false; renderer.render(scene, camera);
      if (fixFrames > 0) { // after the scene is rebuilt, refresh shaders once so every plant/leaf shows up (lights change between day and night)
        fixFrames -= 1; scene.traverse((o) => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { m.needsUpdate = true; }); });
        dirty = true;
      }
    }
  }
  function onKey(e, down) {
    if (!open) return;
    if (down && e.key === 'Escape') { close(); return; }
    if (/INPUT|SELECT|TEXTAREA/.test((e.target.tagName || ''))) return;
    walk.keys[e.key.toLowerCase()] = down;
    if (state.mode === 'walk' && /^arrow/i.test(e.key)) e.preventDefault();
  }
  window.addEventListener('keydown', (e) => onKey(e, true));
  window.addEventListener('keyup', (e) => onKey(e, false));

  // ======================= Open / close =======================
  function resize() {
    if (!renderer) return;
    const w = $('d3-wrap'); const W = w.clientWidth, H = w.clientHeight; if (!W || !H) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.updateProjectionMatrix(); dirty = true;
  }
  function init() {
    if (renderer) return;
    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    $('d3-wrap').insertBefore(renderer.domElement, $('d3-wrap').firstChild);
    scene = new THREE.Scene(); scene.fog = new THREE.Fog('#9CCBF0', 300, 1400);
    camera = new THREE.PerspectiveCamera(48, 1, 0.5, 3000);
    hemi = new THREE.HemisphereLight('#CFE3FF', '#6B7A55', 1.6); scene.add(hemi);
    sun = new THREE.DirectionalLight('#FFF4E0', 3); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.05;
    scene.add(sun); scene.add(sun.target);
    ground = new THREE.Mesh(new THREE.CircleGeometry(900, 48), new THREE.MeshStandardMaterial({ color: '#86A76F', roughness: 1 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -0.03; ground.receiveShadow = true; scene.add(ground);
    bindPointer(renderer.domElement);
    ro = new ResizeObserver(resize); ro.observe($('d3-wrap'));
  }
  function openView() {
    if (open) return;
    open = true; modal.hidden = false; $('d3-loading').hidden = false; $('d3-loading').textContent = 'Building the 3D model...';
    state.night = !!DPRO.extras.night; state.labels = false; state.irrigation = false;
    syncButtons();
    loadThree().then(() => {
      init(); resize();
      computeBounds(); buildScene(); setView('aerial'); resize();
      $('d3-loading').hidden = true; dirty = true;
      if (!raf) raf = requestAnimationFrame(tick);
    }).catch((err) => { $('d3-loading').textContent = err.message || 'The 3D view could not start on this device.'; });
  }
  function close() { open = false; modal.hidden = true; if (raf) cancelAnimationFrame(raf); raf = 0; walk.keys = {}; }
  function syncButtons() {
    $('d3-night').classList.toggle('on', state.night); $('d3-labels').classList.toggle('on', state.labels); $('d3-irr').classList.toggle('on', state.irrigation);
    modal.querySelectorAll('[data-growth]').forEach((b) => b.classList.toggle('on', b.dataset.growth === state.growth));
    $('d3-month').value = String(state.month); $('d3-hour').value = String(state.hour);
  }
  function snapshot() { if (!renderer) return null; renderer.render(scene, camera); return renderer.domElement.toDataURL('image/png'); }
  function download() {
    const url = snapshot(); if (!url) return;
    const a = document.createElement('a'); a.href = url;
    const nm = (($('design-name-input') && $('design-name-input').value) || 'design').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') || 'design';
    a.download = nm + '-3D.png'; document.body.appendChild(a); a.click(); a.remove();
  }

  // ======================= Wire up UI =======================
  $('d3-close').addEventListener('click', close);
  $('d3-save').addEventListener('click', download);
  modal.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));
  modal.querySelectorAll('[data-growth]').forEach((b) => b.addEventListener('click', () => { state.growth = b.dataset.growth; syncButtons(); buildScene(); }));
  $('d3-month').addEventListener('change', (e) => { state.month = Number(e.target.value); buildScene(); });
  $('d3-hour').addEventListener('input', (e) => { state.hour = Number(e.target.value); applySun(); });
  $('d3-night').addEventListener('click', () => { state.night = !state.night; syncButtons(); buildScene(); });
  $('d3-labels').addEventListener('click', () => { state.labels = !state.labels; syncButtons(); buildScene(); });
  $('d3-irr').addEventListener('click', () => { state.irrigation = !state.irrigation; syncButtons(); buildScene(); });
  modal.querySelectorAll('#d3-pad [data-k]').forEach((b) => {
    const k = b.dataset.k;
    const on = (e) => { e.preventDefault(); walk.keys[k] = true; }, off = () => { walk.keys[k] = false; };
    b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointerleave', off); b.addEventListener('pointercancel', off);
  });
  // the pad uses WASD semantics for left/right turn on phones: turn with a/d is strafe; add turning via drag.
  const topbar = document.querySelector('.design-editor-topbar');
  if (topbar && !$('btn-design-3d')) {
    const b = document.createElement('button'); b.className = 'btn btn-ghost'; b.id = 'btn-design-3d'; b.type = 'button'; b.textContent = '3D view';
    const printBtn = $('btn-design-print'); topbar.insertBefore(b, printBtn || null);
    b.addEventListener('click', openView);
  }
  // Render a picture without showing the 3D window (used for customer presentations).
  // opts: { view: 'aerial'|'front'|'top', growth, night, month, hour, w, h } -> JPEG data URL
  async function capture(opts) {
    opts = opts || {};
    await loadThree(); init();
    const prev = Object.assign({}, state); const wasOpen = open;
    const W = opts.w || 1400, H = opts.h || 860;
    try {
      state.growth = opts.growth || 'mature'; state.night = !!opts.night; state.month = opts.month == null ? 5 : opts.month; state.hour = opts.hour == null ? 16 : opts.hour;
      state.labels = !!opts.labels; state.irrigation = false;
      computeBounds(); buildScene();
      renderer.setPixelRatio(1); renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix();
      setView(opts.view || 'aerial');
      renderer.render(scene, camera);
      return renderer.domElement.toDataURL('image/jpeg', 0.88);
    } finally {
      Object.assign(state, prev);
      if (scene) { buildScene(); setView(state.view); }
      if (wasOpen) resize();
    }
  }
  DPRO.threeD = { open: openView, close, snapshot, capture, setView, state, rebuild: () => { if (scene) buildScene(); }, get ready() { return !!renderer; }, get scene() { return scene; } };
})();
