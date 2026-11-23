(function () {
  var cfg = window.SCOOL_CONFIG || {};
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (id) { return document.getElementById(id); };

  /* contact: placeholder until CONTACT_EMAIL is set in config.js */
  ['contact', 'contact2'].forEach(function (id) {
    var c = $(id);
    if (c && cfg.CONTACT_EMAIL) {
      c.textContent = '';
      var a = document.createElement('a');
      a.href = 'mailto:' + cfg.CONTACT_EMAIL;
      a.textContent = 'Contact: ' + cfg.CONTACT_EMAIL;
      c.appendChild(a);
    }
  });

  /* one scroll loop (rAF-throttled): nav shrink, hero parallax, lesson progress bar */
  var nav = $('nav'), heroPhone = $('hero-phone'), bar = $('lessonbar'), ticking = false;
  function frame() {
    ticking = false;
    var y = window.scrollY, vh = window.innerHeight;
    var max = document.documentElement.scrollHeight - vh;
    if (nav) nav.classList.toggle('scrolled', y > 24);
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0).toFixed(4) + ')';
    if (heroPhone && !reduce && y < vh * 1.5) heroPhone.style.setProperty('--py', (-Math.min(y, vh) * 0.07).toFixed(1) + 'px');
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  frame();

  /* sections pop in on scroll; numbers count up. Content is visible without JS or with reduced motion. */
  var reveals = [].slice.call(document.querySelectorAll('.reveal'));
  var counts = [].slice.call(document.querySelectorAll('[data-count]'));
  function countUp(elm) {
    var to = Number(elm.getAttribute('data-count')), t0 = performance.now(), dur = 900;
    (function step(now) {
      var p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      elm.textContent = Math.round(to * e);
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }
  if (!reduce && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('anim');
    var rio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in'); rio.unobserve(e.target);
        var c = e.target.querySelector('[data-count]'); if (c) countUp(c);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    reveals.forEach(function (r) { rio.observe(r); });
    counts.forEach(function (c) { if (!c.closest('.reveal')) countUp(c); });
  }

  /* sticky mobile CTA: after the hero button leaves, hidden near the join section */
  var mbar = $('mbar'), heroCta = $('hero-cta'), join = $('join');
  if (mbar && heroCta && join && 'IntersectionObserver' in window) {
    var past = false, atJoin = false;
    var upd = function () {
      var show = past && !atJoin;
      mbar.classList.toggle('show', show);
      mbar.setAttribute('aria-hidden', show ? 'false' : 'true');
      mbar.querySelector('a').tabIndex = show ? 0 : -1;
    };
    new IntersectionObserver(function (es) {
      var r = es[0]; past = !r.isIntersecting && r.boundingClientRect.top < 0; upd();
    }).observe(heroCta);
    new IntersectionObserver(function (es) { atJoin = es[0].isIntersecting; upd(); }, { rootMargin: '0px 0px -10% 0px' }).observe(join);
  }

  /* hero phone alive: a badge goes Steady -> Urgent -> Emergency, then the task ticks off */
  var flip = $('h-flip'), fb = $('h-flip-b'), fs = $('h-flip-sub'), t3 = $('h-t3'), cnt = $('h-count');
  var STEPS = [
    { c: 'b-gray', n: 'Steady', s: 'Chemistry · in 5 days' },
    { c: 'b-amber', n: 'Urgent', s: 'Chemistry · tomorrow' },
    { c: 'b-red', n: 'Emergency', s: 'Chemistry · today' }
  ];
  function setBadge(i) {
    var st = STEPS[i];
    fb.className = 'badge pop ' + st.c; fb.textContent = st.n; fs.textContent = st.s;
  }
  if (flip && fb && !reduce && 'IntersectionObserver' in window) {
    var timers = [], running = false;
    var later = function (fn, ms) { timers.push(setTimeout(fn, ms)); };
    var left = function (n) { cnt.textContent = n; };
    var hd = $('hero-doodle');
    var cheer = function () {
      if (window.Doodle && hd) { window.Doodle.set(hd, 'jump'); later(function () { window.Doodle.set(hd, 'wave'); }, 1500); }
    };
    var cycle = function () {
      flip.classList.remove('done'); t3.classList.remove('done'); left(5); setBadge(0);
      later(function () { setBadge(1); }, 1800);
      later(function () { setBadge(2); }, 3600);
      later(function () { flip.classList.add('done'); left(4); cheer(); }, 5400);
      later(function () { t3.classList.add('done'); left(3); }, 6600);
      later(cycle, 9600);
    };
    var stop = function () { timers.forEach(clearTimeout); timers = []; running = false; };
    var start = function () { if (!running && !document.hidden) { running = true; cycle(); } };
    new IntersectionObserver(function (es) { es[0].isIntersecting ? start() : stop(); }, { threshold: 0.1 }).observe(heroPhone);
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
  }
})();
