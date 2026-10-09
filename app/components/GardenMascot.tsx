import type { TierId } from "@/lib/tiers";
import "./garden-mascot.css";

export const MASCOT_NAMES: Record<TierId, string> = {
  seedling: "Pip",
  sprout: "Sprig",
  weed: "Scruff",
  feral: "Goblin",
};

/** Transparent illustrated asset with a lightweight CSS idle loop. */
export function GardenMascot({ tier, size = 220, paused = false }: {
  tier: TierId;
  size?: number;
  paused?: boolean;
}) {
  return (
    <span className={`garden-mascot garden-mascot--${tier}${paused ? " garden-mascot--paused" : ""}`}
      style={{ width: size, maxWidth: "100%" }} role="img"
      aria-label={`${MASCOT_NAMES[tier]}, the ${tier} garden mascot`}>
      <span className="garden-mascot__shadow" />
      <span className="garden-mascot__sprite" />
    </span>
  );
}
