/* Frankenflag: a flag stitched together from 2–3 real flags.
   Spot every donor. The pool only holds flags with distinctive
   patterns in every region, so each slice is identifiable. */

const POOL = [
  // ensign family & Pacific
  'gb','us','au','nz','fj','ck','tv','ki','fk','ky','vg','ms','sh','gs','pn',
  'ai','tc','bm','io','ws','to','pg','sb','vu','nr','mh','fm','pw','tk','nu',
  // Americas
  'ca','br','ar','uy','mx','cu','jm','bb','tt','gd','lc','vc','kn','dm','gy',
  'pa','do','ht','bz','ve',
  // Europe & Middle East
  'mk','al','me','tr','gr','cy','il','jo','lb','pt','es','ch','va','mt','md',
  // Africa
  'za','eg','ma','ke','ug','tz','mz','zw','sz','ls','bw','gh','cm','et','st',
  'gq','er','dj','so','sc','mu','mw','cv','ss','ao',
  // Asia
  'kr','jp','cn','tw','vn','kh','la','lk','bt','in','my','sg','ph','bn','pk',
  'kz','tm','uz','kg','mn','ir',
];

const SPLITS = [
  { k: 2, clips: ['polygon(0 0, 50% 0, 50% 100%, 0 100%)', 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)'] },
  { k: 2, clips: ['polygon(0 0, 100% 0, 100% 50%, 0 50%)', 'polygon(0 50%, 100% 50%, 100% 100%, 0 100%)'] },
  { k: 2, clips: ['polygon(0 0, 100% 0, 0 100%)', 'polygon(100% 0, 100% 100%, 0 100%)'] },
  { k: 3, clips: ['polygon(0 0, 33.4% 0, 33.4% 100%, 0 100%)', 'polygon(33.3% 0, 66.7% 0, 66.7% 100%, 33.3% 100%)', 'polygon(66.6% 0, 100% 0, 100% 100%, 66.6% 100%)'] },
  { k: 3, clips: ['polygon(0 0, 100% 0, 100% 33.4%, 0 33.4%)', 'polygon(0 33.3%, 100% 33.3%, 100% 66.7%, 0 66.7%)', 'polygon(0 66.6%, 100% 66.6%, 100% 100%, 0 100%)'] },
];

const ROUNDS = 6;
const OPTIONS = 6;
const stage = document.getElementById('stage');
const scorePill = document.getElementById('score-pill');
const roundLabel = document.getElementById('round-label');
const hintLabel = document.getElementById('hint-label');

let names, round, score, maxScore;

FLAG_NAMES.then((n) => { names = n; start(); });

function start() {
  round = 0;
  score = 0;
  maxScore = 0;
  next();
}

function next() {
  if (round >= ROUNDS) {
    roundLabel.textContent = 'Round over!';
    hintLabel.textContent = '';
    showEndCard(stage, { score, max: maxScore, bestKey: 'flag-mashup', playAgain: start });
    return;
  }

  const split = pick(SPLITS);
  const codes = sample(POOL, OPTIONS);
  const donors = codes.slice(0, split.k);
  const shown = shuffle(donors);
  maxScore += split.k;

  roundLabel.textContent = `Mashup ${round + 1} of ${ROUNDS}`;
  hintLabel.textContent = `Find the ${split.k} flags stitched into this monster`;
  scorePill.textContent = score;
  round++;
  stage.innerHTML = '';

  const box = el('div', 'mash-box');
  shown.forEach((code, i) => {
    const img = new Image();
    img.src = flagSrc(code);
    img.alt = '';
    img.style.clipPath = split.clips[i];
    box.append(img);
  });
  stage.append(box);

  const picked = new Set();
  const grid = el('div', 'choices text-only mash-choices');
  const lock = el('button', 'big-btn', `Pick ${split.k} flags`);
  lock.disabled = true;

  shuffle(codes).forEach((code) => {
    const b = el('button', 'choice', names[code]);
    b.dataset.code = code;
    b.onclick = () => {
      if (picked.has(code)) picked.delete(code);
      else if (picked.size < split.k) picked.add(code);
      b.classList.toggle('picked', picked.has(code));
      lock.disabled = picked.size !== split.k;
      lock.textContent = picked.size === split.k
        ? '🧬 Lock it in!'
        : `Pick ${split.k - picked.size} more`;
    };
    grid.append(b);
  });

  lock.onclick = () => grade(donors, picked, grid, lock);
  stage.append(grid, lock);
}

function grade(donors, picked, grid, lock) {
  const donorSet = new Set(donors);
  let hits = 0;
  for (const b of grid.children) {
    b.disabled = true;
    const code = b.dataset.code;
    if (donorSet.has(code)) {
      b.classList.add(picked.has(code) ? 'correct' : 'missed');
      if (picked.has(code)) hits++;
    } else if (picked.has(code)) {
      b.classList.add('wrong');
    }
  }
  score += hits;
  scorePill.textContent = score;
  if (hits === donors.length) SFX.good(); else SFX.bad();

  // reveal the donors with their real flags
  const reveal = el('div', 'mash-reveal');
  donors.forEach((code) => {
    const cell = el('div', 'mash-donor');
    const img = new Image();
    img.src = flagSrc(code);
    img.alt = '';
    cell.append(img, el('span', '', names[code]));
    reveal.append(cell);
  });
  lock.replaceWith(reveal);

  const msg = hits === donors.length
    ? '✅ <b>All donors found!</b>'
    : `${hits ? '👍' : '❌'} You caught ${hits} of ${donors.length}.`;
  stage.append(el('div', 'fact' + (hits === donors.length ? '' : ' bad'), msg));

  const btn = el('button', 'big-btn', round < ROUNDS ? 'Next monster' : 'See my score');
  btn.onclick = next;
  stage.append(btn);
  btn.scrollIntoView({ behavior: 'smooth', block: 'end' });
}
