// Same cases as app/src/lib/{urgency,grades,schoolDays}.test.ts, plus the landing-only helper.
// Run: node --test landing/demo/logic.test.js
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const L = require('./logic.js');

const today = new Date(2026, 10, 9); // Nov 9 2026

describe('taskBadge', () => {
  it('Emergency when due today or overdue', () => {
    assert.equal(L.taskBadge({ due: '2026-11-09' }, today).badge, 'Emergency');
    assert.equal(L.taskBadge({ due: '2026-11-05' }, today).badge, 'Emergency');
  });
  it('Urgent when due in 1 or 2 days', () => {
    assert.equal(L.taskBadge({ due: '2026-11-10' }, today).badge, 'Urgent');
    assert.equal(L.taskBadge({ due: '2026-11-11' }, today).badge, 'Urgent');
  });
  it('Steady when 3+ days out or no due date', () => {
    assert.equal(L.taskBadge({ due: '2026-11-12' }, today).badge, 'Steady');
    assert.equal(L.taskBadge({}, today).badge, 'Steady');
  });
  it('override wins, done shows Submit', () => {
    assert.equal(L.taskBadge({ due: '2026-12-01', override: 'Emergency' }, today).badgeClass, 'badge-red');
    assert.equal(L.taskBadge({ due: '2026-11-09', done: true }, today).badge, 'Submit');
  });
  it('counts days across month end', () => {
    assert.equal(L.daysUntil('2026-12-01', today), 22);
  });
});

describe('suggestedMinutes', () => {
  it('15 / 25 / 40 base', () => {
    assert.equal(L.suggestedMinutes('Steady', 95), 15);
    assert.equal(L.suggestedMinutes('Urgent', 95), 25);
    assert.equal(L.suggestedMinutes('Emergency', 95), 40);
  });
  it('adds tier bonus', () => {
    assert.equal(L.suggestedMinutes('Urgent', 85), 30);
    assert.equal(L.suggestedMinutes('Emergency', 70), 50);
  });
});

describe('dueLabel', () => {
  it('reads like the old app', () => {
    assert.equal(L.dueLabel(-1), 'was due 1 day ago');
    assert.equal(L.dueLabel(0), 'due today');
    assert.equal(L.dueLabel(1), 'due tomorrow');
    assert.equal(L.dueLabel(5), 'due in 5 days');
  });
});

describe('percentToLetter', () => {
  it('maps the old scale edges', () => {
    assert.equal(L.percentToLetter(100), 'A');
    assert.equal(L.percentToLetter(93), 'A');
    assert.equal(L.percentToLetter(92.9), 'A-');
    assert.equal(L.percentToLetter(87), 'B+');
    assert.equal(L.percentToLetter(80), 'B-');
    assert.equal(L.percentToLetter(73), 'C');
    assert.equal(L.percentToLetter(60), 'D');
    assert.equal(L.percentToLetter(59.9), 'F');
  });
});

describe('percentToGpa', () => {
  it('gives unweighted points', () => {
    assert.equal(L.percentToGpa(95), 4.0);
    assert.equal(L.percentToGpa(90), 3.7);
    assert.equal(L.percentToGpa(83), 3.0);
    assert.equal(L.percentToGpa(67), 1.3);
    assert.equal(L.percentToGpa(10), 0);
  });
  it('averages and rounds', () => {
    assert.equal(L.averageGpa([95, 90, 83]), 3.57);
    assert.equal(L.averageGpa([]), 0);
  });
});

describe('letterBadgeClass', () => {
  it('colors letters like the old app', () => {
    assert.equal(L.letterBadgeClass('A-'), 'badge-green');
    assert.equal(L.letterBadgeClass('B'), 'badge-blue');
    assert.equal(L.letterBadgeClass('D'), 'badge-amber');
    assert.equal(L.letterBadgeClass('F'), 'badge-red');
  });
});

describe('priorityTier', () => {
  it('Focus < 80, Watch < 90, else Solid', () => {
    assert.equal(L.priorityTier(79).name, 'Focus');
    assert.equal(L.priorityTier(80).name, 'Watch');
    assert.equal(L.priorityTier(89.9).name, 'Watch');
    assert.equal(L.priorityTier(90).name, 'Solid');
    assert.equal(L.priorityTier(null).name, 'Unknown');
  });
});

describe('pointsToNextLetter (landing only)', () => {
  it('counts up to the next cutoff', () => {
    assert.deepEqual(L.pointsToNextLetter(77), { letter: 'B-', points: 3 });
    assert.deepEqual(L.pointsToNextLetter(59), { letter: 'D', points: 1 });
    assert.deepEqual(L.pointsToNextLetter(92), { letter: 'A', points: 1 });
    assert.equal(L.pointsToNextLetter(93), null);
  });
});

const base = { yearStart: '2026-08-10', yearEnd: '2027-06-16', dayNames: ['Blue', 'Green'], daysOff: [] };

describe('dayInfo', () => {
  it('first school day is Blue, next Green, alternating', () => {
    assert.equal(L.dayInfo('2026-08-10', base).name, 'Blue');
    assert.equal(L.dayInfo('2026-08-11', base).name, 'Green');
    assert.equal(L.dayInfo('2026-08-12', base).name, 'Blue');
  });
  it('weekend skipped', () => {
    assert.equal(L.dayInfo('2026-08-15', base).status, 'weekend');
    assert.equal(L.dayInfo('2026-08-17', base).name, 'Green');
  });
  it('day off is not counted', () => {
    const y = { ...base, daysOff: ['2026-08-11'] };
    assert.equal(L.dayInfo('2026-08-11', y).status, 'off');
    assert.equal(L.dayInfo('2026-08-12', y).name, 'Green');
  });
  it('outside the year is none', () => {
    assert.equal(L.dayInfo('2026-08-09', base).status, 'none');
    assert.equal(L.dayInfo('2027-07-01', base).status, 'none');
  });
  it('no day names gives null name', () => {
    const y = { ...base, dayNames: [] };
    assert.deepEqual(L.dayInfo('2026-08-12', y), { status: 'school', name: null, schoolDay: 3 });
  });
  it('three-name cycle', () => {
    const y = { ...base, dayNames: ['A', 'B', 'C'] };
    assert.equal(L.dayInfo('2026-08-13', y).name, 'A');
  });
});

describe('helpers', () => {
  it('parseDayNames', () => {
    assert.deepEqual(L.parseDayNames('Blue, Green'), ['Blue', 'Green']);
    assert.deepEqual(L.parseDayNames('A/B'), ['A', 'B']);
    assert.deepEqual(L.parseDayNames(''), []);
  });
  it('monthCells pads to weekday', () => {
    const c = L.monthCells(2026, 10);
    assert.equal(c[0], '2026-11-01');
    assert.equal(c.length, 30);
    assert.equal(L.monthCells(2026, 7)[0], null);
  });
  it('validateSetup', () => {
    assert.ok(L.validateSetup('', 'a', 'b'));
    assert.ok(L.validateSetup('X', '2026-08-10', '2026-08-01'));
    assert.equal(L.validateSetup('X', '2026-08-10', '2027-06-01'), null);
  });
});
