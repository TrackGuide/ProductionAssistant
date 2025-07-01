import { useState } from 'react';
import { MixCompareInputs } from '../types/appTypes';
import { generateMixComparisonStream } from '../services/geminiService';

/**
 * Custom hook for Mix Comparison feature logic
 */
export const useMixComparison = () => {
  const [mixCompareInputs, setMixCompareInputs] = useState<MixCompareInputs>({
    mixA: null,
    mixB: null,
    userNotes: '',
    includeMixBFeedback: false
  });
  const [isGeneratingMixComparison, setIsGeneratingMixComparison] = useState(false);
  const [streamingMixComparison, setStreamingMixComparison] = useState('');
  const [mixCompareResult, setMixCompareResult] = useState<string | null>(null);
  const [mixCompareError, setMixCompareError] = useState<string | null>(null);

  /**
   * Helper function to convert file to base64
   */
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix to get just the base64 data
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  /**
   * Filter out lyrics or unwanted text before the first heading
   */
  const filterLyricsFromAIResponse = (content: string): string => {
    let filtered = content.trim();
    const headingMatch = filtered.match(/(^|\n)(##? |🎧|Audio Analysis Results)/);
    if (headingMatch && headingMatch.index !== undefined) {
      filtered = filtered.slice(headingMatch.index).trim();
    }
    return filtered;
  };

  /**
   * Handles comparing two mixes
   */
  const handleCompareMixes = async () => {
    if (!mixCompareInputs.mixA || !mixCompareInputs.mixB) {
      setMixCompareError("Please upload both Mix A and Mix B files.");
      return;
    }
    
    setIsGeneratingMixComparison(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setMixCompareResult(null);
    setStreamingMixComparison('');
    setMixCompareError(null);
    
    // Create abort controller for cancellation
    const abortController = new AbortController();
    
    try {
      // Convert files to base64 for the streaming AI service
      const mixABase64 = await fileToBase64(mixCompareInputs.mixA);
      const mixBBase64 = await fileToBase64(mixCompareInputs.mixB);

      // Use streaming mix comparison for real-time updates
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
        if (abortController.signal.aborted) break;
        
        if (chunk.text) {
          fullComparison += chunk.text;
          setStreamingMixComparison(fullComparison);
        }
      }
      
      if (!abortController.signal.aborted) {
        // Apply lyrics filtering like other features
        const filteredComparison = filterLyricsFromAIResponse(fullComparison);
        setMixCompareResult(filteredComparison);
        setStreamingMixComparison('');
      }
      
    } catch (err: any) {
      if (!abortController.signal.aborted) {
        setMixCompareError(err.message || "An unknown error occurred while comparing mixes.");
        setStreamingMixComparison('');
      }
    } finally {
      setIsGeneratingMixComparison(false);
    }
  };

  /**
   * Resets the mix comparison form
   */
  const resetMixCompareForm = () => {
    setMixCompareInputs({
      mixA: null,
      mixB: null,
      userNotes: '',
      includeMixBFeedback: false
    });
    setMixCompareResult(null);
    setMixCompareError(null);
  };

  return {
    mixCompareInputs,
    setMixCompareInputs,
    isGeneratingMixComparison,
    streamingMixComparison,
    mixCompareResult,
    mixCompareError,
    handleCompareMixes,
    resetMixCompareForm,
  };
};