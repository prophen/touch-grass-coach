import test from 'node:test';
import assert from 'node:assert/strict';
import { gardenPlants } from '../lib/garden.ts';
import { EMPTY_PROGRESS, startMission, finishMission, readMission } from '../lib/mission.ts';

test('empty gardens have no plants; large gardens render only the latest 12 with stable identities', () => {
  assert.deepEqual(gardenPlants(0), []);
  assert.equal(gardenPlants(10000).length, 12);
  assert.equal(gardenPlants(10000)[0].number, 9989);
  assert.equal(gardenPlants(10000).at(-1).number, 10000);
  assert.deepEqual(gardenPlants(14).slice(0, 11), gardenPlants(13).slice(1));
});

test('only a completed mission earns a plant, which survives reload and cannot be credited twice', () => {
  const map = new Map();
  const storage = { getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, value) };
  const result = { tier: 'seedling', label: 'Seedling', emoji: '🌱', roast: 'Nice break.', mission: 'Notice a cloud.', preferences: { minutes: 5, movement: 'nearby', tone: 'gentle' } };
  const first = startMission(storage, result, EMPTY_PROGRESS);
  const abandoned = finishMission(storage, first.id, 'abandoned');
  assert.equal(gardenPlants(abandoned.progress.totalMissions).length, 0);
  const second = startMission(storage, result, abandoned.progress);
  finishMission(storage, second.id, 'completed');
  assert.equal(gardenPlants(readMission(storage).progress.totalMissions).length, 1);
  finishMission(storage, second.id, 'completed');
  assert.equal(gardenPlants(readMission(storage).progress.totalMissions).length, 1);
});
