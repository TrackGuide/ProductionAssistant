// services/patchGuideService.ts
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { GEMINI_MODEL_NAME } from '../constants';
import synthConfigsJson from '../components/synthconfigs.json';

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
  parameter?: string;
  amount: number;
  lfoRate?: number;
  lfoDepth?: number;
  lfoWaveform?: string;
  lfoFrequency?: number;
}

export interface PatchGuideResult {
  text: string;
  waveform?: string;
  oscSettings: OscSettings;
  adsrVCF: ADSR;
  adsrVCA: ADSR;
  knobs: Record<string, number>;
  modMatrix: ModRouting[];
  synthConfig: any;
  summary?: string;
  envelopes?: any;
}

interface PatchGuideInputs {
  description: string;
  synth: string;
  voiceType?: string;
  genre?: string;
  notes?: string;
}

const synthConfigs = synthConfigsJson as Record<string, any>;

const SYNTH_KEY_MAP: Record<string, string> = {
  'serum': 'Xfer Serum',
  'vital': 'Vital',
  'pigments': 'Pigments',
  'massive': 'Native Instruments Massive',
  'massivex': 'Native Instruments Massive X',
  'diva': 'Diva',
  'hive2': 'Hive 2',
  'sylenth1': 'Sylenth1',
  'wavestate': 'Korg Wavestate',
  'jupiter8': 'Roland Jupiter-8',
  'juno106': 'Roland Juno-106',
  'sh101': 'Roland SH-101',
  'operator': 'Ableton Operator',
  'wavetable': 'Ableton Wavetable',
  'retrosynth': 'Apple Retro Synth',
  'alchemy': 'Apple Alchemy',
  'fm8': 'Native Instruments FM8',
  'phaseplant': 'Kilohearts Phase Plant',
  'omnisphere': 'Omnisphere',
  'analoglab': 'Arturia Analog Lab',
  'generic': 'Generic Synth',
  'tal-u-no-lx': 'TAL TAL-U-No-LX',
  'repro5': 'u-he Repro-5',
  'repro1': 'u-he Repro-1',
  'monark': 'Native Instruments Monark',
  'bazille': 'Bazille',
  'zebra2': 'Zebra2',
  'polybrute': 'Arturia PolyBrute',
  'minimoog': 'Moog Minimoog',
  'ob-xd': 'DiscoDSP OB-Xd',
  'ms20': 'Korg MS-20'
};

export async function generateSynthPatchGuide(
  inputs: PatchGuideInputs
): Promise<PatchGuideResult> {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY);

  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY or VITE_GEMINI_API_KEY');
  }

  let synthConfig: any = null;
  try {
    const synthKey = (inputs.synth || 'Generic').replace(/\s+/g, '').replace(/-/g, '').replace(/\./g, '').toLowerCase();
    let synthName = SYNTH_KEY_MAP[synthKey] || inputs.synth || 'Generic Synth';
    synthConfig = synthConfigs[synthName] || synthConfigs['Generic'] || synthConfigs['Generic Synth'];
    if (!synthConfig) throw new Error(`Could not load synth config for requested synth.`);
  } catch (err) {
    console.error('Failed to load synth config:', err);
    throw new Error('Could not load synth config.');
  }

  const prompt = `
You are an expert sound designer. Given the user description and synthConfig, return JSON with:

- text (string): a creative patch description
- oscillators (array): for each oscillator: name, Waveform, Coarse or Octave (if Sub), Fine, Level in dB
- filter: cutoff in Hz, resonance (0–1), slope dB/oct
- adsrVCF & adsrVCA: attack, decay, sustain, release — in ms or % where relevant
- envelopes: for UI display
- knobs: Cutoff, Resonance, Drive, Mix, Reverb, DelayTime, DelayFB, ChorusDepth, ChorusRate, MasterTune (0–1)
- effects: select 2–4 musically useful effects with full parameter set (Hz, ms, %, or note values if tempo-synced)
- modMatrix: 3–5 musically useful routings — skip "Env → Cutoff" — source, target, parameter, amount, LFO details if relevant
- summary: 5–7 creative tips

Synth Configuration:
${JSON.stringify(synthConfig, null, 2)}

User Inputs:
- Genre: ${inputs.genre || 'None'}
- Voice Type: ${inputs.voiceType || 'None'}
- Description: ${inputs.description || 'None'}
- Notes: ${inputs.notes || 'None'}

ONLY RETURN JSON — do not return markdown or prose.
  `.trim();

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

  const requiredFields = ['text', 'waveform', 'oscillators', 'filter', 'adsrVCF', 'adsrVCA', 'envelopes', 'knobs', 'effects', 'modMatrix', 'summary'];
  requiredFields.forEach(field => {
    if (!(field in parsed)) {
      parsed[field] =
        field === 'oscillators' ? [] :
        field === 'effects' ? [] :
        field === 'modMatrix' ? [] :
        field === 'knobs' ? {} :
        field === 'summary' ? '' :
        { attack: 50, decay: 100, sustain: 0.8, release: 200 };
    }
  });

  parsed.modMatrix = Array.isArray(parsed.modMatrix)
    ? parsed.modMatrix.filter((row: any) =>
        !(row.source === 'Env' && row.parameter && row.parameter.toLowerCase().includes('cutoff'))
      )
    : [];

  return {
    text: parsed.text,
    waveform: parsed.waveform,
    oscSettings: {}, // legacy fallback — using oscillators now
    adsrVCF: parsed.adsrVCF,
    adsrVCA: parsed.adsrVCA,
    knobs: parsed.knobs,
    modMatrix: parsed.modMatrix,
    synthConfig: synthConfig,
    summary: parsed.summary,
    envelopes: parsed.envelopes
  };
}