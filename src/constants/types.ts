  export interface GuidebookEntry {
    id: string;
    title: string;
    content: string;
    timestamp: number;
  }

  export interface UserInputs {
    genre: string;
    mood: string;
    tempo: number;
    key: string;
    scale: string;
    instruments: string[];
    description: string;
  }

  export interface MidiNote {
    midi: number;
    time: number;
    duration: number;
    velocity?: number;
  }

  export interface ChordNoteEvent {
    time: number;
    duration: number;
    velocity?: number;
    notes: Array<{ midi: number }>;
  }

  export interface DrumHit {
    time: number;
    duration: number;
    velocity?: number;
  }

  export interface DrumPatternData {
    [drumElement: string]: DrumHit[];
  }

  export interface GeneratedMidiPatterns {
    tempo?: number;
    timeSignature?: string;
    key?: string;
    scale?: string;
    chords?: ChordNoteEvent[];
    bassline?: MidiNote[];
    melody?: MidiNote[];
    drums?: DrumPatternData;
  }

  export interface MidiSettings {
    tempo: number;
    bars: number;
    timeSignature: [number, number];
  }

  export type KeyOfGeneratedMidiPatterns = 'chords' | 'bassline' | 'melody' | 'drums';

  // Types for Mix Feedback Feature
  export interface MixFeedbackInputs {
    audioFile?: File;
    description: string;
    focusAreas: string[];
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

  export type ActiveView = 'guidebook' | 'midi' | 'patch' | 'eq' | 'mix';
