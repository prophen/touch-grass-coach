import { BASE_RULES, tierForHours } from "@/lib/tiers";
import { parsePreferences, preferenceInstructions, type MissionPreferences } from "@/lib/preferences";
import { RequestLimiter, readSmallJson } from "@/lib/request-limit";
import { parseCoachResponse } from "@/lib/coach-response";
import { parseRecentMissions, memoryInstructions } from "@/lib/mission-history";

export const maxDuration = 30;
const limiter = new RequestLimiter();

const MODELS = ["gemma-4-26b-a4b-it", "gemma-4-31b-it"];
const MODEL_TIMEOUT_MS = 12_000;

export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin) return Response.json({ error: "Please request a mission from this app." }, { status: 403 });
  // Vercel overwrites x-forwarded-for. Other hosts share a local bucket until configured at the edge.
  const client = process.env.VERCEL ? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown" : "local";
  const retryAfter = limiter.check(client);
  if (retryAfter) return Response.json({ error: "The garden needs a breather. Please wait before requesting another mission.", retryAfter }, { status: 429, headers: { "Retry-After": String(retryAfter), "Cache-Control": "no-store" } });
  let hours: number;
  let preferences: MissionPreferences;
  let recentMissions: string[];
  try {
    const body = await readSmallJson(req) as { hours?: unknown; preferences?: unknown; recentMissions?: unknown };
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("bad body");
    if (typeof body.hours !== "number") throw new Error("bad hours");
    hours = body.hours;
    if (typeof hours !== "number") throw new Error("bad hours");
    if (!Number.isFinite(hours) || hours < 0 || hours > 24) throw new Error("bad hours");
    preferences = parsePreferences(body.preferences);
    recentMissions = parseRecentMissions(body.recentMissions);
  } catch (error) {
    if (error instanceof Error && error.message === "Body too large") return Response.json({ error: "That request is too large. Please use the mission controls." }, { status: 413 });
    return Response.json({ error: "Send hours from 0–24 and preferences with minutes (5, 10, or 15), movement (walk or nearby), and tone (gentle or spicy)." }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_AI_STUDIO_KEY;
  if (!apiKey) {
    return Response.json({ error: "The coach isn't configured yet. Please try again later." }, { status: 503 });
  }

  const tier = tierForHours(hours);

  const requestBody = JSON.stringify({
    systemInstruction: { parts: [{ text: `${preferences.tone === "gentle" ? BASE_RULES : tier.systemPrompt}\n${preferenceInstructions(preferences)}` }] },
    contents: [
      {
        parts: [
          {
            text: `My screen time today is ${hours} hours. I chose ${preferences.tone} coaching, ${preferences.minutes} minutes maximum, and ${preferences.movement === "nearby" ? "staying in one nearby outdoor spot" : "a short walk"}. Coach me using those preferences. Keep each field under 40 words. Return exactly one JSON object with string fields "roast" and "mission" and no surrounding text.${memoryInstructions(recentMissions)}`,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.9,
      maxOutputTokens: 256,
      thinkingConfig: {
        thinkingLevel: "minimal",
      },
    },
  });

  let upstream: Response | undefined;
  let data;
  let lastFailureWasTimeout = false;
  for (const model of MODELS) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), MODEL_TIMEOUT_MS);
    try {
      upstream = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: requestBody,
          signal: controller.signal,
        }
      );
      // Keep the deadline active while reading the response body too.
      if (upstream.ok) {
        data = await upstream.json();
        break;
      }
      if (upstream.status < 500) break;
      await upstream.body?.cancel();
    } catch (error) {
      lastFailureWasTimeout = controller.signal.aborted;
      console.error(`${model} request failed:`, error);
      upstream = undefined;
      continue;
    } finally {
      clearTimeout(timeout);
    }

    console.error(`${model} returned ${upstream.status}; trying fallback model.`);
  }

  if (!upstream) {
    return Response.json(
      { error: lastFailureWasTimeout
        ? "The coach took too long to respond. Please try again."
        : "The server could not connect to the coach. Check the server's network access and try again." },
      { status: lastFailureWasTimeout ? 504 : 502 }
    );
  }

  if (!upstream.ok) {
    console.error(`Gemma returned ${upstream.status}`);
    if (upstream.status === 429) return Response.json({ error: "The coach is busy. Please try again in a minute.", retryAfter: 60 }, { status: 429, headers: { "Retry-After": "60" } });
    return Response.json(
      { error: "The coach couldn't answer just now. Please try again." },
      { status: 502 }
    );
  }

  let parsed: { roast: string; mission: string };
  try {
    parsed = parseCoachResponse(data);
  } catch {
    return Response.json({ error: "The coach lost its train of thought. Please try again." }, { status: 502 });
  }

  return Response.json({
    tier: tier.id,
    label: tier.label,
    emoji: tier.emoji,
    roast: parsed.roast,
    mission: parsed.mission,
    preferences,
  });
}
