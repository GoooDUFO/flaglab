/* Ratio Nerd: official flag proportions (height : width).
   Every ratio below was verified against the bundled SVGs' intrinsic
   sizes, which follow the official specs. Flags render letterboxed at
   their true shapes — the eye is allowed to help. */

const RATIOS = [
  { code: 'ch', r: '1:1 (square)' },
  { code: 'va', r: '1:1 (square)' },
  { code: 'np', r: 'taller than wide!' },
  { code: 'qa', r: '11:28' },
  { code: 'tg', r: '1:1.618 (golden ratio)' },
  { code: 'sv', r: '189:335' },
  { code: 'be', r: '13:15' },
  { code: 'ne', r: '6:7' },
  { code: 'mc', r: '4:5' },
  { code: 'dk', r: '28:37' },
  { code: 'no', r: '8:11' },
  { code: 'is', r: '18:25' },
  { code: 'fi', r: '11:18' },
  { code: 'se', r: '5:8' },
  { code: 'pl', r: '5:8' },
  { code: 'mx', r: '4:7' },
  { code: 'us', r: '10:19' },
  { code: 'lr', r: '10:19' },
  { code: 'mh', r: '10:19' },
  { code: 'pg', r: '3:4' },
  { code: 'sm', r: '3:4' },
  { code: 'de', r: '3:5' },
  { code: 'lu', r: '3:5' },
  { code: 'bd', r: '3:5' },
  { code: 'fr', r: '2:3' },
  { code: 'jp', r: '2:3' },
  { code: 'it', r: '2:3' },
  { code: 'es', r: '2:3' },
  { code: 'at', r: '2:3' },
  { code: 'id', r: '2:3' },
  { code: 'tr', r: '2:3' },
  { code: 'gb', r: '1:2' },
  { code: 'ie', r: '1:2' },
  { code: 'ca', r: '1:2' },
  { code: 'hu', r: '1:2' },
  { code: 'au', r: '1:2' },
  { code: 'tv', r: '1:2' },
];

const FACTS = {
  qa: 'The longest national flag — two and a half times wider than it is tall.',
  ch: 'Switzerland and Vatican City are the only two square national flags.',
  va: 'Switzerland and Vatican City are the only two square national flags.',
  np: 'Nepal is the only national flag TALLER than it is wide — and its exact ratio is an irrational number.',
  tg: 'Togo is the only flag officially built on the golden ratio.',
  sv: 'El Salvador’s 189:335 is the strangest official ratio of any flag.',
  be: 'Belgium is almost square — blame an old army regulation.',
  ne: 'Niger is nearly square at 6:7. Nobody knows quite why.',
  mc: 'Same design as Indonesia — only the 4:5 proportions tell Monaco apart.',
  dk: '28:37 — history, not math.',
  mx: 'Most tricolors are 2:3, but Mexico stretches to 4:7.',
  hu: 'Hungary is officially 1:2, even though you usually see it printed squarer.',
  us: 'The US, Liberia AND the Marshall Islands all use 10:19.',
  lr: 'Liberia copies the US ratio of 10:19 — its founders were freed American slaves.',
  mh: 'Same 10:19 as the US flag.',
  pl: 'Poland shares 5:8 with Sweden and Argentina.',
};

const SPECIALS = [
  { q: 'Which national flag is TALLER than it is wide?',
    o: ['Nepal', 'Switzerland', 'Qatar', 'Vatican City'], a: 0,
    fact: 'Nepal’s double pennant is the only one — its constitution defines the shape with a geometric recipe whose ratio is irrational.' },
  { q: 'Which flag is officially built on the golden ratio (1:1.618)?',
    o: ['Togo', 'Greece', 'Japan', 'Switzerland'], a: 0,
    fact: 'Togo — the only golden-ratio flag in the world.' },
  { q: 'Monaco and Indonesia fly the same red-over-white design. What officially tells them apart?',
    o: ['The proportions (4:5 vs 2:3)', 'The shade of red', 'The stitching', 'Nothing at all'], a: 0,
    fact: 'Monaco is a stubby 4:5, Indonesia a standard 2:3. Poland dodges the fight by being white-over-red.' },
  { q: 'The most stretched-out national flag, at 11:28, belongs to…',
    o: ['Qatar', 'the United Kingdom', 'the United States', 'Mexico'], a: 0,
    fact: 'Qatar — no other flag comes close.' },
  { q: 'Which two flags are perfectly square?',
    o: ['Switzerland and Vatican City', 'Switzerland and Belgium', 'Vatican City and Nepal', 'Belgium and Niger'], a: 0,
    fact: 'Belgium (13:15) and Niger (6:7) are close, but only these two are true squares.' },
  { q: 'El Salvador’s official flag ratio is famously…',
    o: ['189:335', '2:3', '3:5', '1:2'], a: 0,
    fact: 'Yes, really — 189:335. Vexillologists lose sleep over it.' },
  { q: 'Which of these flags is NOT officially 10:19?',
    o: ['Mexico', 'the United States', 'Liberia', 'the Marshall Islands'], a: 0,
    fact: 'Mexico is 4:7. The other three all share the odd American 10:19.' },
];

const ROUNDS = 10;
const stage = document.getElementById('stage');
const scorePill = document.getElementById('score-pill');
const roundLabel = document.getElementById('round-label');

let names, deck, round, score;

FLAG_NAMES.then((n) => { names = n; start(); });

function allRatios() {
  return [...new Set(RATIOS.map((e) => e.r))];
}

function buildDeck() {
  const qs = [];

  for (const s of sample(SPECIALS, 3)) qs.push({ type: 'text', ...s });

  // guess the ratio of a shown flag
  for (const entry of sample(RATIOS, 4)) {
    const wrong = sample(allRatios().filter((r) => r !== entry.r), 3);
    qs.push({ type: 'guess', entry, options: shuffle([entry.r, ...wrong]) });
  }

  // find the flag with a given ratio
  const used = new Set();
  for (let i = 0; i < 3; i++) {
    const target = pick(RATIOS.filter((e) => !used.has(e.code)));
    used.add(target.code);
    const decoys = sample(RATIOS.filter((e) => e.r !== target.r && !used.has(e.code)), 3);
    decoys.forEach((d) => used.add(d.code));
    qs.push({ type: 'find', target, options: shuffle([target, ...decoys]) });
  }

  return shuffle(qs);
}

function start() {
  deck = buildDeck();
  round = 0;
  score = 0;
  next();
}

function next() {
  if (round >= deck.length) {
    roundLabel.textContent = 'Round over!';
    showEndCard(stage, { score, max: ROUNDS, bestKey: 'ratio-nerd', playAgain: start });
    return;
  }

  const q = deck[round];
  roundLabel.textContent = `Question ${round + 1} of ${deck.length}`;
  scorePill.textContent = score;
  round++;
  stage.innerHTML = '';

  if (q.type === 'text') renderText(q);
  else if (q.type === 'guess') renderGuess(q);
  else renderFind(q);
}

function finishQuestion(right, factHtml) {
  if (right) score++;
  (right ? SFX.good : SFX.bad)();
  scorePill.textContent = score;
  if (factHtml) stage.append(el('div', 'fact' + (right ? '' : ' bad'), (right ? '✅ ' : '❌ ') + factHtml));
  const btn = el('button', 'big-btn', round < deck.length ? 'Next question' : 'See my score');
  btn.onclick = next;
  stage.append(btn);
  btn.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

function renderText(q) {
  stage.append(el('div', 'prompt', q.q));
  const grid = el('div', 'choices text-only');
  const buttons = q.o.map((text, i) => {
    const b = el('button', 'choice', text);
    b.onclick = () => {
      buttons.forEach((x) => (x.disabled = true));
      buttons[q.a].classList.add('correct');
      if (i !== q.a) b.classList.add('wrong');
      finishQuestion(i === q.a, q.fact);
    };
    grid.append(b);
    return b;
  });
  stage.append(grid);
}

function renderGuess(q) {
  stage.append(el('div', 'prompt',
    `What is the official ratio of <b>${names[q.entry.code]}</b>’s flag (height : width)?`));
  const card = el('div', 'flag-stage');
  const img = new Image();
  img.src = flagSrc(q.entry.code);
  img.alt = '';
  card.append(img);
  stage.append(card);

  const grid = el('div', 'choices text-only');
  const buttons = q.options.map((r) => {
    const b = el('button', 'choice', r);
    b.onclick = () => {
      buttons.forEach((x) => (x.disabled = true));
      buttons.find((x) => x.textContent === q.entry.r).classList.add('correct');
      const right = r === q.entry.r;
      if (!right) b.classList.add('wrong');
      finishQuestion(right, `<b>${q.entry.r}.</b> ${FACTS[q.entry.code] || ''}`);
    };
    grid.append(b);
    return b;
  });
  stage.append(grid);
}

function renderFind(q) {
  stage.append(el('div', 'prompt', `Which of these flags is officially <b>${q.target.r}</b>?`));
  const grid = el('div', 'choices');
  const buttons = q.options.map((entry) => {
    const b = el('button', 'choice');
    const img = new Image();
    img.src = flagSrc(entry.code);
    img.alt = '';
    b.append(img, el('span', '', names[entry.code]));
    b.onclick = () => {
      buttons.forEach((x) => (x.disabled = true));
      buttons[q.options.indexOf(q.target)].classList.add('correct');
      const right = entry === q.target;
      if (!right) b.classList.add('wrong');
      finishQuestion(right,
        `<b>${names[q.target.code]}</b> is ${q.target.r}. ${FACTS[q.target.code] || ''}` +
        (right ? '' : ` (${names[entry.code]} is ${entry.r}.)`));
    };
    grid.append(b);
    return b;
  });
  stage.append(grid);
}
