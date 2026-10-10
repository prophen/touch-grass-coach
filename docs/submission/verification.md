# Submission verification

Current merged release: `53f82762ad9607a9d91330461ba381cd90ce5fd3` (merged PR #10).

All 26 tests passed after merging main into this submission branch. PR #10's local browser verification showed a leaf mission changing to a stone-finding activity, and clearing history during an active mission surviving reload without losing the task. The added memory screenshot documents that local build. Repetition remains possible because variety is prompted.

## Earlier public walkthrough

Release: `c745f86badea20cb8df326d3baed11b82ec8bdb6` (merged PR #8).
Production deployment: `dpl_DQdTCu8a2UcN14XNwq4NXmfcU9ca`, reported READY by Vercel.

- Public URL opened without a login: https://touch-grass-coach.vercel.app/.
- Sticker heading, sound-off control, and new loading copy visible.
- Real coaching request: 3 hours, 5 minutes, stay nearby, gentle.
- Returned mission: “Step outside your door and count how many different shades of green you can see in the nearest plant or tree.”
- Start followed by reload restored the same mission and preferences.
- Demo completion followed by reload retained exactly one mission and one plant.
- Selecting Daisy showed its personality note and completion date.
- All 21 repository tests passed while preparing the package.

Screenshots are stored in `docs/demo`. This was browser verification, with immediate demo completion. Physical outdoor testing, real-phone testing, and DEV publication remain builder steps in the checklist. No video recording is included; the package contains a screenshot walkthrough and optional narration script.
