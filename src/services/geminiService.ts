// services/geminiService.ts

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GEMINI_MODEL_NAME } from "../constants/constants";
import {
  UserInputs,
  MidiSettings,
  MixFeedbackInputs,
  MixComparisonInputs,
  ChatMessage,
  GuidebookEntry
} from "../constants/types";
import { getDawMetadata, suggestPlugins, dawMetadata, DawMetadata } from "../constants/dawMetadata";

const apiKey = 
  process.env.API_KEY ||
  process.env.GEMINI_API_KEY ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY);

if (!apiKey) {
  throw new Error("API key not configured. Set GEMINI_API_KEY or VITE_GEMINI_API_KEY environment variable.");
}
const ai = new GoogleGenAI({ apiKey });

/**
 * Helper function to build plugin-specific parameter suggestions
 */
function buildPluginParameterSection(daw?: string, plugins?: string): string {
  if (!daw && !plugins) {
    return `
### 🎛️ Processing Tips & Plugin Parameters

**EQ Settings:**
- High-pass filter: 20-40 Hz to remove sub-bass rumble
- Low-mid cut: 200-400 Hz to reduce muddiness
- Presence boost: 2-5 kHz for clarity
- Air boost: 10-15 kHz for sparkle

**Compression:**
- Ratio: 3:1 to 4:1 for moderate control
- Attack: 10-30ms for punch retention
- Release: 100-300ms for natural decay
- Makeup gain: 2-6 dB as needed

**Reverb & Delay:**
- Room reverb: 0.8-1.5s decay for space
- Delay: 1/8 or 1/4 note timing
- High-cut: 8-12 kHz to avoid harshness
- Mix: 15-30% for depth without wash`;
  }

  // Get DAW-specific stock plugins from dawMetadata
  const dawData = daw ? getDawMetadata(daw) : null;
  
  const stockEQ = dawData && daw ? suggestPlugins(daw, 'EQ')[0] || 'Stock EQ' : 'Stock EQ';
  const stockCompression = dawData && daw ? suggestPlugins(daw, 'Compression')[0] || 'Stock Compressor' : 'Stock Compressor';
  const stockReverb = dawData && daw ? suggestPlugins(daw, 'Reverb')[0] || 'Stock Reverb' : 'Stock Reverb';
  const stockDelay = dawData && daw ? suggestPlugins(daw, 'Delay')[0] || 'Stock Delay' : 'Stock Delay';
  const stockCreative = dawData && daw ? suggestPlugins(daw, 'Creative')[0] || 'Stock Saturator' : 'Stock Saturator';

  const dawSpecific = daw && !plugins ? `**${daw} Stock Plugin Chain:**` : daw ? `**${daw}-Specific Settings:**` : '';
  const pluginSpecific = plugins ? `**Custom Plugin Chain (${plugins}):**` : '';

  return `
### 🎛️ Processing Tips & Plugin Parameters
${dawSpecific}
${pluginSpecific}

**EQ Parameters:**
${dawData && !plugins ? 
  `- ${stockEQ}: High-pass at ${daw?.toLowerCase().includes('logic') ? '35' : daw?.toLowerCase().includes('fl') ? '30' : '40'} Hz, Low-mid cut at ${daw?.toLowerCase().includes('logic') ? '300' : daw?.toLowerCase().includes('fl') ? '400' : '250'} Hz (-3dB), Presence boost at ${daw?.toLowerCase().includes('logic') ? '12 kHz (+1.5dB)' : daw?.toLowerCase().includes('fl') ? '15 kHz (+2dB)' : '3 kHz (+2dB)'}` :
  daw === 'Ableton Live' ? '- EQ Eight: High-pass at 40 Hz, Low-mid cut at 250 Hz (-3dB), Presence boost at 3 kHz (+2dB)' : 
  daw === 'Logic Pro' ? '- Channel EQ: High-pass at 35 Hz, Low-mid cut at 300 Hz (-2.5dB), High boost at 12 kHz (+1.5dB)' :
  daw === 'FL Studio' ? '- Parametric EQ 2: High-pass at 30 Hz, Mid cut at 400 Hz (-4dB), Air boost at 15 kHz (+2dB)' :
  '- High-pass filter: 20-40 Hz, Low-mid cut: 200-400 Hz (-2 to -4dB), Presence boost: 2-5 kHz (+1 to +3dB)'}

**Compression Settings:**
${dawData && !plugins ? 
  `- ${stockCompression}: Ratio ${daw?.toLowerCase().includes('logic') ? '3.5:1' : '4:1'}, Attack ${daw?.toLowerCase().includes('fl') ? '10ms' : daw?.toLowerCase().includes('logic') ? '20ms' : '15ms'}, Release ${daw?.toLowerCase().includes('logic') ? '150ms' : daw?.toLowerCase().includes('fl') ? '250ms' : '200ms'}${daw?.toLowerCase().includes('logic') ? ', Auto-Release enabled' : daw?.toLowerCase().includes('fl') ? ', Knee 3dB' : ', Knee 2dB'}` :
  daw === 'Ableton Live' ? '- Compressor: Ratio 4:1, Attack 15ms, Release 200ms, Knee 2dB' :
  daw === 'Logic Pro' ? '- Compressor: Ratio 3.5:1, Attack 20ms, Release 150ms, Auto-Release enabled' :
  daw === 'FL Studio' ? '- Fruity Compressor: Ratio 4:1, Attack 10ms, Release 250ms, Knee 3dB' :
  '- Ratio: 3:1 to 4:1, Attack: 10-30ms, Release: 100-300ms, Makeup: 2-6 dB'}

**Time-Based Effects:**
${dawData && !plugins ? 
  `- ${stockReverb}: Room/Hall setting, 1.2s decay, Pre-delay 20ms, Mix 25%
- ${stockDelay}: 1/8 note timing, Feedback 35%, High-cut 8kHz, Mix 20%` :
  daw === 'Ableton Live' ? '- Reverb: Hall algorithm, 1.3s decay, Pre-delay 15ms, Mix 30%\n- Echo: 1/8 note ping-pong, Feedback 30%, Filter cutoff 70%, Mix 25%' :
  daw === 'Logic Pro' ? '- ChromaVerb: Chamber setting, 1.2s decay, Pre-delay 20ms, Mix 25%\n- Delay Designer: 1/8 dotted, Feedback 40%, Low-cut 100Hz, High-cut 9kHz' :
  daw === 'FL Studio' ? '- Reeverb 2: Room size 70%, Diffusion 60%, Decay 1.4s, Mix 22%\n- Fruity Delay 3: Tempo-synced 1/8, Stereo offset 20ms, Feedback 35%' :
  '- Reverb: Medium room/hall, 1-1.5s decay, 15-25ms pre-delay, 20-30% mix\n- Delay: 1/8 or 1/4 note timing, 30-40% feedback, high-cut filter'}

**Recommended Signal Chain:**
${dawData && dawData.suggestedSignalChains && dawData.suggestedSignalChains.Synth ?
  `- ${dawData.suggestedSignalChains.Synth.join(' → ')}` :
  dawData ?
    `- ${stockEQ} → ${stockCompression} → ${stockCreative} → ${stockReverb}/${stockDelay}` :
    daw === 'Ableton Live' ? '- EQ Eight → Compressor → Saturator → Reverb/Echo → Limiter' :
    daw === 'Logic Pro' ? '- Channel EQ → Compressor → Tape → ChromaVerb/Delay Designer → Adaptive Limiter' :
    daw === 'FL Studio' ? '- Parametric EQ 2 → Fruity Compressor → Waveshaper → Reverb/Delay → Fruity Limiter' :
    plugins ? plugins : 'EQ → Compressor → Saturation → Reverb/Delay → Limiter'}`;
}

/**
 * Helper function to build structural blueprint with combined instrumentation
 */
function buildStructuralBlueprint(customFramework?: string, inputs?: UserInputs): string {
  if (customFramework && inputs?.referenceTrackAudio) {
    // Try to parse the customFramework as JSON to create a visual representation
    try {
      const framework = JSON.parse(customFramework);
      
      // Create a formatted markdown table from the JSON framework
      let frameworkTable = "**Song Structure Analysis from Reference Track:**\n\n";
      
      // Add sections information
      frameworkTable += "| **Section** | **Bars** |\n| --- | --- |\n";
      
      if (framework.sections && Array.isArray(framework.sections)) {
        framework.sections.forEach(section => {
          frameworkTable += `| **${section.name}** | ${section.bars} |\n`;
        });
      }
      
      // Add instruments information
      frameworkTable += "\n**Detected Instruments:**\n\n";
      
      if (framework.instruments && Array.isArray(framework.instruments)) {
        framework.instruments.forEach(instrument => {
          frameworkTable += `- ${instrument}\n`;
        });
      }
      
      // Add a note about the matrix visualization
      frameworkTable += "\n**Note:** A detailed arrangement matrix has been analyzed showing which instruments play in each section. This will be visualized in the Song Framework view.\n";
      
      return `
## 🎼 Structural Blueprint

<div className="overflow-x-auto">

${frameworkTable}

**Note to AI:** The above framework was generated from reference track analysis. Use it as a foundation,
but adapt and enhance it based on the user's genre (${inputs.genre?.join(", ")}), 
vibe (${inputs.vibe?.join(", ")}), and available instruments (${inputs.availableInstruments || "Not specified"}).
Feel free to adjust section durations, add or modify sections, and customize instrumentation recommendations
to create a cohesive arrangement that aligns with all user inputs.

</div>`;
    } catch (error) {
      console.error("Error parsing custom framework JSON:", error);
      // Fallback to showing raw JSON if parsing fails
      return `
## 🎼 Structural Blueprint

<div className="overflow-x-auto">

**Reference Track Analysis (JSON format):**
\`\`\`json
${customFramework}
\`\`\`

**Note to AI:** The above framework was generated from reference track analysis. Use it as a foundation,
but adapt and enhance it based on the user's genre (${inputs.genre?.join(", ")}), 
vibe (${inputs.vibe?.join(", ")}), and available instruments (${inputs.availableInstruments || "Not specified"}).
Feel free to adjust section durations, add or modify sections, and customize instrumentation recommendations
to create a cohesive arrangement that aligns with all user inputs.

</div>`;
    }
  } else if (customFramework) {
    // For standalone reference track frameworks: format JSON nicely
    try {
      const framework = JSON.parse(customFramework);
      let formattedJson = JSON.stringify(framework, null, 2);
      
      return `
## 🎼 Structural Blueprint

<div className="overflow-x-auto">
\`\`\`json
${formattedJson}
\`\`\`
</div>`;
    } catch (error) {
      // Fallback to raw JSON
      return `
## 🎼 Structural Blueprint

<div className="overflow-x-auto">
\`\`\`json
${customFramework}
\`\`\`
</div>`;
    }
  }
  
  // Default blueprint when no reference track is provided
  return `
## 🎼 Structural Blueprint

<div className="overflow-x-auto">

| **Section** | **Duration** | **Key Elements & Instrumentation** |
| --- | --- | --- |
| **Intro** | 16-32 bars | Atmospheric build, Teaser elements<br/>*Lead synth, Bass, Drums, Pads* |
| **Verse 1** | 16 bars | Main groove, Vocal/Lead melody<br/>*Vocals, Full arrangement* |
| **Pre-Chorus** | 8 bars | Tension build, Filter sweeps<br/>*Reduced arrangement, Focus elements* |
| **Chorus** | 16 bars | Full energy, Hook elements<br/>*Full arrangement, Vocal harmonies* |
| **Breakdown** | 8-16 bars | Stripped back, Build tension<br/>*Breakdown elements, Build-up* |
| **Verse 2/Solo** | 16 bars | Variation, New elements<br/>*Lead elements, Minimal backing* |
| **Final Chorus** | 16-24 bars | Maximum energy, All elements<br/>*Full arrangement, Climax elements* |
| **Outro** | 16-32 bars | Gradual fade, Ambient tail<br/>*Fade elements, Ambient textures* |

</div>`;
}

// ⚡ Updated to include all UserInputs: title, artist, and guidebookContext
/**
 * 1. Generate the core TrackGuide content (streaming)
 */
export const generateGuidebookContent = async (
  inputs: UserInputs
): Promise<AsyncIterable<GenerateContentResponse>> => {
  const titleContext      = inputs.songTitle       ? `- **Project Name**: ${inputs.songTitle}`           : "";
  const artistContext     = inputs.artistReference ? `- **Artist References**: ${inputs.artistReference}` : "";
  const genreContext      = inputs.genre?.join(", ")  || "Not specified";
  const vibeContext       = inputs.vibe?.join(", ")   || "Not specified";
  const instrumentContext = inputs.availableInstruments || "Not specified";
  const dawContext        = inputs.daw               ? inputs.daw : "Not specified";
  const pluginContext     = inputs.plugins           ? inputs.plugins : "Stock/Generic plugins";
  const keyContext        = inputs.key               ? `Key: ${inputs.key}`                    : "";
  const scaleContext      = inputs.scale             ? `Scale/Mode: ${inputs.scale}`           : "";
  const chordsContext     = inputs.chords            ? `Chord Progression: ${inputs.chords}`    : "";
  const referenceContext  = inputs.referenceTrackLink
                               ? `Reference Track: ${inputs.referenceTrackLink}`
                               : "";
  const lyricsContext     = inputs.lyrics            ? `Lyrics Theme: ${inputs.lyrics}`         : "";
  const notesContext      = inputs.generalNotes      ? `Additional Notes: ${inputs.generalNotes}` : "";

  // Generate custom framework from reference track if available
  let customFramework = "";
  if (inputs.referenceTrackAudio) {
    try {
      // Split instrument string if it exists
      const instruments = inputs.availableInstruments ? 
        inputs.availableInstruments.split(/,\s*/) : 
        undefined;
        
      customFramework = await generateReferenceTrackFramework(
        inputs.referenceTrackAudio,
        inputs.genre?.join(", "),
        inputs.vibe,
        instruments,
        false // Set to false to indicate this is part of TrackGuide, not standalone
      );
      console.log("Generated custom framework from reference track");
    } catch (error) {
      console.error("Error generating framework from reference track:", error);
      // Will fallback to default blueprint if error occurs
    }
  }
  
  const structuralBlueprint = buildStructuralBlueprint(customFramework, inputs);
  const pluginSection       = buildPluginParameterSection(inputs.daw, inputs.plugins);

  const prompt = `// ⚡ Including all fields
You are TrackGuideAI, an expert music production assistant specializing in comprehensive track creation guides.

Create a detailed TrackGuide for the following specifications:
${titleContext}
${artistContext}
- **Genre**: ${genreContext}
- **Vibe**: ${vibeContext}
- **Available Instruments**: ${instrumentContext}
- **DAW**: ${dawContext}
- **Plugins**: ${pluginContext}
${keyContext}
${scaleContext}
${chordsContext}
${referenceContext}
${lyricsContext}
${notesContext}

**IMPORTANT FORMATTING REQUIREMENTS:**
1. Include the exact Structural Blueprint table with Instrumentation column as provided
2. Use specific plugin parameters when DAW/plugins are specified
3. Provide actionable, detailed guidance for each section
4. Use markdown formatting with proper headers and emphasis

**Required Sections:**

${structuralBlueprint}

## 🎵 Genre DNA Analysis
**Core Characteristics:**
- Tempo range and feel
- Harmonic structure and chord progressions
- Rhythmic patterns and groove elements
- Sonic palette and instrumentation choices

**Reference Analysis:**
${inputs.referenceTrackLink ? `Analyze the provided reference track for key production techniques and arrangement ideas.` : `Draw from classic examples in the ${genreContext} genre for inspiration.`}

## 🎹 Instrument & Sound Design
**Primary Elements:**
- Lead sounds: Character, processing, and role
- Bass design: Sub content, mid presence, and groove
- Drum programming: Kick selection, snare character, hi-hat patterns
- Harmonic elements: Pad textures, chord voicings, arpeggios

**Sound Shaping:**
- Synthesis techniques and oscillator choices
- Filter movements and modulation
- Effects processing and spatial placement
- Layering strategies for fullness

${pluginSection}

## 🎚️ Mixing & Arrangement Strategy
**Frequency Management:**
- Low-end: Sub-bass vs bass guitar/synth separation
- Midrange: Vocal/lead clarity and instrument separation  
- High-end: Air, sparkle, and presence balance

**Spatial Design:**
- Stereo width: Center, sides, and phantom center elements
- Depth: Reverb sends, delay throws, and dry/wet balance
- Movement: Automation, panning, and filter sweeps

**Dynamic Control:**
- Compression: Individual tracks and bus processing
- Sidechain: Pumping effects and clarity enhancement
- Limiting: Loudness and peak control

## 🎼 Arrangement Flow & Energy Management
**Section Transitions:**
- Build techniques: Risers, drum fills, filter sweeps
- Drop preparation: Silence, reverse reverbs, tension
- Energy curves: How to maintain listener engagement

**Variation Techniques:**
- Verse differences: Subtle changes to maintain interest
- Chorus variations: Building intensity across repetitions
- Bridge/breakdown: Contrast and reset before final sections

Focus on practical, actionable advice that can be immediately applied in ${dawContext}. Provide specific parameter ranges and creative techniques that align with the ${genreContext} aesthetic and ${vibeContext} mood.`;

  const stream = await ai.models.generateContentStream({
    model: GEMINI_MODEL_NAME,
    contents: prompt,
  });
  return stream;
};

/**
 * 2. Generate MIDI pattern suggestions (streaming) - Returns valid JSON
 */
export const generateMidiPatternSuggestions = async (
  settings: MidiSettings
): Promise<AsyncIterable<GenerateContentResponse>> => {
  const prompt = `// ⚡ Including guidebookContext
You are TrackGuideAI's MIDI Pattern Generator. Generate MIDI patterns in VALID JSON format only.

**Requirements:**
- Key: ${settings.key}
- Scale/Mode: ${settings.scale || "Major/Natural Minor"}
- Tempo: ${settings.tempo} BPM
- Time Signature: ${settings.timeSignature.join("/")}
- Chord Progression: ${settings.chordProgression}
- Genre Context: ${settings.genre}
- Song Section: ${settings.songSection || "General Loop"}
- Bars: ${settings.bars}
- Target Instruments: ${settings.targetInstruments.join(", ")}
- Guidebook Context: ${settings.guidebookContext || "Not specified"}

**JSON Structure Required:**
{
  "chords": [
    {
      "time": 0,
      "name": "Cm",
      "duration": 2,
      "notes": [{"pitch": "C4", "midi": 60}, {"pitch": "Eb4", "midi": 63}, {"pitch": "G4", "midi": 67}],
      "velocity": 90
    }
  ],
  "bassline": [
    {
      "time": 0,
      "midi": 36,
      "duration": 0.5,
      "velocity": 100,
      "pitch": "C2"
    }
  ],
  "melody": [
    {
      "time": 0,
      "midi": 72,
      "duration": 1,
      "velocity": 95,
      "pitch": "C5"
    }
  ],
  "drums": {
    "kick": [
      {"time": 0, "duration": 0.25, "velocity": 120},
      {"time": 2, "duration": 0.25, "velocity": 115}
    ],
    "snare": [
      {"time": 1, "duration": 0.25, "velocity": 100},
      {"time": 3, "duration": 0.25, "velocity": 105}
    ],
    "hihat_closed": [
      {"time": 0.5, "duration": 0.125, "velocity": 80},
      {"time": 1.5, "duration": 0.125, "velocity": 75}
    ],
    "open_hihat": [
      {"time": 1.75, "duration": 0.5, "velocity": 85}
    ],
    "clap": [
      {"time": 1, "duration": 0.25, "velocity": 95}
    ],
    "tom_high": [
      {"time": 3.5, "duration": 0.25, "velocity": 90}
    ],
    "tom_mid": [
      {"time": 3.75, "duration": 0.25, "velocity": 95}
    ],
    "tom_low": [
      {"time": 4, "duration": 0.5, "velocity": 100}
    ],
    "crash_cymbal_1": [
      {"time": 0, "duration": 2, "velocity": 110}
    ],
    "ride_cymbal_1": [
      {"time": 0.5, "duration": 0.25, "velocity": 70}
    ]
  }
}

**CRITICAL REQUIREMENTS:**
1. Return ONLY valid JSON. NO explanatory text, NO markdown formatting, NO code blocks, NO backticks.
2. Start your response directly with { and end with }
3. Do not wrap the JSON in code blocks with three backticks
4. All time values must be in beats (0 to ${settings.bars * 4})
5. All MIDI numbers must be integers between 21-108
6. All durations must be positive numbers
7. All velocities must be integers between 1-127
8. Use appropriate drum elements for ${settings.genre}:
   - Essential: kick, snare, hihat_closed
   - Groove: open_hihat, ride_cymbal_1
   - Accents: clap, crash_cymbal_1
   - Fills: tom_high, tom_mid, tom_low
   - Choose elements that fit the genre and song section

**Genre-Specific Drum Guidelines:**
- Electronic/House/Techno: Focus on kick, hihat_closed, open_hihat, clap
- Rock/Metal: Use kick, snare, hihat_closed, crash_cymbal_1, tom_high, tom_mid, tom_low
- Hip Hop/Trap: Emphasize kick, snare, hihat_closed, clap
- Jazz/Funk: Include ride_cymbal_1, hihat_closed, kick, snare
- Pop: Balanced use of kick, snare, hihat_closed, crash_cymbal_1, clap

Generate patterns appropriate for ${settings.genre} in the ${settings.songSection} section, using ${settings.chordProgression} progression in ${settings.key}.`;

  const stream = await ai.models.generateContentStream({
    model: GEMINI_MODEL_NAME,
    contents: prompt,
  });
  return stream;
};


/**
 * 3. Generate mix feedback (one-shot)
 */
export const generateMixFeedback = async (
  inputs: MixFeedbackInputs
): Promise<string> => {
  const prompt = `You are TrackGuideAI's Mix Analysis Expert. Provide detailed mix feedback.

**Track Analysis:**
- Track Name: ${inputs.trackName}
- Focus Areas: ${inputs.focus || "Overall mix balance and clarity"}
- User Notes: ${inputs.notes || inputs.userNotes || "No specific notes provided"}

**Analysis Framework:**
1. **Frequency Balance**
   - Low-end: Sub-bass presence and bass clarity
   - Midrange: Vocal/lead prominence and instrument separation
   - High-end: Air, sparkle, and harshness assessment

2. **Spatial Characteristics**
   - Stereo width and imaging
   - Depth and dimension
   - Center focus vs side content

3. **Dynamic Properties**
   - Compression effectiveness
   - Transient preservation
   - Overall loudness and headroom

4. **Technical Assessment**
   - Phase relationships
   - Distortion or artifacts
   - Noise floor and clarity

**Provide specific, actionable feedback with:**
- Identified strengths and areas for improvement
- Specific frequency ranges and dB adjustments
- Plugin suggestions and parameter recommendations
- Before/after comparison techniques

Focus on practical improvements that can be implemented immediately.`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL_NAME,
    contents: prompt,
  });
  return response.text || "Unable to generate mix feedback. Please try again.";
};

/**
 * 4. Generate mix comparison (one-shot)
 */
export const generateMixComparison = async (
  inputs: MixComparisonInputs
): Promise<string> => {
  const { dawName } = inputs;
  
  // Include DAW-specific recommendations if a DAW is selected
  let dawSpecificAdvice = '';
  if (dawName) {
    const daw = dawMetadata.find((d: DawMetadata) => d.dawName === dawName);
    if (daw) {
      dawSpecificAdvice = `
## 🎛️ ${dawName}-Specific Recommendations

The user is working with ${dawName}. Provide tailored recommendations using the following plugins and workflow tips:

- Stock Plugins: ${daw.stockPlugins.EQ.join(', ')} for EQ; ${daw.stockPlugins.Compression.join(', ')} for compression; 
  ${daw.stockPlugins.Reverb.join(', ')} for reverb; ${daw.stockPlugins.Delay.join(', ')} for delay.
- Creative Effects: ${daw.stockPlugins.Creative.join(', ')}
- Workflow Tips: ${daw.workflowTips.join('; ')}
`;
    }
  }

  const prompt = `
You are an expert mixing & mastering AI. The user has uploaded two mixes:

Mix A: "${inputs.mixAName}" — an earlier version  
Mix B: "${inputs.mixBName}" — the current working version  

🎧 Instructions:
- Mix B is the active version — focus all actionable feedback on improving Mix B.
- Mix A is an earlier version — if Mix A has strengths vs Mix B, point those out.
- Acknowledge improvements made in Mix B compared to A.
- Do NOT suggest changes to Mix A (it is not being revised).

If "Request full mix analysis" is selected → add full technical breakdown of Mix B (like in your Mix Feedback function).

Provide your analysis in clear Markdown format with the following sections:

## 🎧 Overall Comparison

## 🎛️ Frequency Balance

## 🎚️ Stereo Image & Depth

## 📈 Dynamics & Loudness

## ⚙️ Technical Quality

## 🏆 Strengths & Opportunities (for Mix B)

## 🚀 Actionable Recommendations (for Mix B only)
${dawSpecificAdvice}
`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL_NAME,
    contents: prompt,
  });
  return response.text || "Unable to generate mix comparison. Please try again.";
};
/**
 * 5. Generate AI-assistant chat response (streaming)
 */
export const generateAIAssistantResponse = async (
  conversation: ChatMessage[],
  guidebook: GuidebookEntry,
  additionalContext?: {
    remixGuideContent?: string;
    mixFeedbackContent?: string;
    mixComparisonContent?: string;
    patchGuideContent?: string;
    activeView?: string;
  }
): Promise<AsyncIterable<GenerateContentResponse>> => {
  const history = conversation
    .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
    .join("\n");

  const contextInfo = `
**Current Guidebook Context:**
- Title: ${guidebook.title}
- Genre: ${guidebook.genre.join(", ")}
- Vibe: ${guidebook.vibe.join(", ")}
- DAW: ${guidebook.daw}
- Key: ${guidebook.key || "Not specified"}
- Available Instruments: ${guidebook.availableInstruments}`;

  // Build additional context from other guides
  let additionalGuideContext = '';
  if (additionalContext) {
    const { remixGuideContent, mixFeedbackContent, mixComparisonContent, patchGuideContent, activeView } = additionalContext;
    
    if (activeView) {
      additionalGuideContext += `\n**Current View:** ${activeView}`;
    }
    
    if (remixGuideContent) {
      additionalGuideContext += `\n\n**Active RemixGuide:**\n${remixGuideContent.substring(0, 2000)}${remixGuideContent.length > 2000 ? '...' : ''}`;
    }
    
    if (mixFeedbackContent) {
      additionalGuideContext += `\n\n**Active Mix Feedback:**\n${mixFeedbackContent.substring(0, 2000)}${mixFeedbackContent.length > 2000 ? '...' : ''}`;
    }
    
    if (mixComparisonContent) {
      additionalGuideContext += `\n\n**Active Mix Comparison:**\n${mixComparisonContent.substring(0, 2000)}${mixComparisonContent.length > 2000 ? '...' : ''}`;
    }
    
    if (patchGuideContent) {
      additionalGuideContext += `\n\n**Active PatchGuide:**\n${patchGuideContent.substring(0, 2000)}${patchGuideContent.length > 2000 ? '...' : ''}`;
    }
  }

  const prompt = `You are TrackGuideAI, an expert music production assistant. You're helping a user with their current track project.

${contextInfo}${additionalGuideContext}

**Conversation History:**
${history}

**Your Role:**
- Provide specific, actionable music production advice
- Reference the current guidebook context when relevant
- Integrate insights from any active guides (RemixGuide, Mix Feedback, Mix Comparison, PatchGuide)
- Offer technical solutions and creative suggestions based on all available context
- Ask clarifying questions when needed
- Maintain a helpful, professional tone

**Response Guidelines:**
- CRITICAL: DO NOT use any markdown formatting - no asterisks, no bold, no lists with asterisks
- Present complete information in a concise, direct format - maintain all useful details but remove filler text
- Use simple text formatting only:
  - Use numbered lists (1. 2. 3.) for steps or items
  - Use plain text headers followed by a colon
  - Use simple "Name: value" pairs for parameters (Attack: 10ms)
- Technical advice should include all essential parameters with specific values
- Keep paragraphs focused - one idea per paragraph
- For workflows or processes, use clear numbered steps
- When providing multiple options or techniques, include 3-4 of the most relevant ones
- Structure information in scannable sections with clear headers

Respond as the helpful TrackGuideAI assistant with full awareness of the user's current project context.`;

  const stream = await ai.models.generateContentStream({
    model: GEMINI_MODEL_NAME,
    contents: prompt,
  });
  return stream;
};

/**
 * 6a. Generate RemixGuide with streaming support
 */
export async function* generateRemixGuideStream(
  audioData: { base64: string; mimeType: string },
  targetGenre: string,
  genreInfo: any,
  daw?: string,
  plugins?: string
): AsyncGenerator<{ text: string; metadata?: any }, void, unknown> {
  if (!apiKey) {
    throw new Error("API Key not configured. Cannot connect to Gemini API for remix guide.");
  }

  try {
    // Get basic genre info from remixGenres.ts
    const tempoRange = genreInfo?.tempoRange ? `${genreInfo.tempoRange[0]}-${genreInfo.tempoRange[1]} BPM` : "120-130 BPM";
    const sections = genreInfo?.sections || ["Intro", "Build-Up", "Drop", "Breakdown", "Outro"];
    
    // Try to get enhanced metadata if available (import at the top of the file)
    let metadataBlock: any = null;
    try {
      // We're using dynamic import to avoid circular dependencies
      const { getGenreMetadata } = await import('../constants/genreMetadata');
      metadataBlock = getGenreMetadata(targetGenre);
    } catch (err) {
      console.warn('Could not load genre metadata:', err);
    }
    
    // Extract relevant metadata for the prompt
    const chordProgressions = metadataBlock?.chordProgressions?.join(", ") || "Standard progressions for this genre";
    const productionTips = metadataBlock?.productionTips?.join(", ") || "Standard production techniques";
    const scalesAndModes = metadataBlock?.scalesAndModes || "Appropriate scales for this genre";
    const songStructure = metadataBlock?.songStructure || sections.join(" → ");
    const dynamicRange = metadataBlock?.dynamicRange || "Standard dynamics for this genre";
    const relatedGenres = metadataBlock?.relatedGenres?.join(", ") || "Similar genres";
    
    const structuralBlueprint = buildStructuralBlueprint();
    const pluginSection = buildPluginParameterSection(daw, plugins);
    
    const prompt = `You are TrackGuideAI's Remix Specialist. Analyze the uploaded audio track and create a comprehensive remix guide for transforming it into ${targetGenre} style.

**User Production Setup:**
- **DAW:** ${daw || "Not specified"}
- **Available Plugins:** ${plugins || "Stock/Generic plugins"}

**Analysis Requirements:**
1. Identify the original track's tempo, key, harmonic progression, and rhythmic characteristics
2. Determine optimal transformation approach for ${targetGenre}
3. Provide detailed production guidance with specific techniques
4. Include plugin-specific parameter recommendations based on user's setup

**Target Genre:** ${targetGenre}
**Target Tempo Range:** ${tempoRange}
**Suggested Sections:** ${sections.join(", ")}
${metadataBlock?.drumPatterns ? `**Typical Drum Patterns:** ${metadataBlock.drumPatterns}` : ''}
${chordProgressions ? `**Common Chord Progressions:** ${chordProgressions}` : ''}
${scalesAndModes ? `**Typical Scales/Modes:** ${scalesAndModes}` : ''}
${songStructure ? `**Song Structure:** ${songStructure}` : ''}
${dynamicRange ? `**Dynamic Characteristics:** ${dynamicRange}` : ''}
${relatedGenres ? `**Related Genres for Inspiration:** ${relatedGenres}` : ''}
${productionTips ? `**Production Techniques:** ${productionTips}` : ''}

Create a detailed markdown remix guide that includes:

# 🎵 REMIX GUIDE: [Original Track] → ${targetGenre}

## 🎧 Original Track DNA Analysis
**Detected Characteristics:**
- **Original Tempo:** [Detected BPM]
- **Original Key:** [Detected Key]
- **Harmonic Blueprint:** [Chord progression analysis]
- **Rhythmic Feel:** [Time signature and groove analysis]
- **Sonic Character:** [Tonal qualities and instrumentation]

**Transformation Strategy:**
- **Target Tempo:** [Recommended BPM within ${tempoRange}]
- **Target Tempo:** [Recommended BPM within ${tempoRange}]
- **Target Key:** [Optimal key for ${targetGenre}]ments]
- **Genre Adaptation:** [How to adapt original elements]
${structuralBlueprint}
${structuralBlueprint}
## 🎹 Sound Design & Instrumentation Transformation
## 🎹 Sound Design & Instrumentation Transformation
**Lead Elements:**argetGenre}:** Transform existing leads using specific techniques
- **Original → ${targetGenre}:** Transform existing leads using specific techniques
- **New Elements:** Add characteristic ${targetGenre} soundsparameters
- **Processing Chain:** Specific plugin recommendations and parameters
**Rhythm Section Redesign:**
**Rhythm Section Redesign:**rgetGenre}-specific patterns and sounds
- **Drum Programming:** ${targetGenre}-specific patterns and sounds
- **Bass Design:** Transform or replace bass elementsenre} percussion
- **Percussion Layers:** Add characteristic ${targetGenre} percussion
## 🔊 Mixing & Processing Techniques
## 🔊 Mixing & Processing Techniques
**Signal Chain Recommendations:**
${pluginSection}
**${targetGenre}-Specific Processing:**
**${targetGenre}-Specific Processing:**
- Genre-characteristic EQ curvesargetGenre}
- Compression techniques for ${targetGenre}
- Saturation and distortion applicationsthe genre
- Spatial processing (reverb/delay) for the genre
## 🎯 Arrangement & Structure
## 🎯 Arrangement & Structuren:**
**Section-by-Section Breakdown:**=> `
${sections.map((section: string) => `
**${section}:**nclude/exclude
- Elements to include/exclude
- Energy level and dynamics
- Transition techniques
`).join('')}
**Dynamic Build Strategy:**
**Dynamic Build Strategy:** release
- How to create tension and release
- Filter sweeps and automation
- Risers and impacts placement
## 💡 Creative Production Tips
## 💡 Creative Production Tips} techniques
- Unconventional ${targetGenre} techniques
- Experimental processing ideasns
- Sample manipulation suggestions
- Layering strategies for depth
---
---nerated by TrackGuideAI - Your AI Music Production Assistant*`;
*Generated by TrackGuideAI - Your AI Music Production Assistant*`;
    const response = await ai.models.generateContentStream({
    const response = await ai.models.generateContentStream({
      model: GEMINI_MODEL_NAME,
      contents: [
        { role: 'user',
          role: 'user',
          parts: [
            { text: prompt
              text: prompt
            },
            { inlineData: {
              inlineData: {udioData.mimeType,
                mimeType: audioData.mimeType,
                data: audioData.base64
              }
            }
          ]
        }
      ]
    });
    let fullText = '';
    let fullText = '';hunk of response) {
    for await (const chunk of response) {
      const text = chunk.text;
      if (text) {+= text;
        fullText += text;
        yield { text };
      }
    }
    // Extract metadata from the generated content
    // Extract metadata from the generated content);
    const metadata = extractRemixMetadata(fullText);
    yield { text: '', metadata };
  } catch (error) {
  } catch (error) {Error generating remix guide stream:', error);
    console.error('Error generating remix guide stream:', error);anceof Error ? error.message : 'Unknown error'}`);
    throw new Error(`Failed to generate remix guide: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
// Helper function to extract metadata from remix guide
// Helper function to extract metadata from remix guide
function extractRemixMetadata(content: string): any {
  const metadata: any = {};
  // Extract tempo information
  // Extract tempo informationontent.match(/Original Tempo:\s*(\d+)/i);
  const originalTempoMatch = content.match(/Original Tempo:\s*(\d+)/i);
  if (originalTempoMatch) {= parseInt(originalTempoMatch[1]);
    metadata.originalTempo = parseInt(originalTempoMatch[1]);
  }
  const targetTempoMatch = content.match(/Target Tempo:\s*(\d+)/i);
  const targetTempoMatch = content.match(/Target Tempo:\s*(\d+)/i);
  if (targetTempoMatch) {= parseInt(targetTempoMatch[1]);
    metadata.targetTempo = parseInt(targetTempoMatch[1]);
  }
  // Extract key information
  // Extract key informationontent.match(/Original Key:\s*([A-G][#b]?\s*(?:major|minor|maj|min))/i);
  const originalKeyMatch = content.match(/Original Key:\s*([A-G][#b]?\s*(?:major|minor|maj|min))/i);
  if (originalKeyMatch) {= originalKeyMatch[1];
    metadata.originalKey = originalKeyMatch[1];
  }
  const targetKeyMatch = content.match(/Target Key:\s*([A-G][#b]?\s*(?:major|minor|maj|min))/i);
  const targetKeyMatch = content.match(/Target Key:\s*([A-G][#b]?\s*(?:major|minor|maj|min))/i);
  if (targetKeyMatch) {= targetKeyMatch[1];
    metadata.targetKey = targetKeyMatch[1];
  }
  // Extract chord progression
  // Extract chord progressionnt.match(/Harmonic Blueprint:\s*([IVXivx\d\s\-,]+)/i);
  const chordProgMatch = content.match(/Harmonic Blueprint:\s*([IVXivx\d\s\-,]+)/i);
  if (chordProgMatch) {ordProgression = chordProgMatch[1].trim();
    metadata.originalChordProgression = chordProgMatch[1].trim();
  }
  // Extract sections
  // Extract sections = content.match(/Sections:\s*\[(.*?)\]/i);
  const sectionsMatch = content.match(/Sections:\s*\[(.*?)\]/i);
  if (sectionsMatch) {= sectionsMatch[1].split(',').map(s => s.trim().replace(/"/g, ''));
    metadata.sections = sectionsMatch[1].split(',').map(s => s.trim().replace(/"/g, ''));
  }
  return metadata;
  return metadata;
}
/**
/**6. Generate RemixGuide with full functionality (matches component expectations)
 * 6. Generate RemixGuide with full functionality (matches component expectations)
 */ort async function generateRemixGuide(
export async function generateRemixGuide(string },
  audioData: { base64: string; mimeType: string },
  targetGenre: string,
  genreInfo: any,
  daw?: string,ing
  plugins?: string
): Promise<{ing;
  guide: string;umber;
  targetTempo: number;
  targetKey: string;;
  sections: string[];g;
  originalKey?: string;r;
  originalTempo?: number;n?: string;
  originalChordProgression?: string;
}> { (!apiKey) {
  if (!apiKey) {ror("API Key not configured. Cannot connect to Gemini API for remix guide.");
    throw new Error("API Key not configured. Cannot connect to Gemini API for remix guide.");
  }
  try {
  try {st tempoRange = genreInfo?.tempoRange ? `${genreInfo.tempoRange[0]}-${genreInfo.tempoRange[1]} BPM` : "120-130 BPM";
    const tempoRange = genreInfo?.tempoRange ? `${genreInfo.tempoRange[0]}-${genreInfo.tempoRange[1]} BPM` : "120-130 BPM";
    const sections = genreInfo?.sections || ["Intro", "Build-Up", "Drop", "Breakdown", "Outro"];
    const structuralBlueprint = buildStructuralBlueprint();
    const structuralBlueprint = buildStructuralBlueprint();plugins);
    const pluginSection = buildPluginParameterSection(daw, plugins);
    const prompt = `You are TrackGuideAI's Remix Specialist. Analyze the uploaded audio track and create a comprehensive remix guide for transforming it into ${targetGenre} style.
    const prompt = `You are TrackGuideAI's Remix Specialist. Analyze the uploaded audio track and create a comprehensive remix guide for transforming it into ${targetGenre} style.
**User Production Setup:**
**User Production Setup:**pecified"}
- **DAW:** ${daw || "Not specified"}| "Stock/Generic plugins"}
- **Available Plugins:** ${plugins || "Stock/Generic plugins"}
**Analysis Requirements:**
**Analysis Requirements:**rack's tempo, key, harmonic progression, and rhythmic characteristics
1. Identify the original track's tempo, key, harmonic progression, and rhythmic characteristics
2. Determine optimal transformation approach for ${targetGenre}s
3. Provide detailed production guidance with specific techniqueser's setup
4. Include plugin-specific parameter recommendations based on user's setup
**Target Genre:** ${targetGenre}
**Target Genre:** ${targetGenre}ange}
**Target Tempo Range:** ${tempoRange}in(", ")}
**Suggested Sections:** ${sections.join(", ")}
**CRITICAL: Return your response in this EXACT JSON format:**
**CRITICAL: Return your response in this EXACT JSON format:**
{ "guide": "FULL_MARKDOWN_GUIDE_HERE",
  "guide": "FULL_MARKDOWN_GUIDE_HERE",
  "originalTempo": 120,or",
  "originalKey": "C minor",": "i-VI-III-VII",
  "originalChordProgression": "i-VI-III-VII",
  "targetTempo": 128,or",
  "targetKey": "C minor",Build-Up", "Drop", "Breakdown", "Outro"]
  "sections": ["Intro", "Build-Up", "Drop", "Breakdown", "Outro"]
}
**For the "guide" field, create a detailed markdown guide that includes:**
**For the "guide" field, create a detailed markdown guide that includes:**
# 🎵 REMIX GUIDE: [Original Track] → ${targetGenre}
# 🎵 REMIX GUIDE: [Original Track] → ${targetGenre}
## 🎧 Original Track DNA Analysis
## 🎧 Original Track DNA Analysis
**Detected Characteristics:**ed BPM]
- **Original Tempo:** [Detected BPM]
- **Original Key:** [Detected Key]rogression analysis]
- **Harmonic Blueprint:** [Chord progression analysis]is]
- **Rhythmic Feel:** [Time signature and groove analysis]on]
- **Sonic Character:** [Tonal qualities and instrumentation]
**Transformation Strategy:**
**Transformation Strategy:**nded BPM within ${tempoRange}]
- **Target Tempo:** [Recommended BPM within ${tempoRange}]
- **Target Key:** [Optimal key for ${targetGenre}]ments]
- **Genre Adaptation:** [How to adapt original elements]
${structuralBlueprint}
${structuralBlueprint}
## 🎹 Sound Design & Instrumentation Transformation
## 🎹 Sound Design & Instrumentation Transformation
**Lead Elements:**argetGenre}:** Transform existing leads using specific techniques
- **Original → ${targetGenre}:** Transform existing leads using specific techniques
- **New Elements:** Add characteristic ${targetGenre} soundsparameters
- **Processing Chain:** Specific plugin recommendations and parameters
**Rhythm Section Redesign:**
**Rhythm Section Redesign:**rgetGenre}-specific patterns and sounds
- **Drum Programming:** ${targetGenre}-specific patterns and soundsrgetGenre}
- **Bass Design:** Sub-bass content and mid-range presence for ${targetGenre}
- **Percussion:** Additional elements typical of ${targetGenre}
**Harmonic Content:**
**Harmonic Content:** Adapt progressions for ${targetGenre} aesthetic
- **Chord Voicings:** Adapt progressions for ${targetGenre} aesthetic
- **Pad Textures:** Atmospheric elements and spatial design
- **Arpeggios/Sequences:** Rhythmic harmonic content
${pluginSection}
${pluginSection}
## 🎚️ Production Techniques & Processing
## 🎚️ Production Techniques & Processing
**Arrangement Strategy:*** Build-ups, drops, and breakdowns for ${targetGenre}
- **Section Transitions:** Build-ups, drops, and breakdowns for ${targetGenre}
- **Energy Management:** How to structure dynamics across sectionsrce material
- **Original Element Integration:** Preserving vs transforming source material
**Mix Approach:**
**Mix Approach:**agement:** EQ strategies for ${targetGenre} clarity
- **Frequency Management:** EQ strategies for ${targetGenre} clarity
- **Spatial Design:** Stereo width and depth characteristicsgetGenre} impact
- **Dynamic Processing:** Compression and limiting for ${targetGenre} impact
**Effects Processing:**
**Effects Processing:**** Reverb and delay for ${targetGenre} space
- **Time-Based Effects:** Reverb and delay for ${targetGenre} space
- **Modulation:** LFOs, filters, and movementushing, and character effects
- **Creative Processing:** Distortion, bit-crushing, and character effects
## 🎼 Step-by-Step Remix Process
## 🎼 Step-by-Step Remix Process
**Phase 1: Preparation**cific technique for tempo change
1. Tempo adjustment: Specific technique for tempo change
2. Key transposition: If needed, method and toolsion
3. Audio editing: Chopping, slicing, and preparation
**Phase 2: Foundation**
**Phase 2: Foundation**targetGenre} patterns and sounds
1. Drum programming: ${targetGenre} patterns and sounds
2. Bass design: Sub and mid-bass for ${targetGenre}ings
3. Harmonic foundation: Chord progressions and voicings
**Phase 3: Development**
**Phase 3: Development**Processing original or creating new
1. Lead transformation: Processing original or creating new
2. Atmospheric elements: Pads, textures, and ambiencent
3. Rhythmic elements: Percussion and groove enhancement
**Phase 4: Arrangement**
**Phase 4: Arrangement**tro, build-ups, drops, breakdowns
1. Section structure: Intro, build-ups, drops, breakdowns
2. Transition techniques: Risers, sweeps, and cutsnt
3. Variation strategies: Keeping listener engagement
**Phase 5: Mix & Master**
**Phase 5: Mix & Master**argetGenre}-specific EQ approach
1. Frequency balance: ${targetGenre}-specific EQ approach
2. Dynamic control: Compression and limiting strategies
3. Spatial processing: Stereo width and depthcement
4. Final polish: Loudness and character enhancement
## 🔥 Pro Tips for ${targetGenre} Remix Success
## 🔥 Pro Tips for ${targetGenre} Remix Successhat define ${targetGenre}
- **Signature Elements:** Key characteristics that define ${targetGenre}
- **Common Pitfalls:** What to avoid when adapting to ${targetGenre}argetGenre}
- **Creative Opportunities:** Unique ways to blend original with ${targetGenre}
- **Reference Tracks:** Study these ${targetGenre} examples for inspiration
Focus on practical, actionable techniques that can be implemented immediately. Provide specific parameter suggestions and creative approaches that honor both the original track and the target genre aesthetic.
Focus on practical, actionable techniques that can be implemented immediately. Provide specific parameter suggestions and creative approaches that honor both the original track and the target genre aesthetic.
**IMPORTANT:** Return ONLY the JSON object with the complete markdown guide in the "guide" field. Focus on detailed analysis and production techniques.`;
**IMPORTANT:** Return ONLY the JSON object with the complete markdown guide in the "guide" field. Focus on detailed analysis and production techniques.`;
    const textPart = { text: prompt };
    const textPart = { text: prompt };
    const audioPart = {a: audioData.base64, mimeType: audioData.mimeType },
      inlineData: { data: audioData.base64, mimeType: audioData.mimeType },
    };
    const contents = [audioPart, textPart];
    const contents = [audioPart, textPart];
    const response = await ai.models.generateContent({
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,ts },
      contents: { parts: contents },
    });
    const responseText = response.text;
    const responseText = response.text;') {
    if (typeof responseText !== 'string') {ed response format from Gemini API for remix guide.");
      throw new Error("Received an unexpected response format from Gemini API for remix guide.");
    }
    // Parse the JSON response
    // Parse the JSON response.trim();
    let jsonStr = responseText.trim();n?(.*?)\n?\s*```$/s;
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {m();
      jsonStr = match[2].trim();
    }
    let parsedResponse;
    let parsedResponse;
    try {sedResponse = JSON.parse(jsonStr);
      parsedResponse = JSON.parse(jsonStr);
    } catch (parseError) {d to parse JSON response:", jsonStr);
      console.error("Failed to parse JSON response:", jsonStr);
      // Fallback: extract what we can from the textTempo.*?(\d+)/i);
      const tempoMatch = responseText.match(/Target Tempo.*?(\d+)/i);*(?:major|minor|maj|min)?)/i);
      const keyMatch = responseText.match(/Target Key.*?([A-G][#b]?\s*(?:major|minor|maj|min)?)/i);
      return {
      return { responseText,
        guide: responseText,tch ? parseInt(tempoMatch[1]) : (genreInfo?.tempoRange?.[0] || 128),
        targetTempo: tempoMatch ? parseInt(tempoMatch[1]) : (genreInfo?.tempoRange?.[0] || 128),
        targetKey: keyMatch ? keyMatch[1].trim() : "C minor",
        sections,ey: "C minor",
        originalKey: "C minor",
        originalTempo: 120,ssion: "i-VI-III-VII"
        originalChordProgression: "i-VI-III-VII"
      };
    }
    // Validate and structure the response
    // Validate and structure the response
    const result = {esponse.guide || responseText,
      guide: parsedResponse.guide || responseText,genreInfo?.tempoRange?.[0] || 128),
      targetTempo: parsedResponse.targetTempo || (genreInfo?.tempoRange?.[0] || 128),
      targetKey: parsedResponse.targetKey || "C minor",
      sections: parsedResponse.sections || sections,minor",
      originalKey: parsedResponse.originalKey || "C minor",
      originalTempo: parsedResponse.originalTempo || 120,ordProgression || "i-VI-III-VII"
      originalChordProgression: parsedResponse.originalChordProgression || "i-VI-III-VII"
    };
    return result;
    return result;
  } catch (error) {
  } catch (error) {Error generating remix guide:", error);
    console.error("Error generating remix guide:", error); generating remix guide.";
    let specificMessage = "An unknown error occurred while generating remix guide.";
    if (error instanceof Error) {sage;
      specificMessage = error.message;key not valid") || error.message.includes("permission")) {
      if (error.message.includes("API key not valid") || error.message.includes("permission")) {y configuration.";
        specificMessage = "Invalid API Key or insufficient permissions. Please check your API key configuration.";iled to fetch")) {
      } else if (error.message.toLowerCase().includes("network error") || error.message.toLowerCase().includes("failed to fetch")) {`;
        specificMessage = `Network error: Failed to connect to Gemini API. Please check your internet connection. (${error.message})`;
      } else if (error.message.includes("Candidate was blocked")) { by the AI. This might be due to content policies. Please try again or adjust your input.";
        specificMessage = "The response for remix guide was blocked by the AI. This might be due to content policies. Please try again or adjust your input.";
      } else if (error.message.includes("audio")) {ssing the audio file. Ensure it's a common format and not too large. (${error.message})`;
        specificMessage = `There was an issue processing the audio file. Ensure it's a common format and not too large. (${error.message})`;
      }
    }hrow new Error(specificMessage);
    throw new Error(specificMessage);
  }
}
/**
/**7. Enhanced Mix Feedback with Audio File Support
 * 7. Enhanced Mix Feedback with Audio File Support
 */ort const generateMixFeedbackWithAudio = async (
export const generateMixFeedbackWithAudio = async (
  inputs: MixFeedbackInputs
): Promise<string> => {nputs;
  const { dawName } = inputs;text if provided
  // Include DAW-specific context if provided
  let dawContext = '';
  if (dawName) {getDawMetadata(dawName);
    const daw = getDawMetadata(dawName);
    if (daw) {xt = `
      dawContext = `
**DAW Information:**
- DAW: ${dawName}${daw.workflowTips.join('; ')}
- Workflow Tips: ${daw.workflowTips.join('; ')}(', ')}; Compression: ${daw.stockPlugins.Compression.join(', ')}; Reverb: ${daw.stockPlugins.Reverb.join(', ')}; Delay: ${daw.stockPlugins.Delay.join(', ')}; Creative: ${daw.stockPlugins.Creative.join(', ')})
- Stock Plugins (EQ: ${daw.stockPlugins.EQ.join(', ')}; Compression: ${daw.stockPlugins.Compression.join(', ')}; Reverb: ${daw.stockPlugins.Reverb.join(', ')}; Delay: ${daw.stockPlugins.Delay.join(', ')}; Creative: ${daw.stockPlugins.Creative.join(', ')})
`;  }
    }
  }
  const prompt = `You are TrackGuideAI's Advanced Mix Analysis Expert. Analyze the uploaded audio file and provide comprehensive mix feedback.
  const prompt = `You are TrackGuideAI's Advanced Mix Analysis Expert. Analyze the uploaded audio file and provide comprehensive mix feedback.
${dawContext}**Track Information:**
${dawContext}**Track Information:** "Uploaded Mix"}
- Track Name: ${inputs.trackName || "Uploaded Mix"}ce and clarity"}
- Focus Areas: ${inputs.focus || "Overall mix balance and clarity"}tes provided"}
- User Notes: ${inputs.notes || inputs.userNotes || "No specific notes provided"}
**Comprehensive Analysis Framework:**
**Comprehensive Analysis Framework:**
## 🎧 Audio Analysis Results
## 🎧 Audio Analysis Results
### Frequency Spectrum Analysis
### Frequency Spectrum Analysis
**Low-End (20-250 Hz):**control
- Sub-bass presence and control
- Bass clarity and definitiont
- Low-mid muddiness assessment
**Midrange (250 Hz - 5 kHz):**
**Midrange (250 Hz - 5 kHz):**y
- Vocal/lead instrument clarityking
- Instrument separation and masking
- Presence and intelligibility
**High-End (5 kHz+):**
**High-End (5 kHz+):**ity
- Air and sparkle qualityissues
- Harshness or sibilance issues
- Overall brightness balance
### Stereo Field & Spatial Analysis
### Stereo Field & Spatial Analysis
**Width & Imaging:**ctiveness
- Stereo spread effectiveness
- Phantom center stability
- Side content balance
**Depth & Dimension:**
**Depth & Dimension:**ce
- Reverb usage and space
- Dry/wet balanceositioning
- Front-to-back positioning
### Dynamic Range Assessment
### Dynamic Range Assessment
**Compression Analysis:**
- Overall dynamic rangen
- Transient preservationssion
- Pumping or over-compression
**Loudness Evaluation:**
**Loudness Evaluation:**el
- Perceived loudness level
- Peak managementbility
- Headroom availability
### Technical Quality Check
### Technical Quality Check
**Distortion & Artifacts:**ion
- Unwanted harmonic distortiong
- Digital artifacts or clipping
- Noise floor assessment
**Phase Relationships:**
**Phase Relationships:**
- Mono compatibility issues
- Phase cancellation issues
- Correlation analysis
## 🎯 Specific Recommendations
## 🎯 Specific Recommendations
### Immediate Improvements
### Immediate Improvementsost critical issue with specific solution]
1. **Priority Fix #1:** [Most critical issue with specific solution]
2. **Priority Fix #2:** [Second most important improvement]
3. **Priority Fix #3:** [Third priority enhancement]
### Technical Adjustments
### Technical Adjustments
**EQ Suggestions:**y cuts/boosts with dB amounts
- Specific frequency cuts/boosts with dB amounts
- Problem frequency identification
- Enhancement opportunities
**Compression Recommendations:**
**Compression Recommendations:**tings
- Ratio, attack, and release settingss
- Specific compressor types or plugins
- Bus compression strategies
**Effects Processing:**
**Effects Processing:**stments
- Reverb and delay adjustmentses
- Spatial enhancement techniquesies
- Creative processing opportunities
### Professional Polish
### Professional Polishons:**
**Mastering Considerations:**
- Final EQ and compression
- Stereo enhancemention
- Loudness optimization
**Reference Comparison:**
**Reference Comparison:**o commercial standards
- How this mix compares to commercial standards
- Genre-specific benchmarksrovement
- Areas for competitive improvement
Provide actionable, specific feedback that can be implemented immediately to improve the mix quality and professional impact.`;
Provide actionable, specific feedback that can be implemented immediately to improve the mix quality and professional impact.`;
  const response = await ai.models.generateContent({
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL_NAME,
    contents: prompt,
  });urn response.text || "Unable to generate analysis. Please try again.";
  return response.text || "Unable to generate analysis. Please try again.";
};
/**
/**8. Helper function for simple content generation
 * 8. Helper function for simple content generation
 */ort async function generateContent(prompt: string): Promise<string> {
export async function generateContent(prompt: string): Promise<string> {
  if (!apiKey) {ror("API Key not configured. Cannot connect to Gemini API.");
    throw new Error("API Key not configured. Cannot connect to Gemini API.");
  }
  try {
  try {st response = await ai.models.generateContent({
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: prompt,
    });
    const responseText = response.text;
    const responseText = response.text;') {
    if (typeof responseText !== 'string') {ed response format from Gemini API.");
      throw new Error("Received an unexpected response format from Gemini API.");
    }
    return responseText;
    return responseText;
  } catch (error) {Error generating content:", error);
    console.error("Error generating content:", error);hile generating content.";
    let specificMessage = "An unknown error occurred while generating content.";
    if (error instanceof Error) {sage;
      specificMessage = error.message;key not valid") || error.message.includes("permission")) {
      if (error.message.includes("API key not valid") || error.message.includes("permission")) {y configuration.";
        specificMessage = "Invalid API Key or insufficient permissions. Please check your API key configuration.";iled to fetch")) {
      } else if (error.message.toLowerCase().includes("network error") || error.message.toLowerCase().includes("failed to fetch")) {`;
        specificMessage = `Network error: Failed to connect to Gemini API. Please check your internet connection. (${error.message})`;
      }
    }hrow new Error(specificMessage);
    throw new Error(specificMessage);
  }
}
/**
/**9. Alternative AI Assistant Response (non-streaming for simple cases)
 * 9. Alternative AI Assistant Response (non-streaming for simple cases)
 */ort const generateAIAssistantResponseSimple = async (
export const generateAIAssistantResponseSimple = async (
  message: string,
  context?: {idebook?: GuidebookEntry;
    currentGuidebook?: GuidebookEntry;
    userInputs?: UserInputs;
  }Promise<string> => {
): Promise<string> => {
  if (!apiKey) {ror("API Key not configured. Cannot connect to Gemini API.");
    throw new Error("API Key not configured. Cannot connect to Gemini API.");
  }
  try {
  try {st contextInfo = context ? `
    const contextInfo = context ? `
**Current Project Context:**s?.genre?.join(", ") || context.currentGuidebook?.genre?.join(", ") || 'Not specified'}
- Genre: ${context.userInputs?.genre?.join(", ") || context.currentGuidebook?.genre?.join(", ") || 'Not specified'}
- Vibe: ${context.userInputs?.vibe?.join(", ") || context.currentGuidebook?.vibe?.join(", ") || 'Not specified'}
- DAW: ${context.userInputs?.daw || context.currentGuidebook?.daw || 'Not specified'}
- Current guidebook: ${context.currentGuidebook?.title || 'None'}
` : '';
    const prompt = `You are TrackGuideAI, an expert music production assistant. Help the user with their music production question.
    const prompt = `You are TrackGuideAI, an expert music production assistant. Help the user with their music production question.
${contextInfo}
${contextInfo}
**User Question:** ${message}
**User Question:** ${message}
**Your Response Guidelines:**
**Your Response Guidelines:**vice related to music production, mixing, sound design, or composition
- Provide helpful, concise advice related to music production, mixing, sound design, or composition
- Keep responses practical and actionablevant
- Reference the project context when relevant applicable
- Include specific parameter suggestions when applicable
- Maintain a professional but friendly tone
Provide your expert guidance:`;
Provide your expert guidance:`;
    const response = await ai.models.generateContent({
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: prompt,
    });
    const responseText = response.text;
    const responseText = response.text;') {
    if (typeof responseText !== 'string') {ed response format from Gemini API.");
      throw new Error("Received an unexpected response format from Gemini API.");
    }
    return responseText;
    return responseText;
  } catch (error) {
  } catch (error) {Error generating AI assistant response:", error);
    console.error("Error generating AI assistant response:", error);g response.";
    let specificMessage = "An unknown error occurred while generating response.";
    if (error instanceof Error) {sage;
      specificMessage = error.message;key not valid") || error.message.includes("permission")) {
      if (error.message.includes("API key not valid") || error.message.includes("permission")) {y configuration.";
        specificMessage = "Invalid API Key or insufficient permissions. Please check your API key configuration.";iled to fetch")) {
      } else if (error.message.toLowerCase().includes("network error") || error.message.toLowerCase().includes("failed to fetch")) {`;
        specificMessage = `Network error: Failed to connect to Gemini API. Please check your internet connection. (${error.message})`;
      } else if (error.message.includes("Candidate was blocked")) { might be due to content policies. Please try again or adjust your input.";
        specificMessage = "The response was blocked by the AI. This might be due to content policies. Please try again or adjust your input.";
      }
    }hrow new Error(specificMessage);
    throw new Error(specificMessage);
  }
}
/**
/**Streaming Mix Feedback (with audio file support)
 * Streaming Mix Feedback (with audio file support)
 */ort async function* generateMixFeedbackWithAudioStream(
export async function* generateMixFeedbackWithAudioStream(
  inputs: MixFeedbackInputstring }, void, unknown> {
): AsyncGenerator<{ text: string }, void, unknown> {
  if (!apiKey) {ror("API Key not configured. Cannot connect to Gemini API for mix feedback.");
    throw new Error("API Key not configured. Cannot connect to Gemini API for mix feedback.");
  }
  // If no audio file, fallback to text-only streaming (not implemented here)
  // If no audio file, fallback to text-only streaming (not implemented here)
  if (!inputs.audioFile) {ld yield the result of generateMixFeedback, but for now just throw
    // Optionally, you could yield the result of generateMixFeedback, but for now just throw
    throw new Error("Streaming mix feedback requires an audio file.");
  }
  // Convert file to base64
  // Convert file to base64e: File): Promise<string> => {
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {sult as string;
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };ader.onerror = reject;
      reader.onerror = reject;e);
      reader.readAsDataURL(file);
    });
  };
  const audioBase64 = await fileToBase64(inputs.audioFile);
  const audioBase64 = await fileToBase64(inputs.audioFile);
  // Include DAW context if provided
  // Include DAW context if provided
  const { dawName } = inputs;
  let dawContext = '';
  if (dawName) {getDawMetadata(dawName);
    const daw = getDawMetadata(dawName);
    if (daw) {xt = `
      dawContext = `
**DAW Information:**
- DAW: ${dawName}${daw.workflowTips.join('; ')}
- Workflow Tips: ${daw.workflowTips.join('; ')}(', ')}; Compression: ${daw.stockPlugins.Compression.join(', ')}; Reverb: ${daw.stockPlugins.Reverb.join(', ')}; Delay: ${daw.stockPlugins.Delay.join(', ')}; Creative: ${daw.stockPlugins.Creative.join(', ')})
- Stock Plugins (EQ: ${daw.stockPlugins.EQ.join(', ')}; Compression: ${daw.stockPlugins.Compression.join(', ')}; Reverb: ${daw.stockPlugins.Reverb.join(', ')}; Delay: ${daw.stockPlugins.Delay.join(', ')}; Creative: ${daw.stockPlugins.Creative.join(', ')})
`;  }
    }
  }
  const prompt = `You are TrackGuideAI's Advanced Mix Analysis Expert. Analyze the uploaded audio file and provide comprehensive mix feedback.
  const prompt = `You are TrackGuideAI's Advanced Mix Analysis Expert. Analyze the uploaded audio file and provide comprehensive mix feedback.
${dawContext}**Track Information:**
${dawContext}**Track Information:** "Uploaded Mix"}
- Track Name: ${inputs.trackName || "Uploaded Mix"}ce and clarity"}
- Focus Areas: ${inputs.focus || "Overall mix balance and clarity"}tes provided"}
- User Notes: ${inputs.notes || inputs.userNotes || "No specific notes provided"}
**Comprehensive Analysis Framework:**
**Comprehensive Analysis Framework:**
## 🎧 Audio Analysis Results
## 🎧 Audio Analysis Results
### Frequency Spectrum Analysis
### Frequency Spectrum Analysis
**Low-End (20-250 Hz):**control
- Sub-bass presence and control
- Bass clarity and definitiont
- Low-mid muddiness assessment
**Midrange (250 Hz - 5 kHz):**
**Midrange (250 Hz - 5 kHz):**y
- Vocal/lead instrument clarityking
- Instrument separation and masking
- Presence and intelligibility
**High-End (5 kHz+):**
**High-End (5 kHz+):**ity
- Air and sparkle qualityissues
- Harshness or sibilance issues
- Overall brightness balance
### Stereo Field & Spatial Analysis
### Stereo Field & Spatial Analysis
**Width & Imaging:**ctiveness
- Stereo spread effectiveness
- Phantom center stability
- Side content balance
**Depth & Dimension:**
**Depth & Dimension:**ce
- Reverb usage and space
- Dry/wet balanceositioning
- Front-to-back positioning
### Dynamic Range Assessment
### Dynamic Range Assessment
**Compression Analysis:**
- Overall dynamic rangen
- Transient preservationssion
- Pumping or over-compression
**Loudness Evaluation:**
**Loudness Evaluation:**el
- Perceived loudness level
- Peak managementbility
- Headroom availability
### Technical Quality Check
### Technical Quality Check
**Distortion & Artifacts:**ion
- Unwanted harmonic distortiong
- Digital artifacts or clipping
- Noise floor assessment
**Phase Relationships:**
**Phase Relationships:**
- Mono compatibility issues
- Phase cancellation issues
- Correlation analysis
## 🎯 Specific Recommendations
## 🎯 Specific Recommendations
### Immediate Improvements
### Immediate Improvementsost critical issue with specific solution]
1. **Priority Fix #1:** [Most critical issue with specific solution]
2. **Priority Fix #2:** [Second most important improvement]
3. **Priority Fix #3:** [Third priority enhancement]
### Technical Adjustments
### Technical Adjustments
**EQ Suggestions:**y cuts/boosts with dB amounts
- Specific frequency cuts/boosts with dB amounts
- Problem frequency identification
- Enhancement opportunities
**Compression Recommendations:**
**Compression Recommendations:**tings
- Ratio, attack, and release settingss
- Specific compressor types or plugins
- Bus compression strategies
**Effects Processing:**
**Effects Processing:**stments
- Reverb and delay adjustmentses
- Spatial enhancement techniquesies
- Creative processing opportunities
### Professional Polish
### Professional Polishons:**
**Mastering Considerations:**
- Final EQ and compression
- Stereo enhancemention
- Loudness optimization
**Reference Comparison:**
**Reference Comparison:**o commercial standards
- How this mix compares to commercial standards
- Genre-specific benchmarksrovement
- Areas for competitive improvement
Provide actionable, specific feedback that can be implemented immediately to improve the mix quality and professional impact.`;
Provide actionable, specific feedback that can be implemented immediately to improve the mix quality and professional impact.`;
  const response = await ai.models.generateContent({
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL_NAME,
    contents: prompt,
  });
  const responseText = response.text || "Unable to generate analysis. Please try again.";
  const responseText = response.text || "Unable to generate analysis. Please try again.";
  yield { text: responseText };
};
/**
/**Streaming Mix Comparison (with audio files support)
 * Streaming Mix Comparison (with audio files support)
 */ort async function* generateMixComparisonStream(
export async function* generateMixComparisonStream(
  inputs: MixComparisonInputsing }, void, unknown> {
): AsyncGenerator<{ text: string }, void, unknown> {
  if (!apiKey) {ror("API Key not configured. Cannot connect to Gemini API for mix comparison.");
    throw new Error("API Key not configured. Cannot connect to Gemini API for mix comparison.");
  }
  const prompt = `You are an expert mixing & mastering AI. The user has uploaded two mixes for comparison analysis.
  const prompt = `You are an expert mixing & mastering AI. The user has uploaded two mixes for comparison analysis.
Mix A: "${inputs.mixAName}" — an earlier version  
Mix A: "${inputs.mixAName}" — an earlier version  version  
Mix B: "${inputs.mixBName}" — the current working version  
🎧 Instructions:
🎧 Instructions:ctive version — focus all actionable feedback on improving Mix B.
- Mix B is the active version — focus all actionable feedback on improving Mix B.
- Mix A is an earlier version — if Mix A has strengths vs Mix B, point those out.
- Acknowledge improvements made in Mix B compared to A.sed).
- Do NOT suggest changes to Mix A (it is not being revised).
User Notes: ${inputs.userNotes || "No specific notes provided"}
User Notes: ${inputs.userNotes || "No specific notes provided"}
Analyze both audio files and provide your comparison in clear Markdown format with the following sections:
Analyze both audio files and provide your comparison in clear Markdown format with the following sections:
## 🎧 Overall Comparison
## 🎧 Overall Comparison
## 🎛️ Frequency Balance
## 🎛️ Frequency Balance
## 🎚️ Stereo Image & Depth
## 🎚️ Stereo Image & Depth
## 📈 Dynamics & Loudness
## 📈 Dynamics & Loudness
## ⚙️ Technical Quality
## ⚙️ Technical Quality
## 🏆 Strengths & Opportunities (for Mix B)
## 🏆 Strengths & Opportunities (for Mix B)
## 🚀 Actionable Recommendations (for Mix B only)
## 🚀 Actionable Recommendations (for Mix B only)
Focus on specific, actionable feedback for improving Mix B while acknowledging its strengths compared to Mix A.`;
Focus on specific, actionable feedback for improving Mix B while acknowledging its strengths compared to Mix A.`;
  // Create audio parts for both files
  // Create audio parts for both filesAudio (Earlier Version): "${inputs.mixAName}"` };
  const mixATextPart = { text: `Mix A Audio (Earlier Version): "${inputs.mixAName}"` };
  const mixABase64Part = {
    inlineData: {s.mixAFile,
      data: inputs.mixAFile,
      mimeType: "audio/mpeg"
    }
  };
  const mixBTextPart = { text: `Mix B Audio (Current Version): "${inputs.mixBName}"` };
  const mixBTextPart = { text: `Mix B Audio (Current Version): "${inputs.mixBName}"` };
  const mixBBase64Part = {
    inlineData: {s.mixBFile,
      data: inputs.mixBFile,
      mimeType: "audio/mpeg"
    }
  };
  const promptPart = { text: prompt };
  const promptPart = { text: prompt };
  const contents = [mixABase64Part, mixATextPart, mixBBase64Part, mixBTextPart, promptPart];
  const contents = [mixABase64Part, mixATextPart, mixBBase64Part, mixBTextPart, promptPart];
  const stream = await ai.models.generateContentStream({
  const stream = await ai.models.generateContentStream({
    model: GEMINI_MODEL_NAME,ts },
    contents: { parts: contents },
  });
  for await (const chunk of stream) {
  for await (const chunk of stream) {
    if (chunk.text) {hunk.text };
      yield { text: chunk.text };
    }
  }
}
/**
/**Standalone API to generate a song framework from a reference track
 * Standalone API to generate a song framework from a reference trackement blueprint
 * This can be called directly from the frontend for a focused arrangement blueprint
 */ort const generateStandaloneSongFramework = async (
export const generateStandaloneSongFramework = async (
  audioData: { base64: string; mimeType: string },
  genre?: string,,
  vibe?: string[],ring[],
  instruments?: string[],
  referenceUrl?: string
): Promise<string> => {
  try {st framework = await generateReferenceTrackFramework(
    const framework = await generateReferenceTrackFramework(
      audioData,
      genre,
      vibe,uments,
      instruments,licitly set as standalone mode
      true, // Explicitly set as standalone mode
      referenceUrl
    );
    return framework || "Could not generate framework from the reference track. Please try again or use a different track.";
    return framework || "Could not generate framework from the reference track. Please try again or use a different track.";
  } catch (error) {Error generating standalone song framework:", error);
    console.error("Error generating standalone song framework:", error);e try again.";
    return "An error occurred while analyzing the reference track. Please try again.";
  }
};
/**
/**Generate a song framework based on reference track analysis
 * Generate a song framework based on reference track analysisrectly from an audio reference
 * This provides a standalone arrangement blueprint derived directly from an audio reference
 * or a starting point for a blended framework when used as part of TrackGuide
 */ort const generateReferenceTrackFramework = async (
export const generateReferenceTrackFramework = async (
  audioData: { base64: string; mimeType: string },
  genre?: string,,
  vibe?: string[],ring[],
  instruments?: string[], true,
  isStandalone: boolean = true,
  referenceUrl?: string
): Promise<string> => {re ? genre : "Not specified";
  const genreText = genre ? genre : "Not specified";d";
  const vibeText = vibe?.join(", ") || "Not specified";ot specified";
  const instrumentsText = instruments?.join(", ") || "Not specified";
  const urlText = referenceUrl ? referenceUrl : "Not provided";
  // Enhanced JSON framework prompt with improved audio awareness
  // Enhanced JSON framework prompt with improved audio awarenessn assistant with advanced audio analysis capabilities.
  const prompt = `You are TrackGuideAI, an expert music production assistant with advanced audio analysis capabilities.
TASK: Analyze the provided audio file and generate a detailed song arrangement framework in JSON format that closely matches the structure, instrumentation, and arrangement of the reference track.
TASK: Analyze the provided audio file and generate a detailed song arrangement framework in JSON format that closely matches the structure, instrumentation, and arrangement of the reference track.
AUDIO ANALYSIS INSTRUCTIONS:
AUDIO ANALYSIS INSTRUCTIONS:ntire audio file
1. Listen carefully to the entire audio filets:
2. Identify and extract the following elements:
   - Tempo (BPM)re
   - Key signaturee
   - Time signaturetructure (intro, verse, chorus, etc.)
   - Overall song structure (intro, verse, chorus, etc.)
   - Instrument/sound entries and exits
   - Energy dynamics and transitionsrent sections
   - Density of arrangement in different sections
   - Recurring patterns and motifsns
   - Breakdown and build-up sections
3. Pay special attention to:
3. Pay special attention to:tions
   - Drum patterns and variationsity
   - Bass line presence and activity
   - Lead instrument/vocal sectionsospheres)
   - Background elements (pads, atmospheres)
   - Transition effects and techniques
   - Dynamic range between sectionsction
   - Instrument layering in each section
JSON OUTPUT REQUIREMENTS:
JSON OUTPUT REQUIREMENTS:ure as an array called "sections", where each section is an object with:
1. Define the song structure as an array called "sections", where each section is an object with:
   - "name": the section name (e.g., "Intro", "Verse 1", "Chorus", "Breakdown", "Outro")
   - "bars": the number of bars/measures in that section (integer)
2. Define the "instruments" array listing all key instruments/elements tracked in the arrangement.
2. Define the "instruments" array listing all key instruments/elements tracked in the arrangement.
   - Extract these directly from what you hear in the audioSynths, etc.
   - Include key elements like: Drums, Bass, Lead, Vocals, Synths, etc.
   - Use appropriate naming for the genre detected
3. Define a "matrix" which is a 2D array:
3. Define a "matrix" which is a 2D array: to one instrument's timeline
   - Each element of "matrix" corresponds to one instrument's timeline in order
   - The timeline is the concatenation of all bars across all sections in order (instrument silent in that bar)
   - Each value in the timeline is either 1 (instrument plays in that bar) or 0 (instrument silent in that bar)
   - Accurately reflect the actual arrangement from the audio file
4. Ensure the "matrix" matches the total number of bars summed across all sections.
4. Ensure the "matrix" matches the total number of bars summed across all sections.
5. CRITICAL: Base the structure, instruments, and matrix directly on your analysis of the audio file, not on generic templates.
5. CRITICAL: Base the structure, instruments, and matrix directly on your analysis of the audio file, not on generic templates.
ADDITIONAL CONTEXT (Use if provided, otherwise base on audio analysis):
ADDITIONAL CONTEXT (Use if provided, otherwise base on audio analysis):
- Genre: ${genreText}
- Vibe: ${vibeText}ents: ${instrumentsText}
- Available instruments: ${instrumentsText}
- Reference URL: ${urlText}
Example output format (do not copy this - create your framework based on the actual audio):
Example output format (do not copy this - create your framework based on the actual audio):
{
{ "sections": [
  "sections": [ntro", "bars": 16},
    {"name": "Intro", "bars": 16},},
    {"name": "Verse 1", "bars": 16},
    {"name": "Chorus", "bars": 8},8},
    {"name": "Breakdown", "bars": 8},
    {"name": "Outro", "bars": 16}
  ],nstruments": [
  "instruments": [
    "Kick Drum",
    "Bass",ynth",
    "Lead Synth",
    "Pads","
    "Vocals"
  ],atrix": [
  "matrix": [rum timeline - 64 bars total (16+16+8+8+16)
    // Kick Drum timeline - 64 bars total (16+16+8+8+16)1,1,1,1,1,1,1, 1,1,1,1,1,1,1,1, 0,0,0,0, 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    // Bass timeline
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1, 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1, 1,1,1,1,1,1,1,1, 0,0,0,0, 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    // Lead Synth timeline
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0, 1,1,1,1,1,1,1,1, 1,1,1,1, 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    // Pads timeline
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1, 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1, 1,1,1,1,1,1,1,1, 1,1,1,1, 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    // Vocals timeline
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0, 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1, 1,1,1,1,1,1,1,1, 0,0,0,0, 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
  ]
}

IMPORTANT: The JSON output must be valid and parsable, with no extra text or explanation. Return ONLY the JSON object.`;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: prompt,
            },
            {
              inlineData: {
                mimeType: audioData.mimeType,
                data: audioData.base64,
              },
            },
          ],
        },
      ],
    });

    let result = response.text || "";
    
    // Try to extract JSON if the model wrapped it in markdown code blocks
    const jsonMatch = result.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      result = jsonMatch[1];
    }
    
    // Clean up any comments in the JSON (like the matrix comments)
    result = result.replace(/\/\/.*$/gm, '');
    
    // Try to parse the JSON result
    try {
      const parsed = JSON.parse(result);
      
      // Add reference URL to the JSON if provided
      if (referenceUrl) {
        parsed.referenceUrl = referenceUrl;
      }
      
      result = JSON.stringify(parsed);
    } catch (jsonError) {
      console.error("AI returned invalid JSON:", jsonError);
      // If we can't parse it, return the original response
    }

    return result;
  } catch (error) {
    console.error("Error generating reference track framework:", error);
    return "";
  }
};
