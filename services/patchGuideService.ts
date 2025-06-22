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
  synthConfig: any; // Add synthConfig for dynamic frontend rendering
  relevantEffects: any[]; // Add relevantEffects for contextual UI rendering
  relevantFilterParams: string[]; // Add relevantFilterParams for contextual UI rendering
}

interface PatchGuideInputs {
  description: string;
  synth: string;
  voiceType?: string;
  descriptor?: string;
  genre?: string;
  notes?: string;
}

// Use type assertion for imported JSON to allow string indexing
const synthConfigs = synthConfigsJson as Record<string, any>;

// Map of normalized synth keys to company-prefixed names for robust lookup
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

  // Load synth config
  let synthConfig: any = null;
  try {
    // Normalize synth name for lookup
    const synthKey = (inputs.synth || 'Generic').replace(/\s+/g, '').replace(/-/g, '').replace(/\./g, '').toLowerCase();
    // Use company-prefixed name for lookup
    const synthName = SYNTH_KEY_MAP[synthKey] || inputs.synth || 'Generic Synth';
    synthConfig = synthConfigs[synthName] || synthConfigs['Generic'] || synthConfigs['Generic Synth'];
    if (!synthConfig) throw new Error('Could not load synth config for requested synth or generic fallback.');
  } catch (err) {
    // Debug: log error
    console.error('Failed to load synth config:', err);
    // If synth config not found, fallback to Generic or Generic Synth
    try {
      synthConfig = synthConfigs['Generic'] || synthConfigs['Generic Synth'];
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

  // --- Refinement: Contextual parameter selection and suggestions ---
  // Use keywords from the patch description and genre to select relevant parameters and effects
  function getRelevantParamsAndEffects(desc: string, genre: string, config: any) {
    const keywords = (desc + ' ' + genre).toLowerCase();
    const effectMap: Record<string, string[]> = {
      // --- GENRE/SUBCATEGORY ---
      'techno': ['Drive', 'Resonance', 'Delay', 'Reverb', 'Filter'],
      'house': ['Reverb', 'Chorus', 'Delay', 'Filter'],
      'trance': ['Reverb', 'Delay', 'Filter', 'Resonance'],
      'dubstep': ['LFO', 'Filter', 'Drive', 'Distortion'],
      'drum & bass': ['Filter', 'Drive', 'Envelope', 'LFO'],
      'idm': ['Glitch', 'Delay', 'Reverb', 'Filter'],
      'ambient': ['Reverb', 'Delay', 'Chorus', 'Envelope'],
      'synthwave': ['Chorus', 'Reverb', 'Delay', 'Drive'],
      'lofi': ['Noise', 'Chorus', 'Reverb', 'Filter'],
      'glitch': ['Glitch', 'LFO', 'Envelope'],
      'rock': ['Drive', 'Filter', 'Reverb'],
      'pop': ['Reverb', 'Delay', 'Chorus'],
      'funk': ['Envelope', 'Filter', 'Drive'],
      'jazz': ['Chorus', 'Reverb', 'Envelope'],
      'cinematic': ['Reverb', 'Delay', 'Envelope', 'Filter'],
      // --- PATCH STYLE ---
      'lead': ['Filter', 'Envelope', 'Reverb', 'Delay'],
      'pad': ['Reverb', 'Chorus', 'Envelope', 'Filter'],
      'bass': ['Drive', 'Filter', 'Envelope'],
      'pluck': ['Envelope', 'Filter', 'Delay'],
      'bell': ['Envelope', 'Reverb', 'Delay'],
      'arp': ['Envelope', 'Delay', 'Filter'],
      'fx': ['LFO', 'Envelope', 'Filter', 'Reverb'],
      'drone': ['Envelope', 'Filter', 'Reverb'],
      'texture': ['Envelope', 'Reverb', 'Chorus'],
      'atmosphere': ['Reverb', 'Envelope', 'Filter'],
      // --- TIMBRE/CHARACTER ---
      'glassy': ['Chorus', 'Envelope'],
      'warm': ['Drive', 'Filter'],
      'bright': ['Filter', 'Resonance'],
      'dark': ['Filter', 'Envelope'],
      'metallic': ['Chorus', 'Envelope'],
      'raspy': ['Drive', 'Envelope'],
      'smooth': ['Chorus', 'Reverb'],
      'gritty': ['Drive', 'Distortion'],
      'distorted': ['Drive', 'Distortion'],
      'clean': ['Envelope', 'Filter'],
      'resonant': ['Resonance', 'Filter'],
      'noisy': ['Noise', 'Envelope'],
      // --- MOVEMENT/EVO ---
      'evolving': ['LFO', 'Envelope', 'Filter'],
      'swells': ['Envelope', 'Reverb'],
      'pulsing': ['LFO', 'Envelope'],
      'rhythmic': ['LFO', 'Envelope'],
      'sweeping': ['LFO', 'Filter'],
      'morphing': ['LFO', 'Envelope'],
      'glitchy': ['Glitch', 'LFO'],
      'phasing': ['Chorus', 'LFO'],
      // --- EMOTION/MOOD ---
      'dreamy': ['Reverb', 'Chorus'],
      'aggressive': ['Drive', 'Distortion', 'Resonance'],
      'melancholic': ['Reverb', 'Envelope'],
      'uplifting': ['Reverb', 'Delay'],
      'eerie': ['Envelope', 'Filter'],
      'serene': ['Reverb', 'Envelope'],
      'tense': ['Envelope', 'Filter'],
      'playful': ['Envelope', 'Delay'],
      'mysterious': ['Envelope', 'Filter'],
      'epic': ['Reverb', 'Delay'],
      'brooding': ['Envelope', 'Filter'],
      'anxious': ['Envelope', 'Filter'],
      'joyful': ['Envelope', 'Reverb'],
      'haunting': ['Envelope', 'Reverb'],
      // --- ERA/STYLE ---
      'vintage': ['Chorus', 'Reverb'],
      'modern': ['Delay', 'Reverb'],
      '80s': ['Chorus', 'Reverb'],
      '90s': ['Delay', 'Reverb'],
      'futuristic': ['LFO', 'Envelope'],
      'retro': ['Chorus', 'Reverb'],
      // --- INSPIRATION/CONCEPT ---
      'cosmic': ['Reverb', 'Envelope'],
      'underwater': ['Chorus', 'Envelope'],
      'robotic': ['LFO', 'Envelope'],
      'alien': ['LFO', 'Envelope'],
      'nature': ['Envelope', 'Reverb'],
      'industrial': ['Drive', 'Distortion'],
      'organic': ['Envelope', 'Filter'],
      'mechanical': ['LFO', 'Envelope'],
      'spiritual': ['Reverb', 'Envelope'],
      'forest': ['Envelope', 'Reverb'],
      'cave': ['Reverb', 'Envelope'],
      'machine': ['LFO', 'Envelope'],
      'ghost': ['Envelope', 'Reverb'],
      'desert': ['Envelope', 'Reverb'],
      'arctic': ['Envelope', 'Reverb'],
      'volcanic': ['Drive', 'Envelope'],
      // --- DYNAMICS/ENVELOPE SHAPE ---
      'short': ['Envelope'],
      'long': ['Envelope'],
      'percussive': ['Envelope', 'Filter'],
      'sustained': ['Envelope', 'Reverb'],
      'slow attack': ['Envelope'],
      'fast release': ['Envelope'],
      'gated': ['Envelope', 'Filter'],
      'punchy': ['Envelope', 'Filter'],
      'clicky': ['Envelope'],
      'decaying': ['Envelope', 'Filter']
    };
    // --- Multi-keyword, multi-select, weighted mapping ---
    let relevant: string[] = [];
    let weights: Record<string, number> = {};
    // Accept array or string for desc/genre
    const allKeywords = (Array.isArray(desc) ? desc : [desc])
      .concat(Array.isArray(genre) ? genre : [genre])
      .concat(Array.isArray(inputs.notes) ? inputs.notes : [inputs.notes])
      .map(s => (s || '').toLowerCase())
      .join(' ');
    Object.entries(effectMap).forEach(([k, params]) => {
      if (allKeywords.includes(k)) {
        params.forEach(p => {
          weights[p] = (weights[p] || 0) + 1;
          relevant.push(p);
        });
      }
    });
    // Always include Cutoff/Resonance if present
    if (config.filters?.[0]?.params) {
      if (!relevant.includes('Cutoff')) relevant.push('Cutoff');
      if (!relevant.includes('Resonance')) relevant.push('Resonance');
    }
    // Only keep unique
    relevant = [...new Set(relevant)];
    // Sort by weight (most relevant first)
    relevant.sort((a, b) => (weights[b] || 0) - (weights[a] || 0));
    // Filter effects
    const relevantEffects = config.effects?.filter((fx: any) => relevant.includes(fx.name)) || config.effects;
    // Filter filter params
    const relevantFilterParams = config.filters?.[0]?.params?.filter((p: string) => relevant.includes(p)) || config.filters?.[0]?.params;
    return { relevantEffects, relevantFilterParams, weights };
  }

  const desc = inputs.description || '';
  const genre = inputs.genre || '';
  const { relevantEffects, relevantFilterParams } = getRelevantParamsAndEffects(desc, genre, synthConfig);

  return {
    text,
    waveform,
    oscSettings,
    adsrVCF,
    adsrVCA,
    knobs,
    modMatrix,
    modMatrixMarkdown,
    synthConfig,
    relevantEffects,
    relevantFilterParams
  };
}
