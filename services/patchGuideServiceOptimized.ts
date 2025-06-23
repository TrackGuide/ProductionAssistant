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

// ✅ Structured markdown prompt generation with improved user-friendly layout
const generatePrompt = (inputs: PatchGuideInputs, synthConfig: any): string => {
  const { description, synth, genre, voiceType, notes } = inputs;
  
  return `You are a professional synthesizer programmer. Create a detailed patch guide for these specifications:

**Target Sound:**
- Synth: ${synth}
- Genre: ${genre}
- Voice Type: ${voiceType}
- Description: ${description}
${notes ? `- Additional Notes: ${notes}` : ''}

**IMPORTANT:** You must respond with EXACTLY this structured markdown format with clear organization and readability:

## 🎛️ Core Sound Engine

### 🌊 Oscillator Setup
**Primary Oscillator (Osc 1)**
- Waveform: [type] 
- Coarse Tune: [value] semitones
- Fine Tune: [value] cents
- Level: [value] dB

**Secondary Oscillator (Osc 2)**  
- Waveform: [type]
- Coarse Tune: [value] semitones  
- Fine Tune: [value] cents
- Level: [value] dB

**Sub Oscillator**
- Waveform: [type]
- Octave: [value] 
- Level: [value] dB

### 🎚️ Filter Configuration
**Filter Type:** [type] (Lowpass/Highpass/Bandpass)
**Cutoff Frequency:** [frequency] Hz  
**Resonance:** [percentage]%
**Drive/Saturation:** [percentage]%

## ⚡ Dynamic Response

### 📈 Filter Envelope (VCF)
| Parameter | Value | Purpose |
|-----------|--------|---------|
| **Attack** | [time] ms | [brief explanation] |
| **Decay** | [time] ms | [brief explanation] |
| **Sustain** | [percentage]% | [brief explanation] |
| **Release** | [time] ms | [brief explanation] |

### 🔊 Amplitude Envelope (VCA)
| Parameter | Value | Purpose |
|-----------|--------|---------|
| **Attack** | [time] ms | [brief explanation] |
| **Decay** | [time] ms | [brief explanation] |
| **Sustain** | [percentage]% | [brief explanation] |
| **Release** | [time] ms | [brief explanation] |

## 🎭 Effects & Character

### 🌀 Modulation Matrix
**LFO 1 → Filter Cutoff**
- Amount: [percentage]%
- Rate: [rate] Hz  
- Waveform: [type]
- *Purpose:* [explanation]

**Envelope → Oscillator Pitch**
- Amount: [percentage]%
- *Purpose:* [explanation]

**Mod Wheel → Vibrato**
- Amount: [percentage]%
- *Purpose:* [explanation]

### 🎧 Effects Chain
**Chorus**
- Rate: [rate] Hz | Depth: [percentage]% | Mix: [percentage]%

**Delay**  
- Time: [time] ms | Feedback: [percentage]% | Mix: [percentage]%

**Reverb**
- Decay: [time] s | Size: [percentage]% | Mix: [percentage]%

## 🎯 Performance & Production

### 🎹 Playing Techniques
**Velocity Response:**
- [Specific velocity technique advice]

**Expression Control:**
- [Mod wheel, aftertouch, or pedal suggestions]

**Register Considerations:**
- [Low/mid/high register playing advice]

### �️ Mix Integration

**EQ Approach:**
- [Frequency range emphasis/cuts]
- [Specific EQ curve suggestions]

**Compression:**
- [Attack/release settings]
- [Ratio and threshold guidance]

**Spatial Placement:**
- [Stereo positioning advice]
- [Reverb send levels]

### 💡 Creative Variations

**For Softer Passages:**
- [Parameter adjustments for dynamics]

**For Aggressive Sections:**
- [Parameter adjustments for intensity]

**Alternative Textures:**
- [Quick parameter tweaks for variation]

**Guidelines:**
- Use specific numeric values with units (Hz, ms, %, dB)
- Include brief explanations for parameter purposes  
- Focus on ${genre} genre characteristics and ${voiceType} voice type
- Make all values musically appropriate and realistic
- Organize information for quick scanning and implementation

**Available Synth Parameters:**
${JSON.stringify(synthConfig, null, 2)}

Respond ONLY with the structured markdown format above. Use tables, bullet points, and clear headings for maximum readability.`;
};

// ✅ Parse improved markdown response with tables and better structure
const parseMarkdownResponse = (responseText: string): any => {
  if (!responseText?.trim()) {
    throw new Error('Empty response from AI');
  }

  const cleanText = responseText.trim();
  
  // Parse ADSR values from table format
  const parseADSRFromTable = (section: string, envelopeType: string): ADSR => {
    // Look for table rows with envelope data
    const tableRegex = new RegExp(`### ${envelopeType}[\\s\\S]*?\\| \\*\\*Attack\\*\\* \\| ([\\d.]+) ms[\\s\\S]*?\\| \\*\\*Decay\\*\\* \\| ([\\d.]+) ms[\\s\\S]*?\\| \\*\\*Sustain\\*\\* \\| ([\\d.]+)%[\\s\\S]*?\\| \\*\\*Release\\*\\* \\| ([\\d.]+) ms`, 'i');
    const match = section.match(tableRegex);
    
    if (match) {
      return {
        attack: parseFloat(match[1]) / 1000, // Convert ms to seconds
        decay: parseFloat(match[2]) / 1000,
        sustain: parseFloat(match[3]) / 100, // Convert percentage to decimal
        release: parseFloat(match[4]) / 1000
      };
    }
    
    // Fallback: try simpler format
    const simpleRegex = new RegExp(`${envelopeType}[^:]*:.*?Attack: ([\\d.]+) ms.*?Decay: ([\\d.]+) ms.*?Sustain: ([\\d.]+)%.*?Release: ([\\d.]+) ms`, 'i');
    const simpleMatch = section.match(simpleRegex);
    
    if (simpleMatch) {
      return {
        attack: parseFloat(simpleMatch[1]) / 1000,
        decay: parseFloat(simpleMatch[2]) / 1000,
        sustain: parseFloat(simpleMatch[3]) / 100,
        release: parseFloat(simpleMatch[4]) / 1000
      };
    }
    
    // Fallback defaults based on envelope type
    return envelopeType.includes('Amplitude') || envelopeType.includes('VCA')
      ? { attack: 0.05, decay: 0.3, sustain: 0.9, release: 0.8 }
      : { attack: 0.1, decay: 0.5, sustain: 0.7, release: 1.2 };
  };

  // Extract oscillator data from new format
  const extractOscillators = (): any[] => {
    const oscSection = cleanText.match(/### 🌊 Oscillator Setup(.*?)### 🎚️ Filter Configuration/s);
    if (!oscSection) return [];
    
    const oscillators = [];
    
    // Extract Primary Oscillator
    const primaryMatch = oscSection[1].match(/\*\*Primary Oscillator.*?\*\*.*?- Waveform: ([^\n]+).*?- Coarse Tune: ([^\n]+).*?- Fine Tune: ([^\n]+).*?- Level: ([^\n]+)/s);
    if (primaryMatch) {
      oscillators.push({
        name: 'Primary Oscillator',
        waveform: primaryMatch[1].trim(),
        coarse: primaryMatch[2].trim(),
        fine: primaryMatch[3].trim(),
        level: primaryMatch[4].trim()
      });
    }
    
    // Extract Secondary Oscillator
    const secondaryMatch = oscSection[1].match(/\*\*Secondary Oscillator.*?\*\*.*?- Waveform: ([^\n]+).*?- Coarse Tune: ([^\n]+).*?- Fine Tune: ([^\n]+).*?- Level: ([^\n]+)/s);
    if (secondaryMatch) {
      oscillators.push({
        name: 'Secondary Oscillator',
        waveform: secondaryMatch[1].trim(),
        coarse: secondaryMatch[2].trim(),
        fine: secondaryMatch[3].trim(),
        level: secondaryMatch[4].trim()
      });
    }
    
    return oscillators;
  };

  // Extract filter data from new format
  const extractFilter = (): any => {
    const filterSection = cleanText.match(/### 🎚️ Filter Configuration(.*?)## ⚡ Dynamic Response/s);
    if (!filterSection) return { selectedType: 'Lowpass', cutoff: '5000 Hz', resonance: '30%' };
    
    const typeMatch = filterSection[1].match(/\*\*Filter Type:\*\* ([^\n]+)/);
    const cutoffMatch = filterSection[1].match(/\*\*Cutoff Frequency:\*\* ([^\n]+)/);
    const resonanceMatch = filterSection[1].match(/\*\*Resonance:\*\* ([^\n]+)/);
    
    return {
      selectedType: typeMatch?.[1]?.trim() || 'Lowpass',
      cutoff: cutoffMatch?.[1]?.trim() || '5000 Hz',
      resonance: resonanceMatch?.[1]?.trim() || '30%'
    };
  };

  // Extract effects data from new format
  const extractEffects = (): any => {
    const effectsSection = cleanText.match(/### 🎧 Effects Chain(.*?)## 🎯 Performance & Production/s);
    if (!effectsSection) return {};
    
    const effects: any = {};
    
    // Extract Chorus
    const chorusMatch = effectsSection[1].match(/\*\*Chorus\*\*.*?Rate: ([^|]+) \| Depth: ([^|]+) \| Mix: ([^\n]+)/);
    if (chorusMatch) {
      effects.chorus = {
        rate: chorusMatch[1].trim(),
        depth: chorusMatch[2].trim(),
        mix: chorusMatch[3].trim()
      };
    }
    
    // Extract Delay
    const delayMatch = effectsSection[1].match(/\*\*Delay\*\*.*?Time: ([^|]+) \| Feedback: ([^|]+) \| Mix: ([^\n]+)/);
    if (delayMatch) {
      effects.delay = {
        time: delayMatch[1].trim(),
        feedback: delayMatch[2].trim(),
        mix: delayMatch[3].trim()
      };
    }
    
    // Extract Reverb
    const reverbMatch = effectsSection[1].match(/\*\*Reverb\*\*.*?Decay: ([^|]+) \| Size: ([^|]+) \| Mix: ([^\n]+)/);
    if (reverbMatch) {
      effects.reverb = {
        decay: reverbMatch[1].trim(),
        size: reverbMatch[2].trim(),
        mix: reverbMatch[3].trim()
      };
    }
    
    return effects;
  };

  return {
    text: cleanText,
    synthConfig: { oscillators: extractOscillators(), filter: extractFilter(), effects: extractEffects() },
    adsrVCF: parseADSRFromTable(cleanText, 'Filter Envelope'),
    adsrVCA: parseADSRFromTable(cleanText, 'Amplitude Envelope'),
    summary: cleanText.includes('## � Performance & Production') 
      ? cleanText.split('## 🎯 Performance & Production')[1].trim()
      : cleanText.includes('### 💡 Creative Variations')
      ? cleanText.split('### 💡 Creative Variations')[1].trim()
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
