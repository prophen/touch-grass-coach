export function parseCoachResponse(data: unknown): { roast: string; mission: string } {
  const parts = (data as { candidates?: Array<{ content?: { parts?: Array<{ text?: unknown; thought?: boolean }> } }> })?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) throw new Error("Missing answer");
  const raw = parts.filter(part => !part.thought && typeof part.text === "string").map(part => part.text).join("");
  const json = raw.match(/\{[\s\S]*\}/)?.[0] ?? raw;
  const value = JSON.parse(json);
  if (![value?.roast, value?.mission].every(text => typeof text === "string" && text.trim().length > 0 && text.length <= 1000)) throw new Error("Invalid answer");
  return { roast: value.roast.trim(), mission: value.mission.trim() };
}
