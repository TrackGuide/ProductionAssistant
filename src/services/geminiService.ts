// services/geminiService.ts

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GEMINI_MODEL_NAME } from "../constants/constants";
import {
  UserInputs,
  MidiSettings,
  MidiFromToplineSettings,   // NEW
  MixFeedbackInputs,
  MixComparisonInputs,
  ChatMessage,
  GuidebookEntry,
  ToplineAnalysis            // NEW
} from "../constants/types";
import { getDawMetadata, suggestPlugins, dawMetadata, DawMetadata } from "../constants/dawMetadata";
import { parseAiToplineResponse } from "../utils/jsonParsingUtils";
import { ToplineAnalysisAIResponse, normalizeTopline } from "../constants/types";

const apiKey = 
  process.env.API_KEY ||
  process.env.GEMINI_API_KEY ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY);

if (!apiKey) {
  throw new Error("API key not configured. Set GEMINI_API_KEY or VITE_GEMINI_API_KEY environment variable.");
}
const ai = new GoogleGenAI({ apiKey });

/**
 * Robust helpers to accept audio in multiple shapes:
 * - File/Blob
 * - data URL string ("data:audio/...;base64,XXXX")
 * - raw base64 string
 * - { base64, mimeType }
 * - { audioBase64, mimeType?, filename? }
 * - { data, mimeType } where data is string|ArrayBuffer|Uint8Array|Blob
 * - (ADDED) { file | audioFile | dataUrl | blob | buffer | arrayBuffer | bytes }
 */
// ADDED: tiny helper
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
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return (typeof btoa !== "undefined" ? btoa(binary) : Buffer.from(binary, "binary").toString("base64"));
}

// CHANGED: greatly expanded accepted shapes; removed unsafe fallback readAsDataURL on arbitrary objects
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
      return { base64: audio.slice(comma + 1), mimeType: mime || (mimeHint || "audio/wav") };
    }
    return { base64: audio, mimeType: mimeHint || "audio/wav" };
  }

  // 2) ArrayBuffer / Uint8Array
  if (_isArrayBufferLike(audio)) {
    return { base64: _arrayBufferToBase64(audio), mimeType: mimeHint || "audio/wav" };
  }

  // 3) Blob / File
  if (typeof Blob !== "undefined" && audio instanceof Blob) {
    const mimeType = (audio as any).type || (mimeHint || "audio/wav");
    const base64 = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onloadend = () => {
        try {
          const s = String(r.result);
          resolve(s.split(",")[1]);
        } catch (err) { reject(err); }
      };
      r.onerror = reject;
      r.readAsDataURL(audio);
    });
    return { base64, mimeType };
  }

  // 4) known object wrappers
  if (audio && typeof audio === "object") {
    // common keys we see in UI code
    if (audio.file instanceof Blob)         return _normalizeAudioInput(audio.file, audio.mimeType || mimeHint);
    if (audio.audioFile instanceof Blob)    return _normalizeAudioInput(audio.audioFile, audio.mimeType || mimeHint);
    if (audio.blob instanceof Blob)         return _normalizeAudioInput(audio.blob, audio.mimeType || mimeHint);

    // base64/dataUrl strings in various keys
    if (typeof audio.dataUrl === "string")  return _normalizeAudioInput(audio.dataUrl, audio.mimeType || mimeHint);
    if (typeof audio.audioBase64 === "string") {
      const fn = (audio as any).filename as (string | undefined);
      const guessed = _sniffMime(fn, mimeHint || "audio/wav");
      const raw = audio.audioBase64.includes(",") ? audio.audioBase64.split(",").pop()! : audio.audioBase64;
      return { base64: raw, mimeType: audio.mimeType || guessed };
    }
    if (typeof audio.base64 === "string") {
      const raw = audio.base64.includes(",") ? audio.base64.split(",").pop()! : audio.base64;
      return { base64: raw, mimeType: audio.mimeType || mimeHint || "audio/wav" };
    }

    // generic { data, mimeType }
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
            } catch (err) { reject(err); }
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

    // other buffer-like keys people use
    if (_isArrayBufferLike(audio.buffer)) {
      return { base64: _arrayBufferToBase64(audio.buffer), mimeType: audio.mimeType || mimeHint || "audio/wav" };
    }
    if (_isArrayBufferLike(audio.arrayBuffer)) {
      return { base64: _arrayBufferToBase64(audio.arrayBuffer), mimeType: audio.mimeType || mimeHint || "audio/wav" };
    }
    if (_isArrayBufferLike(audio.bytes)) {
      return { base64: _arrayBufferToBase64(audio.bytes), mimeType: audio.mimeType || mimeHint || "audio/wav" };
    }

    // filename-only hint
    if (audio.filename && typeof audio.filename === "string") {
      const guessed = _sniffMime(audio.filename, mimeHint || "audio/wav");
      // if the only thing we had was filename and nothing else, we can't extract data here
      // fall through to error below
      if (typeof audio.dataUrl === "string" || typeof audio.base64 === "string" || typeof audio.audioBase64 === "string") {
        // already handled above
      } else {
        // nothing usable to read actual bytes
      }
    }
  }

  // If we got here, we don't have something we can read safely.
  console.error("Unsupported audio shape passed to analyzeTopline:", audio);
  throw new Error("Unsupported audio input format for analyzeTopline.");
}

// ─────────────────────────────────────────────────────────────
// NEW: Force-JSON topline raw call (inserted right after _normalizeAudioInput)
// ─────────────────────────────────────────────────────────────
async function analyzeToplineRawJSON(
  audio: File | Blob | string | { base64?: string; audioBase64?: string; data?: any; mimeType?: string; filename?: string }
): Promise<string> {
  // Normalize many possible input shapes → { base64, mimeType }
  const norm = await _normalizeAudioInput(
    audio as any,
    typeof audio === "object" && audio && "filename" in audio ? _sniffMime((audio as any).filename) : undefined
  );

  if (!norm?.base64 || norm.base64.length < 32) {
    throw new Error("Topline analysis received empty audio data.");
  }

  const audioPart = {
    inlineData: { data: norm.base64, mimeType: norm.mimeType || "audio/wav" },
  } as const;

  // System-style instruction: STRICT JSON ONLY
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

  // Ask Gemini for JSON directly (responseMimeType triggers JSON-only)
  const resp = await ai.models.generateContent({
    model: GEMINI_MODEL_NAME,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2,
      topP: 0.9,
    },
    contents: { parts: [audioPart, { text: instruction }] },
  });

  // When responseMimeType is JSON, .text is the JSON string
  const raw = typeof resp.text === "function" ? resp.text() : resp.text ?? String(resp.response ?? "");
  return String(raw || "");
}


/**
 * Helper function to build plugin-specific parameter suggestions
 */
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

  // Get DAW-specific stock plugins from dawMetadata
  const dawData = daw ? getDawMetadata(daw) : null;
  
  const stockEQ = dawData && daw ? suggestPlugins(daw, 'EQ')[0] || 'Stock EQ' : 'Stock EQ';
  const stockCompression = dawData && daw ? suggestPlugins(daw, 'Compression')[0] || 'Stock Compressor' : 'Stock Compressor';
  const stockReverb = dawData && daw ? suggestPlugins(daw, 'Reverb')[0] || 'Stock Reverb' : 'Stock Reverb';
  const stockDelay = dawData && daw ? suggestPlugins(daw, 'Delay')[0] || 'Stock Delay' : 'Stock Delay';
  const stockCreative = dawData && daw ? suggestPlugins(daw, 'Creative')[0] || 'Stock Saturator' : 'Stock Saturator';

  const dawSpecific = daw && !plugins ? `**${daw} Stock Plugin Chain:**` : daw ? `**${daw}-Specific Settings:**` : '';
  const pluginSpecific = plugins ? `**Custom Plugin Chain (${plugins}):**` : '';

  return `
### 🎛️ Processing Tips & Plugin Parameters
${dawSpecific}
${pluginSpecific}

**EQ Parameters:**
${dawData && !plugins ? 
  `- ${stockEQ}: High-pass at ${daw?.toLowerCase().includes('logic') ? '35' : daw?.toLowerCase().includes('fl') ? '30' : '40'} Hz, Low-mid cut at ${daw?.toLowerCase().includes('logic') ? '300' : daw?.toLowerCase().includes('fl') ? '400' : '250'} Hz (-3dB), Presence boost at ${daw?.toLowerCase().includes('logic') ? '12 kHz (+1.5dB)' : daw?.toLowerCase().includes('fl') ? '15 kHz (+2dB)' : '3 kHz (+2dB)'}` :
  daw === 'Ableton Live' ? '- EQ Eight: High-pass at 40 Hz, Low-mid cut at 250 Hz (-3dB), Presence boost at 3 kHz (+2dB)' : 
  daw === 'Logic Pro' ? '- Channel EQ: High-pass at 35 Hz, Low-mid cut at 300 Hz (-2.5dB), High boost at 12 kHz (+1.5dB)' :
  daw === 'FL Studio' ? '- Parametric EQ 2: High-pass at 30 Hz, Mid cut at 400 Hz (-4dB), Air boost at 15 kHz (+2dB)' :
  '- High-pass filter: 20-40 Hz, Low-mid cut: 200-400 Hz (-2 to -4dB), Presence boost: 2-5 kHz (+1 to +3dB)'}

**Compression Settings:**
${dawData && !plugins ? 
  `- ${stockCompression}: Ratio ${daw?.toLowerCase().includes('logic') ? '3.5:1' : '4:1'}, Attack ${daw?.toLowerCase().includes('fl') ? '10ms' : daw?.toLowerCase().includes('logic') ? '20ms' : '15ms'}, Release ${daw?.toLowerCase().includes('logic') ? '150ms' : daw?.toLowerCase().includes('fl') ? '250ms' : '200ms'}${daw?.toLowerCase().includes('logic') ? ', Auto-Release enabled' : daw?.toLowerCase().includes('fl') ? ', Knee 3dB' : ', Knee 2dB'}` :
  daw === 'Ableton Live' ? '- Compressor: Ratio 4:1, Attack 15ms, Release 200ms, Knee 2dB' :
  daw === 'Logic Pro' ? '- Compressor: Ratio 3.5:1, Attack 20ms, Release 150ms, Auto-Release enabled' :
  daw === 'FL Studio' ? '- Fruity Compressor: Ratio 4:1, Attack 10ms, Release 250ms, Knee 3dB' :
  '- Ratio: 3:1 to 4:1, Attack: 10-30ms, Release: 100-300ms, Makeup: 2-6 dB'}

**Time-Based Effects:**
${dawData && !plugins ? 
  `- ${stockReverb}: Room/Hall setting, 1.2s decay, Pre-delay 20ms, Mix 25%
- ${stockDelay}: 1/8 note timing, Feedback 35%, High-cut 8kHz, Mix 20%` :
  daw === 'Ableton Live' ? '- Reverb: Hall algorithm, 1.3s decay, Pre-delay 15ms, Mix 30%\n- Echo: 1/8 note ping-pong, Feedback 30%, Filter cutoff 70%, Mix 25%' :
  daw === 'Logic Pro' ? '- ChromaVerb: Chamber setting, 1.2s decay, Pre-delay 20ms, Mix 25%\n- Delay Designer: 1/8 dotted, Feedback 40%, Low-cut 100Hz, High-cut 9kHz' :
  daw === 'FL Studio' ? '- Reeverb 2: Room size 70%, Diffusion 60%, Decay 1.4s, Mix 22%\n- Fruity Delay 3: Tempo-synced 1/8, Stereo offset 20ms, Feedback 35%' :
  '- Reverb: Medium room/hall, 1-1.5s decay, 15-25ms pre-delay, 20-30% mix\n- Delay: 1/8 or 1/4 note timing, 30-40% feedback, high-cut filter'}

**Recommended Signal Chain:**
${dawData && dawData.suggestedSignalChains && dawData.suggestedSignalChains.Synth ?
  `- ${dawData.suggestedSignalChains.Synth.join(' → ')}` :
  dawData ?
    `- ${stockEQ} → ${stockCompression} → ${stockCreative} → ${stockReverb}/${stockDelay}` :
    daw === 'Ableton Live' ? '- EQ Eight → Compressor → Saturator → Reverb/Echo → Limiter' :
    daw === 'Logic Pro' ? '- Channel EQ → Compressor → Tape → ChromaVerb/Delay Designer → Adaptive Limiter' :
    daw === 'FL Studio' ? '- Parametric EQ 2 → Fruity Compressor → Waveshaper → Reverb/Delay → Fruity Limiter' :
    plugins ? plugins : 'EQ → Compressor → Saturation → Reverb/Delay → Limiter'}`;
}

/**
 * Helper function to build structural blueprint with combined instrumentation
 */
function buildStructuralBlueprint(): string {
  return `
## 🎼 Structural Blueprint

<div className="overflow-x-auto">

| **Section** | **Duration** | **Key Elements & Instrumentation** |
| --- | --- | --- |
| **Intro** | 16-32 bars | Atmospheric build, Teaser elements<br/>*Lead synth, Bass, Drums, Pads* |
| **Verse 1** | 16 bars | Main groove, Vocal/Lead melody<br/>*Vocals, Full arrangement* |
| **Pre-Chorus** | 8 bars | Tension build, Filter sweeps<br/>*Reduced arrangement, Focus elements* |
| **Chorus** | 16 bars | Full energy, Hook elements<br/>*Full arrangement, Vocal harmonies* |
| **Breakdown** | 8-16 bars | Stripped back, Build tension<br/>*Breakdown elements, Build-up* |
| **Verse 2/Solo** | 16 bars | Variation, New elements<br/>*Lead elements, Minimal backing* |
| **Final Chorus** | 16-24 bars | Maximum energy, All elements<br/>*Full arrangement, Climax elements* |
| **Outro** | 16-32 bars | Gradual fade, Ambient tail<br/>*Fade elements, Ambient textures* |

</div>`;
}

// ⚡ Updated to include all UserInputs: title, artist, and guidebookContext
/**
 * 1. Generate the core TrackGuide content (streaming)
 */
export const generateGuidebookContent = async (
  inputs: UserInputs
): Promise<AsyncIterable<GenerateContentResponse>> => {
  const titleContext      = inputs.songTitle       ? `- **Project Name**: ${inputs.songTitle}`           : "";
  const artistContext     = inputs.artistReference ? `- **Artist References**: ${inputs.artistReference}` : "";
  const genreContext      = inputs.genre?.join(", ")  || "Not specified";
  const vibeContext       = inputs.vibe?.join(", ")   || "Not specified";
  const instrumentContext = inputs.availableInstruments || "Not specified";
  const dawContext        = inputs.daw               ? inputs.daw : "Not specified";
  const pluginContext     = inputs.plugins           ? inputs.plugins : "Stock/Generic plugins";
  const keyContext        = inputs.key               ? `Key: ${inputs.key}`                    : "";
  const scaleContext      = inputs.scale             ? `Scale/Mode: ${inputs.scale}`           : "";
  const chordsContext     = inputs.chords            ? `Chord Progression: ${inputs.chords}`    : "";
  const referenceContext  = inputs.referenceTrackLink
                               ? `Reference Track: ${inputs.referenceTrackLink}`
                               : "";
  const lyricsContext     = inputs.lyrics            ? `Lyrics Theme: ${inputs.lyrics}`         : "";
  const notesContext      = inputs.generalNotes      ? `Additional Notes: ${inputs.generalNotes}` : "";

  const structuralBlueprint = buildStructuralBlueprint();
  const pluginSection       = buildPluginParameterSection(inputs.daw, inputs.plugins);

  const prompt = `// ⚡ Including all fields

You are TrackGuideAI, an expert music production assistant specializing in comprehensive track creation guides.

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

**Note:** This guide is a starting point—remember to use your ears and trust your intuition throughout the process.

**IMPORTANT REQUIREMENTS:**
1. Include the exact Structural Blueprint table with Instrumentation column as provided
2. Use specific plugin parameters when DAW/plugins are specified
3. Provide actionable, detailed guidance for each section
4. Use markdown formatting with proper headers and emphasis

**Required Sections:**

${structuralBlueprint}

## 🎵 Genre DNA Analysis
**Core Characteristics:**
- Tempo range and feel
- Harmonic structure and chord progressions
- Rhythmic patterns and groove elements
- Sonic palette and instrumentation choices

**Reference Analysis:**
${inputs.referenceTrackLink ? `Analyze the provided reference track for key production techniques and arrangement ideas.` : `Draw from classic examples in the ${genreContext} genre for inspiration.`}

## 🎹 Instrument & Sound Design
**Primary Elements:**
- Lead sounds: Character, processing, and role
- Bass design: Sub content, mid presence, and groove
- Drum programming: Kick selection, snare character, hi-hat patterns
- Harmonic elements: Pad textures, chord voicings, arpeggios

**Sound Shaping:**
- Synthesis techniques and oscillator choices
- Filter movements and modulation
- Effects processing and spatial placement
- Layering strategies for fullness

${pluginSection}

## 🎚️ Mixing & Arrangement Strategy
**Frequency Management:**
- Low-end: Sub-bass vs bass guitar/synth separation
- Midrange: Vocal/lead clarity and instrument separation  
- High-end: Air, sparkle, and presence balance

**Spatial Design:**
- Stereo width: Center, sides, and phantom center elements
- Depth: Reverb sends, delay throws, and dry/wet balance
- Movement: Automation, panning, and filter sweeps

**Dynamic Control:**
- Compression: Individual tracks and bus processing
- Sidechain: Pumping effects and clarity enhancement
- Limiting: Loudness and peak control

## 🎼 Arrangement Flow & Energy Management
**Section Transitions:**
- Build techniques: Risers, drum fills, filter sweeps
- Drop preparation: Silence, reverse reverbs, tension
- Energy curves: How to maintain listener engagement

**Variation Techniques:**
- Verse differences: Subtle changes to maintain interest
- Chorus variations: Building intensity across repetitions
- Bridge/breakdown: Contrast and reset before final sections

Focus on practical, actionable advice that can be immediately applied in ${dawContext}. Provide specific parameter ranges and creative techniques that align with the ${genreContext} aesthetic and ${vibeContext} mood.`;

  const stream = await ai.models.generateContentStream({
    model: GEMINI_MODEL_NAME,
    contents: prompt,
  });
  return stream;
};

// --- replace the whole function in geminiService.ts ---
export async function* generateGuidebookFromToplineStream(
  inputs: UserInputs,
  topline?: ToplineAnalysis
): AsyncGenerator<{ text: string }, void, unknown> {
  if (!apiKey) throw new Error("API key not configured.");

  // Use provided topline if present; otherwise a safe minimal shell
  const tl: ToplineAnalysis = topline ?? {
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
    lyrics: null
  };

  const structuralBlueprint = buildStructuralBlueprint();
  const pluginSection = buildPluginParameterSection(inputs.daw, inputs.plugins);

  // SAME core prompt as your “no-topline” trackguide, just add a small topline note.
  const titleContext      = inputs.songTitle       ? `- Project Name: ${inputs.songTitle}`              : "";
  const artistContext     = inputs.artistReference ? `- Artist References: ${inputs.artistReference}`   : "";
  const genreContext      = inputs.genre?.join(", ")  || "Not specified";
  const vibeContext       = inputs.vibe?.join(", ")   || "Not specified";
  const instrumentContext = inputs.availableInstruments || "Not specified";
  const dawContext        = inputs.daw               ? inputs.daw : "Not specified";
  const pluginContext     = inputs.plugins           ? inputs.plugins : "Stock/Generic plugins";
  const keyContext        = inputs.key               ? `Key: ${inputs.key}`                  : "";
  const scaleContext      = inputs.scale             ? `Scale/Mode: ${inputs.scale}`         : "";
  const chordsContext     = inputs.chords            ? `Chord Progression: ${inputs.chords}` : "";
  const referenceContext  = inputs.referenceTrackLink ? `Reference Track: ${inputs.referenceTrackLink}` : "";
  const lyricsContext     = inputs.lyrics            ? `Lyrics Theme: ${inputs.lyrics}`      : "";
  const notesContext      = inputs.generalNotes      ? `Additional Notes: ${inputs.generalNotes}` : "";

  const toplineOneLiner = [
    typeof tl.bpm === "number" ? `${tl.bpm} BPM` : null,
    tl.timeSignature && tl.timeSignature !== "Unable to detect" ? tl.timeSignature : null,
    tl.key && tl.key !== "Unable to detect" ? `${tl.key}` : null,
    tl.scale && tl.scale !== "Unable to detect" ? `${tl.scale}` : null
  ].filter(Boolean).join(" · ");

const lyricsSection = tl.lyrics && tl.lyrics.trim().length > 0
  ? `
## 🎤 Vocal Topline & Lyrical Summary

**Topline Attributes:** ${toplineOneLiner || "—"}
${tl.tessitura ? `\n- Tessitura: ${tl.tessitura}` : ""}
${tl.registerCenter ? `\n- Register Center: ${tl.registerCenter}` : ""}

**Extracted Lyrics (best-effort transcription):**
${tl.lyrics.trim()}

${tl.phrases?.length ? `
**Phrase Map (by beat timing):**
${tl.phrases.slice(0, 8).map(p =>
  `- ${p.start}–${p.end}${p.text ? ` “${p.text}”` : ""}${p.intensity ? ` (${p.intensity})` : ""}`
).join("\n")}` : ""}

**Creative Use:** Let the topline guide your musical decisions:
- Repeating words can become rhythmic or melodic motifs.
- Emotional themes (e.g., longing, urgency, release) can shape sound choices (e.g., airy pads, aggressive stabs, filtered builds).
- Vocal intensity and phrasing can inspire transitions, breakdowns, and dynamic flow.
` : "";



  const phraseHints = tl.phrases?.length
    ? `\nTopline phrase map (beats):\n${tl.phrases.slice(0,8).map(p => `- ${p.start}–${p.end}${p.text ? ` “${p.text}”` : ""} (${p.intensity || "med"})`).join("\n")}\n`
    : "";

  const prompt = `You are TrackGuideAI, an expert music production assistant specializing in comprehensive track creation guides.

Create a detailed TrackGuide for the following specifications:
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

Important: A vocal topline was uploaded. Use it as a helpful reference for harmonic fit, energy contour, and space planning, but do not let it overshadow user inputs. The final guide should follow the same format and level of detail as your normal TrackGuides generated without a topline. Only add a short “Lyrics & Topline Overview” section if lyrics are available.

At the end of your opening summary sentence, add exactly: This guide is a starting point—remember to use your ears and trust your intuition throughout the process.

Required Sections (keep this structure exactly):
${structuralBlueprint}

## 🎵 Genre DNA Analysis
- Core Characteristics (tempo feel, harmony, rhythm, sonic palette)
- Reference Analysis (${inputs.referenceTrackLink ? "Use the provided link." : `Draw from classic examples in ${genreContext}.`})

## 🎹 Instrument & Sound Design
- Primary Elements (lead, bass, drums, harmonic layers)
- Sound Shaping (synthesis, filters, effects, layering)

${pluginSection}

## 🎚️ Mixing & Arrangement Strategy
- Frequency Management (low/mid/high)
- Spatial Design (stereo, depth, movement)
- Dynamic Control (compression, sidechain, limiting)

## 🎼 Arrangement Flow & Energy Management
- Section transitions, energy curves, variation techniques

${lyricsSection}${phraseHints}

If lyrics are available, draw inspiration from them throughout the guide—not just in the topline section.

Guidelines:
1) Use the topline to make smart harmonic/arrangement choices (leave room during phrases, cadence under phrase ends).
2) Do not change the overall structure/style of the guide compared to the non-topline flow.
3) If lyrics were detected, show them in “Lyrics & Topline Overview”. Otherwise omit that section.
4) Maintain practical, DAW-ready parameter suggestions.`;

  const stream = await ai.models.generateContentStream({
    model: GEMINI_MODEL_NAME,
    contents: { parts: [{ text: prompt }] },
  });

  for await (const chunk of stream) {
    if (chunk.text) yield { text: chunk.text };
  }
}




/**
 * 2. Generate MIDI pattern suggestions (streaming) - Returns valid JSON
 */
export const generateMidiPatternSuggestions = async (
  settings: MidiSettings
): Promise<AsyncIterable<GenerateContentResponse>> => {
  const prompt = `// ⚡ Including guidebookContext
You are TrackGuideAI's MIDI Pattern Generator. Generate MIDI patterns in VALID JSON format only.

**Requirements:**
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

**JSON Structure Required:**
{
  "chords": [
    {
      "time": 0,
      "name": "Cm",
      "duration": 2,
      "notes": [{"pitch": "C4", "midi": 60}, {"pitch": "Eb4", "midi": 63}, {"pitch": "G4", "midi": 67}],
      "velocity": 90
    }
  ],
  "bassline": [
    {
      "time": 0,
      "midi": 36,
      "duration": 0.5,
      "velocity": 100,
      "pitch": "C2"
    }
  ],
  "melody": [
    {
      "time": 0,
      "midi": 72,
      "duration": 1,
      "velocity": 95,
      "pitch": "C5"
    }
  ],
  "drums": {
    "kick": [
      {"time": 0, "duration": 0.25, "velocity": 120},
      {"time": 2, "duration": 0.25, "velocity": 115}
    ],
    "snare": [
      {"time": 1, "duration": 0.25, "velocity": 100},
      {"time": 3, "duration": 0.25, "velocity": 105}
    ],
    "hihat_closed": [
      {"time": 0.5, "duration": 0.125, "velocity": 80},
      {"time": 1.5, "duration": 0.125, "velocity": 75}
    ],
    "open_hihat": [
      {"time": 1.75, "duration": 0.5, "velocity": 85}
    ],
    "clap": [
      {"time": 1, "duration": 0.25, "velocity": 95}
    ],
    "tom_high": [
      {"time": 3.5, "duration": 0.25, "velocity": 90}
    ],
    "tom_mid": [
      {"time": 3.75, "duration": 0.25, "velocity": 95}
    ],
    "tom_low": [
      {"time": 4, "duration": 0.5, "velocity": 100}
    ],
    "crash_cymbal_1": [
      {"time": 0, "duration": 2, "velocity": 110}
    ],
    "ride_cymbal_1": [
      {"time": 0.5, "duration": 0.25, "velocity": 70}
    ]
  }
}

**CRITICAL REQUIREMENTS:**
1. Return ONLY valid JSON. NO explanatory text, NO markdown formatting, NO code blocks, NO backticks.
2. Start your response directly with { and end with }
3. Do not wrap the JSON in code blocks with three backticks
4. All time values must be in beats (0 to ${settings.bars * 4})
5. All MIDI numbers must be integers between 21-108
6. All durations must be positive numbers
7. All velocities must be integers between 1-127
8. Use appropriate drum elements for ${settings.genre}:
   - Essential: kick, snare, hihat_closed
   - Groove: open_hihat, ride_cymbal_1
   - Accents: clap, crash_cymbal_1
   - Fills: tom_high, tom_mid, tom_low
   - Choose elements that fit the genre and song section

**Genre-Specific Drum Guidelines:**
- Electronic/House/Techno: Focus on kick, hihat_closed, open_hihat, clap
- Rock/Metal: Use kick, snare, hihat_closed, crash_cymbal_1, tom_high, tom_mid, tom_low
- Hip Hop/Trap: Emphasize kick, snare, hihat_closed, clap
- Jazz/Funk: Include ride_cymbal_1, hihat_closed, kick, snare
- Pop: Balanced use of kick, snare, hihat_closed, crash_cymbal_1, clap

Generate patterns appropriate for ${settings.genre} in the ${settings.songSection} section, using ${settings.chordProgression} progression in ${settings.key}.`;

  const stream = await ai.models.generateContentStream({
    model: GEMINI_MODEL_NAME,
    contents: prompt,
  });
  return stream;
};

/**
 * Generate MIDI that supports the vocal topline (streaming JSON).
 * - Keeps your standard structure: chords, bassline, melody, drums
 * - Adds an extra track "topline_melody": direct MIDI mapping of the vocal pitchContour
 *   (UI can start using this whenever you want; extra keys are harmless at runtime)
 */
export const generateMidiFromTopline = async (
  settings: MidiFromToplineSettings
): Promise<AsyncIterable<GenerateContentResponse>> => {
  const { topline, avoidDoublingMelody } = settings;

  const prompt = `You are TrackGuideAI's MIDI Generator. Output VALID JSON only.

Goal:
Create chords, bass, (optionally) a counterline melody, and drums that support a given vocal topline. Also include a direct MIDI transcription of the vocal as "topline_melody".

Constraints:
1) For any beat range where the vocal sustains notes (t..t+d), the chord must include tones that fit those notes (allow brief passing tones but avoid long dissonance).
2) If "avoidDoublingMelody" is true, "melody" should be a COUNTERLINE that avoids unison with the vocal; place notes mainly in vocal gaps.
   If "avoidDoublingMelody" is false, "melody" may reinforce or answer the topline.
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
- Tessitura: ${topline.tessitura ? `${topline.tessitura.low}–${topline.tessitura.high}` : "Unknown"}
- Phrase count: ${topline.phrases?.length ?? 0}
- First 6 notes: ${topline.pitchContour.slice(0,6).map(n => `${n.time}:${n.pitch}`).join(", ")}

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
- topline_melody: copy the uploaded vocal melody (pitchContour) into MIDI notes.
`;

  const stream = await ai.models.generateContentStream({
    model: GEMINI_MODEL_NAME,
    contents: { parts: [{ text: prompt }] },
  });
  return stream;
};



/**
 * 3. Generate mix feedback (one-shot)
 */
export const generateMixFeedback = async (
  inputs: MixFeedbackInputs
): Promise<string> => {
  const prompt = `You are TrackGuideAI's Mix Analysis Expert. Provide detailed mix feedback.

**Track Analysis:**
- Track Name: ${inputs.trackName}
- Focus Areas: ${inputs.focus || "Overall mix balance and clarity"}
- User Notes: ${inputs.notes || inputs.userNotes || "No specific notes provided"}

**Analysis Framework:**
1. **Frequency Balance**
   - Low-end: Sub-bass presence and bass clarity
   - Midrange: Vocal/lead prominence and instrument separation
   - High-end: Air, sparkle, and harshness assessment

2. **Spatial Characteristics**
   - Stereo width and imaging
   - Depth and dimension
   - Center focus vs side content

3. **Dynamic Properties**
   - Compression effectiveness
   - Transient preservation
   - Overall loudness and headroom

4. **Technical Assessment**
   - Phase relationships
   - Distortion or artifacts
   - Noise floor and clarity

**Provide specific, actionable feedback with:**
- Identified strengths and areas for improvement
- Specific frequency ranges and dB adjustments
- Plugin suggestions and parameter recommendations
- Before/after comparison techniques

Focus on practical improvements that can be implemented immediately.`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL_NAME,
    contents: prompt,
  });
  return response.text || "Unable to generate mix feedback. Please try again.";
};

/**
 * 4. Generate mix comparison (one-shot)
 */
export const generateMixComparison = async (
  inputs: MixComparisonInputs
): Promise<string> => {
  const { dawName } = inputs;
  
  // Include DAW-specific recommendations if a DAW is selected
  let dawSpecificAdvice = '';
  if (dawName) {
    const daw = dawMetadata.find((d: DawMetadata) => d.dawName === dawName);
    if (daw) {
      dawSpecificAdvice = `
## 🎛️ ${dawName}-Specific Recommendations

The user is working with ${dawName}. Provide tailored recommendations using the following plugins and workflow tips:

- Stock Plugins: ${daw.stockPlugins.EQ.join(', ')} for EQ; ${daw.stockPlugins.Compression.join(', ')} for compression; 
  ${daw.stockPlugins.Reverb.join(', ')} for reverb; ${daw.stockPlugins.Delay.join(', ')} for delay.
- Creative Effects: ${daw.stockPlugins.Creative.join(', ')}
- Workflow Tips: ${daw.workflowTips.join('; ')}
`;
    }
  }

  const prompt = `
You are an expert mixing & mastering AI. The user has uploaded two mixes:

Mix A: "${inputs.mixAName}" — an earlier version  
Mix B: "${inputs.mixBName}" — the current working version  

🎧 Instructions:
- Mix B is the active version — focus all actionable feedback on improving Mix B.
- Mix A is an earlier version — if Mix A has strengths vs Mix B, point those out.
- Acknowledge improvements made in Mix B compared to A.
- Do NOT suggest changes to Mix A (it is not being revised).

If "Request full mix analysis" is selected → add full technical breakdown of Mix B (like in your Mix Feedback function).

Provide your analysis in clear Markdown format with the following sections:

## 🎧 Overall Comparison

## 🎛️ Frequency Balance

## 🎚️ Stereo Image & Depth

## 📈 Dynamics & Loudness

## ⚙️ Technical Quality

## 🏆 Strengths & Opportunities (for Mix B)

## 🚀 Actionable Recommendations (for Mix B only)
${dawSpecificAdvice}
`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL_NAME,
    contents: prompt,
  });
  return response.text || "Unable to generate mix comparison. Please try again.";
};

/**
 * Analyze a vocal topline from audio and return normalized ToplineAnalysis.
 * - Forces model to emit strict JSON (no prose).
 * - Parses robustly via jsonParsingUtils.
 * - Normalizes into your canonical ToplineAnalysis shape with safe defaults.
 */
export const analyzeTopline = async (
  audio: File | Blob | string | { base64?: string; audioBase64?: string; data?: any; mimeType?: string; filename?: string }
): Promise<ToplineAnalysis> => {
  if (!apiKey) throw new Error("API key not configured.");

  // 1) Get strict-JSON string from the model
  const rawJson = await analyzeToplineRawJSON(audio);

  // 2) Tolerant parse (handles fence text, trailing commas, single quotes, etc.)
  const parsed = parseAiToplineResponse<ToplineAnalysisAIResponse>(rawJson);
  if (!parsed.ok) {
    console.error("[Topline JSON parse error]", parsed.error, parsed.raw);
    // Safe default so the UI never crashes
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

  // 3) Normalize loose AI fields → your strict ToplineAnalysis
  const finalTopline = normalizeTopline(parsed.data);

  // 4) Guard rails
  if (!Array.isArray(finalTopline.pitchContour)) finalTopline.pitchContour = [];
  if (!Array.isArray(finalTopline.phrases)) finalTopline.phrases = [];
  if (!Array.isArray(finalTopline.sections)) finalTopline.sections = [];
  if (!Array.isArray(finalTopline.chordCandidates)) finalTopline.chordCandidates = [];

  return finalTopline;
};




/**
 * 5. Generate AI-assistant chat response (streaming)
 */
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
    .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
    .join("\n");

  const contextInfo = `
**Current Guidebook Context:**
- Title: ${guidebook.title}
- Genre: ${guidebook.genre.join(", ")}
- Vibe: ${guidebook.vibe.join(", ")}
- DAW: ${guidebook.daw}
- Key: ${guidebook.key || "Not specified"}
- Available Instruments: ${guidebook.availableInstruments}`;

  // Build additional context from other guides
  let additionalGuideContext = '';
  if (additionalContext) {
    const { remixGuideContent, mixFeedbackContent, mixComparisonContent, patchGuideContent, activeView } = additionalContext;
    
    if (activeView) {
      additionalGuideContext += `\n**Current View:** ${activeView}`;
    }
    
    if (remixGuideContent) {
      additionalGuideContext += `\n\n**Active RemixGuide:**\n${remixGuideContent.substring(0, 2000)}${remixGuideContent.length > 2000 ? '...' : ''}`;
    }
    
    if (mixFeedbackContent) {
      additionalGuideContext += `\n\n**Active Mix Feedback:**\n${mixFeedbackContent.substring(0, 2000)}${mixFeedbackContent.length > 2000 ? '...' : ''}`;
    }
    
    if (mixComparisonContent) {
      additionalGuideContext += `\n\n**Active Mix Comparison:**\n${mixComparisonContent.substring(0, 2000)}${mixComparisonContent.length > 2000 ? '...' : ''}`;
    }
    
    if (patchGuideContent) {
      additionalGuideContext += `\n\n**Active PatchGuide:**\n${patchGuideContent.substring(0, 2000)}${patchGuideContent.length > 2000 ? '...' : ''}`;
    }
  }

  const prompt = `You are TrackGuideAI, an expert music production assistant. You're helping a user with their current track project.

${contextInfo}${additionalGuideContext}

**Conversation History:**
${history}

**Your Role:**
- Provide specific, actionable music production advice
- Reference the current guidebook context when relevant
- Integrate insights from any active guides (RemixGuide, Mix Feedback, Mix Comparison, PatchGuide)
- Offer technical solutions and creative suggestions based on all available context
- Ask clarifying questions when needed
- Maintain a helpful, professional tone

**Response Guidelines:**
- CRITICAL: DO NOT use any markdown formatting - no asterisks, no bold, no lists with asterisks
- Present complete information in a concise, direct format - maintain all useful details but remove filler text
- Use simple text formatting only:
  - Use numbered lists (1. 2. 3.) for steps or items
  - Use plain text headers followed by a colon
  - Use simple "Name: value" pairs for parameters (Attack: 10ms)
- Technical advice should include all essential parameters with specific values
- Keep paragraphs focused - one idea per paragraph
- For workflows or processes, use clear numbered steps
- When providing multiple options or techniques, include 3-4 of the most relevant ones
- Structure information in scannable sections with clear headers

Respond as the helpful TrackGuideAI assistant with full awareness of the user's current project context.`;

  const stream = await ai.models.generateContentStream({
    model: GEMINI_MODEL_NAME,
    contents: prompt,
  });
  return stream;
};

/**
 * 6a. Generate RemixGuide with streaming support
 */
export async function* generateRemixGuideStream(
  audioData: { base64: string; mimeType: string },
  targetGenre: string,
  genreInfo: any,
  daw?: string,
  plugins?: string
): AsyncGenerator<{ text: string; metadata?: any }, void, unknown> {
  if (!apiKey) {
    throw new Error("API Key not configured. Cannot connect to Gemini API for remix guide.");
  }

  try {
    // Get basic genre info from remixGenres.ts
    const tempoRange = genreInfo?.tempoRange ? `${genreInfo.tempoRange[0]}-${genreInfo.tempoRange[1]} BPM` : "120-130 BPM";
    const sections = genreInfo?.sections || ["Intro", "Build-Up", "Drop", "Breakdown", "Outro"];
    
    // Try to get enhanced metadata if available (import at the top of the file)
    let metadataBlock: any = null;
    try {
      // We're using dynamic import to avoid circular dependencies
      const { getGenreMetadata } = await import('../constants/genreMetadata');
      metadataBlock = getGenreMetadata(targetGenre);
    } catch (err) {
      console.warn('Could not load genre metadata:', err);
    }
    
    // Extract relevant metadata for the prompt
    const chordProgressions = metadataBlock?.chordProgressions?.join(", ") || "Standard progressions for this genre";
    const productionTips = metadataBlock?.productionTips?.join(", ") || "Standard production techniques";
    const scalesAndModes = metadataBlock?.scalesAndModes || "Appropriate scales for this genre";
    const songStructure = metadataBlock?.songStructure || sections.join(" → ");
    const dynamicRange = metadataBlock?.dynamicRange || "Standard dynamics for this genre";
    const relatedGenres = metadataBlock?.relatedGenres?.join(", ") || "Similar genres";
    
    const structuralBlueprint = buildStructuralBlueprint();
    const pluginSection = buildPluginParameterSection(daw, plugins);
    
    const prompt = `You are TrackGuideAI's Remix Specialist. Analyze the uploaded audio track and create a comprehensive remix guide for transforming it into ${targetGenre} style.

**User Production Setup:**
- **DAW:** ${daw || "Not specified"}
- **Available Plugins:** ${plugins || "Stock/Generic plugins"}

**Analysis Requirements:**
1. Identify the original track's tempo (exact BPM), key, harmonic progression, and rhythmic characteristics
2. Determine optimal transformation approach for ${targetGenre}
3. Provide detailed production guidance with specific techniques
4. Include plugin-specific parameter recommendations based on user's setup

**BPM Detection Guidelines:**
- Listen carefully for beats and transients to determine precise BPM value
- Report a single specific BPM number (e.g. "124 BPM" not "120-130 BPM")
- Use beat counting over time to verify accuracy
- For variable tempo tracks, report the main/dominant tempo

**Key & Chord Progression Analysis Guidelines:**
- Listen carefully to the entire track to identify ALL chord progressions present
- For each progression, list BOTH:
  1. Actual chord names with dashes between (e.g., "Am - C - F - G")
  2. Roman numeral analysis in brackets (e.g., "[i - III - VI - VII]")
- If multiple progressions are present, list each complete progression separated by commas
- For the primary key determination:
  1. Analyze all chord progressions together to determine the most likely tonal center
  2. Consider where the track resolves harmonically at major section endpoints
  3. Identify the scale/mode being used (major, minor, dorian, etc.)
- If the key modulates during the track:
  1. Explicitly note each modulation with an arrow (e.g., "C minor → D minor")
  2. Specify where in the track the modulation occurs (e.g., "modulates at bridge")
  3. For each key area, provide the corresponding chord progression
- Identify any modal interchange or borrowed chords and note which mode they're borrowed from

**Response Guidelines:**
- Provide direct, confident analysis without using qualifiers like "Estimated" or "Based on" 
- Present detected values as factual information without disclaimers or parenthetical notes
- Focus on actionable production advice rather than analysis limitations

**Target Genre:** ${targetGenre}
**Target Tempo Range:** ${tempoRange}
**Suggested Sections:** ${sections.join(", ")}
${metadataBlock?.drumPatterns ? `**Typical Drum Patterns:** ${metadataBlock.drumPatterns}` : ''}
${chordProgressions ? `**Common Chord Progressions:** ${chordProgressions}` : ''}
${scalesAndModes ? `**Typical Scales/Modes:** ${scalesAndModes}` : ''}
${songStructure ? `**Song Structure:** ${songStructure}` : ''}
${dynamicRange ? `**Dynamic Characteristics:** ${dynamicRange}` : ''}
${relatedGenres ? `**Related Genres for Inspiration:** ${relatedGenres}` : ''}
${productionTips ? `**Production Techniques:** ${productionTips}` : ''}

Create a detailed markdown remix guide that includes:

# 🎵 REMIX GUIDE: [Original Track] → ${targetGenre}

## 🎧 Original Track DNA Analysis
**Detected Characteristics:**
- **Original Tempo:** [Exact BPM]
- **Original Key:** [Key]
- **Harmonic Blueprint:** [Chord names and Roman numerals, e.g., "Am - C - F - G [i - III - VI - VII]"]
- **Rhythmic Feel:** [Time signature and groove]
- **Sonic Character:** [Tonal qualities and instrumentation]

**Transformation Strategy:**
- **Target Tempo:** [BPM within ${tempoRange}]
- **Target Key:** [Key for ${targetGenre}]
- **Genre Adaptation:** [Adaptation approach]

${structuralBlueprint}

## 🎹 Sound Design & Instrumentation Transformation
**Lead Elements:**
- **Original → ${targetGenre}:** Transform existing leads using specific techniques
- **New Elements:** Add characteristic ${targetGenre} sounds
- **Processing Chain:** Specific plugin recommendations and parameters

**Rhythm Section Redesign:**
- **Drum Programming:** ${targetGenre}-specific patterns and sounds
- **Bass Design:** Transform or replace bass elements
- **Percussion Layers:** Add characteristic ${targetGenre} percussion

## 🔊 Mixing & Processing Techniques
**Signal Chain Recommendations:**
${pluginSection}

**${targetGenre}-Specific Processing:**
- Genre-characteristic EQ curves
- Compression techniques for ${targetGenre}
- Saturation and distortion applications
- Spatial processing (reverb/delay) for the genre

## 🎯 Arrangement & Structure
**Section-by-Section Breakdown:**
${sections.map((section: string) => `
**${section}:**
- Elements to include/exclude
- Energy level and dynamics
- Transition techniques
`).join('')}

**Dynamic Build Strategy:**
- How to create tension and release
- Filter sweeps and automation
- Risers and impacts placement

## 💡 Creative Production Tips
- Unconventional ${targetGenre} techniques
- Experimental processing ideas
- Sample manipulation suggestions
- Layering strategies for depth

---
*Generated by TrackGuideAI - Your AI Music Production Assistant*`;

    const audioPart = { inlineData: { mimeType: audioData.mimeType, data: audioData.base64 } };
    const promptPart = { text: prompt };
    const contents = [audioPart, promptPart];

    const response = await ai.models.generateContentStream({
      model: GEMINI_MODEL_NAME,
      contents: { parts: contents },
    });

    let fullText = '';
    for await (const chunk of response) {
      const text = chunk.text;
      if (text) {
        fullText += text;
        yield { text };
      }
    }

    const metadata = extractRemixMetadata(fullText);
    yield { text: '', metadata };

  } catch (error) {
    console.error('Error generating remix guide stream:', error);
    throw new Error(`Failed to generate remix guide: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper function to extract metadata from remix guide
function extractRemixMetadata(content: string): any {
  const metadata: any = {};
  
  const originalTempoMatch = content.match(/Original Tempo:\s*(\d+(?:\.\d+)?)(?:\s*BPM)?/i);
  if (originalTempoMatch) metadata.originalTempo = parseFloat(originalTempoMatch[1]);
  
  const targetTempoMatch = content.match(/Target Tempo:\s*(\d+(?:\.\d+)?)(?:\s*BPM)?/i);
  if (targetTempoMatch) metadata.targetTempo = parseFloat(targetTempoMatch[1]);
  
  const originalKeyMatch = content.match(/Original Key:\s*([A-G][#b]?\s*(?:major|minor|maj|min)(?:\s*→\s*[A-G][#b]?\s*(?:major|minor|maj|min))*)/i);
  if (originalKeyMatch) {
    metadata.originalKey = originalKeyMatch[1];
    if (originalKeyMatch[1].includes('→')) {
      metadata.keyModulation = true;
      const keys = originalKeyMatch[1].split('→').map(k => k.trim());
      metadata.startingKey = keys[0];
      metadata.endingKey = keys[keys.length - 1];
    }
  }
  
  const targetKeyMatch = content.match(/Target Key:\s*([A-G][#b]?\s*(?:major|minor|maj|min))/i);
  if (targetKeyMatch) metadata.targetKey = targetKeyMatch[1];
  
  const chordProgMatch = content.match(/Harmonic Blueprint:\s*([^\n]+)/i);
  if (chordProgMatch) {
    const progressionText = chordProgMatch[1].trim();
    if (progressionText.includes(',')) {
      metadata.originalChordProgression = progressionText;
      metadata.multipleProgressions = true;
      metadata.progressions = progressionText.split(',').map(p => p.trim());
      metadata.primaryProgression = metadata.progressions[0];
      if (progressionText.includes('[')) {
        try {
          metadata.chordNames = [];
          metadata.romanNumerals = [];
          progressionText.split(',').forEach((progression: string) => {
            const matches = progression.trim().match(/(.*?)\s*\[(.*?)\]/);
            if (matches && matches.length === 3) {
              metadata.chordNames.push(matches[1].trim());
              metadata.romanNumerals.push(matches[2].trim());
            }
          });
        } catch (e) {
          console.warn('Error parsing chord names and Roman numerals:', e);
        }
      }
    } else {
      metadata.originalChordProgression = progressionText;
      metadata.multipleProgressions = false;
      if (progressionText.includes('[')) {
        try {
          const matches = progressionText.match(/(.*?)\s*\[(.*?)\]/);
          if (matches && matches.length === 3) {
            metadata.chordNames = [matches[1].trim()];
            metadata.romanNumerals = [matches[2].trim()];
          }
        } catch (e) {
          console.warn('Error parsing chord names and Roman numerals:', e);
        }
      }
    }
  }
  
  const sectionsMatch = content.match(/Sections:\s*\[(.*?)\]/i);
  if (sectionsMatch) {
    metadata.sections = sectionsMatch[1].split(',').map(s => s.trim().replace(/"/g, ''));
  }
  return metadata;
}

/**
 * 6. Generate RemixGuide with full functionality (matches component expectations)
 */
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
    throw new Error("API Key not configured. Cannot connect to Gemini API for remix guide.");
  }
  try {
    const tempoRange = genreInfo?.tempoRange ? `${genreInfo.tempoRange[0]}-${genreInfo.tempoRange[1]} BPM` : "120-130 BPM";
    const sections = genreInfo?.sections || ["Intro", "Build-Up", "Drop", "Breakdown", "Outro"];
    let metadataBlock: any = null;
    let chordProgressions = "";
    let productionTips = "";
    let scalesAndModes = "";
    let songStructure = "";
    let dynamicRange = "";
    let relatedGenres = "";
    try {
      const { getGenreMetadata } = await import('../constants/genreMetadata');
      metadataBlock = getGenreMetadata(targetGenre);
      if (metadataBlock) {
        chordProgressions = Array.isArray(metadataBlock.chordProgressions) ? metadataBlock.chordProgressions.join(", ") : "Standard progressions for this genre";
        productionTips = Array.isArray(metadataBlock.productionTips) ? metadataBlock.productionTips.join(", ") : "Standard production techniques";
        scalesAndModes = typeof metadataBlock.scalesAndModes === "string" ? metadataBlock.scalesAndModes : "Appropriate scales for this genre";
        songStructure = typeof metadataBlock.songStructure === "string" ? metadataBlock.songStructure : sections.join(" → ");
        dynamicRange = typeof metadataBlock.dynamicRange === "string" ? metadataBlock.dynamicRange : "Standard dynamics for this genre";
        relatedGenres = Array.isArray(metadataBlock.relatedGenres) ? metadataBlock.relatedGenres.join(", ") : "Similar genres";
      } else {
        chordProgressions = "Standard progressions for this genre";
        productionTips = "Standard production techniques";
        scalesAndModes = "Appropriate scales for this genre";
        songStructure = sections.join(" → ");
        dynamicRange = "Standard dynamics for this genre";
        relatedGenres = "Similar genres";
      }
    } catch (err) {
      chordProgressions = "Standard progressions for this genre";
      productionTips = "Standard production techniques";
      scalesAndModes = "Appropriate scales for this genre";
      songStructure = sections.join(" → ");
      dynamicRange = "Standard dynamics for this genre";
      relatedGenres = "Similar genres";
    }
    const structuralBlueprint = buildStructuralBlueprint();
    const pluginSection = buildPluginParameterSection(daw, plugins);
    const prompt = `You are TrackGuideAI's Remix Specialist. You have received an audio file (provided as base64) and must analyze ONLY the uploaded audio to extract the following:

1. The original track's exact tempo (BPM)
2. The original key (including any modulations)
3. The full chord progression(s) and harmonic structure
4. The rhythmic feel and time signature

You MUST NOT use genre assumptions, defaults, or common values. Do not guess based on the target genre or metadata. If you cannot detect a value from the audio, state "Unable to detect" for that field.

Your analysis must be based solely on the provided audio file. Do not use genre templates or fallback values for tempo, key, or chords.

**User Production Setup:**
- **DAW:** ${daw || "Not specified"}
- **Available Plugins:** ${plugins || "Stock/Generic plugins"}

**Analysis Requirements:**
1. Analyze the uploaded audio and extract the original track's tempo (exact BPM), key, harmonic progression, and rhythmic characteristics
2. Determine optimal transformation approach for ${targetGenre}
3. Provide detailed production guidance with specific techniques
4. Include plugin-specific parameter recommendations based on user's setup

**BPM Detection Guidelines:**
- Listen carefully for beats and transients to determine precise BPM value
- Report a single specific BPM number (e.g. "124 BPM" not "120-130 BPM")
- Use beat counting over time to verify accuracy
- For variable tempo tracks, report the main/dominant tempo

**Key & Chord Progression Analysis Guidelines:**
- Listen carefully to the entire track to identify ALL chord progressions present
- For each progression, list BOTH:
  1. Actual chord names with dashes between (e.g., "Am - C - F - G")
  2. Roman numeral analysis in brackets (e.g., "[i - III - VI - VII]")
- If multiple progressions are present, list each complete progression separated by commas
- For the primary key determination:
  1. Analyze all chord progressions together to determine the most likely tonal center
  2. Consider where the track resolves harmonically at major section endpoints
  3. Identify the scale/mode being used (major, minor, dorian, etc.)
- If the key modulates during the track:
  1. Explicitly note each modulation with an arrow (e.g., "C minor → D minor")
  2. Specify where in the track the modulation occurs (e.g., "modulates at bridge")
  3. For each key area, provide the corresponding chord progression
- Identify any modal interchange or borrowed chords and note which mode they're borrowed from

**Response Guidelines:**
- Provide direct, confident analysis based on the audio file only
- Do NOT use qualifiers like "Estimated" or "Based on genre" or "Common for this style"
- If you cannot detect a value from the audio, state "Unable to detect"
- Focus on actionable production advice rather than analysis limitations

**Target Genre:** ${targetGenre}
**Target Tempo Range:** ${tempoRange}
**Suggested Sections:** ${sections.join(", ")}
    ${metadataBlock && metadataBlock.drumPatterns ? `**Typical Drum Patterns:** ${metadataBlock.drumPatterns}` : ''}
    ${chordProgressions ? `**Common Chord Progressions:** ${chordProgressions}` : ''}
    ${scalesAndModes ? `**Typical Scales/Modes:** ${scalesAndModes}` : ''}
    ${songStructure ? `**Song Structure:** ${songStructure}` : ''}
    ${dynamicRange ? `**Dynamic Characteristics:** ${dynamicRange}` : ''}
    ${relatedGenres ? `**Related Genres for Inspiration:** ${relatedGenres}` : ''}
    ${productionTips ? `**Production Techniques:** ${productionTips}` : ''}

**CRITICAL: Return your response in this EXACT JSON format:**
{
  "guide": "FULL_MARKDOWN_GUIDE_HERE",
  "originalTempo": 120,
  "originalKey": "C minor",
  "originalChordProgression": "Am - C - F - G [i - III - VI - VII]",
  "targetTempo": 128,
  "targetKey": "C minor",
  "sections": ["Intro", "Build-Up", "Drop", "Breakdown", "Outro"]
}

**For the "guide" field, create a detailed markdown guide that includes:**

# 🎵 REMIX GUIDE: [Original Track] → ${targetGenre}

## 🎧 Original Track DNA Analysis
**Detected Characteristics:**
- **Original Tempo:** [Exact BPM or "Unable to detect"]
- **Original Key:** [Key or "Unable to detect"]
- **Harmonic Blueprint:** [Chord names and Roman numerals, e.g., "Am - C - F - G [i - III - VI - VII]" or "Unable to detect"]
- **Rhythmic Feel:** [Time signature and groove or "Unable to detect"]
- **Sonic Character:** [Tonal qualities and instrumentation]

**Transformation Strategy:**
- **Target Tempo:** [BPM within ${tempoRange}]
- **Target Key:** [Key for ${targetGenre}]
- **Genre Adaptation:** [Adaptation approach]

${structuralBlueprint}

## 🎹 Sound Design & Instrumentation Transformation
**Lead Elements:**
- **Original → ${targetGenre}:** Transform existing leads using specific techniques
- **New Elements:** Add characteristic ${targetGenre} sounds
- **Processing Chain:** Specific plugin recommendations and parameters

**Rhythm Section Redesign:**
- **Drum Programming:** ${targetGenre}-specific patterns and sounds
- **Bass Design:** Sub-bass content and mid-range presence for ${targetGenre}
- **Percussion:** Additional elements typical of ${targetGenre}

**Harmonic Content:**
- **Chord Voicings:** Adapt progressions for ${targetGenre} aesthetic
- **Pad Textures:** Atmospheric elements and spatial design
- **Arpeggios/Sequences:** Rhythmic harmonic content

${pluginSection}

## 🎚️ Production Techniques & Processing
**Arrangement Strategy:**
- **Section Transitions:** Build-ups, drops, and breakdowns for ${targetGenre}
- **Energy Management:** How to structure dynamics across sections
- **Original Element Integration:** Preserving vs transforming source material

**Mix Approach:**
- **Frequency Management:** EQ strategies for ${targetGenre} clarity
- **Spatial Design:** Stereo width and depth characteristics
- **Dynamic Processing:** Compression and limiting for ${targetGenre} impact

**Effects Processing:**
- **Time-Based Effects:** Reverb and delay for ${targetGenre} space
- **Modulation:** LFOs, filters, and movement
- **Creative Processing:** Distortion, bit-crushing, and character effects

## 🎼 Step-by-Step Remix Process
**Phase 1: Preparation**
1. Tempo adjustment: Specific technique for tempo change
2. Key transposition: If needed, method and tools
3. Audio editing: Chopping, slicing, and preparation

**Phase 2: Foundation**
1. Drum programming: ${targetGenre} patterns and sounds
2. Bass design: Sub and mid-bass for ${targetGenre}
3. Harmonic foundation: Chord progressions and voicings

**Phase 3: Development**
1. Lead transformation: Processing original or creating new
2. Atmospheric elements: Pads, textures, and ambience
3. Rhythmic elements: Percussion and groove enhancement

**Phase 4: Arrangement**
1. Section structure: Intro, build-ups, drops, breakdowns
2. Transition techniques: Risers, sweeps, and cuts
3. Variation strategies: Keeping listener engagement

**Phase 5: Mix & Master**
1. Frequency balance: ${targetGenre}-specific EQ approach
2. Dynamic control: Compression and limiting strategies
3. Spatial processing: Stereo width and depth
4. Final polish: Loudness and character enhancement

## 🔥 Pro Tips for ${targetGenre} Remix Success
- **Signature Elements:** Key characteristics that define ${targetGenre}
- **Common Pitfalls:** What to avoid when adapting to ${targetGenre}
- **Creative Opportunities:** Unique ways to blend original with ${targetGenre}
- **Reference Tracks:** Study these ${targetGenre} examples for inspiration

Focus on practical, actionable techniques that can be implemented immediately. Provide specific parameter suggestions and creative approaches that honor both the original track and the target genre aesthetic.

**IMPORTANT:** Return ONLY the JSON object with the complete markdown guide in the "guide" field. Focus on detailed analysis and production techniques.`;
    const textPart = { text: prompt };
    const audioPart = {
      inlineData: { data: audioData.base64, mimeType: audioData.mimeType },
    };
    const contents = [audioPart, textPart];
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: { parts: contents },
    });
    const responseText: string = response.text ?? "";
    if (typeof responseText !== 'string' || !responseText) {
      throw new Error("Received an unexpected response format from Gemini API for remix guide.");
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
      const tempoMatch = responseText ? responseText.match(/Original Tempo:\s*([\d.]+)/i) : null;
      const keyMatch = responseText ? responseText.match(/Original Key:\s*([A-G][#b]?\s*(?:major|minor|maj|min)?|Unable to detect)/i) : null;
      const chordMatch = responseText ? responseText.match(/Harmonic Blueprint:\s*([^\n]+|Unable to detect)/i) : null;
      return {
        guide: responseText || "",
        targetTempo: tempoMatch && tempoMatch[1] ? parseFloat(tempoMatch[1]) : -1,
        targetKey: keyMatch && keyMatch[1] ? keyMatch[1].trim() : "Unable to detect",
        sections,
        originalKey: keyMatch && keyMatch[1] ? keyMatch[1].trim() : "Unable to detect",
        originalTempo: tempoMatch && tempoMatch[1] ? parseFloat(tempoMatch[1]) : undefined,
        originalChordProgression: chordMatch && chordMatch[1] ? chordMatch[1].trim() : "Unable to detect"
      };
    }
    const result = {
      guide: parsedResponse && parsedResponse.guide ? parsedResponse.guide : responseText,
      targetTempo: parsedResponse && parsedResponse.targetTempo ? parsedResponse.targetTempo : undefined,
      targetKey: parsedResponse && parsedResponse.targetKey ? parsedResponse.targetKey : undefined,
      sections: parsedResponse && parsedResponse.sections ? parsedResponse.sections : sections,
      originalKey: parsedResponse && parsedResponse.originalKey ? parsedResponse.originalKey : "Unable to detect",
      originalTempo: parsedResponse && parsedResponse.originalTempo ? parsedResponse.originalTempo : undefined,
      originalChordProgression: parsedResponse && parsedResponse.originalChordProgression ? parsedResponse.originalChordProgression : "Unable to detect"
    };
    return result;
  } catch (error) {
    console.error("Error generating remix guide:", error);
    return {
      guide: "",
      targetTempo: genreInfo?.tempoRange?.[0] || 128,
      targetKey: "Unable to detect",
      sections: genreInfo?.sections || ["Intro", "Build-Up", "Drop", "Breakdown", "Outro"],
      originalKey: "Unable to detect",
      originalTempo: -1,
      originalChordProgression: "Unable to detect"
    };
  }
}
// Removed unreachable throw and stray braces

/**
 * 7. Enhanced Mix Feedback with Audio File Support
 */
export const generateMixFeedbackWithAudio = async (
  inputs: MixFeedbackInputs
): Promise<string> => {
  const { dawName } = inputs;
  let dawContext = '';
  if (dawName) {
    const daw = getDawMetadata(dawName);
    if (daw) {
      dawContext = `
**DAW Information:**
- DAW: ${dawName}
- Workflow Tips: ${daw.workflowTips.join('; ')}
- Stock Plugins (EQ: ${daw.stockPlugins.EQ.join(', ')}; Compression: ${daw.stockPlugins.Compression.join(', ')}; Reverb: ${daw.stockPlugins.Reverb.join(', ')}; Delay: ${daw.stockPlugins.Delay.join(', ')}; Creative: ${daw.stockPlugins.Creative.join(', ')})
`;
    }
  }

  const prompt = `You are TrackGuideAI's Advanced Mix Analysis Expert. Analyze the uploaded audio file and provide comprehensive mix feedback.

${dawContext}**Track Information:**
- Track Name: ${inputs.trackName || "Uploaded Mix"}
- Focus Areas: ${inputs.focus || "Overall mix balance and clarity"}
- User Notes: ${inputs.notes || inputs.userNotes || "No specific notes provided"}

**Comprehensive Analysis Framework:**

## 🎧 Audio Analysis Results

### Frequency Spectrum Analysis
**Low-End (20-250 Hz):**
- Sub-bass presence and control
- Bass clarity and definition
- Low-mid muddiness assessment

**Midrange (250 Hz - 5 kHz):**
- Vocal/lead instrument clarity
- Instrument separation and masking
- Presence and intelligibility

**High-End (5 kHz+):**
- Air and sparkle quality
- Harshness or sibilance issues
- Overall brightness balance

### Stereo Field & Spatial Analysis
**Width & Imaging:**
- Stereo spread effectiveness
- Phantom center stability
- Side content balance

**Depth & Dimension:**
- Reverb usage and space
- Dry/wet balance
- Front-to-back positioning

### Dynamic Range Assessment
**Compression Analysis:**
- Overall dynamic range
- Transient preservation
- Pumping or over-compression

**Loudness Evaluation:**
- Perceived loudness level
- Peak management
- Headroom availability

### Technical Quality Check
**Distortion & Artifacts:**
- Unwanted harmonic distortion
- Digital artifacts or clipping
- Noise floor assessment

**Phase Relationships:**
- Mono compatibility
- Phase cancellation issues
- Correlation analysis

## 🎯 Specific Recommendations

### Immediate Improvements
1. **Priority Fix #1:** [Most critical issue with specific solution]
2. **Priority Fix #2:** [Second most important improvement]
3. **Priority Fix #3:** [Third priority enhancement]

### Technical Adjustments
**EQ Suggestions:**
- Specific frequency cuts/boosts with dB amounts
- Problem frequency identification
- Enhancement opportunities

**Compression Recommendations:**
- Ratio, attack, and release settings
- Specific compressor types or plugins
- Bus compression strategies

**Effects Processing:**
- Reverb and delay adjustments
- Spatial enhancement techniques
- Creative processing opportunities

### Professional Polish
**Mastering Considerations:**
- Final EQ and compression
- Stereo enhancement
- Loudness optimization

**Reference Comparison:**
- How this mix compares to commercial standards
- Genre-specific benchmarks
- Areas for competitive improvement

Provide actionable, specific feedback that can be implemented immediately to improve the mix quality and professional impact.`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL_NAME,
    contents: prompt,
  });
  return response.text || "Unable to generate analysis. Please try again.";
};

/**
 * Quick 2–3 part backing harmony ideas tied to the phrase map.
 */
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
3) For each phrase, specify harmony intervals (e.g., "-3rd, +6th") and suggested notes (pitch names) with entry/exit beats.
4) Mention blend strategy (EQ carve around the lead, 5–8 kHz de-ess if sibilant stack).

Output:
- Short overview
- Phrase-by-phrase bullet plan
- Quick mix checklist (HPF ranges, de-ess bands, bus comp idea)`;

  const resp = await ai.models.generateContent({
    model: GEMINI_MODEL_NAME,
    contents: { parts: [{ text: prompt }] },
  });
  return resp.text || "";
};

/**
 * 8. Helper function for simple content generation
 */
export async function generateContent(prompt: string): Promise<string> {
  if (!apiKey) {
    throw new Error("API Key not configured. Cannot connect to Gemini API.");
  }

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: prompt,
    });
    
    const responseText = response.text;
    if (typeof responseText !== 'string') {
      throw new Error("Received an unexpected response format from Gemini API.");
    }
    
    return responseText;
  } catch (error) {
    console.error("Error generating content:", error);
    let specificMessage = "An unknown error occurred while generating content.";
    if (error instanceof Error) {
      specificMessage = error.message;
      if (error.message.includes("API key not valid") || error.message.includes("permission")) {
        specificMessage = "Invalid API Key or insufficient permissions. Please check your API key configuration.";
      } else if (error.message.toLowerCase().includes("network error") || error.message.toLowerCase().includes("failed to fetch")) {
        specificMessage = `Network error: Failed to connect to Gemini API. Please check your internet connection. (${error.message})`;
      }
    }
    throw new Error(specificMessage);
  }
}

/**
 * 9. Alternative AI Assistant Response (non-streaming for simple cases)
 */
export const generateAIAssistantResponseSimple = async (
  message: string,
  context?: {
    currentGuidebook?: GuidebookEntry;
    userInputs?: UserInputs;
  }
): Promise<string> => {
  if (!apiKey) {
    throw new Error("API Key not configured. Cannot connect to Gemini API.");
  }

  try {
    const contextInfo = context ? `
**Current Project Context:**
- Genre: ${context.userInputs?.genre?.join(", ") || context.currentGuidebook?.genre?.join(", ") || 'Not specified'}
- Vibe: ${context.userInputs?.vibe?.join(", ") || context.currentGuidebook?.vibe?.join(", ") || 'Not specified'}
- DAW: ${context.userInputs?.daw || context.currentGuidebook?.daw || 'Not specified'}
- Current guidebook: ${context.currentGuidebook?.title || 'None'}
` : '';

    const prompt = `You are TrackGuideAI, an expert music production assistant. Help the user with their music production question.

${contextInfo}

**User Question:** ${message}

**Your Response Guidelines:**
- Provide helpful, concise advice related to music production, mixing, sound design, or composition
- Keep responses practical and actionable
- Reference the project context when relevant
- Include specific parameter suggestions when applicable
- Maintain a professional but friendly tone

Provide your expert guidance:`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: prompt,
    });

    const responseText = response.text;
    if (typeof responseText !== 'string') {
      throw new Error("Received an unexpected response format from Gemini API.");
    }
    
    return responseText;
  } catch (error) {
    console.error("Error generating AI assistant response:", error);
    let specificMessage = "An unknown error occurred while generating content.";
    if (error instanceof Error) {
      specificMessage = error.message;
      if (error.message.includes("API key not valid") || error.message.includes("permission")) {
        specificMessage = "Invalid API Key or insufficient permissions. Please check your API key configuration.";
      } else if (error.message.toLowerCase().includes("network error") || error.message.toLowerCase().includes("failed to fetch")) {
        specificMessage = `Network error: Failed to connect to Gemini API. Please check your internet connection. (${error.message})`;
      } else if (error.message.includes("Candidate was blocked")) {
        specificMessage = "The response was blocked by the AI. This might be due to content policies. Please try again or adjust your input.";
      }
    }
    throw new Error(specificMessage);
  }
}

/**
 * Streaming Mix Feedback (with audio file support)
 */
export async function* generateMixFeedbackWithAudioStream(
  inputs: MixFeedbackInputs
): AsyncGenerator<{ text: string }, void, unknown> {
  if (!apiKey) {
    throw new Error("API Key not configured. Cannot connect to Gemini API for mix feedback.");
  }

  if (!inputs.audioFile) {
    throw new Error("Streaming mix feedback requires an audio file.");
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const audioBase64 = await fileToBase64(inputs.audioFile);

  const { dawName } = inputs;
  let dawContext = '';
  if (dawName) {
    const daw = getDawMetadata(dawName);
    if (daw) {
      dawContext = `
**DAW Information:**
- DAW: ${dawName}
- Workflow Tips: ${daw.workflowTips.join('; ')}
- Stock Plugins (EQ: ${daw.stockPlugins.EQ.join(', ')}; Compression: ${daw.stockPlugins.Compression.join(', ')}; Reverb: ${daw.stockPlugins.Reverb.join(', ')}; Delay: ${daw.stockPlugins.Delay.join(', ')}; Creative: ${daw.stockPlugins.Creative.join(', ')})`;
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
    if (chunk.text) yield { text: chunk.text };
  }
};

/**
 * Streaming Mix Comparison (with audio files support)
 */
export async function* generateMixComparisonStream(
  inputs: MixComparisonInputs
): AsyncGenerator<{ text: string }, void, unknown> {
  if (!apiKey) {
    throw new Error("API Key not configured. Cannot connect to Gemini API for mix comparison.");
  }

  const prompt = `You are an expert mixing & mastering AI. The user has uploaded two mixes for comparison analysis.

Mix A: "${inputs.mixAName}" — an earlier version  
Mix B: "${inputs.mixBName}" — the current working version  

🎧 Instructions:
- Mix B is the active version — focus all actionable feedback on improving Mix B.
- Mix A is an earlier version — if Mix A has strengths vs Mix B, point those out.
- Acknowledge improvements made in Mix B compared to A.
- Do NOT suggest changes to Mix A (it is not being revised).

User Notes: ${inputs.userNotes || "No specific notes provided"}

Analyze both audio files and provide your comparison in clear Markdown format with sections for Overall, Frequency, Stereo/Depth, Dynamics/Loudness, Technical, Strengths & Opportunities (B), and Actionable Recs (B).`;

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
    if (chunk.text) yield { text: chunk.text };
  }
}
