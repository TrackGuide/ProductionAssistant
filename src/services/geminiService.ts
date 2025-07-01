// services/geminiService.ts

import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_MODEL_NAME } from '../constants/constants';
import { dawMetadata } from '../constants/dawMetadata';
import { MIDI_TEMPO_RANGES, MIDI_CHORD_PROGRESSIONS } from '../constants/midiConstants';
import { MidiSettings } from '../constants/types';

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
    d.dawName.toLowerCase().includes(dawName.toLowerCase()) ||
    dawName.toLowerCase().includes(d.dawName.toLowerCase())
  );
  
  if (!daw) return '';
  
  return `
**DAW-Specific Context for ${daw.dawName}:**
- Workflow Tips: ${daw.workflowTips.join('; ')}
- Advanced Features: ${daw.advancedFeatures.join(', ')}
- Stock Plugins: EQ (${daw.stockPlugins.EQ.join(', ')}), Compression (${daw.stockPlugins.Compression.join(', ')})
`;
};

// Utility function for retry logic
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
  // This should never be reached due to the throw in the catch block, but TypeScript needs it
  throw new Error('Max retries exceeded');
};

// Type definitions
interface TrackGuideInputs {
  genres?: string[];
  vibes?: string[];
  dawName?: string;
  userNotes?: string;
  genre?: string[];
  vibe?: string[];
  daw?: string;
  plugins?: string;
  availableInstruments?: string;
  songTitle?: string;
  artistReference?: string;
  referenceTrackLink?: string;
  lyrics?: string;
  key?: string;
  chords?: string;
  generalNotes?: string;
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

// Main function to generate guidebook content (streaming)
export const generateGuidebookContent = async (inputs: TrackGuideInputs) => {
  try {
    const genAI = initializeGemini();
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL_NAME });

    const genres = inputs.genres || inputs.genre || [];
    const vibes = inputs.vibes || inputs.vibe || [];
    const genreContext = genres.length > 0 ? getGenreContext(genres) : '';
    const dawContext = inputs.dawName || inputs.daw ? getDawContext(inputs.dawName || inputs.daw || '') : '';

    const prompt = `
You are an expert music production assistant. Generate a comprehensive track guide based on the following inputs:

**Track Details:**
- Genres: ${genres.join(', ') || 'Not specified'}
- Vibes: ${vibes.join(', ') || 'Not specified'}
- Song Title: ${inputs.songTitle || 'Not specified'}
- Artist Reference: ${inputs.artistReference || 'Not specified'}
- Reference Track: ${inputs.referenceTrackLink || 'Not specified'}
- Key: ${inputs.key || 'Not specified'}
- Chords: ${inputs.chords || 'Not specified'}
- Lyrics: ${inputs.lyrics || 'Not specified'}
- DAW: ${inputs.dawName || inputs.daw || 'Not specified'}
- Plugins: ${inputs.plugins || 'Not specified'}
- Available Instruments: ${inputs.availableInstruments || 'Not specified'}
- User Notes: ${inputs.userNotes || inputs.generalNotes || 'None'}

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

Start with a clear title in the format: # TRACKGUIDE: "Suggested Track Title"
`;

    const result = await model.generateContentStream(prompt);
    return result.stream;

  } catch (error) {
    console.error('Error generating guidebook content:', error);
    throw new Error(`Failed to generate guidebook content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Function to generate track guide (non-streaming)
export const generateTrackGuide = async (inputs: TrackGuideInputs): Promise<string> => {
  const validation = validateInputs(inputs, ['genres']);
  if (!validation.isValid) {
    throw new Error(`Invalid inputs: ${validation.errors.join(', ')}`);
  }
  
  const sanitizedInputs = sanitizeInputs(inputs);

  try {
    const genAI = initializeGemini();
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL_NAME });

    const genres = sanitizedInputs.genres || sanitizedInputs.genre || [];
    const vibes = sanitizedInputs.vibes || sanitizedInputs.vibe || [];
    const genreContext = genres.length > 0 ? getGenreContext(genres) : '';
    const dawContext = sanitizedInputs.dawName || sanitizedInputs.daw ? getDawContext(sanitizedInputs.dawName || sanitizedInputs.daw || '') : '';

    const prompt = `
You are an expert music production assistant. Generate a comprehensive track guide based on the following inputs:

**Track Details:**
- Genres: ${genres.join(', ') || 'Not specified'}
- Vibes: ${vibes.join(', ') || 'Not specified'}
- DAW: ${sanitizedInputs.dawName || sanitizedInputs.daw || 'Not specified'}
- User Notes: ${sanitizedInputs.userNotes || 'None'}

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
export const generateRemixGuide = async (inputs: RemixGuideInputs): Promise<string> => {
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

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();

  } catch (error) {
    console.error('Error generating remix guide:', error);
    throw new Error(`Failed to generate remix guide: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Function to generate remix guide with streaming
export const generateRemixGuideStream = async (audioData: any, targetGenre: string, genreData: any, daw?: string, plugins?: string) => {
  try {
    const genAI = initializeGemini();
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL_NAME });

    const prompt = `
You are an expert remix producer. Analyze the uploaded audio and create a detailed remix guide for transforming it into ${targetGenre}.

**Target Genre:** ${targetGenre}
**Genre Context:** ${JSON.stringify(genreData)}
**DAW:** ${daw || 'Not specified'}
**Available Plugins:** ${plugins || 'Not specified'}

Please analyze the audio and provide:

1. **🎵 Original Track DNA Analysis**
   - Key and scale
   - Tempo (BPM)
   - Harmonic progression
   - Rhythmic elements
   - Melodic content

2. **🎛️ ${targetGenre} Transformation Plan**
   - Target tempo and key
   - Rhythmic adaptation
   - Harmonic reinterpretation
   - Sound design approach

3. **🔧 Technical Implementation**
   - Step-by-step process
   - Effect chains and processing
   - Arrangement structure
   - Mix approach

4. **🎹 Creative Techniques**
   - Genre-specific elements to add
   - Performance techniques
   - Arrangement variations

Be specific with parameter suggestions and creative techniques.
`;

    const result = await model.generateContentStream([
      {
        inlineData: {
          data: audioData.base64,
          mimeType: audioData.mimeType
        }
      },
      { text: prompt }
    ]);

    return result.stream;

  } catch (error) {
    console.error('Error generating remix guide stream:', error);
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
You are an expert mixing engineer. Analyze the provided mix information and give detailed feedback:

**Mix Details:**
- Genre: ${inputs.genre || 'Not specified'}
- DAW: ${inputs.dawName || 'Not specified'}
- Track Elements: ${inputs.trackElements?.join(', ') || 'Not specified'}
- Current Issues: ${inputs.currentIssues || 'None specified'}
- Reference Track: ${inputs.referenceTrack || 'None'}
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

    const result = await model.generateContent(prompt);
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

// MIDI Pattern Generation
export const generateMidiPatternSuggestions = async (settings: any) => {
  try {
    const genAI = initializeGemini();
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL_NAME });

    const prompt = `
Generate MIDI patterns based on these settings:
- Tempo: ${settings.tempo || 120} BPM
- Bars: ${settings.bars || 8}
- Time Signature: ${settings.timeSignature ? settings.timeSignature.join('/') : '4/4'}
- Key: ${settings.key || 'C Major'}
- Scale: ${settings.scale || 'Major'}
- Genre: ${settings.genre || 'Electronic'}
- Instruments: ${settings.targetInstruments ? settings.targetInstruments.join(', ') : 'Piano, Bass, Drums'}
- Chord Progression: ${settings.chordProgression || 'I-V-vi-IV'}

${settings.guidebookContext ? `Additional Context: ${settings.guidebookContext}` : ''}

Return a JSON object with MIDI patterns for different instruments. Include chord progressions, basslines, melodies, and drum patterns. Format the response as valid JSON with proper MIDI note numbers and timing.

Use this structure:
{
  "chords": [{"note": 60, "velocity": 80, "start": 0, "duration": 0.5}],
  "bassline": [{"note": 36, "velocity": 90, "start": 0, "duration": 0.25}],
  "melody": [{"note": 72, "velocity": 75, "start": 0, "duration": 0.25}],
  "drums": {
    "kick": [{"note": 36, "velocity": 100, "start": 0, "duration": 0.1}],
    "snare": [{"note": 38, "velocity": 90, "start": 0.5, "duration": 0.1}],
    "hihat_closed": [{"note": 42, "velocity": 70, "start": 0.25, "duration": 0.1}]
  }
}
`;

    const result = await model.generateContentStream(prompt);
    return result.stream;
  } catch (error) {
    console.error('Error generating MIDI patterns:', error);
    throw new Error('Failed to generate MIDI patterns');
  }
};

// Function to generate mix feedback with audio stream
export const generateMixFeedbackWithAudioStream = async (inputs: any) => {
  try {
    const genAI = initializeGemini();
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL_NAME });

    // Convert the audio file to base64 if needed
    let audioData;
    if (inputs.audioFile) {
      const reader = new FileReader();
      const base64Data = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          // Remove the data URL prefix (e.g., "data:audio/wav;base64,")
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(inputs.audioFile);
      });

      audioData = {
        inlineData: {
          data: base64Data,
          mimeType: inputs.audioFile.type
        }
      };
    }

    const prompt = `
You are an expert mixing engineer. Analyze the uploaded audio file and provide detailed mix feedback:

**Mix Details:**
- Description: ${inputs.description || 'Not provided'}
- Focus Areas: ${inputs.focusAreas?.join(', ') || 'General analysis'}
- User Notes: ${inputs.userNotes || 'None'}

Please analyze the audio and provide comprehensive feedback including:

1. **🎧 Audio Analysis Results**
2. **Overall Mix Assessment**
3. **Frequency Balance Analysis**
4. **Stereo Field Evaluation**
5. **Dynamic Range Review**
6. **Specific Improvement Suggestions**
7. **EQ Recommendations**
8. **Compression Guidance**
9. **Effects Processing Tips**

Be specific and actionable with your recommendations based on what you hear in the audio.
`;

    const content = audioData ? [audioData, { text: prompt }] : [{ text: prompt }];
    const result = await model.generateContentStream(content);
    return result.stream;

  } catch (error) {
    console.error('Error generating mix feedback with audio:', error);
    throw new Error(`Failed to generate mix feedback: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Function to generate mix comparison stream
export const generateMixComparisonStream = async (inputs: any) => {
  try {
    const genAI = initializeGemini();
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL_NAME });

    const prompt = `
You are an expert audio engineer. Compare these two audio files and provide detailed analysis:

**Mix A:** ${inputs.mixAName || 'First Mix'}
**Mix B:** ${inputs.mixBName || 'Second Mix'}

${inputs.includeMixBFeedback ? 'Please provide individual feedback for Mix B as well as comparison.' : ''}

**User Notes:** ${inputs.userNotes || 'None'}

Please analyze both audio files and provide:

1. **🎧 Audio Comparison Analysis**
2. **Overall Mix Comparison**
3. **Frequency Balance Differences**
4. **Dynamic Range Comparison**
5. **Stereo Field Analysis**
6. **Clarity & Definition Comparison**
7. **Punch & Impact Assessment**
8. **Recommendations for Both Mixes**
9. **Which Elements Work Better in Each Mix**

${inputs.includeMixBFeedback ? `
10. **Detailed Mix B Feedback**
    - Individual assessment
    - Specific improvement suggestions
    - Technical recommendations
` : ''}

Be objective and provide actionable insights for improving both mixes based on what you hear.
`;

    const content = [
      {
        inlineData: {
          data: inputs.mixAFile,
          mimeType: 'audio/mpeg'
        }
      },
      {
        inlineData: {
          data: inputs.mixBFile,
          mimeType: 'audio/mpeg'
        }
      },
      { text: prompt }
    ];

    const result = await model.generateContentStream(content);
    return result.stream;

  } catch (error) {
    console.error('Error generating mix comparison:', error);
    throw new Error(`Failed to generate mix comparison: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// General content generation for compatibility with patchGuideServiceOptimized
export const generateContent = async (prompt: string): Promise<string> => {
  try {
    const genAI = initializeGemini();
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL_NAME });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating content:', error);
    throw new Error(`Failed to generate content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Validation function
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
  generateGuidebookContent,
  generateRemixGuide,
  generateRemixGuideStream,
  generatePatchGuide,
  generateMixFeedback,
  generateMixFeedbackWithAudioStream,
  generateMixComparisonStream,
  compareMixes,
  generateAIResponse,
  generateMidiPatternSuggestions,
  validateInputs,
  sanitizeInputs,
  generateContent
};

export default geminiService;
