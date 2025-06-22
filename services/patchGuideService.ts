// services/patchGuideService.ts

import { GoogleGenAI } from "@google/genai";
import { GEMINI_MODEL_NAME } from "../constants"; 
import { loadSynthConfig } from "../config/loadSynthConfig";  

const apiKey = process.env.API_KEY!;
if (!apiKey) throw new Error("API_KEY is not set. Cannot connect to Gemini API.");

const genAI = new GoogleGenAI({ apiKey });

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
  description: string;
}

export const generateSynthPatchGuide = async (
  inputs: PatchGuideInputs
): Promise<PatchGuideResult> => {
  const synthConfig = await loadSynthConfig(inputs.synth);
  const oscDescriptions = synthConfig?.oscillators?.map((o: any) => `- ${o.name} (${o.type})`) || [];
  const filterDescriptions = synthConfig?.filters?.map((f: any) => `- ${f.name} (${f.types?.join(", ")})`) || [];

  const prompt = `
You are an expert sound designer. The user has selected the synth: "${inputs.synth}".

**Synth Description:** ${inputs.description}

**Synth Capabilities:**

### Oscillators:
${oscDescriptions.length ? oscDescriptions.join("\n") : "- No details provided"}

### Filters:
${filterDescriptions.length ? filterDescriptions.join("\n") : "- No details provided"}

### Envelopes:
${synthConfig?.envelopes?.count || 2} envelopes available.

### Modulation Sources:
${synthConfig?.modSources?.join(", ") || "Unknown"}

### Modulation Destinations:
${Object.keys(synthConfig?.modDestinations || {}).join(", ") || "Unknown"}

---

**Your task: Generate a patch guide that includes:**

1️⃣ Detailed written patch instructions in Markdown  
2️⃣ Oscillator settings → "oscSettings" object  
3️⃣ Filter knobs → "knobs" object  
4️⃣ ADSR envelopes → "adsrVCF" and "adsrVCA"  
5️⃣ Modulation matrix → "modMatrix" array  

**REQUIRED JSON STRUCTURE:**

{
  "text": "### PATCH INSTRUCTIONS IN MARKDOWN",
  "oscSettings": { "osc1_param": value, ... },
  "knobs": { "filter_cutoff": value, ... },
  "adsrVCF": { "attack": X, "decay": X, "sustain": X, "release": X },
  "adsrVCA": { "attack": X, "decay": X, "sustain": X, "release": X },
  "modMatrix": [
    { "source": "sourceName", "target": "targetName", "amount": number },
    ...
  ]
}

⚠️ Respond ONLY with this JSON object. Do not include explanations or extra text.`;

    const response = await genAI.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: prompt,
    });

    const text = response.text || '';

    try {
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}');
      const jsonString = text.substring(jsonStart, jsonEnd + 1);
      const parsed = JSON.parse(jsonString);
      return parsed;
    } catch (err) {
      console.error("Failed to parse synth patch guide JSON:", err);
      return { text };
    }
};
