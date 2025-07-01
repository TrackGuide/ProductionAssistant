// src/features/trackGuide/components/TrackGuideFeature.tsx

import React, { useCallback, useState } from 'react';
import { SavePromptModal } from '../../../components/SavePromptModal';
import { Toast } from '../../../components/Toast';
import { TrackGuideForm } from './TrackGuideForm';
import { TrackGuideResults } from './TrackGuideResults';
import { TrackGuideErrorBoundary } from '../../../components/ErrorBoundary';
import { useTrackGuide } from '../hooks/useTrackGuide';
import { useAppState, useCurrentGuidebook, useUserInputs, useLoadingAndErrors } from '../../../hooks/useAppState';
import { UserInputs } from '../../../constants/types';
import { Card } from '../../../components/Card';

export const TrackGuideFeature: React.FC<{ onSaveToLibrary: (data: any) => void }> = ({ onSaveToLibrary }) => {
  // State for SavePromptModal and Toast
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Handler for SavePromptModal
  const handleSavePrompt = async (title: string, tags: string[]) => {
    // Compose the data to save (currentGuidebook is the generated guide)
    if (!currentGuidebook) return;
    const dataToSave = {
      ...currentGuidebook,
      title,
      tags,
      type: 'trackGuide',
    };
    onSaveToLibrary(dataToSave);
    setShowSavePrompt(false);
    setShowToast(true);
  };
  const { state, actions } = useAppState();
  const { currentGuidebook, setCurrentGuidebook, generatedContent, setGeneratedContent } = useCurrentGuidebook();
  const { userInputs, setUserInputs, resetUserInputs } = useUserInputs();
  const { loading, errors, loadingMessage, setLoadingMessage } = useLoadingAndErrors();
  
  const {
    isGenerating,
    error: trackGuideError,
    generateTrackGuideStream,
    clearError
  } = useTrackGuide();

  // Handle form submission with streaming
  const handleGenerateGuide = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors and content
    clearError();
    setGeneratedContent('');
    setCurrentGuidebook(null);
    setLoadingMessage('Generating your track guide...');

    try {
      // Generate guidebook with streaming
      let currentContent = '';
      const guidebook = await generateTrackGuideStream(userInputs, (chunk) => {
        currentContent += chunk;
        setGeneratedContent(currentContent);
      });

      if (guidebook) {
        setCurrentGuidebook(guidebook);
        setLoadingMessage('');
      }
    } catch (error) {
      console.error('Failed to generate track guide:', error);
      setLoadingMessage('');
    }
  }, [
    userInputs,
    generateTrackGuideStream,
    setCurrentGuidebook,
    setGeneratedContent,
    setLoadingMessage,
    clearError
  ]);

  // Use the provided onSaveToLibrary prop

  // Handle opening library
  const handleViewLibrary = useCallback(() => {
    actions.setLibraryModalOpen(true);
  }, [actions]);

  // Handle clearing form
  const handleClearForm = useCallback(() => {
    resetUserInputs();
    setCurrentGuidebook(null);
    setGeneratedContent('');
    clearError();
    setLoadingMessage('');
  }, [resetUserInputs, setCurrentGuidebook, setGeneratedContent, clearError, setLoadingMessage]);

  // Handle input changes
  const handleInputsChange = useCallback((updates: Partial<UserInputs>) => {
    setUserInputs(updates);
  }, [setUserInputs]);

  const isLoading = loading.trackGuide || isGenerating;
  const hasError = errors.trackGuide || trackGuideError;
  const hasResults = Boolean(currentGuidebook && generatedContent);
  const canSave = hasResults && !isLoading;

  return (
    <TrackGuideErrorBoundary>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Column */}
          <div className="space-y-6 lg:col-span-1">
            <TrackGuideForm
              userInputs={userInputs}
              onInputsChange={handleInputsChange}
              onSubmit={handleGenerateGuide}
              onSaveToLibrary={() => setShowSavePrompt(true)}
              onViewLibrary={handleViewLibrary}
              onClearForm={handleClearForm}
              isLoading={isLoading}
              canSave={canSave}
            />
          </div>

          {/* Results Column */}
          <div className="space-y-6 lg:col-span-2">
            {/* Loading State */}
            {isLoading && (
              <Card className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-300 text-lg font-medium">
                  {loadingMessage || 'Generating your track guide...'}
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  This may take 30-60 seconds
                </p>
              </Card>
            )}

            {/* Error State */}
            {hasError && !isLoading && (
              <Card className="border-red-500 bg-red-900/20">
                <div className="text-center py-8">
                  <div className="text-red-400 text-4xl mb-4">⚠️</div>
                  <h3 className="text-lg font-semibold text-red-300 mb-2">
                    Generation Failed
                  </h3>
                  <p className="text-red-200 mb-4">
                    {hasError ? (hasError as any).userMessage || hasError.message : 'An error occurred'}
                  </p>
                  <button
                    onClick={clearError}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </Card>
            )}

            {/* Results */}
            {hasResults && !isLoading && currentGuidebook && (
              <TrackGuideResults
                guidebook={currentGuidebook}
                generatedContent={generatedContent}
                onSaveToLibrary={() => setShowSavePrompt(true)}
              />
            )}

            {/* Empty State */}
            {!hasResults && !isLoading && !hasError && (
              <Card className="text-center py-12">
                <div className="flex justify-center mb-4">
                  <div className="bg-orange-500 rounded-full flex items-center justify-center" style={{ width: 64, height: 64 }}>
                    <div className="w-1/2 h-1/2 bg-white transform -rotate-45" style={{ width: 32, height: 32 }}></div>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-300 mb-2">
                  Ready to Create Your Track Guide
                </h3>
                <p className="text-gray-400">
                  Fill out the form and click "Generate Track Guide" to get started.
                  Your AI-powered production companion will create a comprehensive guide tailored to your specifications.
                </p>
              </Card>
            )}
          </div>
        </div>
        {/* Save Prompt Modal */}
        <SavePromptModal
          isOpen={showSavePrompt}
          onClose={() => setShowSavePrompt(false)}
          onSave={handleSavePrompt}
          generationType="trackGuide"
        />
        {/* Toast Notification */}
        {showToast && (
          <Toast message="Saved to library!" onClose={() => setShowToast(false)} />
        )}
      </div>
    </TrackGuideErrorBoundary>
  );
};
