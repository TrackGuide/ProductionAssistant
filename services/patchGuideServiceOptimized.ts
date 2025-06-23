// services/patchGuideServiceFixed.ts
import { GoogleGenAI } from '@google/genai';
import { GEMINI_MODEL_NAME } from '../constants';
import synthConfigsJson from '../components/synthconfigs.json';

// ✅ Simplified, focused interfaces
export interface PatchGuideInputs {
  description: string;
  synth: string;
  genre: string;
  voiceType: string;
  notes?: string;
}

export interface ADSR {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

export interface PatchGuideResult {
  text: string;
  synthConfig: any;
  adsrVCF: ADSR;
  adsrVCA: ADSR;
  summary: string;
}

// ✅ Simplified synth config access
const synthConfigs = synthConfigsJson as Record<string, any>;

// ✅ Streamlined API key handling
const getApiKey = (): string => {
  const apiKey = 
    process.env.API_KEY ||
    process.env.GEMINI_API_KEY ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY);
  
  if (!apiKey) {
    throw new Error('API key not configured. Set GEMINI_API_KEY or VITE_GEMINI_API_KEY environment variable.');
  }
  
  return apiKey;
};

// ✅ Optimized synth config lookup
const getSynthConfig = (synthName: string): any => {
  // Direct lookup first
  if (synthConfigs[synthName]) {
    return synthConfigs[synthName];
  }
  
  // Fallback to key mapping
  const normalizedKey = synthName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const matchingKey = Object.keys(synthConfigs).find(key => 
    key.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedKey
  );
  
  if (matchingKey) {
    return synthConfigs[matchingKey];
  }
  
  // Generic fallback
  return {
    name: synthName,
    oscillators: [
      { id: "1", name: "Osc 1", params: ["Waveform", "Coarse", "Fine", "Level"] },
      { id: "2", name: "Osc 2", params: ["Waveform", "Coarse", "Fine", "Level"] }
    ],
    filters: [{
      name: "Filter",
      types: ["Lowpass", "Highpass", "Bandpass"],
      parameters: ["Cutoff", "Resonance"]
    }],
    effects: []
  };
};

// ✅ Structured markdown prompt generation
const generatePrompt = (inputs: PatchGuideInputs, synthConfig: any): string => {
  const { description, synth, genre, voiceType, notes } = inputs;
  
  return `You are a professional synthesizer programmer. Create a detailed patch guide for these specifications:

**Target Sound:**
- Synth: ${synth}
- Genre: ${genre}
- Voice Type: ${voiceType}
- Description: ${description}
${notes ? `- Additional Notes: ${notes}` : ''}

**IMPORTANT:** You must respond with EXACTLY this structured markdown format:

## Oscillators:
- Osc 1: Waveform: [type], Coarse: [value], Fine: [value], Level (dB): [value]
- Osc 2: Waveform: [type], Coarse: [value], Fine: [value], Level (dB): [value]
- Sub Osc: Waveform: [type], Octave: [value], Level (dB): [value]

## Filter:
- Type: [filter type]
- Cutoff: [frequency] Hz
- Resonance: [percentage]%

## ADSR Envelopes:
- Filter Envelope: Attack: [time] ms, Decay: [time] ms, Sustain: [percentage]%, Release: [time] ms
- Amp Envelope: Attack: [time] ms, Decay: [time] ms, Sustain: [percentage]%, Release: [time] ms

## Effects:
- Chorus: Rate: [rate] Hz, Depth: [percentage]%, Delay: [time] ms, Feedback: [percentage]%, Mix: [percentage]%
- Delay: Time: [time] ms, Feedback: [percentage]%, Mix: [percentage]%, Tone: [frequency] Hz
- Reverb: Decay: [time] s, PreDelay: [time] ms, Damping: [percentage]%, Size: [percentage]%, HighCut: [frequency] Hz, LowCut: [frequency] Hz, Mix: [percentage]%, Type: [type]

## Modulation Suggestions:
- LFO 1 → Filter Cutoff, Amount: [percentage]%, Rate: [rate] Hz, Waveform: [type]
- Envelope → Oscillator Pitch, Amount: [percentage]%
- Modwheel → Vibrato Depth, Amount: [percentage]%

## Creative Suggestions & Tips:
- [Tip about envelope settings]
- [Tip about LFO modulation]
- [Tip about effect automation]
- [Tip about performance techniques]
- [Tip about layering or doubling]
- [Tip about register-specific adjustments]
- [Tip about dynamic modulation]

**Guidelines:**
- Use specific numeric values (frequencies in Hz, times in ms/s, percentages with %)
- Include 2-3 oscillators appropriate for the sound type
- Suggest realistic modulation amounts and rates
- Provide 6-8 actionable creative tips
- Focus on the ${genre} genre and ${voiceType} voice type characteristics
- Make all parameter values musically appropriate

**Available Synth Parameters:**
${JSON.stringify(synthConfig, null, 2)}

Respond ONLY with the structured markdown format above. Do not include JSON, code blocks, or explanatory text.`;
};

// ✅ Parse markdown response and extract structured data
const parseMarkdownResponse = (responseText: string): any => {
  if (!responseText?.trim()) {
    throw new Error('Empty response from AI');
  }

  const cleanText = responseText.trim();
  
  // Parse ADSR values from the text
  const parseADSR = (section: string, label: string): ADSR => {
    const regex = new RegExp(`${label}[^:]*: Attack: (\\d+(?:\\.\\d+)?)\\s*ms, Decay: (\\d+(?:\\.\\d+)?)\\s*ms, Sustain: (\\d+(?:\\.\\d+)?)%, Release: (\\d+(?:\\.\\d+)?)\\s*ms`);
    const match = section.match(regex);
    
    if (match) {
      return {
        attack: parseFloat(match[1]) / 1000, // Convert ms to seconds
        decay: parseFloat(match[2]) / 1000,
        sustain: parseFloat(match[3]) / 100, // Convert percentage to decimal
        release: parseFloat(match[4]) / 1000
      };
    }
    
    // Fallback defaults
    return label === 'Amp Envelope' 
      ? { attack: 0.05, decay: 0.3, sustain: 0.9, release: 0.8 }
      : { attack: 0.1, decay: 0.5, sustain: 0.7, release: 1.2 };
  };

  // Extract oscillator data
  const extractOscillators = (): any[] => {
    const oscSection = cleanText.match(/## Oscillators:(.*?)## Filter:/s);
    if (!oscSection) return [];
    
    const oscLines = oscSection[1].split('\n').filter(line => line.trim().startsWith('-'));
    return oscLines.map((line, idx) => {
      const name = line.match(/- (.*?):/)?.[1] || `Oscillator ${idx + 1}`;
      
      // Extract parameter values using regex
      const waveform = line.match(/Waveform: ([^,]+)/)?.[1]?.trim() || 'Sawtooth';
      const coarse = line.match(/Coarse: ([^,]+)/)?.[1]?.trim() || '0';
      const fine = line.match(/Fine: ([^,]+)/)?.[1]?.trim() || '0';
      const level = line.match(/Level[^:]*: ([^,\n]+)/)?.[1]?.trim() || '0';
      
      return {
        name,
        id: String(idx + 1),
        values: { Waveform: waveform, Coarse: coarse, Fine: fine, Level: level }
      };
    });
  };

  // Extract filter data
  const extractFilter = (): any => {
    const filterSection = cleanText.match(/## Filter:(.*?)## ADSR Envelopes:/s);
    if (!filterSection) return { selectedType: 'Lowpass', cutoff: '5000 Hz', resonance: '30%' };
    
    const typeMatch = filterSection[1].match(/Type: ([^\n]+)/);
    const cutoffMatch = filterSection[1].match(/Cutoff: ([^\n]+)/);
    const resonanceMatch = filterSection[1].match(/Resonance: ([^\n]+)/);
    
    return {
      selectedType: typeMatch?.[1]?.trim() || 'Lowpass',
      cutoff: cutoffMatch?.[1]?.trim() || '5000 Hz',
      resonance: resonanceMatch?.[1]?.trim() || '30%'
    };
  };

  return {
    text: cleanText,
    oscillators: extractOscillators(),
    filter: extractFilter(),
    adsrVCF: parseADSR(cleanText, 'Filter Envelope'),
    adsrVCA: parseADSR(cleanText, 'Amp Envelope'),
    summary: cleanText.includes('## Creative Suggestions & Tips:') 
      ? cleanText.split('## Creative Suggestions & Tips:')[1].trim()
      : 'No creative tips provided'
  };
};

// ✅ Safe value extraction with defaults
const extractPatchData = (parsed: any, synthConfig: any): PatchGuideResult => {
  // Safe ADSR extraction
  const extractADSR = (adsrData: any, fallback: ADSR): ADSR => {
    if (!adsrData || typeof adsrData !== 'object') return fallback;
    
    return {
      attack: typeof adsrData.attack === 'number' ? Math.max(0.01, Math.min(10, adsrData.attack)) : fallback.attack,
      decay: typeof adsrData.decay === 'number' ? Math.max(0.01, Math.min(10, adsrData.decay)) : fallback.decay,
      sustain: typeof adsrData.sustain === 'number' ? Math.max(0, Math.min(1, adsrData.sustain)) : fallback.sustain,
      release: typeof adsrData.release === 'number' ? Math.max(0.01, Math.min(10, adsrData.release)) : fallback.release
    };
  };

  // Safe oscillator extraction
  const extractOscillators = (): any[] => {
    if (!Array.isArray(parsed.oscillators)) return [];
    
    return parsed.oscillators.map((osc: any, idx: number) => ({
      name: osc.name || `Oscillator ${idx + 1}`,
      id: String(idx + 1),
      values: osc.values || {}
    }));
  };

  // Safe filter extraction
  const extractFilter = (): any => {
    const filter = parsed.filter || {};
    return {
      name: "Filter",
      selectedType: filter.selectedType || "Lowpass",
      cutoff: filter.cutoff || "5000 Hz",
      resonance: filter.resonance || "30%"
    };
  };

  return {
    text: typeof parsed.text === 'string' ? parsed.text : 'No instructions provided',
    synthConfig: {
      ...synthConfig,
      oscillators: extractOscillators(),
      filters: [extractFilter()]
    },
    adsrVCF: extractADSR(parsed.adsrVCF, { attack: 0.1, decay: 0.5, sustain: 0.7, release: 1.2 }),
    adsrVCA: extractADSR(parsed.adsrVCA, { attack: 0.05, decay: 0.3, sustain: 0.9, release: 0.8 }),
    summary: typeof parsed.summary === 'string' ? parsed.summary : 'No creative tips provided'
  };
};

// ✅ Main optimized function
export const generateSynthPatchGuideOptimized = async (inputs: PatchGuideInputs): Promise<PatchGuideResult> => {
  if (!inputs.description || !inputs.synth || !inputs.genre || !inputs.voiceType) {
    throw new Error('Missing required fields: description, synth, genre, and voiceType are required');
  }

  try {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });
    
    const synthConfig = getSynthConfig(inputs.synth);
    const prompt = generatePrompt(inputs, synthConfig);
    
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: prompt
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('No response received from AI');
    }

    const parsed = parseMarkdownResponse(responseText);
    const result = extractPatchData(parsed, synthConfig);
    
    return result;

  } catch (error) {
    console.error('PatchGuide Generation Error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        throw new Error('Invalid API key configuration. Please check your environment variables.');
      }
      if (error.message.includes('quota') || error.message.includes('rate limit')) {
        throw new Error('API quota exceeded. Please try again later.');
      }
      throw error;
    }
    
    throw new Error('Unknown error occurred while generating patch guide');
  }
};

// ✅ Backward compatibility wrapper
export const generateSynthPatchGuide = generateSynthPatchGuideOptimized;
