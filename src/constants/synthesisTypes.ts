// synthesisTypes.ts - Dedicated file for synthesis type definitions and schemas

export const SYNTHESIS_TYPES = [
  { key: 'subtractive', label: 'Subtractive' },
  { key: 'additive',   label: 'Additive' },
  { key: 'fm',         label: 'FM' },
  { key: 'wavetable',  label: 'Wavetable' },
  { key: 'granular',   label: 'Granular' }
] as const;

export const SYNTHESIS_SCHEMA = {
  subtractive: {
    oscillators: {
      osc1_waveform: { type: "enum", options: ["sine", "sawtooth", "square", "triangle", "noise"] },
      osc1_tune: { type: "float", range: [-24, 24], unit: "semitones" },
      osc1_level: { type: "float", range: [0, 1], unit: "linear" },
      osc1_pulse_width: { type: "float", range: [0, 1], unit: "percent" },
      osc2_waveform: { type: "enum", options: ["sine", "sawtooth", "square", "triangle", "noise"] },
      osc2_tune: { type: "float", range: [-24, 24], unit: "semitones" },
      osc2_level: { type: "float", range: [0, 1], unit: "linear" }
    },
    filter: {
      filter_type: { type: "enum", options: ["lowpass", "highpass", "bandpass", "notch"] },
      filter_cutoff: { type: "float", range: [20, 20000], unit: "Hz" },
      filter_resonance: { type: "float", range: [0, 1], unit: "Q" },
      filter_env_amount: { type: "float", range: [-1, 1], unit: "amount" }
    },
    envelopes: {
      amp_env: {
        attack: { type: "float", range: [0.001, 10], unit: "seconds" },
        decay: { type: "float", range: [0.001, 10], unit: "seconds" },
        sustain: { type: "float", range: [0, 1], unit: "level" },
        release: { type: "float", range: [0.001, 10], unit: "seconds" }
      },
      filter_env: {
        attack: { type: "float", range: [0.001, 10], unit: "seconds" },
        decay: { type: "float", range: [0.001, 10], unit: "seconds" },
        sustain: { type: "float", range: [0, 1], unit: "level" },
        release: { type: "float", range: [0.001, 10], unit: "seconds" }
      }
    },
    lfo: {
      lfo1_shape: { type: "enum", options: ["sine", "triangle", "square", "saw"] },
      lfo1_rate: { type: "float", range: [0.1, 20], unit: "Hz" },
      lfo1_depth: { type: "float", range: [0, 1], unit: "amount" },
      lfo1_target: { type: "enum", options: ["pitch", "filter_cutoff", "osc1_level", "osc2_level"] }
    },
    global: {
      volume: { type: "float", range: [0, 1], unit: "linear" },
      pan: { type: "float", range: [-1, 1], unit: "stereo" },
      glide_time: { type: "float", range: [0, 5], unit: "seconds" },
      voices: { type: "int", range: [1, 16], unit: "count" },
      voice_mode: { type: "enum", options: ["polyphonic", "mono", "legato"] }
    }
  },
  additive: {
    partials: {
      partial_count: { type: "int", range: [1, 32], unit: "count" },
      partial1_frequency: { type: "float", range: [0.5, 10], unit: "ratio" },
      partial1_amplitude: { type: "float", range: [0, 1], unit: "level" },
      partial1_phase: { type: "float", range: [0, 1], unit: "normalized" },
      partial2_frequency: { type: "float", range: [0.5, 10], unit: "ratio" },
      partial2_amplitude: { type: "float", range: [0, 1], unit: "level" },
      partial2_phase: { type: "float", range: [0, 1], unit: "normalized" }
    },
    global: {
      fundamental_freq: { type: "float", range: [20, 1000], unit: "Hz" },
      global_env: {
        attack: { type: "float", range: [0.001, 10], unit: "seconds" },
        decay: { type: "float", range: [0.001, 10], unit: "seconds" },
        sustain: { type: "float", range: [0, 1], unit: "level" },
        release: { type: "float", range: [0.001, 10], unit: "seconds" }
      },
      stereo_spread: { type: "float", range: [0, 1], unit: "amount" }
    }
  },
  fm: {
    operators: {
      op1_waveform: { type: "enum", options: ["sine", "triangle", "square", "saw"] },
      op1_freq_ratio: { type: "float", range: [0.5, 12], unit: "ratio" },
      op1_fixed_freq: { type: "boolean" },
      op1_output_level: { type: "float", range: [0, 1], unit: "level" },
      op2_waveform: { type: "enum", options: ["sine", "triangle", "square", "saw"] },
      op2_freq_ratio: { type: "float", range: [0.5, 12], unit: "ratio" },
      op2_fixed_freq: { type: "boolean" },
      op2_output_level: { type: "float", range: [0, 1], unit: "level" },
      op3_waveform: { type: "enum", options: ["sine", "triangle", "square", "saw"] },
      op3_freq_ratio: { type: "float", range: [0.5, 12], unit: "ratio" },
      op3_fixed_freq: { type: "boolean" },
      op3_output_level: { type: "float", range: [0, 1], unit: "level" },
      op4_waveform: { type: "enum", options: ["sine", "triangle", "square", "saw"] },
      op4_freq_ratio: { type: "float", range: [0.5, 12], unit: "ratio" },
      op4_fixed_freq: { type: "boolean" },
      op4_output_level: { type: "float", range: [0, 1], unit: "level" }
    },
    routing: {
      algorithm: { type: "int", range: [1, 8], unit: "index" },
      feedback_connections: { type: "int", range: [0, 4], unit: "count" }
    },
    envelopes: {
      op1_env: {
        attack: { type: "float", range: [0.001, 10], unit: "seconds" },
        decay: { type: "float", range: [0.001, 10], unit: "seconds" },
        sustain: { type: "float", range: [0, 1], unit: "level" },
        release: { type: "float", range: [0.001, 10], unit: "seconds" }
      },
      op2_env: {
        attack: { type: "float", range: [0.001, 10], unit: "seconds" },
        decay: { type: "float", range: [0.001, 10], unit: "seconds" },
        sustain: { type: "float", range: [0, 1], unit: "level" },
        release: { type: "float", range: [0.001, 10], unit: "seconds" }
      }
    },
    global: {
      voices: { type: "int", range: [1, 16], unit: "count" },
      glide_time: { type: "float", range: [0, 5], unit: "seconds" }
    }
  },
  wavetable: {
    oscillators: {
      osc1_wavetable: { type: "string" },
      osc1_position: { type: "float", range: [0, 1], unit: "position" },
      osc1_tune: { type: "float", range: [-24, 24], unit: "semitones" },
      osc1_level: { type: "float", range: [0, 1], unit: "level" },
      osc1_phase: { type: "float", range: [0, 1], unit: "normalized" },
      osc1_warp_type: { type: "enum", options: ["bend+", "bend-", "sync", "mirror"] },
      osc1_warp_amount: { type: "float", range: [0, 1], unit: "amount" },
      osc2_wavetable: { type: "string" },
      osc2_position: { type: "float", range: [0, 1], unit: "position" },
      osc2_tune: { type: "float", range: [-24, 24], unit: "semitones" },
      osc2_level: { type: "float", range: [0, 1], unit: "level" }
    },
    filter: {
      filter_type: { type: "enum", options: ["lowpass", "highpass", "bandpass", "notch"] },
      filter_cutoff: { type: "float", range: [20, 20000], unit: "Hz" },
      filter_resonance: { type: "float", range: [0, 1], unit: "Q" },
      filter_env_amount: { type: "float", range: [-1, 1], unit: "amount" },
      filter_drive: { type: "float", range: [0, 1], unit: "amount" }
    },
    envelopes: {
      amp_env: {
        attack: { type: "float", range: [0.001, 10], unit: "seconds" },
        decay: { type: "float", range: [0.001, 10], unit: "seconds" },
        sustain: { type: "float", range: [0, 1], unit: "level" },
        release: { type: "float", range: [0.001, 10], unit: "seconds" }
      },
      mod_env1: {
        attack: { type: "float", range: [0.001, 10], unit: "seconds" },
        decay: { type: "float", range: [0.001, 10], unit: "seconds" },
        sustain: { type: "float", range: [0, 1], unit: "level" },
        release: { type: "float", range: [0.001, 10], unit: "seconds" }
      }
    },
    lfos: {
      lfo1_shape: { type: "enum", options: ["sine", "triangle", "square", "saw"] },
      lfo1_rate: { type: "float", range: [0.1, 20], unit: "Hz" },
      lfo1_depth: { type: "float", range: [0, 1], unit: "amount" }
    },
    global: {
      voices: { type: "int", range: [1, 16], unit: "count" },
      unison_voice_count: { type: "int", range: [1, 8], unit: "count" },
      unison_detune: { type: "float", range: [0, 100], unit: "cents" }
    }
  },
  granular: {
    source: {
      sample_source: { type: "string" },
      start_offset: { type: "float", range: [0, 60], unit: "seconds" },
      playback_mode: { type: "enum", options: ["forward", "reverse", "alternate"] },
      loop_enable: { type: "boolean" }
    },
    grains: {
      grain_size: { type: "float", range: [1, 100], unit: "milliseconds" },
      grain_size_jitter: { type: "float", range: [0, 1], unit: "amount" },
      grain_density: { type: "float", range: [1, 100], unit: "grains/sec" },
      density_jitter: { type: "float", range: [0, 1], unit: "amount" },
      grain_position: { type: "float", range: [0, 1], unit: "position" },
      position_jitter: { type: "float", range: [0, 1], unit: "amount" },
      grain_pitch: { type: "float", range: [-24, 24], unit: "semitones" },
      pitch_jitter: { type: "float", range: [0, 1], unit: "amount" },
      grain_envelope: { type: "enum", options: ["gaussian", "hann", "rectangular", "triangular"] },
      grain_pan: { type: "float", range: [-1, 1], unit: "stereo" },
      max_grains: { type: "int", range: [1, 256], unit: "count" }
    },
    global: {
      amp_env: {
        attack: { type: "float", range: [0.001, 10], unit: "seconds" },
        decay: { type: "float", range: [0.001, 10], unit: "seconds" },
        sustain: { type: "float", range: [0, 1], unit: "level" },
        release: { type: "float", range: [0.001, 10], unit: "seconds" }
      },
      time_stretch: { type: "float", range: [0.1, 10], unit: "factor" },
      grain_overlap: { type: "float", range: [0, 1], unit: "amount" }
    }
  }
} as const;

export const MODEL_OVERRIDES: Record<string, string[]> = {
  subtractive: [
    "Diva", "Juno106", "AnalogLab", "Generic", "SH101", "Sylenth1", "MiniMoog", "Prophet-5", 
    "Harmor", "Vital", "Pigments", "Absynth", "Operator", "RetroSynth", "Alchemy", 
    "Subtractor", "Thor", "Monotone", "CS-80 V", "Jun-6 V", "MS-20 V", "OP-Xa V", 
    "Prophet-5 V", "Acid V", "MiniFreak V", "Buchla Easel V", "Synthi V", "Mini V 4", "Jup-8 V"
  ],
  additive: [
    "Pigments", "Absynth", "Alchemy", "Harmor", "Kawai K5", "Vital", "Thor"
  ],
  fm: [
    "Operator", "FM8", "RetroSynth", "Pigments", "Absynth", "Thor"
  ],
  wavetable: [
    "Serum", "Vital", "Pigments", "Hive2", "MassiveX", "RetroSynth", "Zebra2", 
    "Omnisphere", "Europa", "Thor"
  ],
  granular: [
    "Absynth", "Alchemy", "Omnisphere", "Granulator II", "Padshop", "Grain", "Malström"
  ]
} as const;

// Type definitions for better type safety
export type SynthesisType = keyof typeof SYNTHESIS_SCHEMA;
export type ModelOverride = typeof MODEL_OVERRIDES[SynthesisType][number];
