import pathlib

path = pathlib.Path("phone-app/design.js")
content = path.read_text()


def apply(old, new, label):
    global content
    count = content.count(old)
    if count != 1:
        raise SystemExit(f"ABORT: expected exactly 1 match for '{label}', found {count}. No changes written.")
    content = content.replace(old, new)
    print(f"OK: patched '{label}'")


# 1) A flagstone texture, drawn the same way the existing grass texture is
# (a small tileable canvas built once, reused as a Konva fill pattern):
# a handful of large, flat, pale stone slabs scattered over bare dirt/mulch
# -- matching an actual flagstone stepping-path photo, where individual
# broken slabs sit spaced apart on soil rather than a tight, grouted patio
# surface. Each slab gets a subtle gradient, mineral speckle, and the
# occasional hairline crack for a natural (not flat-color) look.
apply(
    """function buildAreaNode(el) {""",
    """// Deterministic tiny PRNG so the texture looks the same every time it's
// generated (no visible "reshuffling" if this function ever re-runs).
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Slightly rounds/chips each corner of a slab's outline so it reads as a
// flat broken stone piece rather than a sharp cut polygon.
function drawFacetedStone(ctx, pts, roundAmt) {
  ctx.beginPath();
  for (let i = 0; i < pts.length; i++) {
    const p0 = pts[i];
    const p1 = pts[(i + 1) % pts.length];
    const cx = p0[0] + (p1[0] - p0[0]) * roundAmt;
    const cy = p0[1] + (p1[1] - p0[1]) * roundAmt;
    const nx = p1[0] - (p1[0] - p0[0]) * roundAmt;
    const ny = p1[1] - (p1[1] - p0[1]) * roundAmt;
    if (i === 0) ctx.moveTo(cx, cy);
    else ctx.lineTo(cx, cy);
    ctx.quadraticCurveTo(p0[0], p0[1], nx, ny);
  }
  ctx.closePath();
}

let flagstonePatternCanvas = null;
function getFlagstonePatternCanvas() {
  if (flagstonePatternCanvas) return flagstonePatternCanvas;
  const size = 140;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');

  // Bare soil/mulch background -- a real flagstone stepping path is
  // separate flat slabs laid over dirt/mulch, not a tight-grouted patio
  // surface, so most of the tile should read as ground, not stone.
  ctx.fillStyle = '#4A3826';
  ctx.fillRect(0, 0, size, size);
  const rand = mulberry32(11);
  for (let i = 0; i < 140; i++) {
    ctx.beginPath();
    ctx.arc(rand() * size, rand() * size, 0.5 + rand(), 0, Math.PI * 2);
    ctx.fillStyle = rand() > 0.5 ? 'rgba(0,0,0,0.15)' : 'rgba(120,95,70,0.25)';
    ctx.fill();
  }

  // A handful of large, flat, irregular slabs loosely following a path
  // line down the tile, spaced apart the way real stepping stones are.
  const slabs = [
    { cx: 70, cy: 14, rx: 46, ry: 20, rot: -0.05 },
    { cx: 30, cy: 48, rx: 30, ry: 17 },
    { cx: 92, cy: 55, rx: 26, ry: 15, rot: 0.15 },
    { cx: 55, cy: 88, rx: 40, ry: 20, rot: -0.1 },
    { cx: 100, cy: 108, rx: 28, ry: 16, rot: 0.2 },
    { cx: 20, cy: 118, rx: 24, ry: 14, rot: 0.05 },
  ];

  const stoneTones = [
    ['#D8D0BF', '#B9AF9C'],
    ['#CBC2B0', '#AAA08D'],
    ['#C4B4A3', '#A69384'],
    ['#C7C0B3', '#A39A88'],
  ];

  slabs.forEach((slab, idx) => {
    const numPts = 6 + Math.floor(rand() * 3);
    const pts = [];
    for (let i = 0; i < numPts; i++) {
      const angle = (i / numPts) * Math.PI * 2 + rand() * 0.3;
      const rr = 0.7 + rand() * 0.4;
      const lx = Math.cos(angle) * slab.rx * rr;
      const ly = Math.sin(angle) * slab.ry * rr;
      const rot = slab.rot || 0;
      const rx = lx * Math.cos(rot) - ly * Math.sin(rot);
      const ry = lx * Math.sin(rot) + ly * Math.cos(rot);
      pts.push([slab.cx + rx, slab.cy + ry]);
    }

    const tone = stoneTones[idx % stoneTones.length];
    const grad = ctx.createLinearGradient(slab.cx - slab.rx, slab.cy - slab.ry, slab.cx + slab.rx, slab.cy + slab.ry);
    grad.addColorStop(0, tone[0]);
    grad.addColorStop(1, tone[1]);

    ctx.save();
    drawFacetedStone(ctx, pts, 0.12);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(70,60,48,0.55)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.clip();
    for (let i = 0; i < 26; i++) {
      const sx = slab.cx + (rand() - 0.5) * slab.rx * 1.8;
      const sy = slab.cy + (rand() - 0.5) * slab.ry * 1.8;
      const sr = 0.4 + rand() * 1.0;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.16)' : 'rgba(90,80,65,0.18)';
      ctx.fill();
    }
    const cracks = 1 + Math.floor(rand() * 2);
    for (let i = 0; i < cracks; i++) {
      ctx.beginPath();
      const ax = slab.cx + (rand() - 0.5) * slab.rx * 1.3;
      const ay = slab.cy + (rand() - 0.5) * slab.ry * 1.3;
      ctx.moveTo(ax, ay);
      let x = ax, y = ay;
      for (let seg = 0; seg < 2; seg++) {
        x += (rand() - 0.5) * slab.rx * 0.7;
        y += (rand() - 0.5) * slab.ry * 0.7;
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(60,50,40,0.3)';
      ctx.lineWidth = 0.75;
      ctx.stroke();
    }
    ctx.restore();
  });

  flagstonePatternCanvas = c;
  return c;
}

function buildAreaNode(el) {""",
    "add getFlagstonePatternCanvas (natural-stone-over-mulch version)",
)

# 2) Actually use it for a flagstone area, same way lawn uses its grass
# texture instead of a flat fill.
apply(
    """  if (el.subtype === 'lawn') {
    lineOpts.fillPatternImage = getGrassPatternCanvas();
    lineOpts.fillPatternRepeat = 'repeat';
  } else {
    lineOpts.fill = preset.fill;
  }""",
    """  if (el.subtype === 'lawn') {
    lineOpts.fillPatternImage = getGrassPatternCanvas();
    lineOpts.fillPatternRepeat = 'repeat';
  } else if (el.subtype === 'flagstone') {
    lineOpts.fillPatternImage = getFlagstonePatternCanvas();
    lineOpts.fillPatternRepeat = 'repeat';
  } else {
    lineOpts.fill = preset.fill;
  }""",
    "use flagstone texture in buildAreaNode",
)

# 3) Default this new layer to visible for both new and already-saved
# designs (existing designs' saved layerVisibility won't have this key,
# and Object.assign only overrides keys that ARE present in the saved
# data, so the default here is what makes old designs show it too).
apply(
    "    { image: true, boundary: true, lawn: true, bed: true, hardscape: true, water: true, plant: true, zone: true, head: true, pipe: true, fixture: true, label: true },",
    "    { image: true, boundary: true, lawn: true, bed: true, hardscape: true, flagstone: true, water: true, plant: true, zone: true, head: true, pipe: true, fixture: true, label: true },",
    "default flagstone layer to visible",
)

# 4) Same click-to-draw hint text the other area tools get.
apply(
    "    'area-hardscape': 'Click to add points. Press Enter (or pick another tool) to finish. Esc to cancel.',",
    "    'area-hardscape': 'Click to add points. Press Enter (or pick another tool) to finish. Esc to cancel.',\n"
    "    'area-flagstone': 'Click to add points. Press Enter (or pick another tool) to finish. Esc to cancel.',",
    "add area-flagstone draw hint",
)

path.write_text(content)
print("DONE: phone-app/design.js patched successfully.")
