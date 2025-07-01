// EQ instrument-specific advice for use in EQGuide
// Source: user research and pro references

export interface EQAdvice {
  instrument: string;
  frequencyRange: string;
  action: string;
  description: string;
}

export const EQ_INSTRUMENT_ADVICE: EQAdvice[] = [
  // Vocals
  {
    instrument: "Vocals",
    frequencyRange: "80-120 Hz",
    action: "High-pass filter",
    description: "Remove low-end rumble and proximity effect. Most vocals don't need content below 80Hz."
  },
  {
    instrument: "Vocals",
    frequencyRange: "200-400 Hz",
    action: "Cut if muddy",
    description: "Can cause muddiness in vocals. Light cuts here can clean up the vocal sound."
  },
  {
    instrument: "Vocals",
    frequencyRange: "1-3 kHz",
    action: "Boost for presence",
    description: "Critical for vocal intelligibility and presence. Boost to bring vocals forward in the mix."
  },
  {
    instrument: "Vocals",
    frequencyRange: "5-8 kHz",
    action: "Boost for clarity",
    description: "Adds brightness and clarity to vocals. Be careful not to make them harsh."
  },
  {
    instrument: "Male vocals",
    frequencyRange: "100-300 Hz",
    action: "Shape warmth",
    description: "Fundamental frequencies for male vocals. Boost for warmth, cut if muddy."
  },
  {
    instrument: "Female vocals",
    frequencyRange: "200-500 Hz",
    action: "Shape warmth",
    description: "Fundamental frequencies for female vocals. Adjust for body and warmth."
  },
  
  // Drums
  {
    instrument: "Kick drum",
    frequencyRange: "60-100 Hz",
    action: "Boost for thump",
    description: "Low-end punch and weight. Boost for more thump and power."
  },
  {
    instrument: "Kick drum",
    frequencyRange: "2-5 kHz",
    action: "Boost for click",
    description: "Attack and beater sound. Boost for more click and definition."
  },
  {
    instrument: "Snare",
    frequencyRange: "200 Hz",
    action: "Cut for clarity",
    description: "Often muddy frequency. Cut to clean up the snare sound."
  },
  {
    instrument: "Snare",
    frequencyRange: "5 kHz",
    action: "Boost for crack",
    description: "Snare crack and presence. Boost for more snap and cut."
  },
  {
    instrument: "Hi-hats",
    frequencyRange: "10-15 kHz",
    action: "Boost for sparkle",
    description: "High-frequency shimmer. Boost for more air and sparkle."
  },
  {
    instrument: "Cymbals",
    frequencyRange: "8-12 kHz",
    action: "Boost for brightness",
    description: "Cymbal brightness and crash. Boost for more presence."
  },
  
  // Bass instruments
  {
    instrument: "Bass guitar",
    frequencyRange: "40-80 Hz",
    action: "Boost for weight",
    description: "Sub-bass frequencies. Boost for more weight and power."
  },
  {
    instrument: "Bass guitar",
    frequencyRange: "100-200 Hz",
    action: "Shape body",
    description: "Body and fundamental. Shape for desired bass character."
  },
  {
    instrument: "Bass guitar",
    frequencyRange: "2-4 kHz",
    action: "Boost for definition",
    description: "String attack and definition. Boost to hear bass in the mix."
  },
  {
    instrument: "808s",
    frequencyRange: "30-60 Hz",
    action: "Boost for sub",
    description: "Sub-bass frequencies. Boost for that deep 808 rumble."
  },
  {
    instrument: "Sub bass",
    frequencyRange: "20-60 Hz",
    action: "Boost carefully",
    description: "Very low frequencies. Boost with caution to avoid muddiness."
  },
  {
    instrument: "Synth bass",
    frequencyRange: "80-200 Hz",
    action: "Shape character",
    description: "Synth bass fundamentals. Shape for desired character and weight."
  },
  
  // Other instruments
  {
    instrument: "Guitar",
    frequencyRange: "100 Hz",
    action: "High-pass filter",
    description: "Remove low-end rumble. Most guitars don't need content below 100Hz."
  },
  {
    instrument: "Guitar",
    frequencyRange: "3-5 kHz",
    action: "Boost for presence",
    description: "Guitar presence and cut. Boost to make guitar stand out."
  },
  {
    instrument: "Acoustic guitar",
    frequencyRange: "80-120 Hz",
    action: "High-pass filter",
    description: "Remove low-end rumble while preserving body."
  },
  {
    instrument: "Acoustic guitar",
    frequencyRange: "10-12 kHz",
    action: "Boost for sparkle",
    description: "String brightness and air. Boost for more sparkle."
  },
  {
    instrument: "Piano",
    frequencyRange: "80-100 Hz",
    action: "High-pass filter",
    description: "Remove unnecessary low-end while keeping piano body."
  },
  {
    instrument: "Piano",
    frequencyRange: "2-4 kHz",
    action: "Boost for clarity",
    description: "Piano attack and note definition. Boost for clarity."
  },
  {
    instrument: "Strings",
    frequencyRange: "200-400 Hz",
    action: "Cut if muddy",
    description: "Can cause muddiness in string sections. Cut if needed."
  },
  {
    instrument: "Strings",
    frequencyRange: "8-12 kHz",
    action: "Boost for air",
    description: "String brightness and air. Boost for more presence."
  },
  {
    instrument: "Horns",
    frequencyRange: "1-3 kHz",
    action: "Boost for presence",
    description: "Horn presence and cut. Boost to make horns stand out."
  },
  {
    instrument: "Brass",
    frequencyRange: "2-5 kHz",
    action: "Boost for brightness",
    description: "Brass brightness and attack. Boost for more presence."
  },
  {
    instrument: "Woodwinds",
    frequencyRange: "2-4 kHz",
    action: "Boost for clarity",
    description: "Woodwind clarity and definition. Boost for better articulation."
  },
  {
    instrument: "Violin",
    frequencyRange: "3-5 kHz",
    action: "Boost for presence",
    description: "Violin presence and cut. Boost to make violin stand out."
  },
  {
    instrument: "Cello",
    frequencyRange: "200-400 Hz",
    action: "Shape warmth",
    description: "Cello body and warmth. Shape for desired character."
  },
  {
    instrument: "Flute",
    frequencyRange: "2-4 kHz",
    action: "Boost for clarity",
    description: "Flute clarity and breath. Boost for better definition."
  },
  {
    instrument: "Saxophone",
    frequencyRange: "1-3 kHz",
    action: "Boost for presence",
    description: "Saxophone presence and bite. Boost for more cut."
  },
  {
    instrument: "Trumpet",
    frequencyRange: "2-5 kHz",
    action: "Boost for brightness",
    description: "Trumpet brightness and attack. Boost for more presence."
  },
  {
    instrument: "Tuba",
    frequencyRange: "60-120 Hz",
    action: "Shape low-end",
    description: "Tuba fundamentals. Shape for desired low-end character."
  },
  {
    instrument: "Room mics",
    frequencyRange: "100-200 Hz",
    action: "Cut if muddy",
    description: "Room mics can pick up muddy low-mids. Cut if needed."
  },
  {
    instrument: "Room mics",
    frequencyRange: "10-15 kHz",
    action: "Boost for air",
    description: "Room ambience and air. Boost for more spaciousness."
  }
];
