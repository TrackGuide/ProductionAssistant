// services/patchGuideServiceOptimized.ts
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

// ✅ Concise, focused prompt generation
const generatePrompt = (inputs: PatchGuideInputs, synthConfig: any): string => {
  const { description, synth, genre, voiceType, notes } = inputs;
  
  return `You are a professional synthesizer programmer. Create a detailed patch guide for these specifications:

**Target Sound:**
- Synth: ${synth}
- Genre: ${genre}
- Voice Type: ${voiceType}
- Description: ${description}
${notes ? `- Additional Notes: ${notes}` : ''}

**Required JSON Response Format:**
{
  "text": "Step-by-step patch instructions in markdown format",
  "oscillators": [
    {
      "name": "Osc 1",
      "values": {
        "Waveform": "Sawtooth",
        "Coarse": 0,
        "Fine": 0,
        "Level": 0.8
      }
    }
  ],
  "filter": {
    "selectedType": "Lowpass",
    "cutoff": 0.6,
    "resonance": 0.3
  },
  "adsrVCF": {
    "attack": 0.1,
    "decay": 0.5,
    "sustain": 0.7,
    "release": 1.2
  },
  "adsrVCA": {
    "attack": 0.05,
    "decay": 0.3,
    "sustain": 0.9,
    "release": 0.8
  },
  "summary": "• Bullet point creative tips\\n• Performance suggestions\\n• Modulation ideas"
}

**Guidelines:**
- Use only parameters available in the synth config
- Set musically appropriate values for the genre and voice type
- Provide 5-7 creative tips in bullet format
- Include specific parameter values and ranges
- Focus on practical, actionable advice

**Synth Configuration:**
${JSON.stringify(synthConfig, null, 2)}

Return only valid JSON without code blocks or explanations.`;
};

// ✅ Robust JSON parsing with better error handling
const parseAIResponse = (responseText: string): any => {
  if (!responseText?.trim()) {
    throw new Error('Empty response from AI');
  }

  let jsonText = responseText.trim();
  
  // Remove code blocks if present
  const codeBlockMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonText = codeBlockMatch[1].trim();
  }

  try {
    const parsed = JSON.parse(jsonText);
    
    // Basic validation
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Response is not a valid object');
    }

    return parsed;
  } catch (error) {
    console.error('JSON Parse Error:', error);
    console.error('Raw Response:', responseText.slice(0, 500));
    throw new Error(`Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
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
      cutoff: typeof filter.cutoff === 'number' ? Math.max(0, Math.min(1, filter.cutoff)) : 0.5,
      resonance: typeof filter.resonance === 'number' ? Math.max(0, Math.min(1, filter.resonance)) : 0.3
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

    const parsed = parseAIResponse(responseText);
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
