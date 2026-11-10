/* Scool Tracker demo logic. Plain JS port of the app's pure functions so the
   landing page demos give the same answers as the app.
   Sources (read-only, do not edit from here):
     app/src/lib/urgency.ts, app/src/lib/grades.ts, app/src/lib/schoolDays.ts
   If those files change, port the change here and run: node --test landing/demo/logic.test.js
   Works in the browser (window.ScoolLogic) and in node (require). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ScoolLogic = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---------- grades.ts ---------- */
  var SCALE = [
    [93, 'A', 4.0],
    [90, 'A-', 3.7],
    [87, 'B+', 3.3],
    [83, 'B', 3.0],
    [80, 'B-', 2.7],
    [77, 'C+', 2.3],
    [73, 'C', 2.0],
    [70, 'C-', 1.7],
    [67, 'D+', 1.3],
    [60, 'D', 1.0]
  ];

  function percentToLetter(percent) {
    for (var i = 0; i < SCALE.length; i++) if (percent >= SCALE[i][0]) return SCALE[i][1];
    return 'F';
  }

  /** Unweighted GPA points for one class. */
  function percentToGpa(percent) {
    for (var i = 0; i < SCALE.length; i++) if (percent >= SCALE[i][0]) return SCALE[i][2];
    return 0.0;
  }

  /** Average unweighted GPA, rounded to 2 places (0 if no classes). */
  function averageGpa(percents) {
    if (percents.length === 0) return 0;
    var sum = percents.reduce(function (acc, p) { return acc + percentToGpa(p); }, 0);
    return Math.round((sum / percents.length) * 100) / 100;
  }

  function letterBadgeClass(letter) {
    if (letter === 'A' || letter === 'A-') return 'badge-green';
    if (letter === 'B+' || letter === 'B' || letter === 'B-') return 'badge-blue';
    if (['C+', 'C', 'C-', 'D+', 'D'].indexOf(letter) !== -1) return 'badge-amber';
    return 'badge-red';
  }

  /** Lowest grades get the most attention. */
  function priorityTier(percent) {
    if (percent === null || percent === undefined) return { name: 'Unknown', badgeClass: 'badge-gray', bonusMinutes: 0 };
    if (percent < 80) return { name: 'Focus', badgeClass: 'badge-red', bonusMinutes: 10 };
    if (percent < 90) return { name: 'Watch', badgeClass: 'badge-amber', bonusMinutes: 5 };
    return { name: 'Solid', badgeClass: 'badge-green', bonusMinutes: 0 };
  }

  /** Landing-only helper (not in the app yet): points up to the next letter on the same SCALE.
      Returns null at the top of the scale. */
  function pointsToNextLetter(percent) {
    var next = null;
    for (var i = SCALE.length - 1; i >= 0; i--) {
      if (SCALE[i][0] > percent) { next = SCALE[i]; break; }
    }
    if (!next) return null;
    return { letter: next[1], points: Math.round((next[0] - percent) * 10) / 10 };
  }

  /* ---------- urgency.ts ---------- */
  var URGENCY_BADGE_CLASS = { Steady: 'badge-gray', Urgent: 'badge-amber', Emergency: 'badge-red' };
  var BADGE_ORDER = { Emergency: 0, Urgent: 1, Steady: 2, Submit: 3 };
  /** Base study minutes per badge (old app DURATION_BY_BADGE). */
  var STUDY_MINUTES = { Steady: 15, Urgent: 25, Emergency: 40 };

  /** Parse YYYY-MM-DD as a local date (no timezone shift). */
  function parseIsoDate(iso) {
    var p = iso.split('-').map(Number);
    return new Date(p[0], p[1] - 1, p[2]);
  }

  /** Whole days from `today` to `dueIso`. Negative = overdue. */
  function daysUntil(dueIso, today) {
    today = today || new Date();
    var due = parseIsoDate(dueIso);
    var t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return Math.round((due.getTime() - t.getTime()) / 86400000);
  }

  /** done -> Submit (blue); override wins; else due today/overdue -> Emergency,
      due in 1-2 days -> Urgent, later or no due date -> Steady. */
  function taskBadge(task, today) {
    var d = task.due ? daysUntil(task.due, today) : null;
    if (task.done) return { badge: 'Submit', badgeClass: 'badge-blue', daysUntil: d };
    if (task.override) return { badge: task.override, badgeClass: URGENCY_BADGE_CLASS[task.override] || 'badge-gray', daysUntil: d };
    var badge = 'Steady';
    if (d !== null) {
      if (d <= 0) badge = 'Emergency';
      else if (d <= 2) badge = 'Urgent';
    }
    return { badge: badge, badgeClass: URGENCY_BADGE_CLASS[badge], daysUntil: d };
  }

  /** Suggested study block: base by badge (15/25/40, 20 if unknown) + class tier bonus. */
  function suggestedMinutes(badge, classPercent) {
    var base = badge === 'Submit' ? 20 : STUDY_MINUTES[badge];
    return base + priorityTier(classPercent).bonusMinutes;
  }

  /** Human due label, e.g. "due today", "was due 2 days ago". */
  function dueLabel(d) {
    if (d === null) return 'no due date';
    if (d < 0) return 'was due ' + Math.abs(d) + ' day' + (Math.abs(d) !== 1 ? 's' : '') + ' ago';
    if (d === 0) return 'due today';
    if (d === 1) return 'due tomorrow';
    return 'due in ' + d + ' days';
  }

  /* ---------- schoolDays.ts ---------- */
  function pad(n) { return String(n).padStart(2, '0'); }
  function toIso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parseIso(iso) { return parseIsoDate(iso); }
  function isWeekend(d) { var w = d.getDay(); return w === 0 || w === 6; }

  function parseDayNames(input) {
    return input.split(/[,/]/).map(function (s) { return s.trim(); }).filter(Boolean);
  }

  function dayInfo(dateIso, year) {
    var none = { status: 'none', name: null, schoolDay: null };
    if (!year.yearStart || !year.yearEnd) return none;
    if (dateIso < year.yearStart || dateIso > year.yearEnd) return none;
    var off = year.daysOff instanceof Set ? year.daysOff : new Set(year.daysOff);
    var target = parseIso(dateIso);
    if (isWeekend(target)) return { status: 'weekend', name: null, schoolDay: null };
    if (off.has(dateIso)) return { status: 'off', name: null, schoolDay: null };
    var count = 0;
    var cur = parseIso(year.yearStart);
    while (cur <= target) {
      if (!isWeekend(cur) && !off.has(toIso(cur))) count++;
      cur.setDate(cur.getDate() + 1);
    }
    var names = year.dayNames;
    return { status: 'school', name: names.length ? names[(count - 1) % names.length] : null, schoolDay: count };
  }

  /** Cells for a month grid, Sunday first. Leading nulls pad to the weekday. */
  function monthCells(year, month0) {
    var first = new Date(year, month0, 1);
    var cells = [];
    for (var i = 0; i < first.getDay(); i++) cells.push(null);
    var n = new Date(year, month0 + 1, 0).getDate();
    for (var d = 1; d <= n; d++) cells.push(toIso(new Date(year, month0, d)));
    return cells;
  }

  /** Badge class for a cycle name: first name blue, second green, else gray. */
  function cycleBadgeClass(name, dayNames) {
    var i = name ? dayNames.indexOf(name) : -1;
    return i === 0 ? 'badge-blue' : i === 1 ? 'badge-green' : 'badge-gray';
  }

  /** Validate setup basics. Returns error text or null. */
  function validateSetup(school, start, end) {
    if (!school.trim()) return 'Add your school name.';
    if (!start || !end) return 'Pick the first and last day of school.';
    if (end <= start) return 'Last day must be after first day.';
    return null;
  }

  return {
    SCALE: SCALE, percentToLetter: percentToLetter, percentToGpa: percentToGpa, averageGpa: averageGpa,
    letterBadgeClass: letterBadgeClass, priorityTier: priorityTier, pointsToNextLetter: pointsToNextLetter,
    URGENCY_BADGE_CLASS: URGENCY_BADGE_CLASS, BADGE_ORDER: BADGE_ORDER, STUDY_MINUTES: STUDY_MINUTES,
    daysUntil: daysUntil, taskBadge: taskBadge, suggestedMinutes: suggestedMinutes, dueLabel: dueLabel,
    toIso: toIso, parseIso: parseIso, parseDayNames: parseDayNames, dayInfo: dayInfo, monthCells: monthCells,
    cycleBadgeClass: cycleBadgeClass, validateSetup: validateSetup
  };
});
