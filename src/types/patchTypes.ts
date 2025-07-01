export interface PatchGuideInputs {
  description: string;
  synthesisType: string;
  synthModel?: string;
  genre: string;
  voiceType: string;
  notes: string;
  dawName?: string;
  styleMood: string[];
  dynamicsMovement: string[];
}

export interface PatchGuideResult {
  text: string;
  synthConfig: any;
  adsrVCF: any;
  adsrVCA: any;
  summary: string;
}

export interface SynthConfig {
  oscillator?: {
    waveform: string;
    octave: number;
    detune?: number;
    pulseWidth?: number;
  };
  filter?: {
    type: string;
    cutoff: number;
    resonance: number;
    envelope?: number;
  };
  amplifier?: {
    gain: number;
    pan: number;
  };
  effects?: {
    reverb?: number;
    delay?: number;
    chorus?: number;
    distortion?: number;
  };
}

export interface ADSREnvelope {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}