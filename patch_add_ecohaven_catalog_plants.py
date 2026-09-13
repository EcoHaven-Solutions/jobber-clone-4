import pathlib

path = pathlib.Path("phone-app/design-data.js")
content = path.read_text()


def apply(old, new, label):
    global content
    count = content.count(old)
    if count != 1:
        raise SystemExit(f"ABORT: expected exactly 1 match for '{label}', found {count}. No changes written.")
    content = content.replace(old, new)
    print(f"OK: patched '{label}'")


# All 23 new plants are the ones from EcoHaven's actual "List of Plants We
# Use" marketing catalog (drought-tolerant / Eastern WA-adapted) that
# weren't already in this design catalog. A handful of items from that PDF
# (Coneflower, Black-Eyed Susan, Daylily, Yarrow-adjacent Russian Sage,
# Lavender, Creeping Thyme, Sweet Woodruff, an "Autumn Joy" Sedum, a
# "Green Mountain" Boxwood, and a "Blue Rug" Juniper) were already present
# and are left alone. Photos are real iNaturalist reference photos,
# checked against each species' taxon page before including here.

apply(
    "  { key: 'serviceberry', name: 'Serviceberry', category: 'Tree', sun: 'partial', water: 'moderate', heightFt: 20, spreadFt: 15, color: '#8AA35B', photoUrl: 'https://gardenology.org/w/images/thumb/1/16/Amelanchier_grandiflora2.jpg/240px-Amelanchier_grandiflora2.jpg' },\n"
    "\n"
    "  // ---- Shrubs ----",
    "  { key: 'serviceberry', name: 'Serviceberry', category: 'Tree', sun: 'partial', water: 'moderate', heightFt: 20, spreadFt: 15, color: '#8AA35B', photoUrl: 'https://gardenology.org/w/images/thumb/1/16/Amelanchier_grandiflora2.jpg/240px-Amelanchier_grandiflora2.jpg' },\n"
    "  { key: 'ponderosa-pine', name: 'Ponderosa Pine', category: 'Tree', sun: 'full', water: 'low', heightFt: 70, spreadFt: 30, color: '#5B6E3D', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/3790446/medium.JPG' },\n"
    "  { key: 'autumn-brilliance-serviceberry', name: 'Autumn Brilliance Serviceberry', category: 'Tree', sun: 'full', water: 'moderate', heightFt: 20, spreadFt: 20, color: '#D2542A', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/65493639/medium.jpg' },\n"
    "  { key: 'eastern-redbud', name: 'Eastern Redbud', category: 'Tree', sun: 'partial', water: 'moderate', heightFt: 25, spreadFt: 30, color: '#C13584', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/146752176/medium.jpg' },\n"
    "  { key: 'paperbark-maple', name: 'Paperbark Maple', category: 'Tree', sun: 'partial', water: 'moderate', heightFt: 25, spreadFt: 20, color: '#A9642F', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/93282513/medium.jpg' },\n"
    "  { key: 'silver-linden', name: 'Silver Linden', category: 'Tree', sun: 'full', water: 'moderate', heightFt: 60, spreadFt: 45, color: '#8CA084', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/289618202/medium.jpeg' },\n"
    "\n"
    "  // ---- Shrubs ----",
    "add 5 new Trees from EcoHaven catalog",
)

apply(
    "  { key: 'red-twig-dogwood', name: 'Red Twig Dogwood', category: 'Shrub', sun: 'partial', water: 'moderate', heightFt: 7, spreadFt: 7, color: '#A6402E', photoUrl: 'https://static.inaturalist.org/photos/16633753/medium.jpg' },\n"
    "\n"
    "  // ---- Perennials ----",
    "  { key: 'red-twig-dogwood', name: 'Red Twig Dogwood', category: 'Shrub', sun: 'partial', water: 'moderate', heightFt: 7, spreadFt: 7, color: '#A6402E', photoUrl: 'https://static.inaturalist.org/photos/16633753/medium.jpg' },\n"
    "  { key: 'elderberry', name: 'Elderberry', category: 'Shrub', sun: 'full', water: 'moderate', heightFt: 10, spreadFt: 8, color: '#2E2440', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/10180/medium.jpg' },\n"
    "  { key: 'smoke-tree', name: 'Smoke Tree', category: 'Shrub', sun: 'full', water: 'low', heightFt: 15, spreadFt: 15, color: '#B98CAE', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/136745491/medium.jpg' },\n"
    "  { key: 'mock-orange', name: 'Mock Orange', category: 'Shrub', sun: 'full', water: 'low', heightFt: 8, spreadFt: 6, color: '#F3EFD9', photoUrl: 'https://static.inaturalist.org/photos/40363644/medium.jpg' },\n"
    "  { key: 'golden-currant', name: 'Golden Currant', category: 'Shrub', sun: 'full', water: 'low', heightFt: 6, spreadFt: 6, color: '#DDA426', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/497524076/medium.jpg' },\n"
    "  { key: 'oregon-grape', name: 'Oregon Grape', category: 'Shrub', sun: 'partial', water: 'low', heightFt: 5, spreadFt: 5, color: '#D9B22F', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/22784/medium.jpg' },\n"
    "  { key: 'red-currant', name: 'Red Flowering Currant', category: 'Shrub', sun: 'partial', water: 'low', heightFt: 8, spreadFt: 6, color: '#C2456B', photoUrl: 'https://static.inaturalist.org/photos/72387844/medium.jpg' },\n"
    "  { key: 'spirea', name: 'Spirea', category: 'Shrub', sun: 'full', water: 'moderate', heightFt: 4, spreadFt: 4, color: '#D1608A', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/449207/medium.jpg' },\n"
    "  { key: 'ninebark', name: 'Ninebark', category: 'Shrub', sun: 'full', water: 'moderate', heightFt: 8, spreadFt: 6, color: '#5B3350', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/135237890/medium.jpeg' },\n"
    "  { key: 'upright-juniper', name: 'Upright Juniper', category: 'Shrub', sun: 'full', water: 'low', heightFt: 18, spreadFt: 4, color: '#6F8F99', photoUrl: 'https://static.inaturalist.org/photos/53827887/medium.jpeg' },\n"
    "\n"
    "  // ---- Perennials ----",
    "add 9 new Shrubs from EcoHaven catalog",
)

apply(
    "  { key: 'catmint', name: \"'Walker's Low' Catmint\", category: 'Perennial', sun: 'full', water: 'low', heightFt: 1.5, spreadFt: 2, color: '#7A8FBF', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/131906502/medium.jpg' },\n"
    "\n"
    "  // ---- Ornamental Grasses ----",
    "  { key: 'catmint', name: \"'Walker's Low' Catmint\", category: 'Perennial', sun: 'full', water: 'low', heightFt: 1.5, spreadFt: 2, color: '#7A8FBF', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/131906502/medium.jpg' },\n"
    "  { key: 'blanket-flower-gaillardia', name: 'Blanket Flower', category: 'Perennial', sun: 'full', water: 'low', heightFt: 2, spreadFt: 1.5, color: '#D9752E', photoUrl: 'https://static.inaturalist.org/photos/45640107/medium.jpg' },\n"
    "  { key: 'yarrow', name: 'Yarrow', category: 'Perennial', sun: 'full', water: 'low', heightFt: 2, spreadFt: 2, color: '#DCD7B8', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/4902/medium.jpg' },\n"
    "  { key: 'bee-balm-monarda', name: 'Bee Balm (Wild Bergamot)', category: 'Perennial', sun: 'full', water: 'moderate', heightFt: 3, spreadFt: 2, color: '#B080C0', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/301795454/medium.jpg' },\n"
    "  { key: 'penstemon', name: 'Rocky Mountain Penstemon', category: 'Perennial', sun: 'full', water: 'low', heightFt: 2, spreadFt: 1.5, color: '#5C63B0', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/45389512/medium.jpg' },\n"
    "  { key: 'lupine', name: 'Bigleaf Lupine', category: 'Perennial', sun: 'full', water: 'moderate', heightFt: 3, spreadFt: 1.5, color: '#5C4E96', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/135866080/medium.jpg' },\n"
    "  { key: 'lenten-rose-hellebore', name: 'Lenten Rose', category: 'Perennial', sun: 'shade', water: 'moderate', heightFt: 1.5, spreadFt: 1.5, color: '#8C5B6E', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/357527342/medium.jpg' },\n"
    "\n"
    "  // ---- Ornamental Grasses ----",
    "add 6 new Perennials/Flowers from EcoHaven catalog",
)

apply(
    "  { key: 'sweet-woodruff', name: 'Sweet Woodruff', category: 'Groundcover', sun: 'shade', water: 'moderate', heightFt: 0.5, spreadFt: 1.5, color: '#4F8C5C', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/74944506/medium.jpg' },\n"
    "];",
    "  { key: 'sweet-woodruff', name: 'Sweet Woodruff', category: 'Groundcover', sun: 'shade', water: 'moderate', heightFt: 0.5, spreadFt: 1.5, color: '#4F8C5C', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/74944506/medium.jpg' },\n"
    "  { key: 'kinnikinnick', name: 'Kinnikinnick', category: 'Groundcover', sun: 'full', water: 'low', heightFt: 0.5, spreadFt: 4, color: '#4F6B4A', photoUrl: 'https://static.inaturalist.org/photos/181302737/medium.jpeg' },\n"
    "  { key: 'wild-strawberry', name: 'Wild Strawberry', category: 'Groundcover', sun: 'partial', water: 'moderate', heightFt: 0.3, spreadFt: 1.5, color: '#C9302C', photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/600014255/medium.jpg' },\n"
    "  { key: 'ice-plant-delosperma', name: 'Ice Plant', category: 'Groundcover', sun: 'full', water: 'low', heightFt: 0.4, spreadFt: 2, color: '#D6488F', photoUrl: 'https://static.inaturalist.org/photos/585366703/medium.jpg' },\n"
    "];",
    "add 3 new Groundcover from EcoHaven catalog",
)

path.write_text(content)
print("DONE: phone-app/design-data.js patched successfully. Added 23 new plants.")
