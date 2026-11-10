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
    var streak = $('streak'), hd = $('hero-doodle'), sk = 12;
    var tickStreak = function () {
      sk = sk >= 99 ? 12 : sk + 1; streak.textContent = sk;
      streak.parentNode.classList.remove('bump'); void streak.offsetWidth; streak.parentNode.classList.add('bump');
      if (window.Doodle && hd) { window.Doodle.set(hd, 'jump'); later(function () { window.Doodle.set(hd, 'wave'); }, 1500); }
    };
    var cycle = function () {
      flip.classList.remove('done'); t3.classList.remove('done'); left(5); setBadge(0);
      later(function () { setBadge(1); }, 1800);
      later(function () { setBadge(2); }, 3600);
      later(function () { flip.classList.add('done'); left(4); tickStreak(); }, 5400);
      later(function () { t3.classList.add('done'); left(3); }, 6600);
      later(cycle, 9600);
    };
    var stop = function () { timers.forEach(clearTimeout); timers = []; running = false; };
    var start = function () { if (!running && !document.hidden) { running = true; cycle(); } };
    new IntersectionObserver(function (es) { es[0].isIntersecting ? start() : stop(); }, { threshold: 0.1 }).observe(heroPhone);
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
  }

  /* waitlist */
  var form = $('wl');
  if (!form) return;
  var msg = $('wl-msg'), btn = $('wl-btn');
  var thanks = $('thanks'), thanksH = $('thanks-h'), thanksP = $('thanks-p');
  var emailEl = $('email'), gradeEl = $('grade');
  var errs = { email: $('email-err'), grade: $('grade-err') };

  function fieldErr(key, el, text) {
    errs[key].textContent = text; errs[key].classList.add('show');
    el.setAttribute('aria-invalid', 'true');
  }
  function clearErr(key, el) {
    errs[key].textContent = ''; errs[key].classList.remove('show');
    el.removeAttribute('aria-invalid');
  }
  function formErr(text) { msg.className = 'form-msg err'; msg.textContent = text; }
  function done(h, p) {
    form.style.display = 'none';
    thanksH.textContent = h; thanksP.textContent = p;
    thanks.classList.add('show'); thanks.focus();
  }
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function checkEmail() {
    var v = emailEl.value.trim();
    if (!v) { fieldErr('email', emailEl, 'Enter your email.'); return false; }
    if (!EMAIL.test(v)) { fieldErr('email', emailEl, 'That email looks off. Try you@example.com.'); return false; }
    clearErr('email', emailEl); return true;
  }
  function checkGrade() {
    if (!gradeEl.value) { fieldErr('grade', gradeEl, 'Pick your grade.'); return false; }
    clearErr('grade', gradeEl); return true;
  }
  emailEl.addEventListener('blur', function () { if (emailEl.value) checkEmail(); });
  emailEl.addEventListener('input', function () { if (emailEl.getAttribute('aria-invalid')) checkEmail(); msg.className = 'form-msg'; msg.textContent = ''; });
  gradeEl.addEventListener('change', checkGrade);

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    if (form.website.value) { done("You're on the list.", 'We will email you when your spot opens.'); return; } /* honeypot: bots see success, nothing sent */
    var okE = checkEmail(), okG = checkGrade();
    if (!okE) { emailEl.focus(); return; }
    if (!okG) { gradeEl.focus(); return; }
    msg.className = 'form-msg'; msg.textContent = '';
    btn.disabled = true; btn.classList.add('loading'); btn.querySelector('.lbl').textContent = 'Joining…';
    var body = { email: emailEl.value.trim() };
    if (cfg.SEND_GRADE_AND_SCHOOL) { body.grade = Number(gradeEl.value); body.school = form.school.value.trim() || null; }
    fetch(cfg.SUPABASE_URL + '/rest/v1/waitlist', {
      method: 'POST',
      headers: { 'apikey': cfg.SUPABASE_PUBLISHABLE_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify(body)
    }).then(function (r) {
      if (r.ok) return done("You're on the list.", 'We will email you when your spot opens.');
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (r.status === 409 || j.code === '23505') return done("You're already on the list.", 'Nothing more to do. We will email you when your spot opens.');
        throw new Error('bad');
      });
    }).catch(function () {
      formErr(navigator.onLine === false ? 'You are offline. Connect and try again.' : 'Could not join right now. Your email was not saved. Try again in a minute.');
    }).then(function () { btn.disabled = false; btn.classList.remove('loading'); btn.querySelector('.lbl').textContent = 'Join the waitlist'; });
  });
})();
