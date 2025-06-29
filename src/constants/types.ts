
export interface GuidebookEntry {
  id: string;
  title: string;
  genre: string[];
  artistReference: string;
  referenceTrackLink?: string;
  lyrics?: string;
  key?: string;
  scale?: string;
  chords?: string;
  generalNotes?: string;
  vibe: string[];
  daw: string;
  plugins: string;
  availableInstruments: string;
  content: string;
  createdAt: string;
  midiSettings?: MidiSettings;
  generatedMidiPatterns?: GeneratedMidiPatterns;
}

export interface UserInputs {
  songTitle?: string; // Added songTitle
  genre: string[];
  artistReference: string;
  referenceTrackLink?: string; // New: Reference track via link (YouTube, Spotify, etc.)
  lyrics?: string; // New: Optional lyrics input
  key?: string; // New: Optional key input
  scale?: string; // New: Optional scale/mode input
  chords?: string; // New: Optional chords input
  generalNotes?: string; // New: General notes for AI to consider
  vibe: string[];
  daw: string;
  plugins: string;
  availableInstruments?: string;
}

export interface MidiNote {
  time: number; // Start time in beats (e.g., 0, 0.5, 1, 1.25) relative to the start of its pattern segment
  midi: number; // MIDI note number (for actual MIDI generation)
  duration: number; // Duration in beats
  velocity?: number; // MIDI velocity (0-127), default 100
  pitch?: string; // e.g. "C4", used for display/logging
  name?: string; // For chord display
}

export interface ChordNoteEvent {
  time: number; // Start time in beats
  name: string; // e.g., "Cmaj7"
  duration: number; // Duration in beats
  notes: { pitch: string, midi: number }[]; // e.g. [{pitch: "C4", midi: 60}, ...]
  velocity?: number;
}


export interface DrumHit {
  time: number; // Start time in beats
  duration: number; // Duration in beats
  velocity?: number; // MIDI velocity (0-127)
}

export interface DrumPatternData {
  [drumElement: string]: DrumHit[]; // e.g., "kick": [ {time:0, duration:0.1, velocity:120}, ... ]
}

export interface GeneratedMidiPatterns {
  chords?: ChordNoteEvent[];
  bassline?: MidiNote[];
  melody?: MidiNote[];
  drums?: DrumPatternData;
  error?: string; 
}
export type KeyOfGeneratedMidiPatterns = Exclude<keyof GeneratedMidiPatterns, 'error'>;


export interface MidiSettings {
  key: string;
  scale?: string; // New: Scale/mode selection (relevant to the key)
  tempo: number;
  timeSignature: [number, number];
  chordProgression: string;
  genre: string; // This should ideally be derived from main inputs
  bars: number;
  targetInstruments: string[]; // e.g., ['chords', 'melody', 'drums']
  guidebookContext?: string; // Optional context from the main TrackGuide
  songSection?: string; // Added for selecting song section context
}

// Types for Mix Feedback Feature
export interface MixFeedbackInputs {
  trackName: string;
  focus?: string;
  notes?: string;
  audioFile?: File | null;
  userNotes?: string;
  dawName?: string;
}

export interface MixComparisonInputs {
  mixAFile: string;
  mixBFile: string;
  mixAName: string;
  mixBName: string;
  includeMixBFeedback?: boolean;
  userNotes: string;
  dawName?: string;
}

export interface RemixGuideInputs {
  originalTrackTitle: string;
  targetGenre: string;
  targetKey: string;
  targetTempo: number;
  daw?: string;
  plugins?: string;
  notes?: string;
  audioData?: {
    base64: string;
    mimeType: string;
  };
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export type ActiveView = 'landing' | 'trackGuide' | 'mixFeedback' | 'remixGuide' | 'patchGuide' | 'eqGuide';
