/* Flag Studio: a free-play sandbox — design a flag for your own
   invented territory and save it to an offline gallery. No scoring.
   Built on the Flag Forge renderer, expanded with more shapes, a
   bigger palette, emblem sizing, a diagonal split and a hoist triangle. */

const PALETTE = {
  red: '#e11d2e', maroon: '#8a1538', orange: '#f4772e', yellow: '#ffd23f',
  gold: '#c8a020', green: '#1e9e4a', teal: '#199e8f', lightblue: '#4fa8dd',
  blue: '#1d56c4', navy: '#14205a', purple: '#7b3fd8', pink: '#ff6bd6',
  brown: '#7a4a24', white: '#f5f6fa', black: '#20212e',
};
const PALETTE_ORDER = Object.keys(PALETTE);
const BLANK = '#5b6187';

const LAYOUTS = {
  plain: { label: '▭', desc: 'solid field' },
  h2: { label: '2 ▤', desc: '2 stripes', stripes: 2 },
  h3: { label: '3 ▤', desc: '3 stripes', stripes: 3 },
  v2: { label: '2 ▥', desc: '2 bands', stripes: 2 },
  v3: { label: '3 ▥', desc: '3 bands', stripes: 3 },
  cross: { label: '✚', desc: 'Nordic cross' },
  diag: { label: '◪', desc: 'diagonal split' },
};
const EMBLEMS = {
  none: '∅', disc: '●', ring: '◎', star: '★', crescent: '☾', diamond: '◆', tri: '▲',
};
const SIZES = { sm: 0.72, md: 1, lg: 1.35 };

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
    field: null,
    cross: null, outlineOn: false, outlineColor: 'white',
    diag: [null, null],
    triOn: false, triColor: null,
    emblem: { type: 'none', color: null, pos: 'center', size: 'md' },
  };
}

function setLayout(id) {
  state.layout = id;
  const n = LAYOUTS[id].stripes;
  if (n) {
    const old = state.stripes;
    state.stripes = new Array(n).fill(null).map((_, i) => old[i] ?? null);
  }
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

function flagSVG(s) {
  const W = 300, H = 200, id = 'u' + (uid++);
  let body = '';

  if (s.layout === 'h2' || s.layout === 'h3') {
    const n = s.stripes.length, h = H / n;
    s.stripes.forEach((c, i) => {
      body += `<rect data-region="stripe${i}" x="0" y="${i * h}" width="${W}" height="${h + 0.5}" fill="${fill(c)}"/>`;
    });
  } else if (s.layout === 'v2' || s.layout === 'v3') {
    const n = s.stripes.length, w = W / n;
    s.stripes.forEach((c, i) => {
      body += `<rect data-region="stripe${i}" x="${i * w}" y="0" width="${w + 0.5}" height="${H}" fill="${fill(c)}"/>`;
    });
  } else if (s.layout === 'diag') {
    body += `<polygon data-region="diag0" points="0,0 ${W},0 0,${H}" fill="${fill(s.diag[0])}"/>`;
    body += `<polygon data-region="diag1" points="${W},0 ${W},${H} 0,${H}" fill="${fill(s.diag[1])}"/>`;
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
    }
  }

  if (s.triOn) {
    body += `<polygon data-region="tri" points="0,0 140,${H / 2} 0,${H}" fill="${fill(s.triColor)}"/>`;
  }

  const em = s.emblem;
  if (em.type !== 'none') {
    const cx = em.pos === 'hoist' ? 95 : 150, cy = 100, c = fill(em.color);
    const k = SIZES[em.size];
    if (em.type === 'disc') {
      body += `<circle data-region="emblem" cx="${cx}" cy="${cy}" r="${42 * k}" fill="${c}"/>`;
    } else if (em.type === 'ring') {
      body += `<circle data-region="emblem" cx="${cx}" cy="${cy}" r="${38 * k}" fill="none" stroke="${c}" stroke-width="${13 * k}"/>`;
    } else if (em.type === 'star') {
      body += `<polygon data-region="emblem" points="${starPts(cx, cy, 52 * k)}" fill="${c}"/>`;
    } else if (em.type === 'diamond') {
      const d = 50 * k;
      body += `<polygon data-region="emblem" points="${cx},${cy - d} ${cx + d},${cy} ${cx},${cy + d} ${cx - d},${cy}" fill="${c}"/>`;
    } else if (em.type === 'tri') {
      const d = 52 * k;
      body += `<polygon data-region="emblem" points="${cx},${cy - d} ${cx + d * 0.9},${cy + d * 0.7} ${cx - d * 0.9},${cy + d * 0.7}" fill="${c}"/>`;
    } else { // crescent
      const r = 44 * k;
      body += `<g data-region="emblem">
        <mask id="${id}">
          <rect x="0" y="0" width="${W}" height="${H}" fill="#fff"/>
          <circle cx="${cx + 16 * k}" cy="${cy}" r="${36 * k}" fill="#000"/>
        </mask>
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="${c}" mask="url(#${id})"/>
        <polygon points="${starPts(cx + 40 * k, cy, 14 * k)}" fill="${c}"/></g>`;
    }
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
  state = JSON.parse(JSON.stringify(rec.state));
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
    else if (region === 'field') state.field = brush;
    else if (region === 'cross') state.cross = brush;
    else if (region === 'outline') state.outlineColor = brush;
    else if (region === 'tri') state.triColor = brush;
    else if (region === 'emblem') state.emblem.color = brush;
    repaint(canvasBox, tools);
  });

  repaint(canvasBox, tools);
}

function repaint(canvasBox, tools) {
  canvasBox.innerHTML = flagSVG(state);
  tools.innerHTML = '';

  const shapes = el('div', 'tool-row');
  for (const [id, l] of Object.entries(LAYOUTS)) {
    const b = el('button', 'tool-btn' + (state.layout === id ? ' active' : ''), l.label);
    b.title = l.desc;
    b.onclick = () => { setLayout(id); repaint(canvasBox, tools); };
    shapes.append(b);
  }
  if (state.layout === 'cross') {
    const b = el('button', 'tool-btn' + (state.outlineOn ? ' active' : ''), '▣ Outline');
    b.onclick = () => { state.outlineOn = !state.outlineOn; repaint(canvasBox, tools); };
    shapes.append(b);
  }
  const triBtn = el('button', 'tool-btn' + (state.triOn ? ' active' : ''), '◺ Triangle');
  triBtn.onclick = () => { state.triOn = !state.triOn; repaint(canvasBox, tools); };
  shapes.append(triBtn);
  tools.append(shapes);

  const colors = el('div', 'tool-row');
  for (const key of PALETTE_ORDER) {
    const b = el('button', 'swatch' + (brush === key ? ' active' : ''));
    b.style.background = PALETTE[key];
    b.title = key;
    b.onclick = () => { brush = key; repaint(canvasBox, tools); };
    colors.append(b);
  }
  tools.append(colors);

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
    art.innerHTML = flagSVG(rec.state);
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
