/* Time Machine: flags that no longer fly.
   Two questions per flag — whose was it, and when did it stop flying?
   `wrongs` are hand-picked plausible decoys, not random ones. */

const HISTORY = [
  { file: 'ussr', name: 'Soviet Union', until: 1991,
    wrongs: ['Russia', 'Yugoslavia', 'China'],
    fact: 'Lowered over the Kremlin for the last time on 25 December 1991.' },
  { file: 'ddr', name: 'East Germany', until: 1990,
    wrongs: ['West Germany', 'Soviet Union', 'Poland'],
    fact: 'Germany’s colors plus a hammer and compass — gone when Germany reunified.' },
  { file: 'czechoslovakia', name: 'Czechoslovakia', until: 1992,
    wrongs: ['Czechia', 'Slovakia', 'Slovenia'],
    fact: 'When the country split, Czechia kept the flag — even though the split agreement said neither side could!' },
  { file: 'yugoslavia', name: 'Yugoslavia', until: 1992,
    wrongs: ['Serbia', 'Croatia', 'Russia'],
    fact: 'One flag, six republics — it broke apart into seven countries with seven flags.' },
  { file: 'za1928', name: 'South Africa', until: 1994,
    wrongs: ['Rhodesia', 'Namibia', 'Netherlands'],
    fact: 'Three little flags INSIDE a flag. Replaced by the rainbow flag when apartheid ended.' },
  { file: 'rhodesia', name: 'Rhodesia', until: 1979,
    wrongs: ['Zimbabwe', 'Zambia', 'South Africa'],
    fact: 'Green-white-green with the Zimbabwe Bird — the country became Zimbabwe in 1980.' },
  { file: 'zaire', name: 'Zaire', until: 1997,
    wrongs: ['Cameroon', 'Republic of the Congo', 'Togo'],
    fact: 'An arm holding a flaming torch! Zaire went back to being the Democratic Republic of the Congo.' },
  { file: 'canada-ensign', name: 'Canada', until: 1965,
    wrongs: ['Australia', 'New Zealand', 'Bermuda'],
    fact: 'The Red Ensign lost to the maple leaf after the Great Flag Debate of 1964.' },
  { file: 'ottoman', name: 'Ottoman Empire', until: 1922,
    wrongs: ['Kingdom of Egypt', 'Tunisia', 'Persia'],
    fact: 'The empire ended, but Türkiye kept the star and crescent.' },
  { file: 'libya1977', name: 'Libya', until: 2011,
    wrongs: ['Saudi Arabia', 'Pakistan', 'Mauritania'],
    fact: 'The only plain one-color national flag in history. No design at all!' },
  { file: 'myanmar1974', name: 'Myanmar (Burma)', until: 2010,
    wrongs: ['Laos', 'Cambodia', 'Vietnam'],
    fact: 'The gear and rice plant were swapped for big yellow-green-red stripes in 2010.' },
  { file: 'malawi2010', name: 'Malawi', until: 2012,
    wrongs: ['Zambia', 'Zimbabwe', 'Kenya'],
    fact: 'Malawi changed its rising sun to a full sun in 2010… then changed it back in 2012.' },
  { file: 'georgia1990', name: 'Georgia', until: 2004,
    wrongs: ['Armenia', 'Belarus', 'Latvia'],
    fact: 'The wine-red flag gave way to the five-cross flag after the Rose Revolution.' },
  { file: 'lesotho1987', name: 'Lesotho', until: 2006,
    wrongs: ['Eswatini', 'Botswana', 'Kenya'],
    fact: 'The shield and spears retired on Lesotho’s 40th birthday — the mokorotlo hat took over.' },
  { file: 'south-yemen', name: 'South Yemen', until: 1990,
    wrongs: ['Yemen', 'Oman', 'Sudan'],
    fact: 'North and South Yemen merged in 1990 and dropped the blue triangle.' },
  { file: 'uar', name: 'United Arab Republic', until: 1971,
    wrongs: ['Iraq', 'Jordan', 'Sudan'],
    fact: 'Egypt and Syria merged into ONE country in 1958 — the two stars were the two of them.' },
  { file: 'laos-kingdom', name: 'Kingdom of Laos', until: 1975,
    wrongs: ['Thailand', 'Cambodia', 'Vietnam'],
    fact: 'Three elephants for the “Land of a Million Elephants”.' },
  { file: 'upper-volta', name: 'Upper Volta', until: 1984,
    wrongs: ['Burkina Faso', 'Dahomey', 'Mali'],
    fact: 'The stripes were its three rivers: the Black, White and Red Volta. It’s Burkina Faso now.' },
  { file: 'hk-colonial', name: 'Hong Kong', until: 1997,
    wrongs: ['Singapore', 'Macau', 'Fiji'],
    fact: 'The blue ensign came down at midnight on 30 June 1997 — the bauhinia flower went up.' },
  { file: 'mauritania-old', name: 'Mauritania', until: 2017,
    wrongs: ['Pakistan', 'Comoros', 'Algeria'],
    fact: 'You know this one — the red stripes arrived in 2017, and Jamaica became the only red-white-and-blue-free flag.' },
  { file: 'tanganyika', name: 'Tanganyika', until: 1964,
    wrongs: ['Tanzania', 'Kenya', 'Uganda'],
    fact: 'Tanganyika + Zanzibar = TAN-ZAN-ia. The merged flag mixed both.' },
  { file: 'sikkim', name: 'Kingdom of Sikkim', until: 1975,
    wrongs: ['Bhutan', 'Tibet', 'Nepal'],
    fact: 'A Himalayan kingdom with a Buddhist wheel on its flag — it joined India in 1975.' },
  { file: 'venezuela7', name: 'Venezuela', until: 2006,
    wrongs: ['Colombia', 'Ecuador', 'Bolivia'],
    fact: 'Count the stars — seven! An eighth star was added in 2006.' },
  { file: 'ethiopia-imperial', name: 'Ethiopia', until: 1974,
    wrongs: ['Ghana', 'Senegal', 'Cameroon'],
    fact: 'The Lion of Judah left the flag when Emperor Haile Selassie was overthrown.' },
];

const ROUNDS = 8;
const stage = document.getElementById('stage');
const scorePill = document.getElementById('score-pill');
const roundLabel = document.getElementById('round-label');

let deck, round, score;

FLAG_NAMES.then(() => start());

function histSrc(file) {
  return `${ROOT}/assets/history/${file}.svg`;
}

function start() {
  deck = shuffle(HISTORY).slice(0, ROUNDS);
  round = 0;
  score = 0;
  next();
}

function yearDecoys(real) {
  const out = new Set();
  while (out.size < 3) {
    const sign = Math.random() < 0.5 ? -1 : 1;
    const y = real + sign * (3 + Math.floor(Math.random() * 15));
    if (y !== real && y <= 2020) out.add(y);
  }
  return [...out];
}

function next() {
  if (round >= deck.length) {
    roundLabel.textContent = 'Round over!';
    showEndCard(stage, { score, max: ROUNDS * 2, bestKey: 'time-machine', playAgain: start });
    return;
  }

  const item = deck[round];
  roundLabel.textContent = `Flag ${round + 1} of ${deck.length}`;
  scorePill.textContent = score;
  stage.innerHTML = '';

  const card = el('div', 'flag-stage');
  card.append(el('div', 'country', 'This flag no longer flies…'));
  const img = new Image();
  img.src = histSrc(item.file);
  img.alt = '';
  card.append(img);
  stage.append(card);

  askWho(item, card);
  round++;
}

function askWho(item, card) {
  const prompt = el('div', 'prompt', 'Whose flag was this?');
  const grid = el('div', 'choices text-only quiz');
  const options = shuffle([item.name, ...item.wrongs]);
  const buttons = [];
  options.forEach((name) => {
    const b = el('button', 'choice', name);
    b.onclick = () => {
      buttons.forEach((x) => (x.disabled = true));
      const right = name === item.name;
      if (right) { score++; b.classList.add('correct', 'pop'); SFX.good(); }
      else {
        SFX.bad();
        b.classList.add('wrong');
        buttons.find((x) => x.textContent === item.name).classList.add('correct');
      }
      scorePill.textContent = score;
      card.querySelector('.country').textContent = item.name;
      setTimeout(() => askWhen(item, prompt, grid), 900);
    };
    buttons.push(b);
    grid.append(b);
  });
  stage.append(prompt, grid);
}

function askWhen(item, prompt, grid) {
  prompt.textContent = 'When did it stop flying?';
  grid.innerHTML = '';
  const options = shuffle([item.until, ...yearDecoys(item.until)]);
  const buttons = [];
  options.forEach((year) => {
    const b = el('button', 'choice', String(year));
    b.onclick = () => {
      buttons.forEach((x) => (x.disabled = true));
      const right = year === item.until;
      if (right) { score++; b.classList.add('correct', 'pop'); SFX.good(); }
      else {
        SFX.bad();
        b.classList.add('wrong');
        buttons.find((x) => x.textContent === String(item.until)).classList.add('correct');
      }
      scorePill.textContent = score;

      stage.append(el('div', 'fact' + (right ? '' : ' bad'),
        `${right ? '✅' : '❌'} <b>${item.until}.</b> ${item.fact}`));
      const btn = el('button', 'big-btn', round < deck.length ? 'Next flag' : 'See my score');
      btn.onclick = next;
      stage.append(btn);
      btn.scrollIntoView({ behavior: 'smooth', block: 'end' });
    };
    buttons.push(b);
    grid.append(b);
  });
}
