import React from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { Spinner } from './Spinner';
import { MAX_AUDIO_FILE_SIZE_MB } from '../constants/initialStates';

interface MixFeedbackPanelProps {
  mixFeedbackTab: 'single' | 'compare';
  setMixFeedbackTab: (tab: 'single' | 'compare') => void;
  mixFeedbackInputs: any;
  setMixFeedbackInputs: any;
  mixFeedbackResult: string | null;
  streamingMixFeedback: string;
  isGeneratingMixFeedback: boolean;
  mixFeedbackError: string | null;
  handleMixAudioFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleMixUserNotesChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleGetMixFeedback: (e: React.FormEvent) => void;
  resetMixFeedbackForm: () => void;
  audioFileInputRef: React.RefObject<HTMLInputElement>;
  // Add more props as needed for compare tab
}

export const MixFeedbackPanel: React.FC<MixFeedbackPanelProps> = ({
  mixFeedbackTab,
  setMixFeedbackTab,
  mixFeedbackInputs,
  setMixFeedbackInputs,
  mixFeedbackResult,
  streamingMixFeedback,
  isGeneratingMixFeedback,
  mixFeedbackError,
  handleMixAudioFileChange,
  handleMixUserNotesChange,
  handleGetMixFeedback,
  resetMixFeedbackForm,
  audioFileInputRef
}) => {
  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex bg-gray-800/80 backdrop-blur-md shadow-xl border border-gray-700/50 rounded-lg overflow-hidden">
        <button
          onClick={() => setMixFeedbackTab('single')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
            mixFeedbackTab === 'single'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
          }`}
        >
          🎚️ Mix Analysis
        </button>
        <button
          onClick={() => setMixFeedbackTab('compare')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
            mixFeedbackTab === 'compare'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
          }`}
        >
          ⚖️ Mix Compare
        </button>
      </div>

      {mixFeedbackTab === 'single' && (
        <Card title="Upload Your Mix" className="bg-gray-800/80 backdrop-blur-md shadow-xl border border-gray-700/50">
          <form onSubmit={handleGetMixFeedback} className="space-y-5">
            <div>
              <Input
                type="file"
                accept="audio/*"
                onChange={handleMixAudioFileChange}
                ref={audioFileInputRef}
                label="Audio File"
              />
              <p className="text-xs text-gray-500 mt-1">Max file size: {MAX_AUDIO_FILE_SIZE_MB}MB</p>
            </div>
            <div>
              <Textarea
                label="Notes for AI (optional)"
                name="userNotes"
                value={mixFeedbackInputs.userNotes}
                onChange={handleMixUserNotesChange}
                placeholder="Describe what you want feedback on, e.g. 'Is the vocal too loud?'"
                rows={3}
              />
            </div>
            {mixFeedbackError && (
              <p className="text-red-400 text-sm">{mixFeedbackError}</p>
            )}
            <Button type="submit" disabled={isGeneratingMixFeedback} className="w-full">
              {isGeneratingMixFeedback ? <Spinner size="sm" text="Analyzing..." /> : 'Get Mix Feedback'}
            </Button>
            <Button type="button" onClick={resetMixFeedbackForm} variant="outline" className="w-full mt-2">
              Reset
            </Button>
          </form>
        </Card>
      )}

      {/* Add Mix Compare UI here as needed */}
    </div>
  );
};
