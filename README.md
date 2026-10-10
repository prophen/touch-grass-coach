# Touch Grass Coach

Log your screen time. Get roasted by an open-weight model. Go outside.

Built for Hacktoberfest Week 1 (2026): theme "Touch Grass", open-weight models at the core. The coach is **Gemma** (`gemma-4-26b-a4b-it`) running on Google's free AI Studio tier, with `gemma-4-31b-it` as a fallback. No downloads, no GPU, no disk space needed.

## How it works

1. You drag a slider to log today's screen time (0-12h).
   Choose a 5, 10, or 15-minute mission, take a walk or stay in one nearby outdoor spot, and pick gentle or spicy coaching.
2. Your hours pick one of four roast tiers: Seedling, Sprout, Weed, Feral.
3. The tier's system prompt goes to Gemma via the AI Studio `generateContent` endpoint, which returns a roast plus one concrete 15-minute outdoor mission.
4. Tap "Let's go outside" to save the mission on this device and enter a simple "Pocket your phone" view. Close the app, go outside, and reopen it to finish or abandon the same mission.
5. Completing a mission saves its terminal state, total completed missions, completion dates, and consecutive-day streak together in localStorage, preventing repeat completion after reload. Each completed mission adds to the total; multiple missions in one local calendar day only count once toward the streak. A missed day resets the streak, and abandoning leaves progress unchanged. No account is required.

Older progress is migrated when read: previously credited outdoor days remain visible separately. Because older versions did not record every date or repeat mission, the migrated streak begins from the last recorded day and mission totals start from this update. Stored dates use the device's local calendar, with calendar-day comparisons that handle daylight-saving changes. Streaks refresh on returning to the app and at least once per minute while open.

The API key never leaves the server: the browser talks to `/api/coach`, which calls Google.

Mission preferences are validated by the server and included in Gemma's instructions. Gentle mode replaces the tier's roast persona with supportive coaching; spicy mode keeps the original tier personality. The time limit includes going out and returning. Generated missions remain model suggestions, so these constraints are prompted rather than mechanically guaranteed. Requests without preferences retain the original 15-minute, walking, spicy defaults.

Preference checks: `node --experimental-strip-types --test tests/preferences.test.mjs` (Node 22.6+).
Mission persistence checks: `node --experimental-strip-types --test tests/mission.test.mjs`.
Garden checks: `node --experimental-strip-types --test tests/garden.test.mjs`.

Your garden earns one illustrated plant per recorded completed mission, cycling through daisies, sprouts, wildflowers, and grass tufts. Rewards derive from the saved mission total, so repeat completion cannot add duplicate plants and no separate reward ledger is required. Existing recorded missions get plants automatically. The newest 12 plants are displayed, with the full count retained. Plants survive missed days and reloads; a brief mascot celebration plays only for a fresh completion and respects reduced-motion settings. Clearing browser data clears the garden too.

Active missions are stored locally under `tgc-mission`, including their preferences and current progress. They restore without another AI request. Storage failures keep the mission on screen and show a retry message; clearing browser data removes saved missions and progress. Starting another mission while one is active resumes the existing one. Other tabs synchronize saved changes.

Generation uses minimal thinking and a 256-token output cap for short replies. Each model attempt has a 12-second deadline, including reading the response; a timeout or server error tries the fallback. Provider load can still affect response time.

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
