"use client";

import { useState } from "react";
import Link from "next/link";
import { GardenMascot, MASCOT_NAMES } from "@/app/components/GardenMascot";
import { TIERS } from "@/lib/tiers";
import "./mascots.css";

const PERSONALITIES = {
  seedling: ["Small plant. Big potential.", "A gentle bob for your tiniest cheerleader."],
  sprout: ["Photosynthesis. With attitude.", "A smug sway from someone who has seen your tabs."],
  weed: ["Rooting for you. Judging you.", "A scruffy hop with barely contained side-eye."],
  feral: ["The lawn has had enough.", "A jittery dance and a dramatic rescue jump."],
};

export default function MascotGallery() {
  const [paused, setPaused] = useState(false);
  return (
    <main className="mascot-gallery">
      <nav className="mascot-gallery__nav"><Link href="/">← Back to the coach</Link><button onClick={() => setPaused(!paused)} aria-pressed={paused}>{paused ? "Play animations" : "Pause animations"}</button></nav>
      <header><p className="kicker">Meet your chaotic garden</p><h1>Four little plants.<br /><span>Increasingly big feelings.</span></h1><p>Your screen time picks the coach. The coach brings the attitude.</p></header>
      <section className="mascot-gallery__grid" aria-label="Garden mascot collection">
        {TIERS.map((tier, i) => (
          <article className={`mascot-tile mascot-tile--${tier.id}`} key={tier.id}>
            <div className="mascot-tile__top"><span>0{i + 1} / {tier.label}</span><span>{tier.id === "feral" ? "6h+" : `${tier.minHours}–${tier.maxHours}h`}</span></div>
            <GardenMascot tier={tier.id} size={280} paused={paused} />
            <h2>{MASCOT_NAMES[tier.id]}</h2><p className="mascot-tile__tagline">{PERSONALITIES[tier.id][0]}</p><p className="mascot-tile__description">{PERSONALITIES[tier.id][1]}</p>
            <a href={`/mascots/${tier.id}.png`} download>Download transparent PNG ↗</a>
          </article>
        ))}
      </section>
      <p className="mascot-gallery__note">Original illustrations · Transparent backgrounds · CSS idle loops · Reduced-motion support</p>
    </main>
  );
}
