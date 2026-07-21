/* Flag Families: sort flags into their design lineages.
   Untimed and three-way — each round picks 3 families, deals a mixed
   deck, and misses teach the family's origin story. Families never
   share a member, so every flag has exactly one right bin. */

const FAMILIES = [
  { id: 'nordic', name: 'Nordic cross', emoji: '✚',
    codes: ['dk', 'se', 'no', 'fi', 'is', 'fo', 'ax'],
    fact: 'The off-center cross spread from Denmark’s 800-year-old Dannebrog.' },
  { id: 'panafrican', name: 'Pan-African', emoji: '🌍',
    codes: ['gh', 'ml', 'gn', 'sn', 'cm', 'tg', 'bj', 'bf', 'cg', 'et', 'st', 'gw'],
    fact: 'Green, yellow and red spread from Ethiopia — the African country that was never colonized.' },
  { id: 'panarab', name: 'Pan-Arab', emoji: '🏜️',
    codes: ['jo', 'ps', 'kw', 'ae', 'sd', 'iq', 'ye', 'eg'],
    fact: 'Black, white, green and red come from the flag of the 1916 Arab Revolt.' },
  { id: 'panslavic', name: 'Pan-Slavic', emoji: '❄️',
    codes: ['ru', 'rs', 'sk', 'si', 'hr', 'cz', 'bg'],
    fact: 'White, blue and red spread across the Slavic world (Bulgaria swapped blue for green).' },
  { id: 'ensign', name: 'Union Jack family', emoji: '🇬🇧',
    codes: ['au', 'nz', 'fj', 'tv', 'ck', 'fk', 'ky', 'ms', 'sh', 'ai', 'tc', 'vg', 'bm', 'pn', 'gs', 'io', 'nu'],
    fact: 'A Union Jack in the corner marks Britain’s old maritime empire.' },
  { id: 'crescent', name: 'Star & crescent', emoji: '🌙',
    codes: ['tr', 'tn', 'dz', 'ly', 'mr', 'pk', 'az', 'km', 'tm'],
    fact: 'The star and crescent spread with the Ottoman Empire and beyond.' },
  { id: 'miranda', name: 'Miranda’s tricolor', emoji: '🦜',
    codes: ['co', 've', 'ec'],
    fact: 'Francisco de Miranda’s yellow-blue-red split into Colombia, Venezuela and Ecuador when Gran Colombia broke up.' },
  { id: 'centram', name: 'Central American blues', emoji: '🌋',
    codes: ['gt', 'hn', 'sv', 'ni', 'cr'],
    fact: 'Blue-white-blue survives from the old United Provinces of Central America (Costa Rica added red).' },
];

const PER_FAMILY = 4;
const stage = document.getElementById('stage');
const scorePill = document.getElementById('score-pill');
const roundLabel = document.getElementById('round-label');
const streakLabel = document.getElementById('streak-label');

let names, fams, deck, idx, score, streak, locked;

FLAG_NAMES.then((n) => { names = n; start(); });

function start() {
  fams = shuffle(FAMILIES).slice(0, 3);
  deck = shuffle(fams.flatMap((f) =>
    sample(f.codes, Math.min(PER_FAMILY, f.codes.length)).map((code) => ({ code, famId: f.id }))));
  idx = 0;
  score = 0;
  streak = 0;
  locked = false;
  render();
}

function render() {
  stage.innerHTML = '';

  const card = el('div', 'flag-stage fam-card');
  const img = new Image();
  img.alt = '';
  card.append(img, el('div', 'country', ''));
  stage.append(card);

  const bins = el('div', 'fam-bins');
  fams.forEach((f) => {
    const b = el('button', 'bin', `<span>${f.emoji}<br>${f.name}</span>`);
    b.onclick = () => sortInto(f, b, img);
    bins.append(b);
  });
  const toast = el('div', 'sort-toast', '');
  stage.append(bins, toast);

  show(img);
}

function show(img) {
  const item = deck[idx];
  img.src = flagSrc(item.code);
  img.parentElement.querySelector('.country').textContent = names[item.code];
  roundLabel.textContent = `Flag ${idx + 1} of ${deck.length}`;
  streakLabel.textContent = streak >= 3 ? `🔥 ${streak} in a row` : '';
  scorePill.textContent = score;
}

function sortInto(fam, bin, img) {
  if (locked) return;
  const item = deck[idx];
  const right = fam.id === item.famId;
  const toast = stage.querySelector('.sort-toast');

  if (right) {
    score++;
    streak++;
    SFX.good();
    bin.classList.add('hit');
    setTimeout(() => bin.classList.remove('hit'), 160);
    advance(img);
  } else {
    streak = 0;
    SFX.bad();
    bin.classList.add('miss');
    const correct = fams.find((f) => f.id === item.famId);
    toast.innerHTML = `<b>${names[item.code]}</b> → ${correct.emoji} ${correct.name}. ${correct.fact}`;
    toast.classList.add('show');
    locked = true;
    setTimeout(() => {
      bin.classList.remove('miss');
      toast.classList.remove('show');
      locked = false;
      advance(img);
    }, 1600);
  }
}

function advance(img) {
  idx++;
  if (idx >= deck.length) {
    roundLabel.textContent = 'Round over!';
    streakLabel.textContent = '';
    if (score === deck.length) SFX.fanfare();
    showEndCard(stage, { score, max: deck.length, bestKey: 'flag-families', playAgain: start });
    return;
  }
  show(img);
}
