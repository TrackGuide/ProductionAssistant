// ─────────────────────────────────────────────────────────────
// Topline (vocal) analysis types — shared across UI and services
// ─────────────────────────────────────────────────────────────
export interface ToplineNote {
  time: number;        // beats
  duration: number;    // beats
  midi: number;        // 21–108
  pitch: string;       // e.g., "E4"
  lyric?: string;      // optional syllable/word
  velocity?: number;   // 1–127 (if inferred)
}

export interface ToplinePhrase {
  start: number;       // beats
  end: number;         // beats
  text?: string;       // optional line/lyric
  intensity?: "low" | "med" | "high";
}

export interface SectionHint {
  label: string;       // "Intro" | "Verse" | "Pre-Chorus" | "Chorus" | etc.
  start: number;       // beats
  end: number;         // beats
  confidence: number;  // 0–1
}

export interface ToplineAnalysis {
  bpm: number | "Unable to detect";
  timeSignature: string | "Unable to detect"; // e.g., "4/4"
  key: string | "Unable to detect";           // e.g., "A minor"
  scale: string | "Unable to detect";         // e.g., "Natural minor"
  tessitura: { low: string; high: string } | null;
  registerCenter: string | null;              // e.g., "E4"
  pitchContour: ToplineNote[];                // melody as notes over time
  phrases: ToplinePhrase[];
  sections: SectionHint[];
  motifSummary: string;                       // short description of recurring motifs
  chordCandidates: Array<{ section: string; chords: string; roman?: string }>;
}

export interface GuidebookEntry {
  id: string;
  title: string;
  genre: string[];
  artistReference: string;
  referenceTrackLink?: string;
  lyrics?: string;
  key?: string;
  scale?: string;
  chords?: string;
  generalNotes?: string;
  vibe: string[];
  daw: string;
  plugins: string;
  availableInstruments: string;
  content: string;
  createdAt: string;
  midiSettings?: MidiSettings;
  toplineAnalysis?: ToplineAnalysis;
  generatedMidiPatterns?: GeneratedMidiPatterns;
}

export interface UserInputs {
  songTitle?: string; // Added songTitle
  genre: string[];
  artistReference: string;
  referenceTrackLink?: string; // New: Reference track via link (YouTube, Spotify, etc.)
  lyrics?: string; // New: Optional lyrics input
  key?: string; // New: Optional key input
  scale?: string; // New: Optional scale/mode input
  chords?: string; // New: Optional chords input
  generalNotes?: string; // New: General notes for AI to consider
  vibe: string[];
  daw: string;
  plugins: string;
  availableInstruments?: string;
}

export interface MidiNote {
  time: number; // Start time in beats (e.g., 0, 0.5, 1, 1.25) relative to the start of its pattern segment
  midi: number; // MIDI note number (for actual MIDI generation)
  duration: number; // Duration in beats
  velocity?: number; // MIDI velocity (0-127), default 100
  pitch?: string; // e.g. "C4", used for display/logging
  name?: string; // For chord display
}

export interface ChordNoteEvent {
  time: number; // Start time in beats
  name: string; // e.g., "Cmaj7"
  duration: number; // Duration in beats
  notes: { pitch: string, midi: number }[]; // e.g. [{pitch: "C4", midi: 60}, ...]
  velocity?: number;
}


export interface DrumHit {
  time: number; // Start time in beats
  duration: number; // Duration in beats
  velocity?: number; // MIDI velocity (0-127)
}

export interface DrumPatternData {
  [drumElement: string]: DrumHit[]; // e.g., "kick": [ {time:0, duration:0.1, velocity:120}, ... ]
}

export interface GeneratedMidiPatterns {
  chords?: ChordNoteEvent[];
  bassline?: MidiNote[];
  melody?: MidiNote[];
  drums?: DrumPatternData;
  error?: string; 
}
export type KeyOfGeneratedMidiPatterns = Exclude<keyof GeneratedMidiPatterns, 'error'>;


export interface MidiSettings {
  key: string;
  scale?: string; // New: Scale/mode selection (relevant to the key)
  tempo: number;
  timeSignature: [number, number];
  chordProgression: string;
  genre: string; // This should ideally be derived from main inputs
  bars: number;
  targetInstruments: string[]; // e.g., ['chords', 'melody', 'drums']
  guidebookContext?: string; // Optional context from the main TrackGuide
  songSection?: string; // Added for selecting song section context
}

// Helper for MIDI generation that uses a vocal topline
export interface MidiFromToplineSettings extends MidiSettings {
  topline: ToplineAnalysis;
  avoidDoublingMelody?: boolean;
}

// Types for Mix Feedback Feature
export interface MixFeedbackInputs {
  trackName: string;
  focus?: string;
  notes?: string;
  audioFile?: File | null;
  userNotes?: string;
  dawName?: string;
}

export interface MixComparisonInputs {
  mixAFile: string;
  mixBFile: string;
  mixAName: string;
  mixBName: string;
  includeMixBFeedback?: boolean;
  userNotes: string;
  dawName?: string;
}

export interface RemixGuideInputs {
  originalTrackTitle: string;
  targetGenre: string;
  targetKey: string;
  targetTempo: number;
  daw?: string;
  plugins?: string;
  notes?: string;
  audioData?: {
    base64: string;
    mimeType: string;
  };
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export type ActiveView = 'landing' | 'trackGuide' | 'mixFeedback' | 'remixGuide' | 'patchGuide' | 'eqGuide';

// ─────────────────────────────────────────────────────────────
// Topline (AI response → normalized) helpers
// Add these BELOW your existing interfaces
// ─────────────────────────────────────────────────────────────

/** Narrow “core” fields we expect at minimum from AI. */
export type ToplineCore =
  | {
      bpm: number | "Unable to detect";
      timeSignature: string | "Unable to detect";
      key: string | "Unable to detect";
      scale: string | "Unable to detect";
    }
  | Record<string, never>; // allow empty so parser won't explode

/** Very lenient AI response type — everything optional and flexible. */
export interface ToplineAnalysisAIResponse extends Partial<ToplineCore> {
  // Numbers may arrive as strings; we’ll coerce in the normalizer.
  bpm?: number | string | "Unable to detect";
  timeSignature?: string | "Unable to detect";
  key?: string | "Unable to detect";
  scale?: string | "Unable to detect";
  confidence?: number | string;

  // Optional richer details (model may omit any/all of these)
  tessitura?: { low?: string; high?: string } | null;
  registerCenter?: string | null;

  // Notes/phrases/sections are optional; model may return empty arrays or omit
  pitchContour?: Array<
    Partial<ToplineNote> & {
      time?: number | string;
      duration?: number | string;
      midi?: number | string;
      pitch?: string;
    }
  >;

  phrases?: Array<
    Partial<ToplinePhrase> & {
      start?: number | string;
      end?: number | string;
      text?: string;
      intensity?: "low" | "med" | "high" | string;
    }
  >;

  sections?: Array<
    Partial<SectionHint> & {
      label?: string;
      start?: number | string;
      end?: number | string;
      confidence?: number | string;
    }
  >;

  motifSummary?: string;

  chordCandidates?: Array<
    Partial<{
      section: string;
      chords: string;
      roman?: string;
    }>
  >;

  // Some models use alternate field names — accept them and remap:
  lyrics?: string;
  transcribedLyrics?: string;
  chords?: string;
  suggestedChords?: string;
  detectedKey?: string;
  detectedScale?: string;
}

/** Small internal helpers */
const toNum = (v: any): number | undefined => {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim().match(/^-?\d+(\.\d+)?$/)) return Number(v);
  return undefined;
};
const toNumOr = (v: any, fallback: number): number => {
  const n = toNum(v);
  return typeof n === "number" && !Number.isNaN(n) ? n : fallback;
};
const clamp01 = (v: any): number => {
  const n = toNum(v);
  if (typeof n !== "number" || Number.isNaN(n)) return 0;
  return Math.min(1, Math.max(0, n));
};

/**
 * Normalize a loose AI response into your strict ToplineAnalysis.
 * - Fills safe defaults
 * - Coerces strings → numbers where needed
 * - Keeps your canonical structure stable for the UI
 */
export function normalizeTopline(
  ai: ToplineAnalysisAIResponse
): ToplineAnalysis {
  // Core with safe fallbacks
  const bpm =
    (typeof ai.bpm === "string" && ai.bpm !== "Unable to detect"
      ? toNum(ai.bpm)
      : ai.bpm) ?? "Unable to detect";

  const timeSignature =
    ai.timeSignature && typeof ai.timeSignature === "string"
      ? ai.timeSignature
      : "Unable to detect";

  const key =
    ai.key && typeof ai.key === "string"
      ? ai.key
      : ai.detectedKey && typeof ai.detectedKey === "string"
      ? ai.detectedKey
      : "Unable to detect";

  const scale =
    ai.scale && typeof ai.scale === "string"
      ? ai.scale
      : ai.detectedScale && typeof ai.detectedScale === "string"
      ? ai.detectedScale
      : "Unable to detect";

  // tessitura/registerCenter
  const tessitura =
    ai.tessitura && (ai.tessitura.low || ai.tessitura.high)
      ? {
          low: ai.tessitura.low ?? "",
          high: ai.tessitura.high ?? "",
        }
      : null;

  const registerCenter =
    typeof ai.registerCenter === "string" && ai.registerCenter.trim()
      ? ai.registerCenter
      : null;

  // pitchContour → strict ToplineNote[]
  const pitchContour: ToplineNote[] = Array.isArray(ai.pitchContour)
    ? ai.pitchContour
        .map((n) => {
          const time = toNumOr(n?.time, 0);
          const duration = toNumOr(n?.duration, 1);
          const midi = toNumOr(n?.midi, 60);
          const pitch = n?.pitch ?? "";
          const velocity =
            typeof n?.velocity === "number" ? n?.velocity : toNum(n?.velocity);
          return {
            time,
            duration,
            midi,
            pitch,
            lyric: n?.lyric,
            velocity: typeof velocity === "number" ? velocity : undefined,
          } as ToplineNote;
        })
        .filter((n) => Number.isFinite(n.time) && Number.isFinite(n.duration))
    : [];

  // phrases
  const phrases: ToplinePhrase[] = Array.isArray(ai.phrases)
    ? ai.phrases
        .map((p) => ({
          start: toNumOr(p?.start, 0),
          end: toNumOr(p?.end, Math.max(0, toNumOr(p?.start, 0) + 1)),
          text: p?.text,
          intensity:
            p?.intensity === "low" || p?.intensity === "med" || p?.intensity === "high"
              ? p?.intensity
              : undefined,
        }))
        .filter((p) => Number.isFinite(p.start) && Number.isFinite(p.end))
    : [];

  // sections
  const sections: SectionHint[] = Array.isArray(ai.sections)
    ? ai.sections
        .map((s) => ({
          label: s?.label ?? "Section",
          start: toNumOr(s?.start, 0),
          end: toNumOr(s?.end, Math.max(0, toNumOr(s?.start, 0) + 4)),
          confidence: clamp01(s?.confidence ?? 0.5),
        }))
        .filter((s) => Number.isFinite(s.start) && Number.isFinite(s.end))
    : [];

  // motifSummary
  const motifSummary = typeof ai.motifSummary === "string" ? ai.motifSummary : "";

  // chordCandidates
  const chordCandidates =
    Array.isArray(ai.chordCandidates) && ai.chordCandidates.length
      ? ai.chordCandidates
          .map((c) => ({
            section: c?.section ?? "Section",
            chords: c?.chords ?? "",
            roman: c?.roman,
          }))
          .filter((c) => typeof c.chords === "string")
      : [];

  // Done — build the canonical object your UI expects
  const normalized: ToplineAnalysis = {
    bpm: typeof bpm === "number" ? bpm : "Unable to detect",
    timeSignature,
    key,
    scale,
    tessitura,
    registerCenter,
    pitchContour,
    phrases,
    sections,
    motifSummary,
    chordCandidates,
  };

  return normalized;
}
