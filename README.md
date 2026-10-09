# Touch Grass Coach

Log your screen time. Get roasted by an open-weight model. Go outside.

Built for Hacktoberfest Week 1 (2026): theme "Touch Grass", open-weight models at the core. The coach is **Gemma** (`gemma-4-31b-it`) running on Google's free AI Studio tier. No downloads, no GPU, no disk space needed.

## How it works

1. You drag a slider to log today's screen time (0-12h).
2. Your hours pick one of four roast tiers: Seedling, Sprout, Weed, Feral.
3. The tier's system prompt goes to Gemma via the AI Studio `generateContent` endpoint, which returns a roast plus one concrete 15-minute outdoor mission.
4. You go outside, come back, hit "I touched grass", and your streak (localStorage, no account) grows.

The API key never leaves the server: the browser talks to `/api/coach`, which calls Google.

## Run it

```bash
cp .env.example .env
# paste a free key from https://aistudio.google.com/apikey
npm install
npm run dev
```

Open http://localhost:3000.

## Deploy

Any Next.js host works. Set `GOOGLE_AI_STUDIO_KEY` in the host's env vars. Vercel is the one-click path.

## Write-up angles (for the DEV post)

- Why an open-weight model: Gemma via AI Studio's free tier means the whole build costs $0 and runs on a laptop with no disk space to spare.
- The tier system is the real design: four personas in system prompts, one model. Comedy lives in the prompt, not the parameters.
- Honest notes: where the model is funniest, where JSON mode saves you, and what happens when you ask for a mission in the rain.
