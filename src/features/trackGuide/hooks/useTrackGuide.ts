// src/features/trackGuide/hooks/useTrackGuide.ts

import { useState, useCallback } from 'react';
import { UserInputs, GuidebookEntry } from '../../../constants/types';
import { ImprovedGeminiService } from '../../../core/services/ImprovedGeminiService';
import { AppError } from '../../../core/errors/AppError';
import { useLoadingAndErrors } from '../../../hooks/useAppState';

export interface UseTrackGuideReturn {
  isGenerating: boolean;
  error: AppError | null;
  generateTrackGuide: (inputs: UserInputs) => Promise<GuidebookEntry | null>;
  generateTrackGuideStream: (inputs: UserInputs, onChunk: (text: string) => void) => Promise<GuidebookEntry | null>;
  clearError: () => void;
}

export function useTrackGuide(): UseTrackGuideReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const { setError, setLoading } = useLoadingAndErrors();
  const [localError, setLocalError] = useState<AppError | null>(null);

  const geminiService = ImprovedGeminiService.getInstance();

  const generateTrackGuide = useCallback(async (inputs: UserInputs): Promise<GuidebookEntry | null> => {
    try {
      setIsGenerating(true);
      setLoading('trackGuide', true);
      setLocalError(null);
      setError('trackGuide', null);

      // Validate inputs
      if (!inputs.genre || inputs.genre.length === 0) {
        throw new AppError(
          'VALIDATION_FAILED' as any,
          'Genre is required',
          'Please select at least one genre.',
          false
        );
      }

      if (!inputs.daw || inputs.daw.trim() === '') {
        throw new AppError(
          'VALIDATION_FAILED' as any,
          'DAW is required',
          'Please select a DAW.',
          false
        );
      }

      const guidebook = await geminiService.generateTrackGuide(inputs);
      return guidebook;

    } catch (error) {
      const appError = error instanceof AppError ? error : new AppError(
        'UNKNOWN_ERROR' as any,
        error instanceof Error ? error.message : 'Unknown error',
        'Failed to generate track guide. Please try again.',
        true
      );
      
      setLocalError(appError);
      setError('trackGuide', appError);
      return null;
    } finally {
      setIsGenerating(false);
      setLoading('trackGuide', false);
    }
  }, [geminiService, setError, setLoading]);

  const generateTrackGuideStream = useCallback(async (
    inputs: UserInputs,
    onChunk: (text: string) => void
  ): Promise<GuidebookEntry | null> => {
    try {
      setIsGenerating(true);
      setLoading('trackGuide', true);
      setLocalError(null);
      setError('trackGuide', null);

      // Validate inputs
      if (!inputs.genre || inputs.genre.length === 0) {
        throw new AppError(
          'VALIDATION_FAILED' as any,
          'Genre is required',
          'Please select at least one genre.',
          false
        );
      }

      let fullContent = '';
      
      // Use streaming generation
      for await (const chunk of geminiService.generateTrackGuideStream(inputs)) {
        fullContent += chunk.text;
        onChunk(chunk.text);
      }

      // Create the guidebook entry
      const guidebook: GuidebookEntry = {
        id: `guidebook-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: extractTitleFromContent(fullContent, inputs),
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
        content: fullContent,
        createdAt: new Date().toISOString()
      };

      return guidebook;

    } catch (error) {
      const appError = error instanceof AppError ? error : new AppError(
        'UNKNOWN_ERROR' as any,
        error instanceof Error ? error.message : 'Unknown error',
        'Failed to generate track guide. Please try again.',
        true
      );
      
      setLocalError(appError);
      setError('trackGuide', appError);
      return null;
    } finally {
      setIsGenerating(false);
      setLoading('trackGuide', false);
    }
  }, [geminiService, setError, setLoading]);

  const clearError = useCallback(() => {
    setLocalError(null);
    setError('trackGuide', null);
  }, [setError]);

  return {
    isGenerating,
    error: localError,
    generateTrackGuide,
    generateTrackGuideStream,
    clearError
  };
}

// Helper function to extract title from content
function extractTitleFromContent(content: string, inputs: UserInputs): string {
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
