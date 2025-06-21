// services/patchGuideService.ts
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { GEMINI_MODEL_NAME } from '../constants';

export interface OscSettings {
  o1Oct: number;
  o2Oct: number;
  o3Oct: number;
  o1Coarse: number;
  o2Coarse: number;
  o3Coarse: number;
  o1Fine: number;
  o2Fine: number;
  o3Fine: number;
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
  lfoRate?: number;
  lfoDepth?: number;
}

export interface PatchGuideResult {
  text: string;
  waveform?: string;
  oscSettings: OscSettings;
  adsrVCF: ADSR;
  adsrVCA: ADSR;
  knobs: Record<string, number>;
  modMatrix: ModRouting[];
}

interface PatchGuideInputs {
  description: string;
  synth: string;
  voiceType: string;
  descriptor: string;
  genre: string;
  notes?: string;
}

/**
 * Clamp a value to a numeric range, defaulting to min on invalid input.
 */
function clamp(value: any, min: number, max: number): number {
  const n = parseFloat(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(Math.max(n, min), max);
}

export async function generateSynthPatchGuide(
  inputs: PatchGuideInputs
): Promise<PatchGuideResult> {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY);

  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY or VITE_GEMINI_API_KEY');
  }

  const prompt = `
You are an expert sound designer. Given these inputs, return a JSON object with:
- text (string)
- waveform (string)
- oscSettings (object)
- adsrVCF (object)
- adsrVCA (object)
- knobs (object)
- modMatrix (array)

Use these exact knob keys with values between 0.0 and 1.0:
Cutoff, Resonance, Drive, Mix, Reverb, DelayTime, DelayFB, ChorusDepth, ChorusRate, MasterTune

Ensure oscSettings use numeric values.
ADS R blocks must be numeric.
Return JSON only.

Inputs:
- Voice Type: ${inputs.voiceType}
- Descriptor: ${inputs.descriptor}
- Genre: ${inputs.genre}
- Synth: ${inputs.synth}
- Notes: ${inputs.notes || 'None'}
`;

  const ai = new GoogleGenAI({ apiKey });
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: GEMINI_MODEL_NAME,
    contents: prompt,
    temperature: 0.7,
    maxTokens: 800,
  });

  const raw = response.text.trim();
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const jsonText = fenceMatch ? fenceMatch[1].trim() : raw;

  let parsed: any;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err) {
    throw new Error('Invalid JSON from AI: ' + (err as Error).message);
  }

  // Destructure with defaults
  const {
    text = '',
    waveform = '',
    oscSettings: rawOsc = {},
    adsrVCF: rawVCF = {},
    adsrVCA: rawVCA = {},
    knobs: rawKnobs = {},
    modMatrix: rawMatrix = []
  } = parsed;

  // Build cleaned knobs
  const knobKeys = [
    'Cutoff', 'Resonance', 'Drive', 'Mix',
    'Reverb', 'DelayTime', 'DelayFB',
    'ChorusDepth', 'ChorusRate', 'MasterTune'
  ];
  const knobs: Record<string, number> = {};
  knobKeys.forEach(key => {
    knobs[key] = clamp(rawKnobs[key], 0, 1);
  });

  // Clean oscSettings
  const oscSettings: OscSettings = {
    o1Oct: clamp(rawOsc.o1Oct, -4, 4),
    o2Oct: clamp(rawOsc.o2Oct, -4, 4),
    o3Oct: clamp(rawOsc.o3Oct, -4, 4),
    o1Coarse: clamp(rawOsc.o1Coarse, -12, 12),
    o2Coarse: clamp(rawOsc.o2Coarse, -12, 12),
    o3Coarse: clamp(rawOsc.o3Coarse, -12, 12),
    o1Fine: clamp(rawOsc.o1Fine, -1, 1),
    o2Fine: clamp(rawOsc.o2Fine, -1, 1),
    o3Fine: clamp(rawOsc.o3Fine, -1, 1),
  };

  // Clean ADSR
  const adsrVCF: ADSR = {
    attack: clamp(rawVCF.attack, 0, 10),
    decay: clamp(rawVCF.decay, 0, 10),
    sustain: clamp(rawVCF.sustain, 0, 1),
    release: clamp(rawVCF.release, 0, 10),
  };
  const adsrVCA: ADSR = {
    attack: clamp(rawVCA.attack, 0, 10),
    decay: clamp(rawVCA.decay, 0, 10),
    sustain: clamp(rawVCA.sustain, 0, 1),
    release: clamp(rawVCA.release, 0, 10),
  };

  // Clean modMatrix
  const modMatrix: ModRouting[] = Array.isArray(rawMatrix)
    ? rawMatrix.map((r: any) => ({
        source: String(r.source || ''),
        target: String(r.target || ''),
        amount: clamp(r.amount, 0, 1),
        lfoRate: r.lfoRate !== undefined ? clamp(r.lfoRate, 0, 20) : undefined,
        lfoDepth: r.lfoDepth !== undefined ? clamp(r.lfoDepth, 0, 1) : undefined,
      }))
    : [];

  return {
    text,
    waveform,
    oscSettings,
    adsrVCF,
    adsrVCA,
    knobs,
    modMatrix,
  };
}
