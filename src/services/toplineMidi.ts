import { ToplineAnalysis, MidiNote, GeneratedMidiPatterns } from "../constants/types";

/**
 * Convert a ToplineAnalysis.pitchContour into standard MidiNote[].
 * - Preserves time/duration from the vocal analysis (in beats)
 * - Uses the analysed velocity when present, otherwise a default
 * - Clamps midi 21–108 to keep it within playable range
 * - Filters out obviously bad entries (NaN/negative duration)
 */
export function toplineToMidi(
  topline: ToplineAnalysis,
  opts?: { defaultVelocity?: number; maxBeats?: number }
): MidiNote[] {
  const defVel = Math.max(1, Math.min(127, opts?.defaultVelocity ?? 92));
  const maxBeats = typeof opts?.maxBeats === "number" ? opts!.maxBeats : undefined;

  const safeNum = (v: any) => (typeof v === "number" && isFinite(v) ? v : NaN);
  const clampMidi = (m: number) => Math.max(21, Math.min(108, Math.round(m)));

  const raw = (topline.pitchContour || [])
  .map((n) => {
    const time = safeNum(n.time);
    const dur = safeNum(n.duration);
    const midi = clampMidi(safeNum(n.midi));
    const velocity = Math.max(1, Math.min(127, Math.round(n.velocity ?? defVel)));
    return (time >= 0 && dur > 0 && isFinite(midi))
      ? { time, duration: dur, midi, velocity, pitch: n.pitch, name: n.lyric }
      : null;
  })
  .filter(Boolean) as MidiNote[];

// Apply smoothing to reduce jitter or extreme jumps
const smoothed: MidiNote[] = [];
for (let i = 0; i < raw.length; i++) {
  const window = raw.slice(Math.max(0, i - 1), i + 2);
  const pitches = window.map(n => n.midi).sort((a, b) => a - b);
  const medianMidi = pitches[Math.floor(pitches.length / 2)];
  const original = raw[i];

  // Reject if it's a large sudden jump (octave+)
  const prev = raw[i - 1];
  if (prev && Math.abs(original.midi - prev.midi) > 12) continue;

  smoothed.push({
    ...original,
    midi: medianMidi,
  });
}

return smoothed;

}

/**
 * Merge a topline-derived melody into existing GeneratedMidiPatterns.
 * - If patterns already contain a "topline_melody" key, preserve it.
 * - Otherwise injects one from the provided topline.
 * - Optionally trims to bars * beatsPerBar.
 *
 * You can safely call this right after you parse the model’s JSON.
 */
export function ensureToplineMelody(
  patterns: GeneratedMidiPatterns,
  topline: ToplineAnalysis,
  opts?: { bars?: number; timeSignature?: string; defaultVelocity?: number }
): GeneratedMidiPatterns & { topline_melody: MidiNote[] } {
  // already present from the model? just return a widened type
  if ((patterns as any).topline_melody && Array.isArray((patterns as any).topline_melody)) {
    return patterns as GeneratedMidiPatterns & { topline_melody: MidiNote[] };
  }

  // compute max beats (bars * beatsPerBar), defaulting to 4/4
  let beatsPerBar = 4;
  const ts = opts?.timeSignature || (Array.isArray((topline as any).timeSignature) ? (topline as any).timeSignature.join("/") : String((topline as any).timeSignature || "4/4"));
  const m = typeof ts === "string" ? ts.match(/^(\d+)\s*\/\s*(\d+)$/) : null;
  if (m) {
    const num = parseInt(m[1], 10);
    if (Number.isFinite(num) && num > 0) beatsPerBar = num;
  }
  const maxBeats = typeof opts?.bars === "number" ? Math.max(0, opts!.bars * beatsPerBar) : undefined;

  const tlMidi = toplineToMidi(topline, {
    defaultVelocity: opts?.defaultVelocity ?? 92,
    maxBeats,
  });

  return Object.assign({}, patterns, { topline_melody: tlMidi });
}

/**
 * Convenience wrapper used in App.tsx to inject melody from vocal topline.
 */
export function generateToplineMidi(
  analysis: ToplineAnalysis,
  opts?: { defaultVelocity?: number; maxBeats?: number }
): MidiNote[] {
  return toplineToMidi(analysis, opts);
}

export default generateToplineMidi;
