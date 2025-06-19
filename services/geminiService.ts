// services/geminiService.ts

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GEMINI_MODEL_NAME } from "../constants.ts";
import { UserInputs, MidiSettings, MixFeedbackInputs } from "../types.ts";

interface PluginSetting {
  /** e.g. "Ableton Compressor", "Arturia Comp FET-70" */
  name: string;
  /** Contextual use case, e.g. "Vocals", "Drums", etc. */
  context?: string;
  /** Map of parameter → value, e.g. { ratio: "4:1", threshold: "-6dB" } */
  parameters: Record<string,string>;
}

interface GuideGenerationOptions {
  /** e.g. "Ableton Live 11", "Logic Pro X" */
  daw?: string;
  plugins?: PluginSetting[];
}

export type TrackGuideInputs = UserInputs & GuideGenerationOptions;
export interface RemixGuideInputs extends GuideGenerationOptions {
  /** The full TrackGuide text to remix from */
  originalGuide: string;
  /** Any additional instructions for the remix guide */
  notes?: string;
}

const apiKey = process.env.API_KEY!;
if (!apiKey) {
  throw new Error("API_KEY is not set. Cannot connect to Gemini API.");
}
const ai = new GoogleGenAI({ apiKey });

/** Helper to render the Structural Blueprint table rows with an Instrumentation column */
function renderStructuralBlueprint(sections: { name: string; bars: number; instrumentation?: string }[]): string {
  let table = `| Section | Bars | Instrumentation |\n|---------|------|-----------------|\n`;
  for (const s of sections) {
    table += `| ${s.name} | ${s.bars} | ${s.instrumentation || "N/A"} |\n`;
  }
  return table;
}

/** Helper to render plugin parameter details */
function renderPluginSettings(plugins?: PluginSetting[]): string {
  if (!plugins || plugins.length === 0) return "No plugin-specific settings provided.";
  return plugins.map(p => {
    const params = Object.entries(p.parameters)
      .map(([k,v]) => `  - **${k}**: ${v}`)
      .join("\n");
    return `**${p.name}**${p.context ? ` (${p.context})` : ""}\n${params}`;
  }).join("\n\n");
}

/** Build prompt for a new TrackGuide */
function buildTrackGuidePrompt(inputs: TrackGuideInputs): string {
  const {
    genre, vibe, tempo, key, 
    daw, plugins, 
    sections = [], 
    structuralBlueprintInputs = []
  } = inputs;
  
  return `
You are TrackGuideAI, an expert music production assistant. Create a comprehensive TrackGuide with the following:

**1. Song Overview**
- Genre: ${genre?.join(", ") || "Not specified"}
- Vibe: ${vibe?.join(", ") || "Not specified"}
- Tempo: ${tempo || "Not specified"} BPM
- Key: ${key || "Not specified"}
${daw ? `- DAW: ${daw}` : ""}

**2. Structural Blueprint**
${renderStructuralBlueprint(structuralBlueprintInputs)}

**3. Instrument & Sound Design Guide**
Provide recommended instruments/sounds for each section above.

**4. Plugin Parameter Settings**
${renderPluginSettings(plugins)}

Please format the TrackGuide as markdown, with clear headings and tables where appropriate.
`.trim();
}

/**
 * Call Gemini to generate a TrackGuide
 */
export async function generateTrackGuide(
  inputs: TrackGuideInputs
): Promise<GenerateContentResponse> {
  const prompt = buildTrackGuidePrompt(inputs);
  return ai.generateContent({
    model: GEMINI_MODEL_NAME,
    prompt,
    temperature: 0.7,
  });
}

/** Build prompt for a RemixGuide based on an existing TrackGuide */
function buildRemixGuidePrompt(inputs: RemixGuideInputs): string {
  const { originalGuide, notes, daw, plugins } = inputs;
  return `
You are TrackGuideAI Remix, an expert at reimagining existing TrackGuides. Based on the original TrackGuide below, generate a **RemixGuide** that includes:

**A. New Structural Blueprint**  
Provide a fresh table of sections and bars, plus an "Instrumentation" column, optimized for a remix.

${renderStructuralBlueprint(inputs.structuralBlueprintInputs || [])}

**B. Instrument & Sound Design Guide**  
Adapt or replace instruments in each section for the remix vibe.

**C. Detailed Plugin & DAW Parameter Settings**  
${renderPluginSettings(plugins)}  
${daw ? `Target DAW: ${daw}` : ""}

**Original TrackGuide:**  
\`\`\`
${originalGuide}
\`\`\`

${notes ? `**Additional Remix Notes:** ${notes}` : ""}

Format the RemixGuide as markdown with headings, tables, and bullet points.
`.trim();
}

/**
 * Call Gemini to generate a RemixGuide
 */
export async function generateRemixGuide(
  inputs: RemixGuideInputs
): Promise<GenerateContentResponse> {
  const prompt = buildRemixGuidePrompt(inputs);
  return ai.generateContent({
    model: GEMINI_MODEL_NAME,
    prompt,
    temperature: 0.7,
  });
}

// Optional: you can also re-export generateMidiPatternSuggestions etc.
// export { generateMidiPatternSuggestions } from "./geminiService-midi.ts";

