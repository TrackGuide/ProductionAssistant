// services/patchGuideServiceOptimized.ts
import { generateContent } from './geminiService';
import synthConfigsJson from '../components/synthconfigs.json';
import { SYNTHESIS_SCHEMA, SynthesisType } from '../synthesisTypes';
import { getGenreMetadata, GenreMetadataBlock } from '../constants/genreMetadata';

// ✅ Simplified, focused interfaces
export interface PatchGuideInputs {
  description: string;
  synthesisType: SynthesisType;
  synthModel?: string;
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

// ✅ Dynamic data-driven prompt generation with improved structure
const generatePrompt = (inputs: PatchGuideInputs, synthConfig: any): string => {
  const { description, synthesisType, synthModel, genre, voiceType, notes } = inputs;
  
  // Get genre-specific metadata if available
  const genreMetadata = getGenreMetadata(genre) || {} as GenreMetadataBlock;
  
  // Get synthesis type schema
  const synthSchema = SYNTHESIS_SCHEMA[synthesisType as keyof typeof SYNTHESIS_SCHEMA] || {};
  
  // Check for sub oscillator in model or synthesis type
  const hasSubOscillator = 
    synthModel && synthConfig.oscillators?.some((o: any) => o.id === '3' || (o.name?.toLowerCase().includes('sub')));
    
  // Check for pulse width parameter
  const hasPulseWidth = synthesisType === 'subtractive';
  
  let prompt = `You are a professional synthesizer programmer. Create a **detailed patch guide** using the following data:

**Target Sound**  
- Synthesis Type: ${synthesisType}  
${synthModel ? `- Model Override: ${synthModel}` : ''}  
- Genre: ${genre}  
- Voice Type: ${voiceType}  
- Style & Mood: ${description}  
${notes ? `- Notes: ${notes}` : ''}

**Genre Notes**  
${genreMetadata.tempos ? `• Tempo: ${genreMetadata.tempos}` : ''}  
${genreMetadata.chordProgressions && genreMetadata.chordProgressions.length ? `• Chords: ${genreMetadata.chordProgressions.join(', ')}` : ''}  
${genreMetadata.scalesAndModes ? `• Scales/Modes: ${genreMetadata.scalesAndModes}` : ''}  

---

## 🎛️ Core Sound Engine

### 🌊 Oscillator Setup  
**Primary Osc (Osc 1)**  
- Waveform: [type]  
- Coarse Tune: [value] semitones  
- Fine Tune: [value] cents  
- Level: [value] dB  

**Secondary Osc (Osc 2)**  
- Waveform: [type]  
- Coarse Tune: [value] semitones  
- Fine Tune: [value] cents  
- Level: [value] dB  

${hasPulseWidth ? `- Pulse Width: [value]%` : ''}

${hasSubOscillator ? 
`**Sub Oscillator**  
- Waveform: [type]  
- Octave: [value]  
- Level: [value] dB` : ''}

### 🎚️ Filter Configuration  
- Type: [type] (Lowpass/Highpass/Bandpass)  
- Cutoff: [frequency] Hz  
- Resonance: [percentage]%  
- Drive/Saturation: [percentage]%  

### 📈 Filter Envelope (VCF)  
| Parameter | Value      | Purpose                    |
|-----------|------------|----------------------------|
| Attack    | [time] ms  | [brief explanation]        |
| Decay     | [time] ms  | [brief explanation]        |
| Sustain   | [percentage]% | [brief explanation]     |
| Release   | [time] ms  | [brief explanation]        |

### 🔊 Amplitude Envelope (VCA)  
| Parameter | Value      | Purpose                    |
|-----------|------------|----------------------------|
| Attack    | [time] ms  | [brief explanation]        |
| Decay     | [time] ms  | [brief explanation]        |
| Sustain   | [percentage]% | [brief explanation]     |
| Release   | [time] ms  | [brief explanation]        |

---

## 🎭 Effects & Modulation

### 🌀 Modulation Matrix`;

  // Dynamic modulation matrix based on synth model or synthesis type
  if (synthModel && synthConfig.modSources && synthConfig.modDestinations) {
    prompt += `\n\n`;
    // Get a subset of mod sources and destinations to keep prompt length reasonable
    const modSources = synthConfig.modSources.slice(0, 5);
    const modDestinations = synthConfig.modDestinations.slice(0, 3);
    
    modSources.forEach((source: any) => {
      if (!source || !source.name) return;
      
      modDestinations.forEach((dest: any) => {
        if (!dest || !dest.params || !dest.params.length) return;
        
        const param = dest.params[0]; // Take first param as example
        prompt += `- **${source.name} → ${dest.section} ${param}**: Amount [percentage]%, ${source.type === 'LFO' ? 'Rate [Hz], Waveform [type]' : ''} _(purpose)_\n`;
      });
    });
  } else {
    // Generic modulation options based on synthesis type
    prompt += `\n\n`;
    
    // Always include basic modulation options
    prompt += `- **LFO → Filter Cutoff**: Amount [percentage]%, Rate [Hz], Waveform [type] _(purpose)_\n`;
    prompt += `- **Envelope → Oscillator Pitch**: Amount [percentage]% _(purpose)_\n`;
    prompt += `- **Velocity → Amplitude**: Amount [percentage]% _(purpose)_\n`;
    prompt += `- **Mod Wheel → ${synthesisType === 'subtractive' ? 'Filter Cutoff' : 'Vibrato'}**: Amount [percentage]% _(purpose)_\n`;
  }

  prompt += `\n\n### 🎧 Effects Chain\n\n`;
  
  // Dynamic effects chain based on synth model or fallback to standard effects
  if (synthModel && synthConfig.effects && synthConfig.effects.length) {
    // Use up to 5 effects from the model's available effects
    const effects = synthConfig.effects.slice(0, 5);
    effects.forEach((effect: any) => {
      if (!effect || !effect.name) return;
      
      prompt += `- **${effect.name}**: `;
      if (effect.parameters && effect.parameters.length) {
        const params = effect.parameters.slice(0, 3).map((p: any) => {
          const name = typeof p === 'string' ? p : p.name;
          const range = p.range ? `[${p.range[0]}–${p.range[1]}${p.unit || ''}]` : '';
          return `${name} [value${range}]`;
        }).join(' | ');
        prompt += `${params}\n`;
      } else {
        prompt += `[parameters to taste]\n`;
      }
    });
  } else {
    // Standard effects that work well with this synthesis type
    prompt += `- **Chorus**: Rate [Hz] | Depth [percentage]% | Mix [percentage]%\n`;
    prompt += `- **Delay**: Time [ms] | Feedback [percentage]% | Mix [percentage]%\n`;
    prompt += `- **Reverb**: Decay [s] | Size [percentage]% | Mix [percentage]%\n`;
    
    // Add distortion for certain synth types
    if (['subtractive', 'wavetable', 'fm'].includes(synthesisType)) {
      prompt += `- **Distortion/Saturation**: Drive [percentage]% | Tone [value] | Mix [percentage]%\n`;
    }
  }

  prompt += `\n---\n\n## 🎯 Performance & Mix\n\n`;
  
  // Dynamic performance tips
  prompt += `### 🎹 Playing Tips\n`;
  prompt += `- Velocity: Use ${genreMetadata.dynamicRange ? genreMetadata.dynamicRange.toString().split(',')[0] : '[velocity response details]'}\n`;
  prompt += `- Expression: ${genreMetadata.productionTips && genreMetadata.productionTips.length > 0 ? genreMetadata.productionTips[0] : '[expression control suggestions]'}\n`;
  prompt += `- Register: Best for ${voiceType === 'Bass' ? 'low' : (voiceType === 'Lead' ? 'mid to high' : 'mid')} register, ${genre}-appropriate phrasing\n\n`;
  
  // Mix integration
  prompt += `### 🎚️ Mix Integration\n`;
  prompt += `- EQ: Emphasize [frequency range] Hz, cut [competing frequencies] Hz\n`;
  prompt += `- Compression: Attack [time] ms / Release [time] ms / Ratio [value]:1\n`;
  prompt += `- Spatial: Pan [position] / Reverb send [percentage]%\n\n`;
  
  // Creative suggestions
  prompt += `### 💡 Creative Suggestions to Experiment With\n\n`;
  prompt += `- **Variation 1:** [interesting parameter change suggestion]\n`;
  prompt += `- **Automation idea:** Apply a slow LFO to [parameter] for evolving movement\n`;
  prompt += `- **${genre} authenticity tip:** [specific technique relevant to the genre]\n`;

  prompt += `\n\n**Instructions to AI:**\n`;
  prompt += `- Replace every [placeholder] with precise numeric values (with units) and concise purpose notes\n`;
  prompt += `- Generate reasonable parameter values appropriate for ${genre} and ${voiceType} sound design\n`;
  prompt += `- Make all modulation and effects settings musically appropriate and coherent\n`;
  prompt += `- Respond ONLY in the markdown structure above—no extra commentary\n`;
  
  // Add synthesis type schema and synth model data for reference
  prompt += `\n\n**Available Parameters for ${synthesisType} synthesis:**\n\`\`\`json\n${JSON.stringify(synthSchema, null, 2)}\n\`\`\`\n\n`;
  
  if (synthModel) {
    prompt += `**${synthModel} Configuration:**\n\`\`\`json\n${JSON.stringify(synthConfig, null, 2)}\n\`\`\`\n\n`;
  }

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
    
    const responseText = await generateContent(prompt);
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
