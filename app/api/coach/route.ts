import { tierForHours } from "@/lib/tiers";

const MODELS = ["gemma-4-31b-it", "gemma-4-26b-a4b-it"];

export async function POST(req: Request) {
  const apiKey = process.env.GOOGLE_AI_STUDIO_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Missing GOOGLE_AI_STUDIO_KEY. Copy .env.example to .env and add your free AI Studio key." },
      { status: 500 }
    );
  }

  let hours: number;
  try {
    const body = await req.json();
    hours = Number(body.hours);
    if (!Number.isFinite(hours) || hours < 0 || hours > 24) throw new Error("bad hours");
  } catch {
    return Response.json({ error: "Send { hours: 0-24 }." }, { status: 400 });
  }

  const tier = tierForHours(hours);

  const requestBody = JSON.stringify({
    systemInstruction: { parts: [{ text: tier.systemPrompt }] },
    contents: [
      {
        parts: [
          {
            text: `My screen time today is ${hours} hours. Coach me. Return exactly one JSON object with string fields "roast" and "mission" and no surrounding text.`,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.9,
      thinkingConfig: {
        thinkingLevel: "minimal",
      },
    },
  });

  let upstream: Response | undefined;
  for (const model of MODELS) {
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
        }
      );
    } catch (error) {
      console.error(`${model} request failed:`, error);
      continue;
    }

    if (upstream.ok || upstream.status < 500) break;
    console.error(`${model} returned ${upstream.status}; trying fallback model.`);
  }

  if (!upstream) {
    return Response.json({ error: "Could not reach the model service." }, { status: 502 });
  }

  if (!upstream.ok) {
    const detail = await upstream.text();
    console.error(`Gemma returned ${upstream.status}:`, detail);
    return Response.json(
      { error: "Model call failed.", detail: detail.slice(0, 300) },
      { status: 502 }
    );
  }

  const data = await upstream.json();
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
  });
}
