// services/patchGuideService.ts
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { GEMINI_MODEL_NAME } from '../constants';
import fs from 'fs/promises';
import path from 'path';

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
  modMatrixMarkdown: string; // New field for markdown rendering
}

interface PatchGuideInputs {
  description: string;
  synth: string;
  voiceType?: string;
  descriptor?: string;
  genre?: string;
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

function synthNameToFilename(synth: string): string {
  // Remove spaces, hyphens, make case-insensitive, and handle common variants
  return synth.replace(/\s+/g, '').replace(/-/g, '').replace(/\./g, '').toLowerCase();
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

  // Load synth config
  let synthConfig: any = null;
  try {
    // Normalize synth name to match config filenames
    const synthFileMap: Record<string, string> = {
      serum: 'Serum.json',
      vital: 'Vital.json',
      pigments: 'Pigments.json',
      massive: 'Massive.json',
      massivex: 'MassiveX.json',
      diva: 'Diva.json',
      hive2: 'Hive2.json',
      sylenth1: 'Sylenth1.json',
      wavestate: 'Wavestate.json',
      jupiter8: 'Jupiter8.json',
      juno106: 'Juno106.json',
      sh101: 'SH101.json',
      operator: 'Operator.json',
      wavetable: 'Wavetable.json',
      retrosynth: 'RetroSynth.json',
      alchemy: 'Alchemy.json',
      fm8: 'FM8.json',
      phaseplant: 'PhasePlant.json',
      omnisphere: 'Omnisphere.json',
      analoglab: 'AnalogLab.json',
      generic: 'Generic.json',
    };
    const normalized = synthNameToFilename(inputs.synth || 'Generic');
    const synthConfigFile = synthFileMap[normalized] || 'Generic.json';

    // Debug: log normalized synth and config file
    console.log('Requested synth:', inputs.synth, 'Normalized:', normalized, 'Config file:', synthConfigFile);
    // Use process.cwd() instead of __dirname for compatibility
    const synthConfigPath = path.join(process.cwd(), 'synthconfigs', synthConfigFile);
    const synthConfigRaw = await fs.readFile(synthConfigPath, 'utf-8');
    synthConfig = JSON.parse(synthConfigRaw);
  } catch (err) {
    // Debug: log error
    console.error('Failed to load synth config:', err);
    // If synth config not found, fallback to Generic.json
    try {
      const genericPath = path.join(process.cwd(), 'synthconfigs', 'Generic.json');
      const genericRaw = await fs.readFile(genericPath, 'utf-8');
      synthConfig = JSON.parse(genericRaw);
    } catch (e) {
      throw new Error('Could not load synth config for requested synth or generic fallback.');
    }
  }

  const prompt = `
You are an expert sound designer. Given these inputs and the following synth configuration, return a JSON object with:
- text (string)
- waveform (string)
- oscSettings (object)
- adsrVCF (object)
- adsrVCA (object)
- knobs (object)
- modMatrix (array)

Synth Configuration:
${JSON.stringify(synthConfig, null, 2)}

Use these exact knob keys with values between 0.0 and 1.0:
Cutoff, Resonance, Drive, Mix, Reverb, DelayTime, DelayFB, ChorusDepth, ChorusRate, MasterTune

Ensure oscSettings use numeric values.
ADS R blocks must be numeric.
Return JSON only.

Inputs:
- Voice Type: ${inputs.voiceType || 'None'}
- Descriptor: ${inputs.descriptor || 'None'}
- Genre: ${inputs.genre || 'None'}
- Synth: ${inputs.synth}
- Notes: ${inputs.notes || 'None'}
`;

  const ai = new GoogleGenAI({ apiKey });
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: GEMINI_MODEL_NAME,
    contents: prompt
  });

  const raw = (response.text || '').trim();
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const jsonText = fenceMatch ? fenceMatch[1].trim() : raw;

  let parsed: any;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err) {
    throw new Error('Invalid JSON from AI: ' + (err as Error).message + '\nRaw output: ' + raw.slice(0, 300));
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

  // Generate a markdown table for the modulation matrix
  let modMatrixMarkdown = '';
  if (modMatrix.length > 0) {
    modMatrixMarkdown = `| Source | Target | Parameter | Value |\n|--------|--------|-----------|-------|\n`;
    modMatrix.forEach(row => {
      // Show LFO Rate/Depth if present, otherwise show Amount
      let param = '';
      let value = '';
      if (row.lfoRate !== undefined) {
        param = 'LFO Rate';
        value = row.lfoRate.toString();
      } else if (row.lfoDepth !== undefined) {
        param = 'LFO Depth';
        value = row.lfoDepth.toString();
      } else {
        param = 'Amount';
        value = row.amount.toString();
      }
      modMatrixMarkdown += `| ${row.source} | ${row.target} | ${param} | ${value} |\n`;
    });
  } else {
    modMatrixMarkdown = 'No modulation matrix entries.';
  }

  return {
    text,
    waveform,
    oscSettings,
    adsrVCF,
    adsrVCA,
    knobs,
    modMatrix,
    modMatrixMarkdown // <-- new field for markdown rendering
  };
}
