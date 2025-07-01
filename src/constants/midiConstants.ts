export const MIDI_TEMPO_RANGES: Record<string, [number, number]> = {
  'House': [120, 130],
  'Techno': [120, 135],
  'Trance': [128, 140],
  'Drum & Bass': [160, 180],
  'Dubstep': [140, 150],
  'Hip Hop': [70, 100],
  'Trap': [130, 170],
  'Future Bass': [140, 160],
  'Ambient': [60, 90],
  'Chillwave': [80, 110],
  'Pop': [100, 130],
  'Rock': [110, 140],
  'Jazz': [90, 180],
  'Classical': [60, 200],
  'Breakbeat': [130, 180],
  'Garage': [130, 140],
  'Jungle': [160, 180],
  'IDM': [80, 160],
  'Downtempo': [80, 110],
  'Trip Hop': [80, 110]
};

export const MIDI_CHORD_PROGRESSIONS: Record<string, string[]> = {
  'House': ['vi-IV-I-V', 'I-V-vi-IV', 'vi-V-IV-V'],
  'Techno': ['i-VII-VI-VII', 'i-iv-VII-VI', 'i-VI-VII-i'],
  'Trance': ['vi-IV-I-V', 'i-VI-III-VII', 'vi-V-IV-I'],
  'Pop': ['I-V-vi-IV', 'vi-IV-I-V', 'I-vi-IV-V'],
  'Rock': ['I-VII-IV-I', 'vi-IV-I-V', 'I-V-vi-IV'],
  'Jazz': ['ii-V-I', 'I-vi-ii-V', 'iii-vi-ii-V-I'],
  'Hip Hop': ['i-VII-VI-VII', 'i-iv-VII-VI', 'vi-IV-I-V'],
  'Trap': ['i-VII-VI-VII', 'vi-IV-I-V', 'i-VI-VII-i'],
  'Future Bass': ['vi-IV-I-V', 'I-V-vi-IV', 'vi-V-IV-I'],
  'Ambient': ['I-IV-vi-V', 'vi-IV-I-V', 'I-V-IV-I'],
  'Drum & Bass': ['i-VII-VI-VII', 'i-iv-VII-VI', 'vi-IV-I-V'],
  'Dubstep': ['i-VII-VI-VII', 'vi-IV-I-V', 'i-VI-VII-i']
};

export const MIDI_SCALES: Record<string, number[]> = {
  'major': [0, 2, 4, 5, 7, 9, 11],
  'minor': [0, 2, 3, 5, 7, 8, 10],
  'dorian': [0, 2, 3, 5, 7, 9, 10],
  'phrygian': [0, 1, 3, 5, 7, 8, 10],
  'lydian': [0, 2, 4, 6, 7, 9, 11],
  'mixolydian': [0, 2, 4, 5, 7, 9, 10],
  'locrian': [0, 1, 3, 5, 6, 8, 10],
  'pentatonic': [0, 2, 4, 7, 9],
  'blues': [0, 3, 5, 6, 7, 10],
  'chromatic': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
};

export const MIDI_NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const MIDI_DRUM_MAP: Record<string, number> = {
  'kick': 36,
  'snare': 38,
  'hihat': 42,
  'openhat': 46,
  'crash': 49,
  'ride': 51,
  'clap': 39,
  'rim': 37,
  'tom1': 50,
  'tom2': 47,
  'tom3': 43
};