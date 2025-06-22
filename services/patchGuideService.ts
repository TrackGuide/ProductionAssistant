
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_MODEL_NAME } from "../constants";
import { SynthConfig } from "../config/synthConfigs";
import loadSynthConfig from "../config/loadSynthConfig";

const apiKey = process.env.API_KEY!;
if (!apiKey) throw new Error("API Key not configured. Cannot connect to Gemini API.");
const ai = new GoogleGenerativeAI({ apiKey });

export interface OscSettings {
  [key: string]: number;
}

export interface ADSR {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

export interface ModRouting {
  source: string;
  target: string;
  amount: number;
}

export interface PatchGuideResult {
  text: string;
  oscSettings?: OscSettings;
  adsrVCF?: ADSR;
  adsrVCA?: ADSR;
  knobs?: Record<string, number>;
  modMatrix?: ModRouting[];
}

interface PatchGuideInputs {
  synth: string;
}

export const generateSynthPatchGuide = async (inputs: PatchGuideInputs): Promise<PatchGuideResult> => {
  const config: SynthConfig = await loadSynthConfig(inputs.synth);

  const synthSummary = `
Selected Synth: **${inputs.synth}**
- Oscillators: ${config.oscillators.map(o => o.name).join(", ")}
- Filters: ${config.filters.map(f => f.name).join(", ")}
- Envelopes: ${config.envelopes.count} ${config.envelopes.labels ? config.envelopes.labels.join(", ") : ""}
- LFOs: ${config.LFOs?.count || 0} ${config.LFOs?.labels?.join(", ") || ""}
- Mod Sources: ${config.modSources.join(", ")}
- Mod Destinations: ${Object.keys(config.modDestinations).join(", ")}
`;

  const prompt = `You are an expert sound designer creating a synth patch guide.

${synthSummary}

Generate a patch guide that includes:
1. Detailed written patch instructions (Markdown format)
2. Oscillator settings (return oscSettings object)
3. Filter knobs (return knobs object)
4. ADSR envelopes (return adsrVCF and adsrVCA)
5. Modulation Matrix (return modMatrix array)

Respond in valid JSON only:
{
  "text": "### Your patch instructions in Markdown",
  "oscSettings": { "osc0_paramName": value, ... },
  "knobs": { "paramName": value, ... },
  "adsrVCF": { "attack": ..., "decay": ..., "sustain": ..., "release": ... },
  "adsrVCA": { "attack": ..., "decay": ..., "sustain": ..., "release": ... },
  "modMatrix": [
    { "source": "sourceName", "target": "targetName", "amount": number },
    ...
  ]
}
Respond only with the JSON object.`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL_NAME,
    contents: prompt,
  });

  const text = response.text;
  if (typeof text !== "string") {
    throw new Error("Unexpected response format from Gemini API");
  }

  try {
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    const jsonString = text.substring(jsonStart, jsonEnd + 1);
    const parsed = JSON.parse(jsonString);
    return parsed;
  } catch (err) {
    console.error("Failed to parse synth patch guide JSON:", err);
    return { text };
  }
};
