type Cue = "bubble" | "goodbye" | "plant";
let context: AudioContext | undefined;

/** Synthesized locally: no audio downloads, tracking, or background playback. */
export async function playGardenSound(cue: Cue) {
  try {
    context ??= new AudioContext();
    await context.resume();
    const now = context.currentTime;
    const notes = cue === "plant" ? [523, 659, 784] : cue === "goodbye" ? [440, 330] : [660];
    notes.forEach((frequency, index) => {
      const oscillator = context!.createOscillator();
      const gain = context!.createGain();
      const start = now + index * .09;
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, start);
      oscillator.frequency.exponentialRampToValueAtTime(frequency * .8, start + .14);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(.035, start + .015);
      gain.gain.exponentialRampToValueAtTime(.001, start + .18);
      oscillator.connect(gain); gain.connect(context!.destination);
      oscillator.start(start); oscillator.stop(start + .2);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    });
  } catch { /* Audio support or browser policy must never interrupt a mission. */ }
}
