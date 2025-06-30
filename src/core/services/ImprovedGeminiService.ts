// src/core/services/ImprovedGeminiService.ts

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GEMINI_MODEL_NAME } from "../../constants/constants";
import { AppError, ErrorType, createErrorHandler } from "../errors/AppError";
import { APIRetryService } from "./APIRetryService";
import { AIResponseValidator, GuidebookValidator, MidiPatternValidator, RemixGuideValidator } from "../validation/AIResponseValidator";
import { PromptTemplate, TRACK_GUIDE_TEMPLATE, MIDI_GENERATION_TEMPLATE, MIX_FEEDBACK_TEMPLATE } from "../templates/PromptTemplateEngine";
import { UserInputs, MidiSettings, GuidebookEntry, GeneratedMidiPatterns, MixFeedbackInputs } from "../../constants/types";

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
}
