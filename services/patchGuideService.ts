import { gemini } from '../lib/geminiClient';
import { generateContent } from './geminiService';

export interface PatchGuideResult {
  text: string;
  waveform?: string;
  adsr?: {
    attack: number;
    decay: number;
    sustain: number;
    release: number;
  };
  knobs?: Record<string, number>;
  modMatrix?: Array<{
    source: string;
    target: string;
    amount: number;
  }>;
}

/**
 * Generates a comprehensive prompt for patch creation guidance
 * @param description - Description of the desired sound
 * @param synth - The synthesizer to use
 * @returns Formatted prompt string for AI generation
 */
export function generatePatchGuidePrompt(
  description: string,
  synth: string
): string {
  return `You are PatchGuide AI, a world-class sound designer specializing in synthesizer programming. 
  
The user wants to create: "${description}" using ${synth}.

Provide a detailed, step-by-step guide for creating this sound. Include specific parameter values, techniques, and professional sound design advice. Return your response as JSON with this structure:

{
  "text": "Detailed markdown-formatted instructions for creating the patch, including specific parameter settings and techniques",
  "waveform": "saw/square/sine/triangle/custom",
  "adsr": {
    "attack": 0.1,
    "decay": 0.2,
    "sustain": 0.6,
    "release": 0.4
  },
  "knobs": {
    "cutoff": 0.7,
    "resonance": 0.3,
    "drive": 0.5,
    "mix": 0.8
  },
  "modMatrix": [
    {
      "source": "LFO 1",
      "target": "Filter Cutoff",
      "amount": 0.6
    },
    {
      "source": "Envelope 2",
      "target": "Oscillator Pitch",
      "amount": 0.3
    }
  ]
}

For the "text" field, provide professional, clear instructions in markdown format. Include:
1. A brief overview of the sound characteristics
2. Oscillator settings (waveforms, detune, etc.)
3. Filter settings
4. Envelope settings
5. Modulation routing
6. Effects and processing
7. Performance tips

For the "waveform" field, specify the primary oscillator waveform (saw, square, sine, triangle, or a descriptive custom type).

For the "adsr" field, provide normalized values (0-1) for attack, decay, sustain, and release that would create the appropriate envelope shape.

For the "knobs" field, include 4-8 key parameters with normalized values (0-1).

For the "modMatrix" field, include 2-5 important modulation routings with source, target, and amount (0-1).

Focus on practical, achievable settings that will create the desired sound. Be specific to ${synth}'s capabilities where possible.`;
}

/**
 * Generates a synthesizer patch guide based on description and synth
 * @param params - Object containing description and synth
 * @returns Promise resolving to patch guide data
 */
export async function generateSynthPatchGuide(
  params: { description: string; synth: string }
): Promise<PatchGuideResult> {
  const { description, synth } = params;
  const prompt = generatePatchGuidePrompt(description, synth);
  
  try {
    const response = await generateContent(prompt);
    
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }
    
    const result = JSON.parse(jsonMatch[0]) as PatchGuideResult;
    
    // Validate and sanitize the result
    if (!result.text) {
      result.text = "Sorry, I couldn't generate detailed instructions for this patch. Please try again with a more specific description.";
    }
    
    return result;
  } catch (error) {
    console.error("Error generating patch guide:", error);
    
    // Return a fallback response instead of throwing
    return {
      text: `Error generating patch guide: ${error.message || "Unknown error"}. Please try again with a different description or synthesizer.`,
      waveform: "sine",
      adsr: { attack: 0.1, decay: 0.2, sustain: 0.6, release: 0.4 },
      knobs: { "Cutoff": 0.7, "Resonance": 0.3, "Drive": 0.2, "Mix": 0.5 },
      modMatrix: [
        { source: "LFO 1", target: "Filter Cutoff", amount: 0.5 },
        { source: "Envelope", target: "Amplitude", amount: 1.0 }
      ]
    };
  }
}