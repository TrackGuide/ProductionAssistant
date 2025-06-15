export const GEMINI_MODEL_NAME = "gemini-2.5-flash-preview-04-17";
export const APP_TITLE = "TrackGuide";
export const LOCAL_STORAGE_KEY = "songGuidebookLibrary";
export const LAST_USED_DAW_KEY = "trackGuideLastUsedDAW";
export const LAST_USED_PLUGINS_KEY = "trackGuideLastUsedPlugins";

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

export const VIBE_SUGGESTIONS = [
  "Dark", "Atmospheric", "Energetic", "Uplifting", "Chill", "Relaxed", "Experimental", "Trippy",
  "Nostalgic", "Retro", "Aggressive", "Intense", "Melancholic", "Introspective", "Funky", "Groovy",
  "Mysterious", "Eerie", "Euphoric", "Anthemic", "Dreamy", "Ethereal", "Raw", "Gritty", 
  "Sophisticated", "Smooth", "Cyberpunk", "Futuristic", "Hypnotic", "Driving", "Industrial", "Mechanical",
  "Hopeful", "Aggressive", "Peaceful", "Romantic", "Sad", "Joyful", "Tense"
];

export const DAW_SUGGESTIONS = [
    "Ableton Live", "Logic Pro X", "FL Studio", "Pro Tools", "Cubase", "Studio One", "Reason", "Bitwig Studio", "Reaper", "GarageBand"
];

// MIDI Related Constants

export const MIDI_SCALES = [
  'C Major', 'G Major', 'D Major', 'A Major', 'E Major', 'B Major', 'F# Major', 'C# Major',
  'F Major', 'Bb Major', 'Eb Major', 'Ab Major', 'Db Major', 'Gb Major', 'Cb Major',
  'A Minor', 'E Minor', 'B Minor', 'F# Minor', 'C# Minor', 'G# Minor', 'D# Minor', 'A# Minor',
  'D Minor', 'G Minor', 'C Minor', 'F Minor', 'Bb Minor', 'Eb Minor', 'Ab Minor',
];

export const MIDI_TIME_SIGNATURES: Array<[number, number]> = [[4, 4], [3, 4], [6, 8], [2, 4], [5, 4], [7, 8]];

export const MIDI_TARGET_INSTRUMENTS = [
  { id: 'chords', label: 'Chords' },
  { id: 'bassline', label: 'Bassline' },
  { id: 'melody', label: 'Melody' },
  { id: 'drums', label: 'Drums' },
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
  songSection: 'General Loop', // Default song section
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
  // Add more from GENRE_SUGGESTIONS where applicable
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
  'Dubstep': [130, 150], // Or 65-75 if half-time
  'Trap (EDM)': [130, 160], // Or 65-80 if half-time
  'Hip Hop': [80, 110],
  'Lo-fi Hip Hop': [70, 90],
  'R&B': [60, 100],
  'Folk': [80, 120],
  'Jazz': [70, 180], // Highly variable
  'Blues': [70, 130],
  'Default': [60, 200]
  // Add more
};

// General MIDI Drum Map (MIDI note numbers)
export const MIDI_DRUM_MAP: { [key: string]: number } = {
  // Pitched based on common naming in DAWs/AI output
  'kick': 36,        // Acoustic Bass Drum / Bass Drum 1
  'snare': 38,       // Acoustic Snare / Snare Drum 1
  'hihat_closed': 42,// Closed Hi-Hat
  'closed_hihat': 42,
  'hihat_open': 46,  // Open Hi-Hat
  'open_hihat': 46,
  'tom_low': 41,     // Low Floor Tom
  'low_tom': 41,
  'tom_mid': 47,     // Low-Mid Tom
  'mid_tom': 47,
  'tom_high': 50,    // High Tom
  'high_tom': 50,
  'crash_cymbal_1': 49,// Crash Cymbal 1
  'crash': 49,
  'ride_cymbal_1': 51, // Ride Cymbal 1
  'ride': 51,
  'clap': 39,        // Hand Clap
  'shaker': 70,      // Shaker (Maracas is 70, Shaker is often this or similar)
  'tambourine': 54,  // Tambourine
  'rim_shot': 37,    // Side Stick / Rim Shot
  'cowbell': 56,     // Cowbell
  // Common variants
  'bass_drum': 36,
  'snare_drum': 38,
};