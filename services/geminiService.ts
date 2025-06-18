
// services/geminiService.ts

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GEMINI_MODEL_NAME } from "../constants.ts";

// ─── INIT ──────────────────────────────────────────────────────────────────────
const apiKey = process.env.API_KEY!;
if (!apiKey) {
  throw new Error("API_KEY is not set. Cannot connect to Gemini API.");
}
const ai = new GoogleGenAI({ apiKey });


const generatePrompt = (inputs: UserInputs): string => {
  const genreText = inputs.genre.length > 0 ? inputs.genre.join(', ') : "Not specified";
  const vibeText = inputs.vibe.length > 0 ? inputs.vibe.join(', ') : "Not specified";
  const artistRefText = inputs.artistReference || "General to genre/vibe";
  const songTitleText = inputs.songTitle?.trim() || "";
  
  const userHasSpecifiedPlugins = inputs.plugins && inputs.plugins.trim() !== "" && !inputs.plugins.toLowerCase().includes("stock only");
  const pluginsText = userHasSpecifiedPlugins ? inputs.plugins : `Stock plugins of ${inputs.daw || 'the selected DAW'}`;
  
  const instrumentsText = inputs.availableInstruments || "Standard rock/pop/electronic instruments assumed";

  // Helper to suggest plugins based on user input or fallbacks
  const getPluginSuggestion = (specificPluginName: string, fallbackGenericType: string, pluginCategoryForDawStock: string) => {
    if (userHasSpecifiedPlugins) {
        // Check if a specific plugin is mentioned. Crude check, can be improved.
        if (inputs.plugins.toLowerCase().includes(specificPluginName.split(' ')[0].toLowerCase())) {
            return `\`${specificPluginName}\``;
        }
        // Check for general brands if specific plugin not found
        if (inputs.plugins.toLowerCase().includes("arturia") && specificPluginName.toLowerCase().includes("arturia")) return `\`${specificPluginName}\``;
        if (inputs.plugins.toLowerCase().includes("native instruments") || inputs.plugins.toLowerCase().includes("komplete")) {
             if (["massive", "kontakt", "reaktor", "guitar rig", "battery"].some(ni => specificPluginName.toLowerCase().includes(ni))) return `\`${specificPluginName}\``;
        }
        if (inputs.plugins.toLowerCase().includes("fabfilter") && specificPluginName.toLowerCase().includes("fabfilter")) return `\`${specificPluginName}\``;
        if (inputs.plugins.toLowerCase().includes("soundtoys") && specificPluginName.toLowerCase().includes("soundtoys")) return `\`${specificPluginName}\``;
        if (inputs.plugins.toLowerCase().includes("valhalla") && specificPluginName.toLowerCase().includes("valhalla")) return `\`${specificPluginName}\``;
        // If specific not found, but user has plugins, suggest a generic type
        return `a suitable ${fallbackGenericType.toLowerCase()}`;
    }
    // Default to DAW stock plugins
    return `${inputs.daw || 'DAW'} stock ${pluginCategoryForDawStock.toLowerCase()}`;
  };

  const mainTitleInstruction = songTitleText 
    ? `The user has provisionally titled this project: "${songTitleText}". Use this as the primary title in the '# TRACKGUIDE: "..."' heading, or refine it slightly if you can make it more engaging while keeping its core idea.`
    : `Generate an engaging and ORIGINAL title for the '# TRACKGUIDE: "..."' heading that creatively combines '${genreText}', '${vibeText}', and '${artistRefText}' if provided, e.g., "Substructure Anomaly" - An Experimental Neurofunk Descent.`;

  const suggestedTitleInstruction = songTitleText
    ? `Use the user-provided title: "${songTitleText}".`
    : `Generate a creative, SHORT, and ORIGINAL title that captures the essence of all inputs. Avoid generic phrases like "Song for..." or simply restating the genre/vibe.`;


  return `
You are TrackGuideAI, an expert music production assistant. Generate a comprehensive TrackGuide based on the following user inputs.
The user wants to create a song with the following characteristics:
- Project Title (User Provided): ${songTitleText || "Not specified"}
- Genre(s): ${genreText}
- Artist/Song Reference(s): ${artistRefText}
- Reference Track Link: ${inputs.referenceTrackLink || "Not provided"}
- Lyrics: ${inputs.lyrics || "Not provided"}
- Key: ${inputs.key || "Not specified"}
- Chords: ${inputs.chords || "Not specified"}
- General Notes for AI: ${inputs.generalNotes || "None"}
- Vibe/Mood(s): ${vibeText}
- Preferred DAW: ${inputs.daw || "Not specified, suggest generally or for Ableton Live/Logic Pro"}
- Available Plugins: ${pluginsText}
- Available Instruments: ${instrumentsText}

**IMPORTANT INSTRUCTIONS FOR AI (OVERALL):**
- **STYLE:** Follow a "Quick Reference / Cheat Sheet Style" for Section 3 (Instrument & Sound Design) and Section 4 (Harmony, Melody & Rhythmic Core). Be extremely concise and actionable.
- **TERMINOLOGY:** Use professional music production terminology.
- **MARKDOWN:** Use Markdown for formatting (e.g., #, ##, ### for headings, bullet points for lists).
- **CONCISENESS (Sections 1, 2, 5):** Keep these sections brief and to the point.
- **EMOJIS (Section 3):** Use a relevant emoji before each instrument name heading (e.g., ### 🥁 Drums & Percussion).
- **NEW FIELD CONSIDERATIONS:**
  - If Reference Track Link is provided, analyze and reference the style/production techniques from that track
  - If Lyrics are provided, consider their structure, themes, and emotional content when suggesting arrangement and instrumentation
  - If Key/Chords are specified, prioritize those in your harmonic suggestions and ensure compatibility
  - If General Notes are provided, incorporate those specific instructions throughout all sections

**SECTION 3: INSTRUMENT & SOUND DESIGN GUIDE - "QUICK REFERENCE" FORMATTING:**
For EACH instrument/category in Section 3:
1.  **Heading:** Start with "### Emoji Instrument Name" (e.g., "### 🥁 Drums & Percussion").
2.  **Style:** "**Style:** Brief description (e.g., "Hip-hop influenced, punchy transients")."
3.  **Tips Sub-Heading:** Use ONE of these bolded labels:
    *   "**Programming Tips:**" (for drums, synths, etc.)
    *   "**Arrangement Tips:**" (for guitars, orchestral sections, etc.)
    *   "**Flow Tips:**" (for vocals)
    *   "**Role:**" (for DJ/Samples)
    *   "**Purpose:**" (for Synths/Keys if more about function than programming)
    *   Follow with 2-3 ultra-concise bullet points.
4.  **Processing Sub-Heading:** Use ONE of these bolded labels:
    *   "**EQ & Processing Summary:**" (if covering multiple effect types)
    *   "**Processing:**" (if focusing on 1-2 main effects or amp sims)
    *   "**Patch Ideas:**" (for Synths/Keys, can include VI suggestions here)
    *   Follow with 2-4 ultra-concise bullet points. EACH bullet should summarize ONE key processing step or patch idea.
    *   **Parameter Examples:** Integrate highly condensed parameter examples (e.g., "EQ: Thump at 60–80Hz, carve mud at 300–500Hz, add attack at 3–5kHz.").
    *   **Plugin/VI Suggestions:** Integrate these directly and concisely within the processing/patch bullets.
        *   If 'Available Plugins' indicates 'Stock plugins of [DAW NAME]' or is empty, **EXCLUSIVELY recommend stock plugins for the specified DAW.**
        *   If specific plugins ARE listed by the user, prioritize those.
        *   Example for plugin: "Saturation: ${getPluginSuggestion('Ableton Saturator', 'saturator plugin', 'Saturation')} (Soft Clip), on snare or full kit."
        *   Example for VI in Patch Ideas: "Pads: ${getPluginSuggestion('Arturia Prophet V', 'analog-style synth VI', 'Synth')}, long attack/release."
    *   **NO "Virtual Instrument Suggestions" as a separate sub-heading.** Integrate these into "Patch Ideas" or "Processing" (e.g., for Amp Sims).
    *   **DO NOT list every possible effect.** Focus on the 2-4 MOST impactful for the instrument in the given context.

**SECTION 4: HARMONY, MELODY & RHYTHMIC CORE - "QUICK REFERENCE" FORMATTING:**
- Structure with the following main bullet points, each followed by 1-3 concise sub-bullet points:
    - **Chord Progressions:** (with examples, e.g., "i – bVI – bVII (e.g., Cm – Ab – Bb)")
    - **Melodic Notes:** (or characteristics/scales, e.g., "Minor Pentatonic or Phrygian")
    - **Rhythmic Focus:** (key rhythmic interactions, e.g., "Tight sync between kick, bass, and palm-muted guitar")
- NO "Harmonic Textures" sub-section. Keep this section very lean.

Please structure the TrackGuide with the following sections:

# TRACKGUIDE: "${mainTitleInstruction}"

## 1. Song Overview
- **Suggested Title:** ${suggestedTitleInstruction}
- **Genre(s):** ${genreText}
- **Artist DNA:** (Briefly, 1-2 sentences, describe artist/song influence or genre/vibe archetypes if no reference)
- **Vibe(s):** ${vibeText}
- **Estimated BPM Range:** (e.g., 120-130 BPM, consider the blend if multiple genres)
- **Suggested Key(s) / Scale(s):** (List 1-2 common keys/scales, e.g., C Minor, A Lydian)
- **Overall Sonic Palette:** (Describe in 1-2 key phrases, e.g., "Dark, punchy drums, ethereal pads, gritty bass")

## 2. Structural Blueprint
Provide a **concise Markdown table** for a typical song structure for the genre(s).
- **Production Tips Column:** Succinctly combine key creative ideas and primary instrumentation focus for each section. Consider user's available instruments: ${instrumentsText}.
- **Mood Column:** Describe the mood with 2-3 impactful keywords or a very short descriptive phrase (e.g., 'Intense, Driving', 'Reflective & Hopeful', 'Darkly Cinematic'), reflecting listed vibes: ${vibeText}.

*Example Table (adapt to genre(s), ensure it's concise and well-formatted Markdown):*
| Section    | Length   | Production Tips                     | Mood        |
|------------|----------|-------------------------------------|-------------|
| Intro      | 8 bars   | Filtered pads, subtle rhythmic pulse, light perc. | Evolving    |
| Verse A    | 16 bars  | Main groove, sparse vocals, core bassline. | Driving     |
| ...etc.    | ...      | ...                                 | ...         |

## 3. Instrument & Sound Design Guide
(Follow the "QUICK REFERENCE" formatting detailed above. Tailor suggestions to user's 'Available Instruments' like '${instrumentsText}' if specified.)

### 🥁 Drums & Percussion
**Style:** (e.g., "Hip-hop influenced, punchy transients" for ${genreText})
**Programming Tips:**
  - (e.g., Snare on 2 & 4)
  - (e.g., Syncopated kicks, varied hat velocities)
**EQ & Processing Summary:**
  - (e.g., Kick: 60–80Hz (thump), 300–500Hz (cut mud), 3–5kHz (click))
  - (e.g., Snare: 200Hz (body), 4kHz (crack), touch of plate reverb with ${getPluginSuggestion('Valhalla Plate', 'plate reverb', 'Reverb')})
  - (e.g., Bus Compression: ${getPluginSuggestion('Ableton Glue Compressor', 'bus compressor', 'Compressor')}, Ratio 4:1, Attack 10–30ms)

### 🎸 Bass
**Style:** (e.g., "Syncopated, distorted, groove-locked with kick")
**Programming Tips:**
  - (e.g., Follow guitar riff in choruses)
  - (e.g., Use slides/ghosts for groove)
**Processing:**
  - (e.g., EQ: Boost 60–100Hz, 800Hz–2kHz for bite, cut 200–400Hz)
  - (e.g., Saturation: Parallel drive via ${getPluginSuggestion('Soundtoys Decapitator', 'saturation plugin', 'Saturation')} or ${getPluginSuggestion('Ableton Amp', 'amp simulator', 'Amp Sim')})

(Include similar "Quick Reference" sections for Guitars, Vocals, DJ Scratches & Samples, Synths & Keys, etc., based on user inputs or common instrumentation for the genre. Remember to integrate plugin suggestions concisely using getPluginSuggestion and adhere to all formatting rules.)

## 4. Harmony, Melody & Rhythmic Core
(Follow the "QUICK REFERENCE" formatting detailed above.)
- **Chord Progressions:**
  - (e.g., i – bVI – bVII (e.g., Cm – Ab – Bb for ${genreText}))
  - (e.g., Riff-based grooves with rhythmic single-note chugs if appropriate for ${genreText})
- **Melodic Notes:**
  - (e.g., Minor Pentatonic or Phrygian scale for ${genreText})
  - (e.g., Rap cadence in verses, short catchy lines in hooks, if vocals are mentioned or typical for ${genreText})
- **Rhythmic Focus:**
  - (e.g., Tight sync between kick, bass, and palm-muted guitar for a ${vibeText} feel)
  - (e.g., Hi-hats with syncopation and velocity variation for ${genreText} groove)

## 🔥 5. Final Notes & Implementation
(Provide 3-5 VERY concise, actionable bullet points specific to making THIS SONG unique and impactful. Start each with a "✔ " (checkmark emoji and space).)
- ✔ Focus on [key element from inputs, e.g., the rhythmic drive of ${genreText}].
- ✔ Experiment with [a specific technique related to vibe, e.g., filter automation to enhance the '${vibeText}' vibe].
- ✔ Leverage [a unique aspect of inputs, e.g., the textures from ${instrumentsText} if unique, or a specific plugin from ${pluginsText} in a creative way].
- ✔ If referencing ${artistRefText}, try their [specific technique, e.g., approach to layering] but apply it to [your unique element].
- ✔ Don't be afraid to [a general creative encouragement, e.g., break conventions slightly for a memorable track].

---
This TrackGuide for "${songTitleText || `${genreText} (${vibeText})`}" using ${inputs.daw || 'your DAW'} is a starting point. Experiment, trust your ears, and enjoy the creative journey!
`;
};


export const generateGuidebookContent = async (inputs: UserInputs): Promise<AsyncIterable<GenerateContentResponse>> => {
  if (!apiKey) {
    const errorMessage = "API Key not configured. Cannot connect to Gemini API. Please ensure the API_KEY environment variable is properly set.";
    console.error(errorMessage);
    // Return a Promise that rejects, or an AsyncIterable that yields an error.
    // For simplicity with caller, let's make it a rejecting promise that the caller can await.
    return Promise.reject(new Error(errorMessage));
  }
  try {
    const prompt = generatePrompt(inputs);
    // Returns AsyncIterable<GenerateContentResponse>
    const stream = await ai.models.generateContentStream({
        model: GEMINI_MODEL_NAME,
        contents: prompt,
    });
    return stream;

  } catch (error) {
    console.error("Error initiating TrackGuide content stream:", error);
    let specificMessage = "An unknown error occurred while initiating the TrackGuide stream.";
    if (error instanceof Error) {
        specificMessage = error.message; 
        if (error.message.includes("API key not valid") || (error.message.includes("permission") && error.message.includes("API key"))) {
            specificMessage = "Invalid API Key or insufficient permissions. Please check your API key and its configuration.";
        } else if (error.message.toLowerCase().includes("network error") || error.message.toLowerCase().includes("failed to fetch")) {
             specificMessage = `Network error: Failed to connect to Gemini API. Please check your internet connection. (${error.message})`;
        } else {
            specificMessage = `Failed to generate TrackGuide: ${error.message}`;
        }
    }
    // To match the return type, we'd ideally yield an error or throw.
    // Throwing here is simpler for the caller to catch with a single try/catch around the stream initiation.
    throw new Error(specificMessage);
  }
};


const generateMidiPrompt = (settings: MidiSettings): string => {
  const { key, scale, tempo, timeSignature, chordProgression, genre, bars, targetInstruments, guidebookContext, songSection } = settings;
  const instrumentsToGenerate = targetInstruments.join(', ');
  const scaleInfo = scale ? ` (${scale} mode)` : '';

  return `Generate MIDI patterns in JSON format for ${genre} music with INCREASED COMPLEXITY and VARIETY.

Context: Key=${key}${scaleInfo}, Tempo=${tempo}BPM, Time=${timeSignature[0]}/${timeSignature[1]}, Chords=${chordProgression}, Bars=${bars}, Section=${songSection || "General"}
Instruments: ${instrumentsToGenerate}
${guidebookContext ? `Style: ${guidebookContext.substring(0, 300)}...` : ''}

IMPORTANT REQUIREMENTS:
1. VELOCITY VARIETY: Use wide velocity ranges (40-127) with musical dynamics
2. RHYTHMIC COMPLEXITY: Include syncopation, off-beat notes, and varied note lengths
3. TIMING VARIETY: Use subtle timing variations (0.01-0.05 beat offsets for groove)
4. DRUM COMPLEXITY: Always include AT LEAST 5 drum elements per pattern

Return JSON with keys: ${targetInstruments.map(inst => `"${inst}"`).join(', ')}

Format Requirements:
- "chords": [{"time": 0, "name": "Cmaj7", "duration": 1, "notes": [{"pitch": "C4", "midi": 60}], "velocity": 65-95}]
- "bassline": [{"time": 0, "pitch": "C2", "midi": 36, "duration": 0.5, "velocity": 70-110}] (MIDI 12-59 only)
- "melody": [{"time": 0, "pitch": "C5", "midi": 72, "duration": 0.25, "velocity": 50-100}] (include grace notes, runs)
- "drums": Must include minimum 5 elements from: kick, snare, hihat_closed, hihat_open, ride, crash, clap, tom_low, tom_mid, tom_high, shaker, tambourine

DRUM REQUIREMENTS:
- Always generate patterns appropriate for ${genre}
- Include at least: kick, snare, hihat_closed, hihat_open, and one additional element (ride/crash/clap/etc.)
- Use velocity range 60-127 for drums
- Create realistic drum patterns with proper spacing and fills

MUSICAL COMPLEXITY:
- Add passing tones, chord extensions, and scale-appropriate embellishments
- Use rhythmic displacement and syncopation where appropriate for ${genre}
- Include dynamic contrast within patterns
- Make patterns suitable for ${songSection || "general"} section energy level

Generate musically rich, production-ready patterns.`;
};

export const generateMidiPatternSuggestions = async (settings: MidiSettings): Promise<AsyncIterable<GenerateContentResponse>> => {
  if (!apiKey) {
    const errorMessage = "API Key not configured. Cannot connect to Gemini API for MIDI generation.";
    console.error(errorMessage);
    return Promise.reject(new Error(errorMessage));
  }
  try {
    const prompt = generateMidiPrompt(settings);
    const stream = await ai.models.generateContentStream({
        model: GEMINI_MODEL_NAME,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
    });
    return stream;

  } catch (error) {
    console.error("Error initiating MIDI pattern stream:", error);
    let specificMessage = "An unknown error occurred while initiating MIDI pattern stream.";
     if (error instanceof Error) {
        specificMessage = error.message; 
        if (error.message.includes("API key not valid")) {
            specificMessage = "Invalid API Key for MIDI generation. Please check your API key.";
        } else {
            specificMessage = `Failed to initiate MIDI pattern stream: ${error.message}`;
        }
    }
    throw new Error(specificMessage);
  }
};

// Helper function to convert File to base64
const fileToGenerativePart = async (file: File): Promise<{ inlineData: { mimeType: string; data: string } }> => { // Return type explicitly defined
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });
    return {
      inlineData: {
        mimeType: file.type,
        data: await base64EncodedDataPromise,
      },
    };
};

const generateMixFeedbackPrompt = (userNotes: string): string => {
  return `
You are an expert audio mixing and mastering engineer AI. The user has uploaded an audio file of their mix and provided some notes.
Analyze the audio mix thoroughly.

User's Notes/Questions:
"${userNotes || "No specific notes provided by the user."}"

Provide comprehensive, constructive, and actionable feedback on the mix. Structure your feedback using Markdown with clear headings for each section. Cover the following aspects:

1.  **Overall Impression & Balance:**
    *   Initial thoughts on the mix.
    *   How well do the different instruments/elements sit together?
    *   Are vocals (if present) clear and well-placed?
    *   Is there a good sense of depth and separation between elements?

2.  **Frequency Spectrum Analysis:**
    *   **Low-End (Bass, Kick, etc.):** Is it clear, muddy, boomy, or lacking? Any masking?
    *   **Mid-Range (Vocals, Guitars, Synths, Snares):** Is it clear, honky, harsh, scooped, or well-defined?
    *   **High-End (Cymbals, Air, Sibilance):** Is it crisp, dull, harsh, or smooth?
    *   Suggest specific EQ adjustments with frequency ranges if applicable (e.g., "Consider a gentle cut around 250Hz on the bass to reduce mud").

3.  **Dynamics & Loudness:**
    *   Is the mix punchy and dynamic, or does it sound over-compressed or flat?
    *   Assess the use of compression on individual tracks and the master bus (if discernible).
    *   Comment on the perceived loudness and headroom. Any signs of clipping?

4.  **Stereo Image & Panning:**
    *   How wide or narrow does the mix feel?
    *   Is panning used effectively to create space and interest?
    *   Any phase issues noticeable (e.g., elements disappearing in mono)?

5.  **Effects Usage (Reverb, Delay, Modulation, etc.):**
    *   Are effects used tastefully and effectively to enhance the mix, or are they distracting/muddying?
    *   Comment on the sense of space created by reverbs/delays.

6.  **Technical Issues (If any observed):**
    *   Clipping, distortion (unintentional), noise, clicks, pops, significant phase problems.

7.  **Actionable Summary & Key Recommendations:**
    *   Summarize the top 2-3 most impactful things the user could do to improve their mix.
    *   Prioritize suggestions based on what would make the biggest positive difference.

**IMPORTANT:**
- Be encouraging and constructive.
- Use professional terminology but explain concepts clearly if they might be complex.
- Refer back to the user's specific notes/questions if they provided any.
- Provide specific examples where possible (e.g., "The snare feels a bit buried; try increasing its level by 1-2dB or adding some top-end around 5kHz for more crack.").
- Do not comment on the musical composition or performance itself, ONLY the mix quality.
`;
};

export const generateMixFeedback = async (inputs: MixFeedbackInputs): Promise<string> => {
  if (!apiKey) {
    const errorMessage = "API Key not configured. Cannot connect to Gemini API for mix feedback.";
    console.error(errorMessage);
    return Promise.reject(new Error(errorMessage));
  }
  if (!inputs.audioFile) {
    return Promise.reject(new Error("No audio file provided for mix feedback."));
  }

  try {
    const audioFilePart = await fileToGenerativePart(inputs.audioFile);
    const textPart = { text: generateMixFeedbackPrompt(inputs.userNotes) };
    
    const contents = [audioFilePart, textPart];

    // Mix feedback is not streamed for now, as it's a single response after audio processing
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: GEMINI_MODEL_NAME, // Ensure this model supports audio input
        contents: { parts: contents }, 
    });
    
    const feedbackText = response.text;
    if (typeof feedbackText !== 'string') { 
        console.error("Received non-text response or no text from Gemini API for mix feedback. Response:", response);
        throw new Error("Received an unexpected response format from Gemini API for mix feedback.");
    }
    return feedbackText;

  } catch (error) {
    console.error("Error generating mix feedback:", error);
    let specificMessage = "An unknown error occurred while generating mix feedback.";
    if (error instanceof Error) {
        specificMessage = error.message; 
        if (error.message.includes("API key not valid") || (error.message.includes("permission") && error.message.includes("API key"))) {
            specificMessage = "Invalid API Key or insufficient permissions. Please check your API key and its configuration.";
        } else if (error.message.toLowerCase().includes("network error") || error.message.toLowerCase().includes("failed to fetch")) {
             specificMessage = `Network error: Failed to connect to Gemini API. Please check your internet connection. (${error.message})`;
        } else if (error.message.includes("Candidate was blocked")) {
            specificMessage = "The response for mix feedback was blocked by the AI. This might be due to content policies or other restrictions. Please try again or adjust your input if possible.";
        } else if (error.message.includes("audio")) { 
             specificMessage = `There was an issue processing the audio file with the AI. Ensure it's a common format and not too large. (${error.message})`;
        } else {
            specificMessage = `Failed to generate mix feedback: ${error.message}`;
        }
    }
    return Promise.reject(new Error(specificMessage));
  }
};

export const generateAIAssistantResponse = async (
  message: string,
  context?: {
    currentGuidebook?: any;
    userInputs?: any;
  }
): Promise<string> => {
  if (!apiKey) {
    const errorMessage = "API Key not configured. Cannot connect to Gemini API.";
    console.error(errorMessage);
    return Promise.reject(new Error(errorMessage));
  }

  try {
    const contextInfo = context ? `
Current project context:
- Genre: ${context.userInputs?.genre || 'Not specified'}
- Vibe: ${context.userInputs?.vibe || 'Not specified'}
- DAW: ${context.userInputs?.daw || 'Not specified'}
- Current guidebook: ${context.currentGuidebook?.title || 'None'}
` : '';

    const prompt = `You are an AI music production assistant. Help the user with their music production questions.

${contextInfo}

User question: ${message}

Provide helpful, concise advice related to music production, mixing, sound design, or composition. Keep responses practical and actionable.`;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: { parts: [{ text: prompt }] },
    });

    const responseText = response.text;
    if (typeof responseText !== 'string') {
      console.error("Received non-text response from Gemini API:", response);
      throw new Error("Received an unexpected response format from Gemini API.");
    }
    return responseText;

  } catch (error) {
    console.error("Error generating AI assistant response:", error);
    let specificMessage = "An unknown error occurred while generating response.";
    if (error instanceof Error) {
      specificMessage = error.message;
      if (error.message.includes("API key not valid") || (error.message.includes("permission") && error.message.includes("API key"))) {
        specificMessage = "Invalid API Key or insufficient permissions. Please check your API key and its configuration.";
      } else if (error.message.toLowerCase().includes("network error") || error.message.toLowerCase().includes("failed to fetch")) {
        specificMessage = `Network error: Failed to connect to Gemini API. Please check your internet connection. (${error.message})`;
      } else if (error.message.includes("Candidate was blocked")) {
        specificMessage = "The response was blocked by the AI. This might be due to content policies or other restrictions. Please try again or adjust your input if possible.";
      } else {
        specificMessage = `Failed to generate response: ${error.message}`;
      }
    }
    return Promise.reject(new Error(specificMessage));
  }
};

interface MixComparisonInputs {
  mixAFile?: string; // base64 audio data
  mixBFile?: string; // base64 audio data
  mixAName: string;
  mixBName?: string;
  requestMixAAnalysis?: boolean;
  requestMixBAnalysis?: boolean;
  includeMixBFeedback?: boolean;
  userNotes?: string;
}

const generateMixComparisonPrompt = (inputs: MixComparisonInputs): string => {
  const hasBothMixes = inputs.mixAFile && inputs.mixBFile;
  
  if (hasBothMixes) {
    return `You are an expert audio mixing and mastering engineer AI. The user has uploaded two audio files for comparison: "${inputs.mixAName}" (Mix A) and "${inputs.mixBName}" (Mix B).

Analyze both audio files thoroughly and provide a comprehensive comparison. Structure your response using Markdown with clear headings.

## Mix Comparison Analysis

### Overall Assessment
Compare the two mixes and identify which version is stronger overall and why.

### Key Differences Found
Analyze and compare these specific aspects between the two mixes:
- **Frequency Balance**: Compare low-end, midrange, and high-frequency content
- **Stereo Width**: Compare stereo imaging and spatial characteristics
- **Dynamic Range**: Compare compression, punch, and dynamics
- **Vocal/Lead Presence**: Compare how lead elements sit in the mix
- **Clarity and Separation**: Compare how well instruments are defined
- **Tonal Character**: Compare overall sonic character and color

### Technical Metrics Comparison
Provide estimated technical measurements for both mixes:
- **LUFS** (loudness)
- **Peak levels**
- **Stereo correlation**
- **Dynamic range**

### Recommendations
Provide specific, actionable advice on:
1. Which elements from each mix should be combined
2. Technical improvements needed
3. Processing suggestions
4. Next steps for optimization

${inputs.requestMixAAnalysis ? `

## Full Mix A Analysis (${inputs.mixAName})

### Detailed Frequency Analysis
Analyze each frequency band in detail:
- **Sub Bass (20-60Hz)**
- **Bass (60-250Hz)**
- **Low Mids (250-500Hz)**
- **Mids (500Hz-2kHz)**
- **High Mids (2-5kHz)**
- **Highs (5-12kHz)**
- **Air (12kHz+)**

### Stereo Field Analysis
- **Width and imaging**
- **Center focus**
- **Panning decisions**
- **Phase correlation**

### Dynamic Analysis
- **Peak and RMS levels**
- **Dynamic range**
- **Transient response**
- **Compression characteristics**

### Instrument-Specific Analysis
Analyze how individual elements sit in the mix and suggest improvements.` : ''}

${inputs.requestMixBAnalysis ? `

## Full Mix B Analysis (${inputs.mixBName})

### Detailed Frequency Analysis
Analyze each frequency band in detail:
- **Sub Bass (20-60Hz)**
- **Bass (60-250Hz)**
- **Low Mids (250-500Hz)**
- **Mids (500Hz-2kHz)**
- **High Mids (2-5kHz)**
- **Highs (5-12kHz)**
- **Air (12kHz+)**

### Stereo Field Analysis
- **Width and imaging**
- **Center focus**
- **Panning decisions**
- **Phase correlation**

### Dynamic Analysis
- **Peak and RMS levels**
- **Dynamic range**
- **Transient response**
- **Compression characteristics**

### Instrument-Specific Analysis
Analyze how individual elements sit in the mix and suggest improvements.` : ''}

Keep your analysis professional, detailed, and actionable. Focus on technical aspects and mixing decisions rather than musical composition.${inputs.userNotes ? `\n\n**User Notes**: ${inputs.userNotes}` : ''}`;
  } else {
    // Single mix analysis
    return `You are an expert audio mixing and mastering engineer AI. The user has uploaded a single audio file: "${inputs.mixAName}".

Analyze the audio file thoroughly and provide comprehensive feedback. Structure your response using Markdown with clear headings.

## Mix Comparison Analysis

### Overall Assessment
Single mix analysis for: ${inputs.mixAName}

Provide an overall evaluation of the mix quality, balance, and technical execution.

### Mix Evaluation
Analyze these key aspects:
- **Overall Balance**: Frequency distribution and tonal balance
- **Stereo Image**: Width, imaging, and spatial characteristics
- **Dynamic Range**: Compression, punch, and dynamics
- **Tonal Balance**: Character, warmth, brightness
- **Clarity**: Separation and definition of elements

### Technical Metrics
Provide estimated technical measurements:
- **LUFS** (loudness)
- **Peak levels**
- **Stereo correlation**
- **Dynamic range**

### Recommendations
Provide specific, actionable advice for improvement:
1. **Technical improvements**
2. **Processing suggestions**
3. **Frequency adjustments**
4. **Dynamic enhancements**

${inputs.requestMixAAnalysis ? `

## Full Single Mix Analysis (${inputs.mixAName})

### Detailed Frequency Analysis
Analyze each frequency band in detail:
- **Sub Bass (20-60Hz)**
- **Bass (60-250Hz)**
- **Low Mids (250-500Hz)**
- **Mids (500Hz-2kHz)**
- **High Mids (2-5kHz)**
- **Highs (5-12kHz)**
- **Air (12kHz+)**

### Stereo Field Analysis
- **Width and imaging**
- **Center focus**
- **Panning decisions**
- **Phase correlation**

### Dynamic Analysis
- **Peak and RMS levels**
- **Dynamic range**
- **Transient response**
- **Compression characteristics**

### Instrument-Specific Analysis
Analyze how individual elements sit in the mix and provide specific recommendations for each element.

### Recommendations
Provide detailed, actionable recommendations for:
1. **Peak Management**
2. **Frequency Balance**
3. **Dynamic Enhancement**
4. **Stereo Processing**
5. **Overall Polish**` : ''}

Keep your analysis professional, detailed, and actionable. Focus on technical mixing aspects rather than musical composition.${inputs.userNotes ? `\n\n**User Notes**: ${inputs.userNotes}` : ''}`;
  }
};

export const generateMixComparison = async (inputs: MixComparisonInputs): Promise<string> => {
  if (!apiKey) {
    const errorMessage = "API Key not configured. Cannot connect to Gemini API for mix comparison.";
    console.error(errorMessage);
    return Promise.reject(new Error(errorMessage));
  }
  
  if (!inputs.mixAFile) {
    return Promise.reject(new Error("No audio file provided for mix comparison."));
  }

  try {
    const textPart = { text: generateMixComparisonPrompt(inputs) };
    const parts = [textPart];
    
    // Add audio files
    parts.push({ inlineData: { data: inputs.mixAFile, mimeType: "audio/mpeg" } });
    if (inputs.mixBFile) {
      parts.push({ inlineData: { data: inputs.mixBFile, mimeType: "audio/mpeg" } });
    }
    
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: parts,
      config: {
        responseMimeType: 'text/plain',  // forces plain text so we can parse
      },
    });

    // ✅ FIXED response parsing:
    if (response && response.candidates && response.candidates.length > 0) {
      const text = response.candidates[0]?.content?.parts?.[0]?.text;
      
      if (text && typeof text === 'string') {
        console.log("✅ Mix Comparison Result:", text);
        return text;
      } else {
        console.error("❌ No valid text content in candidates[0]:", response);
        throw new Error("Received empty or invalid text from Gemini API for mix comparison.");
      }

    } else {
      console.error("❌ No candidates returned from Gemini API for mix comparison:", response);
      throw new Error("Received an unexpected response format from Gemini API for mix comparison.");
    }

  } catch (error: any) {
    console.error("Error generating mix comparison:", error);
    let specificMessage = "An unknown error occurred while generating mix comparison.";
    
    if (error.message) {
      if (error.message.includes("API_KEY")) {
        specificMessage = "API Key issue. Please check your Gemini API configuration.";
      } else if (error.message.includes("SAFETY") || error.message.includes("blocked")) {
        specificMessage = "The response for mix comparison was blocked by the AI. This might be due to content policies or other restrictions. Please try again or adjust your input if possible.";
      } else if (error.message.includes("quota") || error.message.includes("limit")) {
        specificMessage = "API quota exceeded. Please try again later.";
      } else {
        specificMessage = `Failed to generate mix comparison: ${error.message}`;
      }
    }
    
    return Promise.reject(new Error(specificMessage));
  }
};


export async function generateRemixGuide(
  audioData: { base64: string; mimeType: string },
  targetGenre: string,
  genreInfo: any
): Promise<{
  guide: string;
  targetTempo: number;
  targetKey: string;
  sections: string[];
  midiPatterns: Record<string, Record<string, string>>;
}> {
  const textPart = { text: generateRemixPrompt(targetGenre, genreInfo) };
  const audioPart = {
    inlineData: { data: audioData.base64, mimeType: audioData.mimeType },
  };

  console.log("[geminiService] Remix Prompt:", textPart.text);
  console.log("[geminiService] Audio size (chars):", audioData.base64.length);

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL_NAME,
    contents: [textPart, audioPart],
  });

  // 1) Log the raw response shape for debugging
  console.log(
    "[geminiService] Full raw response:",
    JSON.stringify(response, null, 2)
  );

  // 2) Pull out the text from whatever shape it comes in
  let text: string;
  if (response.choices?.[0]?.message?.content) {
    text = response.choices[0].message.content;
  } else if (response.candidates?.[0]?.content) {
    text = response.candidates[0].content;
  } else if (typeof (response as any).text === "string") {
    text = (response as any).text;
  } else if (
    response.response &&
    typeof response.response.text === "function"
  ) {
    text = await response.response.text();
  } else {
    throw new Error(
      "[geminiService] Unexpected response format – see raw above"
    );
  }

  console.log("[geminiService] Raw remix response:", text);

  // 3) Strip out any ```json fences or stray backticks
  text = text.replace(/```(?:json)?\s*/g, "").replace(/```$/, "").trim();

  // 4) Non-greedy match for the JSON object
  const jsonMatch = text.match(/({[\s\S]*?})/);
  if (!jsonMatch) {
    console.error("[geminiService] No JSON found in response:", text);
    // fallback you already had
    return {
      guide: text,
      targetTempo: genreInfo?.tempoRange?.[0] || 128,
      targetKey: "C minor",
      sections: genreInfo?.sections || [
        "Intro",
        "Build-Up",
        "Drop",
        "Breakdown",
        "Outro",
      ],
      midiPatterns: {},
    };
  }

  // 5) Safely parse
  try {
    return JSON.parse(jsonMatch[1]);
  } catch (err) {
    console.error(
      "[geminiService] JSON.parse failed:",
      err,
      "\nExtracted JSON was:\n",
      jsonMatch[1]
    );
    throw new Error("Invalid JSON in Gemini response");
  }
}
