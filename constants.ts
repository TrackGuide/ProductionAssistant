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
 * Genre suggestions for guide creation - Static list since dynamic loading is causing issues in the browser
 */
export const GENRE_SUGGESTIONS: string[] = [
  // Pop & Rock
  "Pop", "Indie Pop", "Synth-Pop", "Rock", "Alternative Rock", "Hard Rock", "Punk Rock", "Post-Punk", "Nu Metal", "Progressive Rock", "Psychedelic Rock", "Folk Rock", "Shoegaze",
  // Electronic
  "House", "Deep House", "Progressive House", "Tech House", "Bass House", "Electro House", "Minimal House",
  "Techno", "Minimal Techno", "Industrial Techno", "Melodic Techno", "Ambient Techno", "Hard Techno",
  "Trance", "Progressive Trance", "Psytrance", "Goa Trance", "Hard Trance",
  "Dubstep", "Brostep", "Future Bass", "Trap", "Wave", "Witch House", "Hardstyle", "Hardcore", "Gabber",
  "Breakbeat", "Big Beat", "Trip Hop", "Acid", "IDM", "Glitch", "Ambient", "Dark Ambient", "Downtempo", "Chillout", "Chillwave", "Psybient", "Berlin School",
  "Synthwave", "Retrowave", "Darksynth", "Vaporwave", "Future Funk",
  "Drum and Bass", "Jungle", "Liquid DnB", "Neurofunk", "Jump Up", "Darkstep",
  "UK Garage", "2-Step", "Future Garage", "Bassline", "Grime", "UK Drill", "Footwork", "Juke",
  "Electro", "Electro Funk", "Miami Bass", "Freestyle", "Electroclash",
  // Hip Hop & R&B
  "Hip Hop", "Trap Rap", "Cloud Rap", "Boom Bap", "Gangsta Rap", "Alternative Hip Hop", "Lofi Hip Hop",
  "R&B", "Neo Soul", "Future R&B", "Soul", "Funk", "Disco", "Motown",
  // Pop & Mainstream
  "Pop", "Electropop", "Dance Pop", "Synthpop", "K-Pop", "J-Pop", "Euro-Dance",
  "Latin", "Reggaeton", "Dembow", "Dancehall", "Afrobeats", "Soca",
  // Rock & Metal
  "Rock", "Indie Rock", "Post-Rock", "Alternative", "Punk", "Metal", "Death Metal", "Black Metal", "Metalcore", "Grindcore",
  // Classical & Jazz
  "Classical", "Neoclassical", "Orchestral", "Film Score", "Jazz", "Swing", "Bebop", "Fusion", "Blues",
  // Folk & World
  "Folk", "Country", "Bluegrass", "World", "Celtic", "Reggae", "Dub", "Ska"
];

/**
 * Vibe suggestions for guide creation
 */
export const VIBE_SUGGESTIONS: string[] = [
  // Emotional Vibes
  "Happy", "Uplifting", "Euphoric", "Melancholic", "Sad", "Emotional", "Nostalgic", "Romantic", "Sentimental", 
  "Angry", "Aggressive", "Dark", "Intense", "Introspective", "Contemplative", "Reflective", "Dreamy",
  
  // Energy Vibes
  "Energetic", "High Energy", "Powerful", "Epic", "Anthemic", "Driving", "Dynamic", "Bouncy", "Groovy",
  "Relaxed", "Chill", "Laid Back", "Smooth", "Mellow", "Calm", "Peaceful", "Gentle", "Soothing",
  
  // Atmosphere Vibes
  "Atmospheric", "Ambient", "Spacey", "Ethereal", "Cinematic", "Dramatic", "Futuristic", "Retro", "Vintage",
  "Hypnotic", "Trippy", "Psychedelic", "Surreal", "Mysterious", "Spooky", "Haunting", "Eerie",
  
  // Mood Vibes
  "Playful", "Quirky", "Whimsical", "Fun", "Carefree", "Sunny", "Summery", "Tropical", "Beachy",
  "Cool", "Sophisticated", "Sleek", "Moody", "Gritty", "Raw", "Edgy", "Underground", "Alternative",
  
  // Production Vibes
  "Minimalist", "Glitchy", "Experimental", "Lofi", "Hifi", "Clean", "Polished", "Crisp", "Warm", 
  "Analog", "Digital", "Distorted", "Saturated", "Compressed", "Spacious", "Deep", "Heavy", "Light"
];

/**
 * DAW suggestions
 */
export const DAW_SUGGESTIONS: string[] = [
  "Ableton Live", "FL Studio", "Logic Pro", "Pro Tools", "Cubase", "Studio One", "Bitwig Studio", 
  "Reason", "Reaper", "GarageBand", "Maschine", "Digital Performer", "Cakewalk", "Nuendo", "Ardour"
];

/**
 * MIDI drum mapping
 */
export const MIDI_DRUM_MAP: { [key: string]: number } = {
  // Standard GM Drum Mapping
  "kick": 36,
  "bass_drum": 36,
  "kick_drum": 36,
  "bd": 36,
  
  "snare": 38,
  "snare_drum": 38,
  "sd": 38,
  
  "clap": 39,
  "hand_clap": 39,
  
  "rim": 37,
  "rimshot": 37,
  "side_stick": 37,
  
  "hihat_closed": 42,
  "closed_hihat": 42,
  "closed_hh": 42,
  "hh_closed": 42,
  
  "hihat_open": 46,
  "open_hihat": 46,
  "open_hh": 46,
  "hh_open": 46,
  
  "hihat_pedal": 44,
  "pedal_hihat": 44,
  "pedal_hh": 44,
  
  "tom_high": 50,
  "high_tom": 50,
  "tom1": 50,
  
  "tom_mid": 47,
  "mid_tom": 47,
  "tom2": 47,
  
  "tom_low": 45,
  "low_tom": 45,
  "tom3": 45,
  
  "crash_cymbal_1": 49,
  "crash1": 49,
  "crash": 49,
  
  "crash_cymbal_2": 57,
  "crash2": 57,
  
  "ride_cymbal_1": 51,
  "ride1": 51,
  "ride": 51,
  
  "ride_cymbal_2": 59,
  "ride2": 59,
  
  "ride_bell": 53,
  "bell": 53,
  
  "tambourine": 54,
  "tamb": 54,
  
  "cowbell": 56,
  "shaker": 82,
  "maracas": 70,
  
  "conga_high": 62,
  "high_conga": 62,
  "conga_low": 64,
  "low_conga": 64,
  
  "bongo_high": 60,
  "high_bongo": 60,
  "bongo_low": 61,
  "low_bongo": 61
};

/**
 * MIDI note number to note name mapping
 */
export const MIDI_TO_NOTE: { [key: number]: string } = {
  "0": "C-1",
  "1": "C#-1",
  "2": "D-1",
  "3": "D#-1",
  "4": "E-1",
  "5": "F-1",
  "6": "F#-1",
  "7": "G-1",
  "8": "G#-1",
  "9": "A-1",
  "10": "A#-1",
  "11": "B-1",
  "12": "C0",
  "13": "C#0",
  "14": "D0",
  "15": "D#0",
  "16": "E0",
  "17": "F0",
  "18": "F#0",
  "19": "G0",
  "20": "G#0",
  "21": "A0",
  "22": "A#0",
  "23": "B0",
  "24": "C1",
  "25": "C#1",
  "26": "D1",
  "27": "D#1",
  "28": "E1",
  "29": "F1",
  "30": "F#1",
  "31": "G1",
  "32": "G#1",
  "33": "A1",
  "34": "A#1",
  "35": "B1",
  "36": "C2",
  "37": "C#2",
  "38": "D2",
  "39": "D#2",
  "40": "E2",
  "41": "F2",
  "42": "F#2",
  "43": "G2",
  "44": "G#2",
  "45": "A2",
  "46": "A#2",
  "47": "B2",
  "48": "C3",
  "49": "C#3",
  "50": "D3",
  "51": "D#3",
  "52": "E3",
  "53": "F3",
  "54": "F#3",
  "55": "G3",
  "56": "G#3",
  "57": "A3",
  "58": "A#3",
  "59": "B3",
  "60": "C4",
  "61": "C#4",
  "62": "D4",
  "63": "D#4",
  "64": "E4",
  "65": "F4",
  "66": "F#4",
  "67": "G4",
  "68": "G#4",
  "69": "A4",
  "70": "A#4",
  "71": "B4",
  "72": "C5",
  "73": "C#5",
  "74": "D5",
  "75": "D#5",
  "76": "E5",
  "77": "F5",
  "78": "F#5",
  "79": "G5",
  "80": "G#5",
  "81": "A5",
  "82": "A#5",
  "83": "B5",
  "84": "C6",
  "85": "C#6",
  "86": "D6",
  "87": "D#6",
  "88": "E6",
  "89": "F6",
  "90": "F#6",
  "91": "G6",
  "92": "G#6",
  "93": "A6",
  "94": "A#6",
  "95": "B6",
  "96": "C7",
  "97": "C#7",
  "98": "D7",
  "99": "D#7",
  "100": "E7",
  "101": "F7",
  "102": "F#7",
  "103": "G7",
  "104": "G#7",
  "105": "A7",
  "106": "A#7",
  "107": "B7",
  "108": "C8",
  "109": "C#8",
  "110": "D8",
  "111": "D#8",
  "112": "E8",
  "113": "F8",
  "114": "F#8",
  "115": "G8",
  "116": "G#8",
  "117": "A8",
  "118": "A#8",
  "119": "B8",
  "120": "C9",
  "121": "C#9",
  "122": "D9",
  "123": "D#9",
  "124": "E9",
  "125": "F9",
  "126": "F#9",
  "127": "G9"
};

/**
 * MIDI scales
 */
export const MIDI_SCALES = [
  'C Major', 'G Major', 'D Major', 'A Major', 'E Major', 'B Major', 'F# Major', 'C# Major',
  'F Major', 'Bb Major', 'Eb Major', 'Ab Major', 'Db Major', 'Gb Major', 'Cb Major',
  'A Minor', 'E Minor', 'B Minor', 'F# Minor', 'C# Minor', 'G# Minor', 'D# Minor', 'A# Minor',
  'D Minor', 'G Minor', 'C Minor', 'F Minor', 'Bb Minor', 'Eb Minor', 'Ab Minor'
];

/**
 * MIDI modes
 */
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

/**
 * MIDI time signatures
 */
export const MIDI_TIME_SIGNATURES: Array<[number, number]> = [[4, 4], [3, 4], [6, 8], [2, 4], [5, 4], [7, 8]];

/**
 * MIDI target instruments
 */
export const MIDI_TARGET_INSTRUMENTS = [
  { id: 'chords', label: 'Chords' },
  { id: 'bassline', label: 'Bassline' },
  { id: 'melody', label: 'Melody' },
  { id: 'drums', label: 'Drums' }
];

/**
 * MIDI song sections
 */
export const MIDI_SONG_SECTIONS = [
  "General Loop", "Intro", "Verse", "Pre-Chorus", "Chorus", "Post-Chorus", "Bridge", "Solo", "Breakdown", "Drop", "Outro", "Fill"
];

/**
 * MIDI default settings
 */
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

/**
 * MIDI chord progressions by genre
 */
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
  'Default': ['I-V-vi-IV', 'i-VI-III-VII', 'I-IV-V-I', 'vi-IV-I-V', 'ii-V-I', 'I-iii-vi-V']
};

/**
 * MIDI tempo ranges by genre
 */
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

/**
 * Patch guide input categories
 */
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
      "Dark", "Bright", "Aggressive", "Smooth", "Evolving", "Rhythmic", "Melodic", 
      "Cinematic", "Glitchy", "Warm", "Cold", "Atmospheric", "Harsh", "Lush", 
      "Epic", "Minimal", "Retro", "Modern", "Quirky", "Nostalgic", "Futuristic"
    ]
  }
];
