// services/geminiService.ts

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GEMINI_MODEL_NAME } from "../constants";
import {
  UserInputs,
  MidiSettings,
  MixFeedbackInputs,
  MixComparisonInputs,
  RemixGuideInputs,
  ChatMessage,
  GuidebookEntry
} from "../types";

const apiKey = process.env.API_KEY!;
if (!apiKey) throw new Error("API_KEY is not set. Cannot connect to Gemini API.");
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

  // Get DAW-specific stock plugins
  const getStockPlugins = (dawName: string) => {
    const lowerDaw = dawName.toLowerCase();
    if (lowerDaw.includes('ableton')) {
      return {
        eq: 'EQ Eight',
        compressor: 'Compressor',
        reverb: 'Reverb',
        delay: 'Echo',
        limiter: 'Limiter',
        saturator: 'Saturator'
      };
    } else if (lowerDaw.includes('logic')) {
      return {
        eq: 'Channel EQ',
        compressor: 'Compressor',
        reverb: 'ChromaVerb',
        delay: 'Echo',
        limiter: 'Adaptive Limiter',
        saturator: 'Tape'
      };
    } else if (lowerDaw.includes('fl studio') || lowerDaw.includes('fl')) {
      return {
        eq: 'Parametric EQ 2',
        compressor: 'Fruity Compressor',
        reverb: 'Reverb 2',
        delay: 'Fruity Delay 3',
        limiter: 'Fruity Limiter',
        saturator: 'Fruity Waveshaper'
      };
    } else if (lowerDaw.includes('pro tools')) {
      return {
        eq: 'EQ III',
        compressor: 'Dyn3 Compressor/Limiter',
        reverb: 'D-Verb',
        delay: 'Mod Delay III',
        limiter: 'Dyn3 Compressor/Limiter',
        saturator: 'Lo-Fi'
      };
    } else if (lowerDaw.includes('cubase') || lowerDaw.includes('nuendo')) {
      return {
        eq: 'StudioEQ',
        compressor: 'Compressor',
        reverb: 'REVerence',
        delay: 'ModMachine',
        limiter: 'Limiter',
        saturator: 'Tape'
      };
    } else if (lowerDaw.includes('reaper')) {
      return {
        eq: 'ReaEQ',
        compressor: 'ReaComp',
        reverb: 'ReaVerb',
        delay: 'ReaDelay',
        limiter: 'ReaLimit',
        saturator: 'ReaSynth'
      };
    } else {
      return {
        eq: 'Stock EQ',
        compressor: 'Stock Compressor',
        reverb: 'Stock Reverb',
        delay: 'Stock Delay',
        limiter: 'Stock Limiter',
        saturator: 'Stock Saturator'
      };
    }
  };

  const stockPlugins = daw ? getStockPlugins(daw) : null;
  const dawSpecific = daw && !plugins ? `**${daw} Stock Plugin Chain:**` : daw ? `**${daw}-Specific Settings:**` : '';
  const pluginSpecific = plugins ? `**Custom Plugin Chain (${plugins}):**` : '';

  return `
### 🎛️ Processing Tips & Plugin Parameters
${dawSpecific}
${pluginSpecific}

**EQ Parameters:**
${stockPlugins && !plugins ? 
  `- ${stockPlugins.eq}: High-pass at ${daw?.toLowerCase().includes('logic') ? '35' : daw?.toLowerCase().includes('fl') ? '30' : '40'} Hz, Low-mid cut at ${daw?.toLowerCase().includes('logic') ? '300' : daw?.toLowerCase().includes('fl') ? '400' : '250'} Hz (-3dB), Presence boost at ${daw?.toLowerCase().includes('logic') ? '12 kHz (+1.5dB)' : daw?.toLowerCase().includes('fl') ? '15 kHz (+2dB)' : '3 kHz (+2dB)'}` :
  daw === 'Ableton Live' ? '- EQ Eight: High-pass at 40 Hz, Low-mid cut at 250 Hz (-3dB), Presence boost at 3 kHz (+2dB)' : 
  daw === 'Logic Pro X' ? '- Channel EQ: High-pass at 35 Hz, Low-mid cut at 300 Hz (-2.5dB), High boost at 12 kHz (+1.5dB)' :
  daw === 'FL Studio' ? '- Parametric EQ 2: High-pass at 30 Hz, Mid cut at 400 Hz (-4dB), Air boost at 15 kHz (+2dB)' :
  '- High-pass filter: 20-40 Hz, Low-mid cut: 200-400 Hz (-2 to -4dB), Presence boost: 2-5 kHz (+1 to +3dB)'}

**Compression Settings:**
${stockPlugins && !plugins ? 
  `- ${stockPlugins.compressor}: Ratio ${daw?.toLowerCase().includes('logic') ? '3.5:1' : '4:1'}, Attack ${daw?.toLowerCase().includes('fl') ? '10ms' : daw?.toLowerCase().includes('logic') ? '20ms' : '15ms'}, Release ${daw?.toLowerCase().includes('logic') ? '150ms' : daw?.toLowerCase().includes('fl') ? '250ms' : '200ms'}${daw?.toLowerCase().includes('logic') ? ', Auto-Release enabled' : daw?.toLowerCase().includes('fl') ? ', Knee 3dB' : ', Knee 2dB'}` :
  daw === 'Ableton Live' ? '- Compressor: Ratio 4:1, Attack 15ms, Release 200ms, Knee 2dB' :
  daw === 'Logic Pro X' ? '- Compressor: Ratio 3.5:1, Attack 20ms, Release 150ms, Auto-Release enabled' :
  daw === 'FL Studio' ? '- Fruity Compressor: Ratio 4:1, Attack 10ms, Release 250ms, Knee 3dB' :
  '- Ratio: 3:1 to 4:1, Attack: 10-30ms, Release: 100-300ms'}

**Reverb & Delay:**
${stockPlugins && !plugins ? 
  `- ${stockPlugins.reverb}: Room/Hall setting, 1.2s decay, Pre-delay 20ms, Mix 25%
- ${stockPlugins.delay}: 1/8 note timing, Feedback 35%, High-cut 8kHz, Mix 20%` :
  '- Room reverb: 0.8-1.5s decay for space, Delay: 1/8 or 1/4 note timing, High-cut: 8-12 kHz to avoid harshness'}

**Effects Chain:**
${plugins ? 
  `- Using ${plugins}: Apply specific parameter recommendations based on your plugin selection` : 
  stockPlugins ? 
    `- ${stockPlugins.eq} → ${stockPlugins.compressor} → ${stockPlugins.saturator} → ${stockPlugins.reverb}/${stockPlugins.delay} → ${stockPlugins.limiter}` :
    '- Standard effects: EQ → Compressor → Reverb/Delay → Limiter'}
- Send levels: 15-25% to reverb bus, 10-20% to delay bus
- Sidechain settings: 4:1 ratio, fast attack, medium release`;
}

/**
 * Helper function to build structural blueprint with instrumentation column
 */
function buildStructuralBlueprint(includeInstrumentation: boolean = true): string {
  const instrumentationColumn = includeInstrumentation ? ' | **Instrumentation** ' : '';
  const instrumentationHeader = includeInstrumentation ? ' | --- ' : '';
  const instrumentationRows = includeInstrumentation ? [
    ' | Lead synth, Bass, Drums, Pads ',
    ' | Vocals, Full arrangement ',
    ' | Reduced arrangement, Focus elements ',
    ' | Full arrangement, Vocal harmonies ',
    ' | Breakdown elements, Build-up ',
    ' | Lead elements, Minimal backing ',
    ' | Full arrangement, Climax elements ',
    ' | Fade elements, Ambient textures '
  ] : Array(8).fill('');

  return `
## 🎼 Structural Blueprint

| **Section** | **Duration** | **Key Elements** | **Energy Level**${instrumentationColumn}|
| --- | --- | --- | ---${instrumentationHeader}|
| **Intro** | 16-32 bars | Atmospheric build, Teaser elements | Low-Medium${instrumentationRows[0]}|
| **Verse 1** | 16 bars | Main groove, Vocal/Lead melody | Medium${instrumentationRows[1]}|
| **Pre-Chorus** | 8 bars | Tension build, Filter sweeps | Medium-High${instrumentationRows[2]}|
| **Chorus** | 16 bars | Full energy, Hook elements | High${instrumentationRows[3]}|
| **Breakdown** | 8-16 bars | Stripped back, Build tension | Low-Medium${instrumentationRows[4]}|
| **Verse 2/Solo** | 16 bars | Variation, New elements | Medium-High${instrumentationRows[5]}|
| **Final Chorus** | 16-24 bars | Maximum energy, All elements | Maximum${instrumentationRows[6]}|
| **Outro** | 16-32 bars | Gradual fade, Ambient tail | Low${instrumentationRows[7]}|`;
}

/**
 * 1. Generate the core TrackGuide content (streaming)
 */
export const generateGuidebookContent = async (
  inputs: UserInputs
): Promise<AsyncIterable<GenerateContentResponse>> => {
  const genreContext = inputs.genre?.join(", ") || "Not specified";
  const vibeContext = inputs.vibe?.join(", ") || "Not specified";
  const instrumentContext = inputs.availableInstruments || "Not specified";
  const keyContext = inputs.key ? `Key: ${inputs.key}` : "";
  const scaleContext = inputs.scale ? `Scale/Mode: ${inputs.scale}` : "";
  const chordsContext = inputs.chords ? `Chord Progression: ${inputs.chords}` : "";
  const referenceContext = inputs.referenceTrackLink ? `Reference Track: ${inputs.referenceTrackLink}` : "";
  const lyricsContext = inputs.lyrics ? `Lyrics Theme: ${inputs.lyrics}` : "";
  const notesContext = inputs.generalNotes ? `Additional Notes: ${inputs.generalNotes}` : "";

  const structuralBlueprint = buildStructuralBlueprint(true);
  const pluginSection = buildPluginParameterSection(inputs.daw, inputs.plugins);

  const prompt = `You are TrackGuideAI, an expert music production assistant specializing in comprehensive track creation guides.

Create a detailed TrackGuide for the following specifications:
- **Genre**: ${genreContext}
- **Vibe**: ${vibeContext}
- **Available Instruments**: ${instrumentContext}
- **DAW**: ${inputs.daw || "Not specified"}
- **Plugins**: ${inputs.plugins || "Stock/Generic plugins"}
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

Focus on practical, actionable advice that can be immediately applied in ${inputs.daw || "any DAW"}. Provide specific parameter ranges and creative techniques that align with the ${genreContext} aesthetic and ${vibeContext} mood.`;

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
  const prompt = `You are TrackGuideAI's MIDI Pattern Generator. Generate MIDI patterns in VALID JSON format only.

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

**JSON Structure Required:**
{
  "chords": [
    {
      "time": 0,
      "name": "Cmaj7",
      "duration": 2,
      "notes": [
        {"pitch": "C4", "midi": 60},
        {"pitch": "E4", "midi": 64},
        {"pitch": "G4", "midi": 67},
        {"pitch": "B4", "midi": 71}
      ],
      "velocity": 100
    }
  ],
  "bassline": [
    {
      "time": 0,
      "midi": 36,
      "duration": 0.5,
      "velocity": 110,
      "pitch": "C2"
    }
  ],
  "melody": [
    {
      "time": 0,
      "midi": 72,
      "duration": 1,
      "velocity": 100,
      "pitch": "C5"
    }
  ],
  "drums": {
    "kick": [
      {"time": 0, "duration": 0.1, "velocity": 120},
      {"time": 1, "duration": 0.1, "velocity": 115}
    ],
    "snare": [
      {"time": 1, "duration": 0.1, "velocity": 110},
      {"time": 3, "duration": 0.1, "velocity": 105}
    ],
    "hihat_closed": [
      {"time": 0.5, "duration": 0.1, "velocity": 80},
      {"time": 1.5, "duration": 0.1, "velocity": 75}
    ]
  }
}

**CRITICAL:** Return ONLY valid JSON. No explanatory text, no markdown formatting, no code blocks. Just the raw JSON object that can be parsed directly.

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
  return response.text;
};

/**
 * 4. Generate mix comparison (one-shot)
 */
const generateMixComparisonPrompt = (inputs: MixComparisonInputs): string => {
  const focus = inputs.focus?.trim() || "Overall clarity, balance, stereo image, and dynamics";

  return `
You are an expert audio mixing and mastering engineer AI. The user has uploaded two mixes:

Mix A: "${inputs.mixAName}" (Previous version)
Mix B: "${inputs.mixBName}" (Current version)

Mix B is the latest version. Focus your recommendations ONLY on improving Mix B. Use Mix A for comparison — if Mix A does something better, mention it — but do NOT suggest changes to Mix A.

Focus on the following areas: ${focus}

---

## Comparison Structure:

### 🎧 Overall Comparison
- Compare the artistic impact, balance, polish between Mix A and Mix B.
- Note improvements in Mix B.
- Note where Mix A still sounds better.

### 🎛️ Frequency Balance
- Compare low-end, midrange, and high-end.
- Where can Mix B still improve?
- Where is it better than Mix A?

### 🎚️ Stereo Image & Depth
- Compare width, depth, spatial clarity.
- How can Mix B improve further?

### 📈 Dynamics & Loudness
- Compare compression, transient clarity, punch.
- Estimated loudness (LUFS), dynamic range.

### ⚙️ Technical Quality
- Check for clipping, noise, phase issues, mono compatibility.

---

## 🏆 Strengths & Opportunities (FOR MIX B ONLY)
- Strengths of Mix B
- Opportunities for improvement

---

## 🚀 Actionable Recommendations (FOR MIX B ONLY)
For each recommendation:

✅ Suggest common plugins or plugin types
✅ If DAW or user plugins are known, mention them
✅ Provide EXAMPLE parameters: EQ freqs/gain, compression ratio/attack/release, saturation drive %, reverb decay, transient shaper %, etc.
✅ Be concise but specific — avoid vague suggestions

Example:

❌ "Add grit to guitars"

✅ "Use Decapitator (Drive ~5, Tone ~5, Mix 50%) or DAW saturator. Focus on 500 Hz – 3 kHz to add grit to guitars."

---

## Final Section:

**Next Steps (For Mix B only):**
1. Top priority improvements
2. Polishing & mastering prep
3. Additional listening advice

---

If the user requested individual analysis, include:

- Detailed Frequency Analysis (Sub, Bass, Mids, Highs)
- Stereo Field Analysis
- Dynamics Analysis
- Instrument-specific feedback
- Technical metrics: estimated LUFS, True Peak, Dynamic Range

Remember: Focus all recommendations on improving Mix B.
`;
};

/**
 * 5. Generate AI-assistant chat response (streaming)
 */
export const generateAIAssistantResponse = async (
  conversation: ChatMessage[],
  guidebook: GuidebookEntry
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

  const prompt = `You are TrackGuideAI, an expert music production assistant. You're helping a user with their current track project.

${contextInfo}

**Conversation History:**
${history}

**Your Role:**
- Provide specific, actionable music production advice
- Reference the current guidebook context when relevant
- Offer technical solutions and creative suggestions
- Ask clarifying questions when needed
- Maintain a helpful, professional tone

**Response Guidelines:**
- Be concise but thorough
- Include specific parameter suggestions when applicable
- Reference DAW-specific techniques when relevant
- Provide alternative approaches when possible

Respond as the helpful TrackGuideAI assistant.`;

  const stream = await ai.models.generateContentStream({
    model: GEMINI_MODEL_NAME,
    contents: prompt,
  });
  return stream;
};

/**
 * 6. Generate RemixGuide with full functionality (matches component expectations)
 */
export async function generateRemixGuide(
  audioData: { base64: string; mimeType: string },
  targetGenre: string,
  genreInfo: any,
  daw?: string,
  plugins?: string
): Promise<{
  guide: string;
  targetTempo: number;
  targetKey: string;
  sections: string[];
  originalKey?: string;
  originalTempo?: number;
  originalChordProgression?: string;
}> {
  if (!apiKey) {
    throw new Error("API Key not configured. Cannot connect to Gemini API for remix guide.");
  }

  try {
    const tempoRange = genreInfo?.tempoRange ? `${genreInfo.tempoRange[0]}-${genreInfo.tempoRange[1]} BPM` : "120-130 BPM";
    const sections = genreInfo?.sections || ["Intro", "Build-Up", "Drop", "Breakdown", "Outro"];
    
    const structuralBlueprint = buildStructuralBlueprint(true);
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

**CRITICAL: Return your response in this EXACT JSON format:**
{
  "guide": "FULL_MARKDOWN_GUIDE_HERE",
  "originalTempo": 120,
  "originalKey": "C minor",
  "originalChordProgression": "i-VI-III-VII",
  "targetTempo": 128,
  "targetKey": "C minor",
  "sections": ["Intro", "Build-Up", "Drop", "Breakdown", "Outro"]
}

**For the "guide" field, create a detailed markdown guide that includes:**

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
- **Target Key:** [Optimal key for ${targetGenre}]
- **Genre Adaptation:** [How to adapt original elements]

${structuralBlueprint}

## 🎹 Sound Design & Instrumentation Transformation
**Lead Elements:**
- **Original → ${targetGenre}:** Transform existing leads using specific techniques
- **New Elements:** Add characteristic ${targetGenre} sounds
- **Processing Chain:** Specific plugin recommendations and parameters

**Rhythm Section Redesign:**
- **Drum Programming:** ${targetGenre}-specific patterns and sounds
- **Bass Design:** Sub-bass content and mid-range presence for ${targetGenre}
- **Percussion:** Additional elements typical of ${targetGenre}

**Harmonic Content:**
- **Chord Voicings:** Adapt progressions for ${targetGenre} aesthetic
- **Pad Textures:** Atmospheric elements and spatial design
- **Arpeggios/Sequences:** Rhythmic harmonic content

${pluginSection}

## 🎚️ Production Techniques & Processing
**Arrangement Strategy:**
- **Section Transitions:** Build-ups, drops, and breakdowns for ${targetGenre}
- **Energy Management:** How to structure dynamics across sections
- **Original Element Integration:** Preserving vs transforming source material

**Mix Approach:**
- **Frequency Management:** EQ strategies for ${targetGenre} clarity
- **Spatial Design:** Stereo width and depth characteristics
- **Dynamic Processing:** Compression and limiting for ${targetGenre} impact

**Effects Processing:**
- **Time-Based Effects:** Reverb and delay for ${targetGenre} space
- **Modulation:** LFOs, filters, and movement
- **Creative Processing:** Distortion, bit-crushing, and character effects

## 🎼 Step-by-Step Remix Process
**Phase 1: Preparation**
1. Tempo adjustment: Specific technique for tempo change
2. Key transposition: If needed, method and tools
3. Audio editing: Chopping, slicing, and preparation

**Phase 2: Foundation**
1. Drum programming: ${targetGenre} patterns and sounds
2. Bass design: Sub and mid-bass for ${targetGenre}
3. Harmonic foundation: Chord progressions and voicings

**Phase 3: Development**
1. Lead transformation: Processing original or creating new
2. Atmospheric elements: Pads, textures, and ambience
3. Rhythmic elements: Percussion and groove enhancement

**Phase 4: Arrangement**
1. Section structure: Intro, build-ups, drops, breakdowns
2. Transition techniques: Risers, sweeps, and cuts
3. Variation strategies: Keeping listener engagement

**Phase 5: Mix & Master**
1. Frequency balance: ${targetGenre}-specific EQ approach
2. Dynamic control: Compression and limiting strategies
3. Spatial processing: Stereo width and depth
4. Final polish: Loudness and character enhancement

## 🔥 Pro Tips for ${targetGenre} Remix Success
- **Signature Elements:** Key characteristics that define ${targetGenre}
- **Common Pitfalls:** What to avoid when adapting to ${targetGenre}
- **Creative Opportunities:** Unique ways to blend original with ${targetGenre}
- **Reference Tracks:** Study these ${targetGenre} examples for inspiration

Focus on practical, actionable techniques that can be implemented immediately. Provide specific parameter suggestions and creative approaches that honor both the original track and the target genre aesthetic.

**IMPORTANT:** Return ONLY the JSON object with the complete markdown guide in the "guide" field. Focus on detailed analysis and production techniques.`;

    const textPart = { text: prompt };
    const audioPart = {
      inlineData: { data: audioData.base64, mimeType: audioData.mimeType },
    };

    const contents = [audioPart, textPart];

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: { parts: contents },
    });

    const responseText = response.text;
    if (typeof responseText !== 'string') {
      throw new Error("Received an unexpected response format from Gemini API for remix guide.");
    }

    // Parse the JSON response
    let jsonStr = responseText.trim();
    const fenceRegex = /^(\w*)?\s*\n?(.*?)\n?\s*$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse JSON response:", jsonStr);
      // Fallback: extract what we can from the text
      const tempoMatch = responseText.match(/Target Tempo.*?(\d+)/i);
      const keyMatch = responseText.match(/Target Key.*?([A-G][#b]?\s*(?:major|minor|maj|min)?)/i);
      
      return {
        guide: responseText,
        targetTempo: tempoMatch ? parseInt(tempoMatch[1]) : (genreInfo?.tempoRange?.[0] || 128),
        targetKey: keyMatch ? keyMatch[1].trim() : "C minor",
        sections,
        originalKey: "C minor",
        originalTempo: 120,
        originalChordProgression: "i-VI-III-VII"
      };
    }

    // Validate and structure the response
    const result = {
      guide: parsedResponse.guide || responseText,
      targetTempo: parsedResponse.targetTempo || (genreInfo?.tempoRange?.[0] || 128),
      targetKey: parsedResponse.targetKey || "C minor",
      sections: parsedResponse.sections || sections,
      originalKey: parsedResponse.originalKey || "C minor",
      originalTempo: parsedResponse.originalTempo || 120,
      originalChordProgression: parsedResponse.originalChordProgression || "i-VI-III-VII"
    };

    return result;

  } catch (error) {
    console.error("Error generating remix guide:", error);
    let specificMessage = "An unknown error occurred while generating remix guide.";
    if (error instanceof Error) {
      specificMessage = error.message;
      if (error.message.includes("API key not valid") || error.message.includes("permission")) {
        specificMessage = "Invalid API Key or insufficient permissions. Please check your API key configuration.";
      } else if (error.message.toLowerCase().includes("network error") || error.message.toLowerCase().includes("failed to fetch")) {
        specificMessage = `Network error: Failed to connect to Gemini API. Please check your internet connection. (${error.message})`;
      } else if (error.message.includes("Candidate was blocked")) {
        specificMessage = "The response for remix guide was blocked by the AI. This might be due to content policies. Please try again or adjust your input.";
      } else if (error.message.includes("audio")) {
        specificMessage = `There was an issue processing the audio file. Ensure it's a common format and not too large. (${error.message})`;
      }
    }
    throw new Error(specificMessage);
  }
}

/**
 * 7. Enhanced Mix Feedback with Audio File Support
 */
export const generateMixFeedbackWithAudio = async (
  inputs: MixFeedbackInputs
): Promise<string> => {
  if (!apiKey) {
    throw new Error("API Key not configured. Cannot connect to Gemini API for mix feedback.");
  }
  
  if (!inputs.audioFile) {
    return generateMixFeedback(inputs);
  }

  try {
    const fileToBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    };

    const audioBase64 = await fileToBase64(inputs.audioFile);

    const prompt = `
You are TrackGuideAI's Advanced Mix Analysis Expert. Analyze the uploaded audio and give professional mix feedback.

**Track:**
- Name: ${inputs.trackName || "Uploaded Mix"}
- Focus: ${inputs.focus || "Overall mix quality"}
- User Notes: ${inputs.notes || "None"}

**Analysis Sections:**

1️⃣ Frequency Spectrum (low, mid, high)
2️⃣ Stereo Image & Depth
3️⃣ Dynamics & Loudness
4️⃣ Technical Quality (distortion, phase, noise)
5️⃣ Immediate Fixes (top 3)
6️⃣ EQ Suggestions (with specific Hz ranges and dB values)
7️⃣ Compression (ratio, attack/release, plugin examples)
8️⃣ Effects (reverb, delay, creative)
9️⃣ Mastering Notes

**IMPORTANT:** Be specific! For every suggestion, include concrete plugin parameters (e.g., "Ratio 4:1, Attack 10ms, Release 80ms") and examples of common plugin types. Do NOT leave vague tips.

Also compare to genre standards and suggest any gaps to close.

Ready? Analyze the uploaded audio and begin!`;

    const textPart = { text: prompt };
    const audioPart = {
      inlineData: { 
        data: audioBase64, 
        mimeType: inputs.audioFile.type || "audio/mpeg" 
      },
    };

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: { parts: [audioPart, textPart] },
    });

    const feedbackText = response.text;
    if (typeof feedbackText !== 'string') {
      throw new Error("Invalid response from Gemini API for mix feedback.");
    }
    
    return feedbackText;

  } catch (error) {
    console.error("Error generating mix feedback with audio:", error);
    let message = "Unknown error generating mix feedback.";
    if (error instanceof Error) {
      message = error.message;
      if (error.message.includes("API key not valid") || error.message.includes("permission")) {
        message = "Invalid API Key or insufficient permissions.";
      } else if (error.message.includes("network") || error.message.includes("fetch")) {
        message = "Network error connecting to Gemini API.";
      } else if (error.message.includes("audio")) {
        message = "Problem processing the audio file.";
      }
    }
    throw new Error(message);
  }
};

/**
 * 8. Helper function for simple content generation
 */
export async function generateContent(prompt: string): Promise<string> {
  if (!apiKey) {
    throw new Error("API Key not configured. Cannot connect to Gemini API.");
  }

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: prompt,
    });
    
    const responseText = response.text;
    if (typeof responseText !== 'string') {
      throw new Error("Received an unexpected response format from Gemini API.");
    }
    
    return responseText;
  } catch (error) {
    console.error("Error generating content:", error);
    let specificMessage = "An unknown error occurred while generating content.";
    if (error instanceof Error) {
      specificMessage = error.message;
      if (error.message.includes("API key not valid") || error.message.includes("permission")) {
        specificMessage = "Invalid API Key or insufficient permissions. Please check your API key configuration.";
      } else if (error.message.toLowerCase().includes("network error") || error.message.toLowerCase().includes("failed to fetch")) {
        specificMessage = `Network error: Failed to connect to Gemini API. Please check your internet connection. (${error.message})`;
      }
    }
    throw new Error(specificMessage);
  }
}

/** * 9. Alternative AI Assistant Response (non-streaming for simple cases) */
export const generateAIAssistantResponseSimple = async (
  message: string,
  context?: {
    currentGuidebook?: GuidebookEntry;
    userInputs?: UserInputs;
    conversationHistory?: Message[];
    contextLabel?: string;
  }
): Promise<string> => {
  if (!apiKey) {
    throw new Error("API Key not configured. Cannot connect to Gemini API.");
  }

  try {
    const contextInfo = context ? `
**Current Project Context:**
${context.contextLabel ? `- Context: ${context.contextLabel}` : ''}
- Genre: ${context.userInputs?.genre?.join(", ") || context.currentGuidebook?.genre?.join(", ") || 'Not specified'}
- Vibe: ${context.userInputs?.vibe?.join(", ") || context.currentGuidebook?.vibe?.join(", ") || 'Not specified'}
- DAW: ${context.userInputs?.daw || context.currentGuidebook?.daw || 'Not specified'}
- Current guidebook: ${context.currentGuidebook?.title || 'None'}
` : '';

    // Format conversation history if available
    const historyText = context?.conversationHistory?.length ? 
      context.conversationHistory.map(msg => 
        `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
      ).join("\n\n") : '';

    const prompt = `You are TrackGuideAI, an expert music production assistant. Help the user with their music production question.

${contextInfo}

${historyText ? `**Recent Conversation:**\n${historyText}\n\n` : ''}

**User Question:** ${message}

**Your Response Guidelines:**
- Provide helpful, concise advice related to music production, mixing, sound design, or composition
- Keep responses practical and actionable
- Reference the project context when relevant
- Include specific parameter suggestions when applicable
- Maintain a professional but friendly tone
${context?.contextLabel ? '- If the user is asking about modifying a document, suggest specific changes and improvements' : ''}

Provide your expert guidance:`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: prompt,
    });

    const responseText = response.text;
    if (typeof responseText !== 'string') {
      throw new Error("Received an unexpected response format from Gemini API.");
    }
    
    return responseText;

  } catch (error) {
    console.error("Error generating AI assistant response:", error);
    let specificMessage = "An unknown error occurred while generating response.";
    if (error instanceof Error) {
      specificMessage = error.message;
      if (error.message.includes("API key not valid") || error.message.includes("permission")) {
        specificMessage = "Invalid API Key or insufficient permissions. Please check your API key configuration.";
      } else if (error.message.toLowerCase().includes("network error") || error.message.toLowerCase().includes("failed to fetch")) {
        specificMessage = `Network error: Failed to connect to Gemini API. Please check your internet connection. (${error.message})`;
      } else if (error.message.includes("Candidate was blocked")) {
        specificMessage = "The response was blocked by the AI. This might be due to content policies. Please try again or adjust your input.";
      }
    }
    throw new Error(specificMessage);
  }
}

/** * 10. Regenerate TrackGuide with modifications from chat */
export const regenerateTrackGuide = async (
  context: {
    userRequest: string;
    aiSuggestion: string;
    currentGuidebook?: GuidebookEntry;
    userInputs?: UserInputs;
  }
): Promise<string> => {
  if (!apiKey) {
    throw new Error("API Key not configured. Cannot connect to Gemini API.");
  }
  
  try {
    const { userRequest, aiSuggestion, currentGuidebook, userInputs } = context;
    
    // Extract current content
    const currentContent = currentGuidebook?.content || '';
    const songTitle = currentGuidebook?.title || userInputs?.title || 'Untitled Track';
    
    // Build prompt for regeneration
    const prompt = `You are TrackGuideAI, an expert music production assistant. 
You need to update an existing TrackGuide for "${songTitle}" based on the user's request.

**Current TrackGuide Content:**
${currentContent}

**User's Modification Request:**
${userRequest}

**Your Previous Suggestion:**
${aiSuggestion}

**Task:**
Generate a complete, updated version of the TrackGuide that incorporates the requested changes.
- Maintain the overall structure and formatting of the original TrackGuide
- Seamlessly integrate the new elements or changes
- Be specific and detailed in your additions
- Do not use placeholders or templates
- Include the entire TrackGuide in your response, not just the changes

Generate the complete updated TrackGuide:`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: prompt,
    });
    
    const responseText = response.text;
    if (typeof responseText !== 'string') {
      throw new Error("Received an unexpected response format from Gemini API.");
    }
    
    return responseText;
  } catch (error) {
    console.error("Error regenerating TrackGuide:", error);
    throw new Error(`Failed to update TrackGuide: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
};

/** * 11. Regenerate Mix Feedback with modifications from chat */
export const regenerateMixFeedback = async (
  context: {
    userRequest: string;
    aiSuggestion: string;
    currentGuidebook?: GuidebookEntry;
    userInputs?: UserInputs;
  }
): Promise<string> => {
  if (!apiKey) {
    throw new Error("API Key not configured. Cannot connect to Gemini API.");
  }
  
  try {
    const { userRequest, aiSuggestion, currentGuidebook, userInputs } = context;
    
    // Extract current content
    const currentContent = currentGuidebook?.content || '';
    const songTitle = currentGuidebook?.title || userInputs?.title || 'Untitled Track';
    
    // Build prompt for regeneration
    const prompt = `You are TrackGuideAI, an expert music production assistant. 
You need to update an existing Mix Feedback for "${songTitle}" based on the user's request.

**Current Mix Feedback Content:**
${currentContent}

**User's Modification Request:**
${userRequest}

**Your Previous Suggestion:**
${aiSuggestion}

**Task:**
Generate a complete, updated version of the Mix Feedback that incorporates the requested changes.
- Maintain the overall structure and formatting of the original feedback
- Seamlessly integrate the new elements or changes
- Be specific and detailed in your additions
- Do not use placeholders or templates
- Include the entire Mix Feedback in your response, not just the changes

Generate the complete updated Mix Feedback:`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: prompt,
    });
    
    const responseText = response.text;
    if (typeof responseText !== 'string') {
      throw new Error("Received an unexpected response format from Gemini API.");
    }
    
    return responseText;
  } catch (error) {
    console.error("Error regenerating Mix Feedback:", error);
    throw new Error(`Failed to update Mix Feedback: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
};

/** * 12. Regenerate Remix Guide with modifications from chat */
export const regenerateRemixGuide = async (
  context: {
    userRequest: string;
    aiSuggestion: string;
    currentGuidebook?: GuidebookEntry;
    userInputs?: UserInputs;
  }
): Promise<string> => {
  if (!apiKey) {
    throw new Error("API Key not configured. Cannot connect to Gemini API.");
  }
  
  try {
    const { userRequest, aiSuggestion, currentGuidebook, userInputs } = context;
    
    // Extract current content
    const currentContent = currentGuidebook?.content || '';
    const songTitle = currentGuidebook?.title || userInputs?.title || 'Untitled Track';
    
    // Build prompt for regeneration
    const prompt = `You are TrackGuideAI, an expert music production assistant. 
You need to update an existing Remix Guide for "${songTitle}" based on the user's request.

**Current Remix Guide Content:**
${currentContent}

**User's Modification Request:**
${userRequest}

**Your Previous Suggestion:**
${aiSuggestion}

**Task:**
Generate a complete, updated version of the Remix Guide that incorporates the requested changes.
- Maintain the overall structure and formatting of the original guide
- Seamlessly integrate the new elements or changes
- Be specific and detailed in your additions
- Do not use placeholders or templates
- Include the entire Remix Guide in your response, not just the changes

Generate the complete updated Remix Guide:`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: prompt,
    });
    
    const responseText = response.text;
    if (typeof responseText !== 'string') {
      throw new Error("Received an unexpected response format from Gemini API.");
    }
    
    return responseText;
  } catch (error) {
    console.error("Error regenerating Remix Guide:", error);
    throw new Error(`Failed to update Remix Guide: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
};

/** * 10. Regenerate Mix Comparison with modifications from chat */
export const regenerateMixCompare = async (
  context: {
    userRequest: string;
    aiSuggestion: string;
    currentGuidebook?: GuidebookEntry;
    userInputs?: UserInputs;
  }
): Promise<string> => {
  if (!apiKey) {
    throw new Error("API Key not configured. Cannot connect to Gemini API.");
  }
  
  try {
    const { userRequest, aiSuggestion, currentGuidebook, userInputs } = context;
    
    // Extract current content
    const currentContent = currentGuidebook?.content || '';
    const songTitle = currentGuidebook?.title || userInputs?.title || 'Untitled Track';
    
    // Build prompt for regeneration
    const prompt = `You are TrackGuideAI, an expert music production assistant. 
You need to update an existing Mix Comparison for "${songTitle}" based on the user's request.

**Current Mix Comparison Content:**
${currentContent}

**User's Modification Request:**
${userRequest}

**Your Previous Suggestion:**
${aiSuggestion}

**Task:**
Generate a complete, updated version of the Mix Comparison that incorporates the requested changes.
- Maintain the overall structure and formatting of the original comparison
- Seamlessly integrate the new elements or changes
- Be specific and detailed in your additions
- Do not use placeholders or templates
- Include the entire Mix Comparison in your response, not just the changes

Generate the complete updated Mix Comparison:`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: prompt,
    });
    
    const responseText = response.text;
    if (typeof responseText !== 'string') {
      throw new Error("Received an unexpected response format from Gemini API.");
    }
    
    return responseText;
  } catch (error) {
    console.error("Error regenerating Mix Comparison:", error);
    throw new Error(`Failed to update Mix Comparison: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
};
