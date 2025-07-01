// src/features/mixFeedback/components/MixFeedbackFeature.tsx

import React, { useState } from 'react';
import { useUser } from '../../../context/UserContext';
import { SavePromptModal } from '../../../components/SavePromptModal';
import { Toast } from '../../../components/Toast';
import { useMixFeedback } from '../hooks/useMixFeedback';
import { MixFeedbackForm } from './MixFeedbackForm';
import { MixFeedbackResults } from './MixFeedbackResults';

export const MixFeedbackFeature: React.FC<{ onSaveToLibrary: (type: 'mixFeedback' | 'mixCompare', data: any) => void }> = ({ onSaveToLibrary }) => {
  const [showSavePrompt, setShowSavePrompt] = useState<null | { type: 'mixFeedback' | 'mixCompare', data: any }>(null);
  const [showToast, setShowToast] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const { user, isGuest } = useUser();
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
            mixFeedbackInputs={mixFeedbackInputs}
            updateMixFeedbackInputs={updateMixFeedbackInputs}
            handleSingleMixFileChange={handleSingleMixFileChange}
            generateSingleMixFeedback={generateSingleMixFeedback}
            resetSingleMixForm={resetSingleMixForm}
            isGeneratingMixFeedback={isGeneratingMixFeedback}
            mixFeedbackError={mixFeedbackError}
            mixCompareInputs={mixCompareInputs}
            updateMixCompareInputs={updateMixCompareInputs}
            handleCompareFileChange={handleCompareFileChange}
            generateMixComparison={generateMixComparison}
            resetMixCompareForm={resetMixCompareForm}
            isGeneratingMixComparison={isGeneratingMixComparison}
            mixCompareError={mixCompareError}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            maxFileSizeMB={MAX_AUDIO_FILE_SIZE_MB}
          />
        </div>
        {/* Results Section */}
        <div className="lg:col-span-3 space-y-6">
          <MixFeedbackResults
            mixFeedbackResult={mixFeedbackResult}
            streamingMixFeedback={streamingMixFeedback}
            isGeneratingMixFeedback={isGeneratingMixFeedback}
            mixFeedbackError={mixFeedbackError}
            mixCompareResult={mixCompareResult}
            streamingMixComparison={streamingMixComparison}
            isGeneratingMixComparison={isGeneratingMixComparison}
            mixCompareError={mixCompareError}
            activeTab={activeTab}
            onSaveToLibrary={(type, data) => {
              if (!user || isGuest) {
                setShowAuthPrompt(true);
              } else {
                setShowSavePrompt({ type, data });
              }
            }}
            mixFeedbackInputs={mixFeedbackInputs}
            mixCompareInputs={mixCompareInputs}
          />
        </div>
      </div>
      {/* Auth Prompt Modal */}
      {showAuthPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Sign in to Save</h2>
            <p className="mb-6 text-gray-700">You need to be logged in to save to your library.</p>
            <div className="flex flex-col gap-3">
              <button className="w-full bg-purple-600 text-white py-2 rounded font-semibold" onClick={() => { setShowAuthPrompt(false); window.dispatchEvent(new CustomEvent('navigate', { detail: 'login' })); }}>Log In</button>
              <button className="w-full bg-green-600 text-white py-2 rounded font-semibold" onClick={() => { setShowAuthPrompt(false); window.dispatchEvent(new CustomEvent('navigate', { detail: 'register' })); }}>Register</button>
              <button className="w-full bg-gray-300 text-gray-800 py-2 rounded font-semibold" onClick={() => setShowAuthPrompt(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {/* Save Prompt Modal */}
      {showSavePrompt && (
        <SavePromptModal
          isOpen={!!showSavePrompt}
          onClose={() => setShowSavePrompt(null)}
          onSave={async (title, tags) => {
            onSaveToLibrary(showSavePrompt.type, { ...showSavePrompt.data, title, tags });
            setShowSavePrompt(null);
            setShowToast(true);
          }}
          generationType={showSavePrompt.type}
        />
      )}
      {/* Toast Notification */}
      {showToast && (
        <Toast message="Saved to library!" onClose={() => setShowToast(false)} />
      )}
    </div>
  );
};
