export type { MidiSettings, GeneratedMidiPatterns } from '../constants/types';

export interface UserInputs {
  songTitle: string;
  genre: string[];
  artistReference: string;
  referenceTrackLink: string;
  lyrics: string;
  key: string;
  scale: string;
  chords: string;
  generalNotes: string;
  vibe: string[];
  daw: string;
  plugins: string;
  availableInstruments: string;
}

export interface GuidebookEntry {
  id: string;
  title: string;
  genre: string[];
  artistReference: string;
  referenceTrackLink: string;
  lyrics: string;
  key: string;
  chords: string;
  generalNotes: string;
  vibe: string[];
  daw: string;
  plugins: string;
  availableInstruments: string;
  content: string;
  createdAt: string;
  midiSettings?: MidiSettings;
  generatedMidiPatterns?: GeneratedMidiPatterns;
}

export interface MixFeedbackInputs {
  audioFile: File | null;
  userNotes: string;
  trackName: string;
  dawName: string;
}

export interface MixCompareInputs {
  mixA: File | null;
  mixB: File | null;
  userNotes: string;
  includeMixBFeedback?: boolean;
}

export type ActiveView = 'landing' | 'trackGuide' | 'eqGuide' | 'remixGuide' | 'patchGuide' | 'mixFeedback';
