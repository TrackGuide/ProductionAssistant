import { generateContent } from './geminiService';

export interface PatchStep {
  plugin: string;
  parameters: Record<string, string | number>;
  description: string;
  envelope?: { attack: number; decay: number; sustain: number; release: number };
  waveformExampleUrl?: string;
}

export interface PatchGuideResult {
  steps: PatchStep[];
  notes?: string;
}

/**
 * Generates a comprehensive prompt for patch creation guidance
 * @param targetSound - Description of the desired sound
 * @param pluginList - Array of available plugins
 * @param daw - Optional DAW for stock plugin recommendations
 * @returns Formatted prompt string for AI generation
 */
export function generatePatchGuidePrompt(
  targetSound: string,
  pluginList: string[],
  daw?: string
): string {
  const dawInfo = daw ? ` They are using ${daw}, so you can also reference stock plugins and instruments from that DAW.` : '';
  return `You are a world-class sound designer. The user wants: "${targetSound}". They have these plugins: ${pluginList.join(", ")}.${dawInfo}

For each plugin, output:
• Oscillator & waveform selection
• Filter settings (cutoff/resonance)
• Envelope settings (attack, decay, sustain, release as numbers 0-1)
• Effects chain & order
• Any modulation routings (e.g. LFO → filter cutoff)

For each step, include an "envelope" object with numeric ADSR values (0-1 range).

Return valid JSON with this exact structure:
{
  "steps": [
    {
      "plugin": "plugin name",
      "parameters": {
        "oscillator": "saw/square/sine/triangle",
        "filterCutoff": 0.7,
        "filterResonance": 0.3,
        "attack": 0.1,
        "decay": 0.2,
        "sustain": 0.6,
        "release": 0.4
      },
      "description": "detailed explanation",
      "envelope": {
        "attack": 0.1,
        "decay": 0.2,
        "sustain": 0.6,
        "release": 0.4
      }
    }
  ],
  "notes": "additional tips and variations"
}

Focus on practical, achievable settings that will create the desired sound.`;
}

/**
 * Generates a complete patch guide with steps and visual data
 * @param targetSound - Description of the desired sound
 * @param pluginList - Array of available plugins
 * @param daw - Optional DAW for stock plugin recommendations
 * @returns Promise resolving to patch guide data
 */
export async function generatePatchGuide(
  targetSound: string,
  pluginList: string[],
  daw?: string
): Promise<PatchGuideResult> {
  const prompt = generatePatchGuidePrompt(targetSound, pluginList, daw);
  
  try {
    const response = await generateContent(prompt);
    
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }
    
    const result = JSON.parse(jsonMatch[0]) as PatchGuideResult;
    
    // Validate and sanitize the result
    if (!result.steps || !Array.isArray(result.steps)) {
      throw new Error('Invalid response format: missing steps array');
    }
    
    // Ensure all steps have required fields
    result.steps = result.steps.map(step => ({
      plugin: step.plugin || 'Unknown Plugin',
      parameters: step.parameters || {},
      description: step.description || 'No description provided',
      envelope: step.envelope || { attack: 0.1, decay: 0.2, sustain: 0.6, release: 0.4 }
    }));
    
    return result;
  } catch (error) {
    console.error('Error generating patch guide:', error);
    throw new Error('Failed to generate PatchGuide. Please try again.');
  }
}