/* Tiny Web Audio chiptune engine + sound effects. No audio files —
   everything is synthesized, so offline stays free.
   Each page gets a mood from its <body> class. Audio starts on the
   first tap (autoplay rules); the 🔊 header button toggles and persists. */

const AudioKit = (() => {
  const MOODS = {
    default:   { bpm: 124, root: 45, prog: [0, 8, 3, 10] },
    'g-odd':   { bpm: 112, root: 43, prog: [0, 5, 8, 10] },
    'g-fake':  { bpm: 118, root: 41, prog: [0, 3, 8, 7] },
    'g-zoom':  { bpm: 120, root: 45, prog: [0, 10, 8, 5] },
    'g-forge': { bpm: 100, root: 48, prog: [0, 5, 3, 10] },
    'g-time':  { bpm: 92,  root: 40, prog: [0, 3, 5, 7] },
    'g-sort':  { bpm: 132, root: 45, prog: [0, 8, 10, 3] },
    'g-mash':  { bpm: 116, root: 46, prog: [0, 5, 10, 8] },
    'g-ratio': { bpm: 108, root: 47, prog: [0, 10, 5, 3] },
    'g-fam':   { bpm: 114, root: 44, prog: [0, 3, 10, 5] },
  };
  const PENT = [0, 3, 5, 7, 10]; // minor pentatonic
  const ARP = [0, 2, 4, 2, 1, 3, 4, 3, 0, 2, 4, 2, 3, 4, 2, 1];

  const moodKey = Object.keys(MOODS).find((k) => document.body.classList.contains(k));
  const cfg = MOODS[moodKey || 'default'];

  let ctx, master, noiseBuf, timer, step, nextTime;
  let muted = localStorage.getItem('flaglab:muted') === '1';

  const freq = (m) => 440 * Math.pow(2, (m - 69) / 12);

  function ensureCtx() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    document.addEventListener('visibilitychange', () => {
      if (!ctx) return;
      if (document.hidden) ctx.suspend();
      else if (!muted) ctx.resume();
    });
  }

  function tone(t, midi, { type = 'triangle', gain = 0.2, dur = 0.2, cutoff = 0 } = {}) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq(midi);
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    let node = o;
    if (cutoff) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = cutoff;
      o.connect(f);
      node = f;
    }
    node.connect(g);
    g.connect(master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  function noise(t, { gain = 0.1, dur = 0.05, filterType = 'highpass', filterFreq = 6000 } = {}) {
    const s = ctx.createBufferSource();
    s.buffer = noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = filterType;
    f.frequency.value = filterFreq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(master);
    s.start(t);
    s.stop(t + dur + 0.02);
  }

  function kick(t) {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.45, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    o.connect(g); g.connect(master);
    o.start(t);
    o.stop(t + 0.25);
  }

  function scheduleStep(s, t) {
    const bar = Math.floor(s / 16) % 4;
    const beat = s % 16;
    const chord = cfg.prog[bar];
    if (beat % 4 === 0) kick(t);
    if (beat % 8 === 4) noise(t, { gain: 0.14, dur: 0.1, filterType: 'bandpass', filterFreq: 1800 });
    if (beat % 2 === 1) noise(t, { gain: 0.05, dur: 0.03 });
    if (beat % 4 === 0) tone(t, cfg.root + chord, { type: 'triangle', gain: 0.22, dur: 0.3 });
    tone(t, cfg.root + 12 + chord + PENT[ARP[beat]], { type: 'square', gain: 0.045, dur: 0.12, cutoff: 1400 });
  }

  function tick() {
    const stepDur = 60 / cfg.bpm / 4;
    while (nextTime < ctx.currentTime + 0.25) {
      scheduleStep(step, nextTime);
      step = (step + 1) % 64;
      nextTime += stepDur;
    }
  }

  function play() {
    ensureCtx();
    ctx.resume();
    if (timer) return;
    step = 0;
    nextTime = ctx.currentTime + 0.06;
    tick();
    timer = setInterval(tick, 100);
  }

  function stop() {
    clearInterval(timer);
    timer = null;
    if (ctx) ctx.suspend();
  }

  /* ----- sound effects (respect the same mute switch) ----- */
  function good() {
    if (muted) return;
    ensureCtx(); ctx.resume();
    const t = ctx.currentTime;
    tone(t, 84, { type: 'sine', gain: 0.22, dur: 0.09 });
    tone(t + 0.09, 91, { type: 'sine', gain: 0.22, dur: 0.16 });
  }
  function bad() {
    if (muted) return;
    ensureCtx(); ctx.resume();
    const t = ctx.currentTime;
    tone(t, 52, { type: 'square', gain: 0.14, dur: 0.16, cutoff: 900 });
    tone(t + 0.1, 46, { type: 'square', gain: 0.14, dur: 0.22, cutoff: 900 });
  }
  function fanfare() {
    if (muted) return;
    ensureCtx(); ctx.resume();
    const t = ctx.currentTime;
    [72, 76, 79, 84].forEach((m, i) => tone(t + i * 0.09, m, { type: 'triangle', gain: 0.2, dur: 0.25 }));
  }

  /* ----- header toggle button ----- */
  const btn = document.createElement('button');
  btn.className = 'music-btn';
  btn.textContent = muted ? '🔇' : '🔊';
  btn.title = 'Music on/off';
  btn.onclick = () => {
    muted = !muted;
    localStorage.setItem('flaglab:muted', muted ? '1' : '0');
    btn.textContent = muted ? '🔇' : '🔊';
    if (muted) stop();
    else play();
  };
  document.querySelector('header.app')?.append(btn);

  // start on the first interaction anywhere (autoplay policy)
  const kickoff = () => { if (!muted) play(); };
  document.addEventListener('pointerdown', kickoff, { once: true });
  document.addEventListener('keydown', kickoff, { once: true });

  return { good, bad, fanfare };
})();
const SFX = AudioKit;
