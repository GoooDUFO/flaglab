/* Fake Flag Detector.
   Each round shows "Flag of X" — either the real flag, or one of:
   - mirror  : flipped left-right (only flags where that is visible)
   - flip    : flipped top-bottom (stripe orders swap)
   - hue     : colors shifted to the wrong shades
   - swap    : secretly the flag of a famous lookalike country */

const ROUNDS = 10;

// Flags that look clearly different when mirrored left-right
// (cantons, offset emblems, crescents, text, vertical tricolors...)
const MIRROR_OK = [
  'au','nz','fj','tv','ck','nu','fk','ky','vg','ms','sh','gs','pn','ai','tc',
  'bm','io','gb','us','lr','cl','uy','gr','my','to','ws','tw','cu','cz','jo',
  'ps','sd','kw','ae','bh','qa','ph','gy','dz','tr','tn','pk','mv','sg','az',
  'uz','sa','iq','br','es','pt','rs','si','sk','mt','cy','kn','tt','cd','na',
  'tz','sc','bn','kz','by','tm','lk','bt','mn','ug','zm','zw','mz','ao','pg',
  'st','gq','er','dj','tl','bs','gw','fr','it','ie','ci','ml','gn','td','ro','be',
];

// Flags that look clearly different when flipped top-bottom (stripe swaps)
const FLIP_OK = [
  'de','nl','ru','ua','hu','bg','lt','ee','lu','id','mc','pl','co','ve','ec',
  'eg','sy','ye','ga','bo','gh','in','mm','sl','at','ne',
];

// Famous lookalike pairs: [shown-as, actually-displayed]
const SWAPS = [
  ['td', 'ro'], ['ro', 'td'],
  ['id', 'mc'], ['mc', 'id'],
  ['nl', 'lu'], ['lu', 'nl'],
  ['au', 'nz'], ['nz', 'au'],
  ['us', 'lr'],
  ['ml', 'sn'], ['sn', 'ml'],
  ['is', 'no'], ['no', 'is'],
  ['ie', 'ci'], ['ci', 'ie'],
  ['bh', 'qa'], ['qa', 'bh'],
  ['si', 'sk'], ['sk', 'si'],
  ['in', 'ne'],
];

const stage = document.getElementById('stage');
const scorePill = document.getElementById('score-pill');
const roundLabel = document.getElementById('round-label');

let names, plan, round, score;

FLAG_NAMES.then((n) => {
  names = n;
  start();
});

function buildPlan() {
  // 5 real + 5 fakes (mix of manipulations), all different countries
  const used = new Set();
  const rounds = [];

  const take = (arr) => {
    for (const c of shuffle(arr)) {
      if (!used.has(c)) { used.add(c); return c; }
    }
    return null;
  };

  const allCodes = Object.keys(names);
  const fakes = shuffle([
    { kind: 'mirror' }, { kind: 'flip' }, { kind: 'hue' }, { kind: 'swap' },
    pick([{ kind: 'mirror' }, { kind: 'swap' }, { kind: 'hue' }]),
  ]);

  for (const fake of fakes) {
    if (fake.kind === 'mirror') fake.code = take(MIRROR_OK);
    else if (fake.kind === 'flip') fake.code = take(FLIP_OK);
    else if (fake.kind === 'hue') {
      fake.code = take(MIRROR_OK.concat(FLIP_OK));
      fake.deg = pick([45, 60, -50]);
    } else {
      const pair = pick(SWAPS.filter(([a, b]) => !used.has(a) && !used.has(b)));
      fake.code = pair[0];
      fake.actual = pair[1];
      used.add(pair[0]);
      used.add(pair[1]);
    }
    rounds.push(fake);
  }
  for (let i = 0; i < ROUNDS - fakes.length; i++) {
    rounds.push({ kind: 'real', code: take(allCodes) });
  }
  return shuffle(rounds);
}

function start() {
  plan = buildPlan();
  round = 0;
  score = 0;
  next();
}

function next() {
  if (round >= plan.length) {
    roundLabel.textContent = 'Round over!';
    showEndCard(stage, { score, max: ROUNDS, bestKey: 'faked-flags', playAgain: start });
    return;
  }

  const item = plan[round];
  roundLabel.textContent = `Flag ${round + 1} of ${plan.length}`;
  scorePill.textContent = score;
  stage.innerHTML = '';

  const stageCard = el('div', 'flag-stage');
  stageCard.append(el('div', 'country', `Flag of ${names[item.code]}`));

  const img = new Image();
  img.src = flagSrc(item.kind === 'swap' ? item.actual : item.code);
  img.alt = '';
  if (item.kind === 'mirror') img.style.transform = 'scaleX(-1)';
  if (item.kind === 'flip') img.style.transform = 'scaleY(-1)';
  if (item.kind === 'hue') img.style.filter = `hue-rotate(${item.deg}deg)`;
  stageCard.append(img);
  stage.append(stageCard);

  const row = el('div', 'verdict-row');
  const realBtn = el('button', 'choice', '✅ REAL');
  const fakeBtn = el('button', 'choice', '🚨 FAKE');
  realBtn.onclick = () => answer(true, item, realBtn, fakeBtn);
  fakeBtn.onclick = () => answer(false, item, realBtn, fakeBtn);
  row.append(realBtn, fakeBtn);
  stage.append(row);

  round++;
}

function explain(item) {
  switch (item.kind) {
    case 'real': return 'That was the genuine flag.';
    case 'mirror': return 'It was <b>mirrored left-to-right</b>!';
    case 'flip': return 'It was <b>flipped upside down</b>!';
    case 'hue': return 'The <b>colors were shifted</b> to the wrong shades!';
    case 'swap': return `That was actually the flag of <b>${names[item.actual]}</b>!`;
  }
}

function answer(saidReal, item, realBtn, fakeBtn) {
  realBtn.disabled = fakeBtn.disabled = true;
  const isReal = item.kind === 'real';
  const right = saidReal === isReal;
  (isReal ? realBtn : fakeBtn).classList.add('correct');
  if (!right) (saidReal ? realBtn : fakeBtn).classList.add('wrong');
  if (right) { score++; SFX.good(); } else SFX.bad();
  scorePill.textContent = score;

  const fact = el('div', 'fact' + (right ? '' : ' bad'),
    (right ? '✅ ' : '❌ ') + explain(item));
  stage.append(fact);

  // For fakes, show the real flag next to the explanation
  if (!isReal) {
    const realCard = el('div', 'flag-stage');
    realCard.style.marginTop = '14px';
    realCard.append(el('div', 'country', `The real ${names[item.code]}:`));
    const img = new Image();
    img.src = flagSrc(item.code);
    img.alt = '';
    realCard.append(img);
    stage.append(realCard);
  }

  const btn = el('button', 'big-btn', round < plan.length ? 'Next flag' : 'See my score');
  btn.onclick = next;
  stage.append(btn);
  btn.scrollIntoView({ behavior: 'smooth', block: 'end' });
}
