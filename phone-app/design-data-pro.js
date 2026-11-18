// ============================================================================
// Extra catalog data for the "pro" design upgrade (design-pro.js).
// Loads right after design-data.js and ADDS to the same catalog object, so
// nothing in the original files needs to change. Plain static data.
// ============================================================================
(function () {
  const CAT = window.DESIGN_CATALOG;
  if (!CAT || CAT.__pro) return;
  CAT.__pro = true;

  // ---- More surfaces / site areas (drawn as polygons like the originals) ----
  const extraAreas = [
    { key: 'building', name: 'Building / House', fill: '#D9D4CB', stroke: '#2B2B2B', strokeWidth: 3 },
    { key: 'driveway', name: 'Driveway / Concrete', fill: 'rgba(185,185,180,0.6)', stroke: '#85857F' },
    { key: 'pavers', name: 'Pavers', fill: 'rgba(176,150,128,0.6)', stroke: '#8A7A6A' },
    { key: 'gravel', name: 'Gravel / Rock', fill: 'rgba(170,165,150,0.6)', stroke: '#7D7868' },
    { key: 'deck', name: 'Deck', fill: 'rgba(160,115,70,0.6)', stroke: '#6B4A2A' },
    { key: 'turf', name: 'Artificial Turf', fill: 'rgba(95,170,70,0.6)', stroke: '#3F7A2E' },
  ];
  extraAreas.forEach((p) => { if (!CAT.AREA_PRESETS.find((x) => x.key === p.key)) CAT.AREA_PRESETS.push(p); });

  // ---- Wall / fence types (drawn as thick lines) ----
  CAT.BARRIER_TYPES = [
    { key: 'wall', name: 'Retaining / Stone Wall', color: '#8A8A84', thicknessFt: 1.5, heightFt: 3 },
    { key: 'fence', name: 'Fence', color: '#8B6B43', thicknessFt: 0.4, heightFt: 6 },
    { key: 'curb', name: 'Edging / Curb', color: '#6F6F6A', thicknessFt: 0.5, heightFt: 0.5 },
  ];

  // ---- How big plants are at different ages, as a fraction of mature
  // spread. Typical nursery-stock installs; real growth varies a lot with
  // site, water and variety, so this is a planning picture, not a promise. ----
  CAT.GROWTH = {
    install: { Tree: 0.25, Shrub: 0.4, Perennial: 0.5, 'Ornamental Grass': 0.5, Groundcover: 0.3 },
    yr3:     { Tree: 0.4,  Shrub: 0.75, Perennial: 1, 'Ornamental Grass': 1, Groundcover: 0.7 },
    yr5:     { Tree: 0.55, Shrub: 1, Perennial: 1, 'Ornamental Grass': 1, Groundcover: 1 },
    mature:  { Tree: 1, Shrub: 1, Perennial: 1, 'Ornamental Grass': 1, Groundcover: 1 },
  };
  CAT.GROWTH_LABELS = { install: 'At install', yr3: 'Year 3', yr5: 'Year 5', mature: 'Mature' };

  // ---- Short plant codes for the plan + schedule (e.g. Norway Maple -> NM) ----
  const EVERGREEN_RE = /spruce|pine|juniper|fir\b|cedar|arborvitae|yew|boxwood|oregon grape|kinnikinnick/i;
  const used = new Set();
  CAT.PLANT_CATALOG.forEach((p) => {
    const words = p.name.replace(/\([^)]*\)/g, ' ').replace(/['"]/g, '').split(/[^A-Za-z]+/).filter(Boolean);
    const cands = [];
    if (words.length === 1) cands.push(words[0].slice(0, 3).toUpperCase());
    else {
      cands.push(words.map((w) => w[0]).join('').toUpperCase().slice(0, 3));
      cands.push((words[0].slice(0, 2) + words[1][0]).toUpperCase());
      cands.push((words[0][0] + words[1].slice(0, 2)).toUpperCase());
    }
    cands.push(p.key.slice(0, 3).toUpperCase());
    let code = cands.find((c) => c.length >= 2 && !used.has(c));
    if (!code) { let n = 2; code = cands[0] + n; while (used.has(code)) { n += 1; code = cands[0] + n; } }
    used.add(code);
    p.code = code;
    p.evergreen = EVERGREEN_RE.test(p.name);
  });
})();
