/* Way Too Close: an extreme close-up of a flag slowly zooms out.
   Answer while it's still zoomed in for more points.
   Each pool entry: [code, fx, fy] — fx/fy is where the interesting
   detail sits, as a fraction of width/height. */

const POOL = [
  // British ensigns — arms in the fly half
  ['fk', 0.72, 0.5], ['ky', 0.72, 0.5], ['vg', 0.72, 0.5], ['ms', 0.72, 0.5],
  ['ai', 0.72, 0.5], ['tc', 0.72, 0.5], ['sh', 0.72, 0.5], ['gs', 0.72, 0.5],
  ['pn', 0.72, 0.5], ['bm', 0.72, 0.5], ['io', 0.7, 0.5], ['fj', 0.72, 0.5],
  ['ta', 0.72, 0.5],
  ['ck', 0.72, 0.5], ['nz', 0.72, 0.5], ['au', 0.75, 0.5], ['tv', 0.65, 0.55],
  ['nu', 0.25, 0.25],
  // Pacific & Indian Ocean
  ['pm', 0.6, 0.45], ['ki', 0.5, 0.4], ['pg', 0.5, 0.5], ['ws', 0.22, 0.25],
  ['to', 0.18, 0.2], ['pf', 0.5, 0.45], ['nc', 0.35, 0.5], ['nf', 0.5, 0.5],
  ['cx', 0.5, 0.5], ['cc', 0.4, 0.5], ['wf', 0.62, 0.5], ['as', 0.7, 0.5],
  ['gu', 0.5, 0.5], ['mp', 0.5, 0.5], ['mh', 0.4, 0.4], ['mw', 0.5, 0.2],
  // Americas
  ['mx', 0.5, 0.5], ['gt', 0.5, 0.5], ['sv', 0.5, 0.5], ['ni', 0.5, 0.5],
  ['cr', 0.35, 0.5], ['py', 0.5, 0.5], ['pe', 0.5, 0.5], ['ec', 0.5, 0.5],
  ['ve', 0.15, 0.22], ['br', 0.5, 0.5], ['ar', 0.5, 0.5], ['uy', 0.2, 0.25],
  ['do', 0.5, 0.5], ['ht', 0.5, 0.5], ['bz', 0.5, 0.5],
  // Europe
  ['md', 0.5, 0.5], ['rs', 0.38, 0.5], ['me', 0.5, 0.5], ['si', 0.28, 0.32],
  ['sk', 0.35, 0.5], ['hr', 0.5, 0.45], ['es', 0.35, 0.5], ['pt', 0.4, 0.5],
  ['ad', 0.5, 0.5], ['sm', 0.5, 0.5], ['va', 0.75, 0.5], ['mt', 0.12, 0.18],
  ['cy', 0.5, 0.45], ['im', 0.5, 0.5], ['gg', 0.5, 0.5], ['je', 0.5, 0.3],
  ['gi', 0.4, 0.5],
  // Africa & Middle East
  ['eg', 0.5, 0.5], ['sa', 0.5, 0.5], ['ir', 0.5, 0.5], ['af', 0.5, 0.5],
  ['et', 0.5, 0.5], ['ke', 0.5, 0.5], ['ug', 0.5, 0.5], ['zw', 0.15, 0.5],
  ['zm', 0.85, 0.7], ['mz', 0.15, 0.5], ['ao', 0.5, 0.5], ['sz', 0.5, 0.5],
  ['ls', 0.5, 0.5],
  // Asia
  ['tm', 0.12, 0.5], ['kz', 0.5, 0.5], ['kg', 0.5, 0.5], ['mn', 0.15, 0.5],
  ['np', 0.4, 0.35], ['bn', 0.5, 0.5], ['bt', 0.5, 0.5], ['lk', 0.6, 0.5],
  ['kh', 0.5, 0.5],
];

// Ensign-family codes get ensign distractors — much sneakier
const ENSIGNS = new Set(['fk','ky','vg','ms','ai','tc','sh','gs','pn','bm','io','fj','ck','nz','au','tv','nu','ta']);

const ROUNDS = 8;
const ZOOM_START = 14;
const ZOOM_END = 3;
const ZOOM_SECONDS = 10;

const stage = document.getElementById('stage');
const scorePill = document.getElementById('score-pill');
const roundLabel = document.getElementById('round-label');

let names, deck, round, score, raf, zoomState;

FLAG_NAMES.then((n) => {
  names = n;
  start();
});

function start() {
  deck = shuffle(POOL).slice(0, ROUNDS);
  round = 0;
  score = 0;
  next();
}

function next() {
  cancelAnimationFrame(raf);
  if (round >= deck.length) {
    roundLabel.textContent = 'Round over!';
    showEndCard(stage, { score, max: 0, bestKey: 'zoomed-in', playAgain: start });
    return;
  }

  const [code, fx, fy] = deck[round];
  roundLabel.textContent = `Flag ${round + 1} of ${deck.length}`;
  scorePill.textContent = score;
  stage.innerHTML = '';

  const win = el('div', 'zoom-window');
  const img = new Image();
  img.src = flagSrc(code);
  img.alt = '';
  img.style.transformOrigin = `${fx * 100}% ${fy * 100}%`;
  img.style.transform = `scale(${ZOOM_START})`;
  win.append(img);

  const meter = el('div', 'zoom-meter');
  stage.append(win, meter);

  // Choices: same-family distractors when possible
  const family = ENSIGNS.has(code)
    ? [...ENSIGNS].filter((c) => c !== code)
    : POOL.map((p) => p[0]).filter((c) => c !== code);
  const options = shuffle([code, ...sample(family, 3)]);

  const grid = el('div', 'choices text-only');
  grid.style.gridTemplateColumns = '1fr 1fr';
  const buttons = [];
  options.forEach((c) => {
    const btn = el('button', 'choice', names[c]);
    btn.onclick = () => answer(c, code, buttons, img);
    buttons.push(btn);
    grid.append(btn);
  });
  stage.append(grid);

  // Animate the zoom-out and keep score-worthy state
  const t0 = performance.now();
  zoomState = { scale: ZOOM_START, done: false };
  const tick = (t) => {
    const p = Math.min(1, (t - t0) / (ZOOM_SECONDS * 1000));
    zoomState.scale = ZOOM_START + (ZOOM_END - ZOOM_START) * p;
    img.style.transform = `scale(${zoomState.scale})`;
    meter.textContent = `💰 Worth ${points()} points right now`;
    if (p < 1) raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  round++;
}

function points() {
  return Math.max(ZOOM_END, Math.ceil(zoomState.scale));
}

function answer(chosen, code, buttons, img) {
  cancelAnimationFrame(raf);
  const earned = chosen === code ? points() : 0;
  if (earned) SFX.good(); else SFX.bad();
  buttons.forEach((b) => {
    b.disabled = true;
    if (b.textContent === names[code]) b.classList.add('correct');
    else if (b.textContent === names[chosen]) b.classList.add('wrong');
  });
  img.style.transition = 'transform 0.8s ease';
  img.style.transform = 'scale(1)';
  score += earned;
  scorePill.textContent = score;

  const fact = el('div', 'fact' + (earned ? '' : ' bad'),
    earned
      ? `✅ Yes! That was <b>${names[code]}</b> — +${earned} points!`
      : `❌ It was <b>${names[code]}</b>.`);
  stage.append(fact);

  const btn = el('button', 'big-btn', round < deck.length ? 'Next flag' : 'See my score');
  btn.onclick = next;
  stage.append(btn);
  btn.scrollIntoView({ behavior: 'smooth', block: 'end' });
}
