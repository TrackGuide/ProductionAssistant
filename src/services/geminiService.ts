// services/geminiService.ts

import { GoogleGenerativeAI } from '@google/generative-ai';
import { UserInputs, MidiSettings, MixFeedbackInputs } from '../types/appTypes';
import { dawMetadata } from '../constants/dawMetadata';
import { 
  GENRE_SUGGESTIONS, 
  VIBE_SUGGESTIONS, 
  MIDI_SCALES, 
  MIDI_CHORD_PROGRESSIONS, 
  MIDI_TEMPO_RANGES,
  DAW_SUGGESTIONS 
} from '../constants/constants';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// Helper function to get DAW-specific context
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

// Helper function to get genre-specific context
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

export const generateGuidebookContent = async function* (inputs: UserInputs) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  // Get DAW-specific context
  const dawContext = inputs.daw ? getDawContext(inputs.daw) : '';
  
  // Get genre-specific context
  const genreContext = inputs.genre.length > 0 ? getGenreContext(inputs.genre) : '';
  
  // Validate genres against constants
  const validGenres = inputs.genre.filter(g => 
    GENRE_SUGGESTIONS.some(suggestion => 
      suggestion.toLowerCase().includes(g.toLowerCase()) || 
      g.toLowerCase().includes(suggestion.toLowerCase())
    )
  );
  
  // Validate vibes against constants
  const validVibes = inputs.vibe.filter(v => 
    VIBE_SUGGESTIONS.some(suggestion => 
      suggestion.toLowerCase().includes(v.toLowerCase()) || 
      v.toLowerCase().includes(suggestion.toLowerCase())
    )
  );

  const prompt = `You are an expert music production assistant. Create a comprehensive TrackGuide for a music producer.

**IMPORTANT CONTEXT FROM SYSTEM:**
${dawContext}
${genreContext}

**Available Scales:** ${MIDI_SCALES.join(', ')}
**Supported DAWs:** ${DAW_SUGGESTIONS.join(', ')}
**Genre Database:** ${GENRE_SUGGESTIONS.join(', ')}
**Vibe Database:** ${VIBE_SUGGESTIONS.join(', ')}

**User Input:**
- Song Title: ${inputs.songTitle || 'Not specified'}
- Genres: ${inputs.genre.join(', ') || 'Not specified'} ${validGenres.length !== inputs.genre.length ? '(Some genres validated against database)' : ''}
- Vibes: ${inputs.vibe.join(', ') || 'Not specified'} ${validVibes.length !== inputs.vibe.length ? '(Some vibes validated against database)' : ''}
- Artist Reference: ${inputs.artistReference || 'Not specified'}
- Reference Track: ${inputs.referenceTrackLink || 'Not specified'}
- DAW: ${inputs.daw || 'Not specified'}
- Plugins: ${inputs.plugins || 'Not specified'}
- Available Instruments: ${inputs.availableInstruments || 'Not specified'}
- Key/Scale: ${inputs.key || 'Not specified'}
- Chord Ideas: ${inputs.chords || 'Not specified'}
- Lyrics/Vocal Ideas: ${inputs.lyrics || 'Not specified'}
- General Notes: ${inputs.generalNotes || 'Not specified'}

Create a detailed TrackGuide that includes:

1. **Track Overview** - Suggested title, key insights
2. **Genre & Style Analysis** - Reference the genre database and provide specific guidance
3. **Suggested Key(s) / Scale(s)** - Choose from available scales: ${MIDI_SCALES.join(', ')}
4. **BPM Recommendation** - Use genre-specific tempo ranges when available
5. **Chord Progression Ideas** - Reference common progressions for the genre
6. **Song Structure** - Detailed arrangement suggestions
7. **Sound Design & Instrumentation** - Specific to the genre and available tools
8. **Production Techniques** - ${inputs.daw ? `Specific to ${inputs.daw}` : 'General techniques'}
9. **Mixing Approach** - ${inputs.daw ? `Using ${inputs.daw}'s strengths` : 'General mixing advice'}
10. **Creative Ideas & Variations**

${dawContext ? 'Make sure to leverage the DAW-specific strengths and features mentioned above.' : ''}
${genreContext ? 'Use the genre-specific BPM and chord progression information provided.' : ''}

Format as markdown with clear sections. Start with "# TRACKGUIDE: [Suggested Title]"`;

  const result = await model.generateContentStream(prompt);
  
  for await (const chunk of result.stream) {
    const chunkText = chunk.text();
    yield { text: chunkText };
  }
};

export const generateMidiPatternSuggestions = async function* (settings: MidiSettings) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  // Get genre-specific context
  const genreTempoRange = MIDI_TEMPO_RANGES[settings.genre] || MIDI_TEMPO_RANGES.Default;
  const genreChordProgs = MIDI_CHORD_PROGRESSIONS[settings.genre] || MIDI_CHORD_PROGRESSIONS.Default;
  
  // Validate key against available scales
  const isValidKey = MIDI_SCALES.includes(settings.key);
  const keyWarning = !isValidKey ? `\n**Note:** Key "${settings.key}" not in standard scale database. Using as provided.` : '';

  const prompt = `You are an expert MIDI composer. Generate MIDI patterns based on these specifications:

**SYSTEM CONTEXT:**
- Available Scales: ${MIDI_SCALES.join(', ')}
- Genre Tempo Range for ${settings.genre}: ${genreTempoRange[0]}-${genreTempoRange[1]} BPM
- Common Chord Progressions for ${settings.genre}: ${genreChordProgs.join(', ')}
${keyWarning}

**MIDI Settings:**
- Key: ${settings.key} ${isValidKey ? '✓' : '⚠️'}
- Tempo: ${settings.tempo} BPM ${settings.tempo >= genreTempoRange[0] && settings.tempo <= genreTempoRange[1] ? '(within genre range)' : '(outside typical range)'}
- Time Signature: ${settings.timeSignature}
- Chord Progression: ${settings.chordProgression}
- Genre: ${settings.genre}
- Bars: ${settings.bars}
- Song Section: ${settings.songSection}
- Target Instruments: ${settings.targetInstruments.join(', ')}

**Additional Context:**
${settings.guidebookContext || 'No additional context provided'}

Generate MIDI patterns that:
1. Respect the key signature and scale (${settings.key})
2. Fit the tempo and time signature
3. Match the genre conventions from the database
4. Work well with the specified chord progression
5. Are appropriate for the song section (${settings.songSection})

Return as JSON with this exact structure:
{
  "chords": ["C4-E4-G4", "F4-A4-C5", ...],
  "bassline": ["C2", "F2", "G2", ...],
  "melody": ["G4", "A4", "F4", ...],
  "drums": {
    "kick": ["1.1.1", "1.3.1", ...],
    "snare": ["1.2.1", "1.4.1", ...],
    "hihat": ["1.1.1", "1.1.3", ...]
  }
}`;

  const result = await model.generateContentStream(prompt);
  
  for await (const chunk of result.stream) {
    const chunkText = chunk.text();
    yield { text: chunkText };
  }
};

export const generateMixFeedbackWithAudioStream = async function* (inputs: MixFeedbackInputs) {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-1.5-flash',
    generationConfig: {
      temperature: 0.7,
      topP: 0.8,
      topK: 40,
    }
  });

  // Get DAW-specific mixing context
  const dawContext = inputs.dawName ? getDawContext(inputs.dawName) : '';
  
  // Convert file to base64
  const audioBase64 = await fileToBase64(inputs.audioFile);

  const prompt = `You are a professional mixing engineer. Analyze this audio file and provide detailed mixing feedback.

**SYSTEM CONTEXT:**
${dawContext}
**Supported DAWs:** ${DAW_SUGGESTIONS.join(', ')}

**Track Information:**
- Track Name: ${inputs.trackName || 'Not specified'}
- DAW Used: ${inputs.dawName || 'Not specified'}
- User Notes: ${inputs.userNotes || 'No additional notes'}

${dawContext ? `**DAW-Specific Advice:** Leverage ${inputs.dawName}'s mixing strengths mentioned above.` : ''}

Provide comprehensive feedback covering:

1. **Overall Mix Balance**
2. **Frequency Analysis** - EQ suggestions
3. **Dynamics & Compression**
4. **Stereo Field & Panning**
5. **Reverb & Spatial Effects**
6. **Individual Element Analysis**
7. **Genre-Specific Considerations**
8. **${inputs.dawName ? `${inputs.dawName}-Specific` : 'DAW'} Mixing Tips**
9. **Improvement Recommendations**
10. **Professional Polish Suggestions**

Format as markdown. Start with "# 🎧 MIX FEEDBACK ANALYSIS"`;

  const result = await model.generateContentStream([
    {
      inlineData: {
        mimeType: inputs.audioFile.type,
        data: audioBase64
      }
    },
    { text: prompt }
  ]);

  for await (const chunk of result.stream) {
    const chunkText = chunk.text();
    yield { text: chunkText };
  }
};

// Helper function to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

export const generateMixComparisonStream = async function* (inputs: {
  mixAFile: string;
  mixBFile: string;
  mixAName: string;
  mixBName: string;
  includeMixBFeedback: boolean;
  userNotes: string;
}) {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-1.5-flash',
    generationConfig: {
      temperature: 0.7,
      topP: 0.8,
      topK: 40,
    }
  });

  const prompt = `You are a professional mixing engineer. Compare these two audio mixes and provide detailed analysis.

**SYSTEM CONTEXT:**
**Supported DAWs:** ${DAW_SUGGESTIONS.join(', ')}
**Genre Database:** ${GENRE_SUGGESTIONS.join(', ')}

**Comparison Details:**
- Mix A: ${inputs.mixAName}
- Mix B: ${inputs.mixBName}
- Include Mix B Individual Feedback: ${inputs.includeMixBFeedback ? 'Yes' : 'No'}
- User Notes: ${inputs.userNotes || 'No additional notes'}

Provide comprehensive comparison covering:

1. **Overall Mix Comparison**
2. **Frequency Balance Differences**
3. **Dynamic Range Analysis**
4. **Stereo Field Comparison**
5. **Clarity
