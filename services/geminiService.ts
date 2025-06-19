// services/geminiService.ts

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GEMINI_MODEL_NAME } from "../constants.ts";
import {
  UserInputs,
  MidiSettings,
  MixFeedbackInputs,
  MixComparisonInputs,
  RemixGuideInputs,
  ChatMessage,
  GuidebookEntry
} from "../types.ts";

const apiKey = process.env.API_KEY!;
if (!apiKey) throw new Error("API_KEY is not set. Cannot connect to Gemini API.");
const ai = new GoogleGenAI({ apiKey });

/**
 * 1. Generate the core TrackGuide content (streaming)
 */
export const generateGuidebookContent = async (
  inputs: UserInputs
): Promise<AsyncIterable<GenerateContentResponse>> => {
  const prompt = `You are TrackGuideAI, an expert music production assistant.
Create a detailed TrackGuide for the following:
- Genre: ${inputs.genre?.join(", ") || "Not specified"}
- Vibe: ${inputs.vibe?.join(", ") || "Not specified"}
- Instruments: ${inputs.instruments?.join(", ") || "Not specified"}
Provide sections on Structure, Instrumentation, Sound Design, Mixing tips.`;
  return ai.generate(GEMINI_MODEL_NAME, { prompt, stream: true });
};

/**
 * 2. Generate MIDI pattern suggestions (streaming)
 */
export const generateMidiPatternSuggestions = async (
  settings: MidiSettings
): Promise<AsyncIterable<GenerateContentResponse>> => {
  const prompt = `You are TrackGuideAI. Generate MIDI patterns in JSON for:
Key: ${settings.key}, Scale/Mode: ${settings.scale || "default"}, Tempo: ${settings.tempo} BPM, Time Signature: ${settings.timeSignature.join("/")}
Chord Progression: ${settings.chordProgression}
Genre Context: ${settings.genre}
Structure Section: ${settings.songSection}, Bars: ${settings.bars}
Target Instruments: ${settings.targetInstruments.join(", ")}
Return valid JSON only.`;
  return ai.generate(GEMINI_MODEL_NAME, { prompt, stream: true });
};

/**
 * 3. Generate mix feedback (one-shot)
 */
export const generateMixFeedback = async (
  inputs: MixFeedbackInputs
): Promise<string> => {
  const prompt = `You are TrackGuideAI. Provide mix feedback on:
Track: ${inputs.trackName}
Feedback points: ${inputs.focus || "general"}
Mix Notes: ${inputs.notes || "none"}`;
  const res = await ai.generate(GEMINI_MODEL_NAME, { prompt });
  return res.text;
};

/**
 * 4. Generate mix comparison (one-shot)
 */
export const generateMixComparison = async (
  inputs: MixComparisonInputs
): Promise<string> => {
  const prompt = `You are TrackGuideAI. Compare two mixes:
A: ${inputs.mixAUrl}
B: ${inputs.mixBUrl}
Focus on clarity, balance, stereo image, dynamics.`;
  const res = await ai.generate(GEMINI_MODEL_NAME, { prompt });
  return res.text;
};

/**
 * 5. Generate AI-assistant chat response (streaming)
 */
export const generateAIAssistantResponse = async (
  conversation: ChatMessage[],
  guidebook: GuidebookEntry
): Promise<AsyncIterable<GenerateContentResponse>> => {
  const history = conversation
    .map(msg => `${msg.role}: ${msg.content}`)
    .join("\n");
  const prompt = `You are TrackGuideAI assisting the user.  
Guidebook Context: ${guidebook.title}
${history}
Assistant:`;
  return ai.generate(GEMINI_MODEL_NAME, { prompt, stream: true });
};

/**
 * 6. Build the remix-specific prompt (sync)
 */
export function generateRemixPrompt(inputs: RemixGuideInputs): string {
  return `You are TrackGuideAI. Create a RemixGuide for:
Original Track: ${inputs.originalTrackTitle}
Target Genre: ${inputs.targetGenre}
Key: ${inputs.targetKey}
Tempo: ${inputs.targetTempo}
Additional Notes: ${inputs.notes || "none"}
Include a new Structural Blueprint (with Instrumentation column) and detailed plugin parameter settings.`;
}

/**
 * 7. Generate the actual RemixGuide (streaming)
 */
export async function generateRemixGuide(
  inputs: RemixGuideInputs
): Promise<AsyncIterable<GenerateContentResponse>> {
  const prompt = generateRemixPrompt(inputs);
  return ai.generate(GEMINI_MODEL_NAME, { prompt, stream: true });
}

/**
 * 8. Low‐level helper for simple prompts
 */
export async function generateContent(prompt: string): Promise<string> {
  const res = await ai.generate(GEMINI_MODEL_NAME, { prompt });
  return res.text;
}
