// services/patchGuideServiceOptimized.ts
import { generateAIResponse } from './geminiService';
import synthConfigsJson from '../components/synthconfigs.json';
import { SYNTHESIS_SCHEMA, SynthesisType } from '../constants/synthesisTypes';
import { getGenreMetadata } from '../constants/genreMetadata';
import { getDawMetadata, suggestPlugins } from '../constants/dawMetadata';

// ✅ Simplified, focused interfaces
export interface PatchGuideInputs {
  description: string;
  synthesisType: SynthesisType;
  synthModel?: string;
  genre: string;
  voiceType: string;
  notes?: string;
  dawName?: string; // Optional DAW selection
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
  const { description, synthesisType, synthModel, genre, voiceType, notes, dawName } = inputs;
  
  // Get genre-specific metadata if available
  const genreMetadata = getGenreMetadata(genre);
  
  // Get DAW-specific metadata if available
  const dawData = dawName ? getDawMetadata(dawName) : undefined;
  
  let prompt = `You are a professional synthesizer programmer. Create a detailed patch guide for these specifications:

**Target Sound:**
- Synthesis Type: ${synthesisType}
${synthModel ? `- Synth Model: ${synthModel}` : ''}
- Genre: ${genre}
- Voice Type: ${voiceType}
- Description: ${description}
${notes ? `- Additional Notes: ${notes}` : ''}
${dawName ? `- DAW: ${dawName}` : ''}`;

  // Add genre-specific information if available
  if (genreMetadata) {
    prompt += '\n\n**Genre Characteristics:**';
    
    if (genreMetadata.tempos) {
      prompt += `\n- Typical Tempo Range: ${genreMetadata.tempos}`;
    }
    
    if (genreMetadata.chordProgressions && genreMetadata.chordProgressions.length > 0) {
      prompt += `\n- Common Chord Progressions: ${genreMetadata.chordProgressions.join(', ')}`;
    }
    
    if (genreMetadata.scalesAndModes) {
      prompt += `\n- Typical Scales/Modes: ${genreMetadata.scalesAndModes}`;
    }
    
    if (genreMetadata.productionTips && genreMetadata.productionTips.length > 0) {
      prompt += `\n- Production Techniques: ${genreMetadata.productionTips.join(', ')}`;
    }
  }

  // Add DAW-specific information if available
  if (dawData) {
    prompt += '\n\n**DAW-Specific Information:**';
    
    if (dawData.workflowTips && dawData.workflowTips.length > 0) {
      prompt += `\n- Workflow Tips: ${dawData.workflowTips.join(', ')}`;
    }
    
    if (dawData.stockPlugins?.Creative && dawData.stockPlugins.Creative.length > 0) {
      prompt += `\n- Suggested Creative Effects: ${dawData.stockPlugins.Creative.join(', ')}`;
    }
    
    if (dawData.suggestedSignalChains?.Synth && dawData.suggestedSignalChains.Synth.length > 0) {
      prompt += `\n- Recommended Signal Chain: ${dawData.suggestedSignalChains.Synth.join(' → ')}`;
    }
  }

  // Add synthesis-type specific parameters if available
  if (synthesisType && SYNTHESIS_SCHEMA[synthesisType as keyof typeof SYNTHESIS_SCHEMA]) {
    prompt += `\n\nGenerate a patch using these ${synthesisType} synthesis parameters:`;
    
    // Get the schema for this synthesis type
    const typeSchema = SYNTHESIS_SCHEMA[synthesisType as keyof typeof SYNTHESIS_SCHEMA];
    Object.entries(typeSchema).forEach(([section, params]) => {
      prompt += `\n\n### ${section.charAt(0).toUpperCase() + section.slice(1)} Parameters`;
      Object.keys(params as object).forEach(param => {
        prompt += `\n- ${param}`;
      });
    });
  }

  // Add model-specific guidance if provided
  if (synthModel) {
    prompt += `\n\nAlso use characteristics of ${synthModel} to further refine the sound.`;
  }
  
  // Add standard response format
  prompt += `

**IMPORTANT:** You must respond with EXACTLY this structured markdown format with clear organization. Use HTML spacing elements where needed for better layout:

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

**Sub Oscillator** (if applicable)

- Waveform: [type]
- Octave: [value] 
- Level: [value] dB

### 🎚️ Filter Configuration

**Filter Type:** [type] (Lowpass/Highpass/Bandpass)

**Cutoff Frequency:** [frequency] Hz  

**Resonance:** [percentage]%

**Drive/Saturation:** [percentage]%

### 📈 Filter Envelope (VCF)

| Parameter | Value | Purpose |
|-----------|-------|---------|
| **Attack** | [time] ms | [brief explanation] |
| **Decay** | [time] ms | [brief explanation] |
| **Sustain** | [percentage]% | [brief explanation] |
| **Release** | [time] ms | [brief explanation] |

### 🔊 Amplitude Envelope (VCA)

| Parameter | Value | Purpose |
|-----------|-------|---------|
| **Attack** | [time] ms | [brief explanation] |
| **Decay** | [time] ms | [brief explanation] |
| **Sustain** | [percentage]% | [brief explanation] |
| **Release** | [time] ms | [brief explanation] |

## 🎭 Effects & Character

### 🌀 Modulation Matrix
  
Include these standard modulation routings:
  
- **LFO 1 → Filter Cutoff**
  - Amount: [percentage]%
  - Rate: [rate] Hz  
  - Waveform: [type]
  - *Purpose:* [explanation]

- **Envelope → Oscillator Pitch**
  - Amount: [percentage]%
  - *Purpose:* [explanation]

- **Mod Wheel → Vibrato**
  - Amount: [percentage]%
  - *Purpose:* [explanation]

Additionally, suggest **1-2 additional** modulation routings tailored to the **${genre}** genre, the **${synthModel || synthesisType}** synth, and the target sound characteristics.

### 🎧 Effects Chain

**Chorus**

- Rate: [rate] Hz | Depth: [percentage]% | Mix: [percentage]%

**Delay**

- Time: [time] ms | Feedback: [percentage]% | Mix: [percentage]%

**Reverb**

- Decay: [time] s | Size: [percentage]% | Mix: [percentage]%
${dawName ? `\n\n**DAW-Specific Creative Effects**\n\n${suggestPlugins(dawName, 'Creative').map(plugin => `- ${plugin}: [suggested settings]`).join('\n')}` : ''}

## 🎯 Performance & Production

### 🎹 Playing Techniques

**Velocity Response:**

- [Specific velocity technique advice]

**Expression Control:**

- [Mod wheel, aftertouch, or pedal suggestions]

**Register Considerations:**

- [Low/mid/high register playing advice]

### 🥁 Rhythm & Percussion Integration 

If this sound could be paired with drums, suggest:

**Complementary Drum Elements:**

- [Specific kick/snare character that pairs well]
- [Hi-hat/cymbal patterns that work with this sound]
- [Other percussion elements that enhance this sound]

### 🎚️ Mix Integration

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
- Format your response with proper spacing between sections
- Use tables and bullet points for clear readability

**Available Synth Parameters:**
${JSON.stringify(synthConfig, null, 2)}

Respond ONLY with the structured markdown format above. Use proper spacing between sections and ensure tables are formatted correctly.`;

  return prompt;
};;

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
        values: {
          Waveform: primaryMatch[1].trim(),
          'Coarse Tune': primaryMatch[2].trim(),
          'Fine Tune': primaryMatch[3].trim(),
          Level: primaryMatch[4].trim()
        }
      });
    }
    
    // Extract Secondary Oscillator
    const secondaryMatch = oscSection[1].match(/\*\*Secondary Oscillator.*?\*\*.*?- Waveform: ([^\n]+).*?- Coarse Tune: ([^\n]+).*?- Fine Tune: ([^\n]+).*?- Level: ([^\n]+)/s);
    if (secondaryMatch) {
      oscillators.push({
        name: 'Secondary Oscillator',
        values: {
          Waveform: secondaryMatch[1].trim(),
          'Coarse Tune': secondaryMatch[2].trim(),
          'Fine Tune': secondaryMatch[3].trim(),
          Level: secondaryMatch[4].trim()
        }
      });
    }
    
    // Extract Sub Oscillator if present
    const subMatch = oscSection[1].match(/\*\*Sub Oscillator.*?\*\*.*?- Waveform: ([^\n]+).*?- Octave: ([^\n]+).*?- Level: ([^\n]+)/s);
    if (subMatch) {
      oscillators.push({
        name: 'Sub Oscillator',
        values: {
          Waveform: subMatch[1].trim(),
          Octave: subMatch[2].trim(),
          Level: subMatch[3].trim()
        }
      });
    }
    
    return oscillators;
  };

  // Extract filter data from new format
  const extractFilter = (): any => {
    const filterSection = cleanText.match(/### 🎚️ Filter Configuration([\s\S]*?)(### |## |$)/);
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
    summary: cleanText.includes('## 🎯 Performance & Production') 
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
    if (Array.isArray(parsed.oscillators) && parsed.oscillators.length > 0) {
      return parsed.oscillators.map((osc: any, idx: number) => ({
        name: osc.name || `Oscillator ${idx + 1}`,
        id: String(idx + 1),
        values: osc.values || {}
      }));
    }
    // Fallback to original synthConfig oscillators (no parsed data)
    if (Array.isArray(synthConfig.oscillators)) {
      return synthConfig.oscillators.map((osc: any, idx: number) => ({
        name: osc.name || `Oscillator ${idx + 1}`,
        id: osc.id || String(idx + 1),
        values: {}
      }));
    }
    return [];
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
  if (!inputs.description || !inputs.synthesisType || !inputs.genre || !inputs.voiceType) {
    throw new Error('Missing required fields: description, synthesisType, genre, and voiceType are required');
  }

  try {
    // If a synthModel is provided, use that specific synth config
    // Otherwise use a generic config based on synthesis type
    const synthConfig = inputs.synthModel ? 
      getSynthConfig(inputs.synthModel) : 
      {
        name: inputs.synthesisType,
        type: inputs.synthesisType,
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
    
    const prompt = generatePrompt(inputs, synthConfig);
    
    const responseText = await generateAIResponse(prompt);
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
import { PatchGuideInputs, PatchGuideResult, SynthConfig, ADSREnvelope } from '../types/patchTypes';

interface PatchGuideRequest {
  description: string;
  synthesisType: string;
  synthModel?: string;
  genre: string;
  voiceType: string;
  notes?: string;
  dawName?: string;
}

interface PatchGuideResponse {
  text: string;
  synthConfig: any;
  adsrVCF: any;
  adsrVCA: any;
  summary: string;
}

export const generateSynthPatchGuide = async (request: PatchGuideRequest): Promise<PatchGuideResponse> => {
  // This would typically call an AI service like Gemini
  // For now, return a structured response based on the inputs
  
  const synthConfig: SynthConfig = generateSynthConfig(request);
  const adsrVCF = generateFilterEnvelope(request);
  const adsrVCA = generateAmplifierEnvelope(request);
  
  const text = generatePatchGuideText(request, synthConfig, adsrVCF, adsrVCA);
  const summary = generatePatchSummary(request);
  
  return {
    text,
    synthConfig,
    adsrVCF,
    adsrVCA,
    summary
  };
};

function generateSynthConfig(request: PatchGuideRequest): SynthConfig {
  const config: SynthConfig = {
    oscillator: {
      waveform: getWaveformForVoiceType(request.voiceType),
      octave: getOctaveForVoiceType(request.voiceType),
      detune: 0
    },
    filter: {
      type: 'lowpass',
      cutoff: getCutoffForGenre(request.genre),
      resonance: getResonanceForGenre(request.genre),
      envelope: 0.5
    },
    amplifier: {
      gain: 0.8,
      pan: 0
    },
    effects: {
      reverb: getReverbForGenre(request.genre),
      delay: getDelayForGenre(request.genre),
      chorus: 0.2
    }
  };
  
  return config;
}

function generateFilterEnvelope(request: PatchGuideRequest): ADSREnvelope {
  const baseEnvelope = { attack: 0.1, decay: 0.5, sustain: 0.8, release: 1.5 };
  
  // Adjust based on voice type
  switch (request.voiceType.toLowerCase()) {
    case 'lead':
      return { attack: 0.05, decay: 0.3, sustain: 0.9, release: 0.8 };
    case 'bass':
      return { attack: 0.01, decay: 0.8, sustain: 0.6, release: 1.2 };
    case 'pad':
      return { attack: 0.5, decay: 1.0, sustain: 0.8, release: 2.0 };
    case 'pluck':
      return { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.3 };
    default:
      return baseEnvelope;
  }
}

function generateAmplifierEnvelope(request: PatchGuideRequest): ADSREnvelope {
  const baseEnvelope = { attack: 0.05, decay: 0.3, sustain: 0.9, release: 0.6 };
  
  // Adjust based on voice type
  switch (request.voiceType.toLowerCase()) {
    case 'lead':
      return { attack: 0.02, decay: 0.2, sustain: 0.9, release: 0.5 };
    case 'bass':
      return { attack: 0.01, decay: 0.4, sustain: 0.8, release: 0.8 };
    case 'pad':
      return { attack: 0.8, decay: 0.5, sustain: 0.9, release: 2.5 };
    case 'pluck':
      return { attack: 0.01, decay: 0.1, sustain: 0.0, release: 0.2 };
    default:
      return baseEnvelope;
  }
}

function generatePatchGuideText(
  request: PatchGuideRequest, 
  synthConfig: SynthConfig, 
  adsrVCF: ADSREnvelope, 
  adsrVCA: ADSREnvelope
): string {
  return `# ${request.voiceType} Patch for ${request.genre}

## Synthesis Type: ${request.synthesisType}
${request.synthModel ? `**Synth Model:** ${request.synthModel}` : ''}

## Oscillator Settings
- **Waveform:** ${synthConfig.oscillator?.waveform}
- **Octave:** ${synthConfig.oscillator?.octave}
- **Detune:** ${synthConfig.oscillator?.detune} cents

## Filter Settings
- **Type:** ${synthConfig.filter?.type}
- **Cutoff:** ${synthConfig.filter?.cutoff} Hz
- **Resonance:** ${synthConfig.filter?.resonance}
- **Envelope Amount:** ${synthConfig.filter?.envelope}

## Filter Envelope (VCF)
- **Attack:** ${adsrVCF.attack}s
- **Decay:** ${adsrVCF.decay}s
- **Sustain:** ${adsrVCF.sustain}
- **Release:** ${adsrVCF.release}s

## Amplifier Envelope (VCA)
- **Attack:** ${adsrVCA.attack}s
- **Decay:** ${adsrVCA.decay}s
- **Sustain:** ${adsrVCA.sustain}
- **Release:** ${adsrVCA.release}s

## Effects
- **Reverb:** ${synthConfig.effects?.reverb}
- **Delay:** ${synthConfig.effects?.delay}
- **Chorus:** ${synthConfig.effects?.chorus}

## Description
${request.description}

${request.notes ? `## Additional Notes\n${request.notes}` : ''}

## Tips for ${request.genre}
${getGenreTips(request.genre)}
`;
}

function generatePatchSummary(request: PatchGuideRequest): string {
  return `${request.voiceType} patch for ${request.genre} using ${request.synthesisType} synthesis`;
}

// Helper functions
function getWaveformForVoiceType(voiceType: string): string {
  const waveforms: Record<string, string> = {
    'lead': 'sawtooth',
    'bass': 'square',
    'pad': 'sawtooth',
    'pluck': 'square',
    'arp': 'sawtooth',
    'stab': 'square'
  };
  return waveforms[voiceType.toLowerCase()] || 'sawtooth';
}

function getOctaveForVoiceType(voiceType: string): number {
  const octaves: Record<string, number> = {
    'lead': 0,
    'bass': -2,
    'pad': -1,
    'pluck': 0,
    'arp': 1,
    'stab': 0
  };
  return octaves[voiceType.toLowerCase()] || 0;
}

function getCutoffForGenre(genre: string): number {
  const cutoffs: Record<string, number> = {
    'house': 2000,
    'techno': 1500,
    'trance': 2500,
    'ambient': 1000,
    'dubstep': 800,
    'trap': 1200
  };
  return cutoffs[genre.toLowerCase()] || 1500;
}

function getResonanceForGenre(genre: string): number {
  const resonances: Record<string, number> = {
    'house': 0.3,
    'techno': 0.5,
    'trance': 0.4,
    'ambient': 0.2,
    'dubstep': 0.7,
    'trap': 0.4
  };
  return resonances[genre.toLowerCase()] || 0.3;
}

function getReverbForGenre(genre: string): number {
  const reverbs: Record<string, number> = {
    'house': 0.3,
    'techno': 0.2,
    'trance': 0.4,
    'ambient': 0.8,
    'dubstep': 0.1,
    'trap': 0.2
  };
  return reverbs[genre.toLowerCase()] || 0.3;
}

function getDelayForGenre(genre: string): number {
  const delays: Record<string, number> = {
    'house': 0.2,
    'techno': 0.3,
    'trance': 0.4,
    'ambient': 0.5,
    'dubstep': 0.1,
    'trap': 0.3
  };
  return delays[genre.toLowerCase()] || 0.2;
}

function getGenreTips(genre: string): string {
  const tips: Record<string, string> = {
    'house': '- Use moderate filter sweeps\n- Add subtle swing to rhythm\n- Layer with percussion elements',
    'techno': '- Emphasize the attack phase\n- Use heavy filter modulation\n- Keep it driving and repetitive',
    'trance': '- Long filter sweeps work well\n- Add plenty of reverb and delay\n- Build energy over time',
    'ambient': '- Use slow attack times\n- Heavy reverb and delay\n- Subtle modulation',
    'dubstep': '- Heavy low-pass filtering\n- Aggressive LFO modulation\n- Use distortion sparingly',
    'trap': '- Sharp attacks\n- Moderate reverb\n- Layer with 808-style drums'
  };
  return tips[genre.toLowerCase()] || '- Experiment with different settings\n- Trust your ears\n- Reference professional tracks';
}
