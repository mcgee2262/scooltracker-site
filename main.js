(function () {
  var cfg = window.SCOOL_CONFIG || {};

  /* contact: placeholder until CONTACT_EMAIL is set in config.js */
  ['contact', 'contact2'].forEach(function (id) {
    var c = document.getElementById(id);
    if (c && cfg.CONTACT_EMAIL) {
      c.textContent = '';
      var a = document.createElement('a');
      a.href = 'mailto:' + cfg.CONTACT_EMAIL;
      a.textContent = 'Contact: ' + cfg.CONTACT_EMAIL;
      c.appendChild(a);
    }
  });

  /* scroll story: phone changes state with the step in view */
  var stage = document.getElementById('stage');
  var steps = document.querySelectorAll('.step');
  if (stage && steps.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) stage.setAttribute('data-state', e.target.getAttribute('data-state'));
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach(function (s) { io.observe(s); });
  }

  /* try the tags: same rule as app/src/lib/urgency.ts */
  var radios = document.querySelectorAll('input[name="due"]');
  var tb = document.getElementById('try-badge'), ts = document.getElementById('try-sub');
  function tag(d) {
    if (d <= 0) return { n: 'Emergency', c: 'b-red', m: 40, l: 'due today' };
    if (d <= 2) return { n: 'Urgent', c: 'b-amber', m: 25, l: 'due in ' + d + ' day' + (d === 1 ? '' : 's') };
    return { n: 'Steady', c: 'b-gray', m: 15, l: 'due in ' + d + ' days' };
  }
  function upd() {
    var d = 5;
    radios.forEach(function (r) { if (r.checked) d = Number(r.value); });
    var t = tag(d);
    tb.textContent = t.n; tb.className = 'badge ' + t.c;
    ts.textContent = t.l + ' · suggested study block ' + t.m + ' min';
  }
  radios.forEach(function (r) { r.addEventListener('change', upd); });

  /* waitlist */
  var form = document.getElementById('wl');
  if (!form) return;
  var msg = document.getElementById('wl-msg'), btn = document.getElementById('wl-btn');
  var thanks = document.getElementById('thanks'), thanksH = document.getElementById('thanks-h'), thanksP = document.getElementById('thanks-p');
  var emailEl = document.getElementById('email'), gradeEl = document.getElementById('grade');

  function err(text, el) {
    msg.className = 'form-msg err'; msg.textContent = text;
    [emailEl, gradeEl].forEach(function (x) { x.removeAttribute('aria-invalid'); });
    if (el) { el.setAttribute('aria-invalid', 'true'); el.focus(); }
  }
  function done(h, p) {
    form.style.display = 'none';
    thanksH.textContent = h; thanksP.textContent = p;
    thanks.classList.add('show'); thanks.focus();
  }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    if (form.website.value) { done("You're on the list.", 'We will email you when your spot opens.'); return; } /* honeypot: bots see success, nothing sent */
    var email = emailEl.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return err('Enter a valid email, like you@example.com.', emailEl);
    if (!gradeEl.value) return err('Pick your grade.', gradeEl);
    msg.className = 'form-msg'; msg.textContent = '';
    btn.disabled = true;
    var body = { email: email };
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
      err('Could not join right now. Check your connection and try again.');
    }).then(function () { btn.disabled = false; });
  });
})();
