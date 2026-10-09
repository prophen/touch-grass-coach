"use client";

import { useEffect, useState } from "react";
import { TIERS, tierForHours, type TierId } from "@/lib/tiers";

interface CoachResult {
  tier: TierId;
  label: string;
  emoji: string;
  roast: string;
  mission: string;
}

const STREAK_KEY = "tgc-streak";

export default function Home() {
  const [hours, setHours] = useState(3);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CoachResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [touchedToday, setTouchedToday] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STREAK_KEY);
      if (raw) {
        const { count, last } = JSON.parse(raw);
        const today = new Date().toDateString();
        setStreak(count ?? 0);
        setTouchedToday(last === today);
      }
    } catch {
      /* fresh start */
    }
  }, []);

  const preview = tierForHours(hours);

  async function coachMe() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hours }),
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

  function touchGrass() {
    const today = new Date().toDateString();
    const next = touchedToday ? streak : streak + 1;
    setStreak(next);
    setTouchedToday(true);
    try {
      localStorage.setItem(STREAK_KEY, JSON.stringify({ count: next, last: today }));
    } catch {
      /* ignore */
    }
  }

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

      <section className="card">
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
        <button onClick={coachMe} disabled={loading} className="cta">
          {loading ? "Consulting the gremlin..." : "Coach me"}
        </button>
      </section>

      {error && <p className="error">{error}</p>}

      {result && (
        <section className="card result">
          <p className="result-tier">
            {result.emoji} {result.label} status confirmed
          </p>
          <blockquote className="roast">{result.roast}</blockquote>
          <div className="mission">
            <p className="mission-label">Your mission</p>
            <p>{result.mission}</p>
          </div>
          <button onClick={touchGrass} disabled={touchedToday} className="cta secondary">
            {touchedToday ? "Grass touched. See you tomorrow." : "I touched grass"}
          </button>
        </section>
      )}

      <section className="streak">
        <p>
          <span className="streak-num">{streak}</span>{" "}
          {streak === 1 ? "day" : "days"} of touching grass
        </p>
      </section>

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
    </main>
  );
}
