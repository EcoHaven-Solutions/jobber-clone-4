// ============================================================================
// design-viewer.js -- the customer-facing 3D explorer (generated file).
// Bundles the plan data, the 3D engine and the plant models so the shared
// customer page can rebuild the design in 3D and let people look around.
// Do not edit by hand: it is rebuilt from the FieldBase design files.
// ============================================================================
(function () {
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
  { key: 'ponderosa-pine', name: 'Ponderosa Pine', category: 'Tree', sun: 'full', water: 'low', heightFt: 70, spreadFt: 30, color: '#5B6E3D', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/3790446/medium.JPG' },
  { key: 'autumn-brilliance-serviceberry', name: 'Autumn Brilliance Serviceberry', category: 'Tree', sun: 'full', water: 'moderate', heightFt: 20, spreadFt: 20, color: '#D2542A', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/65493639/medium.jpg' },
  { key: 'eastern-redbud', name: 'Eastern Redbud', category: 'Tree', sun: 'partial', water: 'moderate', heightFt: 25, spreadFt: 30, color: '#C13584', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/146752176/medium.jpg' },
  { key: 'paperbark-maple', name: 'Paperbark Maple', category: 'Tree', sun: 'partial', water: 'moderate', heightFt: 25, spreadFt: 20, color: '#A9642F', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/93282513/medium.jpg' },
  { key: 'silver-linden', name: 'Silver Linden', category: 'Tree', sun: 'full', water: 'moderate', heightFt: 60, spreadFt: 45, color: '#8CA084', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/289618202/medium.jpeg' },

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
  { key: 'elderberry', name: 'Elderberry', category: 'Shrub', sun: 'full', water: 'moderate', heightFt: 10, spreadFt: 8, color: '#2E2440', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/10180/medium.jpg' },
  { key: 'smoke-tree', name: 'Smoke Tree', category: 'Shrub', sun: 'full', water: 'low', heightFt: 15, spreadFt: 15, color: '#B98CAE', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/136745491/medium.jpg' },
  { key: 'mock-orange', name: 'Mock Orange', category: 'Shrub', sun: 'full', water: 'low', heightFt: 8, spreadFt: 6, color: '#F3EFD9', photoUrl: 'https://static.inaturalist.org/photos/40363644/medium.jpg' },
  { key: 'golden-currant', name: 'Golden Currant', category: 'Shrub', sun: 'full', water: 'low', heightFt: 6, spreadFt: 6, color: '#DDA426', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/497524076/medium.jpg' },
  { key: 'oregon-grape', name: 'Oregon Grape', category: 'Shrub', sun: 'partial', water: 'low', heightFt: 5, spreadFt: 5, color: '#D9B22F', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/22784/medium.jpg' },
  { key: 'red-currant', name: 'Red Flowering Currant', category: 'Shrub', sun: 'partial', water: 'low', heightFt: 8, spreadFt: 6, color: '#C2456B', photoUrl: 'https://static.inaturalist.org/photos/72387844/medium.jpg' },
  { key: 'spirea', name: 'Spirea', category: 'Shrub', sun: 'full', water: 'moderate', heightFt: 4, spreadFt: 4, color: '#D1608A', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/449207/medium.jpg' },
  { key: 'ninebark', name: 'Ninebark', category: 'Shrub', sun: 'full', water: 'moderate', heightFt: 8, spreadFt: 6, color: '#5B3350', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/135237890/medium.jpeg' },
  { key: 'upright-juniper', name: 'Upright Juniper', category: 'Shrub', sun: 'full', water: 'low', heightFt: 18, spreadFt: 4, color: '#6F8F99', photoUrl: 'https://static.inaturalist.org/photos/53827887/medium.jpeg' },

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
  { key: 'blanket-flower-gaillardia', name: 'Blanket Flower', category: 'Perennial', sun: 'full', water: 'low', heightFt: 2, spreadFt: 1.5, color: '#D9752E', photoUrl: 'https://static.inaturalist.org/photos/45640107/medium.jpg' },
  { key: 'yarrow', name: 'Yarrow', category: 'Perennial', sun: 'full', water: 'low', heightFt: 2, spreadFt: 2, color: '#DCD7B8', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/4902/medium.jpg' },
  { key: 'bee-balm-monarda', name: 'Bee Balm (Wild Bergamot)', category: 'Perennial', sun: 'full', water: 'moderate', heightFt: 3, spreadFt: 2, color: '#B080C0', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/301795454/medium.jpg' },
  { key: 'penstemon', name: 'Rocky Mountain Penstemon', category: 'Perennial', sun: 'full', water: 'low', heightFt: 2, spreadFt: 1.5, color: '#5C63B0', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/45389512/medium.jpg' },
  { key: 'lupine', name: 'Bigleaf Lupine', category: 'Perennial', sun: 'full', water: 'moderate', heightFt: 3, spreadFt: 1.5, color: '#5C4E96', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/135866080/medium.jpg' },
  { key: 'lenten-rose-hellebore', name: 'Lenten Rose', category: 'Perennial', sun: 'shade', water: 'moderate', heightFt: 1.5, spreadFt: 1.5, color: '#8C5B6E', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/357527342/medium.jpg' },

  // ---- Ornamental Grasses ----
  { key: 'karl-foerster', name: "'Karl Foerster' Feather Reed Grass", category: 'Ornamental Grass', sun: 'full', water: 'moderate', heightFt: 5, spreadFt: 2, color: '#B0A64F', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/305886393/medium.jpg' },
  { key: 'blue-oat-grass', name: 'Blue Oat Grass', category: 'Ornamental Grass', sun: 'full', water: 'low', heightFt: 2.5, spreadFt: 2, color: '#7A9CA6', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/132363467/medium.jpg' },
  { key: 'fountain-grass', name: 'Fountain Grass', category: 'Ornamental Grass', sun: 'full', water: 'moderate', heightFt: 3, spreadFt: 3, color: '#B08F5C', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/87738502/medium.jpeg' },

  // ---- Groundcover ----
  { key: 'creeping-thyme', name: 'Creeping Thyme', category: 'Groundcover', sun: 'full', water: 'low', heightFt: 0.25, spreadFt: 1.5, color: '#7A9C6F', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/147682040/medium.jpg' },
  { key: 'vinca-minor', name: 'Vinca Minor', category: 'Groundcover', sun: 'shade', water: 'moderate', heightFt: 0.5, spreadFt: 2, color: '#3E6F5C', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/623147456/medium.jpg' },
  { key: 'sedum-groundcover', name: 'Sedum Groundcover Mix', category: 'Groundcover', sun: 'full', water: 'low', heightFt: 0.3, spreadFt: 1.5, color: '#8FA65C', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/43927616/medium.jpg' },
  { key: 'sweet-woodruff', name: 'Sweet Woodruff', category: 'Groundcover', sun: 'shade', water: 'moderate', heightFt: 0.5, spreadFt: 1.5, color: '#4F8C5C', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/74944506/medium.jpg' },
  { key: 'kinnikinnick', name: 'Kinnikinnick', category: 'Groundcover', sun: 'full', water: 'low', heightFt: 0.5, spreadFt: 4, color: '#4F6B4A', photoUrl: 'https://static.inaturalist.org/photos/181302737/medium.jpeg' },
  { key: 'wild-strawberry', name: 'Wild Strawberry', category: 'Groundcover', sun: 'partial', water: 'moderate', heightFt: 0.3, spreadFt: 1.5, color: '#C9302C', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/600014255/medium.jpg' },
  { key: 'ice-plant-delosperma', name: 'Ice Plant', category: 'Groundcover', sun: 'full', water: 'low', heightFt: 0.4, spreadFt: 2, color: '#D6488F', photoUrl: 'https://static.inaturalist.org/photos/585366703/medium.jpg' },
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
  { key: 'flagstone', name: 'Flagstone / Stone Path', fill: 'rgba(160,148,120,0.4)', stroke: '#7A6F5C' },
  { key: 'water', name: 'Water Feature', fill: 'rgba(79,159,214,0.35)', stroke: '#2E6FA6' },
];

window.DESIGN_CATALOG = {
  PLANT_CATEGORIES,
  PLANT_CATALOG,
  HEAD_CATALOG,
  FIXTURE_CATALOG,
  AREA_PRESETS,
};

})();
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

(function () {
  window.DPRO = window.DPRO || {};
  const DPRO = window.DPRO;
  DPRO.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  DPRO.fmtFtIn = (ft) => { const f = Math.floor(ft), i = Math.round((ft - f) * 12); return f + "'" + (i ? ' ' + i + '"' : ''); };
  DPRO.extras = { night: false, northDeg: 0 };
  window.elements = []; window.pxPerFt = 10;
})();
(function () {
  const DPRO = window.DPRO;
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

  // ======================= Textured surfaces =======================
  const texCache = {};
  function mk(size) { const c = document.createElement('canvas'); c.width = size; c.height = size; return [c, c.getContext('2d')]; }
  function tile(ctx, size, x, y, margin, fn) { // draw fn at wrapped offsets so tiles have no seams
    for (const dx of [-size, 0, size]) for (const dy of [-size, 0, size]) {
      if (dx && !(x < margin && dx < 0) && !(x > size - margin && dx > 0)) continue;
      if (dy && !(y < margin && dy < 0) && !(y > size - margin && dy > 0)) continue;
      fn(x + dx, y + dy);
    }
  }
  const TEXTURES = {
    lawn() {
      const [c, ctx] = mk(64); const rand = mulberry32(7);
      const g = ctx.createLinearGradient(0, 0, 64, 64); g.addColorStop(0, '#6DA84C'); g.addColorStop(1, '#5C9440');
      ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
      const tones = ['#7DBB57', '#4F8636', '#8CC864', '#5B9A3F', '#44762E'];
      ctx.lineCap = 'round';
      for (let i = 0; i < 170; i++) {
        const x = rand() * 64, y = rand() * 64, a = -Math.PI / 2 + (rand() - 0.5) * 1.1, l = 3 + rand() * 5;
        ctx.strokeStyle = tones[Math.floor(rand() * tones.length)]; ctx.lineWidth = 0.9 + rand() * 0.6; ctx.globalAlpha = 0.55 + rand() * 0.4;
        tile(ctx, 64, x, y, 8, (px, py) => { ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l); ctx.stroke(); });
      }
      ctx.globalAlpha = 1; return { canvas: c, ft: 4 };
    },
    turf() {
      const [c, ctx] = mk(48); const rand = mulberry32(21);
      ctx.fillStyle = '#58A63C'; ctx.fillRect(0, 0, 48, 48);
      for (let y = 3; y < 48; y += 4) for (let x = 2; x < 48; x += 4) {
        ctx.strokeStyle = rand() > 0.5 ? '#6BBF4B' : '#4A9031'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(x, y + 2); ctx.lineTo(x + (rand() - 0.5) * 2, y - 1.5); ctx.stroke();
      }
      return { canvas: c, ft: 2 };
    },
    bark() {
      const [c, ctx] = mk(64); const rand = mulberry32(31);
      ctx.fillStyle = '#4A2E1B'; ctx.fillRect(0, 0, 64, 64);
      const tones = ['#6B4226', '#5A3A20', '#7A4F2B', '#3E2616', '#8A5A33'];
      for (let i = 0; i < 80; i++) {
        const x = rand() * 64, y = rand() * 64, w = 6 + rand() * 9, h = 2 + rand() * 2.5, a = rand() * Math.PI;
        const col = tones[Math.floor(rand() * tones.length)];
        tile(ctx, 64, x, y, 12, (px, py) => {
          ctx.save(); ctx.translate(px, py); ctx.rotate(a);
          ctx.fillStyle = col; ctx.strokeStyle = 'rgba(20,10,5,0.55)'; ctx.lineWidth = 0.6;
          ctx.beginPath(); ctx.rect(-w / 2, -h / 2, w, h); ctx.fill(); ctx.stroke(); ctx.restore();
        });
      }
      return { canvas: c, ft: 3 };
    },
    soil() {
      const [c, ctx] = mk(64); const rand = mulberry32(41);
      ctx.fillStyle = '#5A4430'; ctx.fillRect(0, 0, 64, 64);
      for (let i = 0; i < 260; i++) { ctx.fillStyle = rand() > 0.5 ? 'rgba(0,0,0,0.18)' : 'rgba(160,125,90,0.25)'; ctx.fillRect(rand() * 64, rand() * 64, 1 + rand() * 1.5, 1 + rand() * 1.5); }
      return { canvas: c, ft: 3 };
    },
    rock() {
      const [c, ctx] = mk(64); const rand = mulberry32(51);
      ctx.fillStyle = '#7B766B'; ctx.fillRect(0, 0, 64, 64);
      const tones = [['#B9B2A2', '#8E887A'], ['#A39C8B', '#7C7667'], ['#C9C2B0', '#9B9484'], ['#8F8A7E', '#6B665B']];
      for (let i = 0; i < 40; i++) {
        const x = rand() * 64, y = rand() * 64, rx = 3 + rand() * 4.5, ry = 2.5 + rand() * 3.5, a = rand() * Math.PI, t = tones[i % tones.length];
        tile(ctx, 64, x, y, 9, (px, py) => {
          const g = ctx.createRadialGradient(px - rx * 0.3, py - ry * 0.3, 0.5, px, py, rx);
          g.addColorStop(0, t[0]); g.addColorStop(1, t[1]);
          ctx.beginPath(); ctx.ellipse(px, py, rx, ry, a, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
          ctx.strokeStyle = 'rgba(40,35,28,0.45)'; ctx.lineWidth = 0.6; ctx.stroke();
        });
      }
      return { canvas: c, ft: 3 };
    },
    gravel() {
      const [c, ctx] = mk(64); const rand = mulberry32(61);
      ctx.fillStyle = '#A29E92'; ctx.fillRect(0, 0, 64, 64);
      const tones = ['#C8C4B8', '#8B877B', '#B3A793', '#6F6B61', '#D8D3C4', '#9C8B76'];
      for (let i = 0; i < 260; i++) {
        ctx.beginPath(); ctx.arc(rand() * 64, rand() * 64, 0.6 + rand() * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = tones[Math.floor(rand() * tones.length)]; ctx.globalAlpha = 0.85; ctx.fill();
      }
      ctx.globalAlpha = 1; return { canvas: c, ft: 3 };
    },
    conc() {
      const [c, ctx] = mk(128); const rand = mulberry32(71);
      ctx.fillStyle = '#C4C2BA'; ctx.fillRect(0, 0, 128, 128);
      for (let i = 0; i < 380; i++) { ctx.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.14)' : 'rgba(60,60,55,0.12)'; ctx.fillRect(rand() * 128, rand() * 128, 1 + rand() * 1.6, 1 + rand() * 1.6); }
      ctx.strokeStyle = 'rgba(80,80,74,0.55)'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(0, 0.8); ctx.lineTo(128, 0.8); ctx.moveTo(0.8, 0); ctx.lineTo(0.8, 128); ctx.stroke();
      return { canvas: c, ft: 6 };
    },
    pavers() {
      const [c, ctx] = mk(96); const rand = mulberry32(81);
      const tones = ['#B39A82', '#A88D74', '#BCA58D', '#9F8670', '#B8A088'];
      for (let row = 0; row < 6; row++) {
        const off = row % 2 ? 16 : 0;
        for (let col = -1; col < 4; col++) {
          const x = col * 32 + off, y = row * 16;
          ctx.fillStyle = tones[Math.floor(rand() * tones.length)]; ctx.fillRect(x, y, 32, 16);
          for (let i = 0; i < 10; i++) { ctx.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'; ctx.fillRect(x + rand() * 30, y + rand() * 14, 1.5, 1.5); }
          ctx.strokeStyle = 'rgba(60,48,38,0.7)'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, 31, 15);
        }
      }
      return { canvas: c, ft: 3 };
    },
    deck() {
      const [c, ctx] = mk(64); const rand = mulberry32(91);
      const tones = ['#A9713F', '#9A6636', '#B77C48', '#8E5E31'];
      for (let row = 0; row < 4; row++) {
        const y = row * 16; ctx.fillStyle = tones[Math.floor(rand() * tones.length)]; ctx.fillRect(0, y, 64, 16);
        for (let i = 0; i < 7; i++) { const gy = y + 2 + rand() * 12; ctx.strokeStyle = 'rgba(60,35,15,0.28)'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(rand() * 20, gy); ctx.lineTo(30 + rand() * 34, gy + (rand() - 0.5) * 1.5); ctx.stroke(); }
        ctx.strokeStyle = 'rgba(30,18,8,0.75)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, y + 0.6); ctx.lineTo(64, y + 0.6); ctx.stroke();
        const sx = (row * 23 + 11) % 64; ctx.beginPath(); ctx.moveTo(sx, y); ctx.lineTo(sx, y + 16); ctx.stroke();
      }
      return { canvas: c, ft: 2 };
    },
    roof() {
      const [c, ctx] = mk(64); const rand = mulberry32(101);
      ctx.fillStyle = '#7C766E'; ctx.fillRect(0, 0, 64, 64);
      for (let row = 0; row < 8; row++) {
        const y = row * 8, off = row % 2 ? 8 : 0;
        for (let col = -1; col < 4; col++) {
          const x = col * 16 + off; const v = 0.85 + rand() * 0.3;
          ctx.fillStyle = `rgb(${Math.round(124 * v)},${Math.round(118 * v)},${Math.round(110 * v)})`; ctx.fillRect(x, y, 16, 8);
          ctx.strokeStyle = 'rgba(30,26,22,0.35)'; ctx.lineWidth = 0.8; ctx.strokeRect(x + 0.4, y + 0.4, 15.2, 7.2);
        }
        ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(0, y + 6.5, 64, 1.5);
      }
      return { canvas: c, ft: 3 };
    },
    water() {
      const [c, ctx] = mk(96); const rand = mulberry32(111);
      const g = ctx.createLinearGradient(0, 0, 96, 96); g.addColorStop(0, '#74B6E2'); g.addColorStop(1, '#4E94C4');
      ctx.fillStyle = g; ctx.fillRect(0, 0, 96, 96);
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1.2; ctx.lineCap = 'round';
      for (let i = 0; i < 12; i++) { const x = rand() * 96, y = rand() * 96, w = 10 + rand() * 14; tile(ctx, 96, x, y, 26, (px, py) => { ctx.beginPath(); ctx.moveTo(px, py); ctx.quadraticCurveTo(px + w / 2, py - 3, px + w, py); ctx.stroke(); }); }
      return { canvas: c, ft: 6 };
    },
  };
  function texture(name) { if (!texCache[name]) texCache[name] = TEXTURES[name](); return texCache[name]; }
  DPRO.texture = texture;
})();
(function () {
  const DPRO = window.DPRO; const esc = DPRO.esc; const fmt = DPRO.fmtFtIn;
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
  function colorOf(el, prod) {
    const k = el.color || prod.color || 'warm';
    return COLORS[k] ? { key: k, hex: COLORS[k].hex, multi: COLORS[k].multi || null } : { key: 'custom', hex: k, multi: null };
  }
  DPRO.light.colorOf = colorOf;
})();
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

(function () {
  const DPRO = window.DPRO; const $ = (id) => document.getElementById(id);
  const st = document.createElement('style');
  st.textContent = '#d3-irr{display:none!important}#d3-save{display:none!important}';
  document.head.appendChild(st);
  const h3 = document.querySelector('#dpro3d .d3-top h3'); if (h3) h3.textContent = 'Explore your design';
  window.DesignViewer = {
    open(scene) {
      scene = scene || {};
      window.elements = Array.isArray(scene.elements) ? scene.elements : []; window.pxPerFt = Number(scene.pxPerFt) || 10;
      DPRO.extras.northDeg = Number(scene.northDeg) || 0; DPRO.extras.night = false;
      DPRO.threeD.open();
      setTimeout(() => { const m = $('d3-msg'); if (m && window.elements.length) { m.textContent = 'Drag to look around. Pinch or scroll to zoom. Two fingers (or right-click drag) to move. Try "Walk through", other months, and Night lighting.'; setTimeout(() => { if (m.textContent.indexOf('Drag') === 0) m.textContent = ''; }, 9000); } }, 1800);
    },
  };
})();
