// services/patchGuideService.ts
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { GEMINI_MODEL_NAME } from '../constants';

export interface OscSettings {
  o1Oct?: number;
  o2Oct?: number;
  o3Oct?: number;
  o1Coarse?: number;
  o2Coarse?: number;
  o3Coarse?: number;
  o1Fine?: number;
  o2Fine?: number;
  o3Fine?: number;
}

export interface ModRouting {
  source: string;
  target: string;
  amount: number;
  lfoRate?: number;
  lfoDepth?: number;
}

export interface ADSR {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

export interface PatchGuideResult {
  text: string;
  waveform?: string;
  oscSettings?: OscSettings;
  adsrVCF?: ADSR;
  adsrVCA?: ADSR;
  knobs?: Record<string, number>;
  modMatrix?: ModRouting[];
}

export async function generateSynthPatchGuide(
  inputs: {
    description: string;
    synth: string;
    voiceType: string;
    descriptor: string;
    genre: string;
    notes?: string;
  }
): Promise<PatchGuideResult> {
  const prompt = `
You are an expert sound designer. Given the following inputs,
generate a JSON response with keys: text, waveform, oscSettings,
adsrVCF, adsrVCA, knobs, modMatrix.

Inputs:
- Voice Type: ${inputs.voiceType}
- Descriptor: ${inputs.descriptor}
- Genre: ${inputs.genre}
- Synth: ${inputs.synth}
- Notes: ${inputs.notes || 'None'}

Return JSON only.
  `;

  const ai = new GoogleGenAI();
  const response: GenerateContentResponse = await ai.generateContent({
    model: GEMINI_MODEL_NAME,
    prompt,
    temperature: 0.7,
    maxTokens: 800,
  });

  let parsed: any;
  try {
    parsed = JSON.parse(response.text);
  } catch (err) {
    throw new Error('Invalid JSON response from AI');
  }

  return {
    text: parsed.text,
    waveform: parsed.waveform,
    oscSettings: parsed.oscSettings,
    adsrVCF: parsed.adsrVCF,
    adsrVCA: parsed.adsrVCA,
    knobs: parsed.knobs,
    modMatrix: parsed.modMatrix,
  };
}
