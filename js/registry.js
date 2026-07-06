/* To add a new game: create games/<id>/index.html and add one entry here. */
const GAMES = [
  {
    id: 'odd-one-out',
    emoji: '🕵️',
    title: 'Odd One Out',
    blurb: 'Deep flag lore — which one doesn’t belong?',
    color: 'var(--red)',
    bestKey: 'odd-one-out',
    bestLabel: (b) => `Best: ${b} / 10`,
  },
  {
    id: 'faked-flags',
    emoji: '🚨',
    title: 'Fake Flag Detector',
    blurb: 'Real flag… or sneakily doctored?',
    color: 'var(--teal)',
    bestKey: 'faked-flags',
    bestLabel: (b) => `Best: ${b} / 10`,
  },
  {
    id: 'zoomed-in',
    emoji: '🔬',
    title: 'Way Too Close',
    blurb: 'Name the flag from a tiny detail — buzz in early!',
    color: 'var(--yellow)',
    bestKey: 'zoomed-in',
    bestLabel: (b) => `Best: ${b} pts`,
  },
];
