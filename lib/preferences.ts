export interface MissionPreferences {
  minutes: 5 | 10 | 15;
  movement: "walk" | "nearby";
  tone: "gentle" | "spicy";
}

export const DEFAULT_PREFERENCES: MissionPreferences = { minutes: 15, movement: "walk", tone: "spicy" };

export function parsePreferences(value: unknown): MissionPreferences {
  if (value === undefined) return { ...DEFAULT_PREFERENCES };
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid preferences");
  const { minutes, movement, tone } = value as Record<string, unknown>;
  if (![5, 10, 15].includes(minutes as number) || (movement !== "walk" && movement !== "nearby") || (tone !== "gentle" && tone !== "spicy")) {
    throw new Error("Choose 5, 10, or 15 minutes, walk or nearby, and gentle or spicy coaching.");
  }
  return { minutes: minutes as MissionPreferences["minutes"], movement, tone };
}

export function preferenceInstructions(preferences: MissionPreferences): string {
  return `Mission constraints:
- The entire mission, including going out and returning, must take ${preferences.minutes} minutes or less. Never ask for a longer activity.
- ${preferences.movement === "nearby"
    ? "Stay nearby: choose an outdoor observation possible while sitting or standing in one spot just outside, on a doorstep, patio, or balcony. No walking, route, distance target, or trip to another location."
    : "Walking is welcome: choose a short outdoor walk or discovery near home. No driving, distant destinations, special gear, or purchases."}
- ${preferences.tone === "gentle"
    ? "Gentle coaching: be warm, encouraging, and playful. No insults, shaming, guilt, harsh judgment, or commands. The roast field should be an affectionate nudge and the mission an invitation."
    : "Spicy coaching: use the tier's funny, theatrical roast personality, while remaining kind and never cruel about real struggles."}`;
}
