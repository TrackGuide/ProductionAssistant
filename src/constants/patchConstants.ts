export interface PatchInputCategory {
  key: string;
  label: string;
  examples: string[];
}

export const PATCH_INPUT_CATEGORIES: PatchInputCategory[] = [
  {
    key: 'genre',
    label: 'Genre',
    examples: [
      'House', 'Techno', 'Trance', 'Ambient', 'Dubstep', 'Drum & Bass',
      'Hip Hop', 'Trap', 'Future Bass', 'Synthwave', 'Chillwave',
      'Pop', 'Rock', 'Jazz', 'Classical', 'Experimental', 'Minimal',
      'Progressive', 'Deep House', 'Tech House', 'Acid', 'Breakbeat'
    ]
  },
  {
    key: 'voiceType',
    label: 'Voice Type',
    examples: [
      'Lead', 'Bass', 'Pad', 'Arp', 'Pluck', 'Stab', 'Chord',
      'Texture', 'Drone', 'Sequence', 'Melody', 'Harmony',
      'Percussion', 'FX', 'Sweep', 'Riser', 'Impact'
    ]
  },
  {
    key: 'styleMood',
    label: 'Style & Mood',
    examples: [
      'Dark', 'Bright', 'Warm', 'Cold', 'Aggressive', 'Gentle',
      'Dreamy', 'Energetic', 'Calm', 'Mysterious', 'Uplifting',
      'Melancholic', 'Euphoric', 'Intense', 'Subtle', 'Bold',
      'Vintage', 'Modern', 'Futuristic', 'Organic', 'Digital'
    ]
  },
  {
    key: 'dynamicsMovement',
    label: 'Dynamics & Movement',
    examples: [
      'Static', 'Evolving', 'Pulsing', 'Breathing', 'Pumping',
      'Flowing', 'Choppy', 'Smooth', 'Rhythmic', 'Arrhythmic',
      'Building', 'Fading', 'Swelling', 'Cutting', 'Morphing',
      'Tremolo', 'Vibrato', 'Modulated', 'Filtered', 'Gated'
    ]
  }
];