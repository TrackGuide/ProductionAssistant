// src/features/mixFeedback/components/MixFeedbackForm.tsx

import React from 'react';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { Textarea } from '../../../components/Textarea';
import { Input } from '../../../components/Input';
import { UploadIcon } from '../../../components/icons';
import { MixFeedbackInputs, MixCompareInputs } from '../hooks/useMixFeedback';

interface MixFeedbackFormProps {
  // Single Mix Props
  mixFeedbackInputs: MixFeedbackInputs;
  updateMixFeedbackInputs: (updates: Partial<MixFeedbackInputs>) => void;
  handleSingleMixFileChange: (file: File | null) => void;
  generateSingleMixFeedback: () => void;
  resetSingleMixForm: () => void;
  isGeneratingMixFeedback: boolean;
  mixFeedbackError: string | null;
  
  // Mix Compare Props
  mixCompareInputs: MixCompareInputs;
  updateMixCompareInputs: (updates: Partial<MixCompareInputs>) => void;
  handleCompareFileChange: (fileType: 'mixA' | 'mixB', file: File | null) => void;
  generateMixComparison: () => void;
  resetMixCompareForm: () => void;
  isGeneratingMixComparison: boolean;
  mixCompareError: string | null;
  
  // UI Props
  activeTab: 'single' | 'compare';
  setActiveTab: (tab: 'single' | 'compare') => void;
  maxFileSizeMB: number;
}

export const MixFeedbackForm: React.FC<MixFeedbackFormProps> = ({
  // Single Mix Props
  mixFeedbackInputs,
  updateMixFeedbackInputs,
  handleSingleMixFileChange,
  generateSingleMixFeedback,
  resetSingleMixForm,
  isGeneratingMixFeedback,
  mixFeedbackError,
  
  // Mix Compare Props
  mixCompareInputs,
  updateMixCompareInputs,
  handleCompareFileChange,
  generateMixComparison,
  resetMixCompareForm,
  isGeneratingMixComparison,
  mixCompareError,
  
  // UI Props
  activeTab,
  setActiveTab,
  maxFileSizeMB,
}) => {
  
  const createFileUploadHandler = (callback: (file: File | null) => void) => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      callback(file);
    };

  const createFileDropHandler = (callback: (file: File | null) => void) => 
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0] || null;
      callback(file);
    };

  const preventDefault = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-800/50 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('single')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'single'
              ? 'bg-orange-500 text-white'
              : 'text-gray-300 hover:text-white hover:bg-gray-700'
          }`}
        >
          Single Mix Feedback
        </button>
        <button
          onClick={() => setActiveTab('compare')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'compare'
              ? 'bg-orange-500 text-white'
              : 'text-gray-300 hover:text-white hover:bg-gray-700'
          }`}
        >
          Compare Two Mixes
        </button>
      </div>

      {/* Single Mix Feedback Form */}
      {activeTab === 'single' && (
        <div className="space-y-6">
          <Card title="Mix Information" className="bg-gray-800/80 backdrop-blur-md shadow-xl border border-gray-700/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Track Name"
                placeholder="Enter track name"
                value={mixFeedbackInputs.trackName}
                onChange={(e) => updateMixFeedbackInputs({ trackName: e.target.value })}
              />
              <Input
                label="DAW Used"
                placeholder="e.g., Logic Pro, Ableton, FL Studio"
                value={mixFeedbackInputs.dawName}
                onChange={(e) => updateMixFeedbackInputs({ dawName: e.target.value })}
              />
            </div>
          </Card>

          <Card title="Upload Your Mix" className="bg-gray-800/80 backdrop-blur-md shadow-xl border border-gray-700/50">
            <div
              className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${
                mixFeedbackError && !mixFeedbackInputs.audioFile ? 'border-red-500' : 'border-gray-600'
              } border-dashed rounded-md cursor-pointer hover:border-orange-500 transition-colors`}
              onClick={() => document.getElementById('audio-upload')?.click()}
              onDrop={createFileDropHandler(handleSingleMixFileChange)}
              onDragOver={preventDefault}
              onDragEnter={preventDefault}
            >
              <div className="space-y-1 text-center">
                <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-400">
                  <label htmlFor="audio-upload" className="relative cursor-pointer rounded-md font-medium text-orange-400 hover:text-orange-300">
                    <span>Upload your mix</span>
                    <input
                      id="audio-upload"
                      name="audio-upload"
                      type="file"
                      className="sr-only"
                      accept="audio/*"
                      onChange={createFileUploadHandler(handleSingleMixFileChange)}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">MP3, WAV, FLAC up to {maxFileSizeMB}MB</p>
              </div>
            </div>
            {mixFeedbackInputs.audioFile && (
              <p className="text-xs text-green-400 mt-2">
                Selected: {mixFeedbackInputs.audioFile.name} ({(mixFeedbackInputs.audioFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </Card>

          <Card title="Additional Notes" className="bg-gray-800/80 backdrop-blur-md shadow-xl border border-gray-700/50">
            <Textarea
              placeholder="Tell the AI what you want feedback on. For example: 'Focus on the vocal mix and low-end balance' or 'I'm struggling with the stereo width'..."
              value={mixFeedbackInputs.userNotes}
              onChange={(e) => updateMixFeedbackInputs({ userNotes: e.target.value })}
              rows={3}
              className="w-full"
            />
          </Card>

          <div className="flex gap-4">
            <Button
              onClick={generateSingleMixFeedback}
              disabled={isGeneratingMixFeedback || !mixFeedbackInputs.audioFile}
              variant="primary"
              className="flex-1 px-4 py-3 text-base font-semibold"
              leftIcon={<span className="w-5 h-5 text-center">🎧</span>}
            >
              {isGeneratingMixFeedback ? 'Analyzing Mix...' : 'Get Mix Feedback'}
            </Button>
            
            <Button 
              onClick={resetSingleMixForm} 
              variant="outline" 
              className="px-6 py-3 !border-orange-500 !text-orange-400 hover:!bg-orange-500 hover:!text-white"
            >
              Reset
            </Button>
          </div>

          {mixFeedbackError && !isGeneratingMixFeedback && (
            <Card className="border-red-500 bg-red-900/40 shadow-xl">
              <p className="text-red-300 font-semibold text-lg">Mix Feedback Error:</p>
              <p className="text-red-300">{mixFeedbackError}</p>
            </Card>
          )}
        </div>
      )}

      {/* Mix Comparison Form */}
      {activeTab === 'compare' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Mix A (Original)" className="bg-gray-800/80 backdrop-blur-md shadow-xl border border-gray-700/50">
              <div
                className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${
                  mixCompareError && !mixCompareInputs.mixA ? 'border-red-500' : 'border-gray-600'
                } border-dashed rounded-md cursor-pointer hover:border-orange-500 transition-colors`}
                onClick={() => document.getElementById('mixA-upload')?.click()}
                onDrop={createFileDropHandler((file) => handleCompareFileChange('mixA', file))}
                onDragOver={preventDefault}
                onDragEnter={preventDefault}
              >
                <div className="space-y-1 text-center">
                  <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-400">
                    <label htmlFor="mixA-upload" className="relative cursor-pointer rounded-md font-medium text-orange-400 hover:text-orange-300">
                      <span>Upload Mix A</span>
                      <input
                        id="mixA-upload"
                        name="mixA-upload"
                        type="file"
                        className="sr-only"
                        accept="audio/*"
                        onChange={createFileUploadHandler((file) => handleCompareFileChange('mixA', file))}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">MP3, WAV, FLAC up to {maxFileSizeMB}MB</p>
                </div>
              </div>
              {mixCompareInputs.mixA && (
                <p className="text-xs text-green-400 mt-2">
                  Selected: {mixCompareInputs.mixA.name} ({(mixCompareInputs.mixA.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </Card>

            <Card title="Mix B (Revised)" className="bg-gray-800/80 backdrop-blur-md shadow-xl border border-gray-700/50">
              <div
                className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${
                  mixCompareError && !mixCompareInputs.mixB ? 'border-red-500' : 'border-gray-600'
                } border-dashed rounded-md cursor-pointer hover:border-orange-500 transition-colors`}
                onClick={() => document.getElementById('mixB-upload')?.click()}
                onDrop={createFileDropHandler((file) => handleCompareFileChange('mixB', file))}
                onDragOver={preventDefault}
                onDragEnter={preventDefault}
              >
                <div className="space-y-1 text-center">
                  <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-400">
                    <label htmlFor="mixB-upload" className="relative cursor-pointer rounded-md font-medium text-orange-400 hover:text-orange-300">
                      <span>Upload Mix B</span>
                      <input
                        id="mixB-upload"
                        name="mixB-upload"
                        type="file"
                        className="sr-only"
                        accept="audio/*"
                        onChange={createFileUploadHandler((file) => handleCompareFileChange('mixB', file))}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">MP3, WAV, FLAC up to {maxFileSizeMB}MB</p>
                </div>
              </div>
              {mixCompareInputs.mixB && (
                <p className="text-xs text-green-400 mt-2">
                  Selected: {mixCompareInputs.mixB.name} ({(mixCompareInputs.mixB.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </Card>
          </div>

          <Card title="Notes for AI" className="bg-gray-800/80 backdrop-blur-md shadow-xl border border-gray-700/50">
            <Textarea
              placeholder="Describe what you want the AI to focus on when comparing these mixes. For example: 'Focus on the vocal clarity and low-end balance' or 'Compare the stereo width and overall loudness'..."
              value={mixCompareInputs.userNotes}
              onChange={(e) => updateMixCompareInputs({ userNotes: e.target.value })}
              rows={3}
              className="w-full"
            />
          </Card>

          <div className="flex gap-4">
            <Button
              onClick={generateMixComparison}
              disabled={isGeneratingMixComparison || !mixCompareInputs.mixA || !mixCompareInputs.mixB}
              variant="primary"
              className="flex-1 px-4 py-3 text-base font-semibold"
              leftIcon={<span className="w-5 h-5 text-center">⚖️</span>}
            >
              {isGeneratingMixComparison ? 'Comparing Mixes...' : 'Compare Mixes'}
            </Button>
            
            <Button 
              onClick={resetMixCompareForm} 
              variant="outline" 
              className="px-6 py-3 !border-orange-500 !text-orange-400 hover:!bg-orange-500 hover:!text-white"
            >
              Reset
            </Button>
          </div>

          {mixCompareError && !isGeneratingMixComparison && (
            <Card className="border-red-500 bg-red-900/40 shadow-xl">
              <p className="text-red-300 font-semibold text-lg">Mix Comparison Error:</p>
              <p className="text-red-300">{mixCompareError}</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
