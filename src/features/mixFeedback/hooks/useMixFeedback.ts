// src/features/mixFeedback/hooks/useMixFeedback.ts

import { useState } from 'react';
import { generateAIResponse } from '../../../services/geminiService';
import { MixFeedbackInputs as APIMixFeedbackInputs, MixComparisonInputs } from '../../../constants/types';
import { AppError, ErrorType, createErrorHandler } from '../../../core/errors/AppError';
import { APIRetryService } from '../../../core/services/APIRetryService';

export interface MixFeedbackInputs {
  audioFile: File | null;
  userNotes: string;
  trackName: string;
  dawName: string;
}

export interface MixCompareInputs {
  mixA: File | null;
  mixB: File | null;
  userNotes: string;
  includeMixBFeedback?: boolean;
}

const MAX_AUDIO_FILE_SIZE_MB = 100;
const MAX_AUDIO_FILE_SIZE_BYTES = MAX_AUDIO_FILE_SIZE_MB * 1024 * 1024;

const initialMixFeedbackInputsState: MixFeedbackInputs = {
  audioFile: null,
  userNotes: '',
  trackName: '',
  dawName: '',
};

const initialMixCompareInputsState: MixCompareInputs = {
  mixA: null,
  mixB: null,
  userNotes: '',
  includeMixBFeedback: false,
};

export const useMixFeedback = () => {
  // Single Mix Feedback State
  const [mixFeedbackInputs, setMixFeedbackInputs] = useState<MixFeedbackInputs>(initialMixFeedbackInputsState);
  const [mixFeedbackResult, setMixFeedbackResult] = useState<string | null>(null);
  const [streamingMixFeedback, setStreamingMixFeedback] = useState<string>('');
  const [isGeneratingMixFeedback, setIsGeneratingMixFeedback] = useState<boolean>(false);
  const [mixFeedbackError, setMixFeedbackError] = useState<string | null>(null);
  
  // Mix Comparison State
  const [mixCompareInputs, setMixCompareInputs] = useState<MixCompareInputs>(initialMixCompareInputsState);
  const [mixCompareResult, setMixCompareResult] = useState<string | null>(null);
  const [streamingMixComparison, setStreamingMixComparison] = useState<string>('');
  const [isGeneratingMixComparison, setIsGeneratingMixComparison] = useState<boolean>(false);
  const [mixCompareError, setMixCompareError] = useState<string | null>(null);
  
  // UI State
  const [activeTab, setActiveTab] = useState<'single' | 'compare'>('single');

  const validateAudioFile = (file: File): string | null => {
    if (file.size > MAX_AUDIO_FILE_SIZE_BYTES) {
      return `File is too large. Max ${MAX_AUDIO_FILE_SIZE_MB}MB.`;
    }
    if (!file.type.startsWith('audio/')) {
      return 'Invalid file type. Please upload audio.';
    }
    return null;
  };

  const handleSingleMixFileChange = (file: File | null) => {
    if (!file) return;
    console.debug('[MixFeedback] handleSingleMixFileChange: file selected', file);
    const validationError = validateAudioFile(file);
    if (validationError) {
      setMixFeedbackError(validationError);
      return;
    }
    setMixFeedbackInputs(prev => ({ ...prev, audioFile: file }));
    setMixFeedbackError(null);
  };

  const handleCompareFileChange = (fileType: 'mixA' | 'mixB', file: File | null) => {
    if (!file) return;
    
    const validationError = validateAudioFile(file);
    if (validationError) {
      setMixCompareError(validationError);
      return;
    }
    
    setMixCompareInputs(prev => ({ ...prev, [fileType]: file }));
    setMixCompareError(null);
  };

  const generateSingleMixFeedback = async () => {
    if (!mixFeedbackInputs.audioFile) {
      setMixFeedbackError('Please upload an audio file');
      return;
    }

    setIsGeneratingMixFeedback(true);
    setMixFeedbackError(null);
    setStreamingMixFeedback('');
    setMixFeedbackResult(null);

    try {
      const errorHandler = createErrorHandler({ 
        component: 'MixFeedback', 
        operation: 'generateSingleMixFeedback' 
      });
      
      let fullContent = '';

      await APIRetryService.executeWithRetry(async () => {
        // Convert our inputs to the API format (plain object for debug)
        const apiInputs = {
          trackName: mixFeedbackInputs.trackName,
          userNotes: mixFeedbackInputs.userNotes,
          dawName: mixFeedbackInputs.dawName,
          audioFile: mixFeedbackInputs.audioFile || undefined,
        };
        console.debug('[MixFeedback] generateSingleMixFeedback: apiInputs', apiInputs);
        if (apiInputs.audioFile) {
          console.debug('[MixFeedback] audioFile name:', apiInputs.audioFile.name, 'size:', apiInputs.audioFile.size, 'type:', apiInputs.audioFile.type);
        }
        // Use generateMixFeedback to send audio file to backend
        fullContent = await import('../../../services/geminiService').then(m => m.generateMixFeedback(apiInputs));
        setStreamingMixFeedback(fullContent);
      }, { component: 'MixFeedback', operation: 'generateSingleMixFeedback' });

      setMixFeedbackResult(fullContent);
      setStreamingMixFeedback('');
    } catch (error) {
      const errorHandler = createErrorHandler({ 
        component: 'MixFeedback', 
        operation: 'generateSingleMixFeedback' 
      });
      const appError = errorHandler(error);
      console.error('Mix feedback generation failed:', appError);
      setMixFeedbackError(appError.userMessage);
    } finally {
      setIsGeneratingMixFeedback(false);
    }
  };

  const generateMixComparison = async () => {
    if (!mixCompareInputs.mixA || !mixCompareInputs.mixB) {
      setMixCompareError('Please upload both mix files');
      return;
    }

    setIsGeneratingMixComparison(true);
    setMixCompareError(null);
    setStreamingMixComparison('');
    setMixCompareResult(null);

    try {
      let fullContent = '';

      await APIRetryService.executeWithRetry(async () => {
        // Convert our inputs to the API format
        const apiInputs: MixComparisonInputs = {
          mixAFile: URL.createObjectURL(mixCompareInputs.mixA!),
          mixBFile: URL.createObjectURL(mixCompareInputs.mixB!),
          mixAName: mixCompareInputs.mixA!.name,
          mixBName: mixCompareInputs.mixB!.name,
          userNotes: mixCompareInputs.userNotes,
          includeMixBFeedback: mixCompareInputs.includeMixBFeedback,
        };
        
        // Use generateAIResponse instead of streaming function
        const prompt = `You are an expert mix engineer. Compare these two mixes and provide detailed feedback.\nInputs: ${JSON.stringify(apiInputs)}\nRespond with a clear, actionable comparison.`;
        fullContent = await generateAIResponse(prompt);
        setStreamingMixComparison(fullContent);
      }, { component: 'MixFeedback', operation: 'generateMixComparison' });

      setMixCompareResult(fullContent);
      setStreamingMixComparison('');
    } catch (error) {
      const errorHandler = createErrorHandler({ 
        component: 'MixFeedback', 
        operation: 'generateMixComparison' 
      });
      const appError = errorHandler(error);
      console.error('Mix comparison generation failed:', appError);
      setMixCompareError(appError.userMessage);
    } finally {
      setIsGeneratingMixComparison(false);
    }
  };

  const resetSingleMixForm = () => {
    setMixFeedbackInputs(initialMixFeedbackInputsState);
    setMixFeedbackResult(null);
    setStreamingMixFeedback('');
    setMixFeedbackError(null);
  };

  const resetMixCompareForm = () => {
    setMixCompareInputs(initialMixCompareInputsState);
    setMixCompareResult(null);
    setStreamingMixComparison('');
    setMixCompareError(null);
  };

  const updateMixFeedbackInputs = (updates: Partial<MixFeedbackInputs>) => {
    setMixFeedbackInputs(prev => ({ ...prev, ...updates }));
  };

  const updateMixCompareInputs = (updates: Partial<MixCompareInputs>) => {
    setMixCompareInputs(prev => ({ ...prev, ...updates }));
  };

  return {
    // Single Mix Feedback
    mixFeedbackInputs,
    mixFeedbackResult,
    streamingMixFeedback,
    isGeneratingMixFeedback,
    mixFeedbackError,
    updateMixFeedbackInputs,
    handleSingleMixFileChange,
    generateSingleMixFeedback,
    resetSingleMixForm,

    // Mix Comparison
    mixCompareInputs,
    mixCompareResult,
    streamingMixComparison,
    isGeneratingMixComparison,
    mixCompareError,
    updateMixCompareInputs,
    handleCompareFileChange,
    generateMixComparison,
    resetMixCompareForm,

    // UI
    activeTab,
    setActiveTab,
    
    // Constants
    MAX_AUDIO_FILE_SIZE_MB,
  };
};
