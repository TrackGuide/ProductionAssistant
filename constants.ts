// src/constants.ts

/**
 * Name of the Gemini model to use for AI content generation.
 * Can be overridden via the GEMINI_MODEL_NAME or VITE_GEMINI_MODEL_NAME environment variable.
 * Defaults to 'gemini-2.0-flash-exp'.
 */
export const GEMINI_MODEL_NAME =
  (typeof process !== 'undefined' && process.env.GEMINI_MODEL_NAME) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env.VITE_GEMINI_MODEL_NAME) ||
  'gemini-2.0-flash-exp';

/**
 * Application-wide constants
 */
export const APP_TITLE = "TrackGuide";
export const LOCAL_STORAGE_KEY = "songGuidebookLibrary";
export const LAST_USED_DAW_KEY = "trackGuideLastUsedDAW";
export const LAST_USED_PLUGINS_KEY = "trackGuideLastUsedPlugins";

/**
 * Genre suggestions for guide creation
 */
// Import from remixGenres for consistency
let genreSuggestions: string[] = [];

try {
  // Try to get the flattened genre list that includes metadata genres
  const { getFlattenedGenreList } = require('./constants/remixGenres');
  genreSuggestions = getFlattenedGenreList();
} catch (error) {
  // Fallback to static list if import fails
  console.warn('Failed to load dynamic genre list, using static list', error);
  genreSuggestions = [
    // Pop & Rock
    "Pop", "Indie Pop", "Synth-Pop", "Rock", "Alternative Rock", "Hard Rock", "Punk Rock", "Post-Punk", "Nu Metal", "Progressive Rock", "Psychedelic Rock", "Folk Rock", "Shoegaze",
    // Electronic
    "House", "Deep House", "Progressive House", "Tech House", "Bass House", "Electro House", "Minimal House",
    "Techno", "Minimal Techno", "Industrial Techno", "Melodic Techno", "Ambient Techno", "Hard Techno",
    "Trance", "Progressive Trance", "Psytrance", "Goa Trance", "Hard Trance",
    "Ambient", "Dark Ambient", "Downtempo", "Chillout", "Chillwave", "Psybient", "Berlin School",
    "Synthwave", "Retrowave", "Darksynth", "Vaporwave", "Future Funk",
    "Drum and Bass", "Jungle", "Liquid DnB", "Neurofunk", "Breakcore",
    "Dubstep", "Riddim", "Future Bass", "Trap (EDM)",
    "Hardstyle", "Gabber", "UK Hardcore",
    "IDM (Intelligent Dance Music)", "Glitch", "Breakbeat", "UK Garage", "2-Step", "Future Garage",
    "EBM (Electronic Body Music)", "Footwork", "Juke",
    // Hip Hop & R&B
    "Hip Hop", "Boom Bap", "Trap", "Lo-fi Hip Hop", "Cloud Rap", "Drill", "Conscious Hip Hop", "R&B", "Contemporary R&B", "Neo-Soul", "Soul",
    // Folk & World
    "Folk", "Acoustic", "World Music", "Reggae", "Dub", "Ska", "Latin", "Afrobeat", "Celtic",
    // Jazz & Blues
    "Jazz", "Smooth Jazz", "Blues", "Funk",
    // Metal (Subgenres)
    "Heavy Metal", "Thrash Metal", "Death Metal", "Black Metal", "Doom Metal", "Metalcore", "Deathcore",
    // Other/Experimental
    "Experimental", "Noise", "Industrial", "Classical Crossover", "Chiptune", "Video Game Music"
  ];
}

export const GENRE_SUGGESTIONS = genreSuggestions;

/**
 * Vibe suggestions for guide creation
 */
export const VIBE_SUGGESTIONS = [
  "Dark", "Atmospheric", "Energetic", "Uplifting", "Chill", "Relaxed", "Experimental", "Trippy",
  "Nostalgic", "Retro", "Aggressive", "Intense", "Melancholic", "Introspective", "Funky", "Groovy",
  "Mysterious", "Eerie", "Euphoric", "Anthemic", "Dreamy", "Ethereal", "Raw", "Gritty",
  "Sophisticated", "Smooth", "Cyberpunk", "Futuristic", "Hypnotic", "Driving", "Industrial", "Mechanical",
  "Hopeful", "Aggressive", "Peaceful", "Romantic", "Sad", "Joyful", "Tense"
];

/**
 * DAW suggestions for guide creation
 */
export const DAW_SUGGESTIONS = [
  "Ableton Live", "Logic Pro X", "FL Studio", "Pro Tools", "Cubase", "Studio One", "Reason", "Bitwig Studio", "Reaper", "GarageBand"
];

// MIDI Related Constants
export const MIDI_SCALES = [
  'C Major', 'G Major', 'D Major', 'A Major', 'E Major', 'B Major', 'F# Major', 'C# Major',
  'F Major', 'Bb Major', 'Eb Major', 'Ab Major', 'Db Major', 'Gb Major', 'Cb Major',
  'A Minor', 'E Minor', 'B Minor', 'F# Minor', 'C# Minor', 'G# Minor', 'D# Minor', 'A# Minor',
  'D Minor', 'G Minor', 'C Minor', 'F Minor', 'Bb Minor', 'Eb Minor', 'Ab Minor'
];

export const MIDI_MODES: { [key: string]: string[] } = {
  'C': ['Ionian (Major)', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Aeolian (Natural Minor)', 'Locrian'],
  'C#': ['Ionian (Major)', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Aeolian (Natural Minor)', 'Locrian'],
  'Db': ['Ionian (Major)', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Aeolian (Natural Minor)', 'Locrian'],
  'D': ['Ionian (Major)', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Aeolian (Natural Minor)', 'Locrian'],
  'D#': ['Ionian (Major)', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Aeolian (Natural Minor)', 'Locrian'],
  'Eb': ['Ionian (Major)', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Aeolian (Natural Minor)', 'Locrian'],
  'E': ['Ionian (Major)', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Aeolian (Natural Minor)', 'Locrian'],
  'F': ['Ionian (Major)', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Aeolian (Natural Minor)', 'Locrian'],
  'F#': ['Ionian (Major)', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Aeolian (Natural Minor)', 'Locrian'],
  'Gb': ['Ionian (Major)', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Aeolian (Natural Minor)', 'Locrian'],
  'G': ['Ionian (Major)', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Aeolian (Natural Minor)', 'Locrian'],
  'G#': ['Ionian (Major)', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Aeolian (Natural Minor)', 'Locrian'],
  'Ab': ['Ionian (Major)', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Aeolian (Natural Minor)', 'Locrian'],
  'A': ['Ionian (Major)', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Aeolian (Natural Minor)', 'Locrian'],
  'A#': ['Ionian (Major)', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Aeolian (Natural Minor)', 'Locrian'],
  'Bb': ['Ionian (Major)', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Aeolian (Natural Minor)', 'Locrian'],
  'B': ['Ionian (Major)', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Aeolian (Natural Minor)', 'Locrian'],
  'Cb': ['Ionian (Major)', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Aeolian (Natural Minor)', 'Locrian']
};

export const MIDI_TIME_SIGNATURES: Array<[number, number]> = [[4, 4], [3, 4], [6, 8], [2, 4], [5, 4], [7, 8]];

export const MIDI_TARGET_INSTRUMENTS = [
  { id: 'chords', label: 'Chords' },
  { id: 'bassline', label: 'Bassline' },
  { id: 'melody', label: 'Melody' },
  { id: 'drums', label: 'Drums' }
];

export const MIDI_SONG_SECTIONS = [
  "General Loop", "Intro", "Verse", "Pre-Chorus", "Chorus", "Post-Chorus", "Bridge", "Solo", "Breakdown", "Drop", "Outro", "Fill"
];

export const MIDI_DEFAULT_SETTINGS = {
  key: 'C Major',
  tempo: 120,
  timeSignature: [4, 4] as [number, number],
  chordProgression: 'I-V-vi-IV',
  genre: 'Pop',
  bars: 8,
  targetInstruments: ['chords', 'bassline', 'melody', 'drums'],
  guidebookContext: '',
  songSection: 'General Loop'
};

export const MIDI_CHORD_PROGRESSIONS: { [genre: string]: string[] } = {
  'Pop': ['I-V-vi-IV', 'vi-IV-I-V', 'I-IV-V-I', 'I-vi-IV-V', 'ii-V-I-IV', 'vi-ii-V-I', 'I-iii-vi-V'],
  'Indie Pop': ['I-V-vi-IV', 'I-IV-vi-V', 'vi-IV-I-V', 'I-iii-IV-V', 'vi-ii-V-I', 'I-vi-ii-V'],
  'Synth-Pop': ['i-VI-III-VII', 'I-V-vi-IV', 'i-iv-v-VI', 'I-IV-ii-V', 'vi-IV-I-V', 'i-VII-VI-V'],
  'Rock': ['I-IV-V', 'vi-IV-I-V', 'I-bVII-IV-I', 'i-VI-III-VII', 'I-V-IV-I', 'vi-ii-V-I', 'I-IV-V-vi'],
  'Alternative Rock': ['vi-IV-I-V', 'I-V-vi-IV', 'i-VI-III-VII', 'I-IV-ii-V', 'I-bVII-IV-I', 'vi-ii-V-I'],
  'Hard Rock': ['I-IV-V', 'i-VI-III-VII', 'I-bVII-IV-I', 'i-iv-v-i', 'vi-IV-I-V', 'I-V-IV-I'],
  'Punk Rock': ['I-IV-V', 'vi-IV-I-V', 'I-V-vi-IV', 'I-bVII-IV-I', 'i-iv-v-i'],
  'House': ['i-VI-III-VII', 'Am-G-C-F', 'i-III-VI-VII', 'i-v-iv-i', 'vi-IV-I-V', 'i-VII-VI-V'],
  'Deep House': ['i-VI-III-VII', 'Am-G-C-F', 'i-iv-v-i', 'vi-ii-V-I', 'i-VII-VI-V', 'Dm-Bb-F-C'],
  'Progressive House': ['i-VI-III-VII', 'vi-IV-I-V', 'i-iv-v-VI', 'Am-F-C-G', 'i-VII-VI-V'],
  'Tech House': ['i-VI-III-VII', 'i-iv-v-i', 'Am-G-F-E', 'i-III-VI-VII', 'vi-IV-I-V'],
  'Techno': ['i-VI-III-VII', 'i-iv-v-i', 'Am-G-F-E', 'i-III-VI-VII', 'i-VII-VI-V', 'Drone + variations'],
  'Minimal Techno': ['i-iv-v-i', 'Am-G-F-E', 'i-VI-III-VII', 'Single chord drone', 'i-VII-VI-V'],
  'Trance': ['i-VI-III-VII', 'vi-IV-I-V', 'i-VII-VI-V', 'Am-F-C-G', 'i-iv-v-VI', 'vi-ii-V-I'],
  'Progressive Trance': ['i-VI-III-VII', 'vi-IV-I-V', 'i-iv-v-VI', 'Am-F-C-G', 'vi-ii-V-I'],
  'Ambient': ['Imaj7-IVmaj7', 'i-VI', 'Drone + sus chords', 'vi-IV-I-V', 'Am-F-C-G', 'Cmaj7-Fmaj7-Am7-Dm7'],
  'Dark Ambient': ['i-iv-v-i', 'Am-Dm-Em-Am', 'i-VI-III-VII', 'Drone + minor variations'],
  'Synthwave': ['i-VI-III-VII', 'vi-IV-I-V', 'I-V-vi-IV', 'i-iv-v-i', 'Am-F-C-G', 'i-VII-VI-V'],
  'Retrowave': ['i-VI-III-VII', 'vi-IV-I-V', 'I-V-vi-IV', 'Am-F-C-G', 'i-iv-v-VI'],
  'Darksynth': ['i-VI-III-VII', 'i-iv-v-i', 'Am-G-F-E', 'i-VII-VI-V', 'vi-IV-I-V'],
  'Vaporwave': ['Imaj7-IVmaj7', 'vi-IV-I-V', 'I-V-vi-IV', 'Cmaj7-Fmaj7-Am7-Dm7', 'ii-V-I-IV'],
  'Drum and Bass': ['i-VI-III-VII', 'Am-F-C-G', 'ii-V-I-IV', 'i-iv-v-VI', 'Complex jazz voicings'],
  'Liquid DnB': ['ii-V-I-IV', 'Imaj7-vi7-ii7-V7', 'i-VI-III-VII', 'Am-F-C-G', 'vi-ii-V-I'],
  'Neurofunk': ['i-VI-III-VII', 'i-iv-v-i', 'Am-G-F-E', 'Complex chromatic progressions'],
  'Breakcore': ['i-VI-III-VII', 'Complex atonal progressions', 'i-iv-v-i', 'Chaotic harmonic structures'],
  'Dubstep': ['i-VI-III-VII', 'i-iv-v-i', 'Am-G-F-E', 'Simple 2-3 chord loops', 'vi-IV-I-V'],
  'Riddim': ['i-VI-III-VII', 'i-iv-v-i', 'Am-G-F-E', 'Simple repetitive loops'],
  'Future Bass': ['I-V-vi-IV', 'vi-IV-I-V', 'i-VI-III-VII', 'I-iii-vi-V', 'vi-ii-V-I'],
  'Trap (EDM)': ['i-VI-III-VII', 'i-iv-v-i', 'Am-G-F-E', 'vi-IV-I-V', 'Simple 2-3 chord loops'],
  'Hip Hop': ['i-VI-III-VII', 'Am-G-Em-F', 'ii-V-I', 'i-iv-v-i', 'Sample-based loops', 'vi-IV-I-V'],
  'Boom Bap': ['ii-V-I', 'i-VI-III-VII', 'Am-G-Em-F', 'Sample-based progressions', 'i-iv-v-i'],
  'Trap': ['i-VI-III-VII', 'i-iv-v-i', 'Am-G-F-E', 'vi-IV-I-V', 'Simple minor progressions'],
  'Lo-fi Hip Hop': ['ii-V-I-IV', 'Imaj7-vi7-ii7-V7', 'I-V-vi-IV', 'vi-ii-V-I', 'Cmaj7-Am7-Dm7-G7'],
  'Cloud Rap': ['i-VI-III-VII', 'vi-IV-I-V', 'I-V-vi-IV', 'Atmospheric progressions', 'Am-F-C-G'],
  'Drill': ['i-VI-III-VII', 'i-iv-v-i', 'Am-G-F-E', 'Dark minor progressions', 'vi-IV-I-V'],
  'R&B': ['Imaj7-IVmaj7', 'ii-V-I', 'i-VI-III-VII', 'vi-ii-V-I', 'I-iii-vi-V', 'Cmaj7-Fmaj7-Am7-Dm7'],
  'Contemporary R&B': ['Imaj7-IVmaj7', 'vi-ii-V-I', 'I-iii-vi-V', 'ii-V-I-IV', 'I-V-vi-IV'],
  'Neo-Soul': ['ii-V-I', 'Imaj7-vi7-ii7-V7', 'i-VI-III-VII', 'Complex jazz progressions', 'vi-ii-V-I'],
  'Soul': ['I-IV-V', 'ii-V-I', 'I-vi-IV-V', 'vi-IV-I-V', 'I-V-vi-IV'],
  'Folk': ['I-IV-V', 'I-V-vi-IV', 'G-C-D-G', 'C-G-Am-F', 'vi-IV-I-V', 'I-vi-IV-V'],
  'Acoustic': ['I-V-vi-IV', 'I-IV-V', 'vi-IV-I-V', 'G-C-D-G', 'C-G-Am-F', 'I-vi-IV-V'],
  'Jazz': ['ii-V-I', 'I-vi-ii-V', 'iii-vi-ii-V', 'I-II7-V7-I', 'Imaj7-IIm7-IIIm7-IVmaj7', 'vi-ii-V-I'],
  'Smooth Jazz': ['ii-V-I', 'Imaj7-vi7-ii7-V7', 'I-vi-ii-V', 'vi-ii-V-I', 'iii-vi-ii-V'],
  'Blues': ['I-I-I-I-IV-IV-I-I-V-IV-I-I', 'i-i-i-i-iv-iv-i-i-v-iv-i-i', 'I-IV-V', 'i-iv-v'],
  'Funk': ['ii-V-I', 'I-IV-V', 'i-iv-v-i', 'vi-ii-V-I', 'I7-IV7-V7', 'Dominant 7th progressions'],
  'Heavy Metal': ['i-VI-III-VII', 'i-iv-v-i', 'I-bVII-IV-I', 'vi-IV-I-V', 'i-VII-VI-V'],
  'Thrash Metal': ['i-VI-III-VII', 'i-iv-v-i', 'I-bVII-IV-I', 'Fast chromatic progressions'],
  'Death Metal': ['i-iv-v-i', 'i-VI-III-VII', 'Chromatic progressions', 'Complex atonal structures'],
  'Black Metal': ['i-iv-v-i', 'i-VI-III-VII', 'i-VII-VI-V', 'Atmospheric minor progressions'],
  'Doom Metal': ['i-iv-v-i', 'i-VI-III-VII', 'i-VII-VI-V', 'Slow minor progressions'],
  'Metalcore': ['i-VI-III-VII', 'vi-IV-I-V', 'i-iv-v-i', 'I-bVII-IV-I', 'vi-ii-V-I'],
  'Deathcore': ['i-iv-v-i', 'i-VI-III-VII', 'Chromatic breakdowns', 'Complex atonal progressions'],
  'Experimental': ['Atonal progressions', 'Extended harmony', 'Microtonal scales', 'Non-traditional structures'],
  'Noise': ['Atonal clusters', 'Non-harmonic structures', 'Dissonant progressions', 'Experimental harmony'],
  'Industrial': ['i-iv-v-i', 'i-VI-III-VII', 'Power chord progressions', 'Mechanical repetition'],
  'Chiptune': ['I-V-vi-IV', 'i-VI-III-VII', 'vi-IV-I-V', 'Classic video game progressions', 'I-iii-vi-V'],
  'Video Game Music': ['I-V-vi-IV', 'i-VI-III-VII', 'vi-IV-I-V', 'Adventure progressions', 'I-iii-vi-V'],
  'Default': ['I-V-vi-IV', 'i-VI-III-VII', 'I-IV-V-I', 'vi-IV-I-V', 'ii-V-I', 'I-iii-vi-V']
};

export const MIDI_TEMPO_RANGES: { [genre: string]: [number, number] } = {
  'Pop': [90, 130],
  'Indie Pop': [100, 140],
  'Synth-Pop': [110, 140],
  'Rock': [100, 160],
  'Alternative Rock': [90, 150],
  'House': [118, 128],
  'Deep House': [115, 125],
  'Techno': [125, 145],
  'Trance': [130, 145],
  'Ambient': [50, 100],
  'Synthwave': [80, 120],
  'Drum and Bass': [160, 180],
  'Dubstep': [130, 150],
  'Trap (EDM)': [130, 160],
  'Hip Hop': [80, 110],
  'Lo-fi Hip Hop': [70, 90],
  'R&B': [60, 100],
  'Folk': [80, 120],
  'Jazz': [70, 180],
  'Blues': [70, 130],
  'Default': [60, 200]
};

export const MIDI_DRUM_MAP: { [key: string]: number } = {
  'kick': 36,        // Acoustic Bass Drum / Bass Drum 1
  'snare': 38,       // Acoustic Snare / Snare Drum 1
  'hihat_closed': 42,// Closed Hi-Hat
  'open_hihat': 46,  // Open Hi-Hat
  'tom_low': 41,     // Low Floor Tom
  'tom_mid': 47,     // Low-Mid Tom
  'tom_high': 50,    // High Tom
  'crash_cymbal_1': 49,// Crash Cymbal 1
  'ride_cymbal_1': 51, // Ride Cymbal 1
  'clap': 39,        // Hand Clap
  'shaker': 70,      // Shaker
  'tambourine': 54,  // Tambourine
  'rim_shot': 37,    // Side Stick / Rim Shot
  'cowbell': 56,     // Cowbell
  // Variants and aliases
  'bass_drum': 36,
  'snare_drum': 38,
  'closed_hihat': 42,
  'hihat': 42,
  'crash': 49,
  'ride': 51
};

// --- Patch Guide input categories for robust UI ---
export const PATCH_INPUT_CATEGORIES = [
  { 
    category: "Genre", 
    key: "genre", 
    examples: [
      "Techno", "House", "Trance", "Dubstep", "Drum & Bass", "Synthwave", "Ambient", 
      "Industrial", "Rock", "Pop", "Hip Hop", "R&B", "Jazz", "Experimental", 
      "Cinematic", "Video Game Score", "Chiptune"
    ]
  },
  { 
    category: "Voice Type", 
    key: "voiceType", 
    examples: [
      "Lead", "Pad", "Bass", "Pluck", "Arp", "FX", "Drone", "Texture", 
      "Atmosphere", "Riser", "Impact", "Chord", "Stab"
    ]
  },
  { 
    category: "Style & Mood", 
    key: "styleMood", 
    examples: [
      "Warm", "Bright", "Dark", "Metallic", "Analog", "Digital", "Dreamy", 
      "Aggressive", "Mysterious", "Epic", "Punchy", "Floating", "Gritty", 
      "Clean", "Organic", "Mechanical", "Futuristic", "Retro", "Cyberpunk"
    ]
  },
  { 
    category: "Dynamics & Movement", 
    key: "dynamicsMovement", 
    examples: [
      "Evolving", "Pulsating", "Static", "Rhythmic", "Flowing", "Choppy", 
      "Breathing", "Morphing", "Swelling", "Pounding", "Cascading", "Trembling",
      "Wobbling", "Shifting", "Undulating", "Building", "Fading", "Stuttering"
    ]
  }
];

// Synth options have been moved to synthesisTypes.ts
// Use MODEL_OVERRIDES and getModelsByType() to get synth models
