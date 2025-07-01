import { useState } from 'react';
import { MixFeedbackInputs, MixCompareInputs } from '../types/appTypes';
import { generateMixFeedbackWithAudioStream, generateMixComparisonStream } from '../services/geminiService';
import { MAX_AUDIO_FILE_SIZE_BYTES, MAX_AUDIO_FILE_SIZE_MB } from '../constants/initialStates';

export const useMixFeedback = () => {
  const [isGeneratingMixFeedback, setIsGeneratingMixFeedback] = useState(false);
  const [streamingMixFeedback, setStreamingMixFeedback] = useState('');
  const [mixFeedbackError, setMixFeedbackError] = useState<string | null>(null);
  const [mixFeedbackResult, setMixFeedbackResult] = useState<string | null>(null);

  const [isGeneratingMixComparison, setIsGeneratingMixComparison] = useState(false);
  const [streamingMixComparison, setStreamingMixComparison] = useState('');
  const [mixCompareResult, setMixCompareResult] = useState<string | null>(null);
  const [mixCompareError, setMixCompareError] = useState<string | null>(null);

  const filterLyricsFromAIResponse = (content: string): string => {
    let filtered = content.trim();
    const headingMatch = filtered.match(/(^|\n)(##? |🎧|Audio Analysis Results)/);
    if (headingMatch && headingMatch.index !== undefined) {
      filtered = filtered.slice(headingMatch.index).trim();
    }
    return filtered;
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const validateAudioFile = (file: File): string | null => {
    if (file.size > MAX_AUDIO_FILE_SIZE_BYTES) {
      return `File is too large. Maximum size is ${MAX_AUDIO_FILE_SIZE_MB}MB.`;
    }
    if (!file.type.startsWith('audio/')) {
      return 'Invalid file type. Please upload an audio file (e.g., MP3, WAV).';
    }
    return null;
  };

  const generateMixFeedback = async (mixFeedbackInputs: MixFeedbackInputs) => {
    if (!mixFeedbackInputs.audioFile) {
      setMixFeedbackError("Please upload an audio file for feedback.");
      return;
    }

    setIsGeneratingMixFeedback(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setMixFeedbackResult(null);
    setStreamingMixFeedback('');
    setMixFeedbackError(null);
    
    try {
      let fullFeedback = '';
      const feedbackStream = generateMixFeedbackWithAudioStream(mixFeedbackInputs);
      
      for await (const chunk of feedbackStream) {
        if (chunk.text) {
          fullFeedback += chunk.text;
          setStreamingMixFeedback(fullFeedback);
        }
      }
      
      const filteredFeedback = filterLyricsFromAIResponse(fullFeedback);
      setMixFeedbackResult(filteredFeedback);
      setStreamingMixFeedback('');
      
    } catch (err: any) {
      setMixFeedbackError(err.message || "An unknown error occurred while generating mix feedback.");
      setStreamingMixFeedback('');
    } finally {
      setIsGeneratingMixFeedback(false);
    }
  };

  const compareMixes = async (mixCompareInputs: MixCompareInputs) => {
    if (!mixCompareInputs.mixA || !mixCompareInputs.mixB) {
      setMixCompareError("Please upload both Mix A and Mix B files.");
      return;
    }

    setIsGeneratingMixComparison(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setMixCompareResult(null);
    setStreamingMixComparison('');
    setMixCompareError(null);
    
    try {
      const mixABase64 = await fileToBase64(mixCompareInputs.mixA);
      const mixBBase64 = await fileToBase64(mixCompareInputs.mixB);

      const comparisonInput = {
        mixAFile: mixABase64,
        mixBFile: mixBBase64,
        mixAName: mixCompareInputs.mixA.name,
        mixBName: mixCompareInputs.mixB.name,
        includeMixBFeedback: mixCompareInputs.includeMixBFeedback,
        userNotes: mixCompareInputs.userNotes
      };

      let fullComparison = '';
      const comparisonStream = generateMixComparisonStream(comparisonInput);
      
      for await (const chunk of comparisonStream) {
        if (chunk.text) {
          fullComparison += chunk.text;
          setStreamingMixComparison(fullComparison);
        }
      }
      
      const filteredComparison = filterLyricsFromAIResponse(fullComparison);
      setMixCompareResult(filteredComparison);
      setStreamingMixComparison('');
      
    } catch (err: any) {
      setMixCompareError(err.message || "An unknown error occurred while comparing mixes.");
      setStreamingMixComparison('');
    } finally {
      setIsGeneratingMixComparison(false);
    }
  };

  return {
    // Mix Feedback
    isGeneratingMixFeedback,
    streamingMixFeedback,
    mixFeedbackError,
    mixFeedbackResult,
    generateMixFeedback,
    setMixFeedbackError,
    setMixFeedbackResult,
    
    // Mix Comparison
    isGeneratingMixComparison,
    streamingMixComparison,
    mixCompareResult,
    mixCompareError,
    compareMixes,
    setMixCompareError,
    setMixCompareResult,
    
    // Utilities
    validateAudioFile,
    filterLyricsFromAIResponse
  };
};