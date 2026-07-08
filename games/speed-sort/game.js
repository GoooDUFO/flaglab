/* Speed Sort: 45 seconds, flags fly at you, tap the right bin.
   Curated categories only — every code is hand-classified, with
   deliberate traps (Slovenia HAS a coastline, Kosovo is NOT in the UN). */

const CATEGORIES = [
  {
    id: 'union-jack',
    left: { label: '🇬🇧 Union Jack', codes: [
      'gb','au','nz','fj','tv','ck','nu','ai','bm','io','ky','fk','gs','ms','pn','sh','tc','vg',
    ] },
    right: { label: '🚫 No Union Jack', codes: [
      'to','ws','pw','mh','fm','us','lr','my','sg','za','ie','ca','bs','bb','jm',
      'ki','nr','vu','sb','pg','tk','nf','cx','cc','as',
    ] },
  },
  {
    id: 'star',
    left: { label: '⭐ Has a star', codes: [
      'us','cn','vn','cl','cu','tr','pk','so','ma','sn','cm','gh','tg','bf','cf',
      'ao','mz','zw','et','kp','mm','my','sg','ws','tw','ph','pa','hn','ve','br',
      'nz','au','fm','mh','tv','nr','il','jo','az','uz','tm','dz','tn','mr','bi',
    ] },
    right: { label: '🚫 No star', codes: [
      'jp','kr','th','id','mc','pl','ua','de','fr','it','ie','es','pt','se','no',
      'dk','fi','is','ch','at','be','nl','lu','hu','bg','ro','ru','gr','cy','ca',
      'za','ke','ng','eg','sa','in','lk','bd','kh','la','bt','mx','ee','lv','lt',
    ] },
  },
  {
    id: 'landlocked',
    left: { label: '🏔️ Landlocked', codes: [
      'at','ch','cz','sk','hu','rs','mk','xk','md','by','lu','li','ad','sm','va',
      'bo','py','mn','np','bt','la','af','tj','kg','kz','uz','tm','am','az','et',
      'ss','td','ne','ml','bf','cf','ug','rw','bi','zm','zw','bw','ls','sz','mw',
    ] },
    right: { label: '🌊 Has a coastline', codes: [
      'fr','es','pt','it','gr','hr','me','al','si','de','pl','nl','be','dk','se',
      'no','fi','is','gb','ie','ee','lv','lt','ro','bg','ua','ru','tr','ge','cy',
      'jp','kr','cn','vn','th','kh','mm','my','sg','id','ph','in','lk','bd','pk',
      'ir','iq','sa','ae','om','ye','qa','kw','bh','eg','ly','tn','dz','ma','mr',
      'cd','ao','na','za','mz','tz','ke','so','dj','er','sd','cg','ga','cm','ng',
      'us','ca','mx','br','ar','cl','pe','ec','co','ve','uy','gy','sr','pa','cr',
    ] },
  },
  {
    id: 'un-member',
    left: { label: '🇺🇳 UN member', codes: [
      'us','gb','fr','de','jp','br','in','cn','au','ca','mx','it','es','ru','za',
      'eg','ng','ke','ar','cl','pe','nz','fj','ws','to','tv','ki','nr','pw','mh',
      'fm','vu','sb','pg','sg','my','th','id','ph','vn','la','kh','mm','bd','lk',
      'np','bt','mv','pk','sm','li','mc','ad','ch','ee','is','mt','cy','lu',
    ] },
    right: { label: '🚫 Not a UN member', codes: [
      'ai','aw','as','bm','io','vg','ky','cw','fk','fo','gi','gl','gu','gg','hk',
      'im','je','ms','nc','nu','mp','pf','pn','pr','re','sh','pm','sx','tk','tc',
      'vi','wf','ax','cc','cx','bl','mf','mo','gs','bq','ck','va','eu','ta','xk','tw',
    ] },
  },
  {
    id: 'ocean',
    left: { label: '🌊 Pacific', codes: [
      'fj','tv','ki','nr','pw','mh','fm','ws','to','vu','sb','pg','ck','nu','tk',
      'nc','pf','wf','as','gu','mp','pn',
    ] },
    right: { label: '🏝️ Caribbean', codes: [
      'jm','ht','do','cu','bs','bb','tt','gd','lc','vc','ag','kn','dm','ai','vg',
      'ky','tc','ms','aw','cw','sx','bq','pr','vi','bl','mf','gp','mq',
    ] },
  },
];

const SECONDS = 45;
const stage = document.getElementById('stage');
const scorePill = document.getElementById('score-pill');
const roundLabel = document.getElementById('round-label');
const streakLabel = document.getElementById('streak-label');

let names, cat, deck, idx, score, streak, best_streak, endAt, raf, clock, locked, lastCatId;

FLAG_NAMES.then((n) => { names = n; start(); });

function start() {
  const pool = CATEGORIES.filter((c) => c.id !== lastCatId);
  cat = pick(pool);
  lastCatId = cat.id;

  // equal draw from both bins so blind-guessing one side never pays
  const n = Math.min(cat.left.codes.length, cat.right.codes.length);
  const mk = (side, bin) => sample(bin.codes, n).map((code) => ({ code, side }));
  deck = shuffle([...mk('left', cat.left), ...mk('right', cat.right)]);
  idx = 0;
  score = 0;
  streak = 0;
  best_streak = 0;
  locked = false;

  stage.innerHTML = '';
  const timerWrap = el('div', 'timer-track');
  const timerBar = el('div', 'timer-fill');
  timerWrap.append(timerBar);

  const arena = el('div', 'sort-arena');
  const leftBin = el('button', 'bin left', `<span>${cat.left.label}</span>`);
  const rightBin = el('button', 'bin right', `<span>${cat.right.label}</span>`);
  const flagBox = el('div', 'sort-flag');
  const img = new Image();
  img.alt = '';
  flagBox.append(img, el('div', 'sort-name', ''));
  arena.append(leftBin, flagBox, rightBin);

  const toast = el('div', 'sort-toast', '');
  stage.append(timerWrap, arena, toast);

  leftBin.onclick = () => sort('left', leftBin, rightBin, img, toast);
  rightBin.onclick = () => sort('right', leftBin, rightBin, img, toast);
  document.onkeydown = (e) => {
    if (e.key === 'ArrowLeft') leftBin.click();
    if (e.key === 'ArrowRight') rightBin.click();
  };

  show(img);
  endAt = performance.now() + SECONDS * 1000;
  // rAF paints the smooth bar, but the authoritative clock is an
  // interval — rAF stops firing when the tab is throttled.
  const paint = () => {
    const remain = Math.max(0, endAt - performance.now());
    timerBar.style.width = (remain / (SECONDS * 1000)) * 100 + '%';
    raf = requestAnimationFrame(paint);
  };
  raf = requestAnimationFrame(paint);
  clock = setInterval(() => {
    const remain = Math.max(0, endAt - performance.now());
    roundLabel.textContent = `⏱ ${Math.ceil(remain / 1000)}s`;
    if (remain <= 0) finish();
  }, 250);
}

function show(img) {
  const item = deck[idx % deck.length];
  img.src = flagSrc(item.code);
  img.parentElement.querySelector('.sort-name').textContent = names[item.code];
}

function sort(side, leftBin, rightBin, img, toast) {
  if (locked || performance.now() >= endAt) return;
  const item = deck[idx % deck.length];
  const bin = side === 'left' ? leftBin : rightBin;
  const right = item.side === side;

  if (right) {
    score++;
    streak++;
    best_streak = Math.max(best_streak, streak);
    SFX.good();
    bin.classList.add('hit');
    setTimeout(() => bin.classList.remove('hit'), 160);
    advance(img, toast, 0);
  } else {
    streak = 0;
    SFX.bad();
    bin.classList.add('miss');
    const correctLabel = (item.side === 'left' ? cat.left : cat.right).label;
    toast.innerHTML = `<b>${names[item.code]}</b> → ${correctLabel}`;
    toast.classList.add('show');
    locked = true;
    setTimeout(() => {
      bin.classList.remove('miss');
      toast.classList.remove('show');
      locked = false;
      advance(img, toast, 0);
    }, 900);
  }
  scorePill.textContent = score;
  streakLabel.textContent = streak >= 3 ? `🔥 ${streak} in a row` : '';
}

function advance(img, toast) {
  idx++;
  show(img);
}

function finish() {
  cancelAnimationFrame(raf);
  clearInterval(clock);
  document.onkeydown = null;
  if (score >= 20) SFX.fanfare();
  roundLabel.textContent = 'Time!';
  streakLabel.textContent = '';
  const attempted = idx;
  stage.innerHTML = '';
  showEndCard(stage, { score, max: attempted, bestKey: 'speed-sort', playAgain: start });
  const extra = el('div', 'msg',
    `${score} sorted right out of ${attempted}` +
    (best_streak >= 3 ? ` — best streak ${best_streak} 🔥` : ''));
  stage.querySelector('.end-card .msg')?.replaceWith(extra);
}
