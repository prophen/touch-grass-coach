import { tierForHours } from "@/lib/tiers";

const MODEL = "gemma-4-31b-it";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

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

  const upstream = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: tier.systemPrompt }] },
      contents: [
        {
          parts: [
            {
              text: `My screen time today is ${hours} hours. Coach me.`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.9,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!upstream.ok) {
    const detail = await upstream.text();
    return Response.json(
      { error: "Model call failed.", detail: detail.slice(0, 300) },
      { status: 502 }
    );
  }

  const data = await upstream.json();
  const raw: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) {
    return Response.json({ error: "Empty model response." }, { status: 502 });
  }

  let parsed: { roast: string; mission: string };
  try {
    parsed = JSON.parse(raw);
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
