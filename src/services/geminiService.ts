import { GoogleGenerativeAI } from '@google/generative-ai';
import { MidiSettings } from '../types';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY || API_KEY === 'your_gemini_api_key_here') {
  console.warn('API_KEY is not set. Using demo mode - AI features will return placeholder content.');
}

const genAI = API_KEY && API_KEY !== 'your_gemini_api_key_here' 
  ? new GoogleGenerativeAI(API_KEY) 
  : null;

const model = genAI ? genAI.getGenerativeModel({ model: 'gemini-pro' }) : null;

/**
 * Generate MIDI pattern suggestions based on settings.
 */
export const generateMidiPatternSuggestions = async function* (settings: MidiSettings) {
  if (!model || !API_KEY || API_KEY === 'your_gemini_api_key_here') {
    // Demo mode - return placeholder MIDI patterns
    const demoPatterns = {
      chords: [
        { time: 0, name: "Cmaj7", duration: 2, notes: [{ pitch: "C4", midi: 60 }, { pitch: "E4", midi: 64 }, { pitch: "G4", midi: 67 }, { pitch: "B4", midi: 71 }], velocity: 90 },
        { time: 2, name: "Am7", duration: 2, notes: [{ pitch: "A3", midi: 57 }, { pitch: "C4", midi: 60 }, { pitch: "E4", midi: 64 }, { pitch: "G4", midi: 67 }], velocity: 90 },
        { time: 4, name: "Fmaj7", duration: 2, notes: [{ pitch: "F3", midi: 53 }, { pitch: "A3", midi: 57 }, { pitch: "C4", midi: 60 }, { pitch: "E4", midi: 64 }], velocity: 90 },
        { time: 6, name: "G7", duration: 2, notes: [{ pitch: "G3", midi: 55 }, { pitch: "B3", midi: 59 }, { pitch: "D4", midi: 62 }, { pitch: "F4", midi: 65 }], velocity: 90 }
      ],
      bassline: [
        { time: 0, midi: 48, duration: 0.5, velocity: 100, pitch: "C3" },
        { time: 0.5, midi: 48, duration: 0.5, velocity: 80, pitch: "C3" },
        { time: 1, midi: 50, duration: 0.5, velocity: 100, pitch: "D3" },
        { time: 1.5, midi: 52, duration: 0.5, velocity: 90, pitch: "E3" },
        { time: 2, midi: 45, duration: 0.5, velocity: 100, pitch: "A2" },
        { time: 2.5, midi: 45, duration: 0.5, velocity: 80, pitch: "A2" },
        { time: 3, midi: 48, duration: 0.5, velocity: 90, pitch: "C3" },
        { time: 3.5, midi: 50, duration: 0.5, velocity: 85, pitch: "D3" }
      ],
      melody: [
        { time: 0, midi: 72, duration: 0.5, velocity: 95, pitch: "C5" },
        { time: 0.5, midi: 74, duration: 0.5, velocity: 90, pitch: "D5" },
        { time: 1, midi: 76, duration: 1, velocity: 100, pitch: "E5" },
        { time: 2, midi: 69, duration: 0.5, velocity: 95, pitch: "A4" },
        { time: 2.5, midi: 72, duration: 0.5, velocity: 90, pitch: "C5" },
        { time: 3, midi: 74, duration: 1, velocity: 100, pitch: "D5" }
      ],
      drums: {
        kick: [
          { time: 0, duration: 0.1, velocity: 120 },
          { time: 2, duration: 0.1, velocity: 120 },
          { time: 4, duration: 0.1, velocity: 120 },
          { time: 6, duration: 0.1, velocity: 120 }
        ],
        snare: [
          { time: 1, duration: 0.1, velocity: 110 },
          { time: 3, duration: 0.1, velocity: 110 },
          { time: 5, duration: 0.1, velocity: 110 },
          { time: 7, duration: 0.1, velocity: 110 }
        ],
        hihat_closed: [
          { time: 0, duration: 0.1, velocity: 80 },
          { time: 0.5, duration: 0.1, velocity: 70 },
          { time: 1, duration: 0.1, velocity: 80 },
          { time: 1.5, duration: 0.1, velocity: 70 },
          { time: 2, duration: 0.1, velocity: 80 },
          { time: 2.5, duration: 0.1, velocity: 70 },
          { time: 3, duration: 0.1, velocity: 80 },
          { time: 3.5, duration: 0.1, velocity: 70 }
        ]
      }
    };
    
    yield { text: JSON.stringify(demoPatterns, null, 2) };
    return;
  }

  try {
    const prompt = createMidiPrompt(settings);
    const result = await model.generateContentStream(prompt);
    
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      yield { text: chunkText };
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    // Fallback to demo patterns on error
    const fallbackPatterns = {
      chords: [
        { time: 0, name: "C", duration: 2, notes: [{ pitch: "C4", midi: 60 }, { pitch: "E4", midi: 64 }, { pitch: "G4", midi: 67 }], velocity: 90 },
        { time: 2, name: "Am", duration: 2, notes: [{ pitch: "A3", midi: 57 }, { pitch: "C4", midi: 60 }, { pitch: "E4", midi: 64 }], velocity: 90 }
      ],
      error: `API Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
    yield { text: JSON.stringify(fallbackPatterns, null, 2) };
  }
};

function createMidiPrompt(settings: MidiSettings): string {
  return `Generate MIDI patterns for a ${settings.genre} track with the following specifications:

Key: ${settings.key}
Tempo: ${settings.tempo} BPM
Time Signature: ${settings.timeSignature[0]}/${settings.timeSignature[1]}
Chord Progression: ${settings.chordProgression}
Bars: ${settings.bars}
Song Section: ${settings.songSection}
Target Instruments: ${settings.targetInstruments.join(', ')}

Context: ${settings.guidebookContext || 'General musical context'}

Please return a JSON object with the following structure:
{
  "chords": [{"time": 0, "name": "Cmaj7", "duration": 2, "notes": [{"pitch": "C4", "midi": 60}, {"pitch": "E4", "midi": 64}], "velocity": 90}],
  "bassline": [{"time": 0, "midi": 48, "duration": 0.5, "velocity": 100, "pitch": "C3"}],
  "melody": [{"time": 0, "midi": 72, "duration": 0.5, "velocity": 95, "pitch": "C5"}],
  "drums": {
    "kick": [{"time": 0, "duration": 0.1, "velocity": 120}],
    "snare": [{"time": 1, "duration": 0.1, "velocity": 110}],
    "hihat_closed": [{"time": 0, "duration": 0.1, "velocity": 80}]
  }
}

Only include instruments that are in the target instruments list. Make the patterns musically appropriate for the ${settings.genre} genre and ${settings.songSection} section.`;
}
