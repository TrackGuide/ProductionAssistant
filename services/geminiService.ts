
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { UserInputs, MidiSettings, MixFeedbackInputs } from '../types.ts';
import { GEMINI_MODEL_NAME, MIDI_DRUM_MAP } from '../constants.ts';

const apiKey = process.env.API_KEY || 'demo-key';
if (!process.env.API_KEY) {
  console.warn("API_KEY is not set. Using demo mode - AI features will return placeholder content.");
}
const ai = new GoogleGenAI({ apiKey: apiKey });


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
You are TrackGuideAI, an expert music production assistant. Create a concise, actionable TrackGuide for:

**PROJECT SPECS:**
- Title: ${songTitleText || "Generate creative title"}
- Genre: ${genreText}
- Reference: ${artistRefText}
- Vibe: ${vibeText}
- DAW: ${inputs.daw || "General/Ableton/Logic"}
- Plugins: ${pluginsText}
- Instruments: ${instrumentsText}${inputs.referenceTrack ? `\n- Reference Track: ${inputs.referenceTrack}` : ''}

**IMPORTANT INSTRUCTIONS FOR AI (OVERALL):**
- **STYLE:** Follow a "Quick Reference / Cheat Sheet Style" for Section 3 (Instrument & Sound Design) and Section 4 (Harmony, Melody & Rhythmic Core). Be extremely concise and actionable.
- **TERMINOLOGY:** Use professional music production terminology.
- **MARKDOWN:** Use Markdown for formatting (e.g., #, ##, ### for headings, bullet points for lists).
- **CONCISENESS (Sections 1, 2, 5):** Keep these sections brief and to the point.
- **EMOJIS (Section 3):** Use a relevant emoji before each instrument name heading (e.g., ### 🥁 Drums & Percussion).${inputs.referenceTrack ? `\n- **REFERENCE TRACK:** Analyze and incorporate elements from the provided reference track "${inputs.referenceTrack}" into your recommendations. Consider its arrangement, sound design, mix characteristics, and production techniques.` : ''}

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
This TrackGuide for ${genreText} (${vibeText}) using ${inputs.daw || 'your DAW'} is a starting point. Experiment, trust your ears, and enjoy the creative journey!
`;
};


export const generateGuidebookContent = async (inputs: UserInputs): Promise<AsyncIterable<GenerateContentResponse>> => {
  if (!process.env.API_KEY) {
    // Return demo content in demo mode
    const demoContent = `# TrackGuide for ${inputs.songTitle || 'Your Track'}

## Demo Mode
This is demo content. To use AI features, please set your API_KEY environment variable.

## 1. Track Overview
**Genre:** ${inputs.genre.join(', ') || 'Not specified'}
**Vibe:** ${inputs.vibe.join(', ') || 'Not specified'}
**BPM:** ${inputs.bpm || 'Not specified'}

## 2. Arrangement Structure
- **Intro:** 8 bars
- **Verse:** 16 bars  
- **Chorus:** 16 bars
- **Bridge:** 8 bars
- **Outro:** 8 bars

## 3. Instrumentation Guide
### 🥁 Drums
**Style:** Standard pattern for your genre
**Programming Tips:**
- Keep it simple and groove-focused
- Layer percussion for texture

### 🎸 Bass
**Style:** Follow the root progression
**Programming Tips:**
- Lock with the kick drum
- Add subtle variations

## 4. Harmony & Melody
**Chord Progressions:**
- Try: I - V - vi - IV
- Or: vi - IV - I - V

**Key Suggestions:**
- Major keys for uplifting feel
- Minor keys for emotional depth`;

    // Create a mock async iterable that yields demo content
    const mockResponse = {
      text: () => demoContent,
      candidates: [{
        content: {
          parts: [{ text: demoContent }]
        }
      }]
    };

    return (async function* () {
      yield mockResponse as GenerateContentResponse;
    })();
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
  const { key, tempo, timeSignature, chordProgression, genre, bars, targetInstruments, guidebookContext, songSection } = settings;
  const instrumentsToGenerate = targetInstruments.join(', ');

  const drumMapInfo = `Drum elements should map to these General MIDI (GM) notes if possible: ${Object.entries(MIDI_DRUM_MAP).map(([name, note]) => `${name}: ${note}`).join(', ')}. Common names like 'kick', 'snare', 'closed_hihat', 'open_hihat', 'crash', 'ride', 'tom_low', 'tom_mid', 'tom_high' are preferred for drum part keys in the JSON.`;

  const songSectionInstruction = songSection && songSection !== "General Loop" 
    ? `The MIDI patterns should be specifically tailored for the **'${songSection}'** song section. This means:
    - If '${songSection}' is 'Intro' or 'Outro', patterns might be sparser, build anticipation, or fade out.
    - If '${songSection}' is 'Verse', patterns should support lyrical content, perhaps with less density than a chorus.
    - If '${songSection}' is 'Pre-Chorus' or 'Build-up', intensity and density should gradually increase.
    - If '${songSection}' is 'Chorus' or 'Drop', patterns should be high-energy, full, and memorable.
    - If '${songSection}' is 'Bridge', patterns might offer contrast, explore a different harmonic or rhythmic feel.
    - If '${songSection}' is 'Solo', accompanying patterns should be supportive and not overshadow the lead.
    - If '${songSection}' is 'Breakdown', patterns might be very sparse, rhythmic, or percussive.
    - If '${songSection}' is 'Fill', it should be a short, transitional pattern.
    Consider these characteristics for density, rhythmic complexity, melodic range, and overall energy.`
    : "Generate a general-purpose loop suitable for the main part of a song or as a foundational idea.";


  return `
You are an expert MIDI pattern generator. Based on the following musical parameters, create MIDI patterns in JSON format.
Your primary goal is to generate musically interesting and varied patterns that are **strongly influenced by the guidebookContext AND the specified songSection**.
Do NOT just generate generic patterns or simple root notes for basslines if the context or section suggests more complexity or specific styles.

Musical Context:
- Key: ${key}
- Tempo: ${tempo} BPM
- Time Signature: ${timeSignature[0]}/${timeSignature[1]}
- Chord Progression: ${chordProgression} (Interpret this creatively within the given key, guidebookContext, and songSection.)
- Genre: ${genre}
- Number of Bars: ${bars}
- Song Section Focus: ${songSection || "General Loop"}
- Instruments to Generate: ${instrumentsToGenerate}
${guidebookContext ? `- Additional Context from TrackGuide (CRITICALLY IMPORTANT: Use this to inform pattern style, complexity, melodic contour, rhythmic feel, harmonic voicings, and overall musical character for EACH instrument. For example, if context mentions 'syncopated funk guitar riff', the chord/melody parts should reflect that rhythmic complexity. If 'ethereal, evolving pads', chords should be sustained, possibly with slow filter-like voice leading. If 'aggressive metal chugs', bass/chords should be tight and percussive. If 'complex polyrhythms for experimental electronic music', the drum patterns should be intricate and layered, not just a basic rock beat.):\n${guidebookContext}` : ''}

**Song Section Influence (VERY IMPORTANT):**
${songSectionInstruction}

Output Format Instructions:
Return a single JSON object. The top-level keys should be the instrument types requested (e.g., "chords", "bassline", "melody", "drums").
If an instrument is not generated or not applicable, omit its key or set its value to null.

1.  "chords": An array of chord events.
    -   **Influence from Context & Section:** Interpret the \`chordProgression\` using voicings, rhythms, and densities appropriate for the \`genre\`, \`guidebookContext\`, AND \`songSection\`. A 'Chorus' section might have fuller, more sustained chords than a sparse 'Intro'.
    -   Each event object should have: "time", "name", "duration", "notes" (array of { "pitch", "midi" }), "velocity".

2.  "bassline": An array of note objects.
    -   **Influence from Context & Section:** Bassline should lock with the groove and complement chords, reflecting the energy of the \`songSection\`. A 'Verse' might have a more melodic bassline, while a 'Drop' might have a simpler, powerful sub.
    -   **OCTAVE RANGE (VERY IMPORTANT): Bassline notes MUST predominantly be in MIDI octaves 0, 1, or 2 (MIDI notes 12-47). Notes up to MIDI note 59 (B3) can be used sparingly.**
    -   Each note object should have: "time", "pitch", "midi", "duration", "velocity".

3.  "melody": An array of note objects.
    -   **Influence from Context & Section:** Melodic ideas should fit the \`songSection\`. Lead melodies are more common in 'Chorus' or 'Solo' sections, while 'Verse' melodies might be more subtle.
    -   Each note object should have: "time", "pitch", "midi", "duration", "velocity".

4.  "drums": An object where keys are drum element names.
    -   **Influence from Context & Section:** Drum patterns MUST reflect the \`style\`, \`energy\`, and \`songSection\`. An 'Intro' might use minimal percussion, while a 'Chorus' or 'Drop' would have a full, driving beat. 'Fills' should be short and transitional.
    -   The value for each drum element is an array of hit objects: "time", "duration", "velocity".
    ${drumMapInfo}

Velocity, Dynamics, and Expression Instructions (VERY IMPORTANT, influenced by songSection):
-   **General:** Vary velocities for musicality. A 'Build-up' section should show increasing velocity/intensity.
-   **Chords:** Nuanced velocity for voicings. 'Sustained pads' in an 'Intro' (lower avg velocity 70-85), 'rhythmic stabs' in a 'Chorus' (higher avg 90-110).
-   **Bassline & Melody:** Dynamic changes. Emphasize strong notes. Melodies in a 'Chorus' might be louder than in a 'Verse'.
-   **Drums (CRITICAL, informed by context AND songSection):**
    -   **Kick:** Strong beats (100-120 in high energy sections). Softer for syncopation/ghosts (70-90).
    -   **Snare:** Backbeats strong (100-120). Ghost notes very soft (20-50). Rolls/fills dynamic, often leading into higher energy sections.
    -   **Hi-Hats (Closed):** Dynamic pattern. Accents (80-95), unaccented (50-70). More open/active hats in higher energy sections.
    -   **Hi-Hats (Open) / Cymbals:** Typically accented (90-115). Crashes mark section changes, especially into 'Chorus' or 'Drop'.
    -   **Overall Drum Feel:** Consider \`guidebookContext\` and \`songSection\`. Funk: very dynamic. Techno: might be more consistent. 'Intro' drums sparser than 'Chorus' drums.

General Rules for all patterns:
-   All "time" values are relative to the start of the ${bars}-bar pattern.
-   Ensure notes and chords fit within the "key" and are harmonically related to the "chordProgression" as interpreted through the lens of the "guidebookContext" and "songSection".
-   Make the patterns musically coherent.
-   "duration" should be musically sensible.
-   Provide MIDI note numbers ("midi"). Middle C is C4 (MIDI note 60).
-   If you cannot generate a specific requested instrument pattern meaningfully, omit it or set to null.

**AVOID GENERIC PATTERNS. The \`guidebookContext\` and \`songSection\` are paramount for making these MIDI patterns unique, varied, and fitting. If the context is rich with musical descriptors, or the section implies specific energy, the MIDI MUST reflect that richness.**

Example of a "chords" event:
{ "time": 0, "name": "Am7", "duration": 4, "notes": [{ "pitch": "A3", "midi": 57 }, { "pitch": "C4", "midi": 60 }, { "pitch": "E4", "midi": 64 }, { "pitch": "G4", "midi": 67 }], "velocity": 90 }

Example of a "melody" note:
{ "time": 0.5, "pitch": "G4", "midi": 67, "duration": 0.5, "velocity": 85 }

Example of a "drums" structure:
"drums": {
  "kick": [{ "time": 0, "duration": 0.1, "velocity": 120 }, { "time": 0.75, "duration": 0.1, "velocity": 90 }, { "time": 1, "duration": 0.1, "velocity": 115 }],
  "snare": [{ "time": 1, "duration": 0.1, "velocity": 110 }],
  "closed_hihat": [{ "time": 0, "duration": 0.05, "velocity": 80 }, { "time": 0.25, "duration": 0.05, "velocity": 60 }, { "time": 0.5, "duration": 0.05, "velocity": 75 }, { "time": 0.75, "duration": 0.05, "velocity": 60 }, ...]
}

Generate the MIDI patterns now.
  `;
};

export const generateMidiPatternSuggestions = async (settings: MidiSettings): Promise<AsyncIterable<GenerateContentResponse>> => {
  if (!process.env.API_KEY) {
    // Return demo MIDI patterns
    const demoMidiData = {
      drums: {
        pattern: [
          { note: 36, velocity: 100, time: 0, duration: 0.25 },
          { note: 38, velocity: 80, time: 0.5, duration: 0.25 },
          { note: 36, velocity: 100, time: 1, duration: 0.25 },
          { note: 38, velocity: 80, time: 1.5, duration: 0.25 }
        ]
      },
      melody: {
        pattern: [
          { note: 60, velocity: 70, time: 0, duration: 0.5 },
          { note: 62, velocity: 70, time: 0.5, duration: 0.5 },
          { note: 64, velocity: 70, time: 1, duration: 0.5 },
          { note: 65, velocity: 70, time: 1.5, duration: 0.5 }
        ]
      },
      bass: {
        pattern: [
          { note: 48, velocity: 90, time: 0, duration: 1 },
          { note: 50, velocity: 90, time: 1, duration: 1 }
        ]
      },
      harmony: {
        pattern: [
          { note: 60, velocity: 60, time: 0, duration: 2 },
          { note: 64, velocity: 60, time: 0, duration: 2 },
          { note: 67, velocity: 60, time: 0, duration: 2 }
        ]
      }
    };

    const mockResponse = {
      text: () => JSON.stringify(demoMidiData),
      candidates: [{
        content: {
          parts: [{ text: JSON.stringify(demoMidiData) }]
        }
      }]
    };

    return (async function* () {
      yield mockResponse as GenerateContentResponse;
    })();
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
  if (!process.env.API_KEY) {
    return `# Mix Feedback (Demo Mode)

**Note:** This is demo content. To get AI-powered mix analysis, please set your API_KEY environment variable.

## General Mix Feedback
Based on your notes: "${inputs.userNotes || 'No specific notes provided'}"

### Common Mix Considerations:
- **Balance:** Check if all elements sit well together
- **EQ:** Look for frequency conflicts, especially in the low-mids (200-500Hz)
- **Dynamics:** Consider compression on individual tracks and bus compression
- **Stereo Image:** Use panning and stereo effects to create width
- **Depth:** Use reverb and delay to create spatial depth

### Suggested Next Steps:
1. A/B your mix against reference tracks in the same genre
2. Check your mix on different playback systems
3. Take breaks and return with fresh ears
4. Consider getting feedback from other producers

To get detailed, AI-powered analysis of your specific mix, please configure your API key.`;
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

const generateAIAssistantPrompt = (userMessage: string, context: any): string => {
  const { currentGuidebook, userInputs, conversationHistory } = context;
  
  let contextInfo = "";
  if (currentGuidebook) {
    contextInfo += `\n\nCURRENT TRACKGUIDE CONTEXT:\n${currentGuidebook.substring(0, 1500)}...`;
  }
  if (userInputs && Object.keys(userInputs).length > 0) {
    contextInfo += `\n\nUSER PROJECT INPUTS:\n${JSON.stringify(userInputs, null, 2)}`;
  }
  if (conversationHistory && conversationHistory.length > 0) {
    contextInfo += `\n\nRECENT CONVERSATION:\n${conversationHistory.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n')}`;
  }

  return `You are an expert AI music production assistant helping a producer with their track. You have deep knowledge of:
- Music production techniques and workflows
- Genre-specific production approaches
- Mixing and mastering
- Sound design and synthesis
- Arrangement and composition
- DAW-specific tips and tricks
- Music theory as it applies to production

GUIDELINES:
- Be helpful, encouraging, and specific in your advice
- Reference the user's current project context when relevant
- Provide actionable suggestions they can implement
- Ask clarifying questions when needed
- Keep responses focused and practical
- Use professional terminology but explain complex concepts clearly
- If suggesting changes to their TrackGuide, be specific about what and why

USER'S QUESTION/MESSAGE:
${userMessage}

CONTEXT:${contextInfo}

Respond as a knowledgeable production mentor who understands their specific project and goals.`;
};

export const generateAIAssistantResponse = async (userMessage: string, context: any): Promise<AsyncIterable<GenerateContentResponse>> => {
  if (!process.env.API_KEY) {
    // Return demo AI assistant response
    const demoResponse = `Thanks for your question: "${userMessage}"

I'm currently running in demo mode since no API key is configured. To get personalized AI assistance with your music production, please set up your API_KEY environment variable.

In the meantime, here are some general tips:
- Focus on getting a solid foundation with drums and bass
- Use reference tracks to guide your mix decisions  
- Don't over-complicate your arrangements
- Trust your ears and take breaks when mixing

Would you like me to help with anything specific about music production?`;

    const mockResponse = {
      text: () => demoResponse,
      candidates: [{
        content: {
          parts: [{ text: demoResponse }]
        }
      }]
    };

    return (async function* () {
      yield mockResponse as GenerateContentResponse;
    })();
  }

  try {
    const prompt = generateAIAssistantPrompt(userMessage, context);
    const stream = await ai.models.generateContentStream({
        model: GEMINI_MODEL_NAME,
        contents: prompt,
    });
    return stream;

  } catch (error) {
    console.error("Error generating AI Assistant response:", error);
    let specificMessage = "An unknown error occurred while generating AI Assistant response.";
    if (error instanceof Error) {
        specificMessage = error.message; 
        if (error.message.includes("API key not valid") || (error.message.includes("permission") && error.message.includes("API key"))) {
            specificMessage = "Invalid API Key or insufficient permissions. Please check your API key and its configuration.";
        } else if (error.message.toLowerCase().includes("network error") || error.message.toLowerCase().includes("failed to fetch")) {
             specificMessage = `Network error: Failed to connect to Gemini API. Please check your internet connection. (${error.message})`;
        } else {
            specificMessage = `Failed to generate AI Assistant response: ${error.message}`;
        }
    }
    throw new Error(specificMessage);
  }
};
