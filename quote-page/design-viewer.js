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
  function texture(name) {
    if (!texCache[name]) {
      const m = DPRO.mat && ((DPRO.mat.by && DPRO.mat.by[name]) || /^(flag|stone)\|/.test(name)); // rock / gravel / mulch / flagstone library (design-materials.js)
      texCache[name] = m ? DPRO.mat.tex2d(name) : TEXTURES[name]();
    }
    return texCache[name];
  }
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
  const FLAG_STYLES = [['fill', 'Full flagstone fill'], ['single', 'Single row of big pavers'], ['pairs', 'Stepping stones: two side by side'], ['zipper', 'Stepping stones: zipper (staggered)']];
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
      style: FLAG_STYLES.some((p) => p[0] === el.style) ? el.style : (layoutOk(el) && el.pattern === 'stepping' ? 'pairs' : 'fill'),
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

  // ---- centre line of a path-shaped outline (so stones can follow whatever shape you draw) ----
  function ptInPoly(pts, x, y) { let c = false; const n = pts.length / 2; for (let i = 0, j = n - 1; i < n; j = i++) { const ax = pts[i * 2], ay = pts[i * 2 + 1], bx = pts[j * 2], by = pts[j * 2 + 1]; if ((ay > y) !== (by > y) && x < ((bx - ax) * (y - ay)) / (by - ay) + ax) c = !c; } return c; }
  class Heap { constructor() { this.k = []; this.v = []; } get size() { return this.k.length; }
    push(key, val) { const k = this.k, v = this.v; let i = k.length; k.push(key); v.push(val); while (i > 0) { const p = (i - 1) >> 1; if (k[p] <= key) break; k[i] = k[p]; v[i] = v[p]; i = p; } k[i] = key; v[i] = val; }
    pop() { const k = this.k, v = this.v, topV = v[0], lk = k.pop(), lv = v.pop(); const n = k.length; if (n) { let i = 0; for (;;) { let c = 2 * i + 1; if (c >= n) break; if (c + 1 < n && k[c + 1] < k[c]) c++; if (k[c] >= lk) break; k[i] = k[c]; v[i] = v[c]; i = c; } k[i] = lk; v[i] = lv; } return topV; } }
  const NB = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.4142], [-1, 1, 1.4142], [1, -1, 1.4142], [-1, -1, 1.4142]];
  function dijk(nx, ny, inside, src, costAt) {
    const N = nx * ny, dist = new Float64Array(N).fill(Infinity), prev = new Int32Array(N).fill(-1), h = new Heap(); dist[src] = 0; h.push(0, src);
    while (h.size) { const u = h.pop(); const ux = u % nx, uy = (u / nx) | 0; const du = dist[u];
      for (let k = 0; k < 8; k++) { const vx = ux + NB[k][0], vy = uy + NB[k][1]; if (vx < 0 || vy < 0 || vx >= nx || vy >= ny) continue; const v = vy * nx + vx; if (!inside[v]) continue;
        const nd = du + NB[k][2] * costAt(v); if (nd < dist[v]) { dist[v] = nd; prev[v] = u; h.push(nd, v); } } }
    return { dist, prev };
  }
  const CL_CACHE = new Map();
  function areaCenterline(pts, ppf) {
    const key = ppf + '|' + pts.join(','); if (CL_CACHE.has(key)) return CL_CACHE.get(key);
    let res = null; try { res = computeCenterline(pts, ppf); } catch (e) { res = null; }
    if (CL_CACHE.size > 60) CL_CACHE.clear(); CL_CACHE.set(key, res); return res;
  }
  function computeCenterline(pts, ppf) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (let i = 0; i < pts.length; i += 2) { x0 = Math.min(x0, pts[i]); x1 = Math.max(x1, pts[i]); y0 = Math.min(y0, pts[i + 1]); y1 = Math.max(y1, pts[i + 1]); }
    const W = x1 - x0, H = y1 - y0; if (W < 4 || H < 4 && W < 4) return null;
    const cs = Math.max(ppf * 0.2, Math.sqrt((W * H) / 45000)); const nx = Math.ceil(W / cs) + 3, ny = Math.ceil(H / cs) + 3; const N = nx * ny;
    const cx = (i) => x0 + (i - 1.5) * cs + cs / 2 * 0, cy = (j) => y0 + (j - 1.5) * cs;
    const inside = new Uint8Array(N); let cnt = 0;
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) if (ptInPoly(pts, cx(i), cy(j))) { inside[j * nx + i] = 1; cnt++; }
    if (cnt < 8) return null;
    // distance to the edge (chamfer)
    const d = new Float32Array(N); for (let k = 0; k < N; k++) d[k] = inside[k] ? 1e9 : 0;
    const at = (i, j) => (i < 0 || j < 0 || i >= nx || j >= ny ? 0 : d[j * nx + i]);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const k = j * nx + i; if (!d[k]) continue; d[k] = Math.min(d[k], at(i - 1, j) + 1, at(i, j - 1) + 1, at(i - 1, j - 1) + 1.4142, at(i + 1, j - 1) + 1.4142); }
    for (let j = ny - 1; j >= 0; j--) for (let i = nx - 1; i >= 0; i--) { const k = j * nx + i; if (!d[k]) continue; d[k] = Math.min(d[k], at(i + 1, j) + 1, at(i, j + 1) + 1, at(i + 1, j + 1) + 1.4142, at(i - 1, j + 1) + 1.4142); }
    let dm = 0, A = -1; for (let k = 0; k < N; k++) if (inside[k] && d[k] > dm) { dm = d[k]; A = k; }
    if (A < 0) return null;
    const far = (r) => { let b = A, bd = -1; for (let k = 0; k < N; k++) if (inside[k] && r.dist[k] < Infinity && r.dist[k] > bd) { bd = r.dist[k]; b = k; } return b; };
    const B = far(dijk(nx, ny, inside, A, () => 1)); const C = far(dijk(nx, ny, inside, B, () => 1));
    const w = dijk(nx, ny, inside, B, (v) => { const q = dm / Math.max(d[v] - 0.4, 0.6); return q * q; });
    const cells = []; for (let k = C; k >= 0; k = w.prev[k]) { cells.push(k); if (k === B) break; }
    if (cells.length < 4) return null; cells.reverse();
    let P = cells.map((k) => [cx(k % nx), cy((k / nx) | 0)]);
    const dAt = (x, y) => { const i = Math.round((x - x0) / cs + 1.5 - 0.5 * 0), j = Math.round((y - y0) / cs + 1.5); if (i < 0 || j < 0 || i >= nx || j >= ny) return 0; return Math.max(0, (d[j * nx + i] - 0.5)) * cs; };
    const med = (a) => { const b = a.slice().sort((p, q) => p - q); return b[b.length >> 1]; };
    const medD0 = med(P.map((q) => dAt(q[0], q[1])));
    const smooth = (arr, r) => arr.map((q, i) => { let sx = 0, sy = 0, n = 0; for (let k = -r; k <= r; k++) { const t = arr[Math.max(0, Math.min(arr.length - 1, i + k))]; sx += t[0]; sy += t[1]; n++; } return i === 0 || i === arr.length - 1 ? q : [sx / n, sy / n]; });
    const r = Math.max(2, Math.round(medD0 / cs)); P = smooth(smooth(P, r), r);
    let D = P.map((q) => dAt(q[0], q[1])); const sd = D.map((v, i) => { let s2 = 0, n = 0; for (let k = -r; k <= r; k++) { s2 += D[Math.max(0, Math.min(D.length - 1, i + k))]; n++; } return s2 / n; }); D = sd;
    const medD = med(D);
    let lo = 0, hi = P.length - 1; while (lo < hi - 3 && D[lo] < 0.55 * medD) lo++; while (hi > lo + 3 && D[hi] < 0.55 * medD) hi--;
    P = P.slice(lo, hi + 1); D = D.slice(lo, hi + 1); if (P.length < 3) return null;
    // run the ends out to the edge of the outline
    const ext = (fromEnd) => { const n = P.length; const a = fromEnd ? P[n - 1] : P[0], b = fromEnd ? P[Math.max(0, n - 1 - Math.max(2, r))] : P[Math.min(n - 1, Math.max(2, r))]; let tx = a[0] - b[0], ty = a[1] - b[1]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl; const out = []; let x = a[0], y = a[1]; const last = D[fromEnd ? n - 1 : 0];
      for (let k = 0; k < 400; k++) { x += tx * cs * 0.5; y += ty * cs * 0.5; if (!ptInPoly(pts, x, y)) break; const dd = dAt(x, y); if (dd < Math.min(last, medD) * 0.25) break; out.push([[x, y], Math.max(dd, last * 0.0 + dd)]); }
      return out; };
    const e1 = ext(false), e2 = ext(true);
    const Q = e1.reverse().map((o) => o[0]).concat(P, e2.map((o) => o[0])); const DD = e1.map((o) => o[1]).concat(D, e2.map((o) => o[1]));
    const c = []; Q.forEach((q) => c.push(q[0], q[1]));
    return { c, hw: DD, medHalf: medD };
  }

  // Individually placed stones: one big paver, two side by side, or a zipper. The stones follow
  // the path you drew (a path tool centre line, or the middle of an outline) and fit its width.
  function layoutOk(el) { return el && (el.type === 'stonepath' || (el.type === 'area' && el.subtype === 'flagstone')); }
  function stoneLayout(el, ppf) {
    if (!layoutOk(el)) return null; const sp = flagSpec(el); if (sp.style === 'fill') return null;
    ppf = ppf || window.pxPerFt || 10;
    let c, hwList = null; const isArea = el.type !== 'stonepath';
    if (!isArea) c = pathCenter(el); else { const cl = areaCenterline(el.points || [], ppf); if (!cl) return null; c = cl.c; hwList = cl.hw; }
    const n = c.length / 2; if (n < 2) return null;
    const cum = [0]; for (let i = 1; i < n; i++) cum.push(cum[i - 1] + Math.hypot(c[i * 2] - c[i * 2 - 2], c[i * 2 + 1] - c[i * 2 - 1]));
    const total = cum[n - 1]; if (total < 4) return null;
    const hwConst = ((el.widthFt || 3) * ppf) / 2;
    const loc = (d) => { d = clamp(d, 0, total); let i = 1; while (i < n - 1 && cum[i] < d) i++; const a = cum[i - 1], b = cum[i], t = b > a ? (d - a) / (b - a) : 0; return [c[i * 2 - 2] + (c[i * 2] - c[i * 2 - 2]) * t, c[i * 2 - 1] + (c[i * 2 + 1] - c[i * 2 - 1]) * t, hwList ? hwList[i - 1] + (hwList[i] - hwList[i - 1]) * t : hwConst]; };
    const L0 = sp.len * ppf, gap = (sp.joint / 12) * ppf;
    const step = L0 + gap, rows = Math.max(1, Math.floor((total + gap) / step)); const lead = (total - (rows * step - gap)) / 2 + L0 / 2;
    const R = rng(hashStr(el.id || 'p') + 7 + Math.round(total)); const stones = []; const nl = sp.style === 'single' ? 1 : 2;
    for (let li = 0; li < nl; li++) {
      const shift = li === 1 && sp.style === 'zipper' ? step / 2 : 0;
      for (let j = -1; j <= rows; j++) {
        const s = lead + j * step + shift; if (s - L0 / 2 < -0.5 || s + L0 / 2 > total + 0.5) continue;
        const p = loc(s), a1 = loc(s - L0), a2 = loc(s + L0), e1 = loc(s - L0 / 2), e2 = loc(s + L0 / 2); let tx = a2[0] - a1[0], ty = a2[1] - a1[1]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
        const ang = Math.atan2(ty, tx), nx = -ty, ny = tx; const hwLocal = isArea ? Math.min(p[2], e1[2], e2[2]) * 0.97 : hwConst; const pw = hwLocal * 2;
        if (pw < 0.5 * ppf) continue;
        const natural = sp.cut === 'natural'; const jj = natural ? Array.from({ length: 16 }, () => R()) : null; const tone = 0.9 + R() * 0.2, off0 = R();
        let scW = 1, scL = 1, ok = false, out = null;
        for (let tries = 0; tries < 4 && !ok; tries++) {
          const laneW = (nl === 1 ? pw : (pw - gap) / 2) * scW, laneOff = nl === 1 ? 0 : (li === 0 ? -1 : 1) * (pw + gap) / 4;
          const cx = p[0] + nx * laneOff, cy = p[1] + ny * laneOff; const hl = (L0 * scL) / 2, hw = laneW / 2, poly = [];
          if (natural) { const q = (k, m) => (jj[k] - 0.5) * 2 * m * ppf; poly.push([-hl + q(0, 0.1), -hw + q(1, 0.1)], [q(2, 0.05), -hw + q(3, 0.04)], [hl + q(4, 0.1), -hw + q(5, 0.1)], [hl + q(6, 0.04), q(7, 0.06)], [hl + q(8, 0.1), hw + q(9, 0.1)], [q(10, 0.05), hw + q(11, 0.04)], [-hl + q(12, 0.1), hw + q(13, 0.1)], [-hl + q(14, 0.04), q(15, 0.06)]); }
          else { const r = Math.min(0.08 * ppf, hl * 0.4, hw * 0.4), cs4 = [[-1, -1], [1, -1], [1, 1], [-1, 1]]; cs4.forEach(([sx, sy], k) => { const cxk = sx * (hl - r), cyk = sy * (hw - r), a0 = [Math.PI, 1.5 * Math.PI, 0, 0.5 * Math.PI][k]; for (let q = 0; q <= 3; q++) { const aa = a0 + (q / 3) * (Math.PI / 2); poly.push([cxk + Math.cos(aa) * r, cyk + Math.sin(aa) * r]); } }); }
          out = { cx, cy, ang, poly, tone, lane: li, w: laneW, l: L0 * scL, off: off0 };
          if (!isArea) { ok = true; break; }
          const ca = Math.cos(ang), sa = Math.sin(ang); ok = poly.every(([x, y]) => ptInPoly(el.points, cx + x * ca - y * sa, cy + x * sa + y * ca));
          if (!ok) { scW *= 0.88; scL *= 0.94; }
        }
        if (ok && out) stones.push(out);
      }
    }
    return { stones, total, L: L0, pw: hwConst * 2 };
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
    const lay = stoneLayout(el);
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
    if (el && el.type === 'area' && el.subtype === 'flagstone' && !el.stone) Object.assign(el, { stone: flagArm.stone, pattern: flagArm.pattern, infill: flagArm.infill, joint: flagArm.joint, style: flagArm.style, cut: flagArm.cut, stoneLen: flagArm.len });
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
    { const fb = document.querySelector('[data-tool="area-flagstone"]'); if (fb) fb.classList.toggle('is-active', flagTool); }
    if (flagTool) { renderFlagCatalog(tool); flagSec.hidden = false; if (empty) empty.hidden = true; switchSidePanel('catalog'); for (let n = flagSec; n; n = n.parentElement) if (n.scrollTop) n.scrollTop = 0; } else flagSec.hidden = true;
  };
  DPRO.hints.boulder = 'Click to place a boulder. Pick the rock type and size in the Catalog tab. Drag to move it.';
  DPRO.pointTools.boulder = function (pos) {
    addElement({ id: uid(), type: 'boulder', rock: armed.rock, sizeFt: armed.size, x: pos.x, y: pos.y, rotationDeg: Math.round(Math.random() * 360), seed: 1 + Math.floor(Math.random() * 9999) });
  };


  // ---- flagstone & stone paths ----
  const flagSec = document.createElement('div'); flagSec.id = 'design-catalog-flag'; flagSec.className = 'design-catalog-section'; flagSec.hidden = true;
  if (catPanel) catPanel.appendChild(flagSec);
  const F = DPRO.mat.flag;
  { const ob = document.querySelector('[data-tool="area-flagstone"]'); if (ob) { ob.textContent = 'Flagstone'; ob.title = 'Flagstone patios, paths and stepping stones (two side by side, zipper)'; } }
  function renderFlagCatalog(tool) {
    const isPath = tool === 'line-flagpath'; // (old centre-line tool, kept so earlier designs keep working)
    let h = `<div class="design-tool-group-label">Flagstone style</div><div class="dpm-row">`;
    F.styles.forEach(([k, l]) => { h += `<button type="button" class="dpm-chip${flagArm.style === k ? ' on' : ''}" data-fstyle="${k}">${l}</button>`; });
    h += `</div><p class="empty-sub" style="margin:4px 0 8px">${isPath ? 'Click along the middle of the path, then press Enter to finish.' : 'Click around the outline, just like a flower bed, then press Enter to finish. Stepping stones are laid inside the shape and follow it, however wide it is.'}</p>`;
    if (flagArm.style !== 'fill') {
      h += `<div class="design-tool-group-label">Stone cut</div><div class="dpm-row"><button type="button" class="dpm-chip${flagArm.cut === 'square' ? ' on' : ''}" data-fcut="square">Square-cut pavers</button><button type="button" class="dpm-chip${flagArm.cut === 'natural' ? ' on' : ''}" data-fcut="natural">Natural-cut</button></div>`;
      h += `<div class="design-tool-group-label" style="margin-top:10px">Stone length</div><div class="dpm-row">`;
      F.lens.forEach((n) => { h += `<button type="button" class="dpm-chip${flagArm.len === n ? ' on' : ''}" data-flen="${n}">${n} ft</button>`; });
      h += '</div><div style="height:10px"></div>';
    }
    h += `<div class="design-tool-group-label">Stone</div><div class="dpm-grid">`;
    F.stones.forEach((st) => { h += `<button type="button" class="dpm-card${flagArm.stone === st.key ? ' on' : ''}" data-fstone="${st.key}" title="${esc(st.note)}"><img alt="" src="${F.thumb({ stone: st.key, pattern: flagArm.pattern, infill: flagArm.infill, joint: flagArm.joint }, 64)}" /><span>${esc(st.name)}</span></button>`; });
    h += '</div>';
    if (flagArm.style === 'fill') {
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
    h += '<p class="empty-sub" style="margin-top:12px;opacity:.6">Flagstone tools: stepping-stones version</p>';
    flagSec.innerHTML = h;
    const again = () => renderFlagCatalog(tool);
    flagSec.querySelectorAll('[data-fstyle]').forEach((b) => b.addEventListener('click', () => { flagArm.style = b.dataset.fstyle; if (isPath) flagArm.width = F.styleWidth[flagArm.style] || 3; again(); }));
    flagSec.querySelectorAll('[data-fcut]').forEach((b) => b.addEventListener('click', () => { flagArm.cut = b.dataset.fcut; again(); }));
    flagSec.querySelectorAll('[data-flen]').forEach((b) => b.addEventListener('click', () => { flagArm.len = Number(b.dataset.flen); again(); }));
    flagSec.querySelectorAll('[data-fstone]').forEach((b) => b.addEventListener('click', () => { flagArm.stone = b.dataset.fstone; again(); }));
    flagSec.querySelectorAll('[data-fpat]').forEach((b) => b.addEventListener('click', () => { flagArm.pattern = b.dataset.fpat; again(); }));
    flagSec.querySelectorAll('[data-finfill]').forEach((b) => b.addEventListener('click', () => { flagArm.infill = b.dataset.finfill; again(); }));
    flagSec.querySelectorAll('[data-fjoint]').forEach((b) => b.addEventListener('click', () => { flagArm.joint = Number(b.dataset.fjoint); again(); }));
    const w = $('fl-width'); if (w) w.addEventListener('change', () => { flagArm.width = clamp(Number(w.value) || 3, 1, 12); });
    const cu = $('fl-curved'); if (cu) cu.addEventListener('click', () => { flagArm.curved = !flagArm.curved; again(); });
  }
  DPRO.hints['area-flagstone'] = 'Click around the outline of the patio or path, like a bed. Press Enter to finish (Esc to cancel). Pick the style, stone and fill in the Catalog tab.';
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
    const placed = sp.style !== 'fill';
    let h = DPRO.fieldHtml(isPath ? 'Path style' : 'Flagstone style', `<select id="fp-style">${styOpts}</select>`) + (placed ? DPRO.fieldHtml('Stone cut', `<select id="fp-cut"><option value="square" ${sp.cut === 'square' ? 'selected' : ''}>Square-cut pavers</option><option value="natural" ${sp.cut === 'natural' ? 'selected' : ''}>Natural-cut</option></select>`) + DPRO.fieldHtml('Stone length', `<select id="fp-len">${lenOpts}</select>`) : '') + `<div class="design-properties-field"><label>Flagstone</label><div class="dpm-propwrap"><img alt="" src="${F.thumb(sp, 56)}" /><select id="fp-stone">${stoneOpts}</select></div></div>` +
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
    if ($('fp-style')) $('fp-style').addEventListener('change', (e) => { const v = e.target.value; if (isPath) el.widthFt = F.styleWidth[v] || el.widthFt || 3; upd('style', v); });
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

  // ---- flagstone areas laid as single pavers / stepping stones: draw the stones inside the outline ----
  const prevBuildArea = window.buildAreaNode;
  window.buildAreaNode = function (el) {
    const g = prevBuildArea.apply(this, arguments);
    try {
      if (!el || el.subtype !== 'flagstone') return g;
      const sp = F.spec(el); if (sp.style === 'fill') return g;
      const lay = F.layout(el, pxPerFt); const line = (g.findOne && g.findOne('.main')) || (g.getChildren && g.getChildren()[0]); if (!line) return g;
      if (sp.infill !== 'lawn') { const it = DPRO.texture(sp.infill); const isc = (pxPerFt * it.ft) / it.canvas.width; line.fillPatternImage(it.canvas); line.fillPatternScaleX(isc); line.fillPatternScaleY(isc); line.fillPatternRepeat('repeat'); }
      else { line.fillPatternImage(null); line.fill('rgba(0,0,0,0.001)'); }
      line.shadowEnabled(false);
      if (!lay || !lay.stones.length) return g;
      const st = DPRO.texture('stone|' + sp.stone); const ssc = (pxPerFt * st.ft) / st.canvas.width; const sg = new Konva.Group({ listening: false });
      lay.stones.forEach((s) => {
        const ca = Math.cos(s.ang), sa = Math.sin(s.ang); const pts = []; s.poly.forEach(([x, y]) => pts.push(s.cx + x * ca - y * sa, s.cy + x * sa + y * ca));
        sg.add(new Konva.Line({ points: pts, closed: true, fillPatternImage: st.canvas, fillPatternRepeat: 'repeat', fillPatternScaleX: ssc, fillPatternScaleY: ssc, fillPatternOffsetX: s.off * 10 * pxPerFt, fillPatternOffsetY: ((s.off * 7) % 1) * 10 * pxPerFt, stroke: 'rgba(30,22,15,0.6)', strokeWidth: 0.5, lineJoin: 'round', shadowColor: 'rgba(0,0,0,0.45)', shadowBlur: 3, shadowOffset: { x: 1, y: 1.5 }, shadowOpacity: 0.7 }));
        if (Math.abs(s.tone - 1) > 0.02) sg.add(new Konva.Line({ points: pts, closed: true, fill: s.tone > 1 ? 'rgba(255,255,255,' + ((s.tone - 1) * 0.9).toFixed(3) + ')' : 'rgba(0,0,0,' + ((1 - s.tone) * 1.1).toFixed(3) + ')' }));
      });
      line.moveToBottom && 0; g.add(sg);
      line.on('dragmove', () => sg.position({ x: line.x(), y: line.y() })); line.on('dragend', () => { sg.position({ x: 0, y: 0 }); });
      const lab = g.getChildren().filter((n) => n.className === 'Text'); lab.forEach((t) => t.moveToTop());
    } catch (err) { console.warn('flagstone stones failed', err); }
    return g;
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
    { tool: 'boulder', label: 'Boulder', title: 'Place decorative boulders' },
    { id: 'btn-dpm-list', label: 'Quantities', title: 'Cubic yards and tons of each material', onclick: () => switchSidePanel('materials') },
  ]);
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
  const ICON = {
    plus: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    minus: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M5 12h14"/></svg>',
    home: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/></svg>',
    left: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 5.5 8 12l6.5 6.5"/></svg>',
    right: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 5.5 16 12l-6.5 6.5"/></svg>',
    play: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M7 4.5v15l12-7.5z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M6.5 4.5h4v15h-4zM13.5 4.5h4v15h-4z"/></svg>',
    close: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    fold: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9.5l6 6 6-6"/></svg>',
  };
  const css = document.createElement('style');
  css.textContent = `
  #dpro3d{position:fixed;inset:0;z-index:5000;background:#0b0f14;display:flex;flex-direction:column;color:#EDEDED;font-family:inherit;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}
  #dpro3d[hidden]{display:none}
  .d3-top{display:flex;gap:8px;align-items:center;padding:8px 10px;background:#161b22;border-bottom:1px solid #2a313b}
  .d3-top h3{margin:0;font-size:15px;font-weight:700;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .d3-btn{background:#232a34;color:#EDEDED;border:1px solid #37404d;border-radius:10px;padding:9px 13px;font-size:13.5px;font-family:inherit;cursor:pointer;touch-action:manipulation;min-height:40px;display:inline-flex;align-items:center;justify-content:center;gap:6px}
  .d3-btn.on{background:#2F7F9E;border-color:#5BB6D6;color:#fff}
  .d3-btn:active{filter:brightness(1.25)}
  .d3-x{padding:9px 14px}
  #d3-wrap{position:relative;flex:1;min-height:0;overflow:hidden}
  #d3-wrap canvas{display:block;width:100%;height:100%;touch-action:none;outline:none}
  .d3-fab{position:absolute;right:10px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:8px}
  .d3-fab button,.d3-turn button.d3-round{width:48px;height:48px;border-radius:50%;background:rgba(22,27,34,.9);border:1px solid #3b4553;color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;touch-action:manipulation;padding:0;box-shadow:0 2px 8px rgba(0,0,0,.35)}
  .d3-fab button:active,.d3-turn button:active{background:#2F7F9E}
  .d3-turn{position:absolute;left:10px;bottom:10px;display:flex;gap:8px;align-items:center}
  .d3-turn .d3-tour{background:rgba(22,27,34,.9);border-radius:24px;height:48px;padding:0 16px;box-shadow:0 2px 8px rgba(0,0,0,.35)}
  .d3-turn .d3-tour.on{background:#2F7F9E}
  #d3-msg:empty{display:none}
  #d3-msg{position:absolute;left:10px;right:70px;top:10px;background:rgba(11,15,20,.84);padding:9px 12px;border-radius:10px;font-size:13px;line-height:1.35;border:1px solid #2a313b;cursor:pointer}
  #d3-info{position:absolute;left:50%;transform:translateX(-50%);bottom:68px;max-width:min(92%,420px);background:rgba(18,23,30,.96);border:1px solid #3b4553;border-radius:12px;padding:10px 12px;display:flex;gap:12px;align-items:center;box-shadow:0 4px 18px rgba(0,0,0,.5)}
  #d3-info[hidden]{display:none}
  #d3-info b{display:block;font-size:14.5px}
  #d3-info span{display:block;font-size:12.5px;color:#9fb0c3;margin-top:2px}
  #d3-info button{background:none;border:0;color:#9fb0c3;cursor:pointer;padding:6px}
  #d3-pad{position:absolute;right:68px;bottom:12px;display:none;grid-template-columns:repeat(3,48px);grid-template-rows:repeat(2,48px);gap:6px}
  #d3-pad.show{display:grid}
  #d3-pad button{background:rgba(35,42,52,.9);border:1px solid #3b4553;border-radius:12px;color:#fff;font-size:18px;touch-action:none}
  #d3-loading[hidden]{display:none}
  #d3-loading{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:15px;background:#0b0f14;z-index:3}
  .d3-dock{background:#161b22;border-top:1px solid #2a313b;flex:none}
  .d3-tabs{display:flex;align-items:stretch}
  .d3-tab{flex:1;min-width:0;padding:9px 4px;font-size:13px;font-family:inherit;background:none;border:0;border-bottom:3px solid transparent;color:#9fb0c3;cursor:pointer;touch-action:manipulation;white-space:nowrap}
  .d3-tab.on{color:#fff;border-bottom-color:#5BB6D6;font-weight:700}
  .d3-fold{flex:none;width:46px;display:flex;align-items:center;justify-content:center}
  .d3-dock.folded .d3-fold svg{transform:rotate(180deg)}
  .d3-panel{display:none;padding:8px 10px 10px;max-height:36vh;overflow:auto}
  .d3-dock:not(.folded) .d3-panel.show{display:block}
  .d3-row{display:flex;gap:8px;align-items:center;margin-bottom:7px;flex-wrap:wrap}
  .d3-row:last-child{margin-bottom:0}
  .d3-lbl{font-size:12px;color:#9fb0c3;width:64px;flex:none}
  .d3-seg{display:flex;gap:6px;flex-wrap:wrap;flex:1;min-width:0}
  .d3-seg .d3-btn{flex:1 1 74px;padding:8px 6px}
  .d3-row select{background:#232a34;color:#EDEDED;border:1px solid #37404d;border-radius:8px;padding:9px;font-size:14px;min-height:42px}
  .d3-row input[type=range]{accent-color:#5BB6D6;flex:1;min-width:120px;height:32px}
  .d3-time{font-size:12.5px;color:#cfd8e3;min-width:150px}
  .d3-note{font-size:12px;color:#8fa0b4;margin:2px 0 0}
  #dpro3d.walking #d3-tour{display:none}
  @media (max-width:560px){.d3-lbl{width:100%}.d3-fab button,.d3-turn button.d3-round{width:46px;height:46px}.d3-panel{max-height:40vh}}
  `;
  document.head.appendChild(css);

  const modal = document.createElement('div');
  modal.id = 'dpro3d'; modal.hidden = true;
  modal.innerHTML = `
    <div class="d3-top">
      <h3>3D view</h3>
      <button class="d3-btn" id="d3-save" type="button">Save image</button>
      <button class="d3-btn d3-x" id="d3-close" type="button" aria-label="Close 3D view">${ICON.close} Close</button>
    </div>
    <div id="d3-wrap"><div id="d3-loading">Building the 3D model...</div><div id="d3-msg"></div>
      <div class="d3-fab">
        <button id="d3-zin" type="button" aria-label="Zoom in">${ICON.plus}</button>
        <button id="d3-zout" type="button" aria-label="Zoom out">${ICON.minus}</button>
        <button id="d3-reset" type="button" aria-label="Reset the view">${ICON.home}</button>
      </div>
      <div class="d3-turn">
        <button class="d3-round" id="d3-tl" type="button" aria-label="Turn left">${ICON.left}</button>
        <button class="d3-round" id="d3-tr" type="button" aria-label="Turn right">${ICON.right}</button>
        <button class="d3-btn d3-tour" id="d3-tour" type="button">${ICON.play}<span>Auto tour</span></button>
      </div>
      <div id="d3-info" hidden><div><b></b><span></span></div><button type="button" aria-label="Close">${ICON.close}</button></div>
      <div id="d3-pad"><span></span><button data-k="w" type="button">&uarr;</button><span></span><button data-k="a" type="button">&larr;</button><button data-k="s" type="button">&darr;</button><button data-k="d" type="button">&rarr;</button></div>
    </div>
    <div class="d3-dock" id="d3-dock">
      <div class="d3-tabs">
        <button class="d3-tab on" data-d3tab="view" type="button">View</button>
        <button class="d3-tab" data-d3tab="time" type="button">Time</button>
        <button class="d3-tab" data-d3tab="season" type="button">Season</button>
        <button class="d3-tab" data-d3tab="plants" type="button">Plants</button>
        <button class="d3-tab" data-d3tab="show" type="button">Show</button>
        <button class="d3-tab d3-fold" id="d3-fold" type="button" aria-label="Hide or show the controls">${ICON.fold}</button>
      </div>
      <div class="d3-panel show" data-d3panel="view">
        <div class="d3-row"><span class="d3-lbl">View</span><div class="d3-seg">
          <button class="d3-btn on" data-view="aerial" type="button">Aerial</button>
          <button class="d3-btn" data-view="top" type="button">Top-down</button>
          <button class="d3-btn" data-view="walk" type="button">Walk through</button></div></div>
        <div class="d3-row"><span class="d3-lbl">Look from</span><div class="d3-seg">
          <button class="d3-btn" data-view="front" type="button" title="From the bottom edge of the plan">Front</button>
          <button class="d3-btn" data-view="right" type="button">Right</button>
          <button class="d3-btn" data-view="back" type="button">Back</button>
          <button class="d3-btn" data-view="left" type="button">Left</button></div></div>
      </div>
      <div class="d3-panel" data-d3panel="time">
        <div class="d3-row"><span class="d3-lbl">Light</span><div class="d3-seg">
          <button class="d3-btn" data-hour="8" type="button">Morning</button>
          <button class="d3-btn" data-hour="12.5" type="button">Midday</button>
          <button class="d3-btn" data-hour="16" type="button">Afternoon</button>
          <button class="d3-btn" data-hour="19.5" type="button">Evening</button>
          <button class="d3-btn" id="d3-night" type="button">Night lighting</button></div></div>
        <div class="d3-row"><span class="d3-lbl">Sun</span><input id="d3-hour" type="range" min="5" max="22" step="0.25" value="15" aria-label="Time of day" /><span class="d3-time" id="d3-time"></span></div>
      </div>
      <div class="d3-panel" data-d3panel="season">
        <div class="d3-row"><span class="d3-lbl">Season</span><div class="d3-seg">
          <button class="d3-btn" data-season="4" type="button">Spring</button>
          <button class="d3-btn" data-season="6" type="button">Summer</button>
          <button class="d3-btn" data-season="9" type="button">Fall</button>
          <button class="d3-btn" data-season="0" type="button">Winter</button></div></div>
        <div class="d3-row"><span class="d3-lbl">Month</span><select id="d3-month" aria-label="Month">${MONTHS.map((m, i) => `<option value="${i}">${m}</option>`).join('')}</select></div>
      </div>
      <div class="d3-panel" data-d3panel="plants">
        <div class="d3-row"><span class="d3-lbl">Plant size</span><div class="d3-seg">
          ${Object.keys(CATP.GROWTH_LABELS).map((k) => `<button class="d3-btn${k === 'mature' ? ' on' : ''}" data-growth="${k}" type="button">${CATP.GROWTH_LABELS[k]}</button>`).join('')}</div></div>
        <p class="d3-note">See how the plants look when they are first installed and as they grow in.</p>
      </div>
      <div class="d3-panel" data-d3panel="show">
        <div class="d3-row"><span class="d3-lbl">Show</span><div class="d3-seg">
          <button class="d3-btn" id="d3-labels" type="button">Plant names</button>
          <button class="d3-btn" id="d3-irr" type="button">Sprinklers</button></div></div>
      </div>
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
    ground.material.color.set(ground.material.map ? (night ? '#6f8f75' : '#d3e4c2') : (night ? '#27402B' : '#86A76F'));
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

  // ---- realistic ground surfaces (rock, gravel, mulch, lawn, pavers ... from design-materials.js) ----
  const PBR = {};
  function matMaps(key) {
    if (PBR[key] !== undefined) return PBR[key];
    const M = DPRO.mat; const t = M && M.tex(key);
    if (!t) return (PBR[key] = null);
    const mk = (cv, srgb) => { const tx = new THREE.CanvasTexture(cv); tx.wrapS = tx.wrapT = THREE.RepeatWrapping; if (srgb) tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 8; tx.repeat.set(1 / t.ft, 1 / t.ft); return tx; };
    return (PBR[key] = { map: mk(t.canvas, true), bump: mk(t.height, false), ft: t.ft });
  }
  const SURF_KEY = { lawn: 'lawn', turf: 'turf', hardscape: 'conc', driveway: 'conc', pavers: 'pavers', flagstone: 'flagstone', deck: 'deck' };
  const SURF_ROUGH = { lawn: 1, turf: 0.95, conc: 0.92, pavers: 0.85, flagstone: 0.8, deck: 0.62 };
  const SURF_BUMP = { lawn: 1.1, turf: 0.8, conc: 0.5, pavers: 1.3, flagstone: 1.8, deck: 0.9 };
  function surfaceMat(el) {
    const M = DPRO.mat; const sub = el.subtype;
    let key = null;
    if (M && (sub === 'bed' || sub === 'gravel')) key = M.keyFor(el); else if (M && sub === 'flagstone') key = M.flag.key(el); else if (SURF_KEY[sub]) key = SURF_KEY[sub];
    const mp = key && matMaps(key);
    if (!mp) return null;
    const m = M && M.by[key];
    return std('pbr-' + key, { map: mp.map, bumpMap: mp.bump, bumpScale: m ? m.bump * 0.55 : (sub === 'flagstone' ? 2.4 : (SURF_BUMP[key] || SURF_BUMP[sub] || 1)), roughness: m ? m.rough : (sub === 'flagstone' ? 0.82 : (SURF_ROUGH[key] || 0.9)), alphaTest: sub === 'flagstone' && /\|lawn\|/.test(key) ? 0.5 : 0 });
  }
  const INFILL_LABEL = (el) => { const sp = DPRO.mat.flag.spec(el); return DPRO.mat.flag.infillName(sp.infill) + ' between stones'; };
  function inPoly(pts, x, z) {
    let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const a = pts[i], b = pts[j]; if ((a.z > z) !== (b.z > z) && x < ((b.x - a.x) * (z - a.z)) / (b.z - a.z) + a.x) c = !c;
    } return c;
  }
  function polyAreaFt(pts) { let a = 0; for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; a += p.x * q.z - q.x * p.z; } return Math.abs(a) / 2; }
  let stoneBudget = 0;
  const stoneGeo = {};
  function stoneGeometry(kind) {
    if (stoneGeo[kind]) return stoneGeo[kind];
    const R = DPRO.mat.rng(kind === 'round' ? 11 : 12);
    const geo = kind === 'round' ? new THREE.SphereGeometry(0.5, 9, 6) : new THREE.IcosahedronGeometry(0.5, 1);
    const pos = geo.attributes.position; const jit = new Map();
    for (let i = 0; i < pos.count; i++) {
      const key = pos.getX(i).toFixed(3) + ',' + pos.getY(i).toFixed(3) + ',' + pos.getZ(i).toFixed(3);
      if (!jit.has(key)) jit.set(key, 0.84 + R() * (kind === 'round' ? 0.2 : 0.34));
      const k = jit.get(key); pos.setXYZ(i, pos.getX(i) * k, pos.getY(i) * k, pos.getZ(i) * k);
    }
    geo.computeVertexNormals(); return (stoneGeo[kind] = geo);
  }
  function scatterStones(pts, topY, m, g, seed, skip) {
    const diam = m.d3; const area = polyAreaFt(pts); if (area < 1 || stoneBudget <= 0) return;
    let want = Math.round((area * (m.cover || 0.5)) / (Math.PI * (diam / 2) * (diam / 2) * 0.9));
    let n = Math.min(want, stoneBudget, 9000); if (n < 8) return;
    const sc = Math.max(1, Math.min(2, Math.sqrt(want / n)));
    stoneBudget -= n;
    const geo = stoneGeometry(m.kind === 'round' ? 'round' : 'angular');
    const mat = std('stones-' + m.key, { color: '#ffffff', roughness: m.rough, metalness: m.gloss ? 0.15 : 0 });
    const im = new THREE.InstancedMesh(geo, mat, n); im.receiveShadow = true; im.castShadow = false;
    const R = DPRO.mat.rng(DPRO.mat.hashStr(m.key) + seed); const pal = m.pal.map((h) => new THREE.Color(h));
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; pts.forEach((p) => { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z); });
    const d = new THREE.Object3D(); const col = new THREE.Color(); let placed = 0, tries = 0;
    while (placed < n && tries < n * 14) {
      tries++; const x = x0 + R() * (x1 - x0), z = z0 + R() * (z1 - z0); if (!inPoly(pts, x, z)) continue; if (skip && skip(x, z)) continue;
      const s = diam * sc * (0.7 + R() * 0.65), flat = 0.42 + R() * 0.3;
      d.position.set(x, topY + s * flat * 0.18, z); d.rotation.set((R() - 0.5) * 0.5, R() * 6.283, (R() - 0.5) * 0.5);
      d.scale.set(s * (0.85 + R() * 0.4), s * flat, s * (0.8 + R() * 0.35)); d.updateMatrix(); im.setMatrixAt(placed, d.matrix);
      col.copy(pal[(R() * pal.length) | 0]).multiplyScalar(0.8 + R() * 0.35); im.setColorAt(placed, col); placed++;
    }
    im.count = placed; im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
    g.add(im);
  }

  // ---- boulders: lumpy, faceted rock with colour variation (no two alike) ----
  const nz = (() => { // smooth 3D value noise
    const h = (x, y, z) => { let n = (x * 374761393 + y * 668265263 + z * 2147483647) | 0; n = (n ^ (n >>> 13)) * 1274126177 | 0; return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
    const sm = (t) => t * t * (3 - 2 * t);
    return (x, y, z) => {
      const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = sm(x - xi), yf = sm(y - yi), zf = sm(z - zi);
      const l = (a, b, t) => a + (b - a) * t;
      return l(l(l(h(xi, yi, zi), h(xi + 1, yi, zi), xf), l(h(xi, yi + 1, zi), h(xi + 1, yi + 1, zi), xf), yf), l(l(h(xi, yi, zi + 1), h(xi + 1, yi, zi + 1), xf), l(h(xi, yi + 1, zi + 1), h(xi + 1, yi + 1, zi + 1), xf), yf), zf);
    };
  })();
  function boulderMesh(el) {
    const M = DPRO.mat; const rock = (M && M.rockBy[el.rock]) || { pal: ['#8d8f92', '#a4a6a9', '#7a7c80'], rough: 0.85, flat: true, key: 'granite' };
    const R = M ? M.rng((el.seed || 1) * 97 + 5) : Math.random; const size = (el.sizeFt || 2.5) / 2;
    const A = size * (0.95 + R() * 0.2), B = size * (0.62 + R() * 0.18), C = size * (0.85 + R() * 0.2);
    const planes = []; const nPl = rock.flat ? 9 : 4;
    for (let i = 0; i < nPl; i++) { const a = R() * 6.283, b = Math.acos(2 * R() - 1); const nx = Math.sin(b) * Math.cos(a), ny = Math.cos(b), nzz = Math.sin(b) * Math.sin(a); planes.push([nx, ny, nzz, (rock.flat ? 0.72 : 0.84) + R() * 0.16]); }
    const off = R() * 50; const pal = rock.pal.map((h) => new THREE.Color(h));
    const shape = (dx, dy, dz) => {
      let l = Math.hypot(dx, dy, dz) || 1; dx /= l; dy /= l; dz /= l;
      const nn = nz(dx * 1.6 + off, dy * 1.6, dz * 1.6) * 0.5 + nz(dx * 3.4 + off, dy * 3.4, dz * 3.4) * 0.25 + nz(dx * 7.5 + off, dy * 7.5, dz * 7.5) * 0.12;
      let px = dx * A * (0.86 + nn * 0.3), py = dy * B * (0.86 + nn * 0.3), pz = dz * C * (0.86 + nn * 0.3);
      for (const [nx, ny, nzz, c] of planes) { const t = (px * nx + py * ny + pz * nzz) / size; if (t > c) { const k = c / t; px *= k; py *= k; pz *= k; } }
      if (py < -B * 0.55) py = -B * 0.55 - (-B * 0.55 - py) * 0.1; // flat-ish underside
      return [px, py, pz];
    };
    const SEG_U = rock.flat ? 64 : 48, SEG_V = rock.flat ? 44 : 32, geo = new THREE.SphereGeometry(1, SEG_U, SEG_V); const pos = geo.attributes.position; const nor = geo.attributes.normal;
    const colors = new Float32Array(pos.count * 3); const e = 0.012;
    for (let i = 0; i < pos.count; i++) {
      const dx = pos.getX(i), dy = pos.getY(i), dz = pos.getZ(i);
      const p = shape(dx, dy, dz); pos.setXYZ(i, p[0], p[1], p[2]);
      // normal from the shape itself (so seams and poles match)
      let tx, ty, tz; if (Math.abs(dy) < 0.9) { tx = -dz; ty = 0; tz = dx; } else { tx = 1; ty = 0; tz = 0; }
      const tl = Math.hypot(tx, ty, tz); tx /= tl; ty /= tl; tz /= tl;
      const bx = dy * tz - dz * ty, by = dz * tx - dx * tz, bz = dx * ty - dy * tx;
      const p1 = shape(dx + tx * e, dy + ty * e, dz + tz * e), p2 = shape(dx + bx * e, dy + by * e, dz + bz * e);
      const u = [p1[0] - p[0], p1[1] - p[1], p1[2] - p[2]], v = [p2[0] - p[0], p2[1] - p[1], p2[2] - p[2]];
      let nx = u[1] * v[2] - u[2] * v[1], ny = u[2] * v[0] - u[0] * v[2], nzz = u[0] * v[1] - u[1] * v[0]; const nl = Math.hypot(nx, ny, nzz) || 1; nx /= nl; ny /= nl; nzz /= nl;
      if (nx * dx + ny * dy + nzz * dz < 0) { nx = -nx; ny = -ny; nzz = -nzz; }
      nor.setXYZ(i, nx, ny, nzz);
      // colour: blotches + strata + dark cracks + a little lichen on top
      const q = nz(p[0] * 1.3 + off, p[1] * 1.3, p[2] * 1.3), q2 = nz(p[0] * 5 + off, p[1] * 5, p[2] * 5);
      const c = pal[Math.min(pal.length - 1, Math.floor(q * pal.length))].clone().lerp(pal[(Math.floor(q2 * pal.length)) % pal.length], 0.45);
      if (rock.key === 'sandstone' || rock.key === 'redstone' || rock.key === 'limestone') c.multiplyScalar(0.86 + 0.18 * Math.sin(p[1] * 7 + q * 5));
      c.multiplyScalar(0.85 + 0.3 * q2);
      if (rock.key === 'moss' || (rock.key === 'granite' && q2 > 0.66)) { const top = Math.max(0, ny); const mw = nz(p[0] * 3 + off, p[1] * 3, p[2] * 3) * top; if (mw > (rock.key === 'moss' ? 0.28 : 0.4)) c.lerp(new THREE.Color(rock.key === 'moss' ? '#5f7a3f' : '#7d8f5c'), rock.key === 'moss' ? 0.75 : 0.45); }
      if (rock.key === 'lava') { c.multiplyScalar(0.7 + 0.5 * Math.max(0, nz(p[0] * 9 + off, p[1] * 9, p[2] * 9) - 0.5) * 2); }
      const cav = (Math.hypot(p[0] / A, p[1] / B, p[2] / C) < 0.8) ? 0.8 : 1; c.multiplyScalar(cav);
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: rock.rough, metalness: 0 });
    const mesh = new THREE.Mesh(geo, mat); mesh.castShadow = true; mesh.receiveShadow = true;
    mesh.rotation.y = -(el.rotationDeg || 0) * Math.PI / 180;
    mesh.position.set(el.x / pxPerFt, B * 0.5 + 0.04, el.y / pxPerFt);
    mesh.userData.pick = { title: rock.name || 'Boulder', sub: (el.sizeFt || 2.5) + ' ft boulder' };
    return mesh;
  }

  // ======================= Geometry helpers =======================
  const ftPts = (el) => { const out = []; for (let i = 0; i < el.points.length; i += 2) out.push({ x: el.points[i] / pxPerFt, z: el.points[i + 1] / pxPerFt }); return out; };
  function shapeOf(pts) { const sh = new THREE.Shape(); pts.forEach((p, i) => (i ? sh.lineTo(p.x, -p.z) : sh.moveTo(p.x, -p.z))); sh.closePath(); return sh; }
  // individually placed pavers / stepping stones along a path (one big paver, two side by side, zipper)
  function placedStones(el, g, idx, onLawn) {
    const F = DPRO.mat.flag, src = el._src || el, lay = F.layout(src, pxPerFt); if (!lay) return null;
    const sp = F.spec(src), key = 'stone|' + sp.stone, mp = matMaps(key); if (!mp) return null;
    const base = onLawn ? 0.02 : 0.05, topY = onLawn ? 0.15 : 0.19; const polys = [];
    lay.stones.forEach((st) => {
      const ca = Math.cos(st.ang), sa = Math.sin(st.ang); const pts = st.poly.map(([x, y]) => ({ x: (st.cx + x * ca - y * sa) / pxPerFt, z: (st.cy + x * sa + y * ca) / pxPerFt }));
      const tb = Math.round(st.tone * 33) / 33; const c = Math.min(1, 0.95 * tb);
      const top = std('pstone-' + sp.stone + '-' + tb, { map: mp.map, bumpMap: mp.bump, bumpScale: 2.4, roughness: 0.82, color: new THREE.Color(c, c, c) });
      const sd = std('pstone-side-' + sp.stone, { color: new THREE.Color(((DPRO.mat.flag.stoneBy[sp.stone] || {}).pal || ['#8a7f70'])[0]).multiplyScalar(0.8), roughness: 0.9 });
      const m = slab(pts, topY + idx * 0.0003, base, top, sd); m.castShadow = true;
      m.userData.pick = { title: 'Flagstone path · ' + F.stoneBy[sp.stone].name, sub: F.styleName(sp.style) + ' · ' + sp.len + ' ft stones · ' + F.infillName(sp.infill) + ' between' + (el.label ? ' · ' + el.label : '') };
      g.add(m); polys.push(pts);
    });
    return polys;
  }
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
    grp.userData.pick = { title: plant.name, sub: plant.category + ' \u00b7 about ' + Math.round(h) + ' ft tall x ' + Math.round(w) + ' ft wide' + (CATP.GROWTH_LABELS && state.growth !== 'mature' ? ' (' + CATP.GROWTH_LABELS[state.growth] + ')' : ' when mature') };
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
        let rr = 0; if (e.type === 'boulder') rr = (e.sizeFt || 2.5) / 2; if (e.type === 'plant') { const pl = CATP.PLANT_CATALOG.find((p) => p.key === e.plantKey); if (pl) { rr = pl.spreadFt / 2; tall = Math.max(tall, pl.heightFt * ((CATP.GROWTH[state.growth] || CATP.GROWTH.mature)[pl.category] || 1)); } }
        add(e.x / pxPerFt - rr, e.y / pxPerFt - rr); add(e.x / pxPerFt + rr, e.y / pxPerFt + rr);
      }
    });
    if (x0 > x1) { x0 = -30; x1 = 30; z0 = -30; z1 = 30; }
    bounds = { cx: (x0 + x1) / 2, cz: (z0 + z1) / 2, r: Math.max(20, Math.hypot(x1 - x0, z1 - z0) / 2, tall * 0.85), x0, x1, z0, z1 };
  }
  function buildScene() {
    if (root) { scene.remove(root); root.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); }
    spots.forEach((s) => { if (s.parent) s.parent.remove(s); }); spots = [];
    { const inf = $('d3-info'); if (inf) inf.hidden = true; }
    root = new THREE.Group(); scene.add(root);
    const info = { buildings: [], barriers: [], litCount: 0 };
    let idx = 0; stoneBudget = 7000;
    // surfaces first, then buildings/barriers (mounting heights), then plants, then lights
    const surfEls = elements.map((e) => {
      if (e.type === 'area' && e.subtype === 'flagstone' && DPRO.mat && DPRO.mat.flag.spec(e).style !== 'fill' && e.points && e.points.length >= 6) { const sp0 = DPRO.mat.flag.spec(e); return Object.assign({}, e, { subtype: 'bed', material: sp0.infill === 'lawn' ? null : sp0.infill, _path: true, _src: e, _placed: true, _lawn: sp0.infill === 'lawn' }); }
      if (!(e.type === 'stonepath' && DPRO.mat)) return e;
      const sp = DPRO.mat.flag.spec(e), pp = DPRO.mat.flag.pathPoly(e, pxPerFt);
      if (sp.style === 'fill') return Object.assign({}, e, { type: 'area', subtype: 'flagstone', points: pp, _path: true });
      return Object.assign({}, e, { type: 'area', subtype: 'bed', material: sp.infill === 'lawn' ? null : sp.infill, points: pp, _path: true, _src: e, _placed: true, _lawn: sp.infill === 'lawn' });
    });
    surfEls.forEach((el) => {
      if (el.type !== 'area' || !el.points || el.points.length < 6) return;
      idx++;
      if (el.subtype === 'building') return;
      const pts = ftPts(el);
      let stonePolys = null;
      if (el._placed) { try { stonePolys = placedStones(el, root, idx, el._lawn); } catch (err) { console.warn('path stones failed', err); } if (el._lawn) return; }
      if (el.subtype === 'boundary') { const ln = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts.map((p) => new THREE.Vector3(p.x, 0.2, p.z))), new THREE.LineBasicMaterial({ color: '#E5E5E5' })); root.add(ln); return; }
      const top = el._placed ? 0.12 + idx * 0.0008 : (LIFT[el.subtype] || 0.1) + idx * 0.0008;
      let topMat = surfaceMat(el);
      if (!topMat) {
        if (el.subtype === 'bed') topMat = std('bed-' + (el.surface || 'bark'), { map: planTex({ rock: 'rock', soil: 'soil' }[el.surface] || 'bark'), roughness: 1 });
        else if (SURF[el.subtype]) topMat = el.subtype === 'water' ? new THREE.MeshStandardMaterial({ map: planTex('water'), roughness: 0.15, metalness: 0.25, transparent: true, opacity: 0.88 }) : std('surf-' + el.subtype, { map: planTex(SURF[el.subtype]) });
        else topMat = std('surf-default', { color: '#B5B0A0' });
      }
      const side = el.subtype === 'deck' ? std('deck-side', { color: '#6B4A2A' }) : (el.subtype === 'bed' || el.subtype === 'gravel') && DPRO.mat ? std('edge-' + DPRO.mat.keyFor(el), { color: new THREE.Color((DPRO.mat.by[DPRO.mat.keyFor(el)] || {}).base || '#4a3a2a').multiplyScalar(1.6) }) : std('slab-side', { color: '#6F6F68' });
      const sl = slab(pts, top, 0, topMat, el.subtype === 'flagstone' && DPRO.mat && DPRO.mat.flag.spec(el).infill === 'lawn' ? std('side-hidden', { visible: false }) : side);
      const mk = DPRO.mat && (el.subtype === 'bed' || el.subtype === 'gravel') ? DPRO.mat.keyFor(el) : null; const mdef = mk && DPRO.mat.by[mk];
      sl.userData.pick = { title: mdef ? mdef.name : (el.subtype === 'flagstone' && DPRO.mat ? (el._path ? 'Flagstone path' : 'Flagstone') + ' \u00b7 ' + DPRO.mat.flag.stoneBy[DPRO.mat.flag.spec(el).stone].name : ((CATP.AREA_PRESETS.find((p) => p.key === el.subtype) || {}).name || 'Surface')), sub: (el.subtype === 'flagstone' && DPRO.mat ? INFILL_LABEL(el) + ' \u00b7 ' : '') + Math.round(polyAreaFt(pts)) + ' sq ft' + (el.label ? ' \u00b7 ' + el.label : '') };
      if (el._placed) sl.userData.pick = { title: 'Flagstone path \u00b7 ' + DPRO.mat.flag.infillName(el.material) + ' between the stones', sub: Math.round(polyAreaFt(pts)) + ' sq ft' + (el.label ? ' \u00b7 ' + el.label : '') };
      root.add(sl);
      if (mdef && mdef.d3) scatterStones(pts, top, mdef, root, idx, stonePolys ? (x, z) => stonePolys.some((pp) => inPoly(pp, x, z)) : null);
    });
    const tagged = (el, pick, fn) => { const n0 = root.children.length; fn(); for (let i = n0; i < root.children.length; i++) root.children[i].userData.pick = pick; };
    elements.forEach((el) => { if (el.type === 'area' && el.subtype === 'building') tagged(el, { title: el.label || 'House / building', sub: Math.round(polyAreaFt(ftPts(el))) + ' sq ft footprint' }, () => buildBuilding(el, root, info)); });
    elements.forEach((el) => { if (el.type === 'barrier' && el.points) { const bt = (CATP.BARRIER_TYPES || []).find((b) => b.key === el.subtype); tagged(el, { title: bt ? bt.name : 'Wall / fence', sub: (el.heightFt || (bt && bt.heightFt) || 0) + ' ft tall' }, () => buildBarrier(el, root, info)); } });
    elements.forEach((el) => { if (el.type === 'boulder' && DPRO.mat) { try { const bm = boulderMesh(el); if (bm) root.add(bm); } catch (err) { console.warn('boulder failed', err); } } });
    elements.forEach((el) => { if (el.type === 'plant') { const pl = CATP.PLANT_CATALOG.find((p) => p.key === el.plantKey); if (pl) buildPlant(el, pl, root, info); } });
    if (state.irrigation) buildIrrigation(root);
    let budget = 6000;
    const lp = (k) => (DPRO.light && DPRO.light.P ? DPRO.light.P(k) : null);
    elements.forEach((el) => { if (el.type === 'lightrun' && el.points) { const p = lp(el.key); tagged(el, { title: p ? p.name : 'Light run', sub: 'Lighting' }, () => buildLightRun(el, root, info, Math.max(300, budget / 4))); } });
    elements.forEach((el) => { if (el.type === 'lightpoint') { const p = lp(el.key); tagged(el, { title: p ? p.name : 'Light', sub: 'Lighting fixture' }, () => buildLightPoint(el, root, info)); } });
    computeBounds();
    const sc = sun.shadow.camera, R = bounds.r * 1.25;
    sc.left = -R; sc.right = R; sc.top = R; sc.bottom = -R; sc.near = 1; sc.far = bounds.r * 8 + 400; sc.updateProjectionMatrix();
    applySun(); fixFrames = 1;
    const msg = $('d3-msg');
    if (msg) msg.textContent = elements.length ? '' : 'The plan is empty. Draw something in the editor, then open 3D again.';
  }

  // ======================= Camera / controls =======================
  let anim = null, tour = false;
  const orbitTarget = (name) => {
    const asp = camera && camera.aspect ? camera.aspect : 1.6, fit = (bounds.r * 1.08) / (Math.tan((48 / 2) * Math.PI / 180) * Math.min(1, asp * 1.05));
    const kk = asp >= 1.2 ? 0.64 : 0.64 + (0.98 - 0.64) * Math.min(1, (1.2 - asp) / 0.7); // tall/narrow screens need more room
    const T = { theta: 0.55, phi: 0.95, radius: fit * kk + 7, tx: bounds.cx, ty: 1.5, tz: bounds.cz };
    if (name === 'top') Object.assign(T, { theta: 0, phi: 0.03, radius: fit * (kk + 0.06) + 7, ty: 0 });
    else if (name === 'front' || name === 'right' || name === 'back' || name === 'left') Object.assign(T, { theta: { front: 0, right: Math.PI / 2, back: Math.PI, left: -Math.PI / 2 }[name], phi: 1.38, radius: fit * (kk + 0.06) + 7, ty: 4 });
    return T;
  };
  function setView(name, animate) {
    const was = state.mode; state.view = name; walk.keys = {}; anim = null;
    modal.querySelectorAll('[data-view]').forEach((b) => b.classList.toggle('on', b.dataset.view === name));
    $('d3-pad').classList.toggle('show', name === 'walk'); modal.classList.toggle('walking', name === 'walk'); $('d3-info').hidden = true;
    state.mode = name === 'walk' ? 'walk' : 'orbit';
    if (name === 'walk') { tour = false; syncTour(); const hh = (bounds.z1 - bounds.z0) * 0.15; walk.x = bounds.cx; walk.z = bounds.z1 - Math.min(10, hh); walk.yaw = 0; walk.pitch = -0.05; updateCamera(); return; }
    const T = orbitTarget(name);
    if (animate && renderer && open && was === 'orbit') {
      let dth = ((T.theta - cam.theta + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; // shortest way round
      anim = { start: null, dur: 0.7, from: { theta: cam.theta, phi: cam.phi, radius: cam.radius, tx: cam.tx, ty: cam.ty, tz: cam.tz }, to: Object.assign({}, T, { theta: cam.theta + dth }) };
      dirty = true; return;
    }
    Object.assign(cam, T); updateCamera();
  }
  function syncTour() { const b = $('d3-tour'); if (!b) return; b.classList.toggle('on', tour); b.innerHTML = (tour ? ICON.pause : ICON.play) + '<span>' + (tour ? 'Stop tour' : 'Auto tour') + '</span>'; }
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
    let tap = null;
    el.addEventListener('pointerdown', (e) => {
      el.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY, btn: e.button, shift: e.shiftKey }); last = null;
      anim = null; if (tour) { tour = false; syncTour(); }
      if (ptrs.size === 1) tap = { x: e.clientX, y: e.clientY, t: performance.now(), moved: false, multi: false, btn: e.button }; else if (tap) tap.multi = true;
    });
    el.addEventListener('pointerup', (e) => {
      const had = ptrs.delete(e.pointerId); last = null;
      if (had && tap && !tap.multi && !tap.moved && ptrs.size === 0 && tap.btn === 0 && performance.now() - tap.t < 600) pickAt(e.clientX, e.clientY);
      if (ptrs.size === 0) tap = null;
    });
    el.addEventListener('pointercancel', (e) => { ptrs.delete(e.pointerId); last = null; });
    el.addEventListener('pointermove', (e) => {
      const p = ptrs.get(e.pointerId); if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      if (tap && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) > 7) tap.moved = true;
      if (ptrs.size === 2) {
        const [a, b] = [...ptrs.values()]; const d0 = Math.hypot(a.x - b.x, a.y - b.y); const mid0 = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        p.x = e.clientX; p.y = e.clientY; const d1 = Math.hypot(a.x - b.x, a.y - b.y); const mid1 = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        if (state.mode === 'orbit') { if (d0 > 0) cam.radius = Math.max(5, Math.min(bounds.r * 8, cam.radius * (d0 / Math.max(1, d1)))); panBy(mid1.x - mid0.x, mid1.y - mid0.y); updateCamera(); }
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
      anim = null; cam.radius = Math.max(5, Math.min(bounds.r * 8, cam.radius * Math.exp(e.deltaY * 0.0012))); updateCamera();
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
    if (state.mode === 'orbit' && renderer) {
      const k = walk.keys; const tx = (k.arrowright ? 1 : 0) - (k.arrowleft ? 1 : 0), ty = (k.arrowdown ? 1 : 0) - (k.arrowup ? 1 : 0), zz = (k['+'] || k['='] ? 1 : 0) - (k['-'] || k['_'] ? 1 : 0);
      if (tx || ty || zz) { anim = null; cam.theta += tx * dt * 1.4; cam.phi = Math.max(0.03, Math.min(1.54, cam.phi + ty * dt * 1.0)); cam.radius = Math.max(5, Math.min(bounds.r * 8, cam.radius * Math.exp(-zz * dt * 1.4))); updateCamera(); }
      if (tour) { cam.theta += dt * 0.32; updateCamera(); }
      if (anim) {
        if (anim.start == null) anim.start = t; const u = Math.max(0, Math.min(1, (t - anim.start) / (anim.dur * 1000))), e2 = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
        ['theta', 'phi', 'radius', 'tx', 'ty', 'tz'].forEach((kk) => { cam[kk] = anim.from[kk] + (anim.to[kk] - anim.from[kk]) * e2; });
        if (u >= 1) anim = null; updateCamera();
      }
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
    if (/^arrow/i.test(e.key) || e.key === '+' || e.key === '-') e.preventDefault();
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
    const gm = DPRO.mat && matMaps('lawn'); let gtx = null;
    if (gm) { gtx = gm.map.clone(); gtx.needsUpdate = true; gtx.repeat.set(1800 / 5, 1800 / 5); }
    ground = new THREE.Mesh(new THREE.CircleGeometry(900, 48), new THREE.MeshStandardMaterial(gtx ? { map: gtx, color: '#d3e4c2', roughness: 1 } : { color: '#86A76F', roughness: 1 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -0.03; ground.receiveShadow = true; scene.add(ground);
    bindPointer(renderer.domElement);
    ro = new ResizeObserver(resize); ro.observe($('d3-wrap'));
  }
  function openView() {
    if (open) return;
    open = true; modal.hidden = false; $('d3-loading').hidden = false; $('d3-loading').textContent = 'Building the 3D model...';
    state.night = !!DPRO.extras.night; state.labels = false; state.irrigation = false; tour = false; syncTour(); $('d3-info').hidden = true;
    syncButtons();
    loadThree().then(() => {
      init(); resize();
      computeBounds(); buildScene(); setView('aerial'); resize();
      $('d3-loading').hidden = true; dirty = true;
      if (elements.length) say('Drag to turn. Pinch or scroll to zoom. Tap anything to see what it is.', 8000);
      if (!raf) raf = requestAnimationFrame(tick);
    }).catch((err) => { $('d3-loading').textContent = err.message || 'The 3D view could not start on this device.'; });
  }
  function close() { open = false; tour = false; anim = null; modal.hidden = true; if (raf) cancelAnimationFrame(raf); raf = 0; walk.keys = {}; }
  function seasonOf(m) { return m >= 2 && m <= 4 ? 4 : m >= 5 && m <= 7 ? 6 : m >= 8 && m <= 10 ? 9 : 0; }
  function syncButtons() {
    $('d3-night').classList.toggle('on', state.night); $('d3-labels').classList.toggle('on', state.labels); $('d3-irr').classList.toggle('on', state.irrigation);
    modal.querySelectorAll('[data-growth]').forEach((b) => b.classList.toggle('on', b.dataset.growth === state.growth));
    modal.querySelectorAll('[data-season]').forEach((b) => b.classList.toggle('on', Number(b.dataset.season) === seasonOf(state.month)));
    modal.querySelectorAll('[data-hour]').forEach((b) => b.classList.toggle('on', !state.night && Math.abs(Number(b.dataset.hour) - state.hour) < 0.01));
    $('d3-month').value = String(state.month); $('d3-hour').value = String(state.hour);
  }
  let msgTimer = 0;
  function say(text, ms) { const m = $('d3-msg'); if (!m) return; m.textContent = text; clearTimeout(msgTimer); if (ms) msgTimer = setTimeout(() => { if (m.textContent === text) m.textContent = ''; }, ms); }
  function showTab(name) {
    const dock = $('d3-dock'); const same = modal.querySelector('.d3-tab.on') && modal.querySelector('.d3-tab.on').dataset.d3tab === name;
    if (same) { dock.classList.toggle('folded'); return; }
    dock.classList.remove('folded');
    modal.querySelectorAll('[data-d3tab]').forEach((b) => b.classList.toggle('on', b.dataset.d3tab === name));
    modal.querySelectorAll('[data-d3panel]').forEach((p) => p.classList.toggle('show', p.dataset.d3panel === name));
  }
  // tap anything to see what it is
  let ray = null;
  function pickAt(cx, cy) {
    const info = $('d3-info'); if (!renderer || !root) return;
    const r = renderer.domElement.getBoundingClientRect(); if (!ray) ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1), camera);
    const hits = ray.intersectObject(root, true); let found = null;
    for (const h of hits) { let o = h.object; while (o) { if (o.userData && o.userData.pick) { found = o.userData.pick; break; } o = o.parent; } if (found) break; }
    if (!found) { info.hidden = true; return; }
    info.querySelector('b').textContent = found.title; info.querySelector('span').textContent = found.sub || ''; info.hidden = false;
    clearTimeout(info._t); info._t = setTimeout(() => { info.hidden = true; }, 7000);
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
  modal.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => setView(b.dataset.view, true)));
  modal.querySelectorAll('[data-d3tab]').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.d3tab)));
  $('d3-fold').addEventListener('click', () => $('d3-dock').classList.toggle('folded'));
  modal.querySelectorAll('[data-growth]').forEach((b) => b.addEventListener('click', () => { state.growth = b.dataset.growth; syncButtons(); buildScene(); }));
  modal.querySelectorAll('[data-season]').forEach((b) => b.addEventListener('click', () => { state.month = Number(b.dataset.season); syncButtons(); buildScene(); }));
  modal.querySelectorAll('[data-hour]').forEach((b) => b.addEventListener('click', () => { const wasNight = state.night; state.night = false; state.hour = Number(b.dataset.hour); syncButtons(); if (wasNight) buildScene(); else applySun(); }));
  $('d3-month').addEventListener('change', (e) => { state.month = Number(e.target.value); syncButtons(); buildScene(); });
  $('d3-hour').addEventListener('input', (e) => { state.hour = Number(e.target.value); const wasNight = state.night; if (wasNight) { state.night = false; syncButtons(); buildScene(); } else { syncButtons(); applySun(); } });
  $('d3-night').addEventListener('click', () => { state.night = !state.night; syncButtons(); buildScene(); });
  $('d3-labels').addEventListener('click', () => { state.labels = !state.labels; syncButtons(); buildScene(); });
  $('d3-irr').addEventListener('click', () => { state.irrigation = !state.irrigation; syncButtons(); buildScene(); });
  $('d3-msg').addEventListener('click', () => { $('d3-msg').textContent = ''; });
  $('d3-info').querySelector('button').addEventListener('click', () => { $('d3-info').hidden = true; });
  // on-screen zoom / turn / reset / tour (hold a button to keep going)
  function hold(btn, fn) {
    let t = 0, iv = 0; const stop = () => { clearTimeout(t); clearInterval(iv); }; const go = (e) => { e.preventDefault(); anim = null; if (tour && btn.id !== 'd3-tour') { tour = false; syncTour(); } fn(); t = setTimeout(() => { iv = setInterval(fn, 70); }, 320); };
    btn.addEventListener('pointerdown', go); ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => btn.addEventListener(ev, stop));
  }
  const zoomBy = (f) => () => { if (state.mode === 'walk') { moveWalk(f < 1 ? 1.2 : -1.2, 0); return; } cam.radius = Math.max(5, Math.min(bounds.r * 8, cam.radius * f)); updateCamera(); };
  const turnBy = (d) => () => { if (state.mode === 'walk') { walk.yaw += d * 0.18; updateCamera(); return; } cam.theta += d * 0.12; updateCamera(); };
  hold($('d3-zin'), zoomBy(0.93)); hold($('d3-zout'), zoomBy(1.075)); hold($('d3-tl'), turnBy(-1)); hold($('d3-tr'), turnBy(1));
  $('d3-reset').addEventListener('click', () => { tour = false; syncTour(); setView(state.view === 'walk' ? 'aerial' : state.view, true); });
  $('d3-tour').addEventListener('click', () => { if (state.mode === 'walk') setView('aerial'); tour = !tour; anim = null; syncTour(); });
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
  DPRO.threeD = { cam, walk, update: () => updateCamera(), project: (x, y, z) => { const r = renderer.domElement.getBoundingClientRect(); const v = new THREE.Vector3(x, y, z).project(camera); return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height }; }, open: openView, close, snapshot, capture, setView, state, rebuild: () => { if (scene) buildScene(); }, get ready() { return !!renderer; }, get scene() { return scene; } };
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
    },
  };
})();
