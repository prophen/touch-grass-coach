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

export interface Progress {
  count: number;
  last: string;
  totalMissions: number;
  completionDates: string[];
  legacyDays: number;
}
export const EMPTY_PROGRESS: Progress = { count: 0, last: "", totalMissions: 0, completionDates: [], legacyDays: 0 };

// Compare calendar days independently of daylight-saving hour changes.
export function localDay(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
function dayNumber(day: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return NaN;
  const [year, month, date] = day.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1, date));
  return value.toISOString().slice(0, 10) === day ? value.getTime() / 86400000 : NaN;
}
export function currentStreak(progress: Progress, now = new Date()): number {
  const gap = dayNumber(localDay(now)) - dayNumber(progress.last);
  return gap === 0 || gap === 1 ? progress.count : 0;
}
export function normalizeProgress(value: unknown): Progress {
  const p = value as Partial<Progress> | null;
  if (!p || !Number.isSafeInteger(p.count) || p.count! < 0 || typeof p.last !== "string") return { ...EMPTY_PROGRESS, completionDates: [] };
  if (p.totalMissions === undefined) {
    // Old counters tracked credited days, not consecutive days or individual missions.
    const parsed = new Date(p.last);
    const last = Number.isFinite(dayNumber(p.last)) ? p.last : p.last && Number.isFinite(parsed.getTime()) ? localDay(parsed) : "";
    return { count: p.count! > 0 && last ? 1 : 0, last, totalMissions: 0, completionDates: last && p.count! > 0 ? [last] : [], legacyDays: p.count! };
  }
  if (!Number.isSafeInteger(p.totalMissions) || p.totalMissions! < 0 || !Number.isSafeInteger(p.legacyDays) || p.legacyDays! < 0 ||
    !Array.isArray(p.completionDates) || !p.completionDates.every(day => typeof day === "string" && Number.isFinite(dayNumber(day))) ||
    (p.last !== "" && !Number.isFinite(dayNumber(p.last)))) return { ...EMPTY_PROGRESS, completionDates: [] };
  return { count: p.count!, last: p.last, totalMissions: p.totalMissions!, completionDates: [...new Set(p.completionDates)].sort(), legacyDays: p.legacyDays! };
}

export function creditMission(progress: Progress, now = new Date()): Progress {
  const today = localDay(now);
  const gap = dayNumber(today) - dayNumber(progress.last);
  const count = gap === 0 ? progress.count : gap === 1 ? progress.count + 1 : 1;
  return { ...progress, count, last: today, totalMissions: progress.totalMissions + 1, completionDates: [...new Set([...progress.completionDates, today])].sort() };
}
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
    return { ...value, progress: normalizeProgress(value.progress) } as SavedMission;
  } catch { return null; }
}

export function startMission(store: Store, result: CoachResult, progress: Progress): SavedMission {
  const existing = readMission(store);
  if (existing?.status === "active") return existing;
  const saved: SavedMission = { version: 1, id: crypto.randomUUID(), startedAt: new Date().toISOString(), status: "active", result, progress: existing?.progress ?? normalizeProgress(progress) };
  store.setItem(MISSION_KEY, JSON.stringify(saved));
  return saved;
}

/** Save the terminal state and progress together, so repeat clicks/reloads cannot credit twice. */
export function finishMission(store: Store, id: string, status: "completed" | "abandoned", now = new Date()): SavedMission | null {
  const current = readMission(store);
  if (!current || current.id !== id || current.status !== "active") return current;
  const progress = status === "completed"
    ? creditMission(current.progress, now)
    : current.progress;
  const saved = { ...current, status, progress };
  store.setItem(MISSION_KEY, JSON.stringify(saved));
  return saved;
}
