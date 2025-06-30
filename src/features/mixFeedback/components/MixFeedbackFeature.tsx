// src/features/mixFeedback/components/MixFeedbackFeature.tsx

import React from 'react';
import { useMixFeedback } from '../hooks/useMixFeedback';
import { MixFeedbackForm } from './MixFeedbackForm';
import { MixFeedbackResults } from './MixFeedbackResults';

export const MixFeedbackFeature: React.FC = () => {
  const {
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
  } = useMixFeedback();

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-2 space-y-6">
          <MixFeedbackForm
            // Single Mix Props
            mixFeedbackInputs={mixFeedbackInputs}
            updateMixFeedbackInputs={updateMixFeedbackInputs}
            handleSingleMixFileChange={handleSingleMixFileChange}
            generateSingleMixFeedback={generateSingleMixFeedback}
            resetSingleMixForm={resetSingleMixForm}
            isGeneratingMixFeedback={isGeneratingMixFeedback}
            mixFeedbackError={mixFeedbackError}
            
            // Mix Compare Props
            mixCompareInputs={mixCompareInputs}
            updateMixCompareInputs={updateMixCompareInputs}
            handleCompareFileChange={handleCompareFileChange}
            generateMixComparison={generateMixComparison}
            resetMixCompareForm={resetMixCompareForm}
            isGeneratingMixComparison={isGeneratingMixComparison}
            mixCompareError={mixCompareError}
            
            // UI Props
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            maxFileSizeMB={MAX_AUDIO_FILE_SIZE_MB}
          />
        </div>
        
        {/* Results Section */}
        <div className="lg:col-span-3 space-y-6">
          <MixFeedbackResults
            // Single Mix Results
            mixFeedbackResult={mixFeedbackResult}
            streamingMixFeedback={streamingMixFeedback}
            isGeneratingMixFeedback={isGeneratingMixFeedback}
            mixFeedbackError={mixFeedbackError}
            
            // Mix Comparison Results
            mixCompareResult={mixCompareResult}
            streamingMixComparison={streamingMixComparison}
            isGeneratingMixComparison={isGeneratingMixComparison}
            mixCompareError={mixCompareError}
            
            // UI State
            activeTab={activeTab}
          />
        </div>
      </div>
    </div>
  );
};
