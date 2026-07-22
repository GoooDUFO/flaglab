/* Flag Studio: a free-play sandbox — design a flag for your own
   invented territory and save it to an offline gallery. No scoring.
   Built on the Flag Forge renderer, expanded with more shapes, a
   bigger palette, emblem sizing, a diagonal split, a hoist triangle,
   a quartered field, a Nordic cross, a centered St George's Cross
   (England), a Scotland-style saltire, an American-Samoa-style big
   hoist triangle, 2–13 stripes in either direction with an uneven-
   width option, a corner canton (Union Jack / stars / saltire / solid),
   a bunch of extra emblem shapes (sun, wheel, anchor, tree, fleur-de-lis,
   sword, shield, seal), and — under the shield emblem — a sub-menu of
   detailed, stylized coats of arms for Spain, Mexico, Germany, Portugal,
   Vatican City, San Marino, Albania, and Canada. */

const PALETTE = {
  red: '#e11d2e', maroon: '#8a1538', orange: '#f4772e', yellow: '#ffd23f',
  gold: '#c8a020', green: '#1e9e4a', teal: '#199e8f', lightblue: '#4fa8dd',
  blue: '#1d56c4', navy: '#14205a', purple: '#7b3fd8', pink: '#ff6bd6',
  brown: '#7a4a24', white: '#f5f6fa', black: '#20212e',
};
const PALETTE_ORDER = Object.keys(PALETTE);
const BLANK = '#5b6187';

const SHAPES = {
  plain: { label: '▭', desc: 'solid field' },
  stripes: { label: '▤▥ Stripes', desc: 'horizontal or vertical stripes, 2–13 of them' },
  cross: { label: '✚ Nordic', desc: 'Nordic cross — offset toward the hoist' },
  england: { label: '✛ England', desc: "St George's Cross — a centered cross on a solid field" },
  saltire: { label: '✕', desc: 'Scotland-style saltire — diagonal cross on a solid field' },
  diag: { label: '◪', desc: 'diagonal split' },
  quad: { label: '▦', desc: '4 quarters' },
  bigtri: { label: '▶', desc: 'big hoist triangle, American-Samoa style' },
};
const STRIPE_MIN = 2, STRIPE_MAX = 13;

function isStripeLayout(id) { return /^[hv](1[0-3]|[2-9])$/.test(id); }
function stripeCount(id) { return parseInt(id.slice(1), 10); }

const EMBLEMS = {
  none: '∅', disc: '●', ring: '◎', star: '★', crescent: '☾', diamond: '◆', tri: '▲',
  sun: '☀️', wheel: '☸️', anchor: '⚓', tree: '🌲', fleurdelis: '⚜️',
  sword: '🗡️', shield: '🛡️', seal: '🔰',
};
const SIZES = { sm: 0.72, md: 1, lg: 1.35 };

const CANTON_TYPES = [
  ['unionjack', '🇬🇧 Jack'], ['stars', '★ Stars'], ['saltire', '✕ Saltire'], ['solid', '▭ Solid'],
];
const CANTON_STAR_COUNTS = [3, 5, 13, 20, 50];

const TERRITORY_A = ['New', 'North', 'South', 'Free', 'Upper', 'Lower', 'Grand', 'East', 'West', 'Old'];
const TERRITORY_B = ['Cascadia', 'Vinland', 'Sealand', 'Genovia', 'Buranda', 'Zubrowka', 'Elbonia',
  'Kolechia', 'Arstotzka', 'Wadiya', 'Latveria', 'Maltovia', 'Vespugia', 'San Theodoros', 'Syldavia',
  'Borduria', 'Poyais', 'Ruritania', 'Qumar', 'Sokovia'];

const stage = document.getElementById('stage');
const countPill = document.getElementById('score-pill');
const roundLabel = document.getElementById('round-label');
const hintLabel = document.getElementById('hint-label');

const GALLERY_KEY = 'flaglab:studio-gallery';

let state, brush, editingId;

FLAG_NAMES.then(() => { newFlag(); });

/* ---------- state ---------- */

function blankState() {
  return {
    layout: 'h3',
    stripes: [null, null, null],
    stripeWidth: 'equal',
    lastStripeLayout: 'h3',
    field: null,
    cross: null, outlineOn: false, outlineColor: 'white',
    diag: [null, null],
    quad: [null, null, null, null],
    bigtriColor: null,
    triOn: false, triColor: null,
    canton: { on: false, type: 'unionjack', bg: 'navy', fg: 'white', count: 5 },
    emblem: { type: 'none', color: null, pos: 'center', size: 'md', coa: 'plain' },
  };
}

function normalizeState(s) {
  const base = blankState();
  return {
    ...base, ...s,
    canton: { ...base.canton, ...(s.canton || {}) },
    emblem: { ...base.emblem, ...(s.emblem || {}) },
    quad: s.quad || base.quad,
    diag: s.diag || base.diag,
    stripeWidth: s.stripeWidth || base.stripeWidth,
  };
}

function setLayout(id) {
  state.layout = id;
  if (isStripeLayout(id)) {
    state.lastStripeLayout = id;
    const n = stripeCount(id);
    const old = state.stripes;
    state.stripes = new Array(n).fill(null).map((_, i) => old[i] ?? null);
  }
  if (id === 'quad' && !state.quad) state.quad = [null, null, null, null];
}

/* ---------- rendering ---------- */

let uid = 0;
function fill(c) { return c ? PALETTE[c] : BLANK; }

function starPts(cx, cy, R) {
  const r = R * 0.4, pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, rad = i % 2 ? r : R;
    pts.push((cx + rad * Math.cos(a)).toFixed(1) + ',' + (cy + rad * Math.sin(a)).toFixed(1));
  }
  return pts.join(' ');
}

function stripeRatios(n, mode) {
  if (mode !== 'uneven' || n < 3) return new Array(n).fill(1);
  const mid = (n - 1) / 2;
  return new Array(n).fill(0).map((_, i) => 1 + 1.5 * (1 - Math.abs(i - mid) / mid));
}

function stripeRects(dir, n, mode, W, H) {
  const ratios = stripeRatios(n, mode);
  const total = ratios.reduce((a, b) => a + b, 0);
  let pos = 0;
  const out = [];
  for (let i = 0; i < n; i++) {
    const frac = ratios[i] / total;
    if (dir === 'h') out.push({ x: 0, y: pos * H, width: W, height: frac * H + 0.5 });
    else out.push({ x: pos * W, y: 0, width: frac * W + 0.5, height: H });
    pos += frac;
  }
  return out;
}

function insetTriangle(pts, k) {
  const cx = pts.reduce((sum, p) => sum + p[0], 0) / 3;
  const cy = pts.reduce((sum, p) => sum + p[1], 0) / 3;
  return pts.map(([x, y]) => [cx + (x - cx) * k, cy + (y - cy) * k]);
}

/* ---------- extra emblem shapes ---------- */

function sunShape(cx, cy, R, c) {
  const rays = 12;
  let out = '';
  for (let i = 0; i < rays; i++) {
    const a = (i * 2 * Math.PI) / rays;
    const spread = (Math.PI / rays) * 0.42;
    const bx1 = cx + R * 0.55 * Math.cos(a - spread), by1 = cy + R * 0.55 * Math.sin(a - spread);
    const bx2 = cx + R * 0.55 * Math.cos(a + spread), by2 = cy + R * 0.55 * Math.sin(a + spread);
    const tx = cx + R * 1.15 * Math.cos(a), ty = cy + R * 1.15 * Math.sin(a);
    out += `<polygon points="${bx1.toFixed(1)},${by1.toFixed(1)} ${tx.toFixed(1)},${ty.toFixed(1)} ${bx2.toFixed(1)},${by2.toFixed(1)}" fill="${c}"/>`;
  }
  return out + `<circle cx="${cx}" cy="${cy}" r="${(R * 0.5).toFixed(1)}" fill="${c}"/>`;
}

function wheelShape(cx, cy, R, c) {
  let spokes = '';
  const n = 16;
  for (let i = 0; i < n; i++) {
    const a = (i * 2 * Math.PI) / n;
    const x2 = cx + R * 0.82 * Math.cos(a), y2 = cy + R * 0.82 * Math.sin(a);
    spokes += `<line x1="${cx}" y1="${cy}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${c}" stroke-width="${(R * 0.09).toFixed(1)}"/>`;
  }
  return `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${c}" stroke-width="${(R * 0.15).toFixed(1)}"/>${spokes}<circle cx="${cx}" cy="${cy}" r="${(R * 0.12).toFixed(1)}" fill="${c}"/>`;
}

function anchorShape(cx, cy, R, c) {
  const sw = (R * 0.16).toFixed(1);
  return `<g stroke="${c}" fill="none" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="${cx}" cy="${(cy - R * 0.72).toFixed(1)}" r="${(R * 0.2).toFixed(1)}"/>
    <line x1="${cx}" y1="${(cy - R * 0.52).toFixed(1)}" x2="${cx}" y2="${(cy + R * 0.75).toFixed(1)}"/>
    <line x1="${(cx - R * 0.5).toFixed(1)}" y1="${(cy - R * 0.12).toFixed(1)}" x2="${(cx + R * 0.5).toFixed(1)}" y2="${(cy - R * 0.12).toFixed(1)}"/>
    <path d="M ${(cx - R * 0.62).toFixed(1)},${(cy + R * 0.32).toFixed(1)} Q ${cx},${(cy + R * 0.95).toFixed(1)} ${(cx + R * 0.62).toFixed(1)},${(cy + R * 0.32).toFixed(1)}"/>
  </g>`;
}

function treeShape(cx, cy, R, c) {
  return `<g fill="${c}">
    <polygon points="${cx},${(cy - R).toFixed(1)} ${(cx + R * 0.5).toFixed(1)},${(cy - R * 0.2).toFixed(1)} ${(cx - R * 0.5).toFixed(1)},${(cy - R * 0.2).toFixed(1)}"/>
    <polygon points="${cx},${(cy - R * 0.5).toFixed(1)} ${(cx + R * 0.68).toFixed(1)},${(cy + R * 0.35).toFixed(1)} ${(cx - R * 0.68).toFixed(1)},${(cy + R * 0.35).toFixed(1)}"/>
    <rect x="${(cx - R * 0.12).toFixed(1)}" y="${(cy + R * 0.3).toFixed(1)}" width="${(R * 0.24).toFixed(1)}" height="${(R * 0.4).toFixed(1)}"/>
  </g>`;
}

function fleurShape(cx, cy, R, c) {
  const k = R / 46;
  return `<path transform="translate(${cx.toFixed(1)},${cy.toFixed(1)}) scale(${k.toFixed(3)})" fill="${c}"
    d="M0,-46 C13,-34 13,-13 4,-2 C15,-6 24,4 20,19 C15,13 8,11 4,15 L4,28 L9,28 L9,38 L-9,38 L-9,28 L-4,28 L-4,15
       C-8,11 -15,13 -20,19 C-24,4 -15,-6 -4,-2 C-13,-13 -13,-34 0,-46 Z"/>`;
}

function swordShape(cx, cy, R, c) {
  const sw = R * 0.13;
  return `<g fill="${c}">
    <polygon points="${(cx - sw / 2).toFixed(1)},${(cy - R).toFixed(1)} ${(cx + sw / 2).toFixed(1)},${(cy - R).toFixed(1)} ${(cx + sw / 2).toFixed(1)},${(cy + R * 0.35).toFixed(1)} ${(cx - sw / 2).toFixed(1)},${(cy + R * 0.35).toFixed(1)}"/>
    <rect x="${(cx - R * 0.35).toFixed(1)}" y="${(cy + R * 0.28).toFixed(1)}" width="${(R * 0.7).toFixed(1)}" height="${(R * 0.13).toFixed(1)}"/>
    <rect x="${(cx - sw * 0.9).toFixed(1)}" y="${(cy + R * 0.41).toFixed(1)}" width="${(sw * 1.8).toFixed(1)}" height="${(R * 0.5).toFixed(1)}"/>
  </g>`;
}

function shieldPathD(cx, cy, R) {
  const w = R * 0.85, h = R * 1.1;
  return `M ${(cx - w).toFixed(1)},${(cy - h).toFixed(1)}
    L ${(cx + w).toFixed(1)},${(cy - h).toFixed(1)}
    L ${(cx + w).toFixed(1)},${(cy + h * 0.1).toFixed(1)}
    Q ${(cx + w).toFixed(1)},${(cy + h * 0.7).toFixed(1)} ${cx.toFixed(1)},${(cy + h).toFixed(1)}
    Q ${(cx - w).toFixed(1)},${(cy + h * 0.7).toFixed(1)} ${(cx - w).toFixed(1)},${(cy + h * 0.1).toFixed(1)} Z`;
}

function shieldShape(cx, cy, R, c) {
  return `<path fill="${c}" stroke="#20212e" stroke-width="${(R * 0.05).toFixed(1)}" d="${shieldPathD(cx, cy, R)}"/>`;
}

/* ---------- detailed coats of arms (fixed heraldic-ish colors, stylized) ---------- */

function withShieldClip(cx, cy, R, clipId, inner) {
  return `<clipPath id="${clipId}"><path d="${shieldPathD(cx, cy, R)}"/></clipPath>
    <g clip-path="url(#${clipId})">${inner}</g>
    <path d="${shieldPathD(cx, cy, R)}" fill="none" stroke="#20212e" stroke-width="${(R * 0.05).toFixed(1)}"/>`;
}

function crownShape(cx, baseY, R, c) {
  const w = R * 0.5, bandH = R * 0.18, spikeH = R * 0.28;
  return `<g fill="${c}">
    <rect x="${(cx - w).toFixed(1)}" y="${(baseY - bandH).toFixed(1)}" width="${(w * 2).toFixed(1)}" height="${bandH.toFixed(1)}"/>
    <polygon points="${(cx - w).toFixed(1)},${(baseY - bandH).toFixed(1)} ${(cx - w * 0.7).toFixed(1)},${(baseY - bandH - spikeH).toFixed(1)} ${(cx - w * 0.4).toFixed(1)},${(baseY - bandH).toFixed(1)}"/>
    <polygon points="${(cx - w * 0.25).toFixed(1)},${(baseY - bandH).toFixed(1)} ${cx.toFixed(1)},${(baseY - bandH - spikeH * 1.2).toFixed(1)} ${(cx + w * 0.25).toFixed(1)},${(baseY - bandH).toFixed(1)}"/>
    <polygon points="${(cx + w * 0.4).toFixed(1)},${(baseY - bandH).toFixed(1)} ${(cx + w * 0.7).toFixed(1)},${(baseY - bandH - spikeH).toFixed(1)} ${(cx + w).toFixed(1)},${(baseY - bandH).toFixed(1)}"/>
    <circle cx="${(cx - w * 0.7).toFixed(1)}" cy="${(baseY - bandH - spikeH).toFixed(1)}" r="${(R * 0.05).toFixed(1)}"/>
    <circle cx="${cx.toFixed(1)}" cy="${(baseY - bandH - spikeH * 1.2).toFixed(1)}" r="${(R * 0.06).toFixed(1)}"/>
    <circle cx="${(cx + w * 0.7).toFixed(1)}" cy="${(baseY - bandH - spikeH).toFixed(1)}" r="${(R * 0.05).toFixed(1)}"/>
  </g>`;
}

function towerShape(cx, baseY, R, c) {
  const w = R * 0.22, h = R * 0.42;
  const bx = cx - w / 2, by = baseY - h;
  const notches = 3, nw = w / (notches * 2 - 1);
  let cren = '';
  for (let i = 0; i < notches; i++) {
    const nx = bx + i * 2 * nw;
    cren += `<rect x="${nx.toFixed(1)}" y="${(by - nw).toFixed(1)}" width="${nw.toFixed(1)}" height="${nw.toFixed(1)}" fill="${c}"/>`;
  }
  return `<rect x="${bx.toFixed(1)}" y="${by.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${c}"/>${cren}`;
}

function keyShape(cx, cy, R, c, angleDeg) {
  const len = R * 1.3, shaftW = R * 0.09, bowR = R * 0.16;
  return `<g fill="${c}" transform="rotate(${angleDeg} ${cx.toFixed(1)} ${cy.toFixed(1)})">
    <rect x="${(cx - shaftW / 2).toFixed(1)}" y="${(cy - len / 2).toFixed(1)}" width="${shaftW.toFixed(1)}" height="${len.toFixed(1)}"/>
    <circle cx="${cx.toFixed(1)}" cy="${(cy - len / 2).toFixed(1)}" r="${bowR.toFixed(1)}" fill="none" stroke="${c}" stroke-width="${(shaftW * 0.8).toFixed(1)}"/>
    <rect x="${cx.toFixed(1)}" y="${(cy + len / 2 - shaftW * 1.5).toFixed(1)}" width="${(shaftW * 2.2).toFixed(1)}" height="${shaftW.toFixed(1)}"/>
    <rect x="${cx.toFixed(1)}" y="${(cy + len / 2 - shaftW * 3).toFixed(1)}" width="${(shaftW * 1.6).toFixed(1)}" height="${shaftW.toFixed(1)}"/>
  </g>`;
}

function eagleSilhouette(cx, cy, R, c) {
  const w = R, h = R * 0.8;
  return `<g fill="${c}">
    <polygon points="${cx.toFixed(1)},${(cy - h * 0.9).toFixed(1)} ${(cx - w * 0.15).toFixed(1)},${(cy - h * 0.3).toFixed(1)} ${(cx - w * 1.0).toFixed(1)},${(cy - h * 0.5).toFixed(1)} ${(cx - w * 0.9).toFixed(1)},${(cy + h * 0.05).toFixed(1)} ${(cx - w * 0.5).toFixed(1)},${(cy - h * 0.05).toFixed(1)} ${(cx - w * 0.2).toFixed(1)},${(cy + h * 0.3).toFixed(1)} ${(cx - w * 0.35).toFixed(1)},${(cy + h * 0.75).toFixed(1)} ${cx.toFixed(1)},${(cy + h * 0.45).toFixed(1)} ${(cx + w * 0.35).toFixed(1)},${(cy + h * 0.75).toFixed(1)} ${(cx + w * 0.2).toFixed(1)},${(cy + h * 0.3).toFixed(1)} ${(cx + w * 0.5).toFixed(1)},${(cy - h * 0.05).toFixed(1)} ${(cx + w * 0.9).toFixed(1)},${(cy + h * 0.05).toFixed(1)} ${(cx + w * 1.0).toFixed(1)},${(cy - h * 0.5).toFixed(1)} ${(cx + w * 0.15).toFixed(1)},${(cy - h * 0.3).toFixed(1)}"/>
  </g>`;
}

function doubleEagleSilhouette(cx, cy, R, c) {
  const w = R, h = R * 0.75;
  return `<g fill="${c}">
    <polygon points="
      ${(cx - w * 0.18).toFixed(1)},${(cy - h * 0.85).toFixed(1)}
      ${(cx - w * 0.35).toFixed(1)},${(cy - h * 0.55).toFixed(1)}
      ${(cx - w * 1.05).toFixed(1)},${(cy - h * 0.7).toFixed(1)}
      ${(cx - w * 0.95).toFixed(1)},${(cy - h * 0.1).toFixed(1)}
      ${(cx - w * 0.5).toFixed(1)},${(cy - h * 0.15).toFixed(1)}
      ${(cx - w * 0.2).toFixed(1)},${(cy + h * 0.15).toFixed(1)}
      ${(cx - w * 0.35).toFixed(1)},${(cy + h * 0.7).toFixed(1)}
      ${cx.toFixed(1)},${(cy + h * 0.4).toFixed(1)}
      ${(cx + w * 0.35).toFixed(1)},${(cy + h * 0.7).toFixed(1)}
      ${(cx + w * 0.2).toFixed(1)},${(cy + h * 0.15).toFixed(1)}
      ${(cx + w * 0.5).toFixed(1)},${(cy - h * 0.15).toFixed(1)}
      ${(cx + w * 0.95).toFixed(1)},${(cy - h * 0.1).toFixed(1)}
      ${(cx + w * 1.05).toFixed(1)},${(cy - h * 0.7).toFixed(1)}
      ${(cx + w * 0.35).toFixed(1)},${(cy - h * 0.55).toFixed(1)}
      ${(cx + w * 0.18).toFixed(1)},${(cy - h * 0.85).toFixed(1)}
    "/>
    <polygon points="${(cx - w * 0.28).toFixed(1)},${(cy - h * 0.95).toFixed(1)} ${(cx - w * 0.05).toFixed(1)},${(cy - h * 1.05).toFixed(1)} ${(cx - w * 0.02).toFixed(1)},${(cy - h * 0.75).toFixed(1)}"/>
    <polygon points="${(cx + w * 0.28).toFixed(1)},${(cy - h * 0.95).toFixed(1)} ${(cx + w * 0.05).toFixed(1)},${(cy - h * 1.05).toFixed(1)} ${(cx + w * 0.02).toFixed(1)},${(cy - h * 0.75).toFixed(1)}"/>
  </g>`;
}

function mapleLeafShape(cx, cy, R, c) {
  const k = R / 50;
  return `<path transform="translate(${cx.toFixed(1)},${cy.toFixed(1)}) scale(${k.toFixed(3)})" fill="${c}"
    d="M2.23,50 -1.12,-21.41 a2.36,2.36 0 0 1 2.75,-2.43 l21.32,3.75 -2.88,-7.94
       a1.61,1.61 0 0 1 0.50,-1.81 l23.35,-18.91 -5.26,-2.46
       a1.61,1.61 0 0 1 -0.84,-1.96 l4.62,-14.19 -13.45,2.85
       a1.61,1.61 0 0 1 -1.81,-0.94 l-2.61,-6.13 -10.50,11.27
       a1.61,1.61 0 0 1 -2.75,-1.41 l5.06,-26.10 -8.11,4.69
       a1.61,1.61 0 0 1 -2.26,-0.67 l-8.24,-16.18 -8.24,16.18
       a1.61,1.61 0 0 1 -2.26,0.67 l-8.11,-4.69 5.06,26.10
       a1.61,1.61 0 0 1 -2.75,1.41 l-10.50,-11.27 -2.61,6.13
       a1.61,1.61 0 0 1 -1.81,0.94 l-13.45,-2.85 4.62,14.19
       a1.61,1.61 0 0 1 -0.84,1.96 l-5.26,2.46 23.35,18.91
       a1.61,1.61 0 0 1 0.50,1.81 l-2.88,7.94 21.32,-3.75
       a2.36,2.36 0 0 1 2.75,2.43 l-1.12,21.41 Z"/>`;
}

function coaSpain(cx, cy, R, clipId) {
  const w = R * 0.85, h = R * 1.1;
  const midY = cy - h * 0.1;
  const inner = `
    <rect x="${(cx - w).toFixed(1)}" y="${(cy - h).toFixed(1)}" width="${w.toFixed(1)}" height="${(midY - (cy - h)).toFixed(1)}" fill="#c8102e"/>
    <rect x="${cx.toFixed(1)}" y="${(cy - h).toFixed(1)}" width="${w.toFixed(1)}" height="${(midY - (cy - h)).toFixed(1)}" fill="#f5f6fa"/>
    <rect x="${(cx - w).toFixed(1)}" y="${midY.toFixed(1)}" width="${w.toFixed(1)}" height="${((cy + h) - midY).toFixed(1)}" fill="#f5f6fa"/>
    <rect x="${cx.toFixed(1)}" y="${midY.toFixed(1)}" width="${w.toFixed(1)}" height="${((cy + h) - midY).toFixed(1)}" fill="#c8102e"/>
    <rect x="${(cx - w * 0.55).toFixed(1)}" y="${(cy - h * 0.72).toFixed(1)}" width="${(w * 0.42).toFixed(1)}" height="${(w * 0.42).toFixed(1)}" fill="#ffd23f"/>
    <ellipse cx="${(cx + w * 0.32).toFixed(1)}" cy="${(cy - h * 0.5).toFixed(1)}" rx="${(w * 0.28).toFixed(1)}" ry="${(w * 0.18).toFixed(1)}" fill="#8a1538"/>
    <circle cx="${(cx - w * 0.05).toFixed(1)}" cy="${(cy + h * 0.55).toFixed(1)}" r="${(w * 0.2).toFixed(1)}" fill="#1e9e4a"/>
  `;
  return withShieldClip(cx, cy, R, clipId, inner) + crownShape(cx, cy - h, R, '#c8a020');
}

function coaMexico(cx, cy, R, clipId) {
  const w = R * 0.85, h = R * 1.1;
  const inner = `
    <rect x="${(cx - w).toFixed(1)}" y="${(cy - h).toFixed(1)}" width="${(w * 2).toFixed(1)}" height="${(h * 2).toFixed(1)}" fill="#f5f6fa"/>
    <ellipse cx="${cx.toFixed(1)}" cy="${(cy + h * 0.55).toFixed(1)}" rx="${(w * 0.55).toFixed(1)}" ry="${(h * 0.28).toFixed(1)}" fill="#1e9e4a"/>
    <path d="M ${(cx - w * 0.3).toFixed(1)},${(cy + h * 0.35).toFixed(1)} Q ${cx.toFixed(1)},${(cy + h * 0.05).toFixed(1)} ${(cx + w * 0.32).toFixed(1)},${(cy + h * 0.4).toFixed(1)}" fill="none" stroke="#1e9e4a" stroke-width="${(w * 0.12).toFixed(1)}" stroke-linecap="round"/>
  ` + eagleSilhouette(cx, cy - h * 0.15, R * 0.62, '#c8a020');
  return withShieldClip(cx, cy, R, clipId, inner);
}

function coaGermany(cx, cy, R, clipId) {
  const w = R * 0.85, h = R * 1.1;
  const inner = `
    <rect x="${(cx - w).toFixed(1)}" y="${(cy - h).toFixed(1)}" width="${(w * 2).toFixed(1)}" height="${(h * 2).toFixed(1)}" fill="#ffd23f"/>
  ` + eagleSilhouette(cx, cy - h * 0.05, R * 0.78, '#20212e');
  return withShieldClip(cx, cy, R, clipId, inner);
}

function coaAlbania(cx, cy, R, clipId) {
  const w = R * 0.85, h = R * 1.1;
  const inner = `
    <rect x="${(cx - w).toFixed(1)}" y="${(cy - h).toFixed(1)}" width="${(w * 2).toFixed(1)}" height="${(h * 2).toFixed(1)}" fill="#e11d2e"/>
  ` + doubleEagleSilhouette(cx, cy - h * 0.05, R * 0.7, '#20212e');
  return withShieldClip(cx, cy, R, clipId, inner);
}

function coaPortugal(cx, cy, R, clipId) {
  const w = R * 0.85, h = R * 1.1;
  let castles = '';
  const n = 7;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const x = cx - w * 0.85 + t * w * 1.7;
    castles += `<rect x="${(x - w * 0.06).toFixed(1)}" y="${(cy - h * 0.88).toFixed(1)}" width="${(w * 0.12).toFixed(1)}" height="${(w * 0.12).toFixed(1)}" fill="#c8a020"/>`;
  }
  const dots = [[0, -0.55], [-0.28, -0.25], [0.28, -0.25], [-0.28, 0.15], [0.28, 0.15]];
  let shields = '';
  for (const [dx, dy] of dots) {
    shields += `<circle cx="${(cx + dx * w).toFixed(1)}" cy="${(cy + dy * h).toFixed(1)}" r="${(w * 0.12).toFixed(1)}" fill="#1d56c4"/>`;
  }
  const inner = `
    <rect x="${(cx - w).toFixed(1)}" y="${(cy - h).toFixed(1)}" width="${(w * 2).toFixed(1)}" height="${(h * 2).toFixed(1)}" fill="#f5f6fa"/>
    <rect x="${(cx - w).toFixed(1)}" y="${(cy - h).toFixed(1)}" width="${(w * 2).toFixed(1)}" height="${(h * 2).toFixed(1)}" fill="none" stroke="#c8102e" stroke-width="${(w * 0.14).toFixed(1)}"/>
    ${castles}${shields}
  `;
  return withShieldClip(cx, cy, R, clipId, inner);
}

function coaVatican(cx, cy, R, clipId) {
  const w = R * 0.85, h = R * 1.1;
  const inner = `
    <rect x="${(cx - w).toFixed(1)}" y="${(cy - h).toFixed(1)}" width="${(w * 2).toFixed(1)}" height="${(h * 2).toFixed(1)}" fill="#ffd23f"/>
    ${keyShape(cx - R * 0.12, cy + R * 0.05, R * 0.7, '#c8a020', -35)}
    ${keyShape(cx + R * 0.12, cy + R * 0.05, R * 0.7, '#f5f6fa', 35)}
  `;
  const tiara = `
    <g fill="#f5f6fa" stroke="#20212e" stroke-width="${(R * 0.03).toFixed(1)}">
      <ellipse cx="${cx.toFixed(1)}" cy="${(cy - h * 1.05).toFixed(1)}" rx="${(R * 0.3).toFixed(1)}" ry="${(R * 0.34).toFixed(1)}"/>
    </g>
    <g fill="#c8a020">
      <rect x="${(cx - R * 0.32).toFixed(1)}" y="${(cy - h * 1.14).toFixed(1)}" width="${(R * 0.64).toFixed(1)}" height="${(R * 0.08).toFixed(1)}"/>
      <rect x="${(cx - R * 0.28).toFixed(1)}" y="${(cy - h * 1.0).toFixed(1)}" width="${(R * 0.56).toFixed(1)}" height="${(R * 0.06).toFixed(1)}"/>
      <circle cx="${cx.toFixed(1)}" cy="${(cy - h * 1.34).toFixed(1)}" r="${(R * 0.06).toFixed(1)}"/>
    </g>
  `;
  return withShieldClip(cx, cy, R, clipId, inner) + tiara;
}

function coaSanMarino(cx, cy, R, clipId) {
  const w = R * 0.85, h = R * 1.1;
  const inner = `
    <rect x="${(cx - w).toFixed(1)}" y="${(cy - h).toFixed(1)}" width="${(w * 2).toFixed(1)}" height="${(h * 1.3).toFixed(1)}" fill="#4fa8dd"/>
    <rect x="${(cx - w).toFixed(1)}" y="${(cy + h * 0.3).toFixed(1)}" width="${(w * 2).toFixed(1)}" height="${(h * 0.8).toFixed(1)}" fill="#1e9e4a"/>
    <polygon points="${(cx - w * 0.7).toFixed(1)},${(cy + h * 0.4).toFixed(1)} ${(cx - w * 0.4).toFixed(1)},${(cy - h * 0.15).toFixed(1)} ${(cx - w * 0.1).toFixed(1)},${(cy + h * 0.4).toFixed(1)}" fill="#8a8f9e"/>
    <polygon points="${(cx - w * 0.25).toFixed(1)},${(cy + h * 0.4).toFixed(1)} ${cx.toFixed(1)},${(cy - h * 0.3).toFixed(1)} ${(cx + w * 0.25).toFixed(1)},${(cy + h * 0.4).toFixed(1)}" fill="#a3a9b8"/>
    <polygon points="${(cx + w * 0.1).toFixed(1)},${(cy + h * 0.4).toFixed(1)} ${(cx + w * 0.4).toFixed(1)},${(cy - h * 0.15).toFixed(1)} ${(cx + w * 0.7).toFixed(1)},${(cy + h * 0.4).toFixed(1)}" fill="#8a8f9e"/>
    ${towerShape(cx - w * 0.4, cy - h * 0.05, R * 0.55, '#5b6187')}
    ${towerShape(cx, cy - h * 0.2, R * 0.6, '#5b6187')}
    ${towerShape(cx + w * 0.4, cy - h * 0.05, R * 0.55, '#5b6187')}
  `;
  return withShieldClip(cx, cy, R, clipId, inner) + crownShape(cx, cy - h, R * 0.7, '#c8a020');
}

function coaCanada(cx, cy, R, clipId) {
  const w = R * 0.85, h = R * 1.1;
  const inner = `
    <rect x="${(cx - w).toFixed(1)}" y="${(cy - h).toFixed(1)}" width="${(w * 2).toFixed(1)}" height="${(h * 2).toFixed(1)}" fill="#f5f6fa"/>
    ${mapleLeafShape(cx, cy + R * 0.12, R * 0.68, '#e11d2e')}
  `;
  return withShieldClip(cx, cy, R, clipId, inner);
}

const COA_TYPES = {
  plain: { label: 'Plain', render: null },
  spain: { label: '🇪🇸 Spain', render: coaSpain },
  mexico: { label: '🇲🇽 Mexico', render: coaMexico },
  germany: { label: '🇩🇪 Germany', render: coaGermany },
  portugal: { label: '🇵🇹 Portugal', render: coaPortugal },
  vatican: { label: '🇻🇦 Vatican', render: coaVatican },
  sanmarino: { label: '🇸🇲 San Marino', render: coaSanMarino },
  albania: { label: '🇦🇱 Albania', render: coaAlbania },
  canada: { label: '🇨🇦 Canada', render: coaCanada },
};

function sealShape(cx, cy, R, c) {
  let ticks = '';
  const n = 20;
  for (let i = 0; i < n; i++) {
    const a = (i * 2 * Math.PI) / n;
    const x1 = cx + R * 0.82 * Math.cos(a), y1 = cy + R * 0.82 * Math.sin(a);
    const x2 = cx + R * 1.02 * Math.cos(a), y2 = cy + R * 1.02 * Math.sin(a);
    ticks += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${c}" stroke-width="${(R * 0.09).toFixed(1)}"/>`;
  }
  return `<circle cx="${cx}" cy="${cy}" r="${(R * 0.76).toFixed(1)}" fill="none" stroke="${c}" stroke-width="${(R * 0.11).toFixed(1)}"/>
    <circle cx="${cx}" cy="${cy}" r="${(R * 0.42).toFixed(1)}" fill="${c}"/>
    ${ticks}`;
}

/* ---------- canton (corner flag-in-flag) ---------- */

function starsGrid(w, h, n, color) {
  const cols = Math.max(1, Math.min(n, Math.round(Math.sqrt(n * (w / h))) || 1));
  const rows = Math.ceil(n / cols);
  const cellW = w / cols, cellH = h / rows;
  const R = Math.min(cellW, cellH) * 0.34;
  let out = '', placed = 0;
  for (let r = 0; r < rows && placed < n; r++) {
    const rem = Math.min(cols, n - placed);
    const rowW = rem * cellW;
    const xOff = (w - rowW) / 2;
    for (let c = 0; c < rem; c++) {
      const cx = xOff + cellW * (c + 0.5);
      const cy = cellH * (r + 0.5);
      out += `<polygon points="${starPts(cx, cy, R)}" fill="${color}"/>`;
      placed++;
    }
  }
  return out;
}

function unionJackMarkup(w, h) {
  return `<svg x="0" y="0" width="${w}" height="${h}" viewBox="0 0 60 30" preserveAspectRatio="none">
    <rect width="60" height="30" fill="#012169"/>
    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#ffffff" stroke-width="6"/>
    <path d="M0,0 L24,15 L0,18 Z M60,0 L36,15 L60,12 Z M0,30 L24,15 L0,12 Z M60,30 L36,15 L60,18 Z" fill="#c8102e"/>
    <path d="M30,0 V30 M0,15 H60" stroke="#ffffff" stroke-width="10"/>
    <path d="M30,0 V30 M0,15 H60" stroke="#c8102e" stroke-width="6"/>
  </svg>`;
}

function cantonSVG(s) {
  const canton = s.canton;
  if (!canton || !canton.on) return '';
  const w = 140, h = 100;
  const bg = fill(canton.bg), fg = fill(canton.fg);
  if (canton.type === 'unionjack') return `<g>${unionJackMarkup(w, h)}</g>`;
  if (canton.type === 'saltire') {
    return `<g>
      <rect data-region="cantonbg" width="${w}" height="${h}" fill="${bg}"/>
      <path data-region="cantonfg" d="M4,4 L${w - 4},${h - 4} M${w - 4},4 L4,${h - 4}"
        stroke="${fg}" stroke-width="${(Math.min(w, h) * 0.16).toFixed(1)}"/>
    </g>`;
  }
  if (canton.type === 'stars') {
    return `<g>
      <rect data-region="cantonbg" width="${w}" height="${h}" fill="${bg}"/>
      <g data-region="cantonfg">${starsGrid(w, h, canton.count || 5, fg)}</g>
    </g>`;
  }
  return `<g><rect data-region="cantonbg" width="${w}" height="${h}" fill="${bg}"/></g>`;
}

/* ---------- main flag renderer ---------- */

function flagSVG(s) {
  const W = 300, H = 200, id = 'u' + (uid++);
  let body = '';

  if (isStripeLayout(s.layout)) {
    const dir = s.layout[0];
    const n = stripeCount(s.layout);
    const rects = stripeRects(dir, n, s.stripeWidth, W, H);
    s.stripes.forEach((c, i) => {
      const r = rects[i];
      body += `<rect data-region="stripe${i}" x="${r.x.toFixed(1)}" y="${r.y.toFixed(1)}" width="${r.width.toFixed(1)}" height="${r.height.toFixed(1)}" fill="${fill(c)}"/>`;
    });
  } else if (s.layout === 'diag') {
    body += `<polygon data-region="diag0" points="0,0 ${W},0 0,${H}" fill="${fill(s.diag[0])}"/>`;
    body += `<polygon data-region="diag1" points="${W},0 ${W},${H} 0,${H}" fill="${fill(s.diag[1])}"/>`;
  } else if (s.layout === 'quad') {
    const w = W / 2, h = H / 2;
    const coords = [[0, 0], [w, 0], [0, h], [w, h]];
    const quad = s.quad || [null, null, null, null];
    coords.forEach(([x, y], i) => {
      body += `<rect data-region="quad${i}" x="${x}" y="${y}" width="${(w + 0.5).toFixed(1)}" height="${(h + 0.5).toFixed(1)}" fill="${fill(quad[i])}"/>`;
    });
  } else if (s.layout === 'saltire') {
    body += `<rect data-region="field" x="0" y="0" width="${W}" height="${H}" fill="${fill(s.field)}"/>`;
    const sw = Math.round(Math.min(W, H) * 0.22);
    body += `<g data-region="cross"><path d="M0,0 L${W},${H} M${W},0 L0,${H}" stroke="${fill(s.cross)}" stroke-width="${sw}" stroke-linecap="square"/></g>`;
  } else if (s.layout === 'bigtri') {
    body += `<rect data-region="field" x="0" y="0" width="${W}" height="${H}" fill="${fill(s.field)}"/>`;
    const tipX = W * 0.72, tipY = H / 2;
    const outerPts = [[0, 0], [tipX, tipY], [0, H]];
    if (s.outlineOn) {
      body += `<polygon data-region="outline" points="${outerPts.map((p) => p.join(',')).join(' ')}" fill="${fill(s.outlineColor)}"/>`;
    }
    const innerPts = s.outlineOn ? insetTriangle(outerPts, 0.86) : outerPts;
    body += `<polygon data-region="bigtri" points="${innerPts.map((p) => p.map((n) => n.toFixed(1)).join(',')).join(' ')}" fill="${fill(s.bigtriColor)}"/>`;
  } else {
    body += `<rect data-region="field" x="0" y="0" width="${W}" height="${H}" fill="${fill(s.field)}"/>`;
    if (s.layout === 'cross') {
      if (s.outlineOn) {
        body += `<g data-region="outline">
          <rect x="78" y="0" width="68" height="${H}" fill="${fill(s.outlineColor)}"/>
          <rect x="0" y="66" width="${W}" height="68" fill="${fill(s.outlineColor)}"/></g>`;
      }
      body += `<g data-region="cross">
        <rect x="92" y="0" width="40" height="${H}" fill="${fill(s.cross)}"/>
        <rect x="0" y="80" width="${W}" height="40" fill="${fill(s.cross)}"/></g>`;
    } else if (s.layout === 'england') {
      const armW = 40, oarmW = 56;
      if (s.outlineOn) {
        body += `<g data-region="outline">
          <rect x="${(W - oarmW) / 2}" y="0" width="${oarmW}" height="${H}" fill="${fill(s.outlineColor)}"/>
          <rect x="0" y="${(H - oarmW) / 2}" width="${W}" height="${oarmW}" fill="${fill(s.outlineColor)}"/></g>`;
      }
      body += `<g data-region="cross">
        <rect x="${(W - armW) / 2}" y="0" width="${armW}" height="${H}" fill="${fill(s.cross)}"/>
        <rect x="0" y="${(H - armW) / 2}" width="${W}" height="${armW}" fill="${fill(s.cross)}"/></g>`;
    }
  }

  body += cantonSVG(s);

  if (s.triOn) {
    body += `<polygon data-region="tri" points="0,0 140,${H / 2} 0,${H}" fill="${fill(s.triColor)}"/>`;
  }

  const em = s.emblem;
  if (em.type !== 'none') {
    const cx = em.pos === 'hoist' ? 95 : 150, cy = 100, c = fill(em.color);
    const k = SIZES[em.size];
    let shape;
    if (em.type === 'disc') shape = `<circle cx="${cx}" cy="${cy}" r="${42 * k}" fill="${c}"/>`;
    else if (em.type === 'ring') shape = `<circle cx="${cx}" cy="${cy}" r="${38 * k}" fill="none" stroke="${c}" stroke-width="${13 * k}"/>`;
    else if (em.type === 'star') shape = `<polygon points="${starPts(cx, cy, 52 * k)}" fill="${c}"/>`;
    else if (em.type === 'diamond') {
      const d = 50 * k;
      shape = `<polygon points="${cx},${cy - d} ${cx + d},${cy} ${cx},${cy + d} ${cx - d},${cy}" fill="${c}"/>`;
    } else if (em.type === 'tri') {
      const d = 52 * k;
      shape = `<polygon points="${cx},${cy - d} ${cx + d * 0.9},${cy + d * 0.7} ${cx - d * 0.9},${cy + d * 0.7}" fill="${c}"/>`;
    } else if (em.type === 'crescent') {
      const r = 44 * k;
      shape = `<mask id="${id}">
          <rect x="0" y="0" width="${W}" height="${H}" fill="#fff"/>
          <circle cx="${cx + 16 * k}" cy="${cy}" r="${36 * k}" fill="#000"/>
        </mask>
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="${c}" mask="url(#${id})"/>
        <polygon points="${starPts(cx + 40 * k, cy, 14 * k)}" fill="${c}"/>`;
    } else if (em.type === 'sun') shape = sunShape(cx, cy, 44 * k, c);
    else if (em.type === 'wheel') shape = wheelShape(cx, cy, 44 * k, c);
    else if (em.type === 'anchor') shape = anchorShape(cx, cy, 46 * k, c);
    else if (em.type === 'tree') shape = treeShape(cx, cy, 46 * k, c);
    else if (em.type === 'fleurdelis') shape = fleurShape(cx, cy, 46 * k, c);
    else if (em.type === 'sword') shape = swordShape(cx, cy, 46 * k, c);
    else if (em.type === 'shield') {
      const coaId = em.coa && COA_TYPES[em.coa] ? em.coa : 'plain';
      const coaDef = COA_TYPES[coaId];
      shape = coaDef.render ? coaDef.render(cx, cy, 46 * k, `${id}-coa`) : shieldShape(cx, cy, 46 * k, c);
    }
    else if (em.type === 'seal') shape = sealShape(cx, cy, 46 * k, c);
    body += `<g data-region="emblem">${shape}</g>`;
  }

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
}

/* ---------- editor ---------- */

function newFlag() {
  state = blankState();
  brush = 'red';
  editingId = null;
  buildEditor();
}

function loadFlag(rec) {
  state = normalizeState(JSON.parse(JSON.stringify(rec.state)));
  brush = 'red';
  editingId = rec.id;
  buildEditor(rec.territory);
}

function buildEditor(territory) {
  refreshCount();
  roundLabel.textContent = editingId ? 'Editing your flag' : 'Design a flag for your own territory';
  hintLabel.textContent = 'Pick a shape, tap a color, tap the flag to paint';
  stage.innerHTML = '';

  const canvasBox = el('div', 'forge-canvas');
  const tools = el('div', 'forge-tools');

  const nameRow = el('div', 'studio-names');
  const input = el('input', 'studio-input');
  input.type = 'text';
  input.maxLength = 24;
  input.placeholder = 'Name your territory…';
  input.value = territory || '';
  const dice = el('button', 'tool-btn', '🎲');
  dice.title = 'Random name';
  dice.onclick = () => { input.value = `${pick(TERRITORY_A)} ${pick(TERRITORY_B)}`; };
  nameRow.append(input, dice);

  const actions = el('div', 'studio-actions');
  const saveBtn = el('button', 'big-btn', editingId ? '💾 Update flag' : '💾 Save to gallery');
  saveBtn.onclick = () => saveFlag(input.value.trim());
  const galleryBtn = el('button', 'big-btn alt', '🖼 Gallery');
  galleryBtn.onclick = openGallery;
  actions.append(saveBtn, galleryBtn);

  stage.append(canvasBox, tools, nameRow, actions);

  canvasBox.addEventListener('click', (e) => {
    const region = e.target.closest('[data-region]')?.dataset.region;
    if (!region) return;
    if (region.startsWith('stripe')) state.stripes[+region.slice(6)] = brush;
    else if (region.startsWith('diag')) state.diag[+region.slice(4)] = brush;
    else if (region.startsWith('quad')) state.quad[+region.slice(4)] = brush;
    else if (region === 'field') state.field = brush;
    else if (region === 'cross') state.cross = brush;
    else if (region === 'outline') state.outlineColor = brush;
    else if (region === 'tri') state.triColor = brush;
    else if (region === 'bigtri') state.bigtriColor = brush;
    else if (region === 'cantonbg') state.canton.bg = brush;
    else if (region === 'cantonfg') state.canton.fg = brush;
    else if (region === 'emblem') state.emblem.color = brush;
    repaint(canvasBox, tools);
  });

  repaint(canvasBox, tools);
}

function repaint(canvasBox, tools) {
  canvasBox.innerHTML = flagSVG(state);
  tools.innerHTML = '';

  const shapes = el('div', 'tool-row');
  for (const [id, l] of Object.entries(SHAPES)) {
    const isActive = id === 'stripes' ? isStripeLayout(state.layout) : state.layout === id;
    const b = el('button', 'tool-btn' + (isActive ? ' active' : ''), l.label);
    b.title = l.desc;
    b.onclick = () => {
      setLayout(id === 'stripes' ? (state.lastStripeLayout || 'h3') : id);
      repaint(canvasBox, tools);
    };
    shapes.append(b);
  }
  if (state.layout === 'cross' || state.layout === 'bigtri' || state.layout === 'england') {
    const b = el('button', 'tool-btn' + (state.outlineOn ? ' active' : ''), '▣ Outline');
    b.onclick = () => { state.outlineOn = !state.outlineOn; repaint(canvasBox, tools); };
    shapes.append(b);
  }
  const triBtn = el('button', 'tool-btn' + (state.triOn ? ' active' : ''), '◺ Triangle');
  triBtn.onclick = () => { state.triOn = !state.triOn; repaint(canvasBox, tools); };
  shapes.append(triBtn);
  tools.append(shapes);

  if (isStripeLayout(state.layout)) {
    const n = stripeCount(state.layout), dir = state.layout[0];
    const stripeRow = el('div', 'tool-row');
    for (const [d, label] of [['h', '▤ Horizontal'], ['v', '▥ Vertical']]) {
      const b = el('button', 'tool-btn' + (dir === d ? ' active' : ''), label);
      b.onclick = () => { setLayout(`${d}${n}`); repaint(canvasBox, tools); };
      stripeRow.append(b);
    }
    const dec = el('button', 'tool-btn', '－');
    dec.title = 'Fewer stripes';
    dec.onclick = () => { if (n > STRIPE_MIN) setLayout(`${dir}${n - 1}`); repaint(canvasBox, tools); };
    const countTag = el('span', 'pill', `${n} stripe${n === 1 ? '' : 's'}`);
    const inc = el('button', 'tool-btn', '＋');
    inc.title = `More stripes (up to ${STRIPE_MAX}, like the US flag)`;
    inc.onclick = () => { if (n < STRIPE_MAX) setLayout(`${dir}${n + 1}`); repaint(canvasBox, tools); };
    stripeRow.append(dec, countTag, inc);
    tools.append(stripeRow);

    if (n >= 3) {
      const unevenRow = el('div', 'tool-row');
      const b = el('button', 'tool-btn' + (state.stripeWidth === 'uneven' ? ' active' : ''), '⚖ Uneven');
      b.title = 'Uneven stripe widths — wider in the middle';
      b.onclick = () => {
        state.stripeWidth = state.stripeWidth === 'uneven' ? 'equal' : 'uneven';
        repaint(canvasBox, tools);
      };
      unevenRow.append(b);
      tools.append(unevenRow);
    }
  }

  const colors = el('div', 'tool-row');
  for (const key of PALETTE_ORDER) {
    const b = el('button', 'swatch' + (brush === key ? ' active' : ''));
    b.style.background = PALETTE[key];
    b.title = key;
    b.onclick = () => { brush = key; repaint(canvasBox, tools); };
    colors.append(b);
  }
  tools.append(colors);

  const cantonRow = el('div', 'tool-row');
  const cantonToggle = el('button', 'tool-btn' + (state.canton.on ? ' active' : ''), '🏳 Canton');
  cantonToggle.title = 'Corner canton (a flag-in-flag, like Union Jack colonial ensigns)';
  cantonToggle.onclick = () => { state.canton.on = !state.canton.on; repaint(canvasBox, tools); };
  cantonRow.append(cantonToggle);
  tools.append(cantonRow);

  if (state.canton.on) {
    const typeRow = el('div', 'tool-row');
    for (const [id, label] of CANTON_TYPES) {
      const b = el('button', 'tool-btn' + (state.canton.type === id ? ' active' : ''), label);
      b.onclick = () => { state.canton.type = id; repaint(canvasBox, tools); };
      typeRow.append(b);
    }
    tools.append(typeRow);

    if (state.canton.type === 'stars') {
      const countRow = el('div', 'tool-row');
      for (const n of CANTON_STAR_COUNTS) {
        const b = el('button', 'tool-btn' + (state.canton.count === n ? ' active' : ''), String(n));
        b.onclick = () => { state.canton.count = n; repaint(canvasBox, tools); };
        countRow.append(b);
      }
      tools.append(countRow);
    }
  }

  const ems = el('div', 'tool-row');
  for (const [id, label] of Object.entries(EMBLEMS)) {
    const b = el('button', 'tool-btn' + (state.emblem.type === id ? ' active' : ''), label);
    b.onclick = () => {
      state.emblem.type = id;
      if (id === 'none') state.emblem.color = null;
      else if (!state.emblem.color) state.emblem.color = brush;
      repaint(canvasBox, tools);
    };
    ems.append(b);
  }
  tools.append(ems);

  if (state.emblem.type === 'shield') {
    const coaRow = el('div', 'tool-row');
    for (const [id, def] of Object.entries(COA_TYPES)) {
      const b = el('button', 'tool-btn' + ((state.emblem.coa || 'plain') === id ? ' active' : ''), def.label);
      b.onclick = () => { state.emblem.coa = id; repaint(canvasBox, tools); };
      coaRow.append(b);
    }
    tools.append(coaRow);
  }

  if (state.emblem.type !== 'none') {
    const opts = el('div', 'tool-row');
    for (const [pos, label] of [['center', 'Middle'], ['hoist', 'Near pole']]) {
      const b = el('button', 'tool-btn' + (state.emblem.pos === pos ? ' active' : ''), label);
      b.onclick = () => { state.emblem.pos = pos; repaint(canvasBox, tools); };
      opts.append(b);
    }
    for (const [sz, label] of [['sm', 'Small'], ['md', 'Medium'], ['lg', 'Big']]) {
      const b = el('button', 'tool-btn' + (state.emblem.size === sz ? ' active' : ''), label);
      b.onclick = () => { state.emblem.size = sz; repaint(canvasBox, tools); };
      opts.append(b);
    }
    tools.append(opts);
  }
}

/* ---------- gallery (localStorage) ---------- */

function loadGallery() {
  try { return JSON.parse(localStorage.getItem(GALLERY_KEY)) || []; }
  catch { return []; }
}
function storeGallery(list) {
  localStorage.setItem(GALLERY_KEY, JSON.stringify(list));
}
function refreshCount() {
  countPill.textContent = `🖼 ${loadGallery().length}`;
}

function saveFlag(territory) {
  const name = territory || `${pick(TERRITORY_A)} ${pick(TERRITORY_B)}`;
  const list = loadGallery();
  if (editingId) {
    const rec = list.find((r) => r.id === editingId);
    if (rec) { rec.territory = name; rec.state = state; rec.ts = Date.now(); }
  } else {
    editingId = 'f' + Date.now();
    list.unshift({ id: editingId, territory: name, state, ts: Date.now() });
  }
  storeGallery(list);
  SFX.fanfare();
  refreshCount();
  flash(`💾 Saved “${name}” to your gallery!`);
}

function flash(msg) {
  const old = stage.querySelector('.studio-flash');
  if (old) old.remove();
  const f = el('div', 'fact studio-flash', msg);
  stage.querySelector('.studio-actions').after(f);
  setTimeout(() => f.remove(), 2600);
}

function openGallery() {
  refreshCount();
  const list = loadGallery();
  roundLabel.textContent = `Your gallery — ${list.length} flag${list.length === 1 ? '' : 's'}`;
  hintLabel.textContent = 'Tap a flag to keep designing it';
  stage.innerHTML = '';

  const top = el('div', 'studio-actions');
  const newBtn = el('button', 'big-btn', '＋ New flag');
  newBtn.onclick = newFlag;
  top.append(newBtn);
  stage.append(top);

  if (!list.length) {
    stage.append(el('div', 'fact', 'No flags yet — design one and hit Save!'));
    return;
  }

  const grid = el('div', 'gallery-grid');
  for (const rec of list) {
    const cell = el('div', 'gallery-cell');
    const art = el('div', 'gallery-art');
    art.innerHTML = flagSVG(normalizeState(rec.state));
    art.onclick = () => loadFlag(rec);
    const name = el('div', 'gallery-name', rec.territory);
    const del = el('button', 'gallery-del', '🗑');
    del.title = 'Delete';
    del.onclick = (e) => {
      e.stopPropagation();
      storeGallery(loadGallery().filter((r) => r.id !== rec.id));
      SFX.bad();
      openGallery();
    };
    cell.append(art, name, del);
    grid.append(cell);
  }
  stage.append(grid);
}
