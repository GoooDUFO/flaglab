const ROUNDS = 10;
const stage = document.getElementById('stage');
const scorePill = document.getElementById('score-pill');
const roundLabel = document.getElementById('round-label');
const streakLabel = document.getElementById('streak-label');

let names, deck, round, score, streak;

FLAG_NAMES.then((n) => {
  names = n;
  start();
});

function start() {
  deck = shuffle(QUESTIONS).slice(0, ROUNDS);
  round = 0;
  score = 0;
  streak = 0;
  next();
}

function next() {
  if (round >= deck.length) {
    roundLabel.textContent = 'Round over!';
    streakLabel.textContent = '';
    showEndCard(stage, {
      score,
      max: ROUNDS,
      bestKey: 'odd-one-out',
      playAgain: start,
    });
    return;
  }

  const item = deck[round];
  roundLabel.textContent = `Question ${round + 1} of ${deck.length}`;
  streakLabel.textContent = streak >= 2 ? `🔥 ${streak} in a row` : '';
  scorePill.textContent = score;
  stage.innerHTML = '';

  stage.append(el('div', 'prompt', item.q));

  const textOnly = item.o.every((o) => o.t);
  const grid = el('div', 'choices' + (textOnly ? ' text-only' : ''));
  const buttons = [];

  item.o.forEach((opt, i) => {
    const btn = el('button', 'choice');
    if (opt.f) {
      const img = new Image();
      img.src = flagSrc(opt.f);
      img.alt = '';
      btn.append(img, el('span', '', names[opt.f] || opt.f));
    } else {
      btn.append(el('span', '', opt.t));
    }
    btn.onclick = () => answer(i, item, buttons);
    buttons.push(btn);
    grid.append(btn);
  });

  stage.append(grid);
  round++;
}

function answer(i, item, buttons) {
  buttons.forEach((b) => (b.disabled = true));
  buttons[item.a].classList.add('correct');
  const right = i === item.a;
  if (right) {
    score++;
    streak++;
    buttons[i].classList.add('pop');
    SFX.good();
  } else {
    streak = 0;
    buttons[i].classList.add('wrong');
    SFX.bad();
  }
  scorePill.textContent = score;

  const fact = el('div', 'fact' + (right ? '' : ' bad'),
    (right ? '✅ ' : '❌ ') + item.fact);
  stage.append(fact);

  const btn = el('button', 'big-btn', round < deck.length ? 'Next question' : 'See my score');
  btn.onclick = next;
  stage.append(btn);
  btn.scrollIntoView({ behavior: 'smooth', block: 'end' });
}
