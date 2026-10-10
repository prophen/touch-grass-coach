"use client";

import { useEffect, useRef, useState } from "react";
import { TIERS, tierForHours } from "@/lib/tiers";
import { GardenMascot, MASCOT_NAMES } from "@/app/components/GardenMascot";
import { DEFAULT_PREFERENCES, type MissionPreferences } from "@/lib/preferences";
import { GrowingGarden } from "@/app/components/GrowingGarden";

import { MISSION_KEY, EMPTY_PROGRESS, localDay, currentStreak, normalizeProgress, readMission, startMission, finishMission, type Progress, type CoachResult, type SavedMission } from "@/lib/mission";

const STREAK_KEY = "tgc-streak";

export default function Home() {
  const [hours, setHours] = useState(3);
  const [preferences, setPreferences] = useState<MissionPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CoachResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<Progress>(EMPTY_PROGRESS);
  const [today, setToday] = useState(localDay());
  const streak = currentStreak(progress, new Date(`${today}T12:00:00`));
  const touchedToday = progress.last === today;
  const [savedMission, setSavedMission] = useState<SavedMission | null>(null);
  const [ready, setReady] = useState(false);
  const [celebration, setCelebration] = useState<string | null>(null);
  const missionHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    function restore() {
    try {
      const saved = readMission(localStorage);
      setSavedMission(saved);
      const raw = localStorage.getItem(STREAK_KEY);
      if (saved || raw) {
        setProgress(saved?.progress ?? normalizeProgress(JSON.parse(raw!)));
      } else {
        setProgress(EMPTY_PROGRESS);
      }
    } catch {
      setError("Browser storage is unavailable. Enable it to save a mission before heading outside.");
    }
    setReady(true);
    }
    restore();
    function sync(event: StorageEvent) {
      if (event.key === MISSION_KEY || event.key === null) restore();
    }
    window.addEventListener("storage", sync);
    function refreshDay() { setToday(localDay()); }
    const timer = window.setInterval(refreshDay, 60_000);
    window.addEventListener("focus", refreshDay);
    document.addEventListener("visibilitychange", refreshDay);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", refreshDay);
      document.removeEventListener("visibilitychange", refreshDay);
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (savedMission?.status === "active") missionHeading.current?.focus();
  }, [savedMission?.id, savedMission?.status]);

  useEffect(() => {
    if (!celebration) return;
    const timeout = window.setTimeout(() => setCelebration(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [celebration]);

  const preview = tierForHours(hours);

  async function coachMe() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hours, preferences }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Coach is unavailable.");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function headOutside() {
    if (!result) return;
    try {
      setSavedMission(startMission(localStorage, result, progress));
      setCelebration(null);
      setError(null);
    } catch {
      setError("We couldn't save your mission. Enable browser storage and try again before closing the app.");
    }
  }

  function finish(status: "completed" | "abandoned") {
    if (!savedMission) return;
    try {
      const before = readMission(localStorage);
      const saved = finishMission(localStorage, savedMission.id, status);
      if (before?.id === savedMission.id && before.status === "active" && saved?.status === "completed" && status === "completed") setCelebration(saved.id);
      setSavedMission(saved);
      if (saved) {
        setProgress(saved.progress);
        setToday(localDay());
      }
      setResult(null);
      setError(null);
    } catch {
      setError("We couldn't save that change. Your mission is still active; please try again.");
    }
  }

  if (!ready) return <main className="page"><p role="status">Checking your garden…</p></main>;

  if (savedMission?.status === "active") return (
    <main className="page outside-page">
      <p className="kicker">Your outdoor mission</p>
      <h1 ref={missionHeading} tabIndex={-1}>Pocket your phone.<br />Go find a little green.</h1>
      <GardenMascot tier={savedMission.result.tier} size={160} paused />
      <section className="card active-mission" aria-label="Active mission">
        <p className="mission-label">{savedMission.result.preferences.minutes} minutes max · {savedMission.result.preferences.movement === "nearby" ? "Stay nearby" : "Take a walk"}</p>
        <p className="active-mission__text">{savedMission.result.mission}</p>
        <p className="outside-reassurance">{MASCOT_NAMES[savedMission.result.tier]} says: “I'll be here. Go.”</p>
      </section>
      <p className="saved-note">Mission saved on this device. You can close the app and come back when you're done.</p>
      {error && <p className="error" role="alert">{error}</p>}
      <button onClick={() => finish("completed")} className="cta secondary">I'm back — mission complete</button>
      <button onClick={() => finish("abandoned")} className="abandon-mission">Abandon this mission</button>
    </main>
  );

  return (
    <main className="page">
      <header className="hero">
        <p className="kicker">An open-weight intervention</p>
        <h1>
          Touch Grass <span className="coach">Coach</span>
        </h1>
        <p className="sub">
          Log your screen time. Get roasted by Gemma. Then go outside and prove it wrong.
        </p>
      </header>

      {savedMission?.status === "completed" && <p className="mission-outcome" role="status">Grass touched. Welcome back!{touchedToday ? " Today's progress is saved." : " Ready for a new day?"}</p>}
      {celebration && savedMission?.status === "completed" && <div className="garden-celebration" role="status"><div className="garden-celebration__mascot"><GardenMascot tier={savedMission.result.tier} size={100} paused /></div><p><strong>A new plant just moved in!</strong><br />{MASCOT_NAMES[savedMission.result.tier]} is rooting for you.</p></div>}
      {savedMission?.status === "abandoned" && <p className="mission-outcome" role="status">Mission set aside. Pick something that fits your day.</p>}

      <section className="card">
        <div style={{ textAlign: "center" }}><GardenMascot tier={preview.id} /></div>
        <label htmlFor="hours" className="label">
          Screen time today: <strong>{hours}h</strong>
        </label>
        <input
          id="hours"
          type="range"
          min={0}
          max={12}
          step={0.5}
          value={hours}
          onChange={(e) => setHours(Number(e.target.value))}
          className="slider"
        />
        <div className="tier-preview">
          <span className="tier-emoji">{preview.emoji}</span>
          <span>
            Verdict: <strong>{preview.label}</strong>
          </span>
        </div>
        <fieldset className="mission-preferences" disabled={loading}>
          <legend>Make it fit your day</legend>
          <label htmlFor="mission-minutes">Time outside
            <select id="mission-minutes" value={preferences.minutes} onChange={(e) => setPreferences({ ...preferences, minutes: Number(e.target.value) as MissionPreferences["minutes"] })}>
              <option value={5}>5 minutes</option><option value={10}>10 minutes</option><option value={15}>15 minutes</option>
            </select>
          </label>
          <label htmlFor="mission-movement">Movement
            <select id="mission-movement" value={preferences.movement} onChange={(e) => setPreferences({ ...preferences, movement: e.target.value as MissionPreferences["movement"] })}>
              <option value="walk">Take a walk</option><option value="nearby">Stay nearby</option>
            </select>
          </label>
          <label htmlFor="coach-tone">Coach energy
            <select id="coach-tone" value={preferences.tone} onChange={(e) => setPreferences({ ...preferences, tone: e.target.value as MissionPreferences["tone"] })}>
              <option value="gentle">Gentle</option><option value="spicy">Spicy</option>
            </select>
          </label>
          <p>Stay nearby keeps your mission in one outdoor spot. Gentle keeps the coach kind and encouraging.</p>
        </fieldset>
        <button onClick={coachMe} disabled={loading} className="cta">
          {loading ? "Consulting the gremlin..." : "Coach me"}
        </button>
      </section>

      {error && <p className="error" role="alert">{error}</p>}

      <div aria-live="polite" aria-atomic="true">
      {result && (
        <section className="card result">
          <div className="coach-conversation">
            <div className="coach-speaker"><GardenMascot tier={result.tier} size={130} /></div>
            <div className="speech-bubble">
              <p className="result-tier">{MASCOT_NAMES[result.tier]} · {result.label} coach</p>
              <blockquote className="roast">{result.roast}</blockquote>
            </div>
          </div>
          <div className="mission">
            <p className="mission-label">Your mission</p>
            <p className="mission-summary">{result.preferences.minutes} min max · {result.preferences.movement === "nearby" ? "Stay nearby" : "Take a walk"} · {result.preferences.tone === "gentle" ? "Gentle" : "Spicy"}</p>
            <p>{result.mission}</p>
          </div>
          <button onClick={headOutside} className="cta secondary">Let's go outside</button>
        </section>
      )}
      </div>

      <section className="streak">
        <p>
          <span className="streak-num">{streak}</span>{" "}
          {streak === 1 ? "day" : "days"} in your current streak
        </p>
        <p><strong>{progress.totalMissions}</strong> {progress.totalMissions === 1 ? "mission" : "missions"} completed</p>
        {progress.legacyDays > 0 && <p className="progress-note">{progress.legacyDays} earlier outdoor {progress.legacyDays === 1 ? "day" : "days"} preserved. Mission totals start with this update; earlier consecutive days weren't recorded.</p>}
      </section>

      <GrowingGarden total={progress.totalMissions} celebrating={Boolean(celebration)} />

      <footer className="tiers">
        {TIERS.map((t) => (
          <div key={t.id} className="tier-row">
            <span>{t.emoji}</span>
            <span>
              <strong>{t.label}</strong> · {t.minHours}–{t.maxHours}h
            </span>
          </div>
        ))}
      </footer>
      <p style={{ textAlign: "center", marginTop: "1.5rem" }}><a href="/mascots" style={{ color: "var(--grass-deep)" }}>Meet the chaotic garden ↗</a></p>
    </main>
  );
}
