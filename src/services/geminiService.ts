// src/services/geminiService.ts
// -----------------------------------------------------------------------------
// Gemini service (browser-safe) with robust File/Blob handling + streaming utils
// Exports match the rest of your app and keep compatibility with older calls.
// -----------------------------------------------------------------------------

import {
  UserInputs,
  MidiSettings,
  MidiFromToplineSettings,
  ToplineAnalysis,
  GeneratedMidiPatterns,
} from "../constants/types";

import {
  GoogleGenerativeAI,
  GenerativeModel,
} from "@google/generative-ai";

// -----------------------------------------------------------------------------
// Config & model helpers
// -----------------------------------------------------------------------------

const GEMINI_API_KEY =
  (import.meta as any)?.env?.VITE_GEMINI_API_KEY ||
  (typeof process !== "undefined" ? process.env.VITE_GEMINI_API_KEY : undefined);

if (!GEMINI_API_KEY) {
  // Defer hard failure to call time so the dev server can still start.
  console.warn(
    "[geminiService] VITE_GEMINI_API_KEY is not set. API calls will fail until you provide it."
  );
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || "");

// Prefer the latest 1.5 Pro for text+audio understanding
const MODEL_NAME = "gemini-1.5-pro-latest";
const JSON_MODEL_NAME = "gemini-1.5-pro-latest";

// Keep variability low so results are more stable between runs
const defaultGenerationConfig = {
  temperature: 0.25,
  topK: 40,
  topP: 0.9,
  maxOutputTokens: 4096,
  // seed: 42, // uncomment if you want even more repeatability
};

function getModel(name = MODEL_NAME): GenerativeModel {
  if (!GEMINI_API_KEY) {
    throw new Error(
      "Missing VITE_GEMINI_API_KEY. Add it to your environment to use Gemini."
    );
  }
  return genAI.getGenerativeModel({ model: name, generationConfig: defaultGenerationConfig });
}

// -----------------------------------------------------------------------------
// Internal helpers
// -----------------------------------------------------------------------------

type TextChunk = { text: string };

/**
 * Some SDK versions return an object with `.stream` that is AsyncIterable,
 * others may already be the AsyncIterable. This normalizes both cases.
 */
function getAsyncIterableFromStreamResult(
  streamResult: any
): AsyncIterable<any> {
  if (streamResult && typeof streamResult[Symbol.asyncIterator] === "function") {
    return streamResult as AsyncIterable<any>;
  }
  if (streamResult?.stream && typeof streamResult.stream[Symbol.asyncIterator] === "function") {
    return streamResult.stream as AsyncIterable<any>;
  }
  throw new Error("Stream result is not async iterable.");
}

/** Convert Gemini stream into `{ text }` deltas your app expects. */
async function* toTextChunks(streamResult: any): AsyncGenerator<TextChunk> {
  const asyncIterable = getAsyncIterableFromStreamResult(streamResult);
  for await (const item of asyncIterable) {
    const delta = typeof item?.text === "function" ? item.text() : "";
    if (delta) yield { text: delta };
  }
}

/** Ensure the thing is a Blob or File (prevents FileReader errors). */
function assertBlob(input: unknown, label = "file"): asserts input is Blob {
  if (!(input instanceof Blob)) {
    throw new Error(
      `The provided ${label} is not a Blob/File. Pass the actual File object from your file input or drag/drop (not just a name or string).`
    );
  }
}

/** Blob/File -> base64 (no data: prefix) */
function blobToBase64(b: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => {
      try {
        const res = fr.result as string;
        const base64 = res.split(",")[1] || "";
        resolve(base64);
      } catch (e) {
        reject(e);
      }
    };
    fr.onerror = () => reject(fr.error || new Error("FileReader failed"));
    fr.readAsDataURL(b);
  });
}

/** Wraps a File/Blob into Gemini's inlineData structure. */
async function toInlineMedia(file: File | Blob, explicitMime?: string) {
  assertBlob(file, "audio file");
  const data = await blobToBase64(file);
  const mt = explicitMime || (file as File).type || "audio/mpeg";
  return { inlineData: { data, mimeType: mt } };
}

// -----------------------------------------------------------------------------
// Prompts
// -----------------------------------------------------------------------------

const GUIDEBOOK_PROMPT = (inputs: UserInputs) => `
You are TrackGuide AI. Build a practical production guide (markdown) for this project.

### Inputs
- Title: ${inputs.songTitle || "(AI suggest)"}
- Artist References: ${inputs.artistReference || "None"}
- Ref Track: ${inputs.referenceTrackLink || "None"}
- Genres: ${inputs.genre?.join(", ") || "Unspecified"}
- Vibe: ${inputs.vibe?.join(", ") || "Unspecified"}
- DAW: ${inputs.daw || "Unspecified"}
- Plugins: ${inputs.plugins || "Unspecified"}
- Instruments: ${inputs.availableInstruments || "Unspecified"}
- Key: ${inputs.key || "Unspecified"}
- Scale/Mode: ${inputs.scale || "Unspecified"}
- Chords: ${inputs.chords || "Unspecified"}
- Lyrics provided? ${inputs.lyrics ? "Yes" : "No"}
- Notes: ${inputs.generalNotes || "None"}

### Output rules
- Title line must be: "# TRACKGUIDE: <suggested or provided title>"
- Clear section headings with "##".
- Include: Tempo range; Key/Scale suggestions; Harmony/Melody/Rhythm core; Arrangement & sound design; Processing & FX; Actionable steps.
- If lyrics are provided, include a "## Lyrics" section with them (verbatim), compactly.
- Be specific to the inputs. Avoid filler.
`;

const MIDI_JSON_PROMPT = (midi: MidiSettings, context?: string) => `
You're a MIDI writer. Return ONLY JSON (no prose), exactly like:

{
  "chords": string[],
  "bassline": string[],
  "melody": string[],
  "drums": { "kick"?: string[], "snare"?: string[], "hihat"?: string[], "perc"?: string[] },
  "meta": { "tempo": number, "timeSignature": [number, number], "bars": number, "key": string, "songSection": string }
}

Constraints:
- key: ${midi.key}
- tempo: ${midi.tempo}
- timeSignature: ${midi.timeSignature[0]}/${midi.timeSignature[1]}
- bars: ${midi.bars}
- chordProgression: ${midi.chordProgression}
- genre: ${midi.genre}
- section: ${midi.songSection}
- instruments requested: ${midi.targetInstruments.join(", ")}
${context ? `- guidebook context: ${context}` : ""}

Return valid JSON only.
`;

const MIX_FEEDBACK_PROMPT = (notes?: string, dawName?: string) => `
You're a senior mix engineer. Analyze the uploaded audio and give structured, pragmatic feedback.
${notes ? `User notes to prioritize: ${notes}` : ""}
${dawName ? `Tailor tips for DAW: ${dawName}` : ""}

Start with "## Audio Analysis Results", then cover:
- Balance
- EQ
- Dynamics
- Space (reverb/delay/stereo)
- Translation
- Actionable Next Steps
`;

const MIX_COMPARISON_PROMPT = (notes?: string) => `
Compare Mix A vs Mix B (two audio files). Highlight differences, improvements, and tradeoffs.
${notes ? `User notes to prioritize: ${notes}` : ""}

Provide:
- "## Summary"
- "## Differences by Area" (balance, EQ, dynamics, space, loudness, translation)
- "## Actionable Next Steps"
`;

const TOPLINE_ANALYSIS_PROMPT = `
You're a vocal topline analyst. Detect:
- bpm (integer)
- key (e.g., "C Major" / "A Minor")
- scale (mode if applicable, e.g., "Dorian", or same as key's mode)
- timeSignature (array of two ints, e.g., [4,4])
- bars (approx integer for the clip)
- melodyRegister ("Low"|"Mid"|"High")
- lyrics (complete plain text transcription; if unclear, use [inaudible] markers)

Return ONLY strict JSON like:
{
  "bpm": 120,
  "key": "C Major",
  "scale": "Ionian",
  "timeSignature": [4,4],
  "bars": 8,
  "melodyRegister": "Mid",
  "lyrics": "transcribed lyric text"
}
`;

const GUIDEBOOK_FROM_TOPLINE_PROMPT = (inputs: UserInputs, analysis: ToplineAnalysis) => `
Use this topline analysis as the primary reference for the TrackGuide:

Topline:
- BPM: ${analysis.bpm ?? "Unknown"}
- Key: ${analysis.key ?? "Unknown"}
- Scale: ${analysis.scale ?? inputs.scale ?? "Unknown"}
- TimeSig: ${analysis.timeSignature?.join("/") ?? "4/4"}
- Bars: ${analysis.bars ?? "Unknown"}
- Melody register: ${analysis.melodyRegister ?? "Unknown"}

${
  analysis.lyrics
    ? `Lyrics (verbatim):\n${analysis.lyrics}\n\nAlways include a "## Lyrics" section with the transcription.`
    : "No lyrics were extracted; skip the lyrics section."
}

Now generate the same TrackGuide format as usual, but align tempo/key/arrangement advice to this topline.
`;

// -----------------------------------------------------------------------------
// Public API (exports your app relies on)
// -----------------------------------------------------------------------------

/** Stream the core TrackGuide (no topline) */
export async function generateGuidebookContent(
  inputs: UserInputs
): Promise<AsyncIterable<TextChunk>> {
  const model = getModel(MODEL_NAME);
  const prompt = GUIDEBOOK_PROMPT(inputs);

  const result = await model.generateContentStream([{ text: prompt }]);
  return toTextChunks(result);
}

/** Stream MIDI JSON text for the app to parse later. */
export async function generateMidiPatternSuggestions(
  midi: MidiSettings
): Promise<AsyncIterable<TextChunk>> {
  const model = getModel(JSON_MODEL_NAME);
  const prompt = MIDI_JSON_PROMPT(midi, midi.guidebookContext);

  const result = await model.generateContentStream([{ text: prompt }]);
  return toTextChunks(result);
}

/** One-shot mix feedback (non-streaming). */
export async function generateMixFeedbackWithAudio(params: {
  audioFile: File | Blob | null;
  userNotes?: string;
  dawName?: string;
}): Promise<string> {
  if (!params.audioFile) throw new Error("No audio file provided.");
  const model = getModel(MODEL_NAME);
  const media = await toInlineMedia(params.audioFile);
  const prompt = MIX_FEEDBACK_PROMPT(params.userNotes, params.dawName);

  const res = await model.generateContent([{ text: prompt }, media]);
  return res.response?.text?.() || "";
}

/** Streaming mix feedback (preferred path in your UI). */
export async function generateMixFeedbackWithAudioStream(params: {
  audioFile: File | Blob | null;
  userNotes?: string;
  dawName?: string;
}): Promise<AsyncIterable<TextChunk>> {
  if (!params.audioFile) throw new Error("No audio file provided.");
  const model = getModel(MODEL_NAME);
  const media = await toInlineMedia(params.audioFile);
  const prompt = MIX_FEEDBACK_PROMPT(params.userNotes, params.dawName);

  const result = await model.generateContentStream([{ text: prompt }, media]);
  return toTextChunks(result);
}

/** Streaming A/B comparison (App passes base64 strings). */
export async function generateMixComparisonStream(params: {
  mixAFile: string; // base64
  mixBFile: string; // base64
  mixAName?: string;
  mixBName?: string;
  includeMixBFeedback?: boolean;
  userNotes?: string;
}): Promise<AsyncIterable<TextChunk>> {
  const model = getModel(MODEL_NAME);
  const prompt = MIX_COMPARISON_PROMPT(params.userNotes);

  const base64ToMedia = (base64: string, name?: string) => {
    const ext = (name || "").toLowerCase();
    const mime =
      ext.endsWith(".wav") ? "audio/wav" :
      ext.endsWith(".flac") ? "audio/flac" :
      ext.endsWith(".aiff") || ext.endsWith(".aif") ? "audio/aiff" :
      "audio/mpeg";
    return { inlineData: { data: base64, mimeType: mime } };
    // Note: Inline media accepts base64 data; App already strips "data:" prefix.
  };

  const result = await model.generateContentStream([
    { text: prompt },
    base64ToMedia(params.mixAFile, params.mixAName),
    base64ToMedia(params.mixBFile, params.mixBName),
  ]);

  return toTextChunks(result);
}

/** Analyze a vocal topline audio file (JSON + lyrics transcription). */
export async function analyzeTopline(file: File | Blob): Promise<ToplineAnalysis> {
  const model = getModel(MODEL_NAME);
  const media = await toInlineMedia(file);
  const prompt = TOPLINE_ANALYSIS_PROMPT;

  const res = await model.generateContent([
    { text: "Return ONLY JSON. No markdown, no commentary." },
    { text: prompt },
    media,
  ]);

  const raw = res.response?.text?.() || "";
  try {
    const parsed = JSON.parse(raw);

    const analysis: ToplineAnalysis = {
      bpm: typeof parsed.bpm === "number" ? parsed.bpm : undefined,
      key: typeof parsed.key === "string" ? parsed.key : undefined,
      scale: typeof parsed.scale === "string" ? parsed.scale : undefined,
      timeSignature:
        Array.isArray(parsed.timeSignature) &&
        parsed.timeSignature.length === 2 &&
        typeof parsed.timeSignature[0] === "number" &&
        typeof parsed.timeSignature[1] === "number"
          ? [parsed.timeSignature[0], parsed.timeSignature[1]]
          : undefined,
      bars: typeof parsed.bars === "number" ? parsed.bars : undefined,
      melodyRegister:
        typeof parsed.melodyRegister === "string" ? parsed.melodyRegister : undefined,
      lyrics: typeof parsed.lyrics === "string" ? parsed.lyrics : undefined,
    };

    return analysis;
  } catch (e) {
    console.error("[analyzeTopline] Non-JSON or invalid JSON output:", raw);
    throw new Error("Topline analysis returned invalid JSON.");
  }
}

/** Stream TrackGuide seeded by topline analysis (adds Lyrics section when available). */
export async function generateGuidebookFromToplineStream(
  inputs: UserInputs,
  analysis: ToplineAnalysis
): Promise<AsyncIterable<TextChunk>> {
  const model = getModel(MODEL_NAME);
  const base = GUIDEBOOK_PROMPT(inputs);
  const seeded = GUIDEBOOK_FROM_TOPLINE_PROMPT(inputs, analysis);

  const result = await model.generateContentStream([{ text: `${seeded}\n\n${base}` }]);
  return toTextChunks(result);
}

/** One-shot MIDI from topline context (returns parsed JSON). */
export async function generateMidiFromTopline(
  midi: MidiFromToplineSettings,
  analysis: ToplineAnalysis
): Promise<GeneratedMidiPatterns> {
  const model = getModel(JSON_MODEL_NAME);

  // Align with analysis when provided
  const merged: MidiSettings = {
    ...midi,
    tempo: analysis.bpm || midi.tempo,
    key: analysis.key || midi.key,
    timeSignature: analysis.timeSignature || midi.timeSignature || [4, 4],
    bars: analysis.bars || midi.bars || 8,
  };

  const prompt = MIDI_JSON_PROMPT(merged, midi.guidebookContext);
  const res = await model.generateContent([{ text: prompt }]);

  const raw = res.response?.text?.() || "";
  try {
    return JSON.parse(raw) as GeneratedMidiPatterns;
  } catch (e) {
    console.error("[generateMidiFromTopline] Invalid JSON output:", raw);
    throw new Error("AI returned invalid JSON for MIDI from topline.");
  }
}

/** Optional helper: harmony tips (markdown). */
export async function generateHarmonySuggestions(payload: {
  key?: string;
  scale?: string;
  vibe?: string[];
  genre?: string[];
  chordProgression?: string;
  bars?: number;
  notes?: string;
}): Promise<string> {
  const model = getModel(MODEL_NAME);
  const prompt = `
Suggest tasteful harmony ideas for:
- Key: ${payload.key || "Unknown"}
- Scale: ${payload.scale || "Unknown"}
- Genres: ${payload.genre?.join(", ") || "Unspecified"}
- Vibe: ${payload.vibe?.join(", ") || "Unspecified"}
- Progression: ${payload.chordProgression || "Unspecified"}
- Bars: ${typeof payload.bars === "number" ? payload.bars : "Unspecified"}
${payload.notes ? `- Notes: ${payload.notes}` : ""}

Return concise markdown with concrete examples (e.g., "C4-E4-G4").
`.trim();

  const res = await model.generateContent([{ text: prompt }]);
  return res.response?.text?.() || "";
}

// -----------------------------------------------------------------------------
// Backwards-compat convenience: empty async stream if something needs a stream
// -----------------------------------------------------------------------------

export async function* emptyStream(): AsyncGenerator<TextChunk> {
  // lets consumers `for await` safely even if there's nothing to stream
  return;
}
