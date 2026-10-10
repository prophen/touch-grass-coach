---
title: "Touch Grass Coach: a chaotic garden that wants you to close the app"
published: false
tags: devchallenge, hf26challenge, gemma, nextjs
---

*This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 1: Touch Grass](https://dev.to/challenges/hacktoberfest-week1-2026-10-05).*

## What I Built

Touch Grass Coach turns a screen-time confession into one small outdoor mission. It is for the person who wants to take a break but keeps negotiating with the next tab.

Choose your screen time, five to fifteen minutes, a walk or one nearby outdoor spot, and gentle or spicy coaching. Gemma writes a short response and a concrete mission. Four garden mascots give the different screen-time tiers a face: Pip, Sprig, Scruff, and Goblin.

The important button is “Let's go outside.” It saves the mission and changes the app into a quiet reminder to pocket your phone. You can close the app and return to complete or abandon that same mission. Each completion grows a plant in your chaotic garden. The garden stays even when your streak resets.

There is no account, leaderboard, or endless feed. The reward is something small to come back to, after doing something away from the screen.

## Demo

[Try Touch Grass Coach](https://touch-grass-coach.vercel.app).

[See the captured walkthrough](https://github.com/prophen/touch-grass-coach/blob/main/docs/demo/README.md): choose preferences, get a mission, leave the app, return, and inspect your new plant. The completion shown in the walkthrough is a UI demonstration, not evidence of an outdoor trial.

## Code

{% github prophen/touch-grass-coach %}

## How I Built It

The app uses Next.js, React, TypeScript, illustrated mascot assets, CSS animations, and browser storage. The server calls Google's hosted AI Studio API with Gemma: `gemma-4-26b-a4b-it`, with `gemma-4-31b-it` as a fallback.

Gemma is at the center of the coaching interaction. The server combines the selected tier's persona with validated time, movement, and tone preferences. It asks for two short JSON fields: a response and an outdoor mission. Gentle mode uses supportive instructions instead of the roast persona. The mission duration includes leaving and returning.

The browser sends screen hours, preferences, and up to three recent completed mission texts to the server, which forwards them to Google. The API key stays on the server. Mission dates, IDs, progress, and sound preferences stay on the device. This version does not send precise location or photographs to the model.

The coach keeps the last ten completed missions locally. It supplies the latest three texts as untrusted historical data, asking Gemma to suggest a different activity while respecting today's time, movement, and tone choices. Variety is a prompt preference, not a guarantee. The app explains this sharing before coaching and lets you inspect or clear the remembered tasks. Clearing history keeps your plants, streak, and current mission; it cannot erase text already sent to Google. A new completion begins building fresh memory.

The model suggests the activity; ordinary code owns the progress. Starting a mission persists it before showing the outside view. Completing it saves the terminal state and progress together, so another click or a reload cannot award the same plant again. Consecutive-day streaks use the local calendar; multiple missions on one day increase the total without increasing the streak twice.

Failures get explicit retry states. Requests have time limits and bounded bodies, generated responses are checked, and the public deployment has a shared API rate-limit rule. Sound is optional and starts off. Reduced-motion settings disable the celebratory movement.

Codex helped implement and check the app, including the mission persistence, visual iterations, and submission materials. The repository records the changes as small pull requests.

## Why Does Open Innovation Matter?

Gemma's open weights offer a path to changing how inference is hosted while retaining the central product idea. The personas and preference instructions are visible in the repository, and the model choice is explicit in the server route. A future version could explore a different serving provider or local inference rather than rebuilding the coaching experience around one proprietary model family.

That possibility is different from what this release actually does: inference is hosted by Google and new missions require internet access. I did not fine-tune Gemma, run it locally, or benchmark it against a closed model. Its practical contribution here is a short, varied mission expressed through a garden character, with simple application code around it.

Using an open-weight model does not make every component open or remove hosted-service terms. It makes the model's role clearer and gives the project room to experiment beyond this first hosted implementation.

## What I Learned

The challenging part was keeping the game honest. A streak, a mission count, and a plant reward sound similar until you finish two missions in one day or reopen the app after midnight. Separating those concepts made the reward predictable.

The other design constraint was leaving. The app should make the screen the shortest part of the experience. I put the personality around choosing and returning; the active mission view keeps the task readable and encourages closing the phone.

There are deliberate limits. Missions are model suggestions, not mechanically guaranteed routes or timings. Older plants do not have individual completion dates because the original progress record did not store them. Browser data can be cleared, taking the garden with it. Saved missions restore locally, but this is not an offline-installed app.

<!-- OPTIONAL OUTDOOR TRIAL: Add only firsthand observations supplied by the builder. Record the chosen preferences, actual mission, elapsed time, and any change prompted by the trial. No outdoor trial has been documented in this draft. -->

## Prize Categories

Best Use of Gemma — Gemma generates the personalized coaching response and outdoor mission at the core of the app.

<!-- BEFORE PUBLISHING: Review the draft in your own voice. Upload selected screenshots to DEV if desired; repo-relative image paths will not work when pasted into DEV. Confirm the walkthrough PR is merged and its links resolve. Credit any human collaborators by their DEV handles. Agent-session sharing is optional; no private session is shared by this draft. -->
