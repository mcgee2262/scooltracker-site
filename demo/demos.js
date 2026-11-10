/* The six feature demos. All rules come from ScoolLogic (demo/logic.js, ported from the app).
   Sample data only. Nothing here is saved or sent anywhere. */
(function () {
  'use strict';
  var L = window.ScoolLogic, FX = window.ScoolFX, D = window.Doodle;
  if (!L) return;
  if (D) D.mountAll();
  var $ = function (id) { return document.getElementById(id); };
  var TODAY = new Date(2026, 10, 9); // Mon Nov 9 2026, the demo's "today"
  var b = function (badgeClass) { return badgeClass.replace('badge-', 'b-'); };
  function isoPlus(n) { var d = new Date(TODAY); d.setDate(d.getDate() + n); return L.toIso(d); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function say(id, text) { var n = $(id); if (n) { n.textContent = ''; setTimeout(function () { n.textContent = text; }, 30); } }
  var fx = FX || { burst: function () {}, burstFrom: function () {}, pop: function () {}, setSound: function () {}, soundOn: function () { return false; } };

  /* Doodle helpers: a base pose, plus short reactions that fall back to it */
  function doodle(id) {
    var node = $(id), base = node ? node.getAttribute('data-doodle') : 'wave', timer = 0;
    return {
      base: function (p) { base = p; if (!timer && D && node) D.set(node, p); },
      react: function (p, ms) {
        if (!D || !node) return;
        clearTimeout(timer); D.set(node, p);
        timer = setTimeout(function () { timer = 0; D.set(node, base); }, ms || 1500);
      },
      hold: function (p) { if (!D || !node) return; clearTimeout(timer); timer = 0; D.set(node, p); }
    };
  }

  /* paint a range input's filled part */
  function fill(r) { r.style.setProperty('--fill', ((r.value - r.min) / (r.max - r.min) * 100) + '%'); }

  /* sound toggle (OFF by default) */
  var snd = $('snd');
  if (snd) {
    var paint = function () {
      var on = fx.soundOn();
      snd.setAttribute('aria-pressed', on ? 'true' : 'false');
      $('snd-l').textContent = on ? 'Sound on' : 'Sound off';
    };
    paint();
    snd.addEventListener('click', function () { fx.setSound(!fx.soundOn()); paint(); });
  }

  /* ---------- 1. TODAY ---------- */
  (function () {
    var list = $('td-list'); if (!list) return;
    var slider = $('td-days'), out = $('td-days-out'), left = $('td-left'), doneBox = $('td-done');
    var dd = doodle('td-doodle');
    var tasks = [
      { id: 'essay', title: 'English essay', cls: 'English', d: 5, done: false },
      { id: 'chem', title: 'Chem lab write-up', cls: 'Chemistry', d: 0, done: false },
      { id: 'quiz', title: 'Quiz: Chapter 7', cls: 'Algebra II', d: 1, done: false },
      { id: 'span', title: 'Spanish vocab set', cls: 'Spanish', d: 4, done: false }
    ];
    var nodes = {};
    tasks.forEach(function (t) {
      var li = el('li', 'td-li');
      var btn = el('button', 'td-item'); btn.type = 'button';
      btn.innerHTML = '<span class="chk"><svg aria-hidden="true"><use href="#i-check"/></svg></span><span class="tmain"><span class="task-title"></span><span class="task-sub"></span></span><span class="badge"></span>';
      btn.addEventListener('click', function () { toggle(t, btn); });
      li.appendChild(btn); nodes[t.id] = li;
    });
    function info(t) { return L.taskBadge({ due: isoPlus(t.d), done: t.done }, TODAY); }
    function render(animate) {
      var first = {};
      if (animate) tasks.forEach(function (t) { first[t.id] = nodes[t.id].getBoundingClientRect().top; });
      var sorted = tasks.slice().sort(function (a, c) {
        var ia = info(a), ic = info(c);
        return (L.BADGE_ORDER[ia.badge] - L.BADGE_ORDER[ic.badge]) || (a.d - c.d);
      });
      sorted.forEach(function (t) {
        var li = nodes[t.id], btn = li.firstChild, r = info(t);
        var badge = btn.querySelector('.badge'), was = badge.textContent;
        btn.querySelector('.task-title').textContent = t.title;
        btn.querySelector('.task-sub').textContent = t.cls + ' · ' + L.dueLabel(r.daysUntil);
        badge.textContent = r.badge;
        badge.className = 'badge ' + b(r.badgeClass) + (was && was !== badge.textContent ? ' pop' : '');
        btn.setAttribute('aria-pressed', t.done ? 'true' : 'false');
        btn.setAttribute('aria-label', t.title + ', ' + t.cls + ', ' + L.dueLabel(r.daysUntil) + ', ' + (t.done ? 'done' : r.badge));
        li.classList.toggle('done', t.done);
        list.appendChild(li);
      });
      if (animate && !fx.reduced()) tasks.forEach(function (t) {
        var li = nodes[t.id], dy = first[t.id] - li.getBoundingClientRect().top;
        if (!dy) return;
        li.style.transition = 'none'; li.style.transform = 'translateY(' + dy + 'px)';
        requestAnimationFrame(function () { requestAnimationFrame(function () {
          li.style.transition = 'transform .45s cubic-bezier(.3,1.3,.5,1)'; li.style.transform = '';
        }); });
      });
      var n = tasks.filter(function (t) { return !t.done; }).length;
      left.textContent = n;
      doneBox.hidden = n !== 0;
      var essay = info(tasks[0]);
      out.textContent = L.dueLabel(essay.daysUntil) + ': ' + (tasks[0].done ? 'done' : essay.badge);
      dd.base(n === 0 ? 'jump' : (essay.badge === 'Emergency' ? 'worried' : 'wave'));
      return n;
    }
    function toggle(t, btn) {
      t.done = !t.done;
      var n = render(true);
      if (t.done) {
        fx.burstFrom(btn.querySelector('.chk'), n === 0 ? 70 : 34);
        fx.pop(n === 0);
        if (n === 0) dd.hold('jump'); else dd.react('jump', 1400);
        say('td-live', t.title + ' checked off. ' + n + ' left.');
      } else say('td-live', t.title + ' is back on the list. ' + n + ' left.');
    }
    slider.addEventListener('input', function () {
      tasks[0].d = Number(slider.value); fill(slider);
      render(true);
    });
    $('td-reset').addEventListener('click', function () {
      tasks.forEach(function (t) { t.done = false; }); render(true); say('td-live', 'List reset. 4 left.');
      list.querySelector('button').focus();
    });
    fill(slider); render(false);
  })();

  /* ---------- 2. GRADES ---------- */
  (function () {
    var s = $('gr-slider'); if (!s) return;
    var others = [94, 86, 91], lastLetter = null, t = 0;
    var TIERTXT = { Focus: 'needs focus', Watch: 'watch it', Solid: 'solid' };
    function upd() {
      var p = Number(s.value); fill(s);
      var letter = L.percentToLetter(p), tier = L.priorityTier(p), next = L.pointsToNextLetter(p);
      var gpa = L.averageGpa(others.concat([p]));
      $('gr-pct').textContent = p;
      var lb = $('gr-letter');
      lb.textContent = letter;
      lb.className = 'badge big ' + b(L.letterBadgeClass(letter)) + (lastLetter && lastLetter !== letter ? ' pop' : '');
      var tb = $('gr-tier');
      tb.textContent = tier.name; tb.className = 'badge big ' + b(tier.badgeClass);
      $('gr-gpa').textContent = 'GPA ' + gpa.toFixed(2);
      $('gr-next').textContent = next ? next.points + (next.points === 1 ? ' point' : ' points') + ' to a' + (/^[AEF]/.test(next.letter) ? 'n ' : ' ') + next.letter : 'Top of the scale. Nice.';
      var bar = $('gr-bar');
      bar.style.transform = 'scaleX(' + (p / 100) + ')';
      bar.setAttribute('data-tier', tier.name);
      s.setAttribute('aria-valuetext', p + '%, ' + letter);
      if (lastLetter && lastLetter !== letter && letter === 'A') { fx.burstFrom(lb, 26); fx.pop(); }
      lastLetter = letter;
      clearTimeout(t);
      t = setTimeout(function () { say('gr-live', 'Chemistry ' + p + '%: ' + letter + ', ' + TIERTXT[tier.name] + '. GPA ' + gpa.toFixed(2) + '.'); }, 400);
    }
    s.addEventListener('input', upd);
    upd();
  })();

  /* ---------- 3. CALENDAR ---------- */
  (function () {
    var grid = $('cal-grid'); if (!grid) return;
    var BASE_OFF = ['2026-09-07', '2026-10-12', '2026-11-03', '2026-11-11', '2026-11-26', '2026-11-27'];
    var year = { yearStart: '2026-08-10', yearEnd: '2027-06-16', dayNames: ['Blue', 'Green'], daysOff: new Set(BASE_OFF) };
    var todayIso = L.toIso(TODAY), prev = {};
    var fmt = function (iso, o) { return L.parseIso(iso).toLocaleDateString('en-US', o || { weekday: 'short', month: 'short', day: 'numeric' }); };
    ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach(function (d, i) {
      var h = el('span', 'dow', d); h.setAttribute('aria-hidden', 'true'); grid.appendChild(h);
    });
    var cells = L.monthCells(2026, 10).map(function (iso) {
      if (!iso) { var e = el('span', 'cd pad'); e.setAttribute('aria-hidden', 'true'); grid.appendChild(e); return null; }
      var info = L.dayInfo(iso, year), n;
      if (info.status === 'weekend') { n = el('span', 'cd we', String(Number(iso.slice(8)))); n.setAttribute('aria-hidden', 'true'); }
      else {
        n = el('button', 'cd', String(Number(iso.slice(8)))); n.type = 'button';
        n.addEventListener('click', function () { toggle(iso); });
      }
      if (iso === todayIso) n.classList.add('now');
      grid.appendChild(n);
      return { iso: iso, node: n };
    }).filter(Boolean);

    function paint(changedFrom) {
      var changed = 0, k = 0;
      cells.forEach(function (c) {
        var info = L.dayInfo(c.iso, year);
        if (info.status === 'weekend') return;
        var key = info.status === 'off' ? 'off' : info.name;
        var n = c.node;
        n.classList.remove('cb', 'cg', 'co', 'flip');
        n.classList.add(key === 'off' ? 'co' : (L.cycleBadgeClass(info.name, year.dayNames) === 'badge-blue' ? 'cb' : 'cg'));
        n.setAttribute('aria-pressed', key === 'off' ? 'true' : 'false');
        n.setAttribute('aria-label', fmt(c.iso, { weekday: 'long', month: 'long', day: 'numeric' }) + ', ' + (key === 'off' ? 'day off' : info.name + ' day'));
        if (changedFrom && prev[c.iso] !== key && c.iso !== changedFrom) {
          changed++;
          n.style.setProperty('--d', (k++ * 28) + 'ms');
          void n.offsetWidth; n.classList.add('flip');
        }
        prev[c.iso] = key;
      });
      var t = L.dayInfo(todayIso, year), tb = $('cal-today');
      tb.textContent = t.status === 'off' ? 'Today: day off' : 'Today: ' + t.name;
      tb.className = 'badge ' + (t.status === 'off' ? 'b-gray' : b(L.cycleBadgeClass(t.name, year.dayNames)));
      var cur = new Date(TODAY), next = null;
      for (var i = 0; i < 300 && !next; i++) {
        var iso = L.toIso(cur);
        if (L.dayInfo(iso, year).status === 'off') next = iso;
        cur.setDate(cur.getDate() + 1);
      }
      $('cal-next').textContent = next ? fmt(next) : 'None left';
      return changed;
    }
    function toggle(iso) {
      var off = year.daysOff.has(iso);
      if (off) year.daysOff.delete(iso); else year.daysOff.add(iso);
      var n = paint(iso);
      fx.pop();
      say('cal-live', fmt(iso, { month: 'long', day: 'numeric' }) + (off ? ' is a school day again. ' : ' is now a day off. ') + n + ' later days switched color.');
    }
    $('cal-reset').addEventListener('click', function () {
      year.daysOff = new Set(BASE_OFF); paint('x'); say('cal-live', 'Days off reset.');
    });
    paint(null);
  })();

  /* ---------- 4. STUDY (coming soon in the app) ---------- */
  (function () {
    var box = $('st-opts'); if (!box) return;
    var dd = doodle('st-doodle');
    var TASKS = [
      { id: 'span', t: 'Spanish vocab set', badge: 'Steady', cls: 'Spanish', pct: 91 },
      { id: 'quiz', t: 'Quiz: Chapter 7', badge: 'Urgent', cls: 'Algebra II', pct: 94 },
      { id: 'hist', t: 'History essay', badge: 'Emergency', cls: 'History', pct: 93 },
      { id: 'chem', t: 'Chem lab write-up', badge: 'Emergency', cls: 'Chemistry', pct: 77 }
    ];
    var DEMO_MS = 6000, C = 2 * Math.PI * 52;
    var cur = TASKS[1], mins = 25, elapsed = 0, startAt = 0, raf = 0, state = 'ready';
    var ring = $('st-ring'), timeEl = $('st-time'), stateEl = $('st-state'), startBtn = $('st-start');
    ring.style.strokeDasharray = C.toFixed(2);
    TASKS.forEach(function (t, i) {
      var id = 'st-' + t.id;
      var inp = el('input'); inp.type = 'radio'; inp.name = 'st-task'; inp.id = id; inp.value = t.id; if (i === 1) inp.checked = true;
      var lab = el('label'); lab.htmlFor = id;
      lab.innerHTML = '<span class="st-t"></span><span class="badge ' + b(L.URGENCY_BADGE_CLASS[t.badge]) + '">' + t.badge + '</span>';
      lab.firstChild.textContent = t.t;
      inp.addEventListener('change', function () { cur = t; reset(); });
      box.appendChild(inp); box.appendChild(lab);
    });
    function mmss(sec) { sec = Math.max(0, Math.ceil(sec)); return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0'); }
    function draw() {
      var p = Math.min(1, elapsed / DEMO_MS);
      timeEl.textContent = mmss(mins * 60 * (1 - p));
      ring.style.strokeDashoffset = (C * (1 - p)).toFixed(2);
    }
    function loop(now) {
      elapsed = Math.min(DEMO_MS, now - startAt);
      draw();
      if (elapsed >= DEMO_MS) return finish();
      raf = requestAnimationFrame(loop);
    }
    function finish() {
      state = 'done'; raf = 0;
      stateEl.textContent = 'done';
      startBtn.textContent = 'Again';
      fx.burstFrom(ring, 60); fx.pop(true);
      dd.hold('jump');
      say('st-live', 'Done. ' + mins + ' minutes on ' + cur.t + '. Take a short break.');
    }
    function reset() {
      cancelAnimationFrame(raf); raf = 0;
      var tier = L.priorityTier(cur.pct);
      mins = L.suggestedMinutes(cur.badge, cur.pct);
      elapsed = 0; state = 'ready';
      $('st-why').textContent = cur.badge + ' = ' + L.STUDY_MINUTES[cur.badge] + ' min. ' + cur.cls + ' is ' + tier.name + ', so +' + tier.bonusMinutes + '.';
      stateEl.textContent = mins + ' min block';
      startBtn.textContent = 'Start';
      dd.hold('wave');
      draw();
    }
    startBtn.addEventListener('click', function () {
      if (state === 'running') {
        cancelAnimationFrame(raf); raf = 0; state = 'paused';
        stateEl.textContent = 'paused'; startBtn.textContent = 'Resume';
        return;
      }
      if (state === 'done') reset();
      state = 'running';
      stateEl.textContent = 'studying';
      startBtn.textContent = 'Pause';
      dd.hold('focused');
      startAt = performance.now() - elapsed;
      raf = requestAnimationFrame(loop);
      say('st-live', 'Timer started: ' + mins + ' minutes on ' + cur.t + '.');
    });
    $('st-reset').addEventListener('click', reset);
    reset();
  })();

  /* ---------- 5. REMINDERS (coming soon in the app) ---------- */
  (function () {
    var box = $('rem-notes'), btn = $('rem-send'); if (!box || !btn) return;
    var SAMPLES = [
      { t: 'Chem lab write-up', cls: 'Chemistry', pct: 77, due: 1 },
      { t: 'Quiz: Chapter 7', cls: 'Algebra II', pct: 94, due: 1 },
      { t: 'English essay', cls: 'English', pct: 86, due: 0 }
    ];
    var i = 0;
    function text(s) {
      var r = L.taskBadge({ due: isoPlus(s.due) }, TODAY);
      var m = L.suggestedMinutes(r.badge, s.pct);
      return { h: s.t + ' is now ' + r.badge, p: L.dueLabel(r.daysUntil).replace(/^d/, 'D') + '. Plan ' + m + ' minutes tonight.' };
    }
    function send() {
      var s = SAMPLES[i % SAMPLES.length]; i++;
      var m = text(s);
      var li = el('li', 'note');
      li.innerHTML = '<span class="note-ico" aria-hidden="true"><svg viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#A8F0D2"/><path d="M18 33l9 9 19-21" fill="none" stroke="#06100E" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="note-txt"><span class="note-app">Scool Tracker <i>now</i></span><b></b><span class="note-p"></span></span>';
      li.querySelector('b').textContent = m.h;
      li.querySelector('.note-p').textContent = m.p;
      box.insertBefore(li, box.firstChild);
      while (box.children.length > 3) box.removeChild(box.lastChild);
      fx.pop();
    }
    btn.addEventListener('click', send);
    var demo = $('demo-rem');
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { io.disconnect(); setTimeout(send, 600); }
      }, { threshold: 0.5 });
      io.observe(demo);
    } else send();
  })();

  /* ---------- 6. SETUP ---------- */
  (function () {
    var body = $('su-body'); if (!body) return;
    var dd = doodle('su-doodle');
    var REPEATS = [
      { l: 'Blue / Green', v: 'Blue, Green' },
      { l: 'A / B', v: 'A/B' },
      { l: 'Day 1 / 2 / 3', v: 'Day 1, Day 2, Day 3' },
      { l: 'Same every day', v: '' }
    ];
    var CLASSES = ['Algebra II', 'Chemistry', 'English', 'Spanish', 'History', 'Art', 'PE', 'Band'];
    var STARTS = [{ l: 'Mon, Aug 10', v: '2026-08-10' }, { l: 'Mon, Aug 17', v: '2026-08-17' }, { l: 'Mon, Aug 24', v: '2026-08-24' }];
    var YEAR_END = '2027-06-16';
    var st;
    function fresh() { st = { step: 0, names: null, picked: CLASSES.slice(0, 4), start: null }; }
    function head(txt, sub) {
      var h = el('h5', 'su-h', txt); h.tabIndex = -1;
      var frag = document.createDocumentFragment();
      frag.appendChild(el('p', 'su-step', sub)); frag.appendChild(h);
      return { frag: frag, h: h };
    }
    function chip(txt, onClick, pressed) {
      var c = el('button', 'chip3d', txt); c.type = 'button';
      if (pressed != null) c.setAttribute('aria-pressed', pressed ? 'true' : 'false');
      c.addEventListener('click', onClick);
      return c;
    }
    function go(focus) {
      body.innerHTML = '';
      $('su-bar').style.transform = 'scaleX(' + Math.max(0.04, st.step / 3) + ')';
      var h, wrap = el('div', 'su-opts');
      if (st.step === 0) {
        h = head('How do your days repeat?', 'Step 1 of 3');
        REPEATS.forEach(function (r) { wrap.appendChild(chip(r.l, function () { st.names = L.parseDayNames(r.v); st.step = 1; go(true); })); });
      } else if (st.step === 1) {
        h = head('Pick your classes', 'Step 2 of 3');
        CLASSES.forEach(function (c) {
          var on = st.picked.indexOf(c) !== -1;
          wrap.appendChild(chip(c, function (e) {
            var i = st.picked.indexOf(c);
            if (i === -1) st.picked.push(c); else st.picked.splice(i, 1);
            e.currentTarget.setAttribute('aria-pressed', i === -1 ? 'true' : 'false');
            note();
          }, on));
        });
      } else if (st.step === 2) {
        h = head('First day of school?', 'Step 3 of 3');
        STARTS.forEach(function (s) {
          wrap.appendChild(chip(s.l, function () {
            if (L.validateSetup('My school', s.v, YEAR_END)) return;
            st.start = s.v; st.step = 3; go(true);
          }));
        });
      } else {
        h = head("You're set.", 'Ready in about a minute');
        var info = L.dayInfo('2026-11-10', { yearStart: st.start, yearEnd: YEAR_END, dayNames: st.names, daysOff: [] });
        var p = el('p', 'su-result');
        p.textContent = 'Tomorrow, Tue Nov 10, is ' + (info.name ? 'a ' + info.name + ' day' : 'school day ' + info.schoolDay) +
          '. ' + st.picked.length + ' classes added' + (st.picked.length > 5 ? ' (more than 5 needs Pro later; free in beta).' : '.') +
          ' Add snow days and holidays any time and the days after them shift.';
        wrap.appendChild(p);
        wrap.appendChild(chip('Start over', function () { fresh(); go(true); }));
        dd.hold('jump');
        fx.burstFrom(body, 50); fx.pop(true);
      }
      body.appendChild(h.frag); body.appendChild(wrap);
      if (st.step === 1) {
        var n = el('p', 'su-note'); n.id = 'su-note'; body.appendChild(n);
        var next = el('button', 'btn btn-sm', 'Next'); next.type = 'button'; next.id = 'su-next';
        next.addEventListener('click', function () { if (st.picked.length) { st.step = 2; go(true); } });
        body.appendChild(next);
        note();
      }
      if (st.step < 3) dd.hold('wave');
      if (focus) h.h.focus({ preventScroll: true });
      say('su-live', h.h.textContent);
    }
    function note() {
      var n = $('su-note'), k = st.picked.length;
      n.textContent = k > 5 ? k + ' classes. Free has up to 5. Pro (later) has unlimited. In beta it is all free.' : k + ' of 5 free classes';
      n.classList.toggle('over', k > 5);
      $('su-next').disabled = k === 0;
    }
    fresh(); go(false);
  })();
})();
