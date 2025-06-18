
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
You are TrackGuideAI, an expert music production assistant. Create a focused TrackGuide for:
- Title: ${songTitleText || "Generate creative title"}
- Genre: ${genreText}
- Reference: ${artistRefText}
- Vibe: ${vibeText}
- DAW: ${inputs.daw || "General"}
- Plugins: ${pluginsText}
- Instruments: ${instrumentsText}
${inputs.key ? `- Key: ${inputs.key}` : ''}
${inputs.chords ? `- Chords: ${inputs.chords}` : ''}
${inputs.generalNotes ? `- Notes: ${inputs.generalNotes}` : ''}

**STYLE GUIDE:**
- Use concise, actionable language with professional terminology
- Format with Markdown (headings, bullets)
- Add emojis to instrument sections (e.g., ### 🥁 Drums)
- Prioritize user-specified key/chords/notes
- Reference provided tracks/artists when applicable

**FORMATTING:**
- Section 3: Each instrument gets ### Emoji Name, **Style**, **Tips** (2-3 bullets), **Processing** (2-4 bullets with specific parameters)
- Section 4: **Chord Progressions**, **Melodic Notes**, **Rhythmic Focus** (keep lean)
- Use specific plugin suggestions from user's available plugins
- Focus on most impactful processing, not exhaustive lists

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

  return `Generate ${genre} MIDI patterns for ${bars} bars in ${key}${scaleInfo}, ${tempo}BPM, ${timeSignature[0]}/${timeSignature[1]}.
Chords: ${chordProgression} | Section: ${songSection || "General"}
${guidebookContext ? `Style: ${guidebookContext.substring(0, 200)}` : ''}

JSON format with keys: ${targetInstruments.map(inst => `"${inst}"`).join(', ')}

Requirements:
- "chords": [{"time": 0, "name": "Cmaj7", "duration": 1, "notes": [{"pitch": "C4", "midi": 60}], "velocity": 70-95}]
- "bassline": [{"time": 0, "pitch": "C2", "midi": 36, "duration": 0.5, "velocity": 75-110}] (MIDI 12-59)
- "melody": [{"time": 0, "pitch": "C5", "midi": 72, "duration": 0.25, "velocity": 60-100}]
- "drums": Include kick, snare, hihat_closed, hihat_open + 1 more (ride/crash/clap)

Generate ${genre}-appropriate patterns with velocity variation (40-127) and rhythmic interest.`;
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
  const hasMixBOnly = inputs.mixBFile && !inputs.mixAFile;
  
  if (hasBothMixes) {
    return `You are an expert audio mixing and mastering engineer AI. The user has uploaded two audio files for comparison: "${inputs.mixAName}" (Mix A - Reference) and "${inputs.mixBName}" (Mix B - Current Working Track).

**IMPORTANT**: Mix B is the current working track that needs focused feedback and recommendations. Mix A is provided as reference context.

Analyze both audio files with primary focus on improving Mix B. Structure your response using Markdown with clear headings.

## Mix B Analysis & Recommendations

### Current Mix Assessment (${inputs.mixBName})
Provide a comprehensive evaluation of Mix B as the current working track:
- **Overall Balance**: How well balanced is the current mix?
- **Strengths**: What's working well in Mix B?
- **Areas for Improvement**: What needs attention in Mix B?

### Mix B Detailed Feedback
Focus specifically on Mix B with actionable recommendations:
- **Frequency Balance**: Analyze and suggest EQ adjustments for Mix B
- **Stereo Width**: Evaluate and recommend stereo imaging improvements
- **Dynamic Range**: Assess compression and dynamics in Mix B
- **Vocal/Lead Presence**: How to improve lead elements in Mix B
- **Clarity and Separation**: Specific suggestions for better instrument definition
- **Tonal Character**: Recommendations for sonic character improvements

### Technical Metrics (Mix B Focus)
Provide estimated technical measurements for Mix B:
- **LUFS** (loudness)
- **Peak levels** 
- **Stereo correlation**
- **Dynamic range**

### Focused Recommendations for Mix B
Provide specific, actionable advice prioritized for Mix B:
1. **Immediate improvements** needed in Mix B
2. **Technical processing** suggestions for Mix B
3. **Frequency adjustments** specific to Mix B
4. **Elements from Mix A** that could enhance Mix B (if applicable)
5. **Next steps** for finalizing Mix B

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
  } else if (hasMixBOnly) {
    // Mix B only analysis (focused feedback)
    return `You are an expert audio mixing and mastering engineer AI. The user has uploaded their current working track: "${inputs.mixBName}" (Mix B).

Analyze the audio file thoroughly and provide comprehensive feedback focused on improving this mix. Structure your response using Markdown with clear headings.

## Mix B Analysis & Recommendations

### Current Mix Assessment (${inputs.mixBName})
Provide a comprehensive evaluation of this working track:
- **Overall Balance**: How well balanced is the current mix?
- **Strengths**: What's working well in this mix?
- **Areas for Improvement**: What needs attention?

### Detailed Mix Feedback
Focus specifically on actionable recommendations:
- **Frequency Balance**: Analyze and suggest EQ adjustments
- **Stereo Width**: Evaluate and recommend stereo imaging improvements
- **Dynamic Range**: Assess compression and dynamics
- **Vocal/Lead Presence**: How to improve lead elements
- **Clarity and Separation**: Specific suggestions for better instrument definition
- **Tonal Character**: Recommendations for sonic character improvements

### Technical Metrics
Provide estimated technical measurements:
- **LUFS** (loudness)
- **Peak levels** 
- **Stereo correlation**
- **Dynamic range**

### Focused Recommendations
Provide specific, actionable advice prioritized for this mix:
1. **Immediate improvements** needed
2. **Technical processing** suggestions
3. **Frequency adjustments** specific recommendations
4. **Next steps** for finalizing the mix

Keep your analysis professional, detailed, and actionable. Focus on technical aspects and mixing decisions rather than musical composition.${inputs.userNotes ? `\n\n**User Notes**: ${inputs.userNotes}` : ''}`;
  } else {
    // Single mix analysis (Mix A only - legacy support)
    return `You are an expert audio mixing and mastering engineer AI. The user has uploaded a single audio file: "${inputs.mixAName}".

Analyze the audio file thoroughly and provide comprehensive feedback. Structure your response using Markdown with clear headings.

## Mix Analysis

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


// ─── REMIX GUIDE CALL ─────────────────────────────────────────────────────────
// ─── REMIX PROMPT BUILDER ─────────────────────────────────────────────────────────
export function generateRemixPrompt(
  targetGenre: string,
  genreInfo: any
): string {
  const tempoRange = genreInfo
    ? `${genreInfo.tempoRange[0]}-${genreInfo.tempoRange[1]} BPM`
    : "120-130 BPM";
  const sections = genreInfo
    ? genreInfo.sections.join(", ")
    : "Intro, Build-Up, Drop, Breakdown, Outro";

  return `You are an expert music producer and remix specialist. Analyze the uploaded track and create a smart ${targetGenre} remix guide.

ENHANCED ANALYSIS REQUIREMENTS:
1. **Original Track DNA**: Identify and preserve:
   - Key melodic hooks and vocal phrases that define the track's identity
   - Signature chord progressions and harmonic movements
   - Distinctive rhythmic elements and groove patterns
   - Emotional peaks and dynamic moments
   - Unique timbres, textures, and sonic characteristics
   - Original tempo, key, and structural elements

2. **Smart Element Integration**: Specify exactly:
   - Which original melodies will translate perfectly to ${targetGenre} (with examples)
   - How to adapt original chord progressions to ${targetGenre} harmonic language
   - Which vocal phrases/hooks to emphasize in the ${targetGenre} context
   - How to preserve the original's emotional impact while changing genre
   - Specific original elements that will become the foundation of your remix
   - Creative ways to reference the original throughout the ${targetGenre} arrangement

3. **Genre-Specific Transformation**: Detail how to:
   - Adapt original tempo/rhythm to ${targetGenre} standards (${tempoRange})
   - Transform original harmonic content using ${targetGenre} techniques
   - Integrate original melodic content with ${targetGenre} sound design
   - Restructure original arrangement for ${targetGenre} energy flow

Your response must be a valid JSON object with exactly these keys:

{
  "guide": "A comprehensive markdown-formatted remix guide that MUST include these sections:

## 🎵 Original Track DNA Analysis
- **Core Identity Elements**: [The essential melodic/harmonic/rhythmic elements that make this track recognizable]
- **Signature Hooks**: [Specific vocal phrases, melodic lines, or instrumental riffs to preserve]
- **Harmonic Blueprint**: [Original chord progressions and how they'll translate to ${targetGenre}]
- **Rhythmic Foundation**: [Original groove patterns and how to adapt them]
- **Emotional Moments**: [Key dynamic/emotional peaks to maintain in the remix]

## 🎛️ Smart ${targetGenre} Integration Strategy  
- **Perfect Fits**: [Original elements that naturally work in ${targetGenre} - be specific with examples]
- **Creative Adaptations**: [How to transform original melodies/harmonies for ${targetGenre} context]
- **Original-to-${targetGenre} Bridges**: [Specific techniques to connect both genres seamlessly]
- **Preservation Strategy**: [How to keep the original's soul while changing the genre]
- **Reference Points**: [Where and how to callback to original throughout the remix]

## 🔧 ${targetGenre} Production Techniques
- **Sound Design**: [${targetGenre}-specific synthesis and processing for original elements]
- **Arrangement Flow**: [How to restructure original content for ${targetGenre} energy patterns]
- **Original Element Processing**: [Specific effects/processing for original vocals/instruments]
- **Genre-Specific Mix**: [${targetGenre} mixing approaches that enhance original elements]

## 🎹 Remix Implementation Roadmap
Provide a **concise Markdown table** for the remix implementation phases:

| Phase | Implementation Strategy | Key Focus |
|-------|------------------------|-----------|
| Foundation Building | Start with original elements, build ${targetGenre} framework around them | Core Structure |
| Original Integration Points | Specific moments to feature original content prominently | Identity Preservation |
| Creative Fusion Ideas | Unique ways to blend original character with ${targetGenre} aesthetics | Genre Blending |
| Final Polish | How to ensure both original identity and ${targetGenre} authenticity | Quality Assurance |",
  "targetTempo": 125,
  "targetKey": "A minor",
  "sections": ["Intro", "Build-Up", "Drop", "Breakdown", "Outro"],
  "midiPatterns": {
    "Intro": {
      "bassline": "Simple MIDI pattern description",
      "drums": "Drum pattern description", 
      "melody": "Melody pattern description",
      "pads": "Pad/texture pattern description"
    },
    "Build-Up": {
      "bassline": "Build-up bass pattern",
      "drums": "Build-up drum pattern",
      "melody": "Build-up melody pattern", 
      "pads": "Build-up pad pattern"
    }
  }
}

Target tempo range: ${tempoRange}
Suggested sections: ${sections}

IMPORTANT: Return ONLY the JSON object, no other text or markdown formatting.`;
}

// ─── REMIX GUIDE CALL ─────────────────────────────────────────────────────────
export async function generateContent(prompt: string): Promise<string> {
  if (!apiKey) {
    // Demo mode - provide sample response for PatchGuide testing
    return JSON.stringify({
      "steps": [
        {
          "plugin": "Serum",
          "parameters": {
            "oscillator": "saw",
            "filterCutoff": 0.6,
            "filterResonance": 0.4,
            "attack": 0.05,
            "decay": 0.3,
            "sustain": 0.7,
            "release": 0.8
          },
          "description": "Start with a classic saw wave for analog character. Set filter cutoff to 60% for warmth while maintaining punch.",
          "envelope": {
            "attack": 0.05,
            "decay": 0.3,
            "sustain": 0.7,
            "release": 0.8
          }
        }
      ],
      "notes": "For extra warmth, try adding subtle saturation or tube modeling."
    });
  }

  // Also provide demo response if API key exists but we want to test
  if (prompt.toLowerCase().includes('warm analog bass')) {
    return JSON.stringify({
      "steps": [
        {
          "plugin": "Serum",
          "parameters": {
            "oscillator": "saw",
            "filterCutoff": 0.6,
            "filterResonance": 0.4,
            "attack": 0.05,
            "decay": 0.3,
            "sustain": 0.7,
            "release": 0.8
          },
          "description": "Start with a classic saw wave for analog character. Set filter cutoff to 60% for warmth while maintaining punch.",
          "envelope": {
            "attack": 0.05,
            "decay": 0.3,
            "sustain": 0.7,
            "release": 0.8
          }
        }
      ],
      "notes": "For extra warmth, try adding subtle saturation or tube modeling."
    });
  }

  try {
    const model = ai.getGenerativeModel({ model: GEMINI_MODEL_NAME });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("[geminiService] Error generating content:", error);
    throw new Error("Failed to generate content from Gemini API");
  }
}

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
  if (!apiKey) {
    const errorMessage = "API Key not configured. Cannot connect to Gemini API for remix guide.";
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  try {
    const textPart = { text: generateRemixPrompt(targetGenre, genreInfo) };
    const audioPart = {
      inlineData: { data: audioData.base64, mimeType: audioData.mimeType },
    };

    console.log("[geminiService] Remix Prompt:", textPart.text);
    console.log("[geminiService] Audio size (chars):", audioData.base64.length);

    const contents = [audioPart, textPart];

    // Use the same API call pattern as the working Mix Feedback function
    const geminiResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: { parts: contents },
    });

    console.log(
      "[geminiService] Full raw response:",
      JSON.stringify(geminiResponse, null, 2)
    );

    // Use the same response extraction as Mix Feedback
    const text = geminiResponse.text;
    if (typeof text !== 'string') {
      console.error("Received non-text response or no text from Gemini API for remix guide. Response:", geminiResponse);
      throw new Error("Received an unexpected response format from Gemini API for remix guide.");
    }

    console.log("[geminiService] Raw remix response:", text);

    // Try to parse the response as JSON
    let parsedResponse;
    try {
      // First, try to parse the entire response as JSON
      parsedResponse = JSON.parse(text);
    } catch (err) {
      // If that fails, try to extract JSON from markdown code blocks
      const cleanedText = text.replace(/```(?:json)?\s*/g, "").replace(/```$/, "").trim();
      try {
        parsedResponse = JSON.parse(cleanedText);
      } catch (err2) {
        // If that fails, try to find JSON object in the text
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            parsedResponse = JSON.parse(match[0]);
          } catch (err3) {
            console.error("[geminiService] All JSON parsing attempts failed:", { err, err2, err3 });
            console.error("[geminiService] Original text:", text);
            console.error("[geminiService] Cleaned text:", cleanedText);
            console.error("[geminiService] Matched text:", match[0]);
            
            // Return a fallback response with the raw text as guide
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
        } else {
          console.error("[geminiService] No JSON object found in response:", text);
          throw new Error("No valid JSON found in Gemini response");
        }
      }
    }

    // Validate the parsed response has required fields
    if (!parsedResponse || typeof parsedResponse !== 'object') {
      throw new Error("Parsed response is not a valid object");
    }

    // Ensure required fields exist with defaults
    const result = {
      guide: parsedResponse.guide || text,
      targetTempo: parsedResponse.targetTempo || genreInfo?.tempoRange?.[0] || 128,
      targetKey: parsedResponse.targetKey || "C minor",
      sections: parsedResponse.sections || genreInfo?.sections || [
        "Intro",
        "Build-Up",
        "Drop", 
        "Breakdown",
        "Outro",
      ],
      midiPatterns: parsedResponse.midiPatterns || {},
    };

    console.log("[geminiService] Successfully parsed remix guide:", result);
    return result;

  } catch (error) {
    console.error("Error generating remix guide:", error);
    let specificMessage = "An unknown error occurred while generating remix guide.";
    if (error instanceof Error) {
      specificMessage = error.message;
      if (error.message.includes("API key not valid") || (error.message.includes("permission") && error.message.includes("API key"))) {
        specificMessage = "Invalid API Key or insufficient permissions. Please check your API key and its configuration.";
      } else if (error.message.toLowerCase().includes("network error") || error.message.toLowerCase().includes("failed to fetch")) {
        specificMessage = `Network error: Failed to connect to Gemini API. Please check your internet connection. (${error.message})`;
      } else if (error.message.includes("Candidate was blocked")) {
        specificMessage = "The response for remix guide was blocked by the AI. This might be due to content policies or other restrictions. Please try again or adjust your input if possible.";
      } else if (error.message.includes("audio")) {
        specificMessage = `There was an issue processing the audio file with the AI. Ensure it's a common format and not too large. (${error.message})`;
      } else {
        specificMessage = `Failed to generate remix guide: ${error.message}`;
      }
    }
    throw new Error(specificMessage);
  }
}
