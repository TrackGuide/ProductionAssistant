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
  parameter?: string;
  lfoRate?: number;
  lfoDepth?: number;
  lfoShape?: string;
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
  synthConfig: any; // Add synthConfig for dynamic frontend rendering
  summary?: string; // Add summary for creative tips
  envelopes?: any; // Add envelope visuals for frontend
}

interface PatchGuideInputs {
  description: string;
  synth: string;
  voiceType?: string;
  descriptor?: string;
  genre?: string;
  notes?: string;
  era?: string;
  concept?: string;
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
    let synthName = SYNTH_KEY_MAP[synthKey] || inputs.synth || 'Generic Synth';
    // Try direct match, then fallback to 'Generic', then 'Generic Synth'
    synthConfig = synthConfigs[synthName] || synthConfigs['Generic'] || synthConfigs['Generic Synth'];
    if (!synthConfig) {
      // Try alternate fallback keys
      if (synthConfigs['Generic Synth']) synthConfig = synthConfigs['Generic Synth'];
      else if (synthConfigs['Generic']) synthConfig = synthConfigs['Generic'];
    }
    if (!synthConfig) throw new Error(`Could not load synth config for requested synth (${inputs.synth}) or generic fallback. Checked keys: ${synthName}, Generic, Generic Synth`);
  } catch (err) {
    // Debug: log error
    console.error('Failed to load synth config:', err);
    throw new Error('Could not load synth config for requested synth or generic fallback.');
  }

  // --- Ensure synthConfig arrays for robust frontend rendering ---
  if (!Array.isArray(synthConfig.oscillators)) synthConfig.oscillators = [];
  if (!Array.isArray(synthConfig.filters)) synthConfig.filters = [];
  if (!Array.isArray(synthConfig.effects)) synthConfig.effects = [];
  if (!Array.isArray(synthConfig.modSources)) synthConfig.modSources = [];
  if (!Array.isArray(synthConfig.modDestinations)) synthConfig.modDestinations = [];

  // --- Stronger Prompt: Force AI to select and fill values, and limit outputs ---
  const prompt = `
You are an expert sound designer. Given the following user inputs and synth configuration, return a JSON object with:
- text (string): A concise, genre- and voice-type-specific patch description.
- waveform (string): The main oscillator waveform.
- oscSettings (object): For each oscillator, select and fill actual values for ALL parameters (including waveform, coarse, fine, level, and any others in the synthConfig) based on the genre, synth, and description. Do NOT leave any value blank or generic. Use only values that are valid for the synthConfig. Example: { o1Wave: 'Saw', o1Coarse: 0, o1Fine: 0, o1Level: 1.0, ... }
- filter (object): Select ONE filter type from the synth config (from filter.types), and provide cutoff, resonance, and slope values, all musically appropriate for the patch. Do NOT leave any value blank or generic. Example: { type: 'Lowpass', cutoff: 0.5, resonance: 0.3, slope: 24 }
- adsrVCF (object): Envelope settings for the filter, tailored to the patch style.
- adsrVCA (object): Envelope settings for the amp, tailored to the patch style.
- knobs (object): All knob values (Cutoff, Resonance, Drive, Mix, Reverb, DelayTime, DelayFB, ChorusDepth, ChorusRate, MasterTune) between 0.0 and 1.0, set to musically useful defaults for the genre and description. Include these for knob visuals.
- envelopes (object): Provide envelope data for visuals (labels, values) for both VCF and VCA envelopes.
- effects (array): List ONLY the 1–2 most musically relevant effects for this patch. For each effect, use only effects that exist in the synthConfig.effects array. For each effect, provide an object with the effect name and a value for EVERY parameter listed in that effect's 'parameters' array in synthConfig. Do NOT use generic or default settings. For time-based parameters (such as 'Time' or 'Delay Time'), if the effect is synced to the global BPM, use a note value (e.g., '1/4 note', '1/8 dotted'). If not synced, use a value in Hz or ms as appropriate. All effect parameters must be contextually filled and musically appropriate for the patch and synth.
- modMatrix (array, optional): ONLY include this field if the synth supports modulation routing (i.e., has modSources and modDestinations) AND the patch context (genre, voice type, or description) makes modulation musically relevant. If included, provide ONLY 3–5 musically relevant modulation routings for this patch, each as an object with source, target, parameter, amount, lfoWaveform (if LFO is used), lfoRate, lfoDepth, lfoFrequency. Do NOT include lfoShape. Do NOT list every possible combination. Each routing should be justified by the genre, voice type, or description.
- summary (string): At the end, provide a robust, actionable, and inspiring list of 5–7 creative tips and considerations for this patch, as bullet points. Each tip should be musically relevant, detailed, and practical for a producer. Include specific advice for performance, modulation, automation, genre conventions, sound design tricks, and how to further tweak the patch for creative results. If you have any LFO or modulation suggestions that would otherwise be in the mod matrix, include them as tips here as well. Do NOT include a generic summary paragraph—return only a bullet list of tips.

Synth Configuration:
${JSON.stringify(synthConfig, null, 2)}

User Inputs:
- Voice Type: ${inputs.voiceType || 'None'}
- Descriptor: ${inputs.descriptor || 'None'}
- Genre: ${inputs.genre || 'None'}
- Synth: ${inputs.synth}
- Era: ${inputs.era || 'None'}
- Concept: ${inputs.concept || 'None'}
- Character/Mood: ${inputs.description || 'None'}
- Notes: ${inputs.notes || 'None'}

Return JSON only. Do NOT include markdown or explanations. All fields must be present and filled with contextually relevant values. Do NOT list all possible routings or effects—only those that are musically relevant for the patch described. Do NOT include a synthConfig field in your response.`;

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
    filter: rawFilter = {},
    adsrVCF: rawVCF = {},
    adsrVCA: rawVCA = {},
    knobs: rawKnobs = {},
    modMatrix: rawMatrix = [],
    summary = ''
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

  // Clean ADSR with robust fallback logic
  function getMusicalADSR(/*type: 'VCF' | 'VCA', context: any*/): ADSR {
    // Use genre, voiceType, or fallback to classic values
    const genre = (inputs.genre || '').toLowerCase();
    const voiceType = (inputs.voiceType || '').toLowerCase();
    // Defaults: snappy for leads/plucks, slow for pads, medium for others
    if (voiceType.includes('lead') || genre.includes('lead') || genre.includes('pluck')) {
      return { attack: 0.01, decay: 0.15, sustain: 0.7, release: 0.2 };
    } else if (voiceType.includes('pad') || genre.includes('pad') || genre.includes('ambient')) {
      return { attack: 1.0, decay: 2.0, sustain: 0.8, release: 2.5 };
    } else if (voiceType.includes('bass') || genre.includes('bass')) {
      return { attack: 0.02, decay: 0.18, sustain: 0.6, release: 0.15 };
    } else {
      // General musical default
      return { attack: 0.1, decay: 0.5, sustain: 0.8, release: 1.0 };
    }
  }

  // Clean ADSR
  let adsrVCF: ADSR = {
    attack: clamp(rawVCF.attack, 0, 10),
    decay: clamp(rawVCF.decay, 0, 10),
    sustain: clamp(rawVCF.sustain, 0, 1),
    release: clamp(rawVCF.release, 0, 10),
  };
  let adsrVCA: ADSR = {
    attack: clamp(rawVCA.attack, 0, 10),
    decay: clamp(rawVCA.decay, 0, 10),
    sustain: clamp(rawVCA.sustain, 0, 1),
    release: clamp(rawVCA.release, 0, 10),
  };
  // If any value is missing, zero, or not a number, use musical fallback
  function isValidADSR(a: ADSR) {
    return (
      typeof a.attack === 'number' && a.attack > 0 &&
      typeof a.decay === 'number' && a.decay > 0 &&
      typeof a.sustain === 'number' && a.sustain >= 0 && a.sustain <= 1 &&
      typeof a.release === 'number' && a.release > 0
    );
  }
  if (!isValidADSR(adsrVCF)) adsrVCF = getMusicalADSR();
  if (!isValidADSR(adsrVCA)) adsrVCA = getMusicalADSR();

  // --- Ensure all oscillator params have values (fallback to synthConfig or defaults) ---
  if (synthConfig.oscillators && synthConfig.oscillators.length > 0 && parsed.oscSettings) {
    // Use AI-generated oscSettings for each oscillator param
    synthConfig.oscillators = synthConfig.oscillators.map((osc: any, idx: number) => {
      const values: Record<string, any> = {};
      if (Array.isArray(osc.params)) {
        osc.params.forEach((param: string) => {
          // Try to get value from parsed.oscSettings (e.g., o1Coarse, o2Fine, etc.)
          const key = `o${idx + 1}${param}`.replace(/\s+/g, '');
          let v = parsed.oscSettings[key];
          if (v === undefined || v === null) v = '—';
          values[param] = v;
        });
      }
      return { ...osc, values };
    });
  }

  // --- Effects: use only AI-generated effect values, matching synthConfig.effects parameters ---
  if (synthConfig.effects && synthConfig.effects.length > 0 && Array.isArray(parsed.effects)) {
    synthConfig.effects = parsed.effects.map((fx: any) => {
      const synthFx = synthConfig.effects.find((e: any) => e.name === fx.name);
      if (!synthFx || !Array.isArray(synthFx.parameters)) return fx;
      const params: Record<string, any> = {};
      synthFx.parameters.forEach((param: string) => {
        params[param] = fx[param] !== undefined ? fx[param] : '—';
      });
      return { ...fx, parameters: synthFx.parameters, ...params };
    });
  }

  // --- Ensure all fields are present in parsed result ---
  // Add 'envelopes' to requiredFields for visuals
  const requiredFields = ['text', 'waveform', 'oscSettings', 'adsrVCF', 'adsrVCA', 'knobs', 'modMatrix', 'envelopes'];
  requiredFields.forEach(field => {
    if (!(field in parsed)) {
      // Fallbacks for missing fields
      if (field === 'modMatrix') parsed.modMatrix = [];
      else if (field === 'envelopes') parsed.envelopes = { labels: [], values: [] };
      else if (field === 'oscSettings') parsed.oscSettings = {};
      else if (field === 'adsrVCF' || field === 'adsrVCA') parsed[field] = { attack: 0.1, decay: 0.5, sustain: 0.8, release: 1.0 };
      else if (field === 'knobs') parsed.knobs = {};
      else parsed[field] = '';
    }
  });

  // Always use local synthConfig for return value
  let resultSynthConfig = synthConfig || {};

  return {
    text,
    waveform,
    oscSettings,
    adsrVCF,
    adsrVCA,
    knobs,
    modMatrix: parsed.modMatrix,
    synthConfig: resultSynthConfig,
    summary,
    envelopes: parsed.envelopes // ensure envelope visuals are returned
  };
}
