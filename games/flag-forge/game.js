/* Flag Forge: build a flag from memory out of parts, then compare it
   to the real thing.

   Spec format:
   layout  — h2/h3 (sideways stripes), v2/v3 (upright bands),
             cross (Nordic), plain (solid field)
   stripes — colors top→bottom (h) or pole→outward (v)
   field/cross/outline — cross & plain layouts
   emblem  — { type: disc|star|crescent, color, pos: center|hoist }
   Colors are palette keys, not exact shades — close enough to forge. */

const SPECS = [
  // sideways stripes
  { code: 'id', layout: 'h2', stripes: ['red', 'white'] },
  { code: 'mc', layout: 'h2', stripes: ['red', 'white'], fact: 'Identical to Indonesia’s — only the proportions differ.' },
  { code: 'pl', layout: 'h2', stripes: ['white', 'red'] },
  { code: 'ua', layout: 'h2', stripes: ['blue', 'yellow'], fact: 'Blue sky over golden wheat fields.' },
  { code: 'de', layout: 'h3', stripes: ['black', 'red', 'yellow'] },
  { code: 'ru', layout: 'h3', stripes: ['white', 'blue', 'red'] },
  { code: 'nl', layout: 'h3', stripes: ['red', 'white', 'blue'], fact: 'Luxembourg’s is nearly the same — just a lighter blue.' },
  { code: 'lu', layout: 'h3', stripes: ['red', 'white', 'lightblue'] },
  { code: 'at', layout: 'h3', stripes: ['red', 'white', 'red'], fact: 'Legend: a duke’s white tunic stayed clean only under his sword belt after battle.' },
  { code: 'hu', layout: 'h3', stripes: ['red', 'white', 'green'] },
  { code: 'bg', layout: 'h3', stripes: ['white', 'green', 'red'] },
  { code: 'ee', layout: 'h3', stripes: ['blue', 'black', 'white'] },
  { code: 'lt', layout: 'h3', stripes: ['yellow', 'green', 'red'] },
  { code: 'ye', layout: 'h3', stripes: ['red', 'white', 'black'] },
  { code: 'sl', layout: 'h3', stripes: ['green', 'white', 'blue'] },
  { code: 'ga', layout: 'h3', stripes: ['green', 'yellow', 'blue'] },
  // upright bands
  { code: 'fr', layout: 'v3', stripes: ['blue', 'white', 'red'] },
  { code: 'it', layout: 'v3', stripes: ['green', 'white', 'red'] },
  { code: 'ie', layout: 'v3', stripes: ['green', 'white', 'orange'], fact: 'Côte d’Ivoire is the mirror image — orange at the pole instead.' },
  { code: 'ci', layout: 'v3', stripes: ['orange', 'white', 'green'] },
  { code: 'be', layout: 'v3', stripes: ['black', 'yellow', 'red'] },
  { code: 'ro', layout: 'v3', stripes: ['blue', 'yellow', 'red'] },
  { code: 'td', layout: 'v3', stripes: ['blue', 'yellow', 'red'], fact: 'Romania’s twin — Chad’s blue is officially a bit darker.' },
  { code: 'ml', layout: 'v3', stripes: ['green', 'yellow', 'red'] },
  { code: 'gn', layout: 'v3', stripes: ['red', 'yellow', 'green'], fact: 'Mali’s mirror image!' },
  { code: 'ng', layout: 'v3', stripes: ['green', 'white', 'green'] },
  { code: 'pe', layout: 'v3', stripes: ['red', 'white', 'red'] },
  { code: 'sn', layout: 'v3', stripes: ['green', 'yellow', 'red'], emblem: { type: 'star', color: 'green', pos: 'center' } },
  { code: 'cm', layout: 'v3', stripes: ['green', 'red', 'yellow'], emblem: { type: 'star', color: 'yellow', pos: 'center' } },
  { code: 'dz', layout: 'v2', stripes: ['green', 'white'], emblem: { type: 'crescent', color: 'red', pos: 'center' },
    fact: 'The red crescent sits right on the seam between green and white.' },
  // Nordic crosses
  { code: 'dk', layout: 'cross', field: 'red', cross: 'white', fact: 'The Dannebrog — oldest national flag still in use.' },
  { code: 'se', layout: 'cross', field: 'blue', cross: 'yellow' },
  { code: 'fi', layout: 'cross', field: 'white', cross: 'blue' },
  { code: 'no', layout: 'cross', field: 'red', cross: 'blue', outline: 'white', fact: 'Norway’s cross wears a white outline — vexillologists call it fimbriation.' },
  { code: 'is', layout: 'cross', field: 'blue', cross: 'red', outline: 'white', fact: 'Norway’s colors, swapped around.' },
  { code: 'fo', layout: 'cross', field: 'white', cross: 'red', outline: 'blue' },
  // solid field + emblem
  { code: 'jp', layout: 'plain', field: 'white', emblem: { type: 'disc', color: 'red', pos: 'center' } },
  { code: 'bd', layout: 'plain', field: 'green', emblem: { type: 'disc', color: 'red', pos: 'hoist' },
    fact: 'The disc sits toward the pole on purpose — it looks centered when the flag flies.' },
  { code: 'pw', layout: 'plain', field: 'lightblue', emblem: { type: 'disc', color: 'yellow', pos: 'hoist' },
    fact: 'That’s the moon, not the sun — and it’s off-center on purpose, like Bangladesh’s.' },
  { code: 'vn', layout: 'plain', field: 'red', emblem: { type: 'star', color: 'yellow', pos: 'center' } },
  { code: 'so', layout: 'plain', field: 'lightblue', emblem: { type: 'star', color: 'white', pos: 'center' } },
  { code: 'tr', layout: 'plain', field: 'red', emblem: { type: 'crescent', color: 'white', pos: 'hoist' } },
];

const COLORS = {
  red: '#e11d2e', orange: '#f4772e', yellow: '#ffd23f', green: '#1e9e4a',
  blue: '#1d56c4', lightblue: '#4fa8dd', white: '#f5f6fa', black: '#20212e',
};
const COLOR_NAMES = {
  red: 'red', orange: 'orange', yellow: 'yellow', green: 'green',
  blue: 'blue', lightblue: 'light blue', white: 'white', black: 'black',
};
const BLANK = '#5b6187'; // unpainted

const LAYOUTS = {
  h2: { label: '2 ▤', desc: '2 sideways stripes', stripes: 2 },
  h3: { label: '3 ▤', desc: '3 sideways stripes', stripes: 3 },
  v2: { label: '2 ▥', desc: '2 upright bands', stripes: 2 },
  v3: { label: '3 ▥', desc: '3 upright bands', stripes: 3 },
  cross: { label: '✚', desc: 'a Nordic cross', stripes: 0 },
  plain: { label: '▭', desc: 'one solid field', stripes: 0 },
};
const EMBLEMS = { none: '∅ None', disc: '● Circle', star: '★ Star', crescent: '☾ Moon' };
const EMBLEM_NAMES = { disc: 'circle', star: 'star', crescent: 'crescent moon' };

const ROUNDS = 6;
const stage = document.getElementById('stage');
const scorePill = document.getElementById('score-pill');
const roundLabel = document.getElementById('round-label');
const hintLabel = document.getElementById('hint-label');

let names, deck, round, score, state, brush;

FLAG_NAMES.then((n) => { names = n; start(); });

function start() {
  deck = shuffle(SPECS).slice(0, ROUNDS);
  round = 0;
  score = 0;
  next();
}

function blankState(layout) {
  return {
    layout,
    stripes: new Array(LAYOUTS[layout].stripes).fill(null),
    field: null, cross: null,
    outlineOn: false, outlineColor: null,
    emblem: { type: 'none', color: null, pos: 'center' },
  };
}

/* ---------- rendering ---------- */

function fill(c) { return c ? COLORS[c] : BLANK; }

function starPts(cx, cy, R) {
  const r = R * 0.4, pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, rad = i % 2 ? r : R;
    pts.push((cx + rad * Math.cos(a)).toFixed(1) + ',' + (cy + rad * Math.sin(a)).toFixed(1));
  }
  return pts.join(' ');
}

function flagSVG(s) {
  const W = 300, H = 200;
  let body = '';
  if (s.layout === 'h2' || s.layout === 'h3') {
    const n = s.stripes.length, h = H / n;
    s.stripes.forEach((c, i) => {
      body += `<rect data-region="stripe${i}" x="0" y="${i * h}" width="${W}" height="${h}" fill="${fill(c)}"/>`;
    });
  } else if (s.layout === 'v2' || s.layout === 'v3') {
    const n = s.stripes.length, w = W / n;
    s.stripes.forEach((c, i) => {
      body += `<rect data-region="stripe${i}" x="${i * w}" y="0" width="${w}" height="${H}" fill="${fill(c)}"/>`;
    });
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
  const em = s.emblem;
  if (em.type !== 'none') {
    const cx = em.pos === 'hoist' ? 105 : 150, cy = 100, c = fill(em.color);
    if (em.type === 'disc') {
      body += `<circle data-region="emblem" cx="${cx}" cy="${cy}" r="42" fill="${c}"/>`;
    } else if (em.type === 'star') {
      body += `<polygon data-region="emblem" points="${starPts(cx, cy, 52)}" fill="${c}"/>`;
    } else {
      body += `<g data-region="emblem">
        <mask id="cresMask"><rect x="0" y="0" width="300" height="200" fill="#fff"/>
          <circle cx="${cx + 16}" cy="${cy}" r="36" fill="#000"/></mask>
        <circle cx="${cx}" cy="${cy}" r="44" fill="${c}" mask="url(#cresMask)"/>
        <polygon points="${starPts(cx + 40, cy, 14)}" fill="${c}"/></g>`;
    }
  }
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
}

/* ---------- build phase ---------- */

function next() {
  if (round >= deck.length) {
    roundLabel.textContent = 'Round over!';
    hintLabel.textContent = '';
    showEndCard(stage, { score, max: ROUNDS * 10, bestKey: 'flag-forge', playAgain: start });
    return;
  }
  const spec = deck[round];
  state = blankState('h3');
  brush = 'red';
  roundLabel.textContent = `Flag ${round + 1} of ${deck.length}`;
  scorePill.textContent = score;
  round++;
  buildUI(spec);
}

function buildUI(spec) {
  stage.innerHTML = '';
  stage.append(el('div', 'prompt', `Forge the flag of <b>${names[spec.code]}</b> — from memory!`));

  const canvasBox = el('div', 'forge-canvas');
  const tools = el('div', 'forge-tools');
  const forgeBtn = el('button', 'big-btn', '⚒️ Forge it!');
  forgeBtn.onclick = () => reveal(spec);
  stage.append(canvasBox, tools, forgeBtn);

  canvasBox.addEventListener('click', (e) => {
    const region = e.target.closest('[data-region]')?.dataset.region;
    if (!region) return;
    if (region.startsWith('stripe')) state.stripes[+region.slice(6)] = brush;
    else if (region === 'field') state.field = brush;
    else if (region === 'cross') state.cross = brush;
    else if (region === 'outline') state.outlineColor = brush;
    else if (region === 'emblem') state.emblem.color = brush;
    repaint(canvasBox, tools);
  });

  repaint(canvasBox, tools);
}

function repaint(canvasBox, tools) {
  canvasBox.innerHTML = flagSVG(state);

  tools.innerHTML = '';
  // shape row
  const shapes = el('div', 'tool-row');
  for (const [id, l] of Object.entries(LAYOUTS)) {
    const b = el('button', 'tool-btn' + (state.layout === id ? ' active' : ''), l.label);
    b.title = l.desc;
    b.onclick = () => {
      const em = state.emblem;
      state = blankState(id);
      state.emblem = em; // switching shape keeps the emblem
      repaint(canvasBox, tools);
    };
    shapes.append(b);
  }
  if (state.layout === 'cross') {
    const b = el('button', 'tool-btn' + (state.outlineOn ? ' active' : ''), '▣ Outline');
    b.onclick = () => { state.outlineOn = !state.outlineOn; repaint(canvasBox, tools); };
    shapes.append(b);
  }
  tools.append(shapes);

  // color row
  const colors = el('div', 'tool-row');
  for (const key of Object.keys(COLORS)) {
    const b = el('button', 'swatch' + (brush === key ? ' active' : ''));
    b.style.background = COLORS[key];
    b.title = COLOR_NAMES[key];
    b.onclick = () => { brush = key; repaint(canvasBox, tools); };
    colors.append(b);
  }
  tools.append(colors);

  // emblem row
  const ems = el('div', 'tool-row');
  for (const [id, label] of Object.entries(EMBLEMS)) {
    const b = el('button', 'tool-btn' + (state.emblem.type === id ? ' active' : ''), label);
    b.onclick = () => {
      state.emblem.type = id;
      if (id === 'none') state.emblem.color = null;
      repaint(canvasBox, tools);
    };
    ems.append(b);
  }
  if (state.emblem.type !== 'none') {
    for (const [pos, label] of [['center', 'Middle'], ['hoist', 'Near pole']]) {
      const b = el('button', 'tool-btn' + (state.emblem.pos === pos ? ' active' : ''), label);
      b.onclick = () => { state.emblem.pos = pos; repaint(canvasBox, tools); };
      ems.append(b);
    }
  }
  tools.append(ems);
}

/* ---------- grading ---------- */

function grade(s, spec) {
  const diffs = [];
  let got = 0, max = 0;
  const tick = (ok, msg) => { max++; if (ok) got++; else if (msg) diffs.push(msg); };

  const layoutOK = s.layout === spec.layout;
  tick(layoutOK, `the shape — it has ${LAYOUTS[spec.layout].desc}`);

  if (layoutOK) {
    if (spec.stripes) {
      const horiz = spec.layout[0] === 'h';
      const posName = (i, n) => horiz
        ? (n === 2 ? ['top', 'bottom'] : ['top', 'middle', 'bottom'])[i] + ' stripe'
        : (n === 2 ? ['pole-side', 'outer'] : ['pole-side', 'middle', 'outer'])[i] + ' band';
      spec.stripes.forEach((c, i) =>
        tick(s.stripes[i] === c, `the ${posName(i, spec.stripes.length)} should be ${COLOR_NAMES[c]}`));
    }
    if (spec.field) tick(s.field === spec.field, `the field should be ${COLOR_NAMES[spec.field]}`);
    if (spec.cross) {
      tick(s.cross === spec.cross, `the cross should be ${COLOR_NAMES[spec.cross]}`);
      const userOutline = s.outlineOn ? s.outlineColor : null;
      tick(userOutline === (spec.outline || null),
        spec.outline
          ? `the cross needs a ${COLOR_NAMES[spec.outline]} outline`
          : 'no outline on this cross');
    }
  } else {
    // wrong shape: the spec's region slots still count as missed
    max += (spec.stripes ? spec.stripes.length : 0)
      + (spec.field ? 1 : 0) + (spec.cross ? 2 : 0);
  }

  const specType = spec.emblem ? spec.emblem.type : 'none';
  tick(s.emblem.type === specType,
    specType === 'none'
      ? `no ${EMBLEM_NAMES[s.emblem.type] || 'emblem'} on this flag`
      : `it needs a ${EMBLEM_NAMES[specType]}`);
  if (specType !== 'none' && s.emblem.type === specType) {
    tick(s.emblem.color === spec.emblem.color,
      `the ${EMBLEM_NAMES[specType]} should be ${COLOR_NAMES[spec.emblem.color]}`);
    tick(s.emblem.pos === spec.emblem.pos,
      spec.emblem.pos === 'hoist'
        ? `the ${EMBLEM_NAMES[specType]} sits closer to the pole`
        : `the ${EMBLEM_NAMES[specType]} goes dead center`);
  } else if (specType !== 'none') {
    max += 2; // missing emblem also misses its color and position
  }

  return { pts: Math.round((10 * got) / max), diffs };
}

/* ---------- reveal phase ---------- */

function reveal(spec) {
  const { pts, diffs } = grade(state, spec);
  score += pts;
  scorePill.textContent = score;

  stage.innerHTML = '';
  stage.append(el('div', 'prompt', `${names[spec.code]}: <b>+${pts} points</b> ${pts === 10 ? '🏆' : pts >= 7 ? '🎉' : '🔍'}`));

  const compare = el('div', 'compare');
  const mine = el('div', 'compare-cell');
  mine.append(el('div', 'compare-label', 'Your forge'));
  const mySvg = el('div', 'forge-canvas small');
  mySvg.innerHTML = flagSVG(state);
  mine.append(mySvg);
  const real = el('div', 'compare-cell');
  real.append(el('div', 'compare-label', 'The real one'));
  const img = new Image();
  img.src = flagSrc(spec.code);
  img.alt = '';
  real.append(img);
  compare.append(mine, real);
  stage.append(compare);

  let msg;
  if (pts === 10) msg = '✅ <b>Perfect forge!</b> Every piece is right.';
  else msg = (pts >= 7 ? '👍 Close! ' : '❌ ') + 'Watch ' + diffs.slice(0, 3).join('; ') + '.';
  if (spec.fact) msg += `<br>💡 ${spec.fact}`;
  stage.append(el('div', 'fact' + (pts >= 7 ? '' : ' bad'), msg));

  const btn = el('button', 'big-btn', round < deck.length ? 'Next flag' : 'See my score');
  btn.onclick = next;
  stage.append(btn);
  btn.scrollIntoView({ behavior: 'smooth', block: 'end' });
}
