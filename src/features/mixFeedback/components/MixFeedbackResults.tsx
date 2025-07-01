// src/features/mixFeedback/components/MixFeedbackResults.tsx

import React from 'react';
import { Card } from '../../../components/Card';
import { Spinner } from '../../../components/Spinner';
import { MarkdownRenderer } from '../../../components/MarkdownRenderer';
interface MixFeedbackResultsProps {
  // Single Mix Results
  mixFeedbackResult: string | null;
  streamingMixFeedback: string;
  isGeneratingMixFeedback: boolean;
  mixFeedbackError: string | null;
  // Mix Comparison Results
  mixCompareResult: string | null;
  streamingMixComparison: string;
  isGeneratingMixComparison: boolean;
  mixCompareError: string | null;
  // UI State
  activeTab: 'single' | 'compare';
  // Save to Library
  onSaveToLibrary: (type: 'mixFeedback' | 'mixCompare', data: any) => void;
  mixFeedbackInputs: any;
  mixCompareInputs: any;
// removed stray bracket
}

const TrackGuideLogo = ({ className = "w-4 h-4" }: { className?: string }) => (
  <div className={`${className} bg-orange-500 transform rotate-45 flex items-center justify-center`}>
    <div className="w-1/2 h-1/2 bg-white transform -rotate-45"></div>
  </div>
);

export const MixFeedbackResults: React.FC<MixFeedbackResultsProps> = ({
  mixFeedbackResult,
  streamingMixFeedback,
  isGeneratingMixFeedback,
  mixFeedbackError,
  mixCompareResult,
  streamingMixComparison,
  isGeneratingMixComparison,
  mixCompareError,
  activeTab,
}) => {
  
  // Show streaming content for Single Mix Feedback
  if (isGeneratingMixFeedback && streamingMixFeedback && activeTab === 'single') {
    return (
      <Card 
        title="AI Mix Feedback Report (Generating...)" 
        className="bg-gray-800/80 backdrop-blur-md shadow-xl border border-gray-700/50 sticky top-8"
        titleClassName="border-b border-gray-700 text-xl !text-orange-300"
      >
        <div className="prose prose-sm md:prose-base prose-invert max-w-none max-h-[calc(100vh-6rem)] overflow-y-auto pr-3 text-gray-300 custom-scrollbar guidebook-content">
          <MarkdownRenderer content={streamingMixFeedback} />
        </div>
      </Card>
    );
  }
  
  // Show streaming content for Mix Comparison
  if (isGeneratingMixComparison && streamingMixComparison && activeTab === 'compare') {
    return (
      <Card 
        title="AI Mix Comparison Report (Generating...)" 
        className="bg-gray-800/80 backdrop-blur-md shadow-xl border border-gray-700/50 sticky top-8"
        titleClassName="border-b border-gray-700 text-xl !text-orange-300"
      >
        <div className="prose prose-sm md:prose-base prose-invert max-w-none max-h-[calc(100vh-6rem)] overflow-y-auto pr-3 text-gray-300 custom-scrollbar guidebook-content">
          <MarkdownRenderer content={streamingMixComparison} />
        </div>
      </Card>
    );
  }
  
  // Show spinner only when no streaming content yet
  if ((isGeneratingMixFeedback && !streamingMixFeedback && activeTab === 'single') || 
      (isGeneratingMixComparison && !streamingMixComparison && activeTab === 'compare')) {
    return (
      <div className="flex justify-center items-center h-full min-h-[500px]">
        <Spinner 
          size="lg" 
          color="text-orange-500" 
          text={
            activeTab === 'single' 
              ? "AI is analyzing your mix... this may take a moment."
              : "AI is comparing your mixes... this may take a moment."
          }
        />
      </div>
    );
  }
  
  // Show error states
  if (mixFeedbackError && !isGeneratingMixFeedback && activeTab === 'single') {
    return (
      <Card className="border-red-500 bg-red-900/40 shadow-xl">
        <p className="text-red-300 font-semibold text-lg">Mix Feedback Error:</p>
        <p className="text-red-300">{mixFeedbackError}</p>
      </Card>
    );
  }
  
  if (mixCompareError && !isGeneratingMixComparison && activeTab === 'compare') {
    return (
      <Card className="border-red-500 bg-red-900/40 shadow-xl">
        <p className="text-red-300 font-semibold text-lg">Mix Comparison Error:</p>
        <p className="text-red-300">{mixCompareError}</p>
      </Card>
    );
  }
  
  // Show completed results for Single Mix Feedback
  if (mixFeedbackResult && !isGeneratingMixFeedback && activeTab === 'single') {
    return (
      <Card 
        title="AI Mix Feedback Report" 
        className="bg-gray-800/80 backdrop-blur-md shadow-xl border border-gray-700/50 sticky top-8"
        titleClassName="border-b border-gray-700 text-xl !text-orange-300"
      >
        <div className="flex justify-end mb-2">
          <button
            className="px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 text-sm font-medium"
            onClick={() => onSaveToLibrary('mixFeedback', { content: mixFeedbackResult, inputs: mixFeedbackInputs })}
          >
            Save to Library
          </button>
        </div>
        <div 
          id="mix-feedback-display" 
          className="prose prose-sm md:prose-base prose-invert max-w-none max-h-[calc(100vh-6rem)] overflow-y-auto pr-3 text-gray-300 custom-scrollbar guidebook-content"
        >
          {/* Filter out lyrics or non-analysis text before first heading */}
          <MarkdownRenderer 
            content={(() => {
              let filtered = (mixFeedbackResult || '').trim();
              const headingMatch = filtered.match(/(^|\n)(##? |🎧|Audio Analysis Results)/);
              if (headingMatch && headingMatch.index !== undefined) {
                filtered = filtered.slice(headingMatch.index).trim();
              }
              return filtered;
            })()}
          />
        </div>
      </Card>
    );
  }
  
  // Show completed results for Mix Comparison
  if (mixCompareResult && !isGeneratingMixComparison && activeTab === 'compare') {
    return (
      <Card 
        title="AI Mix Comparison Report" 
        className="bg-gray-800/80 backdrop-blur-md shadow-xl border border-gray-700/50 sticky top-8"
        titleClassName="border-b border-gray-700 text-xl !text-orange-300"
      >
        <div className="flex justify-end mb-2">
          <button
            className="px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 text-sm font-medium"
            onClick={() => onSaveToLibrary('mixCompare', { content: mixCompareResult, inputs: mixCompareInputs })}
          >
            Save to Library
          </button>
        </div>
        <div 
          id="mix-comparison-display" 
          className="prose prose-sm md:prose-base prose-invert max-w-none max-h-[calc(100vh-6rem)] overflow-y-auto pr-3 text-gray-300 custom-scrollbar guidebook-content"
        >
          <MarkdownRenderer content={mixCompareResult} />
        </div>
      </Card>
    );
  }
  
  // Default empty state
  return (
    <Card className="bg-gray-800/80 backdrop-blur-md shadow-xl border border-gray-700/50 flex flex-col items-center justify-center h-96 text-center min-h-[500px]">
      <div className="flex justify-center mb-6">
        <TrackGuideLogo className="w-20 h-20 opacity-80"/>
      </div>
      <h3 className="text-2xl font-semibold text-gray-200 mb-2">Refine Your Sound.</h3>
      <p className="text-gray-400 max-w-md">
        {activeTab === 'single' 
          ? 'Upload your mix, add some notes, and get detailed feedback from our AI mixing engineer.'
          : 'Upload two mix versions to compare them side-by-side and get detailed analysis of the differences.'
        }
      </p>
    </Card>
  );
};
