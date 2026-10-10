import test from 'node:test';
import assert from 'node:assert/strict';
import { MISSION_KEY, EMPTY_PROGRESS, readMission, startMission, finishMission, normalizeProgress, localDay, creditMission, currentStreak } from '../lib/mission.ts';

const result = { tier: 'sprout', label: 'Sprout', emoji: '🌿', roast: 'Time for fresh air.', mission: 'Notice a cloud from your doorstep.', preferences: { minutes: 5, movement: 'nearby', tone: 'gentle' } };
function store() {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}

test('started mission restores exactly after reopening and cannot be replaced while active', () => {
  const storage = store();
  const saved = startMission(storage, result, { count: 2, last: '' });
  assert.deepEqual(readMission(storage), saved);
  assert.equal(startMission(storage, { ...result, mission: 'Different mission' }, saved.progress).id, saved.id);
});

test('completion is credited once across repeat clicks and reloads', () => {
  const storage = store();
  const saved = startMission(storage, result, { count: 2, last: '' });
  const now = new Date(2026, 9, 10, 12);
  const completed = finishMission(storage, saved.id, 'completed', now);
  assert.equal(completed.status, 'completed');
  assert.equal(completed.progress.count, 1);
  assert.equal(completed.progress.totalMissions, 1);
  assert.equal(readMission(storage).status, 'completed');
  assert.deepEqual(finishMission(storage, saved.id, 'completed', now), completed);
  assert.deepEqual(finishMission(storage, saved.id, 'abandoned', now), completed);
});

test('a second mission on the same day does not increase the existing daily counter', () => {
  const storage = store();
  const now = new Date(2026, 9, 10, 12);
  const saved = startMission(storage, result, { count: 3, last: now.toDateString() });
  assert.equal(finishMission(storage, saved.id, 'completed', now).progress.count, 1);
});

test('abandonment persists without credit and a stale action cannot finish a newer mission', () => {
  const storage = store();
  const progress = { count: 2, last: '' };
  const old = startMission(storage, result, progress);
  const abandoned = finishMission(storage, old.id, 'abandoned');
  assert.deepEqual(abandoned.progress, normalizeProgress(progress));
  assert.equal(readMission(storage).status, 'abandoned');
  const newer = startMission(storage, result, progress);
  assert.notEqual(newer.id, old.id);
  assert.deepEqual(finishMission(storage, old.id, 'completed'), newer);
});

test('failed persistence leaves the mission active and progress unchanged', () => {
  const storage = store();
  const saved = startMission(storage, result, { count: 2, last: '' });
  const broken = { getItem: storage.getItem, setItem() { throw new Error('Quota exceeded'); } };
  assert.throws(() => finishMission(broken, saved.id, 'completed'));
  assert.deepEqual(readMission(storage), saved);
});

test('malformed saved data is ignored safely', () => {
  const storage = store();
  for (const raw of ['{', 'null', '{}', JSON.stringify({ version: 1, result })]) {
    storage.setItem(MISSION_KEY, raw);
    assert.equal(readMission(storage), null);
  }
});

test('consecutive days grow the streak while repeat same-day missions only grow totals', () => {
  const first = creditMission(EMPTY_PROGRESS, new Date(2026, 9, 9, 12));
  const second = creditMission(first, new Date(2026, 9, 9, 23));
  const third = creditMission(second, new Date(2026, 9, 10, 0));
  assert.equal(second.count, 1);
  assert.equal(second.totalMissions, 2);
  assert.equal(third.count, 2);
  assert.equal(third.totalMissions, 3);
  assert.deepEqual(third.completionDates, ['2026-10-09', '2026-10-10']);
});

test('a missed day expires the displayed streak and the next completion starts at one', () => {
  const first = creditMission(EMPTY_PROGRESS, new Date(2026, 9, 9, 12));
  assert.equal(currentStreak(first, new Date(2026, 9, 10, 12)), 1);
  assert.equal(currentStreak(first, new Date(2026, 9, 11, 0)), 0);
  const next = creditMission(first, new Date(2026, 9, 11, 12));
  assert.equal(next.count, 1);
  assert.equal(next.totalMissions, 2);
});

test('calendar adjacency handles daylight saving, leap days and year boundaries', () => {
  for (const [before, after] of [
    [new Date(2026, 2, 7, 12), new Date(2026, 2, 8, 12)],
    [new Date(2026, 9, 31, 12), new Date(2026, 10, 1, 12)],
    [new Date(2028, 1, 28, 12), new Date(2028, 1, 29, 12)],
    [new Date(2026, 11, 31, 12), new Date(2027, 0, 1, 12)],
  ]) assert.equal(creditMission(creditMission(EMPTY_PROGRESS, before), after).count, 2);
});

test('migration preserves credited days without inventing mission totals or streak history', () => {
  const migrated = normalizeProgress({ count: 9, last: new Date(2026, 9, 9, 12).toDateString() });
  assert.equal(migrated.legacyDays, 9);
  assert.equal(migrated.totalMissions, 0);
  assert.equal(migrated.count, 1);
  assert.equal(migrated.last, '2026-10-09');
  assert.deepEqual(normalizeProgress(migrated), migrated);
});

test('finishing after midnight credits the completion day rather than the start day', () => {
  const storage = store();
  const initial = creditMission(EMPTY_PROGRESS, new Date(2026, 9, 9, 12));
  const saved = startMission(storage, result, initial);
  const completed = finishMission(storage, saved.id, 'completed', new Date(2026, 9, 10, 0, 1));
  assert.equal(completed.progress.last, '2026-10-10');
  assert.equal(completed.progress.count, 2);
  assert.equal(completed.progress.totalMissions, 2);
});
