/* Shared helpers. Every page defines ROOT ('.' for the launcher,
   '../..' for a game page) before including this file. */

const FLAG_NAMES = fetch(`${ROOT}/data/flags.json`).then((r) => r.json());

function flagSrc(code) {
  return `${ROOT}/assets/flags/${code}.svg`;
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sample(arr, n, excludeSet) {
  const pool = excludeSet ? arr.filter((x) => !excludeSet.has(x)) : arr;
  return shuffle(pool).slice(0, n);
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function el(tag, cls, html) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (html !== undefined) node.innerHTML = html;
  return node;
}

function getBest(key) {
  return Number(localStorage.getItem(`best:${key}`) || 0);
}

function setBest(key, score) {
  if (score > getBest(key)) {
    localStorage.setItem(`best:${key}`, String(score));
    return true; // new record
  }
  return false;
}

/* Landscape lock: the manifest locks installed PWAs; in a browser tab we
   can only ask nicely, so a CSS-driven overlay covers portrait mode. */
const rotateOverlay = el('div', 'rotate-overlay');
rotateOverlay.innerHTML = '<span class="spin">📱</span>Turn your phone sideways!';
document.body.append(rotateOverlay);
if (screen.orientation && screen.orientation.lock) {
  screen.orientation.lock('landscape').catch(() => {});
}

/* Standard end-of-round card. */
function showEndCard(container, { score, max, bestKey, playAgain }) {
  const record = setBest(bestKey, score);
  const frac = max ? score / max : 0;
  const face = frac >= 0.9 ? '🏆' : frac >= 0.6 ? '🎉' : frac >= 0.3 ? '💪' : '🧐';
  const msg =
    frac >= 0.9 ? 'Flag master!' :
    frac >= 0.6 ? 'Really good!' :
    frac >= 0.3 ? 'Getting there!' : 'Tough round — go again!';
  container.innerHTML = '';
  const card = el('div', 'end-card');
  card.append(
    el('div', 'big', face),
    el('div', 'big', `${score}${max ? ' / ' + max : ''}`),
    el('div', 'msg', msg),
  );
  if (record) card.append(el('div', 'record', '⭐ New best score!'));
  else card.append(el('div', 'msg', `Best so far: ${getBest(bestKey)}`));
  const btn = el('button', 'big-btn', 'Play again');
  btn.onclick = playAgain;
  card.append(btn);
  container.append(card);
}
