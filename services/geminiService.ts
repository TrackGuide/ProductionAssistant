
// geminiService.ts - CLEAN FINAL VERSION

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GEMINI_MODEL_NAME } from "../constants.ts";
import { UserInputs, MidiSettings, MixFeedbackInputs } from "../types.ts";

const apiKey = process.env.API_KEY!;
if (!apiKey) throw new Error("API_KEY is not set. Cannot connect to Gemini API.");
const ai = new GoogleGenAI({ apiKey });

// ─── GUIDEBOOK GENERATION ───────────────────────────────────────

const generateGuidebookPrompt = (inputs: UserInputs): string => {
  return \`You are TrackGuideAI, an expert music production assistant. Create a TrackGuide for:
- Genre: \${inputs.genre?.join(", ") || "Not specified"}
- Vibe: \${inputs.vibe?.join(", ") || "Not specified"}
- Key: \${inputs.key || "N/A"}
- Chords: \${inputs.chords || "N/A"}
- DAW: \${inputs.daw || "General"}
- Plugins: \${inputs.plugins || "Stock plugins"}

Return only a clean, professional markdown guide.\`;
};

export const generateGuidebookContent = async (inputs: UserInputs): Promise<AsyncIterable<GenerateContentResponse>> => {
  const prompt = generateGuidebookPrompt(inputs);
  return await ai.models.generateContentStream({
    model: GEMINI_MODEL_NAME,
    contents: prompt,
  });
};

// ─── MIDI GENERATION ───────────────────────────────────────

const generateMidiPrompt = (settings: MidiSettings): string => {
  const { key, scale, tempo, timeSignature, chordProgression, genre, bars, targetInstruments, guidebookContext, songSection } = settings;
  return \`
Generate \${genre} MIDI patterns for \${bars} bars in \${key} \${scale || ""}, \${tempo} BPM, \${timeSignature[0]}/\${timeSignature[1]}.
Chords: \${chordProgression}. Section: \${songSection}.
Context: \${guidebookContext?.slice(0, 200)}

Return ONLY valid JSON with keys: \${targetInstruments.map(t => \`"\${t}"\`).join(", ")}
\`;
};

export const generateMidiPatternSuggestions = async (settings: MidiSettings): Promise<AsyncIterable<GenerateContentResponse>> => {
  const prompt = generateMidiPrompt(settings);
  return await ai.models.generateContentStream({
    model: GEMINI_MODEL_NAME,
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });
};

// ─── MIX FEEDBACK ───────────────────────────────────────

const fileToGenerativePart = async (file: File): Promise<{ inlineData: { mimeType: string; data: string } }> => {
  const base64 = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
    reader.readAsDataURL(file);
  });
  return { inlineData: { mimeType: file.type, data: base64 } };
};

const generateMixFeedbackPrompt = (notes: string): string => {
  return \`
You are an expert mix engineer. The user uploaded a mix for feedback.
User notes: "\${notes || "No notes."}"
Provide a professional, actionable mix critique in markdown.
\`;
};

export const generateMixFeedback = async (inputs: MixFeedbackInputs): Promise<string> => {
  if (!inputs.audioFile) throw new Error("No audio file provided.");
  const audioPart = await fileToGenerativePart(inputs.audioFile);
  const textPart = { text: generateMixFeedbackPrompt(inputs.userNotes) };

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL_NAME,
    contents: { parts: [audioPart, textPart] },
  });

  if (typeof response.text !== "string") throw new Error("Invalid response format.");
  return response.text;
};

// ─── CHAT ASSISTANT RESPONSE ───────────────────────────────────────

export const generateAIAssistantResponse = async (message: string): Promise<string> => {
  const prompt = \`
You are an AI production assistant. Respond to the user query:
"\${message}"
Give practical, clear advice related to music production.
\`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL_NAME,
    contents: { parts: [{ text: prompt }] },
  });

  if (typeof response.text !== "string") throw new Error("Invalid response format.");
  return response.text;
};

// ─── REMIX GUIDE ───────────────────────────────────────

export const generateRemixGuide = async (
  audioData: { base64: string; mimeType: string },
  targetGenre: string,
  genreInfo: any
): Promise<{ guide: string; targetTempo: number; targetKey: string; sections: string[]; midiPatterns: Record<string, Record<string, string>> }> => {
  const remixPrompt = \`
You are a remix expert. Generate a JSON remix guide for target genre: \${targetGenre}.
Tempo range: \${genreInfo?.tempoRange?.join("-") || "120-130"} BPM.
Sections: \${genreInfo?.sections?.join(", ") || "Intro, Drop, Outro"}.
Return JSON only with keys: guide, targetTempo, targetKey, sections, midiPatterns.
\`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL_NAME,
    contents: { parts: [
      { inlineData: { data: audioData.base64, mimeType: audioData.mimeType } },
      { text: remixPrompt }
    ]},
  });

  if (typeof response.text !== "string") throw new Error("Invalid response format.");

  let parsed;
  try {
    parsed = JSON.parse(response.text);
  } catch {
    throw new Error("Failed to parse remix guide JSON.");
  }

  return {
    guide: parsed.guide || "",
    targetTempo: parsed.targetTempo || 128,
    targetKey: parsed.targetKey || "C minor",
    sections: parsed.sections || ["Intro", "Drop", "Outro"],
    midiPatterns: parsed.midiPatterns || {},
  };
};
