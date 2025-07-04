// services/geminiService.ts

import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_MODEL_NAME } from '../constants/constants';
import { dawMetadata } from '../constants/dawMetadata';
import { MIDI_TEMPO_RANGES, MIDI_CHORD_PROGRESSIONS } from '../constants/midiConstants';

// Initialize Gemini AI
const getApiKey = (): string => {
  const apiKey = 
    (typeof process !== 'undefined' && process.env.VITE_GEMINI_API_KEY) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env.VITE_GEMINI_API_KEY) ||
    '';
  
  if (!apiKey) {
    throw new Error('Gemini API key not found. Please set VITE_GEMINI_API_KEY in your environment variables.');
  }
  
  return apiKey;
};

let genAI: GoogleGenerativeAI | null = null;

const initializeGemini = (): GoogleGenerativeAI => {
  if (!genAI) {
    const apiKey = getApiKey();
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
};

// Helper function to get genre context
const getGenreContext = (genres: string[]): string => {
  const genreInfo = genres.map(genre => {
    const tempoRange = MIDI_TEMPO_RANGES[genre];
    const chordProgs = MIDI_CHORD_PROGRESSIONS[genre];
    
    return `
**${genre} Context:**
${tempoRange ? `- Typical BPM Range: ${tempoRange[0]}-${tempoRange[1]}` : ''}
${chordProgs ? `- Common Chord Progressions: ${chordProgs.join(', ')}` : ''}
`;
  }).join('\n');
  
  return genreInfo;
};

// Helper function to get DAW context
const getDawContext = (dawName: string): string => {
  const daw = dawMetadata.find(d => 
    d.name.toLowerCase().includes(dawName.toLowerCase()) ||
    dawName.toLowerCase().includes(d.name.toLowerCase())
  );
  
  if (!daw) return '';
  
  return `
**DAW-Specific Context for ${daw.name}:**
- Strengths: ${daw.strengths.join(', ')}
- Best For: ${daw.bestFor.join(', ')}
- Key Features: ${daw.keyFeatures.join(', ')}
- Workflow Tips: ${daw.workflowTips.join(', ')}
${daw.commonPlugins.length > 0 ? `- Common Plugins: ${daw.commonPlugins.join(', ')}` : ''}
${daw.midiCapabilities ? `- MIDI Capabilities: ${daw.midiCapabilities.join(', ')}` : ''}
${daw.mixingFeatures ? `- Mixing Features: ${daw.mixingFeatures.join(', ')}` : ''}
`;
};

const generateWithRetry = async (generateFn: () => Promise<any>, maxRetries = 3): Promise<string> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await generateFn();
      return result.response.text();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private readonly delay = 1000; // 1 second between requests

  async add<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.process();
    });
  }

  private async process(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    while (this.queue.length > 0) {
      const request = this.queue.shift()!;
      await request();
      await new Promise(resolve => setTimeout(resolve, this.delay));
    }
    this.processing = false;
  }
}

class ResponseCache {
  private cache = new Map<string, { data: string; timestamp: number }>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  get(key: string): string | null {
    const entry = this.cache.get(key);
    if (entry && Date.now() - entry.timestamp < this.TTL) {
      return entry.data;
    }
    this.cache.delete(key);
    return null;
  }

  set(key: string, data: string): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }
}

interface TrackGuideInputs {
  genres?: string[];
  vibes?: string[];
  dawName?: string;
  userNotes?: string;
}

interface RemixGuideInputs {
  originalArtist?: string;
  originalTrack?: string;
  originalGenre?: string;
  remixGenre?: string;
  remixStyle?: string;
  remixVibe?: string;
  dawName?: string;
  userNotes?: string;
}

// Main function to generate track guide
export const generateTrackGuide = async (inputs: TrackGuideInputs): Promise<string> => {
  const validation = validateInputs(inputs, ['genres']);
  if (!validation.isValid) {
    throw new Error(`Invalid inputs: ${validation.errors.join(', ')}`);
  }
  
  const sanitizedInputs = sanitizeInputs(inputs);

  try {
    const genAI = initializeGemini();
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL_NAME });

    const genreContext = inputs.genres ? getGenreContext(inputs.genres) : '';
    const dawContext = inputs.dawName ? getDawContext(inputs.dawName) : '';

    const prompt = `
You are an expert music production assistant. Generate a comprehensive track guide based on the following inputs:

**Track Details:**
- Genres: ${inputs.genres?.join(', ') || 'Not specified'}
- Vibes: ${inputs.vibes?.join(', ') || 'Not specified'}
- DAW: ${inputs.dawName || 'Not specified'}
- User Notes: ${inputs.userNotes || 'None'}

${genreContext}
${dawContext}

Please provide a detailed production guide that includes:

1. **Track Overview & Concept**
2. **Arrangement Structure**
3. **Sound Design & Instrumentation**
4. **Mixing Approach**
5. **Creative Techniques**
6. **DAW-Specific Tips** (if DAW specified)

Format your response in clear markdown with headers and bullet points. Be specific and actionable.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();

  } catch (error) {
    console.error('Error generating track guide:', error);
    throw new Error(`Failed to generate track guide: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Function to generate remix guide
export const generateRemixGuide = async (inputs: any): Promise<string> => {
  try {
    const genAI = initializeGemini();
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL_NAME });

    const prompt = `
You are an expert remix producer. Create a detailed remix guide based on:

**Original Track Info:**
- Artist: ${inputs.originalArtist || 'Not specified'}
- Track: ${inputs.originalTrack || 'Not specified'}
- Genre: ${inputs.originalGenre || 'Not specified'}

**Remix Details:**
- Target Genre: ${inputs.remixGenre || 'Not specified'}
- Style: ${inputs.remixStyle || 'Not specified'}
- Vibe: ${inputs.remixVibe || 'Not specified'}
- DAW: ${inputs.dawName || 'Not specified'}

**Additional Notes:**
${inputs.userNotes || 'None'}

Provide a comprehensive remix guide including:
1. **Remix Concept & Approach**
2. **Key Elements to Preserve**
3. **Elements to Transform**
4. **Technical Breakdown**
5. **Step-by-Step Process**
6. **Creative Techniques**
7. **Mixing & Mastering Tips**

Be specific about techniques, effects, and creative decisions.
`;

    // Build Gemini multimodal parts
    const parts: any[] = [{ text: prompt }];

    // If an audio file is present, convert to base64 and attach as inlineData
    if (inputs.audioFile instanceof File) {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(inputs.audioFile);
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = error => reject(error);
      });
      parts.push({
        inlineData: {
          data: base64,
          mimeType: inputs.audioFile.type || 'audio/wav',
        }
      });
    }

    // Use Gemini multimodal API
    const result = await model.generateContent(parts);
    const response = await result.response;
    return response.text();

  } catch (error) {
    console.error('Error generating remix guide:', error);
    throw new Error(`Failed to generate remix guide: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Function to generate patch guide
export const generatePatchGuide = async (inputs: any): Promise<string> => {
  try {
    const genAI = initializeGemini();
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL_NAME });

    const prompt = `
You are an expert sound designer. Create a detailed synthesizer patch guide based on:

**Patch Requirements:**
- Synth Model: ${inputs.synthModel || 'Generic'}
- Sound Type: ${inputs.soundType || 'Not specified'}
- Genre: ${inputs.genre || 'Not specified'}
- Characteristics: ${inputs.characteristics?.join(', ') || 'Not specified'}
- User Description: ${inputs.userNotes || 'None'}

Provide a comprehensive patch guide including:

1. **Patch Overview**
2. **Oscillator Settings**
3. **Filter Configuration**
4. **Envelope Settings (ADSR)**
5. **Modulation Setup**
6. **Effects Chain**
7. **Performance Tips**
8. **Variations & Tweaks**

Be specific with parameter values and settings where possible.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();

  } catch (error) {
    console.error('Error generating patch guide:', error);
    throw new Error(`Failed to generate patch guide: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Function to analyze mix and provide feedback
export const generateMixFeedback = async (inputs: any): Promise<string> => {
  try {
    const genAI = initializeGemini();
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL_NAME });

    const prompt = `
You are an expert mixing engineer. Analyze the provided mix and give detailed feedback:

**Mix Details:**
- DAW: ${inputs.dawName || 'Not specified'}
- Track Name: ${inputs.trackName || 'Not specified'}
- User Notes: ${inputs.userNotes || 'None'}

Provide comprehensive mix feedback including:
1. **Overall Mix Assessment**
2. **Frequency Balance Analysis**
3. **Stereo Field Evaluation**
4. **Dynamic Range Review**
5. **Specific Improvement Suggestions**
6. **EQ Recommendations**
7. **Compression Guidance**
8. **Effects Processing Tips**
9. **Reference Comparison** (if reference provided)

Be specific and actionable with your recommendations.
`;

    // Build Gemini multimodal parts (reference: compareMixes)
    const parts: any[] = [{ text: prompt }];

    // If an audio file is present, convert to base64 and attach as inlineData
    if (inputs.audioFile instanceof File) {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(inputs.audioFile);
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = error => reject(error);
      });
      parts.push({
        inlineData: {
          data: base64,
          mimeType: inputs.audioFile.type || 'audio/wav',
        }
      });
    }

    // Use Gemini multimodal API (fix: pass parts array directly)
    // See: https://ai.google.dev/gemini-api/docs/prompting/send-content
    const result = await model.generateContent(parts);
    const response = await result.response;
    return response.text();

  } catch (error) {
    console.error('Error generating mix feedback:', error);
    throw new Error(`Failed to generate mix feedback: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Function to compare two mixes
export const compareMixes = async (inputs: any): Promise<string> => {
  try {
    const genAI = initializeGemini();
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL_NAME });

    const prompt = `
You are an expert audio engineer. Compare two mixes and provide detailed analysis:

**Mix A Details:**
- Description: ${inputs.mixADescription || 'Not provided'}
- Characteristics: ${inputs.mixACharacteristics || 'Not specified'}

**Mix B Details:**
- Description: ${inputs.mixBDescription || 'Not provided'}
- Characteristics: ${inputs.mixBCharacteristics || 'Not specified'}

**Comparison Context:**
- Genre: ${inputs.genre || 'Not specified'}
- Focus Areas: ${inputs.focusAreas?.join(', ') || 'General comparison'}
- User Notes: ${inputs.userNotes || 'None'}

Provide a detailed comparison including:

1. **Overall Mix Comparison**
2. **Frequency Balance Differences**
3. **Dynamic Range Analysis**
4. **Stereo Field Comparison**
5. **Clarity & Definition**
6. **Punch & Impact**
7. **Recommendations for Improvement**
8. **Which Elements Work Better in Each Mix**

Be objective and provide actionable insights for improving both mixes.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();

  } catch (error) {
    console.error('Error comparing mixes:', error);
    throw new Error(`Failed to compare mixes: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Function to generate AI assistant responses
export const generateAIResponse = async (message: string, context?: any): Promise<string> => {
  try {
    const genAI = initializeGemini();
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL_NAME });

    const contextInfo = context ? `
**Context:**
- Current View: ${context.currentView || 'Unknown'}
- User Preferences: ${JSON.stringify(context.userPreferences || {})}
- Session Info: ${JSON.stringify(context.sessionInfo || {})}
` : '';

    const prompt = `
You are TrackGuide AI, an expert music production assistant. Respond to the user's question or request:

**User Message:** ${message}

${contextInfo}

Provide a helpful, accurate, and detailed response. If the question is about music production, be specific with techniques, settings, and recommendations. If you need more information to provide a better answer, ask clarifying questions.

Keep your response conversational but informative, and format it clearly with markdown when appropriate.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();

  } catch (error) {
    console.error('Error generating AI response:', error);
    throw new Error(`Failed to generate AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Helper function to validate inputs
export const validateInputs = (inputs: any, requiredFields: string[]): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  requiredFields.forEach(field => {
    if (!inputs[field] || (Array.isArray(inputs[field]) && inputs[field].length === 0)) {
      errors.push(`${field} is required`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Helper function to sanitize inputs
export const sanitizeInputs = (inputs: any): any => {
  const sanitized = { ...inputs };

  // Remove any potentially harmful content
  Object.keys(sanitized).forEach(key => {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitized[key]
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .trim();
    }
  });

  return sanitized;
};

// Export default service object
export const geminiService = {
  generateTrackGuide,
  generateRemixGuide,
  generatePatchGuide,
  generateMixFeedback,
  compareMixes,
  generateAIResponse,
  validateInputs,
  sanitizeInputs
};

export default geminiService;
