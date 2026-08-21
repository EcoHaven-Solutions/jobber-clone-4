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
// photoUrl is a real reference photo (Wikimedia Commons or iNaturalist,
// hand-verified when this catalog was built) shown in the print/PDF plant
// legend and the catalog list. If a link ever breaks or you want a better
// photo for a given plant, just replace the URL here -- plain text edit.
const PLANT_CATALOG = [
  // ---- Trees ----
  { key: 'norway-maple', name: 'Norway Maple', category: 'Tree', sun: 'full', water: 'moderate', heightFt: 40, spreadFt: 35, color: '#3F6B3A', photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Spitz-Ahorn%28mbo%29.jpg/400px-Spitz-Ahorn%28mbo%29.jpg' },
  { key: 'autumn-blaze-maple', name: 'Autumn Blaze Maple', category: 'Tree', sun: 'full', water: 'moderate', heightFt: 50, spreadFt: 40, color: '#B04A2A', photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Lipstick_maple.JPG/400px-Lipstick_maple.JPG' },
  { key: 'honeylocust', name: 'Honeylocust (thornless)', category: 'Tree', sun: 'full', water: 'low', heightFt: 45, spreadFt: 35, color: '#5C7A3A', photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Gleditsia_triacanthos_Maryhill_Museum_01.jpg/400px-Gleditsia_triacanthos_Maryhill_Museum_01.jpg' },
  { key: 'colorado-blue-spruce', name: 'Colorado Blue Spruce', category: 'Tree', sun: 'full', water: 'moderate', heightFt: 60, spreadFt: 20, color: '#5C7F8C', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/389275799/medium.jpeg' },
  { key: 'austrian-pine', name: 'Austrian Pine', category: 'Tree', sun: 'full', water: 'low', heightFt: 50, spreadFt: 30, color: '#39563B', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/544490847/medium.jpg' },
  { key: 'quaking-aspen', name: 'Quaking Aspen', category: 'Tree', sun: 'full', water: 'moderate', heightFt: 40, spreadFt: 20, color: '#7C9A4A', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/706118724/medium.jpg' },
  { key: 'flowering-crabapple', name: 'Flowering Crabapple', category: 'Tree', sun: 'full', water: 'moderate', heightFt: 20, spreadFt: 20, color: '#C97CA0', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/2448479/medium.JPG' },
  { key: 'serviceberry', name: 'Serviceberry', category: 'Tree', sun: 'partial', water: 'moderate', heightFt: 20, spreadFt: 15, color: '#8AA35B', photoUrl: 'https://gardenology.org/w/images/thumb/1/16/Amelanchier_grandiflora2.jpg/240px-Amelanchier_grandiflora2.jpg' },

  // ---- Shrubs ----
  { key: 'green-mountain-boxwood', name: "'Green Mountain' Boxwood", category: 'Shrub', sun: 'partial', water: 'moderate', heightFt: 4, spreadFt: 3, color: '#3E5C33', photoUrl: 'https://static.inaturalist.org/photos/43384449/medium.jpeg' },
  { key: 'burning-bush', name: 'Burning Bush', category: 'Shrub', sun: 'full', water: 'moderate', heightFt: 8, spreadFt: 8, color: '#A6342A', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/70163421/medium.jpg' },
  { key: 'blue-mist-spirea', name: 'Blue Mist Spirea', category: 'Shrub', sun: 'full', water: 'low', heightFt: 3, spreadFt: 3, color: '#5C6FA6', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/1538362/medium.jpg' },
  { key: 'lilac', name: 'Common Lilac', category: 'Shrub', sun: 'full', water: 'low', heightFt: 12, spreadFt: 10, color: '#8C6FA6', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/131487901/medium.jpeg' },
  { key: 'rose-of-sharon', name: 'Rose of Sharon', category: 'Shrub', sun: 'full', water: 'moderate', heightFt: 10, spreadFt: 6, color: '#A65C8C', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/94974/medium.jpg' },
  { key: 'potentilla', name: 'Potentilla', category: 'Shrub', sun: 'full', water: 'low', heightFt: 3, spreadFt: 3, color: '#C9A63E', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/302097709/medium.jpeg' },
  { key: 'dwarf-korean-lilac', name: 'Dwarf Korean Lilac', category: 'Shrub', sun: 'full', water: 'low', heightFt: 5, spreadFt: 5, color: '#9C7FB0', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/17596826/medium.jpeg' },
  { key: 'arborvitae-emerald', name: "'Emerald Green' Arborvitae", category: 'Shrub', sun: 'full', water: 'moderate', heightFt: 12, spreadFt: 4, color: '#2E5233', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/4684247/medium.jpeg' },
  { key: 'juniper-blue-rug', name: "'Blue Rug' Juniper", category: 'Shrub', sun: 'full', water: 'low', heightFt: 1, spreadFt: 6, color: '#4F7A8C', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/250334018/medium.jpg' },
  { key: 'red-twig-dogwood', name: 'Red Twig Dogwood', category: 'Shrub', sun: 'partial', water: 'moderate', heightFt: 7, spreadFt: 7, color: '#A6402E', photoUrl: 'https://static.inaturalist.org/photos/16633753/medium.jpg' },

  // ---- Perennials ----
  { key: 'russian-sage', name: 'Russian Sage', category: 'Perennial', sun: 'full', water: 'low', heightFt: 3, spreadFt: 3, color: '#8C8FBF', photoUrl: 'https://static.inaturalist.org/photos/417032110/medium.jpeg' },
  { key: 'black-eyed-susan', name: 'Black-Eyed Susan', category: 'Perennial', sun: 'full', water: 'moderate', heightFt: 2, spreadFt: 1.5, color: '#D6A62E', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/7861779/medium.jpg' },
  { key: 'daylily', name: 'Daylily', category: 'Perennial', sun: 'full', water: 'moderate', heightFt: 2, spreadFt: 2, color: '#D67A2E', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/82351245/medium.jpg' },
  { key: 'coneflower', name: 'Purple Coneflower', category: 'Perennial', sun: 'full', water: 'low', heightFt: 3, spreadFt: 1.5, color: '#A6529C', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/433818/medium.jpg' },
  { key: 'sedum-autumn-joy', name: "'Autumn Joy' Sedum", category: 'Perennial', sun: 'full', water: 'low', heightFt: 2, spreadFt: 1.5, color: '#B0637C', photoUrl: 'https://static.inaturalist.org/photos/106760920/medium.jpeg' },
  { key: 'lavender', name: 'English Lavender', category: 'Perennial', sun: 'full', water: 'low', heightFt: 2, spreadFt: 2, color: '#7C6FA6', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/157057/medium.jpg' },
  { key: 'hosta', name: 'Hosta', category: 'Perennial', sun: 'shade', water: 'moderate', heightFt: 1.5, spreadFt: 2, color: '#4F7A4F', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/297985004/medium.jpg' },
  { key: 'peony', name: 'Peony', category: 'Perennial', sun: 'full', water: 'moderate', heightFt: 2.5, spreadFt: 2.5, color: '#C96F9C', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/887117/medium.jpg' },
  { key: 'catmint', name: "'Walker's Low' Catmint", category: 'Perennial', sun: 'full', water: 'low', heightFt: 1.5, spreadFt: 2, color: '#7A8FBF', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/131906502/medium.jpg' },

  // ---- Ornamental Grasses ----
  { key: 'karl-foerster', name: "'Karl Foerster' Feather Reed Grass", category: 'Ornamental Grass', sun: 'full', water: 'moderate', heightFt: 5, spreadFt: 2, color: '#B0A64F', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/305886393/medium.jpg' },
  { key: 'blue-oat-grass', name: 'Blue Oat Grass', category: 'Ornamental Grass', sun: 'full', water: 'low', heightFt: 2.5, spreadFt: 2, color: '#7A9CA6', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/132363467/medium.jpg' },
  { key: 'fountain-grass', name: 'Fountain Grass', category: 'Ornamental Grass', sun: 'full', water: 'moderate', heightFt: 3, spreadFt: 3, color: '#B08F5C', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/87738502/medium.jpeg' },

  // ---- Groundcover ----
  { key: 'creeping-thyme', name: 'Creeping Thyme', category: 'Groundcover', sun: 'full', water: 'low', heightFt: 0.25, spreadFt: 1.5, color: '#7A9C6F', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/147682040/medium.jpg' },
  { key: 'vinca-minor', name: 'Vinca Minor', category: 'Groundcover', sun: 'shade', water: 'moderate', heightFt: 0.5, spreadFt: 2, color: '#3E6F5C', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/623147456/medium.jpg' },
  { key: 'sedum-groundcover', name: 'Sedum Groundcover Mix', category: 'Groundcover', sun: 'full', water: 'low', heightFt: 0.3, spreadFt: 1.5, color: '#8FA65C', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/43927616/medium.jpg' },
  { key: 'sweet-woodruff', name: 'Sweet Woodruff', category: 'Groundcover', sun: 'shade', water: 'moderate', heightFt: 0.5, spreadFt: 1.5, color: '#4F8C5C', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/74944506/medium.jpg' },
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
