import type { TierId } from "./tiers";
import type { MissionPreferences } from "./preferences";

export interface CoachResult {
  tier: TierId;
  label: string;
  emoji: string;
  roast: string;
  mission: string;
  preferences: MissionPreferences;
}

export interface Progress { count: number; last: string; }
export interface SavedMission {
  version: 1;
  id: string;
  startedAt: string;
  status: "active" | "completed" | "abandoned";
  result: CoachResult;
  progress: Progress;
}
export const MISSION_KEY = "tgc-mission";
type Store = Pick<Storage, "getItem" | "setItem">;

export function readMission(store: Store): SavedMission | null {
  const raw = store.getItem(MISSION_KEY);
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    const r = value?.result;
    const p = r?.preferences;
    if (value?.version !== 1 || typeof value.id !== "string" || !value.id ||
      typeof value.startedAt !== "string" || !Number.isFinite(Date.parse(value.startedAt)) ||
      !["active", "completed", "abandoned"].includes(value.status) ||
      !["seedling", "sprout", "weed", "feral"].includes(r?.tier) ||
      ![r?.label, r?.emoji, r?.roast, r?.mission].every(text => typeof text === "string" && text.trim()) ||
      ![5, 10, 15].includes(p?.minutes) || !["walk", "nearby"].includes(p?.movement) || !["gentle", "spicy"].includes(p?.tone) ||
      !Number.isSafeInteger(value.progress?.count) || value.progress.count < 0 || typeof value.progress.last !== "string") return null;
    return value as SavedMission;
  } catch { return null; }
}

export function startMission(store: Store, result: CoachResult, progress: Progress): SavedMission {
  const existing = readMission(store);
  if (existing?.status === "active") return existing;
  const saved: SavedMission = { version: 1, id: crypto.randomUUID(), startedAt: new Date().toISOString(), status: "active", result, progress: existing?.progress ?? progress };
  store.setItem(MISSION_KEY, JSON.stringify(saved));
  return saved;
}

/** Save the terminal state and progress together, so repeat clicks/reloads cannot credit twice. */
export function finishMission(store: Store, id: string, status: "completed" | "abandoned", now = new Date()): SavedMission | null {
  const current = readMission(store);
  if (!current || current.id !== id || current.status !== "active") return current;
  const today = now.toDateString();
  const progress = status === "completed"
    ? { count: current.progress.count + (current.progress.last === today ? 0 : 1), last: today }
    : current.progress;
  const saved = { ...current, status, progress };
  store.setItem(MISSION_KEY, JSON.stringify(saved));
  return saved;
}
