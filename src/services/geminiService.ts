// services/geminiService.ts

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GEMINI_MODEL_NAME } from "../constants/constants";
import {
  UserInputs,
  MidiSettings,
  MidiFromToplineSettings,
  MixFeedbackInputs,
  MixComparisonInputs,
  ChatMessage,
  GuidebookEntry,
  ToplineAnalysis,
  ToplineAnalysisAIResponse,
} from "../constants/types";
import {
  getDawMetadata,
  suggestPlugins,
  dawMetadata,
  DawMetadata,
} from "../constants/dawMetadata";
import {
  parseAiToplineResponse,
  sanitizeJsonTopline,
} from "../utils/jsonParsingUtils";
import { normalizeTopline } from "../constants/types";

const apiKey =
  process.env.API_KEY ||
  process.env.GEMINI_API_KEY ||
  (typeof import.meta !== "undefined" &&
    (import.meta as any).env?.VITE_GEMINI_API_KEY);

if (!apiKey) {
  throw new Error(
    "API key not configured. Set GEMINI_API_KEY or VITE_GEMINI_API_KEY environment variable."
  );
}
const ai = new GoogleGenAI({ apiKey });

/* ─────────────────────────────────────────────────────────────
 * Audio normalization helpers
 * Accepts: File/Blob, data URL, raw base64, {base64|audioBase64|data|bytes|buffer|arrayBuffer|blob|file}
 * ────────────────────────────────────────────────────────────*/
function _isArrayBufferLike(x: any): x is ArrayBuffer | Uint8Array {
  return x instanceof ArrayBuffer || x instanceof Uint8Array;
}

function _sniffMime(filename?: string, fallback: string = "audio/wav"): string {
  if (!filename) return fallback;
  const lower = filename.toLowerCase();
  if (lower.endsWith(".mp3")) return "audio/mpeg";
  if (lower.endsWith(".wav")) return "audio/wav";
  if (lower.endsWith(".m4a")) return "audio/mp4";
  if (lower.endsWith(".aac")) return "audio/aac";
  if (lower.endsWith(".flac")) return "audio/flac";
  if (lower.endsWith(".ogg") || lower.endsWith(".oga")) return "audio/ogg";
  if (lower.endsWith(".webm")) return "audio/webm";
  return fallback;
}

function _arrayBufferToBase64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++)
    binary += String.fromCharCode(bytes[i]);
  return typeof btoa !== "undefined"
    ? btoa(binary)
    : Buffer.from(binary, "binary").toString("base64");
}

async function _normalizeAudioInput(
  audio: any,
  mimeHint?: string
): Promise<{ base64: string; mimeType: string }> {
  if (!audio) throw new Error("No audio provided to analyzeTopline.");

  // 1) string input: raw base64 OR full data URL
  if (typeof audio === "string") {
    if (audio.startsWith("data:")) {
      const comma = audio.indexOf(",");
      const header = audio.slice(5, comma); // "audio/wav;base64"
      const [mime] = header.split(";");
      return {
        base64: audio.slice(comma + 1),
        mimeType: mime || mimeHint || "audio/wav",
      };
    }
    return { base64: audio, mimeType: mimeHint || "audio/wav" };
  }

  // 2) ArrayBuffer / Uint8Array
  if (_isArrayBufferLike(audio)) {
    return { base64: _arrayBufferToBase64(audio), mimeType: mimeHint || "audio/wav" };
  }

  // 3) Blob / File
  if (typeof Blob !== "undefined" && audio instanceof Blob) {
    const mimeType = (audio as any).type || mimeHint || "audio/wav";
    const base64 = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onloadend = () => {
        try {
          const s = String(r.result);
          resolve(s.split(",")[1]);
        } catch (err) {
          reject(err);
        }
      };
      r.onerror = reject;
      r.readAsDataURL(audio);
    });
    return { base64, mimeType };
  }

  // 4) known object wrappers
  if (audio && typeof audio === "object") {
    if (audio.file instanceof Blob)
      return _normalizeAudioInput(audio.file, audio.mimeType || mimeHint);
    if (audio.audioFile instanceof Blob)
      return _normalizeAudioInput(audio.audioFile, audio.mimeType || mimeHint);
    if (audio.blob instanceof Blob)
      return _normalizeAudioInput(audio.blob, audio.mimeType || mimeHint);

    if (typeof audio.dataUrl === "string")
      return _normalizeAudioInput(audio.dataUrl, audio.mimeType || mimeHint);
    if (typeof audio.audioBase64 === "string") {
      const fn = (audio as any).filename as string | undefined;
      const guessed = _sniffMime(fn, mimeHint || "audio/wav");
      const raw = audio.audioBase64.includes(",")
        ? audio.audioBase64.split(",").pop()!
        : audio.audioBase64;
      return { base64: raw, mimeType: audio.mimeType || guessed };
    }
    if (typeof audio.base64 === "string") {
      const raw = audio.base64.includes(",")
        ? audio.base64.split(",").pop()!
        : audio.base64;
      return { base64: raw, mimeType: audio.mimeType || mimeHint || "audio/wav" };
    }

    if ("data" in audio && ("mimeType" in audio || mimeHint)) {
      const d = (audio as any).data;
      const mime = (audio as any).mimeType || mimeHint || "audio/wav";
      if (typeof d === "string") {
        if (d.startsWith("data:")) {
          const comma = d.indexOf(",");
          const header = d.slice(5, comma);
          const [m] = header.split(";");
          return { base64: d.slice(comma + 1), mimeType: m || mime };
        }
        return { base64: d, mimeType: mime };
      }
      if (typeof Blob !== "undefined" && d instanceof Blob) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onloadend = () => {
            try {
              const s = String(r.result);
              resolve(s.split(",")[1]);
            } catch (err) {
              reject(err);
            }
          };
          r.onerror = reject;
          r.readAsDataURL(d);
        });
        return { base64, mimeType: (d as any).type || mime };
      }
      if (_isArrayBufferLike(d)) {
        return { base64: _arrayBufferToBase64(d), mimeType: mime };
      }
    }

    if (_isArrayBufferLike(audio.buffer)) {
      return {
        base64: _arrayBufferToBase64(audio.buffer),
        mimeType: audio.mimeType || mimeHint || "audio/wav",
      };
    }
    if (_isArrayBufferLike(audio.arrayBuffer)) {
      return {
        base64: _arrayBufferToBase64(audio.arrayBuffer),
        mimeType: audio.mimeType || mimeHint || "audio/wav",
      };
    }
    if (_isArrayBufferLike(audio.bytes)) {
      return {
        base64: _arrayBufferToBase64(audio.bytes),
        mimeType: audio.mimeType || mimeHint || "audio/wav",
      };
    }
  }

  console.error("Unsupported audio shape passed to analyzeTopline:", audio);
  throw new Error("Unsupported audio input format for analyzeTopline.");
}

/* ─────────────────────────────────────────────────────────────
 * Topline JSON-only request
 * ────────────────────────────────────────────────────────────*/
async function analyzeToplineRawJSON(
  audio:
    | File
    | Blob
    | string
    | {
        base64?: string;
        audioBase64?: string;
        data?: any;
        mimeType?: string;
        filename?: string;
      }
): Promise<string> {
  const norm = await _normalizeAudioInput(
    audio as any,
    typeof audio === "object" && audio && "filename" in audio
      ? _sniffMime((audio as any).filename)
      : undefined
  );

  if (!norm?.base64 || norm.base64.length < 32) {
    throw new Error("Topline analysis received empty audio data.");
  }

  const audioPart = {
    inlineData: { data: norm.base64, mimeType: norm.mimeType || "audio/wav" },
  } as const;

  const instruction = `
You are an expert vocal-topline analyst. Return STRICT JSON ONLY (no markdown, no backticks, no explanations).

Fields and types (commit to concrete values where audio permits):
{
  "bpm": number | "Unable to detect",
  "timeSignature": "4/4" | "3/4" | "6/8" | "Unable to detect",
  "key": string | "Unable to detect",
  "scale": string | "Unable to detect",
  "tessitura": { "low": string, "high": string } | null,
  "registerCenter": string | null,
  "pitchContour": [
    { "time": number, "duration": number, "midi": number, "pitch": string, "lyric": string, "velocity": number }
  ],
  "phrases": [
    { "start": number, "end": number, "text": string, "intensity": "low" | "med" | "high" }
  ],
  "sections": [
    { "label": string, "start": number, "end": number, "confidence": number }
  ],
  "motifSummary": string,
  "chordCandidates": [
    { "section": string, "chords": string, "roman": string }
  ],
  "lyrics": string | null
}

Constraints:
- Analyze AUDIO only. Prefer concrete values; use "Unable to detect" only when genuinely necessary.
- bpm: single integer (dominant tempo if variable).
- timeSignature: choose closest fit (typically 4/4).
- pitchContour should be dense enough to reconstruct melody (beats for time/duration; midi 21–108; velocity 1–127).
- sections: coarse song sections with confidence 0–1.
- Always include best-effort "lyrics" transcript (null only if unintelligible).
- Output ONLY the JSON object (start with { and end with }).`;

  const resp = await ai.models.generateContent({
    model: GEMINI_MODEL_NAME,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2,
      topP: 0.9,
    },
    contents: { parts: [audioPart, { text: instruction }] },
  });

  const raw =
    typeof resp.text === "function"
      ? resp.text()
      : (resp.text as any) ?? String((resp as any).response ?? "");
  return String(raw || "");
}

/* ─────────────────────────────────────────────────────────────
 * Plugin, Structural, Vocal sections (builders)
 * ────────────────────────────────────────────────────────────*/
function buildPluginParameterSection(daw?: string, plugins?: string): string {
  if (!daw && !plugins) {
    return `
### 🎛️ Processing Tips & Plugin Parameters

**EQ Settings:**
- High-pass filter: 20-40 Hz to remove sub-bass rumble
- Low-mid cut: 200-400 Hz to reduce muddiness
- Presence boost: 2-5 kHz for clarity
- Air boost: 10-15 kHz for sparkle

**Compression:**
- Ratio: 3:1 to 4:1 for moderate control
- Attack: 10-30ms for punch retention
- Release: 100-300ms for natural decay
- Makeup gain: 2-6 dB as needed

**Reverb & Delay:**
- Room reverb: 0.8-1.5s decay for space
- Delay: 1/8 or 1/4 note timing
- High-cut: 8-12 kHz to avoid harshness
- Mix: 15-30% for depth without wash`;
  }

  const dawData = daw ? getDawMetadata(daw) : null;

  const stockEQ =
    (dawData && daw ? suggestPlugins(daw, "EQ")[0] : undefined) || "Stock EQ";
  const stockCompression =
    (dawData && daw ? suggestPlugins(daw, "Compression")[0] : undefined) ||
    "Stock Compressor";
  const stockReverb =
    (dawData && daw ? suggestPlugins(daw, "Reverb")[0] : undefined) ||
    "Stock Reverb";
  const stockDelay =
    (dawData && daw ? suggestPlugins(daw, "Delay")[0] : undefined) ||
    "Stock Delay";
  const stockCreative =
    (dawData && daw ? suggestPlugins(daw, "Creative")[0] : undefined) ||
    "Stock Saturator";

  const dawSpecific = daw && !plugins
    ? `**${daw} Stock Plugin Chain:**`
    : daw
    ? `**${daw}-Specific Settings:**`
    : "";
  const pluginSpecific = plugins ? `**Custom Plugin Chain (${plugins}):**` : "";

  return `
### 🎛️ Processing Tips & Plugin Parameters
${dawSpecific}
${pluginSpecific}

**EQ Parameters:**
${
  dawData && !plugins
    ? `- ${stockEQ}: High-pass at ${
        daw?.toLowerCase().includes("logic")
          ? "35"
          : daw?.toLowerCase().includes("fl")
          ? "30"
          : "40"
      } Hz, Low-mid cut at ${
        daw?.toLowerCase().includes("logic")
          ? "300"
          : daw?.toLowerCase().includes("fl")
          ? "400"
          : "250"
      } Hz (-3dB), Presence boost at ${
        daw?.toLowerCase().includes("logic")
          ? "12 kHz (+1.5dB)"
          : daw?.toLowerCase().includes("fl")
          ? "15 kHz (+2dB)"
          : "3 kHz (+2dB)"
      }`
    : daw === "Ableton Live"
    ? "- EQ Eight: High-pass at 40 Hz, Low-mid cut at 250 Hz (-3dB), Presence boost at 3 kHz (+2dB)"
    : daw === "Logic Pro"
    ? "- Channel EQ: High-pass at 35 Hz, Low-mid cut at 300 Hz (-2.5dB), High boost at 12 kHz (+1.5dB)"
    : daw === "FL Studio"
    ? "- Parametric EQ 2: High-pass at 30 Hz, Mid cut at 400 Hz (-4dB), Air boost at 15 kHz (+2dB)"
    : "- High-pass filter: 20-40 Hz, Low-mid cut: 200-400 Hz (-2 to -4dB), Presence boost: 2-5 kHz (+1 to +3dB)"
}

**Compression Settings:**
${
  dawData && !plugins
    ? `- ${stockCompression}: Ratio ${
        daw?.toLowerCase().includes("logic") ? "3.5:1" : "4:1"
      }, Attack ${
        daw?.toLowerCase().includes("fl")
          ? "10ms"
          : daw?.toLowerCase().includes("logic")
          ? "20ms"
          : "15ms"
      }, Release ${
        daw?.toLowerCase().includes("logic")
          ? "150ms"
          : daw?.toLowerCase().includes("fl")
          ? "250ms"
          : "200ms"
      }${
        daw?.toLowerCase().includes("logic")
          ? ", Auto-Release enabled"
          : daw?.toLowerCase().includes("fl")
          ? ", Knee 3dB"
          : ", Knee 2dB"
      }`
    : daw === "Ableton Live"
    ? "- Compressor: Ratio 4:1, Attack 15ms, Release 200ms, Knee 2dB"
    : daw === "Logic Pro"
    ? "- Compressor: Ratio 3.5:1, Attack 20ms, Release 150ms, Auto-Release enabled"
    : daw === "FL Studio"
    ? "- Fruity Compressor: Ratio 4:1, Attack 10ms, Release 250ms, Knee 3dB"
    : "- Ratio: 3:1 to 4:1, Attack: 10-30ms, Release: 100-300ms, Makeup: 2-6 dB"
}

**Time-Based Effects:**
${
  dawData && !plugins
    ? `- ${stockReverb}: Room/Hall setting, 1.2s decay, Pre-delay 20ms, Mix 25%
- ${stockDelay}: 1/8 note timing, Feedback 35%, High-cut 8kHz, Mix 20%`
    : daw === "Ableton Live"
    ? "- Reverb: Hall algorithm, 1.3s decay, Pre-delay 15ms, Mix 30%\n- Echo: 1/8 note ping-pong, Feedback 30%, Filter cutoff 70%, Mix 25%"
    : daw === "Logic Pro"
    ? "- ChromaVerb: Chamber setting, 1.2s decay, Pre-delay 20ms, Mix 25%\n- Delay Designer: 1/8 dotted, Feedback 40%, Low-cut 100Hz, High-cut 9kHz"
    : daw === "FL Studio"
    ? "- Reeverb 2: Room size 70%, Diffusion 60%, Decay 1.4s, Mix 22%\n- Fruity Delay 3: Tempo-synced 1/8, Stereo offset 20ms, Feedback 35%"
    : "- Reverb: Medium room/hall, 1-1.5s decay, 15-25ms pre-delay, 20-30% mix\n- Delay: 1/8 or 1/4 note timing, 30-40% feedback, high-cut filter"
}

**Recommended Signal Chain:**
${
  dawData && (dawData as any).suggestedSignalChains && (dawData as any).suggestedSignalChains.Synth
    ? `- ${(dawData as any).suggestedSignalChains.Synth.join(" → ")}`
    : dawData
    ? `- ${stockEQ} → ${stockCompression} → ${stockCreative} → ${stockReverb}/${stockDelay}`
    : daw === "Ableton Live"
    ? "- EQ Eight → Compressor → Saturator → Reverb/Echo → Limiter"
    : daw === "Logic Pro"
    ? "- Channel EQ → Compressor → Tape → ChromaVerb/Delay Designer → Adaptive Limiter"
    : daw === "FL Studio"
    ? "- Parametric EQ 2 → Fruity Compressor → Waveshaper → Reverb/Delay → Fruity Limiter"
    : plugins
    ? plugins
    : "EQ → Compressor → Saturation → Reverb/Delay → Limiter"
}`;
}

function buildStructuralBlueprint(): string {
  return `
## 🎼 Structural Blueprint

<div className="overflow-x-auto">

| **Section** | **Duration** | **Key Elements & Instrumentation** | **Flow / Energy Notes** |
| --- | --- | --- | --- |
| **Intro** | 8–16 bars | Teaser elements; filtered drums; pads | Low density; widen slowly; filter sweeps begin |
| **Verse 1** | 16 bars | Groove foundation; vocal lead | Keep FX minimal; highlight lyrics; automate subtle sends |
| **Pre-Chorus** | 8 bars | Tension build; arp; risers | LPF rise (300→2kHz); reduce reverb 10%; prepare drop |
| **Chorus** | 16 bars | Full energy; hook; open hats | Max width; sidechain pad/bass; double hook w/ lead @ unison/+12 |
| **Breakdown/Bridge** | 8–16 bars | Contrast + rebuild; FX ear-candy | Pull sub; spotlight topline; throw delays on phrase ends |
| **Verse 2 / Alt** | 16 bars | Variation; new layer or inversion | Motif development; selective fills; keep momentum |
| **Final Chorus** | 16–24 bars | Stacks; adlibs; extra perc | Add perc layer; chord inversion swap; widen pads +10% |
| **Outro** | 8–16 bars | Strip elements; ambience | Gradual fade; leave texture tails |
</div>`;
}

function buildVocalProcessingSection(daw?: string, plugins?: string): string {
  const dawTag = daw ? ` (${daw})` : "";
  const chainHint = plugins
    ? `**Suggested Chain (${plugins})**`
    : daw
    ? `**Suggested Chain (Stock ${daw})**`
    : `**Suggested Chain (Stock/Generic)**`;

  return `
## 🎤 Vocal Processing & Recording${dawTag}

${chainHint}  
1) **Clean-Up:** High-pass ~80–120 Hz (voice-dependent), gentle de-ess (4.5–8 kHz)  
2) **Dynamics:** Fast attack/medium release compression (2–4:1), optional slower comp after for consistency  
3) **Tone Shaping:** Broad presence 2–5 kHz; notch harshness 6–8 kHz if needed  
4) **Space:** Short plate (0.8–1.6 s); timed delay (1/8 or 1/4) with low-cut & ducking  

### 🎙️ Microphone Recommendations  
Provide **3–4 mic choices** tailored to this song’s **genre, vibe, and topline**.  
For each: include **model**, **why it fits** (tonal traits vs. the voice/genre), and **budget tier**.  
Prefer a spread across **dynamic**, **condenser**, and **USB/affordable** options when appropriate.
`;
}

/* ─────────────────────────────────────────────────────────────
 * 1) Core TrackGuide (generic, no topline injected)
 * ────────────────────────────────────────────────────────────*/
export const generateGuidebookContent = async (
  inputs: UserInputs
): Promise<AsyncIterable<GenerateContentResponse>> => {
  const titleContext = inputs.songTitle
    ? `- **Project Name**: ${inputs.songTitle}`
    : "";
  const artistContext = inputs.artistReference
    ? `- **Artist References**: ${inputs.artistReference}`
    : "";
  const genreContext = inputs.genre?.join(", ") || "Not specified";
  const vibeContext = inputs.vibe?.join(", ") || "Not specified";
  const instrumentContext = inputs.availableInstruments || "Not specified";
  const dawContext = inputs.daw ? inputs.daw : "Not specified";
  const pluginContext = inputs.plugins ? inputs.plugins : "Stock/Generic plugins";
  const keyContext = inputs.key ? `Key: ${inputs.key}` : "";
  const scaleContext = inputs.scale ? `Scale/Mode: ${inputs.scale}` : "";
  const chordsContext = inputs.chords
    ? `Chord Progression: ${inputs.chords}`
    : "";
  const referenceContext = inputs.referenceTrackLink
    ? `Reference Track: ${inputs.referenceTrackLink}`
    : "";
  const lyricsContext = inputs.lyrics?.trim()
    ? `- Provided Lyrics (use to infer imagery, tone; quote sparingly):
${inputs.lyrics.trim()}`
    : "";
  const notesContext = inputs.generalNotes
    ? `Additional Notes: ${inputs.generalNotes}`
    : "";

  const structuralBlueprint = buildStructuralBlueprint();
  const pluginSection = buildPluginParameterSection(inputs.daw, inputs.plugins);
  const vocalSection = buildVocalProcessingSection(inputs.daw, inputs.plugins);

  const prompt = `You are TrackGuideAI, an expert music production assistant specializing in comprehensive track creation guides.

Create a detailed TrackGuide for the following specifications:
${titleContext}
${artistContext}
- **Genre**: ${genreContext}
- **Vibe**: ${vibeContext}
- **Available Instruments**: ${instrumentContext}
- **DAW**: ${dawContext}
- **Plugins**: ${pluginContext}
${keyContext}
${scaleContext}
${chordsContext}
${referenceContext}
${lyricsContext}
${notesContext}

At the end of your opening summary sentence, always add: This guide is a starting point—remember to use your ears and trust your intuition throughout the process.

IMPORTANT REQUIREMENTS:
1. Include a single Structural Blueprint table with a fourth column Flow / Energy Notes (merge arrangement/energy into this table; do not create a separate arrangement section)
2. Use specific plugin parameters when DAW/plugins are specified
3. Provide actionable, detailed guidance for each section
4. Use markdown formatting with proper headers and emphasis

Required Sections:

${structuralBlueprint}

## 🎵 Genre DNA Analysis
Core Characteristics:
- Tempo range and feel
- Harmonic structure and chord progressions
- Rhythmic patterns and groove elements
- Sonic palette and instrumentation choices

Reference Analysis:
${inputs.referenceTrackLink ? `Analyze the provided reference track for key production techniques and arrangement ideas.` : `Draw from classic examples in the ${genreContext} genre for inspiration.`}

## 🎹 Instrument & Sound Design

Primary Elements:
- Lead sounds: Character, processing, and role
- Bass design: Sub content, mid presence, and groove
- Drum programming: Kick selection, snare character, hi-hat patterns
- Harmonic elements: Pad textures, chord voicings, arpeggios

Sound Shaping:
- Synthesis techniques and oscillator choices
- Filter movements and modulation
- Effects processing and spatial placement
- Layering strategies for fullness

### 🔌 Plugin Chains by Instrument

For each core instrument (e.g., Lead Synth, Bass, Drums, Harmonic Layers), include:
- Plugin Chain: Show the full processing chain using the format → [Plugin → Plugin → Plugin]
- Detailed Parameters: Give specific values for relevant plugin settings (e.g., filters, envelopes, modulation, FX)

${pluginSection}
${vocalSection}

## 🎚️ Mixing & Arrangement Strategy
Context: For this track — ${genreContext}, ${vibeContext} — optimize space around the topline (if present) and low-end movement.

### Mix Matrix (only include elements that exist in Available Instruments or structural blueprint)
| Element | Main EQ (Hz/dB/Q) | Comp (ratio/att/release/GR) | Sidechain (source/amt) | Pan/Width | Reverb/Delay Sends |
|---|---|---|---|---|---|
| Kick | HPF off; notch 250 Hz (-2 dB, Q 1.2) | 4:1 / 10ms / 80ms / 2–3 dB | — | C / 10–20%W | Room - small (10%), slap 1/16 (5%) |
| Sub-Bass | LPF 100 Hz; HPF 25–30 Hz | 3:1 / 15ms / 120ms / 2–4 dB | Kick → 3–5 dB | C / 20–30%W | Short plate (5–10%), no delay |
| Mid-Bass | HPF 35–40 Hz; dip 250–300 Hz (-2 dB) | 4:1 / 20ms / 150ms / 3 dB | Kick → 2–3 dB | C-5 / 30–40%W | Room (10–15%), 1/8 delay (5%) |
| Lead Synth | HPF 120–200 Hz; presence +2 dB @ 3–4 kHz | 2:1 / 15ms / 120ms / 1–2 dB | Snare (fills) → 1–2 dB | ±15 / 60–80%W | Plate 1.2–1.6s (15–25%), 1/8 ping-pong (10%) |
| Pad / Harmonics | HPF 150 Hz; air +1 dB @ 12–14 kHz | 2:1 / 30ms / 200ms / 1–2 dB | Kick → 1–2 dB (drops) | ±30 / 80–100%W | Hall 1.8–2.2s (20–35%), 1/4 note (8–12%) |
| Topline Vocal | HPF 80–100 Hz; de-mud 250–350 Hz (-1–2 dB); presence +2 dB @ 3 kHz if needed | 1176 fast 4:1 → LA-2A +2–3 dB | Duck pads/FX 1–2 dB | C / 20–30%W | Plate 1.0–1.3s (15–25%); timed throws |

### Sidechain Routing Map (bars & sections)
- Kick → Sub/Mid-Bass: Drops & busy verses, 3–5 dB.
- Kick → Pads: during build → drop transitions, 1–2 dB.
- Snare → Lead/FX tails: on fills, 1–2 dB.

### Stereo & Space Plan (targets)
- Centers: Kick, Snare, Sub-Bass, Lead Vox.
- Width: Pads 80–100%, Lead Synth 60–80%, Perc FX 50–70%.
- Depth: Short plate for leads, longer hall for pads; reduce wet by 5–10% before drops.
- Delay throws: on phrase tails (1/8 or 1/4 ping-pong, 8–12% send).`;

  const stream = await ai.models.generateContentStream({
    model: GEMINI_MODEL_NAME,
    contents: { parts: [{ text: prompt }] },
  });
  return stream;
};

/* ─────────────────────────────────────────────────────────────
 * Helpers
 * ────────────────────────────────────────────────────────────*/
function deriveLyricsFromTopline(tl: ToplineAnalysis): string | null {
  const phraseLines = (tl.phrases || [])
    .map((p) => (p.text || "").trim())
    .filter(Boolean);
  if (phraseLines.length >= 1) {
    return phraseLines.join("\n");
  }
  if (!Array.isArray(tl.pitchContour) || tl.pitchContour.length === 0)
    return null;
  const sorted = [...tl.pitchContour].sort((a, b) => a.time - b.time);
  const parts: string[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const cur = sorted[i];
    if (!cur?.lyric) continue;
    const prev = sorted[i - 1];
    const gap = prev ? cur.time - (prev.time + prev.duration) : 0;
    if (gap > 0.6) parts.push("\n");
    parts.push(cur.lyric);
  }
  const joined = parts.join(" ").replace(/\s*\n\s*/g, "\n").trim();
  return joined || null;
}

/* ─────────────────────────────────────────────────────────────
 * 1b) TrackGuide with Topline context (streamed)
 * ────────────────────────────────────────────────────────────*/
export async function* generateGuidebookFromToplineStream(
  inputs: UserInputs,
  topline?: ToplineAnalysis
): AsyncGenerator<{ text: string }, void, unknown> {
  if (!apiKey) throw new Error("API key not configured.");

  const tl: ToplineAnalysis =
    topline ?? {
      bpm: "Unable to detect",
      timeSignature: "Unable to detect",
      key: "Unable to detect",
      scale: "Unable to detect",
      tessitura: null,
      registerCenter: null,
      pitchContour: [],
      phrases: [],
      sections: [],
      motifSummary: "",
      chordCandidates: [],
    };

  const structuralBlueprint = buildStructuralBlueprint();
  const pluginSection = buildPluginParameterSection(inputs.daw, inputs.plugins);
  const vocalSection = buildVocalProcessingSection(inputs.daw, inputs.plugins);

  const titleContext = inputs.songTitle ? `- Project Name: ${inputs.songTitle}` : "";
  const artistContext = inputs.artistReference
    ? `- Artist References: ${inputs.artistReference}`
    : "";
  const genreContext = inputs.genre?.join(", ") || "Not specified";
  const vibeContext = inputs.vibe?.join(", ") || "Not specified";
  const instrumentContext = inputs.availableInstruments || "Not specified";
  const dawContext = inputs.daw ? inputs.daw : "Not specified";
  const pluginContext = inputs.plugins ? inputs.plugins : "Stock/Generic plugins";
  const keyContext = inputs.key ? `Key: ${inputs.key}` : "";
  const scaleContext = inputs.scale ? `Scale/Mode: ${inputs.scale}` : "";
  const chordsContext = inputs.chords ? `Chord Progression: ${inputs.chords}` : "";
  const referenceContext = inputs.referenceTrackLink
    ? `Reference Track: ${inputs.referenceTrackLink}`
    : "";
  const lyricsContext = inputs.lyrics?.trim()
    ? `- Provided Lyrics (use to infer imagery, tone; quote sparingly):
${inputs.lyrics.trim()}`
    : "";
  const notesContext = inputs.generalNotes
    ? `Additional Notes: ${inputs.generalNotes}`
    : "";

  const toplineOneLiner = [
    typeof tl.bpm === "number" ? `${tl.bpm} BPM` : null,
    tl.timeSignature && tl.timeSignature !== "Unable to detect"
      ? tl.timeSignature
      : null,
    tl.key && tl.key !== "Unable to detect" ? `${tl.key}` : null,
    tl.scale && tl.scale !== "Unable to detect" ? `${tl.scale}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const derivedLyrics = deriveLyricsFromTopline(tl);

  const lyricsSection =
    (derivedLyrics && derivedLyrics.length > 0) || (tl.phrases?.length || 0) > 0
      ? `
## 🎤 Vocal Topline & Lyrical Summary

**Topline Attributes:** ${toplineOneLiner || "—"}
${tl.tessitura ? `- Tessitura: ${tl.tessitura.low ?? ""}–${tl.tessitura.high ?? ""}\n` : ""}${
          tl.registerCenter ? `- Register Center: ${tl.registerCenter}\n` : ""
        }

${
  tl.phrases?.length
    ? `**Phrase Map (by beat timing):**
${tl.phrases
  .slice(0, 8)
  .map(
    (p) =>
      `- ${p.start}–${p.end}${p.text ? ` “${p.text}”` : ""}${
        p.intensity ? ` (${p.intensity})` : ""
      }`
  )
  .join("\n")}\n`
    : ""
}

${derivedLyrics ? `**Extracted Lyrics (best-effort):**\n${derivedLyrics}\n` : ""}

**Creative Use:** Let the topline guide your musical decisions:
- Repeating words can become rhythmic or melodic motifs.
- Emotional themes can shape sound choices (e.g., airy pads, aggressive stabs, filtered builds).
- Vocal intensity and phrasing can inspire transitions, breakdowns, and dynamic flow.
`
      : "";

  const prompt = `You are TrackGuideAI, an expert music production assistant specializing in detailed music production guides.

Create a professional-level TrackGuide based on the following creative direction:

${titleContext}
${artistContext}
- Genre: ${genreContext}
- Vibe: ${vibeContext}
- Available Instruments: ${instrumentContext}
- DAW: ${dawContext}
- Plugins: ${pluginContext}
${keyContext}
${scaleContext}
${chordsContext}
${referenceContext}
${lyricsContext}
${notesContext}

A vocal topline was uploaded. Use it as a reference for harmonic fit, arrangement pacing, emotional energy, and lyrical inspiration. It should not override the user’s inputs—but it can enrich your suggestions.

At the end of your opening summary sentence, add exactly: This guide is a starting point—remember to use your ears and trust your intuition throughout the process.

### Required Sections (keep this structure exactly):
${structuralBlueprint}

## 🎵 Genre DNA Analysis
- Core Characteristics (tempo feel, harmony, rhythm, sonic palette)
- Reference Analysis (${
    inputs.referenceTrackLink ? "Use the provided link." : `Draw from classic examples in ${genreContext}.`
  })
- Use topline phrasing/motifs to inspire rhythmic and melodic decisions

## 🎹 Instrument & Sound Design
Primary Elements:
- Lead sounds: Character, processing, and role
- Bass design: Sub content, mid presence, and groove
- Drum programming: Kick selection, snare character, hi-hat patterns
- Harmonic elements: Pad textures, chord voicings, arpeggios

Sound Shaping:
- Synthesis techniques and oscillator choices
- Filter movements and modulation
- Effects processing and spatial placement
- Layering strategies for fullness

${lyricsSection}

### 🔌 Plugin Chains by Instrument
Use this exact bullet format. Do not compress into paragraphs.

**Lead Synth**  
**Chain:** Vital → Auto Filter → Chorus-Ensemble → Reverb  
- Vital: Osc 1 Saw; FM from Osc 2 (30%); LFO → WT Position (1/8)  
- Auto Filter: HPF @ 200 Hz; Res 0.40  
- Chorus-Ensemble: Rate 0.3 Hz; Amount 40%  
- Reverb: Hall; Decay 1.3 s; Pre-delay 15 ms; Mix 30%

**Bass**  
**Chain:** Operator/Vital → Overdrive → EQ Eight → Compressor  
- Operator/Vital: Sub = Sine; Mid layer = Saw; FM 20%  
- Overdrive: Drive 15%; Tone 60%; Mix 30%  
- EQ Eight: HPF 30 Hz; Dip 250 Hz (-2 dB); Presence 3 kHz (+2 dB)  
- Compressor: 4–6:1; Attack 10–20 ms; Release 100–200 ms; Sidechain from Kick

**Drums**  
**Chain:** Drum Rack → Glue Compressor → EQ Eight → Saturator  
- Drum Rack: Punchy kick; snappy snare; tight closed hat  
- Glue: 3:1; Attack 10 ms; Release Auto; Soft Clip ON  
- EQ Eight: HPF hats @ 400 Hz; Snare +2 dB @ 5 kHz  
- Saturator: Drive +6–8 dB; Color 40%; Mix 20%

**Harmonic Layers / Pad**  
**Chain:** Jup-8 V / Prophet V → Auto Pan → Hybrid Reverb  
- Synth: Dual saws; slow attack; gentle LPF movement  
- Auto Pan: Rate 0.2 Hz; Amount 60%; Sine  
- Hybrid Reverb: Hall; Decay 2.0 s; Pre-delay 25 ms; Mix 35–40%

### 🛠️ Global Plugin Tips & FX Guidance
(Do not add any other “Processing Tips & Plugin Parameters” sections. Keep only this one global block.)

EQ Tips
- HPF non-bass elements ~30–40 Hz
- Cut 250–400 Hz muddiness
- Presence 2–5 kHz as needed

Compression
- Drum bus: 3–4:1, 10–30 ms attack, Auto release, 1–2 dB GR
- Bass: faster attack for sub control, slow/med release
- Leads: 2–4:1 with medium knee

Spatial FX
- Reverb: Hall/Plate 1.2–2.0 s; Pre-delay 10–25 ms; Wet 20–40%
- Delay: 1/8 or 1/4 ping-pong for hooks
- Chorus: 0.2–0.5 Hz, Mix < 40%

${vocalSection}

## 🎚️ Per-Song Mixing & Bus Plan (Specific)
- No generic advice. Reference this track’s BPM/key/sections/topline; give values with units.

| Element | Main EQ (Hz/dB/Q) | Comp | Sidechain | Pan/Width | Sends |
|---|---|---|---|---|---|
| Kick | HPF off; notch 250 Hz (-2 dB, Q 1.2) | 4:1 / 10ms / 80ms / 2–3 dB GR | — | C / 10–20%W | Room 10%, slap 1/16 5% |
| Sub-Bass | HPF 25–30 Hz; LPF 100 Hz | 3:1 / 15ms / 120ms / 2–4 dB | Kick→3–5 dB | C / 20–30%W | Plate 5–10% |
| Lead Synth | HPF 120–200 Hz; +2 dB @ 3–4 kHz | 2:1 / 15ms / 120ms / 1–2 dB | Snare fills→1–2 dB | ±15 / 60–80%W | Plate 15–25%, 1/8 PP 10% |
| Topline | HPF 80–100 Hz; -1–2 dB @ 250–350 Hz | 1176 4:1 → LA-2A +2–3 dB | Duck pads/FX 1–2 dB | C / 20–30%W | Plate 15–25%; 1/4 throws |

## 🎼 Arrangement Flow & Energy Management (Song-Specific)
- Intro (bars e.g., 1–8): Thin drums; pad motif; leads low-cut 200 Hz.
- Verse (9–16): Sub enters; hats closed; throws only on phrase ends.
- Pre (17–24): Add arp 1/8 @ ${typeof tl.bpm === "number" ? tl.bpm : "tempo"} BPM; LPF 300→2 kHz; reduce reverb 10%.
- Drop (25–32): Full kit; open hats; sidechain pad/bass; double hook with Lead @ unison/+12.
- Break (33–40): Pull sub; spotlight topline; plate 20–25%, 1/4 throws.
- Final Drop (41–48): Extra perc layer; chord inversion swap; widen pads +10%.

Guidelines:
1. Use the vocal phrasing to inform dynamics and space.
2. Use the provided/extracted lyrics (if any) to drive tone, motifs, and dynamics—quote sparingly.
3. Repeated or standout words can become motifs in melody or rhythm.
4. Maintain a clear, DAW-ready writing style.
5. If something is ambiguous (e.g., key unknown), make a reasonable creative assumption—but state it clearly.`;

  const stream = await ai.models.generateContentStream({
    model: GEMINI_MODEL_NAME,
    generationConfig: {
      responseMimeType: "text/plain",
      temperature: 0.7,
    },
    contents: { parts: [{ text: prompt }] },
  });

  for await (const chunk of stream) {
    if ((chunk as any).text) yield { text: (chunk as any).text };
  }
}

/* ─────────────────────────────────────────────────────────────
 * 2) MIDI pattern suggestions (streaming JSON)
 * ────────────────────────────────────────────────────────────*/
export const generateMidiPatternSuggestions = async (
  settings: MidiSettings
): Promise<AsyncIterable<GenerateContentResponse>> => {
  const toplineRequested =
    Array.isArray(settings.targetInstruments) &&
    settings.targetInstruments.includes("topline_melody");

  const prompt = `You are TrackGuideAI's MIDI Pattern Generator. Return a single minified JSON object only.
Do not include prose, comments, backticks, or code fences.

Requirements:
- Key: ${settings.key}
- Scale/Mode: ${settings.scale || "Major/Natural Minor"}
- Tempo: ${settings.tempo} BPM
- Time Signature: ${settings.timeSignature.join("/")}
- Chord Progression: ${settings.chordProgression}
- Genre Context: ${settings.genre}
- Song Section: ${settings.songSection || "General Loop"}
- Bars: ${settings.bars}
- Target Instruments: ${settings.targetInstruments.join(", ")}
- Guidebook Context: ${settings.guidebookContext || "Not specified"}
- Topline present/requested: ${toplineRequested ? "yes" : "no"}

Topline Melody Track (VERY IMPORTANT):
- If a vocal topline was uploaded in this project or "topline_melody" appears in Target Instruments, output a separate track named "topline_melody" that cleanly follows the vocal’s pitch (smoothed/quantized notes).
- Do NOT merge the topline with "melody". You may output both "melody" and "topline_melody".
- If no topline exists and "topline_melody" was not requested, omit the "topline_melody" key entirely.

JSON Structure Required (example schema):
{
  "chords": [
    {"time": 0, "name": "Cm", "duration": 2,
     "notes": [{"pitch": "C4", "midi": 60}, {"pitch": "Eb4", "midi": 63}, {"pitch": "G4", "midi": 67}],
     "velocity": 90}
  ],
  "bassline": [
    {"time": 0, "midi": 36, "duration": 0.5, "velocity": 100, "pitch": "C2"}
  ],
  "melody": [
    {"time": 0, "midi": 72, "duration": 1, "velocity": 95, "pitch": "C5"}
  ],
  "topline_melody": [
    {"time": 0, "midi": 74, "duration": 0.5, "velocity": 90, "pitch": "D5"}
  ],
  "drums": {
    "kick": [{"time": 0, "duration": 0.25, "velocity": 120}, {"time": 2, "duration": 0.25, "velocity": 115}],
    "snare": [{"time": 1, "duration": 0.25, "velocity": 100}, {"time": 3, "duration": 0.25, "velocity": 105}],
    "hihat_closed": [{"time": 0.5, "duration": 0.125, "velocity": 80}, {"time": 1.5, "duration": 0.125, "velocity": 75}],
    "open_hihat": [{"time": 1.75, "duration": 0.5, "velocity": 85}],
    "clap": [{"time": 1, "duration": 0.25, "velocity": 95}],
    "tom_high": [{"time": 3.5, "duration": 0.25, "velocity": 90}],
    "tom_mid": [{"time": 3.75, "duration": 0.25, "velocity": 95}],
    "tom_low": [{"time": 4, "duration": 0.5, "velocity": 100}],
    "crash_cymbal_1": [{"time": 0, "duration": 2, "velocity": 110}],
    "ride_cymbal_1": [{"time": 0.5, "duration": 0.25, "velocity": 70}]
  }
}

CRITICAL REQUIREMENTS:
1. Return ONLY valid JSON. NO explanatory text, NO markdown formatting, NO code blocks, NO backticks.
2. Start the response directly with { and end with } (minified is preferred).
3. Do not wrap the JSON in code blocks or quotes.
4. All time values must be in beats (0 to ${settings.bars * 4} for 4/4 sections).
5. All MIDI numbers must be integers between 21–108.
6. All durations must be positive numbers.
7. All velocities must be integers between 1–127.
8. Drum elements must fit ${settings.genre} and the ${settings.songSection || "General Loop"} context.
9. Do not merge "topline_melody" into "melody".
10. Use snake_case keys only. Omit keys that have no content (no empty arrays or nulls).
11. Keep notes/midi events on-grid unless genre-specific syncopation is required.`;

  return ai.models.generateContentStream({
    model: GEMINI_MODEL_NAME,
    contents: { parts: [{ text: prompt }] },
  });
};

/* ─────────────────────────────────────────────────────────────
 * 2b) MIDI from Topline (streaming JSON)
 * ────────────────────────────────────────────────────────────*/
export const generateMidiFromTopline = async (
  settings: MidiFromToplineSettings
): Promise<AsyncIterable<GenerateContentResponse>> => {
  const { topline, avoidDoublingMelody } = settings;

  const prompt = `You are TrackGuideAI's MIDI Generator. Output VALID JSON only.

Goal:
Create chords, bass, (optionally) a counterline melody, and drums that support a given vocal topline. Also include a direct MIDI transcription of the vocal as "topline_melody".

Constraints:
1) For any beat range where the vocal sustains notes (t..t+d), the chord must include tones that fit those notes.
2) If "avoidDoublingMelody" is true, "melody" should be a COUNTERLINE that avoids unison with the vocal; place notes mainly in vocal gaps.
3) "topline_melody" must mirror the uploaded vocal’s pitchContour as MIDI notes with the same time/duration and reasonable velocities.
4) Times are in beats [0..${settings.bars * 4}]. MIDI 21–108. Velocity 1–127. Durations > 0.

Global Settings:
- Key: ${settings.key}
- Scale/Mode: ${settings.scale || "Major/Natural Minor"}
- Tempo: ${settings.tempo} BPM
- Time Signature: ${settings.timeSignature.join("/")}
- Chord Progression: ${settings.chordProgression}
- Genre Context: ${settings.genre}
- Bars: ${settings.bars}
- Song Section: ${settings.songSection || "General Loop"}
- Guidebook Context: ${settings.guidebookContext || "Not specified"}
- Avoid Doubling Melody: ${avoidDoublingMelody ? "true" : "false"}

Topline Summary:
- Key/Scale (detected): ${topline.key} / ${topline.scale}
- Tessitura: ${
    topline.tessitura ? `${topline.tessitura.low}–${topline.tessitura.high}` : "Unknown"
  }
- Phrase count: ${topline.phrases?.length ?? 0}
- First 6 notes: ${topline.pitchContour
    .slice(0, 6)
    .map((n) => `${n.time}:${n.pitch}`)
    .join(", ")}

Required JSON structure (return ONLY this JSON; no code fences/backticks/text):
{
  "chords": [ { "time": number, "name": "Cmin7", "duration": number, "notes": [{"pitch":"C4","midi":60}], "velocity": number } ],
  "bassline": [ { "time": number, "midi": number, "duration": number, "velocity": number, "pitch": "C2" } ],
  "melody": [ { "time": number, "midi": number, "duration": number, "velocity": number, "pitch": "G4" } ],
  "drums": {
    "kick": [ { "time": number, "duration": number, "velocity": number } ],
    "snare": [ { "time": number, "duration": number, "velocity": number } ],
    "hihat_closed": [ { "time": number, "duration": number, "velocity": number } ],
    "open_hihat": [ { "time": number, "duration": number, "velocity": number } ],
    "clap": [ { "time": number, "duration": number, "velocity": number } ],
    "tom_high": [ { "time": number, "duration": number, "velocity": number } ],
    "tom_mid": [ { "time": number, "duration": number, "velocity": number } ],
    "tom_low": [ { "time": number, "duration": number, "velocity": number } ],
    "crash_cymbal_1": [ { "time": number, "duration": number, "velocity": number } ],
    "ride_cymbal_1": [ { "time": number, "duration": number, "velocity": number } ]
  },
  "topline_melody": [ { "time": number, "midi": number, "duration": number, "velocity": number, "pitch": "G4" } ]
}

Rules:
- chords: align with vocal notes underneath; cadence near phrase ends.
- bassline: reinforce root motion; keep pocket with kick.
- melody: if avoidDoublingMelody=true, keep mainly in gaps; otherwise you may echo/support topline.
- drums: pick elements appropriate for ${settings.genre}; accent phrase ends.
- topline_melody: copy the uploaded vocal melody (pitchContour) into MIDI notes.`;

  const stream = await ai.models.generateContentStream({
    model: GEMINI_MODEL_NAME,
    contents: { parts: [{ text: prompt }] },
  });
  return stream;
};

/* ─────────────────────────────────────────────────────────────
 * 3) Mix Feedback (text) & 4) Mix Comparison (text)
 * ────────────────────────────────────────────────────────────*/
export const generateMixFeedback = async (
  inputs: MixFeedbackInputs
): Promise<string> => {
  const prompt = `You are TrackGuideAI's Mix Analysis Expert. Provide detailed mix feedback.

Track Analysis:
- Track Name: ${inputs.trackName}
- Focus Areas: ${inputs.focus || "Overall mix balance and clarity"}
- User Notes: ${inputs.notes || inputs.userNotes || "No specific notes provided"}

Analysis Framework:
1. Frequency Balance
2. Spatial Characteristics
3. Dynamic Properties
4. Technical Assessment

Provide specific, actionable feedback with frequencies, dB amounts, plugins and parameters.`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL_NAME,
    contents: { parts: [{ text: prompt }] },
  });
  return response.text || "Unable to generate mix feedback. Please try again.";
};

export const generateMixComparison = async (
  inputs: MixComparisonInputs
): Promise<string> => {
  const { dawName } = inputs;

  let dawSpecificAdvice = "";
  if (dawName) {
    const daw = dawMetadata.find((d: DawMetadata) => d.dawName === dawName);
    if (daw) {
      dawSpecificAdvice = `
${"##"} 🎛️ ${dawName}-Specific Recommendations

Stock Plugins: ${daw.stockPlugins.EQ.join(", ")} (EQ), ${
        daw.stockPlugins.Compression.join(", ")
      } (Compression), ${daw.stockPlugins.Reverb.join(", ")} (Reverb), ${
        daw.stockPlugins.Delay.join(", ")
      } (Delay). Creative: ${daw.stockPlugins.Creative.join(", ")}
Workflow Tips: ${daw.workflowTips.join("; ")}
`;
    }
  }

  const prompt = `You are an expert mixing & mastering AI. The user has uploaded two mixes:

Mix A: "${inputs.mixAName}" — an earlier version
Mix B: "${inputs.mixBName}" — the current working version

Instructions:
- Focus actionable feedback on improving Mix B.
- Note strengths in Mix A only as comparisons.
- Acknowledge improvements made in Mix B.

Provide Markdown sections:
Overall Comparison
Frequency Balance
Stereo Image & Depth
Dynamics & Loudness
Technical Quality
Strengths & Opportunities (for Mix B)
Actionable Recommendations (for Mix B only)
${dawSpecificAdvice}`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL_NAME,
    contents: { parts: [{ text: prompt }] },
  });
  return response.text || "Unable to generate mix comparison. Please try again.";
};

/* ─────────────────────────────────────────────────────────────
 * 5) Analyze Topline (strict JSON) -> normalized ToplineAnalysis
 * ────────────────────────────────────────────────────────────*/
export const analyzeTopline = async (
  audio:
    | File
    | Blob
    | string
    | {
        base64?: string;
        audioBase64?: string;
        data?: any;
        mimeType?: string;
        filename?: string;
      }
): Promise<ToplineAnalysis> => {
  if (!apiKey) throw new Error("API key not configured.");

  const rawJson = await analyzeToplineRawJSON(audio);
  const cleansedRaw = sanitizeJsonTopline(rawJson);

  const parsed = parseAiToplineResponse<ToplineAnalysisAIResponse>(cleansedRaw);
  if (!parsed.ok) {
    console.error("[Topline JSON parse error]", parsed.error, parsed.raw);
    return {
      bpm: "Unable to detect",
      timeSignature: "Unable to detect",
      key: "Unable to detect",
      scale: "Unable to detect",
      tessitura: null,
      registerCenter: null,
      pitchContour: [],
      phrases: [],
      sections: [],
      motifSummary: "",
      chordCandidates: [],
    };
  }

  const finalTopline = normalizeTopline(parsed.data);
  if (!Array.isArray(finalTopline.pitchContour)) finalTopline.pitchContour = [];
  if (!Array.isArray(finalTopline.phrases)) finalTopline.phrases = [];
  if (!Array.isArray(finalTopline.sections)) finalTopline.sections = [];
  if (!Array.isArray(finalTopline.chordCandidates)) finalTopline.chordCandidates = [];

  return finalTopline;
};

/* ─────────────────────────────────────────────────────────────
 * 5b) AI Assistant (streaming)
 * ────────────────────────────────────────────────────────────*/
export const generateAIAssistantResponse = async (
  conversation: ChatMessage[],
  guidebook: GuidebookEntry,
  additionalContext?: {
    remixGuideContent?: string;
    mixFeedbackContent?: string;
    mixComparisonContent?: string;
    patchGuideContent?: string;
    activeView?: string;
  }
): Promise<AsyncIterable<GenerateContentResponse>> => {
  const history = conversation
    .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
    .join("\n");

  const contextInfo = `
Current Guidebook Context:
- Title: ${guidebook.title}
- Genre: ${guidebook.genre.join(", ")}
- Vibe: ${guidebook.vibe.join(", ")}
- DAW: ${guidebook.daw}
- Key: ${guidebook.key || "Not specified"}
- Available Instruments: ${guidebook.availableInstruments}`;

  let additionalGuideContext = "";
  if (additionalContext) {
    const {
      remixGuideContent,
      mixFeedbackContent,
      mixComparisonContent,
      patchGuideContent,
      activeView,
    } = additionalContext;

    if (activeView) additionalGuideContext += `\nCurrent View: ${activeView}`;
    if (remixGuideContent)
      additionalGuideContext += `\n\nActive RemixGuide:\n${remixGuideContent.substring(
        0,
        2000
      )}${remixGuideContent.length > 2000 ? "..." : ""}`;
    if (mixFeedbackContent)
      additionalGuideContext += `\n\nActive Mix Feedback:\n${mixFeedbackContent.substring(
        0,
        2000
      )}${mixFeedbackContent.length > 2000 ? "..." : ""}`;
    if (mixComparisonContent)
      additionalGuideContext += `\n\nActive Mix Comparison:\n${mixComparisonContent.substring(
        0,
        2000
      )}${mixComparisonContent.length > 2000 ? "..." : ""}`;
    if (patchGuideContent)
      additionalGuideContext += `\n\nActive PatchGuide:\n${patchGuideContent.substring(
        0,
        2000
      )}${patchGuideContent.length > 2000 ? "..." : ""}`;
  }

  const prompt = `You are TrackGuideAI, an expert music production assistant. You're helping a user with their current track project.

${contextInfo}${additionalGuideContext}

Conversation History:
${history}

Your Role:
- Provide specific, actionable music production advice
- Reference the current guidebook context when relevant
- Integrate insights from any active guides (RemixGuide, Mix Feedback, Mix Comparison, PatchGuide)
- Offer technical solutions and creative suggestions based on all available context
- Ask clarifying questions when needed
- Maintain a helpful, professional tone

Response Guidelines:
- CRITICAL: DO NOT use any markdown formatting - no asterisks, no bold, no lists with asterisks
- Present complete information in a concise, direct format
- Use numbered lists (1. 2. 3.) for steps or items
- Use simple "Name: value" pairs for parameters (Attack: 10ms)
- Keep paragraphs focused
- For workflows or processes, use clear numbered steps
- Provide 3-4 options when listing techniques
- Use scannable sections with clear headers`;

  const stream = await ai.models.generateContentStream({
    model: GEMINI_MODEL_NAME,
    contents: { parts: [{ text: prompt }] },
  });
  return stream;
};

/* ─────────────────────────────────────────────────────────────
 * 6) Remix Guide (streaming + one-shot)
 * ────────────────────────────────────────────────────────────*/
export async function* generateRemixGuideStream(
  audioData: { base64: string; mimeType: string },
  targetGenre: string,
  genreInfo: any,
  daw?: string,
  plugins?: string
): AsyncGenerator<{ text: string; metadata?: any }, void, unknown> {
  if (!apiKey) throw new Error("API Key not configured.");

  try {
    const tempoRange = genreInfo?.tempoRange
      ? `${genreInfo.tempoRange[0]}-${genreInfo.tempoRange[1]} BPM`
      : "120-130 BPM";
    const sections = genreInfo?.sections || ["Intro", "Build-Up", "Drop", "Breakdown", "Outro"];

    let metadataBlock: any = null;
    try {
      const { getGenreMetadata } = await import("../constants/genreMetadata");
      metadataBlock = getGenreMetadata(targetGenre);
    } catch {
      /* optional */
    }

    const chordProgressions =
      metadataBlock?.chordProgressions?.join(", ") ||
      "Standard progressions for this genre";
    const productionTips =
      metadataBlock?.productionTips?.join(", ") || "Standard production techniques";
    const scalesAndModes = metadataBlock?.scalesAndModes || "Appropriate scales for this genre";
    const songStructure = metadataBlock?.songStructure || sections.join(" → ");
    const dynamicRange = metadataBlock?.dynamicRange || "Standard dynamics for this genre";
    const relatedGenres = metadataBlock?.relatedGenres?.join(", ") || "Similar genres";

    const structuralBlueprint = buildStructuralBlueprint();
    const pluginSection = buildPluginParameterSection(daw, plugins);

    const prompt = `You are TrackGuideAI's Remix Specialist. Analyze the uploaded audio track and create a comprehensive remix guide for transforming it into ${targetGenre} style.

User Production Setup:
- DAW: ${daw || "Not specified"}
- Available Plugins: ${plugins || "Stock/Generic plugins"}

Target Genre: ${targetGenre}
Target Tempo Range: ${tempoRange}
Suggested Sections: ${sections.join(", ")}
${metadataBlock?.drumPatterns ? `Typical Drum Patterns: ${metadataBlock.drumPatterns}` : ""}
Common Chord Progressions: ${chordProgressions}
Typical Scales/Modes: ${scalesAndModes}
Song Structure: ${songStructure}
Dynamic Characteristics: ${dynamicRange}
Related Genres for Inspiration: ${relatedGenres}
Production Techniques: ${productionTips}

Create a detailed markdown remix guide including:
# 🎵 REMIX GUIDE: [Original Track] → ${targetGenre}
## 🎧 Original Track DNA Analysis
- Original Tempo: [Exact BPM]
- Original Key: [Key]
- Harmonic Blueprint: [Chord names + Roman numerals]
- Rhythmic Feel: [Time signature and groove]
- Sonic Character: [Tonal qualities and instrumentation]

Transformation Strategy:
- Target Tempo: [BPM within ${tempoRange}]
- Target Key: [Key for ${targetGenre}]
- Genre Adaptation: [Approach]

${structuralBlueprint}

## 🎹 Sound Design & Instrumentation Transformation
Lead Elements: techniques and parameters
Rhythm Section: drum programming, bass design, percussion
Harmonic Content: chord voicings, pads, arps

Signal Chain Recommendations:
${pluginSection}

## 🎚️ Production Techniques & Processing
Arrangement Strategy: transitions, energy
Mix Approach: EQ, dynamics, space
Creative FX: reverb/delay/modulation/distortion

## 🎼 Step-by-Step Remix Process
Preparation → Foundation → Development → Arrangement → Mix & Master

## 🔥 Pro Tips for ${targetGenre} Remix Success
Pitfalls, signature elements, creative opportunities`;

    const audioPart = {
      inlineData: { mimeType: audioData.mimeType, data: audioData.base64 },
    };
    const promptPart = { text: prompt };
    const contents = [audioPart, promptPart];

    const response = await ai.models.generateContentStream({
      model: GEMINI_MODEL_NAME,
      contents: { parts: contents },
    });

    let fullText = "";
    for await (const chunk of response) {
      const text = (chunk as any).text;
      if (text) {
        fullText += text;
        yield { text };
      }
    }

    const metadata = extractRemixMetadata(fullText);
    yield { text: "", metadata };
  } catch (error) {
    console.error("Error generating remix guide stream:", error);
    throw new Error(
      `Failed to generate remix guide: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

function extractRemixMetadata(content: string): any {
  const metadata: any = {};
  const originalTempoMatch = content.match(
    /Original Tempo:\s*(\d+(?:\.\d+)?)(?:\s*BPM)?/i
  );
  if (originalTempoMatch) metadata.originalTempo = parseFloat(originalTempoMatch[1]);

  const targetTempoMatch = content.match(
    /Target Tempo:\s*(\d+(?:\.\d+)?)(?:\s*BPM)?/i
  );
  if (targetTempoMatch) metadata.targetTempo = parseFloat(targetTempoMatch[1]);

  const originalKeyMatch = content.match(
    /Original Key:\s*([A-G][#b]?\s*(?:major|minor|maj|min)(?:\s*→\s*[A-G][#b]?\s*(?:major|minor|maj|min))*)/i
  );
  if (originalKeyMatch) {
    metadata.originalKey = originalKeyMatch[1];
    if (originalKeyMatch[1].includes("→")) {
      metadata.keyModulation = true;
      const keys = originalKeyMatch[1].split("→").map((k) => k.trim());
      metadata.startingKey = keys[0];
      metadata.endingKey = keys[keys.length - 1];
    }
  }

  const targetKeyMatch = content.match(
    /Target Key:\s*([A-G][#b]?\s*(?:major|minor|maj|min))/i
  );
  if (targetKeyMatch) metadata.targetKey = targetKeyMatch[1];

  const chordProgMatch = content.match(/Harmonic Blueprint:\s*([^\n]+)/i);
  if (chordProgMatch) {
    const progressionText = chordProgMatch[1].trim();
    metadata.originalChordProgression = progressionText;
  }

  const sectionsMatch = content.match(/Sections:\s*\[(.*?)\]/i);
  if (sectionsMatch) {
    metadata.sections = sectionsMatch[1]
      .split(",")
      .map((s) => s.trim().replace(/"/g, ""));
  }

  return metadata;
}

export async function generateRemixGuide(
  audioData: { base64: string; mimeType: string },
  targetGenre: string,
  genreInfo: any,
  daw?: string,
  plugins?: string
): Promise<{
  guide: string;
  targetTempo: number;
  targetKey: string;
  sections: string[];
  originalKey?: string;
  originalTempo?: number;
  originalChordProgression?: string;
}> {
  if (!apiKey) {
    throw new Error(
      "API Key not configured. Cannot connect to Gemini API for remix guide."
    );
  }
  try {
    const tempoRange = genreInfo?.tempoRange
      ? `${genreInfo.tempoRange[0]}-${genreInfo.tempoRange[1]} BPM`
      : "120-130 BPM";
    const sections = genreInfo?.sections || [
      "Intro",
      "Build-Up",
      "Drop",
      "Breakdown",
      "Outro",
    ];

    let metadataBlock: any = null;
    let chordProgressions = "";
    let productionTips = "";
    let scalesAndModes = "";
    let songStructure = "";
    let dynamicRange = "";
    let relatedGenres = "";
    try {
      const { getGenreMetadata } = await import("../constants/genreMetadata");
      metadataBlock = getGenreMetadata(targetGenre);
      if (metadataBlock) {
        chordProgressions = Array.isArray(metadataBlock.chordProgressions)
          ? metadataBlock.chordProgressions.join(", ")
          : "Standard progressions for this genre";
        productionTips = Array.isArray(metadataBlock.productionTips)
          ? metadataBlock.productionTips.join(", ")
          : "Standard production techniques";
        scalesAndModes =
          typeof metadataBlock.scalesAndModes === "string"
            ? metadataBlock.scalesAndModes
            : "Appropriate scales for this genre";
        songStructure =
          typeof metadataBlock.songStructure === "string"
            ? metadataBlock.songStructure
            : sections.join(" → ");
        dynamicRange =
          typeof metadataBlock.dynamicRange === "string"
            ? metadataBlock.dynamicRange
            : "Standard dynamics for this genre";
        relatedGenres = Array.isArray(metadataBlock.relatedGenres)
          ? metadataBlock.relatedGenres.join(", ")
          : "Similar genres";
      } else {
        chordProgressions = "Standard progressions for this genre";
        productionTips = "Standard production techniques";
        scalesAndModes = "Appropriate scales for this genre";
        songStructure = sections.join(" → ");
        dynamicRange = "Standard dynamics for this genre";
        relatedGenres = "Similar genres";
      }
    } catch {
      chordProgressions = "Standard progressions for this genre";
      productionTips = "Standard production techniques";
      scalesAndModes = "Appropriate scales for this genre";
      songStructure = sections.join(" → ");
      dynamicRange = "Standard dynamics for this genre";
      relatedGenres = "Similar genres";
    }

    const structuralBlueprint = buildStructuralBlueprint();
    const pluginSection = buildPluginParameterSection(daw, plugins);
    const prompt = `You are TrackGuideAI's Remix Specialist. You have received an audio file (provided as base64) and must analyze ONLY the uploaded audio to extract tempo, key, chord progressions, and rhythm.

User Production Setup:
- DAW: ${daw || "Not specified"}
- Available Plugins: ${plugins || "Stock/Generic plugins"}

Response JSON schema (return ONLY this JSON):
{
  "guide": "FULL_MARKDOWN_GUIDE_HERE",
  "originalTempo": 120,
  "originalKey": "C minor",
  "originalChordProgression": "Am - C - F - G [i - III - VI - VII]",
  "targetTempo": 128,
  "targetKey": "C minor",
  "sections": ["Intro", "Build-Up", "Drop", "Breakdown", "Outro"]
}

For the "guide", produce a detailed markdown document including:
- Original Track DNA Analysis (exact BPM/key if detectable, or "Unable to detect")
- Transformation Strategy
${structuralBlueprint}
- Sound Design & Instrumentation Transformation
- Production Techniques & Processing
- Step-by-Step Remix Process
- Pro Tips for ${targetGenre}`;

    const textPart = { text: prompt };
    const audioPart = {
      inlineData: { data: audioData.base64, mimeType: audioData.mimeType },
    };
    const contents = [audioPart, textPart];
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: { parts: contents },
    });
    const responseText: string = (response as any).text ?? "";
    if (typeof responseText !== "string" || !responseText) {
      throw new Error(
        "Received an unexpected response format from Gemini API for remix guide."
      );
    }
    let jsonStr = responseText.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) jsonStr = match[2].trim();

    let parsedResponse: any;
    try {
      parsedResponse = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse JSON response:", jsonStr);
      const tempoMatch = responseText
        ? responseText.match(/Original Tempo:\s*([\d.]+)/i)
        : null;
      const keyMatch = responseText
        ? responseText.match(
            /Original Key:\s*([A-G][#b]?\s*(?:major|minor|maj|min)?|Unable to detect)/i
          )
        : null;
      const chordMatch = responseText
        ? responseText.match(/Harmonic Blueprint:\s*([^\n]+|Unable to detect)/i)
        : null;
      return {
        guide: responseText || "",
        targetTempo: tempoMatch && tempoMatch[1] ? parseFloat(tempoMatch[1]) : -1,
        targetKey: keyMatch && keyMatch[1] ? keyMatch[1].trim() : "Unable to detect",
        sections,
        originalKey: keyMatch && keyMatch[1] ? keyMatch[1].trim() : "Unable to detect",
        originalTempo: tempoMatch && tempoMatch[1] ? parseFloat(tempoMatch[1]) : undefined,
        originalChordProgression:
          chordMatch && chordMatch[1] ? chordMatch[1].trim() : "Unable to detect",
      };
    }

    return {
      guide: parsedResponse?.guide ?? responseText,
      targetTempo: parsedResponse?.targetTempo,
      targetKey: parsedResponse?.targetKey,
      sections: parsedResponse?.sections ?? sections,
      originalKey: parsedResponse?.originalKey ?? "Unable to detect",
      originalTempo: parsedResponse?.originalTempo,
      originalChordProgression:
        parsedResponse?.originalChordProgression ?? "Unable to detect",
    };
  } catch (error) {
    console.error("Error generating remix guide:", error);
    return {
      guide: "",
      targetTempo: genreInfo?.tempoRange?.[0] || 128,
      targetKey: "Unable to detect",
      sections: genreInfo?.sections || ["Intro", "Build-Up", "Drop", "Breakdown", "Outro"],
      originalKey: "Unable to detect",
      originalTempo: -1,
      originalChordProgression: "Unable to detect",
    };
  }
}

/* ─────────────────────────────────────────────────────────────
 * 7) Mix Feedback with Audio (one-shot text)
 * ────────────────────────────────────────────────────────────*/
export const generateMixFeedbackWithAudio = async (
  inputs: MixFeedbackInputs
): Promise<string> => {
  const { dawName } = inputs;
  let dawContext = "";
  if (dawName) {
    const daw = getDawMetadata(dawName);
    if (daw) {
      dawContext = `
DAW Information:
- DAW: ${dawName}
- Workflow Tips: ${daw.workflowTips.join("; ")}
- Stock Plugins (EQ: ${daw.stockPlugins.EQ.join(", ")}; Compression: ${daw.stockPlugins.Compression.join(
        ", "
      )}; Reverb: ${daw.stockPlugins.Reverb.join(", ")}; Delay: ${daw.stockPlugins.Delay.join(
        ", "
      )}; Creative: ${daw.stockPlugins.Creative.join(", ")})`;
    }
  }

  const prompt = `You are TrackGuideAI's Advanced Mix Analysis Expert. Analyze the uploaded audio file and provide comprehensive mix feedback.

${dawContext}
Track Name: ${inputs.trackName || "Uploaded Mix"}
Focus Areas: ${inputs.focus || "Overall mix balance and clarity"}
User Notes: ${inputs.notes || inputs.userNotes || "No specific notes provided"}

Return a clear markdown report with sections for Frequency, Stereo/Space, Dynamics, Technical, and Actionable Recommendations.`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL_NAME,
    contents: { parts: [{ text: prompt }] },
  });
  return response.text || "Unable to generate analysis. Please try again.";
};

/* ─────────────────────────────────────────────────────────────
 * 7b) Harmony suggestions (quick)
 * ────────────────────────────────────────────────────────────*/
export const generateHarmonySuggestions = async (
  topline: ToplineAnalysis,
  targetParts: 2 | 3 = 2
): Promise<string> => {
  const prompt = `You are TrackGuideAI's Harmony Assistant. Propose ${targetParts} harmony parts for the uploaded vocal topline.

Detected:
- Key/Scale: ${topline.key} / ${topline.scale}
- Tessitura: ${topline.tessitura ? `${topline.tessitura.low}–${topline.tessitura.high}` : "Unknown"}
- Register Center: ${topline.registerCenter || "Unknown"}

Rules:
1) Keep intervals singable; avoid parallel perfect intervals for long spans.
2) Place harmonies mainly on sustained vowels; avoid busy consonant overlaps.
3) For each phrase, specify harmony intervals and suggested notes with entry/exit beats.
4) Mention blend strategy (EQ carve around the lead, 5–8 kHz de-ess if sibilant stack).

Output:
- Short overview
- Phrase-by-phrase bullet plan
- Quick mix checklist (HPF ranges, de-ess bands, bus comp idea)`;

  const resp = await ai.models.generateContent({
    model: GEMINI_MODEL_NAME,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.7,
    },
    contents: { parts: [{ text: prompt }] },
  });

  return (resp as any).text || "";
};

/* ─────────────────────────────────────────────────────────────
 * 8) Simple content helper
 * ────────────────────────────────────────────────────────────*/
export async function generateContent(prompt: string): Promise<string> {
  if (!apiKey) throw new Error("API Key not configured. Cannot connect to Gemini API.");
  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: { parts: [{ text: prompt }] },
    });
    const responseText = (response as any).text;
    if (typeof responseText !== "string") {
      throw new Error("Received an unexpected response format from Gemini API.");
    }
    return responseText;
  } catch (error: any) {
    console.error("Error generating content:", error);
    let specificMessage = "An unknown error occurred while generating content.";
    if (error instanceof Error) {
      specificMessage = error.message;
      if (
        error.message.includes("API key not valid") ||
        error.message.includes("permission")
      ) {
        specificMessage =
          "Invalid API Key or insufficient permissions. Please check your API key configuration.";
      } else if (
        error.message.toLowerCase().includes("network error") ||
        error.message.toLowerCase().includes("failed to fetch")
      ) {
        specificMessage = `Network error: Failed to connect to Gemini API. Please check your internet connection. (${error.message})`;
      }
    }
    throw new Error(specificMessage);
  }
}

/* ─────────────────────────────────────────────────────────────
 * 9) Non-streaming assistant response (simple)
 * ────────────────────────────────────────────────────────────*/
export const generateAIAssistantResponseSimple = async (
  message: string,
  context?: {
    currentGuidebook?: GuidebookEntry;
    userInputs?: UserInputs;
  }
): Promise<string> => {
  if (!apiKey) throw new Error("API Key not configured. Cannot connect to Gemini API.");
  try {
    const contextInfo = context
      ? `
Current Project Context:
- Genre: ${
          context.userInputs?.genre?.join(", ") ||
          context.currentGuidebook?.genre?.join(", ") ||
          "Not specified"
        }
- Vibe: ${
          context.userInputs?.vibe?.join(", ") ||
          context.currentGuidebook?.vibe?.join(", ") ||
          "Not specified"
        }
- DAW: ${context.userInputs?.daw || context.currentGuidebook?.daw || "Not specified"}
- Current guidebook: ${context.currentGuidebook?.title || "None"}
`
      : "";

    const prompt = `You are TrackGuideAI, an expert music production assistant. Help the user with their music production question.

${contextInfo}

User Question: ${message}

Response Guidelines:
- Provide helpful, concise advice with actionable steps
- Include specific parameter suggestions when applicable
- Maintain a professional but friendly tone

Provide your expert guidance:`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: { parts: [{ text: prompt }] },
    });

    const responseText = (response as any).text;
    if (typeof responseText !== "string") {
      throw new Error("Received an unexpected response format from Gemini API.");
    }
    return responseText;
  } catch (error: any) {
    console.error("Error generating AI assistant response:", error);
    let specificMessage = "An unknown error occurred while generating content.";
    if (error instanceof Error) {
      specificMessage = error.message;
      if (
        error.message.includes("API key not valid") ||
        error.message.includes("permission")
      ) {
        specificMessage =
          "Invalid API Key or insufficient permissions. Please check your API key configuration.";
      } else if (
        error.message.toLowerCase().includes("network error") ||
        error.message.toLowerCase().includes("failed to fetch")
      ) {
        specificMessage = `Network error: Failed to connect to Gemini API. Please check your internet connection. (${error.message})`;
      } else if (error.message.includes("Candidate was blocked")) {
        specificMessage =
          "The response was blocked by the AI. This might be due to content policies. Please try again or adjust your input.";
      }
    }
    throw new Error(specificMessage);
  }
};

/* ─────────────────────────────────────────────────────────────
 * 10) Streaming Mix Feedback / Mix Comparison (with audio)
 * ────────────────────────────────────────────────────────────*/
export async function* generateMixFeedbackWithAudioStream(
  inputs: MixFeedbackInputs
): AsyncGenerator<{ text: string }, void, unknown> {
  if (!apiKey) throw new Error("API Key not configured. Cannot connect to Gemini API for mix feedback.");
  if (!inputs.audioFile) throw new Error("Streaming mix feedback requires an audio file.");

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const audioBase64 = await fileToBase64(inputs.audioFile);

  const { dawName } = inputs;
  let dawContext = "";
  if (dawName) {
    const daw = getDawMetadata(dawName);
    if (daw) {
      dawContext = `
DAW Information:
- DAW: ${dawName}
- Workflow Tips: ${daw.workflowTips.join("; ")}
- Stock Plugins (EQ: ${daw.stockPlugins.EQ.join(", ")}; Compression: ${daw.stockPlugins.Compression.join(
        ", "
      )}; Reverb: ${daw.stockPlugins.Reverb.join(", ")}; Delay: ${daw.stockPlugins.Delay.join(
        ", "
      )}; Creative: ${daw.stockPlugins.Creative.join(", ")})`;
    }
  }

  const prompt = `You are TrackGuideAI's Advanced Mix Analysis Expert. Analyze the uploaded audio file and provide comprehensive mix feedback.

${dawContext}
- Track Name: ${inputs.trackName || "Uploaded Mix"}
- Focus Areas: ${inputs.focus || "Overall mix balance and clarity"}
- User Notes: ${inputs.notes || inputs.userNotes || "No specific notes provided"}

Return a clear markdown report with sections for Frequency, Stereo/Space, Dynamics, Technical, and Actionable Recommendations.`;

  const audioPart = { inlineData: { data: audioBase64, mimeType: "audio/mpeg" } };
  const promptPart = { text: prompt };
  const contents = [audioPart, promptPart];

  const stream = await ai.models.generateContentStream({
    model: GEMINI_MODEL_NAME,
    contents: { parts: contents },
  });

  for await (const chunk of stream) {
    if ((chunk as any).text) yield { text: (chunk as any).text };
  }
}

export async function* generateMixComparisonStream(
  inputs: MixComparisonInputs
): AsyncGenerator<{ text: string }, void, unknown> {
  if (!apiKey) throw new Error("API Key not configured. Cannot connect to Gemini API for mix comparison.");

  const prompt = `You are an expert mixing & mastering AI. The user has uploaded two mixes for comparison analysis.

Mix A: "${inputs.mixAName}" — an earlier version
Mix B: "${inputs.mixBName}" — the current working version

Instructions:
- Focus actionable feedback on improving Mix B.
- Note strengths in Mix A only as comparisons.
- Acknowledge improvements made in Mix B.

User Notes: ${inputs.userNotes || "No specific notes provided"}

Provide Markdown sections for Overall, Frequency, Stereo/Depth, Dynamics/Loudness, Technical, Strengths & Opportunities (B), and Actionable Recs (B).`;

  const mixATextPart = { text: `Mix A Audio (Earlier Version): "${inputs.mixAName}"` };
  const mixABase64Part = { inlineData: { data: inputs.mixAFile, mimeType: "audio/mpeg" } };

  const mixBTextPart = { text: `Mix B Audio (Current Version): "${inputs.mixBName}"` };
  const mixBBase64Part = { inlineData: { data: inputs.mixBFile, mimeType: "audio/mpeg" } };

  const contents = [mixABase64Part, mixATextPart, mixBBase64Part, mixBTextPart, { text: prompt }];

  const stream = await ai.models.generateContentStream({
    model: GEMINI_MODEL_NAME,
    contents: { parts: contents },
  });

  for await (const chunk of stream) {
    if ((chunk as any).text) yield { text: (chunk as any).text };
  }
}
