// src/core/services/ImprovedGeminiService.ts

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GEMINI_MODEL_NAME } from "../../constants/constants";
import { AppError, ErrorType, createErrorHandler } from "../errors/AppError";
import { APIRetryService } from "./APIRetryService";
import { AIResponseValidator, GuidebookValidator, MidiPatternValidator, RemixGuideValidator } from "../validation/AIResponseValidator";
import { PromptTemplate, TRACK_GUIDE_TEMPLATE, MIDI_GENERATION_TEMPLATE, MIX_FEEDBACK_TEMPLATE } from "../templates/PromptTemplateEngine";
import { UserInputs, MidiSettings, GuidebookEntry, GeneratedMidiPatterns, MixFeedbackInputs, MixComparisonInputs, ChatMessage } from "../../constants/types";
import { getDawMetadata } from "../../constants/dawMetadata";

// Enhanced Gemini service with improved error handling, validation, and templates
export class ImprovedGeminiService {
  private static instance: ImprovedGeminiService;
  private ai: GoogleGenAI;
  private apiKey: string;

  private constructor() {
    this.apiKey = 
      process.env.API_KEY ||
      process.env.GEMINI_API_KEY ||
      (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY);

    if (!this.apiKey) {
      throw new AppError(
        ErrorType.API_KEY_INVALID,
        "API key not configured",
        "API key not configured. Please set your Gemini API key in environment variables.",
        false,
        { service: 'ImprovedGeminiService', operation: 'constructor' }
      );
    }

    this.ai = new GoogleGenAI({ apiKey: this.apiKey });
  }

  static getInstance(): ImprovedGeminiService {
    if (!this.instance) {
      this.instance = new ImprovedGeminiService();
    }
    return this.instance;
  }

  /**
   * Generate TrackGuide with improved error handling and validation
   */
  async generateTrackGuide(inputs: UserInputs): Promise<GuidebookEntry> {
    const context = {
      service: 'ImprovedGeminiService',
      operation: 'generateTrackGuide',
      component: 'TrackGuide'
    };

    return APIRetryService.executeWithRetry(async () => {
      // Prepare template context
      const templateContext = {
        genre: inputs.genre,
        vibe: inputs.vibe,
        daw: inputs.daw,
        key: inputs.key,
        artistReference: inputs.artistReference,
        referenceTrackLink: inputs.referenceTrackLink,
        generalNotes: inputs.generalNotes,
        scale: inputs.scale,
        chords: inputs.chords,
        availableInstruments: inputs.availableInstruments,
        plugins: inputs.plugins,
        lyrics: inputs.lyrics
      };

      // Generate prompt using template
      const prompt = TRACK_GUIDE_TEMPLATE.render(templateContext);

      // Make API call with rate limiting
      const response = await APIRetryService.withRateLimit(
        () => this.ai.models.generateContent({
          model: GEMINI_MODEL_NAME,
          contents: prompt,
        }),
        'trackGuide',
        30 // 30 calls per minute
      );

      const responseText = response.text;
      if (!responseText || typeof responseText !== 'string') {
        throw new AppError(
          ErrorType.INVALID_JSON_RESPONSE,
          "Empty or invalid response from AI",
          "AI service returned an empty response. Please try again.",
          true,
          context
        );
      }

      // Create guidebook entry
      const guidebookEntry: GuidebookEntry = {
        id: `guidebook-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: this.extractTitle(responseText, inputs),
        genre: inputs.genre,
        artistReference: inputs.artistReference || '',
        referenceTrackLink: inputs.referenceTrackLink,
        lyrics: inputs.lyrics,
        key: inputs.key,
        scale: inputs.scale,
        chords: inputs.chords,
        generalNotes: inputs.generalNotes,
        vibe: inputs.vibe,
        daw: inputs.daw,
        plugins: inputs.plugins || '',
        availableInstruments: inputs.availableInstruments || '',
        content: responseText,
        createdAt: new Date().toISOString()
      };

      // Validate the response
      const validation = GuidebookValidator.validate(guidebookEntry);
      if (!validation.isValid) {
        throw new AppError(
          ErrorType.VALIDATION_FAILED,
          `Guidebook validation failed: ${validation.errors.map(e => e.message).join(', ')}`,
          "Generated guidebook doesn't meet quality standards. Please try again.",
          true,
          context
        );
      }

      return guidebookEntry;
    }, context);
  }

  /**
   * Generate MIDI patterns with improved validation
   */
  async generateMidiPatterns(settings: MidiSettings): Promise<GeneratedMidiPatterns> {
    const context = {
      service: 'ImprovedGeminiService',
      operation: 'generateMidiPatterns',
      component: 'MidiGenerator'
    };

    return APIRetryService.executeWithRetry(async () => {
      // Prepare template context
      const templateContext = {
        key: settings.key,
        scale: settings.scale,
        tempo: settings.tempo,
        timeSignature: settings.timeSignature.join('/'),
        chordProgression: settings.chordProgression,
        genre: settings.genre,
        songSection: settings.songSection,
        bars: settings.bars,
        targetInstruments: settings.targetInstruments,
        maxBeats: settings.bars * settings.timeSignature[0],
        guidebookContext: settings.guidebookContext
      };

      const prompt = MIDI_GENERATION_TEMPLATE.render(templateContext);

      // Use streaming for better response handling
      const stream = await this.ai.models.generateContentStream({
        model: GEMINI_MODEL_NAME,
        contents: prompt,
      });

      let fullResponse = '';
      for await (const chunk of stream) {
        fullResponse += chunk.text || '';
      }

      if (!fullResponse.trim()) {
        throw new AppError(
          ErrorType.INVALID_JSON_RESPONSE,
          "Empty response from MIDI generation",
          "AI service returned an empty MIDI response. Please try again.",
          true,
          context
        );
      }

      // Parse JSON response
      const jsonResponse = this.parseJsonResponse(fullResponse, 'MIDI patterns');
      
      // Validate MIDI patterns
      const validation = MidiPatternValidator.validate(jsonResponse);
      if (!validation.isValid) {
        throw new AppError(
          ErrorType.VALIDATION_FAILED,
          `MIDI pattern validation failed: ${validation.errors.map(e => e.message).join(', ')}`,
          "Generated MIDI patterns are invalid. Please try again.",
          true,
          context
        );
      }

      return validation.data!;
    }, context);
  }

  /**
   * Generate mix feedback with audio file support
   */
  async generateMixFeedback(inputs: MixFeedbackInputs): Promise<string> {
    const context = {
      service: 'ImprovedGeminiService',
      operation: 'generateMixFeedback',
      component: 'MixFeedback'
    };

    return APIRetryService.executeWithRetry(async () => {
      const templateContext = {
        trackName: inputs.trackName,
        focus: inputs.focus,
        userNotes: inputs.userNotes || inputs.notes,
        dawName: inputs.dawName
      };

      const prompt = MIX_FEEDBACK_TEMPLATE.render(templateContext);

      // Prepare content parts
      const parts: any[] = [{ text: prompt }];

      // Add audio file if provided
      if (inputs.audioFile) {
        const audioData = await this.processAudioFile(inputs.audioFile);
        parts.push({
          inlineData: {
            data: audioData.base64,
            mimeType: audioData.mimeType
          }
        });
      }

      const response = await APIRetryService.withRateLimit(
        () => this.ai.models.generateContent({
          model: GEMINI_MODEL_NAME,
          contents: { parts },
        }),
        'mixFeedback',
        20 // 20 calls per minute for audio processing
      );

      const responseText = response.text;
      if (!responseText || typeof responseText !== 'string') {
        throw new AppError(
          ErrorType.INVALID_JSON_RESPONSE,
          "Empty or invalid mix feedback response",
          "AI service returned an empty mix feedback. Please try again.",
          true,
          context
        );
      }

      return responseText;
    }, context);
  }

  /**
   * Streaming version of generateTrackGuide
   */
  async* generateTrackGuideStream(inputs: UserInputs): AsyncGenerator<{ text: string }, void, unknown> {
    const context = {
      service: 'ImprovedGeminiService',
      operation: 'generateTrackGuideStream',
      component: 'TrackGuide'
    };

    const templateContext = {
      genre: inputs.genre,
      vibe: inputs.vibe,
      daw: inputs.daw,
      key: inputs.key,
      artistReference: inputs.artistReference,
      referenceTrackLink: inputs.referenceTrackLink,
      generalNotes: inputs.generalNotes,
      scale: inputs.scale,
      chords: inputs.chords,
      availableInstruments: inputs.availableInstruments,
      plugins: inputs.plugins,
      lyrics: inputs.lyrics
    };

    const prompt = TRACK_GUIDE_TEMPLATE.render(templateContext);

    try {
      const stream = await this.ai.models.generateContentStream({
        model: GEMINI_MODEL_NAME,
        contents: prompt,
      });

      for await (const chunk of stream) {
        if (chunk.text) {
          yield { text: chunk.text };
        }
      }
    } catch (error) {
      const errorHandler = createErrorHandler(context);
      throw errorHandler(error);
    }
  }

  /**
   * Generate RemixGuide with streaming response
   */
  async* generateRemixGuideStream(
    audioData: { base64: string; mimeType: string },
    targetGenre: string,
    genreInfo: any,
    daw?: string,
    plugins?: string
  ): AsyncGenerator<{ text: string; metadata?: any }, void, unknown> {
    const context = {
      service: 'ImprovedGeminiService',
      operation: 'generateRemixGuideStream',
      component: 'RemixGuide'
    };

    try {
      // Prepare template context
      const templateContext = {
        targetGenre: targetGenre,
        tempoRange: genreInfo?.tempoRange ? `${genreInfo.tempoRange[0]}-${genreInfo.tempoRange[1]} BPM` : "120-130 BPM",
        sections: genreInfo?.sections || ["Intro", "Build-Up", "Drop", "Breakdown", "Outro"],
        drumPatterns: genreInfo?.drumPatterns || '',
        daw: daw || "Not specified",
        plugins: plugins || "Stock/Generic plugins"
      };
      
      // Create dynamic prompt from template
      // This would come from a template in PromptTemplateEngine.ts in a full implementation
      const prompt = `You are TrackGuideAI's Remix Specialist. Analyze the uploaded audio track and create a comprehensive remix guide for transforming it into ${targetGenre} style.

**User Production Setup:**
- **DAW:** ${templateContext.daw}
- **Available Plugins:** ${templateContext.plugins}

**Analysis Requirements:**
1. Identify the original track's tempo, key, harmonic progression, and rhythmic characteristics
2. Determine optimal transformation approach for ${targetGenre}
3. Provide detailed production guidance with specific techniques
4. Include plugin-specific parameter recommendations based on user's setup

**Target Genre:** ${targetGenre}
**Target Tempo Range:** ${templateContext.tempoRange}
**Suggested Sections:** ${templateContext.sections.join(", ")}
${templateContext.drumPatterns ? `**Typical Drum Patterns:** ${templateContext.drumPatterns}` : ''}

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
- **Target Tempo:** [Recommended BPM within ${templateContext.tempoRange}]
- **Target Key:** [Optimal key for ${targetGenre}]
- **Genre Adaptation:** [How to adapt original elements]

## 🎹 Sound Design & Instrumentation Transformation
**Lead Elements:**
- **Original → ${targetGenre}:** Transform existing leads using specific techniques
- **New Elements:** Add characteristic ${targetGenre} sounds
- **Processing Chain:** Specific plugin recommendations and parameters

**Rhythm Section Redesign:**
- **Drum Programming:** ${targetGenre}-specific patterns and sounds
- **Bass Design:** Transform or replace bass elements
- **Percussion Layers:** Add characteristic ${targetGenre} percussion

## 🔊 Mixing & Processing Techniques
**Signal Chain Recommendations:**
- EQ, compression, and spatial effects for ${targetGenre}
- Creative processing techniques
- Mastering approach

## 🎯 Arrangement & Structure
**Section-by-Section Breakdown:**
${templateContext.sections.map((section: string) => `
**${section}:**
- Elements to include/exclude
- Energy level and dynamics
- Transition techniques
`).join('')}

**Dynamic Build Strategy:**
- How to create tension and release
- Filter sweeps and automation
- Risers and impacts placement

## 💡 Creative Production Tips
- Unconventional ${targetGenre} techniques
- Experimental processing ideas
- Sample manipulation suggestions
- Layering strategies for depth`;

      // Make API call
      const response = await this.ai.models.generateContentStream({
        model: GEMINI_MODEL_NAME,
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: audioData.mimeType,
                  data: audioData.base64
                }
              }
            ]
          }
        ]
      });

      let fullText = '';
      for await (const chunk of response) {
        const text = chunk.text;
        if (text) {
          fullText += text;
          yield { text };
        }
      }

      // Extract metadata from the generated content
      const metadata = this.extractRemixMetadata(fullText);
      
      // Validate the guide
      const validation = RemixGuideValidator.validate({
        guide: fullText,
        targetTempo: metadata.targetTempo,
        targetKey: metadata.targetKey,
        sections: metadata.sections || templateContext.sections,
        originalKey: metadata.originalKey,
        originalTempo: metadata.originalTempo,
        originalChordProgression: metadata.originalChordProgression
      });
      
      if (!validation.isValid) {
        console.warn('RemixGuide validation warning:', validation.errors);
      }
      
      yield { text: '', metadata };

    } catch (error) {
      const errorHandler = createErrorHandler(context);
      const appError = errorHandler(error);
      console.error('Error generating remix guide stream:', appError);
      throw appError;
    }
  }

  /**
   * Generate RemixGuide with full response
   */
  async generateRemixGuide(
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
    const context = {
      service: 'ImprovedGeminiService',
      operation: 'generateRemixGuide',
      component: 'RemixGuide'
    };

    return APIRetryService.executeWithRetry(async () => {
      // Collect all text chunks
      let fullText = '';
      let metadata: any = {};
      
      // Use the streaming version and collect all data
      const stream = this.generateRemixGuideStream(
        audioData,
        targetGenre,
        genreInfo,
        daw,
        plugins
      );
      
      for await (const chunk of stream) {
        if (chunk.text) {
          fullText += chunk.text;
        }
        if (chunk.metadata) {
          metadata = chunk.metadata;
        }
      }
      
      // Ensure we have valid metadata
      if (!metadata.targetTempo) {
        metadata.targetTempo = genreInfo?.tempoRange?.[0] || 128;
      }
      
      if (!metadata.targetKey) {
        metadata.targetKey = "C minor";
      }
      
      if (!metadata.sections || !metadata.sections.length) {
        metadata.sections = genreInfo?.sections || ["Intro", "Build-Up", "Drop", "Breakdown", "Outro"];
      }
      
      // Structure the response
      const result = {
        guide: fullText,
        targetTempo: metadata.targetTempo,
        targetKey: metadata.targetKey,
        sections: metadata.sections,
        originalKey: metadata.originalKey || "C minor",
        originalTempo: metadata.originalTempo || 120,
        originalChordProgression: metadata.originalChordProgression || "i-VI-III-VII"
      };

      return result;
    }, context);
  }

  /**
   * Extract metadata from remix guide content
   */
  private extractRemixMetadata(content: string): any {
    const metadata: any = {};
    
    // Extract tempo information
    const originalTempoMatch = content.match(/Original Tempo:\s*(\d+)/i);
    if (originalTempoMatch) {
      metadata.originalTempo = parseInt(originalTempoMatch[1]);
    }
    
    const targetTempoMatch = content.match(/Target Tempo:\s*(\d+)/i);
    if (targetTempoMatch) {
      metadata.targetTempo = parseInt(targetTempoMatch[1]);
    }
    
    // Extract key information
    const originalKeyMatch = content.match(/Original Key:\s*([A-G][#b]?\s*(?:major|minor|maj|min))/i);
    if (originalKeyMatch) {
      metadata.originalKey = originalKeyMatch[1];
    }
    
    const targetKeyMatch = content.match(/Target Key:\s*([A-G][#b]?\s*(?:major|minor|maj|min))/i);
    if (targetKeyMatch) {
      metadata.targetKey = targetKeyMatch[1];
    }
    
    // Extract chord progression
    const chordProgMatch = content.match(/Harmonic Blueprint:\s*([IVXivx\d\s\-,]+)/i);
    if (chordProgMatch) {
      metadata.originalChordProgression = chordProgMatch[1].trim();
    }
    
    // Extract sections
    const sectionHeaders = Array.from(content.matchAll(/^###?\s+(.+?):/gm)).map(match => match[1].trim());
    if (sectionHeaders.length > 0) {
      // Filter out non-section headers that might be caught
      const validSectionTypes = ['intro', 'verse', 'chorus', 'build', 'drop', 'breakdown', 'bridge', 'outro'];
      metadata.sections = sectionHeaders.filter(header => 
        validSectionTypes.some(type => header.toLowerCase().includes(type))
      );
    }
    
    return metadata;
  }

  // Helper methods
  private extractTitle(content: string, inputs: UserInputs): string {
    // Try to extract title from the first heading
    const titleMatch = content.match(/^#\s+(.+)$/m);
    if (titleMatch) {
      return titleMatch[1].trim();
    }

    // Generate title from inputs
    const genreText = inputs.genre.join(' & ');
    const vibeText = inputs.vibe.length > 0 ? ` (${inputs.vibe.join(', ')})` : '';
    const referenceText = inputs.artistReference ? ` - ${inputs.artistReference} Style` : '';
    
    return `${genreText}${vibeText}${referenceText}`;
  }

  private parseJsonResponse(response: string, context: string): any {
    let jsonStr = response.trim();

    // Remove markdown code blocks
    const codeBlockPatterns = [
      /^```json\s*\n?(.*?)\n?\s*```$/s,
      /^```\s*\n?(.*?)\n?\s*```$/s
    ];

    for (const pattern of codeBlockPatterns) {
      const match = jsonStr.match(pattern);
      if (match) {
        jsonStr = match[1].trim();
        break;
      }
    }

    // Clean up any remaining artifacts
    jsonStr = jsonStr
      .replace(/^`+/g, '')
      .replace(/`+$/g, '')
      .replace(/^json\s*/i, '')
      .trim();

    // Validate JSON structure
    if (!jsonStr.startsWith('{') || !jsonStr.endsWith('}')) {
      throw new AppError(
        ErrorType.INVALID_JSON_RESPONSE,
        `Invalid JSON structure for ${context}`,
        "AI returned invalid JSON format. Please try again.",
        true
      );
    }

    try {
      return JSON.parse(jsonStr);
    } catch (parseError) {
      throw new AppError(
        ErrorType.INVALID_JSON_RESPONSE,
        `JSON parsing failed for ${context}: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
        "AI returned malformed JSON. Please try again.",
        true
      );
    }
  }

  private async processAudioFile(file: File): Promise<{ base64: string; mimeType: string }> {
    // Validate file size
    if (file.size > 100 * 1024 * 1024) { // 100MB limit
      throw new AppError(
        ErrorType.AUDIO_FILE_TOO_LARGE,
        `Audio file too large: ${file.size} bytes`,
        "Audio file is too large. Please use a file under 100MB.",
        false
      );
    }

    // Validate file type
    const validTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3'];
    const isValidType = validTypes.includes(file.type) ||
      file.name.toLowerCase().endsWith('.wav') ||
      file.name.toLowerCase().endsWith('.mp3');

    if (!isValidType) {
      throw new AppError(
        ErrorType.AUDIO_FORMAT_INVALID,
        `Invalid audio format: ${file.type}`,
        "Invalid audio format. Please use WAV or MP3 files only.",
        false
      );
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        if (reader.result && typeof reader.result === 'string') {
          const parts = reader.result.split(',');
          const base64Data = parts[1];
          const mimeTypeMatch = parts[0].match(/data:(.*);base64/);
          const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : file.type || 'audio/mpeg';
          
          resolve({ base64: base64Data, mimeType });
        } else {
          reject(new AppError(
            ErrorType.AUDIO_PROCESSING_FAILED,
            "Failed to read audio file",
            "Could not process the audio file. Please try again.",
            false
          ));
        }
      };
      
      reader.onerror = () => reject(new AppError(
        ErrorType.AUDIO_PROCESSING_FAILED,
        "File reading failed",
        "Could not read the audio file. Please try again.",
        false
      ));
      
      reader.readAsDataURL(file);
    });
  }

  /**
   * Generate song framework from reference track
   */
  async generateSongFramework(
    audioData?: { base64: string; mimeType: string },
    genre?: string,
    vibe?: string[],
    instruments?: string[],
    isStandalone: boolean = true,
    referenceTrackUrl?: string
  ): Promise<string> {
    const context = {
      service: 'ImprovedGeminiService',
      operation: 'generateSongFramework',
      component: 'SongFramework'
    };

    return APIRetryService.executeWithRetry(async () => {
      // Check that we have either audio data or a URL
      if (!audioData && !referenceTrackUrl) {
        throw new AppError(
          ErrorType.INVALID_INPUT,
          "Missing required input for song framework generation",
          "Either audio data or a reference track URL must be provided",
          false,
          context
        );
      }

      const genreText = genre || "Not specified";
      const vibeText = vibe?.join(", ") || "Not specified";
      const instrumentsText = instruments?.join(", ") || "Not specified";

      // Create prompt for framework analysis
      const prompt = `You are TrackGuideAI, an expert music production assistant with advanced audio analysis capabilities.

TASK: ${audioData 
    ? "Analyze the provided audio file" 
    : `Analyze the reference track from this URL: ${referenceTrackUrl}`} 
  and generate a detailed song arrangement framework in JSON format that closely matches the structure, instrumentation, and arrangement of the reference track.

AUDIO ANALYSIS INSTRUCTIONS:
1. Listen carefully to the entire audio file
2. Identify and extract the following elements:
   - Tempo (BPM)
   - Key signature
   - Time signature
   - Overall song structure (intro, verse, chorus, etc.)
   - Instrument/sound entries and exits
   - Energy dynamics and transitions
   - Density of arrangement in different sections
   - Recurring patterns and motifs
   - Breakdown and build-up sections

3. Pay special attention to:
   - Drum patterns and variations
   - Bass line presence and activity
   - Lead instrument/vocal sections
   - Background elements (pads, atmospheres)
   - Transition effects and techniques
   - Dynamic range between sections
   - Instrument layering in each section

JSON OUTPUT REQUIREMENTS:
1. Define the song structure as an array called "sections", where each section is an object with:
   - "name": the section name (e.g., "Intro", "Verse 1", "Chorus", "Breakdown", "Outro")
   - "bars": the number of bars/measures in that section (integer)

2. Define the "instruments" array listing all key instruments/elements tracked in the arrangement.
   - Extract these directly from what you hear in the audio
   - Include key elements like: Drums, Bass, Lead, Vocals, Synths, etc.
   - Use appropriate naming for the genre detected

3. Define a "matrix" which is a 2D array:
   - Each element of "matrix" corresponds to one instrument's timeline
   - The timeline is the concatenation of all bars across all sections in order
   - Each value in the timeline is either 1 (instrument plays in that bar) or 0 (instrument silent in that bar)
   - Accurately reflect the actual arrangement from the audio file

4. Ensure the "matrix" matches the total number of bars summed across all sections.

5. CRITICAL: Base the structure, instruments, and matrix directly on your analysis of the audio file, not on generic templates.

ADDITIONAL CONTEXT (Use if provided, otherwise base on audio analysis):
- Genre: ${genreText}
- Vibe: ${vibeText}
- Available instruments: ${instrumentsText}

IMPORTANT: The JSON output must be valid and parsable, with no extra text or explanation. Return ONLY the JSON object.`;

      // Prepare parts for the API call
      const parts: any[] = [{ text: prompt }];
      
      // Add audio data if available
      if (audioData) {
        parts.push({
          inlineData: {
            mimeType: audioData.mimeType,
            data: audioData.base64,
          },
        });
      }
      
      // Rate limit to avoid excessive API calls for large audio files
      const response = await APIRetryService.withRateLimit(
        () => this.ai.models.generateContent({
          model: GEMINI_MODEL_NAME,
          contents: [
            {
              role: 'user',
              parts,
            },
          ],
        }),
        'songFramework',
        15 // 15 calls per minute for audio analysis
      );

      let result = response.text || "";
      
      // Process and validate JSON response
      try {
        // Try to extract JSON if the model wrapped it in markdown code blocks
        const jsonMatch = result.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          result = jsonMatch[1];
        }
        
        // Clean up any comments in the JSON (like the matrix comments)
        result = result.replace(/\/\/.*$/gm, '');
        
        // Validate that the result is proper JSON by parsing and re-stringifying
        const parsed = JSON.parse(result);
        
        // Simple validation
        if (!parsed.sections || !Array.isArray(parsed.sections)) {
          throw new AppError(
            ErrorType.VALIDATION_FAILED,
            "Missing required 'sections' array in framework JSON",
            "The generated framework is missing the song sections. Please try again.",
            true,
            context
          );
        }
        
        if (!parsed.instruments || !Array.isArray(parsed.instruments)) {
          throw new AppError(
            ErrorType.VALIDATION_FAILED,
            "Missing required 'instruments' array in framework JSON",
            "The generated framework is missing the instruments list. Please try again.",
            true,
            context
          );
        }
        
        if (!parsed.matrix || !Array.isArray(parsed.matrix)) {
          throw new AppError(
            ErrorType.VALIDATION_FAILED,
            "Missing required 'matrix' array in framework JSON",
            "The generated framework is missing the arrangement matrix. Please try again.",
            true,
            context
          );
        }
        
        result = JSON.stringify(parsed);
        return result;
        
      } catch (jsonError) {
        console.error("AI returned invalid JSON for song framework:", jsonError);
        throw new AppError(
          ErrorType.INVALID_JSON_RESPONSE,
          `Invalid JSON for song framework: ${jsonError instanceof Error ? jsonError.message : 'Unknown error'}`,
          "The AI returned an invalid song framework format. Please try again.",
          true,
          context
        );
      }
    }, context);
  }

  /**
   * Generate AI Assistant response (streaming)
   */
  async* generateAIAssistantResponseStream(
    conversation: ChatMessage[],
    guidebook: GuidebookEntry,
    additionalContext?: {
      remixGuideContent?: string;
      mixFeedbackContent?: string;
      mixComparisonContent?: string;
      patchGuideContent?: string;
      activeView?: string;
    }
  ): AsyncGenerator<{ text: string }, void, unknown> {
    const context = {
      service: 'ImprovedGeminiService',
      operation: 'generateAIAssistantResponseStream',
      component: 'AIAssistant'
    };

    try {
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

      // Use rate limiting for chat to avoid abuse
      const stream = await APIRetryService.withRateLimit(
        () => this.ai.models.generateContentStream({
          model: GEMINI_MODEL_NAME,
          contents: prompt,
        }),
        'aiAssistant',
        60 // 60 calls per minute for chat
      );

      for await (const chunk of stream) {
        if (chunk.text) {
          yield { text: chunk.text };
        }
      }
    } catch (error) {
      const errorHandler = createErrorHandler(context);
      throw errorHandler(error);
    }
  }

  /**
   * Simple AI Assistant response (non-streaming)
   */
  async generateAIAssistantResponseSimple(
    message: string,
    context?: {
      currentGuidebook?: GuidebookEntry;
      userInputs?: UserInputs;
    }
  ): Promise<string> {
    const operationContext = {
      service: 'ImprovedGeminiService',
      operation: 'generateAIAssistantResponseSimple',
      component: 'AIAssistant'
    };

    return APIRetryService.executeWithRetry(async () => {
      const contextInfo = context ? `
**Current Project Context:**
- Genre: ${context.userInputs?.genre?.join(", ") || context.currentGuidebook?.genre?.join(", ") || 'Not specified'}
- Vibe: ${context.userInputs?.vibe?.join(", ") || context.currentGuidebook?.vibe?.join(", ") || 'Not specified'}
- DAW: ${context.userInputs?.daw || context.currentGuidebook?.daw || 'Not specified'}
- Current guidebook: ${context.currentGuidebook?.title || 'None'}
` : '';

      const prompt = `You are TrackGuideAI, an expert music production assistant. Help the user with their music production question.

${contextInfo}

**User Question:** ${message}

**Your Response Guidelines:**
- Provide helpful, concise advice related to music production, mixing, sound design, or composition
- Keep responses practical and actionable
- Reference the project context when relevant
- Include specific parameter suggestions when applicable
- Maintain a professional but friendly tone

Provide your expert guidance:`;

      const response = await APIRetryService.withRateLimit(
        () => this.ai.models.generateContent({
          model: GEMINI_MODEL_NAME,
          contents: prompt,
        }),
        'aiAssistant',
        60 // 60 calls per minute for chat
      );

      const responseText = response.text;
      if (!responseText || typeof responseText !== 'string') {
        throw new AppError(
          ErrorType.INVALID_JSON_RESPONSE,
          "Empty or invalid AI assistant response",
          "AI service returned an empty response. Please try again.",
          true,
          operationContext
        );
      }
      
      return responseText;
    }, operationContext);
  }

  /**
   * Generate Mix Comparison with audio files support
   */
  async* generateMixComparisonStream(
    inputs: MixComparisonInputs
  ): AsyncGenerator<{ text: string }, void, unknown> {
    const context = {
      service: 'ImprovedGeminiService',
      operation: 'generateMixComparisonStream',
      component: 'MixComparison'
    };

    try {
      const { dawName, mixAName, mixBName, userNotes, mixAFile, mixBFile } = inputs;
      
      // Include DAW-specific recommendations if a DAW is selected
      let dawSpecificAdvice = '';
      if (dawName) {
        const daw = getDawMetadata(dawName);
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
You are an expert mixing & mastering AI. The user has uploaded two mixes for comparison analysis.

Mix A: "${mixAName}" — an earlier version  
Mix B: "${mixBName}" — the current working version  

🎧 Instructions:
- Mix B is the active version — focus all actionable feedback on improving Mix B.
- Mix A is an earlier version — if Mix A has strengths vs Mix B, point those out.
- Acknowledge improvements made in Mix B compared to A.
- Do NOT suggest changes to Mix A (it is not being revised).

User Notes: ${userNotes || "No specific notes provided"}

Analyze both audio files and provide your comparison in clear Markdown format with the following sections:

## 🎧 Overall Comparison

## 🎛️ Frequency Balance

## 🎚️ Stereo Image & Depth

## 📈 Dynamics & Loudness

## ⚙️ Technical Quality

## 🏆 Strengths & Opportunities (for Mix B)

## 🚀 Actionable Recommendations (for Mix B only)
${dawSpecificAdvice}
`;

      // Create audio parts for both files
      const mixATextPart = { text: `Mix A Audio (Earlier Version): "${mixAName}"` };
      const mixBTextPart = { text: `Mix B Audio (Current Version): "${mixBName}"` };
      
      // Ensure we have audio files
      if (!mixAFile || !mixBFile) {
        throw new AppError(
          ErrorType.INVALID_INPUT,
          "Missing required audio files for mix comparison",
          "Both mix files must be provided for comparison",
          false,
          context
        );
      }

      // Get audio data for both files
      let mixABase64: string;
      let mixAMimeType: string;
      
      if (typeof mixAFile === 'string') {
        // String input assumed to be base64
        mixABase64 = mixAFile;
        mixAMimeType = "audio/mpeg"; // Default MIME type
      } else {
        // Process file object
        const mixAData = await this.processAudioFile(mixAFile as any);
        mixABase64 = mixAData.base64;
        mixAMimeType = mixAData.mimeType;
      }

      let mixBBase64: string;
      let mixBMimeType: string;
      
      if (typeof mixBFile === 'string') {
        mixBBase64 = mixBFile;
        mixBMimeType = "audio/mpeg";
      } else {
        const mixBData = await this.processAudioFile(mixBFile as any);
        mixBBase64 = mixBData.base64;
        mixBMimeType = mixBData.mimeType;
      }

      // Create parts for API call
      const mixABase64Part = {
        inlineData: {
          data: mixABase64,
          mimeType: mixAMimeType
        }
      };
      
      const mixBBase64Part = {
        inlineData: {
          data: mixBBase64,
          mimeType: mixBMimeType
        }
      };

      const promptPart = { text: prompt };
      const parts = [mixABase64Part, mixATextPart, mixBBase64Part, mixBTextPart, promptPart];

      // Rate limit API calls since this involves processing multiple audio files
      const stream = await APIRetryService.withRateLimit(
        () => this.ai.models.generateContentStream({
          model: GEMINI_MODEL_NAME,
          contents: { parts },
        }),
        'mixComparison',
        15 // 15 calls per minute for mix comparison (2 audio files)
      );

      for await (const chunk of stream) {
        if (chunk.text) {
          yield { text: chunk.text };
        }
      }
    } catch (error) {
      const errorHandler = createErrorHandler(context);
      throw errorHandler(error);
    }
  }

  /**
   * Generate Mix Comparison as a complete response
   */
  async generateMixComparison(
    inputs: MixComparisonInputs
  ): Promise<string> {
    const context = {
      service: 'ImprovedGeminiService',
      operation: 'generateMixComparison',
      component: 'MixComparison'
    };

    return APIRetryService.executeWithRetry(async () => {
      // Collect all text chunks
      let fullText = '';
      
      // Use the streaming version and collect all data
      const stream = this.generateMixComparisonStream(inputs);
      
      for await (const chunk of stream) {
        if (chunk.text) {
          fullText += chunk.text;
        }
      }
      
      if (!fullText.trim()) {
        throw new AppError(
          ErrorType.INVALID_JSON_RESPONSE,
          "Empty response from Mix Comparison",
          "AI service returned an empty Mix Comparison response. Please try again.",
          true,
          context
        );
      }
      
      return fullText;
    }, context);
  }
}
