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

  const notes = (topline.pitchContour || []).map((n) => {
    const time = safeNum(n.time);
    const dur  = safeNum(n.duration);
    const midi = clampMidi(safeNum(n.midi));

    if (!(time >= 0) || !(dur > 0) || !isFinite(midi)) return null;
    if (typeof maxBeats === "number" && time > maxBeats) return null;

    const velocity = Math.max(1, Math.min(127, Math.round(n.velocity ?? defVel)));
    return <MidiNote>{
      time,
      midi,
      duration: dur,
      velocity,
      pitch: n.pitch, // keep for display/logging
      name: n.lyric,  // optional: store lyric in 'name' for UI overlays
    };
  });

  return notes.filter(Boolean) as MidiNote[];
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
