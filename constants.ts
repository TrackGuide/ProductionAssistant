// src/constants.ts

/**
 * Name of the Gemini model to use for AI content generation.
 * Can be overridden via the GEMINI_MODEL_NAME or VITE_GEMINI_MODEL_NAME environment variable.
 * Defaults to 'gemini-2.0-flash-exp'.
 */
export const GEMINI_MODEL_NAME =
  (typeof process !== 'undefined' && process.env.GEMINI_MODEL_NAME) ||
  (typeof import.meta !== 'undefined' && import.meta.env.VITE_GEMINI_MODEL_NAME) ||
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
export const GENRE_SUGGESTIONS = [
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
  'Pop': ['I-V-vi-IV', 'vi-IV-I-V', 'I-IV-V-I', 'I-vi-IV-V', 'ii-V-I-IV'],
  'Indie Pop': ['I-V-vi-IV', 'I-IV-vi-V', 'vi-IV-I-V', 'I-iii-IV-V'],
  'Synth-Pop': ['i-VI-III-VII (minor)', 'I-V-vi-IV (major)', 'i-iv-v-VI (minor)', 'I-IV-ii-V (major)'],
  'Rock': ['I-IV-V', 'vi-IV-I-V', 'I-bVII-IV-I', 'i-VI-III-VII (minor)', 'I-V-IV-I'],
  'Alternative Rock': ['vi-IV-I-V', 'I-V-vi-IV', 'i-VI-III-VII', 'I-IV-ii-V'],
  'House': ['Am-G-C-F', 'i-VI-III-VII (Am-F-C-G)', 'i-III-VI-VII', 'i-v-iv-i'],
  'Deep House': ['i-VI-III-VII (e.g. Dm-Bb-F-C)', 'Am-G-C-F', 'i-iv-v-i'],
  'Techno': ['i-VI-III-VII', 'i-iv-v-i (minor, repetitive)', 'Single chord drone with variations', 'Am-G-F-E'],
  'Trance': ['vi-IV-I-V (Am-F-C-G)', 'i-VI-III-VII', 'i-VII-VI-V (minor descending)'],
  'Ambient': ['Imaj7-IVmaj7 (long, evolving)', 'i-VI (slow changes)', 'Drone + suspended chords'],
  'Synthwave': ['i-VI-III-VII (Am-F-C-G)', 'vi-IV-I-V', 'I-V-vi-IV', 'i-iv-v-i'],
  'Drum and Bass': ['i-VI-III-VII', 'Am-F-C-G', 'Complex jazz voicings over two chords', 'i-iv-v-VI'],
  'Dubstep': ['i-VI-III-VII', 'i-iv-v-i (minor)', 'Heavy focus on sound design over complex progression'],
  'Trap (EDM)': ['i-VI-III-VII', 'i-iv-v-i (minor)', 'Simple 2 or 3 chord loops'],
  'Hip Hop': ['i-VI-III-VII', 'Am-G-Em-F', 'ii-V-I (Jazz influenced)', 'i-iv-v-i', 'Sample-based loops'],
  'Lo-fi Hip Hop': ['ii-V-I-IV (Jazz)', 'Imaj7-vi7-ii7-V7', 'Simple 2-4 chord loops'],
  'R&B': ['Imaj7-IVmaj7', 'ii-V-I', 'i-VI-III-VII', 'vi-ii-V-I'],
  'Folk': ['I-IV-V', 'I-V-vi-IV', 'G-C-D-G', 'C-G-Am-F'],
  'Jazz': ['ii-V-I', 'I-vi-ii-V', 'iii-vi-ii-V', 'I-II7-V7-I (Rhythm Changes A section)', 'Imaj7-IIm7-IIIm7-IVmaj7 (Modal)'],
  'Blues': ['I-I-I-I-IV-IV-I-I-V-IV-I-I (12-bar)', 'i-i-i-i-iv-iv-i-i-v-iv-i-i (minor 12-bar)'],
  'Default': ['I-V-vi-IV', 'i-VI-III-VII', 'I-IV-V-I', 'ii-V-I']
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
  // Variants
  'bass_drum': 36,
  'snare_drum': 38
};

// --- Patch Guide input categories for robust UI ---
export const PATCH_INPUT_CATEGORIES = [
  {
    category: "Genre",
    key: "genre",
    examples: [
      { subCategory: "Electronic - Dance", examples: ["Techno", "House", "Trance", "Dubstep", "Drum & Bass", "IDM", "Breakbeat", "Jungle", "Hardstyle", "Gabber", "Psytrance", "Progressive House", "Deep House", "Tech House", "Afro House", "Electro", "Future Bass", "Trap (EDM)", "Minimal Techno", "Acid House", "UK Garage", "Grime", "Footwork"] },
      { subCategory: "Electronic - Chill & Ambient", examples: ["Synthwave", "Lofi", "Ambient", "Downtempo", "Chillout", "Vaporwave", "New Age", "Berlin School"] },
      { subCategory: "Electronic - Experimental & Industrial", examples: ["Glitch", "EBM", "Industrial", "Darkwave", "Noise"] },
      { subCategory: "Rock & Alternative", examples: ["Rock", "Post-Punk", "Shoegaze", "Krautrock", "Goth", "Space Rock", "Drone Metal"] },
      { subCategory: "Pop, Funk, Soul & Hip Hop", examples: ["Funk", "Pop", "Soul", "R&B", "New Wave", "Synth-Pop", "Disco", "Hyperpop", "Hip Hop"] },
      { subCategory: "Jazz, World & Reggae", examples: ["Reggae", "Dub", "Jazz Fusion", "Smooth Jazz", "Folk-Tronic", "World Music", "Afrobeat"] },
      { subCategory: "Cinematic, Scores & Abstract", examples: ["Cinematic", "Experimental", "Video Game Score", "Chiptune", "SFX for Film"] }
    ]
  },
  { category: "Voice Type", key: "voiceType", examples: ["Lead", "Pad", "Bass", "Pluck", "Bell", "Arp", "FX", "Drone", "Wobble", "Stab", "Texture", "Atmosphere", "Riser", "Impact"] },
  { category: "Timbre/Character", key: "timbre", examples: ["Glassy", "Warm", "Bright", "Dark", "Metallic", "Wooden", "Raspy", "Smooth", "Gritty", "Fuzzy", "Distorted", "Clean", "Hollow", "Resonant", "Breathy", "Digital", "Analog", "Noisy", "Sharp", "Dull", "Crisp"] },
  { category: "Movement/Evolution", key: "movement", examples: ["Evolving", "Swells", "Pulsing", "Rhythmic", "Static", "Sweeping", "Morphing", "Glitchy", "Choppy", "Fluttering", "Driving", "Floating", "Warped", "Phasing"] },
  { category: "Emotion/Mood", key: "mood", examples: ["Dreamy", "Aggressive", "Melancholic", "Uplifting", "Eerie", "Serene", "Tense", "Playful", "Mysterious", "Epic", "Dark", "Brooding", "Anxious", "Joyful", "Haunting", "Sacred"] },
  { category: "Era/Style", key: "era", examples: ["Vintage", "Modern", "80s", "90s", "Futuristic", "Retro", "Old-School", "Contemporary", "Y2K", "Cyberpunk"] },
  { category: "Inspiration/Concept", key: "inspiration", examples: ["Cosmic", "Underwater", "Robotic", "Alien", "Nature", "Industrial", "Organic", "Mechanical", "Spiritual", "Abstract", "Forest", "Cave", "Machine", "Ghost", "Desert", "Arctic", "Volcanic"] },
  { category: "Dynamics/Envelope Shape", key: "dynamics", examples: ["Short", "Long", "Percussive", "Sustained", "Slow Attack", "Fast Release", "Gated", "Punchy", "Clicky", "Decaying"] }
];

export const SYNTH_OPTIONS = [
  'Xfer Serum',
  'Vital',
  'Pigments',
  'Native Instruments Massive',
  'Native Instruments Massive X',
  'Diva',
  'Hive 2',
  'Sylenth1',
  'Korg Wavestate',
  'Roland Jupiter-8',
  'Roland Juno-106',
  'Roland SH-101',
  'Ableton Operator',
  'Ableton Wavetable',
  'Apple Retro Synth',
  'Apple Alchemy',
  'Native Instruments FM8',
  'Kilohearts Phase Plant',
  'Omnisphere',
  'Arturia Analog Lab',
  {
    label: 'General',
    options: [
      { value: 'Generic Synth', label: 'Generic Synth' }
    ]
  },
  'TAL TAL-U-No-LX',
  'u-he Repro-5',
  'u-he Repro-1',
  'Native Instruments Monark',
  'Bazille',
  'Zebra2',
  'Arturia PolyBrute',
  'Moog Minimoog',
  'DiscoDSP OB-Xd',
  'Korg MS-20'
];
