
import { GoogleGenerativeAI, GenerateContentResponse } from '@google/generative-ai';
import { GEMINI_MODEL_NAME } from '../constants';

const genAI = new GoogleGenerativeAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY
});

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

export const generateSynthPatchGuide = async (
  inputs: PatchGuideInputs
): Promise<PatchGuideResult> => {
  const prompt = `
You are an expert sound designer. The user has selected the synth: "${inputs.synth}".

Generate a patch guide that includes:
1. Detailed written patch instructions (Markdown format)
2. Oscillator settings (return oscSettings object)
3. Filter knobs (return knobs object)
4. ADSR envelopes (return adsrVCF and adsrVCA)
5. Modulation Matrix (return modMatrix array)

Format your **JSON output** like this:
{
  "text": "### Your patch instructions in Markdown",
  "oscSettings": { "osc0_paramName": value, "osc1_paramName": value, ... },
  "knobs": { "paramName": value, ... },
  "adsrVCF": { "attack": ..., "decay": ..., "sustain": ..., "release": ... },
  "adsrVCA": { "attack": ..., "decay": ..., "sustain": ..., "release": ... },
  "modMatrix": [
    { "source": "sourceName", "target": "targetName", "amount": number },
    ...
  ]
}

Respond ONLY with this JSON.`;

  const result = await genAI.generateContent({
    model: GEMINI_MODEL_NAME,
    prompt
  });

  const text = result.text() || '';

  try {
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    const jsonString = text.substring(jsonStart, jsonEnd + 1);
    const parsed = JSON.parse(jsonString);
    return parsed;
  } catch (err) {
    console.error('Failed to parse synth patch guide JSON:', err);
    return { text };
  }
};
