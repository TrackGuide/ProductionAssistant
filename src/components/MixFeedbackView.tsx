import React, { useRef, useState } from 'react';
import { MixFeedbackInputs, MixCompareInputs } from '../types/appTypes';
import { useMixFeedback } from '../hooks/useMixFeedback';
import { useAppStore } from '../store/useAppStore';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { Spinner } from './Spinner';
import { ContentDisplay } from './ContentDisplay';
import { MarkdownRendererService } from '../services/markdownRenderer.service';
import { initialMixFeedbackInputsState, MAX_AUDIO_FILE_SIZE_MB } from '../constants/initialStates';
import { AdjustmentsHorizontalIcon } from './icons';

export const MixFeedbackView: React.FC = () => {
  const { copyStatus } = useAppStore();
  
  const {
    isGeneratingMixFeedback,
    streamingMixFeedback,
    mixFeedbackError,
    mixFeedbackResult,
    generateMixFeedback,
    setMixFeedbackError,
    setMixFeedbackResult,
    isGeneratingMixComparison,
    streamingMixComparison,
    mixCompareResult,
    mixCompareError,
    compareMixes,
    setMixCompareError,
    setMixCompareResult,
    validateAudioFile
  } = useMixFeedback();

  const [mixFeedbackTab, setMixFeedbackTab] = useState<'feedback' | 'compare'>('feedback');
  const [mixFeedbackInputs, setMixFeedbackInputs] = useState<MixFeedbackInputs>(initialMixFeedbackInputsState);
  const [mixCompareInputs, setMixCompareInputs] = useState<MixCompareInputs>({
    mixA: null,
    mixB: null,
    userNotes: '',
    includeMixBFeedback: false
  });

  const audioFileInputRef = useRef<HTMLInputElement>(null);
  const mixAInputRef = useRef<HTMLInputElement>(null);
  const mixBInputRef = useRef<HTMLInputElement>(null);

  const handleMixAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validationError = validateAudioFile(file);
      if (validationError) {
        setMixFeedbackError(validationError);
        setMixFeedbackInputs(prev => ({ ...prev, audioFile: null }));
        if (audioFileInputRef.current) audioFileInputRef.current.value = "";
        return;
      }
      setMixFeedbackInputs(prev => ({ ...prev, audioFile: file }));
      setMixFeedbackError(null);
    }
  };

  const handleMixUserNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMixFeedbackInputs(prev => ({ ...prev, userNotes: e.target.value }));
  };

  const handleMixInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMixFeedbackInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleGetMixFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    await generateMixFeedback(mixFeedbackInputs);
  };

  const resetMixFeedbackForm = () => {
    setMixFeedbackInputs(initialMixFeedbackInputsState);
    setMixFeedbackResult(null);
    setMixFeedbackError(null);
    if (audioFileInputRef.current) audioFileInputRef.current.value = "";
  };

  const handleMixCompareFileChange = (e: React.ChangeEvent<HTMLInputElement>, mixType: 'mixA' | 'mixB') => {
    const file = e.target.files?.[0];
    if (file) {
      const validationError = validateAudioFile(file);
      if (validationError) {
        setMixCompareError(validationError);
        setMixCompareInputs(prev => ({ ...prev, [mixType]: null }));
        const inputRef = mixType === 'mixA' ? mixAInputRef : mixBInputRef;
        if (inputRef.current) inputRef.current.value = "";
        return;
      }
      setMixCompareInputs(prev => ({ ...prev, [mixType]: file }));
      setMixCompareError(null);
    }
  };

  const handleCompareMixes = async () => {
    await compareMixes(mixCompareInputs);
  };

  const resetMixCompareForm = () => {
    setMixCompareInputs({
      mixA: null,
      mixB: null,
      userNotes: '',
      includeMixBFeedback: false
    });
    setMixCompareResult(null);
    setMixCompareError(null);
    if (mixAInputRef.current) mixAInputRef.current.value = "";
    if (mixBInputRef.current) mixBInputRef.current.value = "";
  };

  const renderMarkdown = (content: string) => MarkdownRendererService.renderMarkdown(content, true);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Tab Navigation */}
      <div className="flex justify-center mb-6">
        <div className="bg-gray-800 rounded-lg p-1 flex">
          <button
            onClick={() => setMixFeedbackTab('feedback')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              mixFeedbackTab === 'feedback'
                ? 'bg-orange-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Mix Feedback
          </button>
          <button
            onClick={() => setMixFeedbackTab('compare')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              mixFeedbackTab === 'compare'
                ? 'bg-orange-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Mix Comparison
          </button>
        </div>
      </div>

      {mixFeedbackTab === 'feedback' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Mix Feedback Form */}
          <Card title="Upload Your Mix" className="bg-gray-800/80 backdrop-blur-md shadow-xl border border-gray-700/50">
            <form onSubmit={handleGetMixFeedback} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Audio File (Max {MAX_AUDIO_FILE_SIZE_MB}MB)
                </label>
                <input
                  ref={audioFileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleMixAudioFileChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-orange-500 file:text-white hover:file:bg-orange-600"
                  required
                />
              </div>

              <Input
                label="Track Name (Optional)"
                name="trackName"
                value={mixFeedbackInputs.trackName}
                onChange={handleMixInputChange}
                placeholder="Enter track name"
              />

              <Input
                label="DAW Used (Optional)"
                name="dawName"
                value={mixFeedbackInputs.dawName}
                onChange={handleMixInputChange}
                placeholder="e.g., Ableton Live, Pro Tools"
              />

              <Textarea
                label="Additional Notes (Optional)"
                name="userNotes"
                value={mixFeedbackInputs.userNotes}
                onChange={handleMixUserNotesChange}
                placeholder="Any specific areas you'd like feedback on, or context about the mix..."
                rows={4}
              />

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={isGeneratingMixFeedback || !mixFeedbackInputs.audioFile}
                  className="flex-1"
                >
                  {isGeneratingMixFeedback ? 'Analyzing...' : 'Get Mix Feedback'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={resetMixFeedbackForm}
                  disabled={isGeneratingMixFeedback}
                >
                  Reset
                </Button>
              </div>
            </form>
          </Card>

          {/* Mix Feedback Results */}
          <div className="lg:col-span-2">
            <Card 
              title="Mix Feedback Analysis" 
              className="bg-gray-800/80 backdrop-blur-md shadow-xl border border-gray-700/50"
            >
              {isGeneratingMixFeedback && (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Spinner size="lg" />
                  <p className="text-gray-400 text-center">
                    Analyzing your mix with AI...
                  </p>
                </div>
              )}

              {mixFeedbackError && (
                <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-4">
                  <p className="text-red-300 text-sm">{mixFeedbackError}</p>
                </div>
              )}

              {(streamingMixFeedback || mixFeedbackResult) && (
                <ContentDisplay
                  content={streamingMixFeedback || mixFeedbackResult || ''}
                  onCopy={(elementId) => {/* Copy handler */}}
                  copyStatus={copyStatus}
                  canSave={false}
                  onSave={() => {}}
                  renderMarkdown={renderMarkdown}
                  elementId="mix-feedback-content"
                />
              )}

              {!mixFeedbackResult && !streamingMixFeedback && !isGeneratingMixFeedback && !mixFeedbackError && (
                <div className="text-center py-12">
                  <AdjustmentsHorizontalIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg mb-2">Ready to analyze your mix?</p>
                  <p className="text-gray-500 text-sm">Upload an audio file to get detailed AI feedback on your mix.</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Mix Comparison Form */}
          <Card title="Compare Two Mixes" className="bg-gray-800/80 backdrop-blur-md shadow-xl border border-gray-700/50">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Mix A (Max {MAX_AUDIO_FILE_SIZE_MB}MB)
                </label>
                <input
                  ref={mixAInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={(e) => handleMixCompareFileChange(e, 'mixA')}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-orange-500 file:text-white hover:file:bg-orange-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Mix B (Max {MAX_AUDIO_FILE_SIZE_MB}MB)
                </label>
                <input
                  ref={mixBInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={(e) => handleMixCompareFileChange(e, 'mixB')}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-orange-500 file:text-white hover:file:bg-orange-600"
                  required
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="includeMixBFeedback"
                  checked={mixCompareInputs.includeMixBFeedback}
                  onChange={(e) => setMixCompareInputs(prev => ({ 
                    ...prev, 
                    includeMixBFeedback: e.target.checked 
                  }))}
                  className="mr-2"
                />
                <label htmlFor="includeMixBFeedback" className="text-sm text-gray-300">
                  Include individual feedback for Mix B
                </label>
              </div>

              <Textarea
                label="Comparison Notes (Optional)"
                name="userNotes"
                value={mixCompareInputs.userNotes}
                onChange={(e) => setMixCompareInputs(prev => ({ 
                  ...prev, 
                  userNotes: e.target.value 
                }))}
                placeholder="What aspects would you like compared? Any specific context..."
                rows={4}
              />

              <div className="flex gap-2">
                <Button
                  onClick={handleCompareMixes}
                  disabled={isGeneratingMixComparison || !mixCompareInputs.mixA || !mixCompareInputs.mixB}
                  className="flex-1"
                >
                  {isGeneratingMixComparison ? 'Comparing...' : 'Compare Mixes'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={resetMixCompareForm}
                  disabled={isGeneratingMixComparison}
                >
                  Reset
                </Button>
              </div>
            </div>
          </Card>

          {/* Mix Comparison Results */}
          <div className="lg:col-span-2">
            <Card 
              title="Mix Comparison Analysis" 
              className="bg-gray-800/80 backdrop-blur-md shadow-xl border border-gray-700/50"
            >
              {isGeneratingMixComparison && (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Spinner size="lg" />
                  <p className="text-gray-400 text-center">
                    Comparing mixes with AI...
                  </p>
                </div>
              )}

              {mixCompareError && (
                <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-4">
                  <p className="text-red-300 text-sm">{mixCompareError}</p>
                </div>
              )}

              {(streamingMixComparison || mixCompareResult) && (
                <ContentDisplay
                  content={streamingMixComparison || mixCompareResult || ''}
                  onCopy={(elementId) => {/* Copy handler */}}
                  copyStatus={copyStatus}
                  canSave={false}
                  onSave={() => {}}
                  renderMarkdown={renderMarkdown}
                  elementId="mix-comparison-content"
                />
              )}

              {!mixCompareResult && !streamingMixComparison && !isGeneratingMixComparison && !mixCompareError && (
                <div className="text-center py-12">
                  <AdjustmentsHorizontalIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg mb-2">Ready to compare mixes?</p>
                  <p className="text-gray-500 text-sm">Upload two audio files to get detailed AI comparison.</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};