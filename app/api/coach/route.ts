import { BASE_RULES, tierForHours } from "@/lib/tiers";
import { parsePreferences, preferenceInstructions, type MissionPreferences } from "@/lib/preferences";

const MODELS = ["gemma-4-26b-a4b-it", "gemma-4-31b-it"];
const MODEL_TIMEOUT_MS = 12_000;

export async function POST(req: Request) {
  let hours: number;
  let preferences: MissionPreferences;
  try {
    const body = await req.json();
    hours = body.hours;
    if (typeof hours !== "number") throw new Error("bad hours");
    if (!Number.isFinite(hours) || hours < 0 || hours > 24) throw new Error("bad hours");
    preferences = parsePreferences(body.preferences);
  } catch {
    return Response.json({ error: "Send hours from 0–24 and preferences with minutes (5, 10, or 15), movement (walk or nearby), and tone (gentle or spicy)." }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_AI_STUDIO_KEY;
  if (!apiKey) {
    return Response.json({ error: "Missing GOOGLE_AI_STUDIO_KEY. Copy .env.example to .env and add your free AI Studio key." }, { status: 500 });
  }

  const tier = tierForHours(hours);

  const requestBody = JSON.stringify({
    systemInstruction: { parts: [{ text: `${preferences.tone === "gentle" ? BASE_RULES : tier.systemPrompt}\n${preferenceInstructions(preferences)}` }] },
    contents: [
      {
        parts: [
          {
            text: `My screen time today is ${hours} hours. Coach me. Keep each field under 40 words. Return exactly one JSON object with string fields "roast" and "mission" and no surrounding text.`,
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
    return Response.json(
      { error: "Model call failed. Please try again." },
      { status: 502 }
    );
  }

  const parts: Array<{ text?: string; thought?: boolean }> = data?.candidates?.[0]?.content?.parts ?? [];
  // Thinking models may split the final answer across several non-thinking parts.
  const raw = parts
    .filter((part) => !part.thought && typeof part.text === "string")
    .map((part) => part.text)
    .join("");
  if (!raw) {
    return Response.json({ error: "Empty model response." }, { status: 502 });
  }

  let parsed: { roast: string; mission: string };
  try {
    const json = raw.match(/\{[\s\S]*\}/)?.[0] ?? raw;
    parsed = JSON.parse(json);
    if (typeof parsed.roast !== "string" || typeof parsed.mission !== "string") {
      throw new Error("Missing expected fields");
    }
  } catch {
    return Response.json({ error: "Model returned non-JSON.", raw: raw.slice(0, 300) }, { status: 502 });
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
