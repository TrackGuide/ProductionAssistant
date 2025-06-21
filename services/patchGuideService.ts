import { gemini } from '../lib/geminiClient';
import { generateContent } from './geminiService';

export interface PatchStep {
  plugin: string;
  parameters: Record<string, string | number>;
  description: string;
  envelope?: { attack: number; decay: number; sustain: number; release: number };
  waveformExampleUrl?: string;
}

export interface PatchGuideResult {
  steps?: PatchStep[];
  notes?: string;
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
  "notes": "additional tips and variations",
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
  ],
  "pluginUI": {
    "title": "Synth UI",
    "controls": [
      {
        "type": "knob",
        "name": "Cutoff",
        "value": 0.7,
        "x": 100,
        "y": 50
      },
      {
        "type": "slider",
        "name": "Resonance",
        "value": 0.3,
        "x": 200,
        "y": 50
      }
    ]
  }
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
    console.error("Error generating patch guide:", error);
    
    // Return a fallback response instead of throwing
    return {
      steps: [{
        plugin: "Default Plugin",
        parameters: { "Note": "Error occurred" },
        description: `Error generating patch guide: ${error.message || "Unknown error"}. Please try again.`,
        envelope: { attack: 0.1, decay: 0.2, sustain: 0.6, release: 0.4 }
      }],
      notes: "An error occurred during generation. Please try again."
    };
  }
}

/**
 * Generates a patch guide specifically for a synthesizer
 * @param params - Object containing description and synth name
 * @returns Promise resolving to patch guide data with visual elements
 */
export async function generateSynthPatchGuide({ description, synth }: { description: string; synth: string; }): Promise<PatchGuideResult> {
  const prompt = `You are PatchGuide AI, an expert sound designer specializing in synthesizer programming. 
  
Create a detailed, professional patch recipe for a "${description}" sound on ${synth}.

Your response MUST be valid JSON with the following structure:
{
  "text": "# ${synth} Patch: ${description}\\n\\n## Overview\\nBrief description of the sound and approach.\\n\\n## Oscillator Section\\n• Waveform selection and tuning\\n• Unison/voice settings\\n• Sub oscillator settings\\n\\n## Filter Section\\n• Filter type and cutoff frequency\\n• Resonance and drive settings\\n• Envelope modulation amount\\n\\n## Envelope Settings\\n• Filter envelope timing and shape\\n• Amplitude envelope for dynamics\\n\\n## Modulation\\n• LFO assignments and rates\\n• Modulation matrix routings\\n\\n## Effects\\n• Reverb, delay, and other effects\\n• Processing chain order\\n\\n## Performance Tips\\n• Key velocity response\\n• Expression controls\\n• Live performance suggestions",
  
  "waveform": "saw",
  
  "adsr": {
    "filterEnv": {
      "attack": 0.1,
      "decay": 0.5,
      "sustain": 0.7,
      "release": 1.0
    },
    "ampEnv": {
      "attack": 0.05,
      "decay": 0.3,
      "sustain": 0.8,
      "release": 1.2
    }
  },
  
  "knobs": [
    {
      "name": "Cutoff",
      "value": 0.7,
      "section": "Filter"
    },
    {
      "name": "Resonance",
      "value": 0.3,
      "section": "Filter"
    },
    {
      "name": "Drive",
      "value": 0.2,
      "section": "Filter"
    },
    {
      "name": "Reverb Size",
      "value": 0.6,
      "section": "Effects"
    },
    {
      "name": "Delay Time",
      "value": 0.4,
      "section": "Effects"
    },
    {
      "name": "LFO Rate",
      "value": 0.3,
      "section": "Modulation"
    },
    {
      "name": "LFO Depth",
      "value": 0.5,
      "section": "Modulation"
    }
  ],
  
  "modMatrix": [
    {
      "source": "LFO 1",
      "target": "Filter Cutoff",
      "amount": 0.6
    },
    {
      "source": "Filter Env",
      "target": "Filter Cutoff",
      "amount": 0.8
    },
    {
      "source": "Velocity",
      "target": "Filter Cutoff",
      "amount": 0.4
    }
  ],
  
  "pluginUI": {
    "title": "${synth} - ${description}",
    "sections": ["Oscillator", "Filter", "Envelopes", "Modulation", "Effects"]
  }
}

Make sure your patch instructions are detailed, professional, and easy to follow. Focus on practical settings that will create the desired sound on ${synth}. Use proper markdown formatting in the text field.`;
  
  try {
    console.log('Generating patch guide with Gemini API...');
    const model = gemini.getGenerativeModel({ model: 'gemini-1.5-pro' });
    
    const response = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
      }
    });
    
    if (!response || !response.response) {
      console.error('Empty response from Gemini API');
      throw new Error('Empty response from Gemini API');
    }
    
    // Gemini returns a response with text
    const responseText = response.response.text();
    console.log('Received response from Gemini API:', responseText.substring(0, 100) + '...');
    
    // Try to extract JSON from the response
    let json = responseText;
    
    try {
      // First, check if the response is wrapped in markdown code blocks
      const codeBlockMatch = json.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch && codeBlockMatch[1]) {
        json = codeBlockMatch[1].trim();
      }
      
      // Try to parse the JSON response
      const result = JSON.parse(json) as PatchGuideResult;
      
      // Ensure all required fields are present with defaults if needed
      return {
        text: result.text || `# ${synth} Patch: ${description}\n\n## Overview\nA professional patch recipe for creating this sound.\n\n## Oscillator Section\n• Use sawtooth waveform for rich harmonics\n• Set unison to 4-8 voices for thickness\n• Detune slightly for analog warmth\n\n## Filter Section\n• Low-pass filter with moderate cutoff\n• Add resonance for character\n• Use envelope modulation for movement\n\n## Envelope Settings\n• Quick attack for immediate response\n• Medium decay and sustain for body\n• Longer release for smooth fade\n\n## Effects\n• Add reverb for space\n• Use delay for depth\n• Apply subtle chorus for width`,
        waveform: result.waveform || 'saw',
        adsr: result.adsr || {
          filterEnv: { attack: 0.1, decay: 0.5, sustain: 0.7, release: 1.0 },
          ampEnv: { attack: 0.05, decay: 0.3, sustain: 0.8, release: 1.2 }
        },
        knobs: result.knobs || [
          { name: "Cutoff", value: 0.7, section: "Filter" },
          { name: "Resonance", value: 0.3, section: "Filter" },
          { name: "Drive", value: 0.2, section: "Filter" },
          { name: "Reverb Size", value: 0.6, section: "Effects" },
          { name: "LFO Rate", value: 0.3, section: "Modulation" },
          { name: "LFO Depth", value: 0.5, section: "Modulation" }
        ],
        modMatrix: result.modMatrix || [
          { source: "LFO 1", target: "Filter Cutoff", amount: 0.6 },
          { source: "Filter Env", target: "Filter Cutoff", amount: 0.8 }
        ],
        pluginUI: result.pluginUI || { title: `${synth} - ${description}` }
      };
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      console.log('Raw response:', json.substring(0, 200) + '...');
      
      // Try to extract JSON from the text using a more flexible regex
      try {
        const jsonMatch = json.match(/(\{[\s\S]*\})/);
        if (jsonMatch && jsonMatch[1]) {
          const extractedJson = JSON.parse(jsonMatch[1]) as PatchGuideResult;
          
          return {
            text: extractedJson.text || `# ${synth} Patch: ${description}\n\n## Overview\nA professional patch recipe for creating this sound.\n\n## Oscillator Section\n• Use sawtooth waveform for rich harmonics\n• Set unison to 4-8 voices for thickness\n• Detune slightly for analog warmth\n\n## Filter Section\n• Low-pass filter with moderate cutoff\n• Add resonance for character\n• Use envelope modulation for movement\n\n## Envelope Settings\n• Quick attack for immediate response\n• Medium decay and sustain for body\n• Longer release for smooth fade\n\n## Effects\n• Add reverb for space\n• Use delay for depth\n• Apply subtle chorus for width`,
            waveform: extractedJson.waveform || 'saw',
            adsr: extractedJson.adsr || {
              filterEnv: { attack: 0.1, decay: 0.5, sustain: 0.7, release: 1.0 },
              ampEnv: { attack: 0.05, decay: 0.3, sustain: 0.8, release: 1.2 }
            },
            knobs: extractedJson.knobs || [
              { name: "Cutoff", value: 0.7, section: "Filter" },
              { name: "Resonance", value: 0.3, section: "Filter" },
              { name: "Drive", value: 0.2, section: "Filter" },
              { name: "Reverb Size", value: 0.6, section: "Effects" },
              { name: "LFO Rate", value: 0.3, section: "Modulation" },
              { name: "LFO Depth", value: 0.5, section: "Modulation" }
            ],
            modMatrix: extractedJson.modMatrix || [
              { source: "LFO 1", target: "Filter Cutoff", amount: 0.6 },
              { source: "Filter Env", target: "Filter Cutoff", amount: 0.8 }
            ],
            pluginUI: extractedJson.pluginUI || { title: `${synth} - ${description}` }
          };
        }
      } catch (e) {
        console.error('Failed to extract JSON with regex:', e);
      }
      
      // If all else fails, return a basic structure with the text
      return {
        text: `# ${synth} Patch Guide: ${description}\n\n## Raw Response\n${json.substring(0, 1000)}...`,
        waveform: 'saw',
        adsr: {
          filterEnv: { attack: 0.1, decay: 0.5, sustain: 0.7, release: 1.0 },
          ampEnv: { attack: 0.05, decay: 0.3, sustain: 0.8, release: 1.2 }
        },
        knobs: [
          { name: "Cutoff", value: 0.7, section: "Filter" },
          { name: "Resonance", value: 0.3, section: "Filter" },
          { name: "Drive", value: 0.2, section: "Filter" },
          { name: "Reverb Size", value: 0.6, section: "Effects" },
          { name: "LFO Rate", value: 0.3, section: "Modulation" },
          { name: "LFO Depth", value: 0.5, section: "Modulation" }
        ],
        modMatrix: [
          { source: "LFO 1", target: "Filter Cutoff", amount: 0.6 },
          { source: "Filter Env", target: "Filter Cutoff", amount: 0.8 }
        ],
        pluginUI: { title: `${synth} - ${description}` }
      };
    }
  } catch (error) {
    console.error("Error generating patch guide:", error);
    
    // Return a fallback response instead of throwing
    return {
      text: `# Error Generating Patch Guide\n\nWe encountered an issue while creating your patch guide for "${description}" on ${synth}. Please try again or try a different description.\n\nError details: ${error.message || "Unknown error"}`,
      waveform: "saw",
      adsr: {
        filterEnv: { attack: 0.1, decay: 0.5, sustain: 0.7, release: 1.0 },
        ampEnv: { attack: 0.05, decay: 0.3, sustain: 0.8, release: 1.2 }
      },
      knobs: [
        { name: "Cutoff", value: 0.7, section: "Filter" },
        { name: "Resonance", value: 0.3, section: "Filter" },
        { name: "Drive", value: 0.2, section: "Filter" },
        { name: "Reverb Size", value: 0.6, section: "Effects" },
        { name: "LFO Rate", value: 0.3, section: "Modulation" },
        { name: "LFO Depth", value: 0.5, section: "Modulation" }
      ],
      modMatrix: [
        { source: "LFO 1", target: "Filter Cutoff", amount: 0.6 },
        { source: "Filter Env", target: "Filter Cutoff", amount: 0.8 }
      ],
      pluginUI: { title: `${synth} - ${description}` }
    };
  }
}