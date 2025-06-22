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
- oscSettings (object): For each oscillator, select and fill actual values for all parameters (waveform, octave, coarse, fine, level) based on the genre, synth, and description. Do NOT leave any value blank or generic.
- filter (object): Select ONE filter type from the synth config, and provide cutoff, resonance, and slope values, all musically appropriate for the patch.
- adsrVCF (object): Envelope settings for the filter, tailored to the patch style.
- adsrVCA (object): Envelope settings for the amp, tailored to the patch style.
- knobs (object): All knob values (Cutoff, Resonance, Drive, Mix, Reverb, DelayTime, DelayFB, ChorusDepth, ChorusRate, MasterTune) between 0.0 and 1.0, set to musically useful defaults for the genre and description.
- effects (array): List ONLY the 1–2 most musically relevant effects for this patch, with detailed settings for each (e.g., "Reverb: Plate, Mix: 0.25, Decay: 2.5s").
- modMatrix (array): ONLY 3–5 musically relevant modulation routings for this patch (not all possible), each as an object with source, target, parameter, and amount. Do NOT list every possible combination. Each routing should be justified by the genre, voice type, or description.
- envelopes (object): Provide envelope data for visuals (labels, values).
- summary (string): At the end, provide a short paragraph summarizing the most important considerations and creative tips for this patch, based on the above choices.

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

Return JSON only. Do NOT include markdown or explanations. All fields must be present and filled with contextually relevant values. Do NOT list all possible routings or effects—only those that are musically relevant for the patch described.`;

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
  if (synthConfig.oscillators && synthConfig.oscillators.length > 0) {
    const fallbackWaveforms = ['Saw', 'Square', 'Sine', 'Triangle'];
    const fallbackOctaves = [0, 1, -1];
    const fallbackLevels = [0.7, 0.8, 1.0];
    synthConfig.oscillators = synthConfig.oscillators.map((osc: any, idx: number) => {
      const values: Record<string, any> = {};
      if (Array.isArray(osc.params)) {
        osc.params.forEach((param: string) => {
          let v = osc.values && osc.values[param];
          if (v === undefined || v === null || v === '—') {
            if (param.toLowerCase().includes('wave')) v = fallbackWaveforms[idx % fallbackWaveforms.length];
            else if (param.toLowerCase().includes('oct')) v = fallbackOctaves[idx % fallbackOctaves.length];
            else if (param.toLowerCase().includes('level')) v = fallbackLevels[idx % fallbackLevels.length];
            else if (param.toLowerCase().includes('coarse')) v = 0;
            else if (param.toLowerCase().includes('fine')) v = 0;
            else v = '—';
          }
          values[param] = v;
        });
      }
      return { ...osc, values };
    });
  }

  // --- Ensure effects have default settings ---
  if (synthConfig.effects && synthConfig.effects.length > 0) {
    synthConfig.effects = synthConfig.effects.map((fx: any) => {
      let v = fx.defaultSetting;
      if (!v || v === '—') {
        if (fx.name.toLowerCase().includes('reverb')) v = '0.15';
        else if (fx.name.toLowerCase().includes('delay')) v = '0.10';
        else if (fx.name.toLowerCase().includes('chorus')) v = '0.20';
        else v = '0.10';
      }
      return { ...fx, defaultSetting: v };
    });
  }

  // --- Clean modMatrix with robust fallback logic and remove envelope routings ---
  let modMatrix: ModRouting[] = Array.isArray(rawMatrix)
    ? rawMatrix.map((r: any) => ({
        source: String(r.source || ''),
        target: String(r.target || ''),
        parameter: r.parameter || '',
        amount: clamp(r.amount, 0, 1),
        lfoRate: r.lfoRate !== undefined ? clamp(r.lfoRate, 0, 20) : undefined,
        lfoDepth: r.lfoDepth !== undefined ? clamp(r.lfoDepth, 0, 1) : undefined,
        lfoShape: r.lfoShape || 'Sine',
        lfoWaveform: r.lfoWaveform || 'Sine',
        lfoFrequency: r.lfoFrequency !== undefined ? clamp(r.lfoFrequency, 0.01, 20) : (r.lfoRate !== undefined ? clamp(r.lfoRate, 0.01, 20) : 2.0),
      }))
    : [];
  // Remove envelope-to-filter and envelope-to-amp routings (robust)
  modMatrix = modMatrix.filter(row => {
    const src = row.source.toLowerCase();
    const tgt = row.target.toLowerCase();
    const param = (row.parameter || '').toLowerCase();
    // Remove Env->Filter (any param) and Env->Amp/Level/Volume
    if (src.includes('env') && (tgt.includes('filter') || tgt.includes('amp') || tgt.includes('vca') || param.includes('cutoff') || param.includes('resonance') || param.includes('level') || param.includes('amp') || param.includes('volume'))) {
      return false;
    }
    return true;
  });
  // Always fill with 3-5 plausible routings if missing or incomplete
  if (!Array.isArray(modMatrix) || modMatrix.length < 3) {
    modMatrix = [
      { source: 'LFO 1', target: 'Oscillator', parameter: 'Pitch', amount: 0.3, lfoRate: 2.5, lfoDepth: 0.2, lfoShape: 'Sine', lfoWaveform: 'Sine', lfoFrequency: 2.5 },
      { source: 'LFO 1', target: 'Filter', parameter: 'Cutoff', amount: 0.2, lfoRate: 1.2, lfoDepth: 0.15, lfoShape: 'Triangle', lfoWaveform: 'Triangle', lfoFrequency: 1.2 },
      { source: 'LFO 2', target: 'Oscillator', parameter: 'Fine Tune', amount: 0.1, lfoRate: 5.0, lfoDepth: 0.05, lfoShape: 'Square', lfoWaveform: 'Square', lfoFrequency: 5.0 },
      { source: 'LFO 1', target: 'Chorus', parameter: 'Rate', amount: 0.15, lfoRate: 0.8, lfoDepth: 0.1, lfoShape: 'Sine', lfoWaveform: 'Sine', lfoFrequency: 0.8 },
    ].slice(0, 4 + Math.floor(Math.random() * 2)); // 3-5 entries
  }
  // Ensure LFO modulations always include shape, waveform, frequency, and rate
  modMatrix = modMatrix.map(row => {
    if (row.source.toLowerCase().includes('lfo')) {
      return {
        ...row,
        lfoShape: row.lfoShape || 'Sine',
        lfoWaveform: row.lfoWaveform || 'Sine',
        lfoFrequency: typeof row.lfoFrequency === 'number' ? row.lfoFrequency : (typeof row.lfoRate === 'number' ? row.lfoRate : 2.0),
        lfoRate: typeof row.lfoRate === 'number' ? row.lfoRate : (typeof row.lfoFrequency === 'number' ? row.lfoFrequency : 2.0),
        lfoDepth: typeof row.lfoDepth === 'number' ? row.lfoDepth : 0.2
      };
    }
    return row;
  });
  // Limit to 5 max
  modMatrix = modMatrix.slice(0, 5);
  // Always set synthConfig.modMatrix for frontend rendering
  synthConfig.modMatrix = modMatrix;

  // --- Filter: select ONE type and provide values for cutoff, resonance, slope ---
  if (synthConfig.filters && synthConfig.filters.length > 0) {
    // Pick the first type as the selected one, or fallback
    const filter = synthConfig.filters[0];
    filter.selectedType = Array.isArray(filter.types) && filter.types.length > 0 ? filter.types[0] : 'Lowpass';
    filter.cutoff = typeof rawFilter.cutoff === 'number' ? clamp(rawFilter.cutoff, 0, 1) : 0.5;
    filter.resonance = typeof rawFilter.resonance === 'number' ? clamp(rawFilter.resonance, 0, 1) : 0.3;
    filter.slope = typeof rawFilter.slope === 'number' ? clamp(rawFilter.slope, 12, 24) : 24;
    synthConfig.filters = [filter];
  }

  // --- Oscillators: always fill with plausible values ---
  if (synthConfig.oscillators && synthConfig.oscillators.length > 0) {
    const fallbackWaveforms = ['Saw', 'Square', 'Sine', 'Triangle'];
    const fallbackOctaves = [0, 1, -1];
    const fallbackLevels = [0.7, 0.8, 1.0];
    synthConfig.oscillators = synthConfig.oscillators.map((osc: any, idx: number) => {
      const values: Record<string, any> = {};
      if (Array.isArray(osc.params)) {
        osc.params.forEach((param: string) => {
          let v = osc.values && osc.values[param];
          if (v === undefined || v === null || v === '—') {
            if (param.toLowerCase().includes('wave')) v = fallbackWaveforms[idx % fallbackWaveforms.length];
            else if (param.toLowerCase().includes('oct')) v = fallbackOctaves[idx % fallbackOctaves.length];
            else if (param.toLowerCase().includes('level')) v = fallbackLevels[idx % fallbackLevels.length];
            else if (param.toLowerCase().includes('coarse')) v = 0;
            else if (param.toLowerCase().includes('fine')) v = 0;
            else v = '—';
          }
          values[param] = v;
        });
      }
      return { ...osc, values };
    });
  }

  // --- Effects: always fill with plausible values ---
  if (synthConfig.effects && synthConfig.effects.length > 0) {
    synthConfig.effects = synthConfig.effects.map((fx: any) => {
      let v = fx.defaultSetting;
      if (!v || v === '—') {
        if (fx.name.toLowerCase().includes('reverb')) v = '0.15';
        else if (fx.name.toLowerCase().includes('delay')) v = '0.10';
        else if (fx.name.toLowerCase().includes('chorus')) v = '0.20';
        else v = '0.10';
      }
      return { ...fx, defaultSetting: v };
    });
  }

  // --- Ensure all fields are present in parsed result ---
  const requiredFields = ['text', 'waveform', 'oscSettings', 'adsrVCF', 'adsrVCA', 'knobs', 'modMatrix', 'synthConfig'];
  requiredFields.forEach(field => {
    if (!(field in parsed)) {
      throw new Error(`Missing field '${field}' in AI response`);
    }
  });

  // Get summary from AI response if present

  // --- Robust Backend Fallbacks (improved) ---
  // Fill all oscillators in the synth config
  if (synthConfig.oscillators && synthConfig.oscillators.length > 0) {
    const fallbackWaveforms = ['Saw', 'Square', 'Sine', 'Triangle'];
    const fallbackOctaves = [0, 1, -1];
    const fallbackLevels = [0.7, 0.8, 1.0];
    synthConfig.oscillators = synthConfig.oscillators.map((osc: any, idx: number) => {
      const values: Record<string, any> = {};
      if (Array.isArray(osc.params)) {
        osc.params.forEach((param: string) => {
          let v = osc.values && osc.values[param];
          if (v === undefined || v === null || v === '—') {
            if (param.toLowerCase().includes('wave')) v = fallbackWaveforms[idx % fallbackWaveforms.length];
            else if (param.toLowerCase().includes('oct')) v = fallbackOctaves[idx % fallbackOctaves.length];
            else if (param.toLowerCase().includes('level')) v = fallbackLevels[idx % fallbackLevels.length];
            else if (param.toLowerCase().includes('coarse')) v = 0;
            else if (param.toLowerCase().includes('fine')) v = 0;
            else v = '—';
          }
          values[param] = v;
        });
      }
      return { ...osc, values };
    });
  }

  // Fill all effects in the synth config
  if (synthConfig.effects && synthConfig.effects.length > 0) {
    synthConfig.effects = synthConfig.effects.map((fx: any) => {
      let v = fx.defaultSetting;
      if (!v || v === '—') {
        if (fx.name.toLowerCase().includes('reverb')) v = '0.15';
        else if (fx.name.toLowerCase().includes('delay')) v = '0.10';
        else if (fx.name.toLowerCase().includes('chorus')) v = '0.20';
        else v = '0.10';
      }
      return { ...fx, defaultSetting: v };
    });
  }

  // Fill all filters in the synth config
  if (synthConfig.filters && synthConfig.filters.length > 0) {
    synthConfig.filters = synthConfig.filters.map((filter: any) => {
      if (!Array.isArray(filter.types) || filter.types.length === 0) filter.types = ['Lowpass'];
      if (!Array.isArray(filter.relevantParams) || filter.relevantParams.length === 0) filter.relevantParams = ['Cutoff', 'Resonance'];
      return filter;
    });
  }

  // Fallbacks for modulation matrix: always set synthConfig.modMatrix
  if (!Array.isArray(parsed.modMatrix) || parsed.modMatrix.length === 0) {
    // Generate 2-3 plausible routings based on synthConfig
    const fallbackMatrix = [];
    if (synthConfig.oscillators && synthConfig.oscillators.length > 0) {
      fallbackMatrix.push({ source: 'Env 1', target: 'Filter', parameter: 'Cutoff', amount: 0.7 });
      fallbackMatrix.push({ source: 'LFO 1', target: 'Oscillator', parameter: 'Pitch', amount: 0.3 });
      if (synthConfig.filters && synthConfig.filters.length > 0) {
        fallbackMatrix.push({ source: 'LFO 1', target: 'Filter', parameter: 'Resonance', amount: 0.2 });
      }
    }
    parsed.modMatrix = fallbackMatrix;
  }
  // Always set synthConfig.modMatrix for frontend rendering
  synthConfig.modMatrix = parsed.modMatrix;

  // Return with improved, limited, and filled data
  // Always ensure synthConfig is present in the return value
  let resultSynthConfig = parsed.synthConfig || synthConfig;
  if (!resultSynthConfig) resultSynthConfig = {};

  return {
    text,
    waveform,
    oscSettings,
    adsrVCF,
    adsrVCA,
    knobs,
    modMatrix,
    synthConfig: resultSynthConfig,
    summary
  };
}
