/* Question format:
   q      — the prompt
   o      — 4 options; {f:'code'} shows flag + name, {t:'text'} shows text only
   a      — index of the correct option
   fact   — shown after answering
   Add questions freely; the game samples 10 per round. */
const QUESTIONS = [
  {
    q: 'Which of these is NOT a British Overseas Territory?',
    o: [{ f: 'ms' }, { f: 'ai' }, { f: 'gl' }, { f: 'pn' }],
    a: 2,
    fact: '<b>Greenland</b> belongs to the Kingdom of Denmark. Montserrat, Anguilla and Pitcairn all fly British blue ensigns.',
  },
  {
    q: 'Which of these is NOT a French overseas territory?',
    o: [{ f: 'wf' }, { f: 'aw' }, { f: 'nc' }, { f: 'pm' }],
    a: 1,
    fact: '<b>Aruba</b> is a country of the Kingdom of the Netherlands. Wallis and Futuna, New Caledonia and Saint Pierre and Miquelon are all French.',
  },
  {
    q: 'Which of these is NOT a Crown Dependency?',
    o: [{ f: 'je' }, { f: 'gg' }, { f: 'im' }, { f: 'gi' }],
    a: 3,
    fact: '<b>Gibraltar</b> is a British Overseas Territory. Jersey, Guernsey and the Isle of Man are Crown Dependencies — not part of the UK at all!',
  },
  {
    q: 'Which of these flags has NO Union Jack on it?',
    o: [{ f: 'fj' }, { f: 'tv' }, { f: 'to' }, { f: 'ck' }],
    a: 2,
    fact: '<b>Tonga</b> was never colonized, so its flag has a red couped cross instead — and its constitution says the flag may never be changed.',
  },
  {
    q: 'Which of these does NOT have a Nordic cross on its flag?',
    o: [{ f: 'is' }, { f: 'fo' }, { f: 'gl' }, { f: 'ax' }],
    a: 2,
    fact: '<b>Greenland</b> is the only Nordic country or territory without a cross flag — its red-and-white circle represents the sun over the ice.',
  },
  {
    q: 'Which of these countries is NOT landlocked?',
    o: [{ f: 'bo' }, { f: 'uy' }, { f: 'py' }, { f: 'mn' }],
    a: 1,
    fact: '<b>Uruguay</b> has a long Atlantic coast. Bolivia even keeps a navy on Lake Titicaca, hoping to win its coastline back one day.',
  },
  {
    q: 'Which of these flags does NOT show the Southern Cross?',
    o: [{ f: 'au' }, { f: 'nz' }, { f: 'ws' }, { f: 'fj' }],
    a: 3,
    fact: '<b>Fiji</b> shows its coat of arms instead. Australia, New Zealand and Samoa all display the Southern Cross constellation.',
  },
  {
    q: 'Which of these flags does NOT use the Pan-African colors?',
    o: [{ f: 'gh' }, { f: 'sn' }, { f: 'ga' }, { f: 'cm' }],
    a: 2,
    fact: '<b>Gabon</b> uses green, yellow and BLUE — the blue is for the sea. The others use the Pan-African red, yellow and green.',
  },
  {
    q: 'Which of these flags does NOT use the Pan-Arab colors?',
    o: [{ f: 'jo' }, { f: 'kw' }, { f: 'qa' }, { f: 'ps' }],
    a: 2,
    fact: '<b>Qatar</b> is maroon and white. The maroon comes from a local purple dye that darkened in the sun!',
  },
  {
    q: 'Which of these flags is perfectly SQUARE?',
    o: [{ f: 'ch' }, { f: 'pl' }, { f: 'jp' }, { f: 'be' }],
    a: 0,
    fact: '<b>Switzerland</b> and Vatican City are the only two square national flags in the world.',
  },
  {
    q: 'Which country has the only national flag that is NOT a rectangle (or square)?',
    o: [{ f: 'np' }, { f: 'bt' }, { f: 'lk' }, { f: 'mn' }],
    a: 0,
    fact: '<b>Nepal</b>’s double pennant is the only non-quadrilateral national flag. Its constitution includes the exact geometry recipe for drawing it.',
  },
  {
    q: 'Which is the only national flag with NO red, white, or blue at all?',
    o: [{ f: 'mu' }, { f: 'jm' }, { f: 'za' }, { f: 'cf' }],
    a: 1,
    fact: '<b>Jamaica</b> — black, green and gold only. It became the only one in 2017, when Mauritania added red stripes to its flag.',
  },
  {
    q: 'Which of these flags has writing on it?',
    o: [{ f: 'tr' }, { f: 'sa' }, { f: 'jp' }, { f: 'so' }],
    a: 1,
    fact: '<b>Saudi Arabia</b>’s flag carries the shahada. Because of the sacred writing, the flag is never flown at half-mast.',
  },
  {
    q: 'Which flag famously features an AK-47 rifle?',
    o: [{ f: 'ao' }, { f: 'mz' }, { f: 'ke' }, { f: 'sz' }],
    a: 1,
    fact: '<b>Mozambique</b> — the only national flag with a modern rifle, crossed with a hoe over an open book.',
  },
  {
    q: 'Which territory’s coat of arms on its flag features a RAM?',
    o: [{ f: 'gs' }, { f: 'sh' }, { f: 'fk' }, { f: 'ms' }],
    a: 2,
    fact: 'The <b>Falkland Islands</b> arms show a ram (sheep farming!) above the ship “Desire”, which sighted the islands in 1592.',
  },
  {
    q: 'Which territory’s flag is covered in wavy blue-and-white stripes?',
    o: [{ f: 'io' }, { f: 'ky' }, { f: 'ms' }, { f: 'ai' }],
    a: 0,
    fact: 'The <b>British Indian Ocean Territory</b> — wavy stripes for the ocean, a palm tree, and a crown. One of the rarest flags to see flying anywhere.',
  },
  {
    q: 'Which flag shows a bird of paradise?',
    o: [{ f: 'pg' }, { f: 'vu' }, { f: 'sb' }, { f: 'fj' }],
    a: 0,
    fact: '<b>Papua New Guinea</b>’s raggiana bird of paradise was drawn by 15-year-old schoolgirl Susan Karike, who won a national design competition in 1971.',
  },
  {
    q: 'Which flag shows a frigatebird flying over a rising sun?',
    o: [{ f: 'nr' }, { f: 'tv' }, { f: 'ki' }, { f: 'mh' }],
    a: 2,
    fact: '<b>Kiribati</b> — the wavy bands below stand for the Pacific, and the 17 sun rays are its islands.',
  },
  {
    q: 'Which of these is NOT a member of the United Nations?',
    o: [{ f: 'sm' }, { f: 'li' }, { f: 'va' }, { f: 'mc' }],
    a: 2,
    fact: '<b>Vatican City</b> is only a permanent observer. San Marino, Liechtenstein and Monaco are all full UN members.',
  },
  {
    q: 'Niue is in free association with which country?',
    o: [{ t: 'New Zealand' }, { t: 'Australia' }, { t: 'United Kingdom' }, { t: 'France' }],
    a: 0,
    fact: '<b>New Zealand</b> — like the Cook Islands. That’s why Niue’s flag has a Union Jack canton with four stars, plus one big star for Niue itself.',
  },
  {
    q: 'Which country’s flag is nearly IDENTICAL to Chad’s?',
    o: [{ f: 'ro' }, { f: 'ad' }, { f: 'md' }, { f: 'be' }],
    a: 0,
    fact: '<b>Romania</b> — the only difference is a slightly darker blue on Chad’s. Chad even complained to the UN about it in 2004.',
  },
  {
    q: 'Which flag is essentially identical to Indonesia’s?',
    o: [{ f: 'sg' }, { f: 'mc' }, { f: 'pl' }, { f: 'mt' }],
    a: 1,
    fact: '<b>Monaco</b> — same red over white; only the proportions differ. Poland is the same flag upside down!',
  },
  {
    q: 'The Netherlands’ flag differs from which country’s mainly by its shade of blue?',
    o: [{ f: 'lu' }, { f: 'ru' }, { f: 'fr' }, { f: 'hr' }],
    a: 0,
    fact: '<b>Luxembourg</b> uses a lighter sky blue and a longer shape. The two countries never agreed to change either one.',
  },
  {
    q: 'Which country added red stripes to its flag in 2017?',
    o: [{ f: 'ml' }, { f: 'mr' }, { f: 'ne' }, { f: 'sn' }],
    a: 1,
    fact: '<b>Mauritania</b> added a red stripe at the top and bottom to honor those who fought for independence.',
  },
  {
    q: 'Which of these is NOT in the Pacific Ocean?',
    o: [{ f: 'tk' }, { f: 'nu' }, { f: 'ta' }, { f: 'tv' }],
    a: 2,
    fact: '<b>Tristan da Cunha</b> is in the South Atlantic — the most remote inhabited island group on Earth, 2,400 km from its nearest neighbor, Saint Helena.',
  },
  {
    q: 'Which of these is NOT in the Caribbean?',
    o: [{ f: 'ms' }, { f: 'cw' }, { f: 'pm' }, { f: 'ai' }],
    a: 2,
    fact: '<b>Saint Pierre and Miquelon</b> sits in the cold North Atlantic, just 25 km off Canada — the last piece of New France.',
  },
  {
    q: 'The hoist of Saint Pierre and Miquelon’s unofficial flag shows three regional flags. Which three?',
    o: [
      { t: 'Basque Country, Brittany, Normandy' },
      { t: 'Corsica, Provence, Brittany' },
      { t: 'Normandy, Picardy, Alsace' },
      { t: 'Basque Country, Catalonia, Galicia' },
    ],
    a: 0,
    fact: 'They honor the <b>Basque, Breton and Norman</b> settlers — and the golden ship is Jacques Cartier’s, arriving in 1536.',
  },
  {
    q: 'Which flag shows a map of the country in copper color?',
    o: [{ f: 'cy' }, { f: 'xk' }, { f: 'mt' }, { f: 'lb' }],
    a: 0,
    fact: '<b>Cyprus</b> — the island’s name may come from the word for copper, which was mined there for thousands of years. Kosovo’s map is gold.',
  },
  {
    q: 'On Nauru’s flag, what does the yellow horizontal line represent?',
    o: [{ t: 'The Equator' }, { t: 'The International Date Line' }, { t: 'The horizon at sunset' }, { t: 'A phosphate seam' }],
    a: 0,
    fact: 'The <b>Equator</b> — and the 12-pointed star sits just below it, exactly where Nauru is on the map.',
  },
  {
    q: 'Which territory’s flag features the golden bosun bird?',
    o: [{ f: 'cx' }, { f: 'cc' }, { f: 'nf' }, { f: 'nu' }],
    a: 0,
    fact: '<b>Christmas Island</b> — the golden bosun (a tropicbird) lives almost nowhere else on Earth.',
  },
  {
    q: 'Which territory’s flag looks like Canada’s layout — but with a pine tree?',
    o: [{ f: 'nf' }, { f: 'cx' }, { f: 'pn' }, { f: 'tk' }],
    a: 0,
    fact: '<b>Norfolk Island</b> — green-white-green with the Norfolk Island pine, which grows over 50 m tall.',
  },
  {
    q: 'Which unrecognized state still uses a Soviet-style hammer and sickle on its flag?',
    o: [{ t: 'Transnistria' }, { t: 'Abkhazia' }, { t: 'South Ossetia' }, { t: 'Somaliland' }],
    a: 0,
    fact: '<b>Transnistria</b>, a breakaway strip of Moldova — the last flag in Europe with the hammer and sickle.',
  },
  {
    q: 'Which country flies the oldest continuously used national flag?',
    o: [{ f: 'dk' }, { f: 'at' }, { f: 'nl' }, { f: 'gb' }],
    a: 0,
    fact: '<b>Denmark</b>’s Dannebrog — legend says it fell from the sky during a battle in Estonia in 1219.',
  },
  {
    q: 'Which country’s flag has a DIFFERENT design on its front and back?',
    o: [{ f: 'py' }, { f: 'cl' }, { f: 'pe' }, { f: 'bo' }],
    a: 0,
    fact: '<b>Paraguay</b> — the state seal on the front, the treasury seal (a lion and liberty cap) on the back. The only national flag like it.',
  },
  {
    q: 'Guernsey’s flag adds what on top of the St George’s cross?',
    o: [{ t: 'A gold Norman cross' }, { t: 'A red lion' }, { t: 'Three leopards' }, { t: 'A green island' }],
    a: 0,
    fact: 'A <b>gold Norman cross</b> — added in 1985 so Guernsey would stop being confused with England at sporting events.',
  },
  {
    q: 'Which country’s flag is a black double-headed eagle on red?',
    o: [{ f: 'al' }, { f: 'me' }, { f: 'rs' }, { f: 'ru' }],
    a: 0,
    fact: '<b>Albania</b> — from the seal of national hero Skanderbeg. Montenegro’s double eagle is golden.',
  },
];
