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

// 1. Generate the core TrackGuide content
export const generateGuidebookContent = async (
  inputs: UserInputs
): Promise<AsyncIterable<GenerateContentResponse>> => {
  const prompt = /* build your TrackGuide prompt here */;
  return ai.generate(GEMINI_MODEL_NAME, { prompt, stream: true });
};

// 2. Generate MIDI pattern suggestions
export const generateMidiPatternSuggestions = async (
  settings: MidiSettings
): Promise<AsyncIterable<GenerateContentResponse>> => {
  const prompt = /* build your MIDI prompt here using settings */;
  return ai.generate(GEMINI_MODEL_NAME, { prompt, stream: true });
};

// 3. Generate mix feedback
export const generateMixFeedback = async (
  inputs: MixFeedbackInputs
): Promise<string> => {
  const prompt = /* build your mix feedback prompt */;
  const res = await ai.generate(GEMINI_MODEL_NAME, { prompt });
  return res.text;
};

// 4. Generate mix comparison
export const generateMixComparison = async (
  inputs: MixComparisonInputs
): Promise<string> => {
  const prompt = /* build your mix comparison prompt */;
  const res = await ai.generate(GEMINI_MODEL_NAME, { prompt });
  return res.text;
};

// 5. Generate AI assistant back-and-forth
export const generateAIAssistantResponse = async (
  conversation: ChatMessage[],
  guidebook: GuidebookEntry
): Promise<AsyncIterable<GenerateContentResponse>> => {
  const prompt = /* serialize conversation + guidebook into a prompt */;
  return ai.generate(GEMINI_MODEL_NAME, { prompt, stream: true });
};

// 6. Build the remix-specific prompt
export function generateRemixPrompt(inputs: RemixGuideInputs): string {
  // e.g. “Create a RemixGuide for track X in genre Y…”
  return /* your remix prompt string */;
}

// 7. Generate the actual RemixGuide
export async function generateRemixGuide(
  inputs: RemixGuideInputs
): Promise<AsyncIterable<GenerateContentResponse>> {
  const prompt = generateRemixPrompt(inputs);
  return ai.generate(GEMINI_MODEL_NAME, { prompt, stream: true });
}

// 8. Low-level helper for fire-and-forget single-turn prompts
export async function generateContent(prompt: string): Promise<string> {
  const res = await ai.generate(GEMINI_MODEL_NAME, { prompt });
  return res.text;
}
