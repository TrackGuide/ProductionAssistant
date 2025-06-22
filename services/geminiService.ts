// geminiService.ts — FINAL PART 1 🚀

import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_MODEL_NAME } from "../constants";
import {
  UserInputs,
  MidiSettings,
  MixFeedbackInputs,
  MixComparisonInputs,
  RemixGuideInputs,
  ChatMessage,
  GuidebookEntry
} from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
if (!apiKey) throw new Error("VITE_GEMINI_API_KEY is not set. Cannot connect to Gemini API.");
const ai = new GoogleGenerativeAI({ apiKey });
const getModel = () => ai.getGenerativeModel({ model: GEMINI_MODEL_NAME });

/**
 * Plugin Parameter Section Generator (full)
 */
function buildPluginParameterSection(daw?: string, plugins?: string): string {
  const dawInfo = daw ? `DAW: ${daw}` : "DAW: Not specified";
  const pluginInfo = plugins ? `Plugins: ${plugins}` : "Plugins: Stock/Generic";
  return `
### 🎛️ Processing Tips & Plugin Parameters

${dawInfo}
${pluginInfo}

**EQ Suggestions:**
- High-pass filter: 20–40 Hz (cut sub rumble)
- Low-mid cleanup: 200–500 Hz (cut muddiness)
- Presence boost: 2–5 kHz
- Air boost: 10–15 kHz

**Compression:**
- Ratio: 3:1 to 4:1
- Attack: 10–30 ms
- Release: 100–300 ms

**Reverb/Delay:**
- Room reverb: 0.8–1.5 sec
- Delay: 1/8 or 1/4 note
- High-cut: 8–12 kHz
- Mix: 15–30%
`;
}

/**
 * Structural Blueprint Table (full)
 */
function buildStructuralBlueprint(includeInstrumentation: boolean = true): string {
  const instr = includeInstrumentation ? " | **Instrumentation** " : "";
  return `
## 🎼 Structural Blueprint

| Section | Bars | Elements | Energy ${instr}|
|---|---|---|---|
| **Intro** | 8–16 | Pads, FX | Low |
| **Verse 1** | 16 | Groove, Vocals | Med |
| **Pre-Chorus** | 8 | Build FX, Fills | Med-High |
| **Chorus** | 16 | Full Band | High |
| **Breakdown** | 8–16 | Minimal | Low-Med |
| **Verse 2** | 16 | Variation | Med-High |
| **Final Chorus** | 16–24 | Climax | High |
| **Outro** | 8–16 | Fade | Low |
`;
}

/**
 * 1. generateGuidebookContent (full advanced)
 */
export const generateGuidebookContent = async (inputs: UserInputs): Promise<string> => {
  const genreContext = inputs.genre?.join(", ") || "Not specified";
  const vibeContext = inputs.vibe?.join(", ") || "Not specified";
  const instrumentContext = inputs.availableInstruments || "Not specified";
  const keyContext = inputs.key ? `Key: ${inputs.key}` : "";
  const scaleContext = inputs.scale ? `Scale/Mode: ${inputs.scale}` : "";
  const chordsContext = inputs.chords ? `Chord Progression: ${inputs.chords}` : "";
  const referenceContext = inputs.referenceTrackLink ? `Reference Track: ${inputs.referenceTrackLink}` : "";
  const lyricsContext = inputs.lyrics ? `Lyrics Theme: ${inputs.lyrics}` : "";
  const notesContext = inputs.generalNotes ? `Additional Notes: ${inputs.generalNotes}` : "";

  const structuralBlueprint = buildStructuralBlueprint(true);
  const pluginSection = buildPluginParameterSection(inputs.daw, inputs.plugins);

  const prompt = `
You are TrackGuideAI — expert production assistant.

Genre: ${genreContext}
Vibe: ${vibeContext}
Instruments: ${instrumentContext}
${keyContext} ${scaleContext}
${chordsContext}
${referenceContext}
${lyricsContext}
${notesContext}

---

## REQUIRED SECTIONS:

${structuralBlueprint}

## 🎵 Genre DNA Analysis
- Tempo range
- Harmony
- Rhythm
- Sonic palette

## 🎹 Sound Design Tips
- Lead sounds
- Bass design
- Drum programming
- Pads/FX

## 🎛️ Mixing Strategy
${pluginSection}

## 🎚️ Dynamics
- Compression
- Limiting
- Transients

## 🎼 Arrangement Flow
- Section transitions
- Variations
- Energy curve

Respond in clear Markdown.
`;

  const model = getModel();
  const response = await model.generateContent({
    contents: [{ parts: [{ text: prompt }] }]
  });

  return response.text();
};

/**
 * 2. generateMidiPatternSuggestions (full advanced)
 */
export const generateMidiPatternSuggestions = async (midi: MidiSettings): Promise<string> => {
  const prompt = `
You are TrackGuideAI's MIDI Pattern Generator.

Requirements:
- Key: ${midi.key}
- Scale/Mode: ${midi.scale || "Major/Natural Minor"}
- Tempo: ${midi.tempo} BPM
- Time Sig: ${midi.timeSignature.join("/")}
- Chords: ${midi.chordProgression}
- Genre: ${midi.genre}
- Section: ${midi.songSection || "Loop"}
- Bars: ${midi.bars}
- Target Instruments: ${midi.targetInstruments.join(", ")}

Return JSON ONLY:
{
  "chords": [...],
  "bassline": [...],
  "melody": [...],
  "drums": { ... }
}
`;

  const model = getModel();
  const response = await model.generateContent({
    contents: [{ parts: [{ text: prompt }] }]
  });

  return response.text();
};

/**
 * 3. generateMixFeedback (full)
 */
export const generateMixFeedback = async (inputs: MixFeedbackInputs): Promise<string> => {
  const prompt = `
You are TrackGuideAI's Mix Analysis Expert.

Track Name: ${inputs.trackName || "Untitled"}
Focus: ${inputs.focus || "Overall balance"}
Notes: ${inputs.notes || inputs.userNotes || "None"}

Provide:
1. Frequency Balance
2. Stereo Image
3. Dynamics
4. Technical Quality
5. Strengths & Fixes
`;

  const model = getModel();
  const response = await model.generateContent({
    contents: [{ parts: [{ text: prompt }] }]
  });

  return response.text();
};

/**
 * 4. generateMixComparison (full)
 */
export const generateMixComparison = async (inputs: MixComparisonInputs): Promise<string> => {
  const prompt = `
You are TrackGuideAI — expert mixing assistant.

Compare:
Mix A: "${inputs.mixAName}" (earlier)
Mix B: "${inputs.mixBName}" (current)

Sections:
- Overall Comparison
- Frequency Balance
- Stereo Image
- Dynamics & Loudness
- Technical Quality
- Strengths & Opportunities (Mix B)
- Recommendations (Mix B only)

Respond in clear Markdown.
`;

  const model = getModel();
  const response = await model.generateContent({
    contents: [{ parts: [{ text: prompt }] }]
  });

  return response.text();
};

/**
 * 5. generateAIAssistantResponse (full)
 */
export const generateAIAssistantResponse = async (
  conversation: ChatMessage[],
  guidebook: GuidebookEntry
): Promise<string> => {
  const history = conversation
    .map(msg => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
    .join("\n");

  const contextInfo = `
Current Guidebook:
Title: ${guidebook.title}
Genre: ${guidebook.genre.join(", ")}
Vibe: ${guidebook.vibe.join(", ")}
DAW: ${guidebook.daw}
Key: ${guidebook.key || "Not specified"}
Instruments: ${guidebook.availableInstruments}
`;

  const prompt = `
You are TrackGuideAI — expert music production assistant.

${contextInfo}

Conversation:
${history}

Respond with actionable production advice.
`;

  const model = getModel();
  const response = await model.generateContent({
    contents: [{ parts: [{ text: prompt }] }]
  });

  return response.text();
};

/**
 * 6. generateRemixGuide (full advanced — JSON fallback)
 */
export const generateRemixGuide = async (
  inputs: RemixGuideInputs
): Promise<{
  guide: string;
  targetTempo: number;
  targetKey: string;
  sections: string[];
  originalKey?: string;
  originalTempo?: number;
  originalChordProgression?: string;
}> => {
  const tempoRange = inputs.genreInfo?.tempoRange
    ? `${inputs.genreInfo.tempoRange[0]}-${inputs.genreInfo.tempoRange[1]} BPM`
    : "120–130 BPM";

  const sections = inputs.genreInfo?.sections || [
    "Intro",
    "Build-Up",
    "Drop",
    "Breakdown",
    "Outro"
  ];

  const structuralBlueprint = buildStructuralBlueprint(true);
  const pluginSection = buildPluginParameterSection(inputs.daw, inputs.plugins);

  const prompt = `
You are TrackGuideAI's Remix Specialist.

Target Genre: ${inputs.targetGenre}
Tempo Range: ${tempoRange}
Sections: ${sections.join(", ")}
DAW: ${inputs.daw || "Not specified"}
Plugins: ${inputs.plugins || "Stock/Generic"}

Analyze uploaded audio — return JSON:

{
  "guide": "FULL MARKDOWN GUIDE",
  "originalTempo": 120,
  "originalKey": "C minor",
  "originalChordProgression": "i-VI-III-VII",
  "targetTempo": 128,
  "targetKey": "C minor",
  "sections": [...]
}

In "guide", include:

# 🎵 Remix Guide: → ${inputs.targetGenre}
## Original DNA
## Strategy
${structuralBlueprint}
## Sound Design
## Rhythm
## Harmony
## Effects
## Arrangement
## Mix Tips
## Pro Tips

Respond ONLY with valid JSON!
`;

  const model = getModel();
  const response = await model.generateContent({
    contents: [{ parts: [{ text: prompt }] }]
  });

  const text = response.text();

  // Parse fallback
  try {
    let jsonStr = text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }

    const parsed = JSON.parse(jsonStr);

    return {
      guide: parsed.guide || text,
      targetTempo: parsed.targetTempo || 128,
      targetKey: parsed.targetKey || "C minor",
      sections: parsed.sections || sections,
      originalKey: parsed.originalKey || "C minor",
      originalTempo: parsed.originalTempo || 120,
      originalChordProgression: parsed.originalChordProgression || "i-VI-III-VII"
    };
  } catch (err) {
    console.error("RemixGuide JSON fallback error — returning text:", err);

    // Return fallback object
    return {
      guide: text,
      targetTempo: inputs.genreInfo?.tempoRange?.[0] || 128,
      targetKey: "C minor",
      sections,
      originalKey: "C minor",
      originalTempo: 120,
      originalChordProgression: "i-VI-III-VII"
    };
  }
};

/**
 * 7. generateMixFeedbackWithAudio (full with fallback)
 */
export const generateMixFeedbackWithAudio = async (
  inputs: MixFeedbackInputs
): Promise<string> => {
  const prompt = `
You are TrackGuideAI's Mix Analysis Expert.

Track: ${inputs.trackName || "Untitled"}
Focus: ${inputs.focus || "Overall balance"}
Notes: ${inputs.notes || inputs.userNotes || "None"}

Provide full feedback:
- Frequency Balance
- Stereo Image
- Dynamics
- Technical
- Strengths & Fixes
`;

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const audioBase64 = inputs.audioFile
    ? await fileToBase64(inputs.audioFile)
    : null;

  const parts: any[] = [{ text: prompt }];

  if (audioBase64) {
    parts.unshift({
      inlineData: {
        data: audioBase64,
        mimeType: inputs.audioFile?.type || "audio/mpeg"
      }
    });
  }

  const model = getModel();
  const response = await model.generateContent({
    contents: [{ parts }]
  });

  return response.text();
};

/**
 * 8. generateContent (simple)
 */
export const generateContent = async (prompt: string): Promise<string> => {
  const model = getModel();
  const response = await model.generateContent({
    contents: [{ parts: [{ text: prompt }] }]
  });

  return response.text();
};

/**
 * 9. generateAIAssistantResponseSimple
 */
export const generateAIAssistantResponseSimple = async (
  message: string,
  context?: {
    currentGuidebook?: GuidebookEntry;
    userInputs?: UserInputs;
  }
): Promise<string> => {
  const prompt = `
You are TrackGuideAI.

Context:
Genre: ${context?.userInputs?.genre?.join(", ") || context?.currentGuidebook?.genre?.join(", ") || "Not specified"}
Vibe: ${context?.userInputs?.vibe?.join(", ") || context?.currentGuidebook?.vibe?.join(", ") || "Not specified"}
DAW: ${context?.userInputs?.daw || context?.currentGuidebook?.daw || "Not specified"}

User asked:
${message}

Provide actionable production advice.
`;

  const model = getModel();
  const response = await model.generateContent({
    contents: [{ parts: [{ text: prompt }] }]
  });

  return response.text();
};

