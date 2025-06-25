// constants/dawMetadata.ts

export interface DawMetadata {
  dawName: string;
  workflowTips: string[];
  stockPlugins: {
    EQ: string[];
    Compression: string[];
    Reverb: string[];
    Delay: string[];
    Creative: string[];
  };
  advancedFeatures: string[];
  suggestedSignalChains: {
    Vocal: string[];
    DrumBus: string[];
    Synth: string[];
    Guitar?: string[];
  };
}

export const dawMetadata: DawMetadata[] = [
  {
    dawName: "Ableton Live",
    workflowTips: [
      "Utilize Session View for arranging and improvisation.",
      "Use Drum Rack for detailed drum programming and sample layering.",
      "Map macros to multiple parameters for quick automation and sound shaping."
    ],
    advancedFeatures: [
      "Max for Live integration for custom devices and advanced automation.",
      "Advanced warping modes for audio editing.",
      "Capture MIDI functionality to recover played ideas."
    ],
    stockPlugins: {
      EQ: ["EQ Eight", "EQ Three"],
      Compression: ["Compressor", "Glue Compressor", "Multiband Dynamics"],
      Reverb: ["Hybrid Reverb", "Reverb"],
      Delay: ["Echo", "Delay"],
      Creative: ["Beat Repeat", "Grain Delay", "Corpus", "Resonators"]
    },
    suggestedSignalChains: {
      Vocal: ["EQ Eight", "Compressor", "Hybrid Reverb", "Echo"],
      DrumBus: ["Drum Buss", "Glue Compressor", "Saturator"],
      Synth: ["EQ Eight", "Multiband Dynamics", "Chorus-Ensemble", "Hybrid Reverb"],
      Guitar: ["Amp", "Cabinet", "EQ Eight", "Delay"]
    }
  },
  {
    dawName: "Pro Tools",
    workflowTips: [
      "Use playlist comping for efficient take management.",
      "Leverage AudioSuite plugins for offline processing.",
      "Take advantage of grouping and VCA masters for streamlined mixing."
    ],
    advancedFeatures: [
      "Elastic Audio for precise timing correction.",
      "Beat Detective for rhythmic correction.",
      "Advanced automation modes and precise automation editing."
    ],
    stockPlugins: {
      EQ: ["EQ III 7-Band"],
      Compression: ["BF-76 Compressor", "Dyn3 Compressor/Limiter"],
      Reverb: ["D-Verb", "AIR Reverb"],
      Delay: ["Mod Delay III", "AIR Dynamic Delay"],
      Creative: ["AIR Lo-Fi", "AIR Distortion", "AIR Filter Gate"]
    },
    suggestedSignalChains: {
      Vocal: ["EQ III 7-Band", "BF-76 Compressor", "D-Verb"],
      DrumBus: ["Dyn3 Compressor/Limiter", "EQ III 7-Band", "AIR Lo-Fi"],
      Synth: ["AIR Enhancer", "EQ III 7-Band", "AIR Reverb"],
      Guitar: ["Eleven Lite", "EQ III 7-Band", "Mod Delay III"]
    }
  },
  {
    dawName: "Logic Pro",
    workflowTips: [
      "Utilize Track Stacks for easy management of layered sounds.",
      "Take advantage of Logic's built-in Flex Time and Flex Pitch tools for audio editing.",
      "Explore Alchemy for advanced synth design and sound manipulation."
    ],
    advancedFeatures: [
      "Drummer virtual session player for realistic drum tracks.",
      "Flex Pitch for detailed vocal tuning.",
      "Smart Controls for streamlined automation and modulation."
    ],
    stockPlugins: {
      EQ: ["Channel EQ", "Linear Phase EQ"],
      Compression: ["Compressor", "Multipressor"],
      Reverb: ["Space Designer", "ChromaVerb"],
      Delay: ["Stereo Delay", "Delay Designer"],
      Creative: ["Phat FX", "Step FX", "Remix FX"]
    },
    suggestedSignalChains: {
      Vocal: ["Channel EQ", "Compressor", "ChromaVerb"],
      DrumBus: ["Multipressor", "Channel EQ", "Phat FX"],
      Synth: ["Channel EQ", "Space Designer", "Step FX"],
      Guitar: ["Amp Designer", "Pedalboard", "Stereo Delay"]
    }
  },
  {
    dawName: "FL Studio",
    workflowTips: [
      "Utilize the Channel Rack and Pattern Clips for quick beat and loop creation.",
      "Take advantage of Piano Roll features for detailed MIDI editing.",
      "Use the Mixer effectively for parallel processing and advanced routing."
    ],
    advancedFeatures: [
      "Gross Beat for creative time and volume manipulation.",
      "Patcher for advanced plugin routing and modular setups.",
      "Advanced automation clips with extensive modulation capabilities."
    ],
    stockPlugins: {
      EQ: ["Parametric EQ 2"],
      Compression: ["Maximus", "Fruity Limiter"],
      Reverb: ["Fruity Reeverb 2", "Convolver"],
      Delay: ["Fruity Delay 3"],
      Creative: ["Gross Beat", "Effector", "Fruity Love Philter"]
    },
    suggestedSignalChains: {
      Vocal: ["Parametric EQ 2", "Maximus", "Fruity Reeverb 2"],
      DrumBus: ["Maximus", "Fruity Compressor", "Effector"],
      Synth: ["Parametric EQ 2", "Gross Beat", "Convolver"]
    }
  },
  {
    dawName: "Cubase",
    workflowTips: [
      "Take advantage of Cubase's Control Room for advanced monitoring setups.",
      "Utilize Track Versions for efficient comping and arrangement variations.",
      "Explore Chord Track and Chord Pads for creative songwriting support."
    ],
    advancedFeatures: [
      "VariAudio for detailed pitch and timing correction.",
      "Chord Track for quick harmonic experimentation.",
      "Sampler Track for flexible sample-based sound design."
    ],
    stockPlugins: {
      EQ: ["Frequency", "StudioEQ"],
      Compression: ["Compressor", "Vintage Compressor"],
      Reverb: ["Reverence", "RoomWorks SE"],
      Delay: ["PingPongDelay", "StereoDelay"],
      Creative: ["Quadrafuzz v2", "LoopMash FX", "ModMachine"]
    },
    suggestedSignalChains: {
      Vocal: ["Frequency", "Compressor", "Reverence"],
      DrumBus: ["Compressor", "Frequency", "Quadrafuzz v2"],
      Synth: ["StudioEQ", "StereoDelay", "LoopMash FX"],
      Guitar: ["AmpSimulator", "StudioEQ", "StereoDelay"]
    }
  },
  {
    dawName: "Reaper",
    workflowTips: [
      "Customize actions and macros to optimize workflow.",
      "Leverage routing flexibility for advanced parallel processing.",
      "Utilize ReaScript scripting and extensions for enhanced functionality."
    ],
    advancedFeatures: [
      "ReaScript for custom scripting and automation.",
      "Dynamic split based on transient detection for flexible editing.",
      "Integrated video support for scoring and post-production."
    ],
    stockPlugins: {
      EQ: ["ReaEQ"],
      Compression: ["ReaComp", "ReaXcomp"],
      Reverb: ["ReaVerbate", "ReaVerb"],
      Delay: ["ReaDelay"],
      Creative: ["JSFX (Jesusonic Effects)", "ReaPitch"]
    },
    suggestedSignalChains: {
      Vocal: ["ReaEQ", "ReaComp", "ReaVerb"],
      DrumBus: ["ReaXcomp", "ReaEQ", "JSFX Saturation"],
      Synth: ["ReaEQ", "ReaDelay", "JSFX Chorus"],
      Guitar: ["ReaEQ", "ReaComp", "ReaVerb"]
    }
  }
];

/**
 * Helper function to find a DAW by name
 */
export function getDawMetadata(dawName: string): DawMetadata | undefined {
  return dawMetadata.find(daw => daw.dawName === dawName);
}

/**
 * Helper function to suggest plugins from a specific DAW and category
 */
export function suggestPlugins(daw: string, category: keyof DawMetadata['stockPlugins']): string[] {
  const entry = dawMetadata.find(d => d.dawName === daw);
  return entry?.stockPlugins[category] || [];
}

/**
 * Helper function to get workflow tips for a specific DAW
 */
export function getWorkflowTips(daw: string): string[] {
  const entry = dawMetadata.find(d => d.dawName === daw);
  return entry?.workflowTips || [];
}

/**
 * Helper function to get suggested signal chains for a specific DAW and instrument type
 */
export function getSuggestedSignalChain(daw: string, instrumentType: keyof DawMetadata['suggestedSignalChains']): string[] {
  const entry = dawMetadata.find(d => d.dawName === daw);
  return entry?.suggestedSignalChains[instrumentType] || [];
}
