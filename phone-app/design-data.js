// ============================================================================
// Site Design catalog data — plants + irrigation equipment.
// Pure static data, no build step, loaded via <script> tag like the rest of
// this app. Nothing here calls out to any service; it's all hand-entered
// reference data you can edit directly in this file.
//
// Irrigation figures (radius/GPM) are the manufacturers' typical published
// values at a standard operating pressure -- real coverage depends on your
// actual static pressure and nozzle choice, so treat them as sensible
// defaults and adjust per-head in the editor when you know better numbers
// for a given job.
// ============================================================================

const PLANT_CATEGORIES = ['Tree', 'Shrub', 'Perennial', 'Ornamental Grass', 'Groundcover'];

// sun: 'full' | 'partial' | 'shade'   water: 'low' | 'moderate' | 'high'
// spreadFt is the mature width, used to size the symbol to scale on canvas.
const PLANT_CATALOG = [
  // ---- Trees ----
  { key: 'norway-maple', name: 'Norway Maple', category: 'Tree', sun: 'full', water: 'moderate', heightFt: 40, spreadFt: 35, color: '#3F6B3A' },
  { key: 'autumn-blaze-maple', name: 'Autumn Blaze Maple', category: 'Tree', sun: 'full', water: 'moderate', heightFt: 50, spreadFt: 40, color: '#B04A2A' },
  { key: 'honeylocust', name: 'Honeylocust (thornless)', category: 'Tree', sun: 'full', water: 'low', heightFt: 45, spreadFt: 35, color: '#5C7A3A' },
  { key: 'colorado-blue-spruce', name: 'Colorado Blue Spruce', category: 'Tree', sun: 'full', water: 'moderate', heightFt: 60, spreadFt: 20, color: '#5C7F8C' },
  { key: 'austrian-pine', name: 'Austrian Pine', category: 'Tree', sun: 'full', water: 'low', heightFt: 50, spreadFt: 30, color: '#39563B' },
  { key: 'quaking-aspen', name: 'Quaking Aspen', category: 'Tree', sun: 'full', water: 'moderate', heightFt: 40, spreadFt: 20, color: '#7C9A4A' },
  { key: 'flowering-crabapple', name: 'Flowering Crabapple', category: 'Tree', sun: 'full', water: 'moderate', heightFt: 20, spreadFt: 20, color: '#C97CA0' },
  { key: 'serviceberry', name: 'Serviceberry', category: 'Tree', sun: 'partial', water: 'moderate', heightFt: 20, spreadFt: 15, color: '#8AA35B' },

  // ---- Shrubs ----
  { key: 'green-mountain-boxwood', name: "'Green Mountain' Boxwood", category: 'Shrub', sun: 'partial', water: 'moderate', heightFt: 4, spreadFt: 3, color: '#3E5C33' },
  { key: 'burning-bush', name: 'Burning Bush', category: 'Shrub', sun: 'full', water: 'moderate', heightFt: 8, spreadFt: 8, color: '#A6342A' },
  { key: 'blue-mist-spirea', name: 'Blue Mist Spirea', category: 'Shrub', sun: 'full', water: 'low', heightFt: 3, spreadFt: 3, color: '#5C6FA6' },
  { key: 'lilac', name: 'Common Lilac', category: 'Shrub', sun: 'full', water: 'low', heightFt: 12, spreadFt: 10, color: '#8C6FA6' },
  { key: 'rose-of-sharon', name: 'Rose of Sharon', category: 'Shrub', sun: 'full', water: 'moderate', heightFt: 10, spreadFt: 6, color: '#A65C8C' },
  { key: 'potentilla', name: 'Potentilla', category: 'Shrub', sun: 'full', water: 'low', heightFt: 3, spreadFt: 3, color: '#C9A63E' },
  { key: 'dwarf-korean-lilac', name: 'Dwarf Korean Lilac', category: 'Shrub', sun: 'full', water: 'low', heightFt: 5, spreadFt: 5, color: '#9C7FB0' },
  { key: 'arborvitae-emerald', name: "'Emerald Green' Arborvitae", category: 'Shrub', sun: 'full', water: 'moderate', heightFt: 12, spreadFt: 4, color: '#2E5233' },
  { key: 'juniper-blue-rug', name: "'Blue Rug' Juniper", category: 'Shrub', sun: 'full', water: 'low', heightFt: 1, spreadFt: 6, color: '#4F7A8C' },
  { key: 'red-twig-dogwood', name: 'Red Twig Dogwood', category: 'Shrub', sun: 'partial', water: 'moderate', heightFt: 7, spreadFt: 7, color: '#A6402E' },

  // ---- Perennials ----
  { key: 'russian-sage', name: 'Russian Sage', category: 'Perennial', sun: 'full', water: 'low', heightFt: 3, spreadFt: 3, color: '#8C8FBF' },
  { key: 'black-eyed-susan', name: 'Black-Eyed Susan', category: 'Perennial', sun: 'full', water: 'moderate', heightFt: 2, spreadFt: 1.5, color: '#D6A62E' },
  { key: 'daylily', name: 'Daylily', category: 'Perennial', sun: 'full', water: 'moderate', heightFt: 2, spreadFt: 2, color: '#D67A2E' },
  { key: 'coneflower', name: 'Purple Coneflower', category: 'Perennial', sun: 'full', water: 'low', heightFt: 3, spreadFt: 1.5, color: '#A6529C' },
  { key: 'sedum-autumn-joy', name: "'Autumn Joy' Sedum", category: 'Perennial', sun: 'full', water: 'low', heightFt: 2, spreadFt: 1.5, color: '#B0637C' },
  { key: 'lavender', name: 'English Lavender', category: 'Perennial', sun: 'full', water: 'low', heightFt: 2, spreadFt: 2, color: '#7C6FA6' },
  { key: 'hosta', name: 'Hosta', category: 'Perennial', sun: 'shade', water: 'moderate', heightFt: 1.5, spreadFt: 2, color: '#4F7A4F' },
  { key: 'peony', name: 'Peony', category: 'Perennial', sun: 'full', water: 'moderate', heightFt: 2.5, spreadFt: 2.5, color: '#C96F9C' },
  { key: 'catmint', name: "'Walker's Low' Catmint", category: 'Perennial', sun: 'full', water: 'low', heightFt: 1.5, spreadFt: 2, color: '#7A8FBF' },

  // ---- Ornamental Grasses ----
  { key: 'karl-foerster', name: "'Karl Foerster' Feather Reed Grass", category: 'Ornamental Grass', sun: 'full', water: 'moderate', heightFt: 5, spreadFt: 2, color: '#B0A64F' },
  { key: 'blue-oat-grass', name: 'Blue Oat Grass', category: 'Ornamental Grass', sun: 'full', water: 'low', heightFt: 2.5, spreadFt: 2, color: '#7A9CA6' },
  { key: 'fountain-grass', name: 'Fountain Grass', category: 'Ornamental Grass', sun: 'full', water: 'moderate', heightFt: 3, spreadFt: 3, color: '#B08F5C' },

  // ---- Groundcover ----
  { key: 'creeping-thyme', name: 'Creeping Thyme', category: 'Groundcover', sun: 'full', water: 'low', heightFt: 0.25, spreadFt: 1.5, color: '#7A9C6F' },
  { key: 'vinca-minor', name: 'Vinca Minor', category: 'Groundcover', sun: 'shade', water: 'moderate', heightFt: 0.5, spreadFt: 2, color: '#3E6F5C' },
  { key: 'sedum-groundcover', name: 'Sedum Groundcover Mix', category: 'Groundcover', sun: 'full', water: 'low', heightFt: 0.3, spreadFt: 1.5, color: '#8FA65C' },
  { key: 'sweet-woodruff', name: 'Sweet Woodruff', category: 'Groundcover', sun: 'shade', water: 'moderate', heightFt: 0.5, spreadFt: 1.5, color: '#4F8C5C' },
];

// ---------------------------------------------------------------------------
// Irrigation equipment catalog
// ---------------------------------------------------------------------------
// kind: 'rotor' | 'spray' | 'drip' | 'bubbler'
// radiusFt: [min, max] adjustable range   arc: default arc in degrees (360 = full circle)
// gpmFull: flow at full-circle/360°, typical published value at nominal pressure
const HEAD_CATALOG = [
  // ---- Rotors (large-area, low precipitation rate, use on lawns > ~18ft across) ----
  { key: 'rainbird-5000', brand: 'Rain Bird', model: '5000 Plus', kind: 'rotor', radiusFt: [25, 50], defaultRadiusFt: 35, arc: 360, gpmFull: 3.5, color: '#2E6FA6' },
  { key: 'rainbird-8005', brand: 'Rain Bird', model: '8005', kind: 'rotor', radiusFt: [30, 65], defaultRadiusFt: 45, arc: 360, gpmFull: 5.5, color: '#2E6FA6' },
  { key: 'hunter-pgp-ultra', brand: 'Hunter', model: 'PGP Ultra', kind: 'rotor', radiusFt: [24, 50], defaultRadiusFt: 35, arc: 360, gpmFull: 4.0, color: '#2E8C6F' },
  { key: 'hunter-i20', brand: 'Hunter', model: 'I-20', kind: 'rotor', radiusFt: [26, 46], defaultRadiusFt: 38, arc: 360, gpmFull: 4.8, color: '#2E8C6F' },
  { key: 'toro-570z-rotor', brand: 'Toro', model: 'T5 Rotor', kind: 'rotor', radiusFt: [26, 55], defaultRadiusFt: 40, arc: 360, gpmFull: 4.5, color: '#A65C2E' },

  // ---- Sprays (small/odd-shaped areas, higher precipitation rate, radius ~4-15ft) ----
  { key: 'rainbird-1800', brand: 'Rain Bird', model: '1800 Series', kind: 'spray', radiusFt: [4, 15], defaultRadiusFt: 10, arc: 360, gpmFull: 2.0, color: '#4F9FD6' },
  { key: 'hunter-pro-spray', brand: 'Hunter', model: 'Pro-Spray', kind: 'spray', radiusFt: [4, 15], defaultRadiusFt: 10, arc: 360, gpmFull: 2.1, color: '#4FBF9F' },
  { key: 'toro-570z-spray', brand: 'Toro', model: '570Z Spray', kind: 'spray', radiusFt: [4, 17], defaultRadiusFt: 10, arc: 360, gpmFull: 2.0, color: '#D68F4F' },

  // ---- Drip / micro ----
  { key: 'rainbird-xfs-dripline', brand: 'Rain Bird', model: 'XFS Dripline (0.9 GPH/emitter)', kind: 'drip', radiusFt: [0, 0], defaultRadiusFt: 0, arc: 0, gpmFull: 0, color: '#8C6F3E', gph: 0.9 },
  { key: 'netafim-techline', brand: 'Netafim', model: 'Techline CV', kind: 'drip', radiusFt: [0, 0], defaultRadiusFt: 0, arc: 0, gpmFull: 0, color: '#8C6F3E', gph: 0.9 },

  // ---- Bubblers (trees / individual root zones) ----
  { key: 'rainbird-1401-bubbler', brand: 'Rain Bird', model: '1401 Bubbler', kind: 'bubbler', radiusFt: [1, 1], defaultRadiusFt: 1, arc: 360, gpmFull: 1.0, color: '#5C8CA6' },
];

// Non-head irrigation symbols placed as single points.
const FIXTURE_CATALOG = [
  { key: 'valve', name: 'Zone Valve', color: '#B0632E' },
  { key: 'controller', name: 'Controller', color: '#4F4F8C' },
  { key: 'backflow', name: 'Backflow Preventer', color: '#A62E2E' },
  { key: 'point-of-connection', name: 'Point of Connection', color: '#2E7A5C' },
  { key: 'rain-sensor', name: 'Rain/Freeze Sensor', color: '#5C8CA6' },
];

// Site/hardscape polygon presets -- these just set a default fill/label,
// you can still rename or recolor any shape after placing it.
const AREA_PRESETS = [
  { key: 'boundary', name: 'Property Boundary', fill: 'transparent', stroke: '#1A1A1A', strokeWidth: 3, dash: [8, 4] },
  { key: 'lawn', name: 'Lawn', fill: 'rgba(122,180,90,0.35)', stroke: '#5C8C3E' },
  { key: 'bed', name: 'Planting Bed', fill: 'rgba(160,120,70,0.30)', stroke: '#8C6F3E' },
  { key: 'hardscape', name: 'Hardscape (patio/walk/deck)', fill: 'rgba(150,150,150,0.35)', stroke: '#6B6B6B' },
  { key: 'water', name: 'Water Feature', fill: 'rgba(79,159,214,0.35)', stroke: '#2E6FA6' },
];

window.DESIGN_CATALOG = {
  PLANT_CATEGORIES,
  PLANT_CATALOG,
  HEAD_CATALOG,
  FIXTURE_CATALOG,
  AREA_PRESETS,
};
