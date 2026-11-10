/* Tiny effects: hand-written canvas confetti and a WebAudio "pop". No libraries, no files.
   Everything is skipped under prefers-reduced-motion (confetti) or while sound is off (default). */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var COLORS = ['#A8F0D2', '#C7BAFF', '#FFD66B', '#FF9A8A', '#8FD3FF', '#FFFFFF'];
  var canvas, ctx, bits = [], raf = 0, dpr = 1;

  function setup() {
    canvas = document.createElement('canvas');
    canvas.className = 'confetti';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
    size();
    window.addEventListener('resize', size);
  }
  function size() {
    if (!canvas) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
  }
  function tick() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    var alive = [];
    for (var i = 0; i < bits.length; i++) {
      var b = bits[i];
      b.life -= 1;
      if (b.life <= 0) continue;
      b.vy += 0.32; b.vx *= 0.985; b.vy *= 0.985;
      b.x += b.vx; b.y += b.vy; b.r += b.vr;
      ctx.save();
      ctx.globalAlpha = Math.min(1, b.life / 25);
      ctx.translate(b.x, b.y); ctx.rotate(b.r);
      ctx.fillStyle = b.c;
      if (b.round) { ctx.beginPath(); ctx.arc(0, 0, b.w / 2, 0, 6.283); ctx.fill(); }
      else { ctx.scale(1, Math.cos(b.r * 2)); ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h); }
      ctx.restore();
      alive.push(b);
    }
    bits = alive;
    if (bits.length) raf = requestAnimationFrame(tick);
    else { raf = 0; ctx.clearRect(0, 0, innerWidth, innerHeight); }
  }

  /* burst at viewport coords (x, y). n pieces. */
  function burst(x, y, n) {
    if (reduce.matches) return;
    if (!canvas) setup();
    n = n || 36;
    for (var i = 0; i < n; i++) {
      var a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2, s = 5 + Math.random() * 7;
      bits.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.35,
        w: 6 + Math.random() * 5, h: 9 + Math.random() * 6, c: COLORS[i % COLORS.length], round: Math.random() < 0.3, life: 70 + Math.random() * 40 });
    }
    if (!raf) raf = requestAnimationFrame(tick);
  }
  function burstFrom(el, n) {
    if (!el) return;
    var r = el.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, n);
  }

  /* sound: OFF by default. Remembered per browser (try/catch: storage can be blocked). */
  var soundOn = false, actx = null;
  try { soundOn = localStorage.getItem('st-sound') === '1'; } catch (e) {}
  function setSound(on) {
    soundOn = !!on;
    try { localStorage.setItem('st-sound', soundOn ? '1' : '0'); } catch (e) {}
    if (soundOn) pop();
  }
  function note(freq, start, dur, vol) {
    var o = actx.createOscillator(), g = actx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(freq, start);
    o.frequency.exponentialRampToValueAtTime(freq * 1.5, start + dur * 0.6);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(vol, start + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g); g.connect(actx.destination);
    o.start(start); o.stop(start + dur + 0.02);
  }
  function pop(big) {
    if (!soundOn) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      var t = actx.currentTime;
      note(620, t, 0.12, 0.16);
      note(930, t + 0.08, 0.16, 0.12);
      if (big) note(1240, t + 0.17, 0.22, 0.1);
    } catch (e) {}
  }

  window.ScoolFX = {
    burst: burst, burstFrom: burstFrom, pop: pop, setSound: setSound,
    soundOn: function () { return soundOn; }, reduced: function () { return reduce.matches; }
  };
})();
