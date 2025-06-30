import React, { useState, useRef } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { MixFeedbackPanel } from './MixFeedbackPanel';
import { useMixFeedback } from '../hooks/useMixFeedback';
import { useMixComparison } from '../hooks/useMixComparison';
import { useContentProcessing } from '../hooks/useContentProcessing';
import { MarkdownRenderer } from './MarkdownRenderer';
import { CopyIcon, SaveIcon } from './icons';
import { MAX_AUDIO_FILE_SIZE_MB } from '../constants/initialStates';

interface MixFeedbackViewProps {
  onSavePrompt: (type: 'mixFeedback' | 'mixCompare', data: any) => void;
}

export const MixFeedbackView: React.FC<MixFeedbackViewProps> = ({ onSavePrompt }) => {
  const [activeTab, setActiveTab] = useState<'feedback' | 'compare'>('feedback');
  const audioFileInputRef = useRef<HTMLInputElement>(null);
  const mixAInputRef = useRef<HTMLInputElement>(null);
  const mixBInputRef = useRef<HTMLInputElement>(null);

  // Mix Feedback Hook
  const {
    mixFeedbackInputs,
    setMixFeedbackInputs,
    isGeneratingMixFeedback,
    streamingMixFeedback,
    mixFeedbackResult,
    mixFeedbackError,
    handleGetMixFeedback,
    resetMixFeedbackForm
  } = useMixFeedback();

  // Mix Comparison Hook
  const {
    mixCompareInputs,
    setMixCompareInputs,
    isGeneratingMixComparison,
    streamingMixComparison,
    mixCompareResult,
    mixCompareError,
    handleCompareMixes,
    resetMixCompareForm
  } = useMixComparison();

  // Content Processing Hook
  const { renderMarkdown, handleCopyFormattedContent } = useContentProcessing();

  // File change handlers
  const handleMixAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_AUDIO_FILE_SIZE_MB * 1024 * 1024) {
        alert(`File is too large. Maximum size is ${MAX_AUDIO_FILE_SIZE_MB}MB.`);
        if (audioFileInputRef.current) audioFileInputRef.current.value = "";
        return;
      }
      if (!file.type.startsWith('audio/')) {
        alert('Invalid file type. Please upload an audio file (e.g., MP3, WAV).');
        if (audioFileInputRef.current) audioFileInputRef.current.value = "";
        return;
      }
      setMixFeedbackInputs(prev => ({ ...prev, audioFile: file }));
    }
  };

  const handleMixUserNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMixFeedbackInputs(prev => ({ ...prev, userNotes: e.target.value }));
  };

  const handleMixAChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_AUDIO_FILE_SIZE_MB * 1024 * 1024) {
        alert(`File is too large. Maximum size is ${MAX_AUDIO_FILE_SIZE_MB}MB.`);
        if (mixAInputRef.current) mixAInputRef.current.value = "";
        return;
      }
      setMixCompareInputs(prev => ({ ...prev, mixA: file }));
    }
  };

  const handleMixBChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_AUDIO_FILE_SIZE_MB * 1024 * 1024) {
        alert(`File is too large. Maximum size is ${MAX_AUDIO_FILE_SIZE_MB}MB.`);
        if (mixBInputRef.current) mixBInputRef.current.value = "";
        return;
      }
      setMixCompareInputs(prev => ({ ...prev, mixB: file }));
    }
  };

  const handleSaveFeedback = () => {
    if (activeTab === 'feedback' && mixFeedbackResult) {
      onSavePrompt('mixFeedback', {
        content: mixFeedbackResult,
        inputs: mixFeedbackInputs
      });
    } else if (activeTab === 'compare' && mixCompareResult) {
      onSavePrompt('mixCompare', {
        content: mixCompareResult,
        inputs: mixCompareInputs
      });
    }
  };

  const currentResult = activeTab === 'feedback' ? mixFeedbackResult : mixCompareResult;
  const currentStreaming = activeTab === 'feedback' ? streamingMixFeedback : streamingMixComparison;
  const currentError = activeTab === 'feedback' ? mixFeedbackError : mixCompareError;
  const isCurrentlyGenerating = activeTab === 'feedback' ? isGeneratingMixFeedback : isGeneratingMixComparison;

  return (
    <div className="max-w-full mx-auto grid grid-cols-1 lg:grid-cols-7 gap-6 px-4">
      {/* Form Section */}
      <div className="lg:col-span-2 space-y-6">
        <MixFeedbackPanel
          mixFeedbackTab={activeTab}
          setMixFeedbackTab={setActiveTab}
          mixFeedbackInputs={mixFeedbackInputs}
          setMixFeedbackInputs={setMixFeedbackInputs}
          mixFeedbackResult={mixFeedbackResult}
          streamingMixFeedback={streamingMixFeedback}
          isGeneratingMixFeedback={isGeneratingMixFeedback}
          mixFeedbackError={mixFeedbackError}
          handleMixAudioFileChange={handleMixAudioFileChange}
          handleMixUserNotesChange={handleMixUserNotesChange}
          handleGetMixFeedback={handleGetMixFeedback}
          resetMixFeedbackForm={resetMixFeedbackForm}
          audioFileInputRef={audioFileInputRef}
          // Mix comparison props
          mixCompareInputs={mixCompareInputs}
          setMixCompareInputs={setMixCompareInputs}
          mixCompareResult={mixCompareResult}
          streamingMixComparison={streamingMixComparison}
          isGeneratingMixComparison={isGeneratingMixComparison}
          mixCompareError={mixCompareError}
          handleCompareMixes={handleCompareMixes}
          resetMixCompareForm={resetMixCompareForm}
          handleMixAChange={handleMixAChange}
          handleMixBChange={handleMixBChange}
          mixAInputRef={mixAInputRef}
          mixBInputRef={mixBInputRef}
        />
      </div>

      {/* Results Section */}
      <div className="lg:col-span-5">
        <Card 
          title={activeTab === 'feedback' ? "Mix Analysis Results" : "Mix Comparison Results"}
          className="bg-gray-800/80 backdrop-blur-md shadow-xl border border-gray-700/50"
        >
          {currentError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
              <p className="text-red-400">{currentError}</p>
            </div>
          )}

          {(currentResult || currentStreaming || isCurrentlyGenerating) && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-orange-300">
                  {activeTab === 'feedback' ? 'AI Mix Analysis' : 'AI Mix Comparison'}
                </h3>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleCopyFormattedContent('mix-results-content')}
                    leftIcon={<CopyIcon className="w-4 h-4" />}
                  >
                    Copy
                  </Button>
                  {currentResult && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={handleSaveFeedback}
                      leftIcon={<SaveIcon className="w-4 h-4" />}
                    >
                      Save
                    </Button>
                  )}
                </div>
              </div>

              <div 
                id="mix-results-content"
                className="prose prose-invert max-w-none"
              >
                <MarkdownRenderer 
                  content={currentResult || currentStreaming || ''} 
                  isMixFeedback={true}
                />
              </div>
            </div>
          )}

          {!currentResult && !currentStreaming && !isCurrentlyGenerating && !currentError && (
            <div className="text-center py-12">
              <AdjustmentsHorizontalIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-2">Ready to analyze your mix?</p>
              <p className="text-gray-500 text-sm">Upload an audio file to get detailed AI feedback on your mix.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};