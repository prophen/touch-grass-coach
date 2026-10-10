import type { MissionMemory } from "@/lib/mission-history";

export function CoachMemory({ history, onClear, disabled, notice }: {
  history: MissionMemory[];
  onClear: () => void;
  disabled: boolean;
  notice: string;
}) {
  return <section className="coach-memory" aria-labelledby="memory-title">
    <h2 id="memory-title">A coach with a little memory</h2>
    <p>We keep your last 10 completed missions on this device. When you ask for coaching, up to 3 recent mission texts go to Google with your screen hours and preferences to help Gemma suggest something different. Dates and mission IDs stay here. Variety isn’t guaranteed.</p>
    <details><summary>{history.length ? `${history.length} remembered ${history.length === 1 ? "mission" : "missions"}` : "No completed missions remembered yet"}</summary>
      {history.length > 0 && <ol>{[...history].reverse().map(entry => <li key={entry.id}><time dateTime={entry.completedOn}>{entry.completedOn}</time><p>{entry.mission}</p></li>)}</ol>}
    </details>
    <button className="clear-memory" onClick={onClear} disabled={disabled || history.length === 0}>Clear coaching history</button>
    <p className="memory-footnote">Clearing history keeps your plants, streak, and current mission. It cannot erase text already sent to Google.</p>
    {notice && <p role="status">{notice}</p>}
  </section>;
}
