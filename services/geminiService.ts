import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { UserInputs, MidiSettings, MixFeedbackInputs } from '../types.ts';
import { GEMINI_MODEL_NAME } from '../constants.ts';

// ─── INIT ─────────────────────────────────────────────────────────────────────
const apiKey = process.env.API_KEY;
if (!apiKey) {
  console.error(
    "API_KEY is not set. Please ensure the API_KEY environment variable is configured."
  );
}
const ai = new GoogleGenAI({ apiKey });

// ─── 1) TRACKGUIDE STREAMING ──────────────────────────────────────────

/** Your full existing generatePrompt(inputs: UserInputs) goes here. */
const generatePrompt = (inputs: UserInputs): string => {
  const genreText = inputs.genre.length > 0 ? inputs.genre.join(", ") : "Not specified";
  const vibeText  = inputs.vibe.length > 0 ? inputs.vibe.join(", ") : "Not specified";
  const artistRefText = inputs.artistReference || "General to genre/vibe";
  const songTitleText = inputs.songTitle?.trim() || "";

  const userHasSpecifiedPlugins =
    inputs.plugins &&
    inputs.plugins.trim() !== "" &&
    !inputs.plugins.toLowerCase().includes("stock only");
  const pluginsText = userHasSpecifiedPlugins
    ? inputs.plugins
    : `Stock plugins of ${inputs.daw || "the selected DAW"}`;

  const instrumentsText =
    inputs.availableInstruments ||
    "Standard rock/pop/electronic instruments assumed";

  const getPluginSuggestion = (
    specificPluginName: string,
    fallbackGenericType: string,
    pluginCategoryForDawStock: string
  ) => {
    if (userHasSpecifiedPlugins) {
      if (
        inputs.plugins
          .toLowerCase()
          .includes(specificPluginName.split(" ")[0].toLowerCase())
      ) {
        return `\`${specificPluginName}\``;
      }
      if (
        inputs.plugins.toLowerCase().includes("arturia") &&
        specificPluginName.toLowerCase().includes("arturia")
      )
        return `\`${specificPluginName}\``;
      if (
        (inputs.plugins.toLowerCase().includes("native instruments") ||
          inputs.plugins.toLowerCase().includes("komplete")) &&
        ["massive", "kontakt", "reaktor", "guitar rig", "battery"].some((ni) =>
          specificPluginName.toLowerCase().includes(ni)
        )
      )
        return `\`${specificPluginName}\``;
      if (
        inputs.plugins.toLowerCase().includes("fabfilter") &&
        specificPluginName.toLowerCase().includes("fabfilter")
      )
        return `\`${specificPluginName}\``;
      if (
        inputs.plugins.toLowerCase().includes("soundtoys") &&
        specificPluginName.toLowerCase().includes("soundtoys")
      )
        return `\`${specificPluginName}\``;
      if (
        inputs.plugins.toLowerCase().includes("valhalla") &&
        specificPluginName.toLowerCase().includes("valhalla")
      )
        return `\`${specificPluginName}\``;
      return `a suitable ${fallbackGenericType.toLowerCase()}`;
    }
    return `${inputs.daw || "DAW"} stock ${pluginCategoryForDawStock.toLowerCase()}`;
  };

  const mainTitleInstruction = songTitleText
    ? `The user has provisionally titled this project: "${songTitleText}". Use this as the primary title in the '# TRACKGUIDE: "..."' heading, or refine it slightly if you can make it more engaging while keeping its core idea.`
    : `Generate an engaging and ORIGINAL title for the '# TRACKGUIDE: "..."' heading that creatively combines '${genreText}', '${vibeText}', and '${artistRefText}' if provided, e.g., "Substructure Anomaly" - An Experimental Neurofunk Descent.`;

  const suggestedTitleInstruction = songTitleText
    ? `Use the user-provided title: "${songTitleText}".`
    : `Generate a creative, SHORT, and ORIGINAL title that captures the essence of all inputs. Avoid generic phrases like "Song for..." or simply restating the genre/vibe."`;

  return `
You are TrackGuideAI, an expert music production assistant. Generate a comprehensive TrackGuide based on the following user inputs.
The user wants to create a song with the following characteristics:
- Project Title (User Provided): ${songTitleText || "Not specified"}
- Genre(s): ${genreText}
- Artist/Song Reference(s): ${artistRefText}
- Reference Track Link: ${inputs.referenceTrackLink || "Not provided"}
- Lyrics: ${inputs.lyrics || "Not provided"}
- Key: ${inputs.key || "Not specified"}
- Chords: ${inputs.chords || "Not specified"}
- General Notes for AI: ${inputs.generalNotes || "None"}
- Vibe/Mood(s): ${vibeText}
- Preferred DAW: ${inputs.daw || "Not specified, suggest generally or for Ableton Live/Logic Pro"}
- Available Plugins: ${pluginsText}
- Available Instruments: ${instrumentsText}

**IMPORTANT INSTRUCTIONS FOR AI (OVERALL):**
- **STYLE:** Follow a "Quick Reference / Cheat Sheet Style" ...
- **TERMINOLOGY:** Use professional music production terminology.
- **MARKDOWN:** Use Markdown for formatting...
- ... [rest of your full instructions pasted here] ...
## 5. Final Notes & Implementation
- ✔ Focus on [key element from inputs, e.g., the rhythmic drive of ${genreText}].
- ...
---
Experiment, trust your ears, and enjoy the creative journey!
`;
};

export const generateGuidebookContent = async (
  inputs: UserInputs
): Promise<AsyncIterable<GenerateContentResponse>> => {
  if (!apiKey) {
    const errorMessage =
      "API Key not configured. Cannot connect to Gemini API.";
    console.error(errorMessage);
    return Promise.reject(new Error(errorMessage));
  }
  const prompt = generatePrompt(inputs);
  return ai.models.generateContentStream({
    model: GEMINI_MODEL_NAME,
    contents: prompt,
  });
};

// ─── 2) MIDI PATTERN STREAMING ────────────────────────────────────────
const generateMidiPrompt = (settings: MidiSettings): string => {
  // ... your existing MIDI prompt builder here ...
  return `Generate MIDI patterns in JSON format for ${settings.genre} music ...`;
};

export const generateMidiPatternSuggestions = async (
  settings: MidiSettings
): Promise<AsyncIterable<GenerateContentResponse>> => {
  if (!apiKey) throw new Error("API Key not configured.");
  const prompt = generateMidiPrompt(settings);
  return ai.models.generateContentStream({
    model: GEMINI_MODEL_NAME,
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });
};

// ─── 3) MIX FEEDBACK ────────────────────────────────────────────────
const generateMixFeedbackPrompt = (userNotes: string): string => {
  return `
You are an expert audio mixing and mastering engineer AI. The user has uploaded an audio file of their mix and provided some notes.
Analyze the audio mix thoroughly.
User's Notes/Questions:
"${userNotes}"
... [rest of your mix-feedback prompt here] ...
`;
};

const fileToGenerativePart = async (
  file: File
): Promise<{ inlineData: { mimeType: string; data: string } }> => {
  const data = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () =>
      resolve((reader.result as string).split(",")[1]);
    reader.readAsDataURL(file);
  });
  return { inlineData: { mimeType: file.type, data } };
};

export const generateMixFeedback = async (
  inputs: MixFeedbackInputs
): Promise<string> => {
  if (!apiKey) throw new Error("API Key not configured.");
  if (!inputs.audioFile) throw new Error("No audio file provided.");
  const audioPart = await fileToGenerativePart(inputs.audioFile);
  const textPart = { text: generateMixFeedbackPrompt(inputs.userNotes) };
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL_NAME,
    contents: { parts: [audioPart, textPart] },
  });
  if (typeof response.text === "string") return response.text;
  throw new Error("Unexpected mix feedback response format.");
};

// ─── 4) MIX COMPARISON ──────────────────────────────────────────────
interface MixComparisonInputs {
  mixAFile?: string;
  mixBFile?: string;
  mixAName: string;
  mixBName?: string;
  requestMixAAnalysis?: boolean;
  requestMixBAnalysis?: boolean;
  userNotes?: string;
}

const generateMixComparisonPrompt = (
  inputs: MixComparisonInputs
): string => {
  // ... your existing mix-comparison prompt builder ...
  return `You are an expert audio mixing and mastering engineer AI...`;
};

export const generateMixComparison = async (
  inputs: MixComparisonInputs
): Promise<string> => {
  if (!apiKey) throw new Error("API Key not configured.");
  if (!inputs.mixAFile) throw new Error("No audio file provided.");
  const textPart = { text: generateMixComparisonPrompt(inputs) };
  const parts: any[] = [textPart];
  parts.push({ inlineData: { data: inputs.mixAFile, mimeType: "audio/mpeg" } });
  if (inputs.mixBFile) {
    parts.push({ inlineData: { data: inputs.mixBFile, mimeType: "audio/mpeg" } });
  }
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL_NAME,
    contents: parts,
    config: { responseMimeType: "text/plain" },
  });
  if (Array.isArray((response as any).candidates)) {
    return (response as any).candidates[0]?.content || "";
  } else if (typeof response.text === "string") {
    return response.text;
  }
  throw new Error("Unexpected mix comparison response format.");
};

// ─── 5) GENERAL AI ASSISTANT ───────────────────────────────────────
export const generateAIAssistantResponse = async (
  message: string,
  context?: { currentGuidebook?: any; userInputs?: any }
): Promise<string> => {
  if (!apiKey) throw new Error("API Key not configured.");
  const contextInfo = context
    ? `Current project context:
- Genre: ${context.userInputs?.genre || "Not specified"}
- Vibe:  ${context.userInputs?.vibe  || "Not specified"}
- DAW:   ${context.userInputs?.daw   || "Not specified"}`
    : "";
  const prompt = `You are an AI music production assistant...
${contextInfo}

User question: ${message}
Provide helpful, concise advice...`;
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL_NAME,
    contents: { parts: [{ text: prompt }] },
  });
  if (typeof response.text === "string") return response.text;
  throw new Error("Unexpected AI assistant response format.");
};

// ─── 6) NEW REMIX GUIDЕ ─────────────────────────────────────────────

// ─── REMIX GUIDE PROMPT ─────────────────────────────────────────────────────────
export const generateRemixPrompt = (
  targetGenre: string,
  genreInfo: any
): string => {
  const tempoRange = genreInfo
    ? `${genreInfo.tempoRange[0]}-${genreInfo.tempoRange[1]} BPM`
    : "120-130 BPM";
  const sections = genreInfo
    ? genreInfo.sections.join(", ")
    : "Intro, Build-Up, Drop, Breakdown, Outro";

  return `You are a professional music producer assistant. The user has uploaded a track and selected the remix genre: ${targetGenre}.

Analyze the uploaded track: identify its tempo, key, harmonic progression, melodic motifs, and rhythmic feel.

Now, generate a Remix Guide that includes:
1. Suggested overall remix approach
2. Arrangement ideas
3. Sound design tips
4. Suggested structure (sections: ${sections})
5. Target tempo & key for the remix (typical range: ${tempoRange})

Then, generate MIDI patterns for each section:
- Bassline
- Drums
- Melody / Harmony
- Pads or textures

Return **only** the JSON object with these keys: \\`guide\\`, \\`targetTempo\\`, \\`targetKey\\`, \\`sections\\`, and \\`midiPatterns\\`. `;
};

// ─── REMIX GUIDE CALL ─────────────────────────────────────────────────────────
export const generateRemixGuide = async (
  audioData: { base64: string; mimeType: string },
  targetGenre: string,
  genreInfo: any
): Promise<{
  guide: string;
  targetTempo: number;
  targetKey: string;
  sections: string[];
  midiPatterns: Record<string, Record<string, string>>;
}> => {
  if (!apiKey) {
    throw new Error(
      "API Key not configured. Cannot connect to Gemini API for remix guide."
    );
  }

  const textPart = { text: generateRemixPrompt(targetGenre, genreInfo) };
  const audioPart = {
    inlineData: {
      data: audioData.base64,
      mimeType: audioData.mimeType,
    },
  };

  console.log("[geminiService] Remix Prompt:", textPart.text);
  console.log("[geminiService] Audio size (chars):", audioData.base64.length);

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: [textPart, audioPart],
    });

    // Extract returned text
    let raw: string;
    if (typeof (response as any).text === 'function') {
      raw = await (response as any).text();
    } else if (typeof response.text === 'string') {
      raw = response.text;
    } else if (Array.isArray((response as any).candidates)) {
      raw = (response as any).candidates[0]?.content || '';
    } else {
      console.error('[geminiService] Unexpected response shape:', response);
      raw = '';
    }

    console.log('[geminiService] Raw remix response:', raw);

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // Fallback
    return {
      guide: raw,
      targetTempo: genreInfo?.tempoRange?.[0] || 128,
      targetKey: 'C minor',
      sections: genreInfo?.sections || ['Intro','Build-Up','Drop','Breakdown','Outro'],
      midiPatterns: {},
    };
  } catch (err: any) {
    console.error('[geminiService] Error in generateRemixGuide:', err);
    throw new Error(
      err.message.includes('quota')
        ? 'API quota exceeded.'
        : err.message || 'Failed to generate remix guide.'
    );
  }
};
