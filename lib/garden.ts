export const PLANT_NAMES = ["Daisy", "Sprout", "Wildflower", "Grass tuft"] as const;

/** Plants are derived from saved mission credit, so a second reward ledger cannot drift. */
export function gardenPlants(totalMissions: number) {
  const total = Number.isSafeInteger(totalMissions) && totalMissions > 0 ? totalMissions : 0;
  const first = Math.max(0, total - 12);
  return Array.from({ length: Math.min(total, 12) }, (_, i) => ({
    number: first + i + 1,
    kind: (first + i) % PLANT_NAMES.length,
    name: PLANT_NAMES[(first + i) % PLANT_NAMES.length],
  }));
}
