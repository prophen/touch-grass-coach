import test from 'node:test';
import assert from 'node:assert/strict';
import { MISSION_KEY, readMission, startMission, finishMission } from '../lib/mission.ts';

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
  assert.equal(completed.progress.count, 3);
  assert.equal(readMission(storage).status, 'completed');
  assert.deepEqual(finishMission(storage, saved.id, 'completed', now), completed);
  assert.deepEqual(finishMission(storage, saved.id, 'abandoned', now), completed);
});

test('a second mission on the same day does not increase the existing daily counter', () => {
  const storage = store();
  const now = new Date(2026, 9, 10, 12);
  const saved = startMission(storage, result, { count: 3, last: now.toDateString() });
  assert.equal(finishMission(storage, saved.id, 'completed', now).progress.count, 3);
});

test('abandonment persists without credit and a stale action cannot finish a newer mission', () => {
  const storage = store();
  const progress = { count: 2, last: '' };
  const old = startMission(storage, result, progress);
  const abandoned = finishMission(storage, old.id, 'abandoned');
  assert.deepEqual(abandoned.progress, progress);
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
