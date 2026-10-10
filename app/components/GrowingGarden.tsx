import { gardenPlants } from "@/lib/garden";
import { useState } from "react";

function Plant({ kind }: { kind: number }) {
  return <svg viewBox="0 0 80 100" aria-hidden="true" focusable="false" className="garden-plant">
    <g stroke="#1a2e1f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M40 86 Q44 63 40 42" fill="none" />
      <path d="M41 72 Q14 70 18 53 Q35 51 41 72Z" fill="#a8ce45" />
      <path d="M41 61 Q65 63 65 44 Q45 41 41 61Z" fill="#76b66c" />
      {kind === 1 ? <path d="M40 45 Q16 38 26 19 Q44 19 40 45Z M40 45 Q64 35 56 17 Q38 17 40 45Z" fill="#b8de4c" /> : kind === 3 ? <path d="M16 86 L10 56 L32 74 L30 30 L45 66 L64 38 L58 80 L73 64 L66 86Z" fill="#82bc4b" /> : <>
        <path d="M40 43 C20 49 18 34 28 29 C12 15 31 8 38 20 C42 0 59 11 52 24 C73 19 74 38 55 39 C65 57 43 61 40 43Z" fill={kind === 0 ? "#fff4c1" : "#f5a6b5"} />
        <circle cx="42" cy="32" r="10" fill="#f4bd4f" />
      </>}
      <path d="M13 88 Q40 81 68 88" fill="none" stroke="#866549" />
    </g>
  </svg>;
}

export function GrowingGarden({ total, celebrating = false, latestDate }: { total: number; celebrating?: boolean; latestDate?: string }) {
  const [selected, setSelected] = useState<number | null>(null);
  const plants = gardenPlants(total);
  const plant = plants.find(p => p.number === selected);
  return <section className="card growing-garden" aria-labelledby="garden-title">
    <div className="garden-heading"><h2 id="garden-title">Your little patch of chaos</h2><span>{total} {total === 1 ? "plant" : "plants"}</span></div>
    <p className="garden-caption">One completed mission. One new plant. All yours.</p>
    <div className="garden-plot">
      {plants.length ? <ul className="garden-plants" aria-label="Plants earned from completed missions">
        {plants.map(plant => <li key={plant.number} className={celebrating && plant.number === total ? "garden-new-plant" : undefined}><button className="plant-button" aria-label={`${plant.name}, earned for mission ${plant.number}`} aria-pressed={selected === plant.number} onClick={() => setSelected(selected === plant.number ? null : plant.number)}><Plant kind={plant.kind} /></button></li>)}
      </ul> : <div className="garden-empty"><span aria-hidden="true">✧</span><p>A little dirt. A lot of potential.</p><p>Complete your first outdoor mission to plant something here.</p></div>}
    </div>
    {plant && <div className="plant-story" role="status"><strong>{plant.name} · Mission {plant.number}</strong><p>{["Grown from actual fresh air.", "Small leaves. Big outdoor energy.", "Proof you escaped the scroll.", "Rooting for your next adventure."][plant.kind]}</p>{plant.number === total && latestDate && <p>Planted on <time dateTime={latestDate}>{new Date(`${latestDate}T12:00:00`).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}</time>.</p>}</div>}
    {total > 12 && <p className="garden-caption">Showing your newest 12 plants. All {total} are saved in your garden count.</p>}
    <p className="garden-caption">Saved on this device. Your plants stay, even if your streak resets.</p>
  </section>;
}
