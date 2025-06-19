// services/geminiService.ts
// CLEAN FINAL VERSION

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GEMINI_MODEL_NAME } from "../constants.ts";
import { UserInputs, MidiSettings, MixFeedbackInputs } from "../types.ts";

const apiKey = process.env.API_KEY!;
if (!apiKey) throw new Error("API_KEY is not set. Cannot connect to Gemini API.");
const ai = new GoogleGenAI({ apiKey });

/**
 * Create a full TrackGuide from user inputs.
 */
export async function generateTrackGuide(
  inputs: UserInputs
): Promise<GenerateContentResponse> {
  const prompt = `You are TrackGuideAI, an expert music production assistant.
Create a detailed TrackGuide including:
1. Musical Overview (genre, vibe, instrumentation columns)
2. Structural Blueprint (sections, timings, instrumentation)
3. Instrument & Sound Design Guide (plugins + specific parameters)
4. Mixing Tips
User Inputs:
- Genre: ${inputs.genre?.join(", ") || "N/A"}
- Vibe: ${inputs.vibe?.join(", ") || "N/A"}
- Key: ${inputs.key || "N/A"}
- Tempo: ${inputs.tempo || "N/A"} BPM
- DAW: ${inputs.daw || "Not specified"}
- Plugins: ${inputs.plugins?.join(", ") || "None specified"}`;

  return ai.generate({
    model: GEMINI_MODEL_NAME,
    prompt,
    temperature: 0.7,
    maxOutputTokens: 1500,
  });
}

/**
 * Create a RemixGuide based on an existing TrackGuide.
 */
export async function generateRemixGuide(
  originalTrackGuide: string,
  inputs: UserInputs
): Promise<GenerateContentResponse> {
  const prompt = `You are TrackGuideAI, an expert remix assistant.
Based on this TrackGuide:
${originalTrackGuide}

Create a RemixGuide that includes:
1. New Structural Blueprint (with instrumentation column)
2. Sound Design adjustments (plugins + specific parameters)
3. Arrangement tips for the remix vibe

Remix Inputs:
- Target Key: ${inputs.key || "same as original"}
- Target Tempo: ${inputs.tempo || "same as original"} BPM
- DAW: ${inputs.daw || "Not specified"}
- Plugins: ${inputs.plugins?.join(", ") || "None specified"}`;

  return ai.generate({
    model: GEMINI_MODEL_NAME,
    prompt,
    temperature: 0.7,
    maxOutputTokens: 1200,
  });
}

/**
 * Generate AI‐driven MIDI pattern suggestions for a given set of MIDI settings.
 * This is what MidiGeneratorComponent imports and calls.
 */
export async function generateMidiPatternSuggestions(
  settings: MidiSettings
): Promise<GenerateContentResponse> {
  const prompt = `Generate JSON‐formatted MIDI patterns for:
- Genre: ${settings.genre}
- Key: ${settings.key}
- Tempo: ${settings.tempo}
- Time Signature: ${settings.timeSignature.join("/")}
- Chord Progression: ${settings.chordProgression}
- Bars: ${settings.bars}
- Song Section: ${settings.songSection}
Include separate arrays for: chords, bassline, melody, drums.`;

  return ai.generate({
    model: GEMINI_MODEL_NAME,
    prompt,
    temperature: 0.8,
    maxOutputTokens: 800,
  });
}

/**
 * (Optional) Generate mix-feedback based on user feedback inputs.
 */
export async function generateMixFeedback(
  feedback: MixFeedbackInputs
): Promise<GenerateContentResponse> {
  const prompt = `You are TrackGuideAI, a mastering engineer.
User Feedback: "${feedback.comments}"
Provide mix correction tips, plugin suggestions with specific parameters.`;

  return ai.generate({
    model: GEMINI_MODEL_NAME,
    prompt,
    temperature: 0.6,
    maxOutputTokens: 600,
  });
}
