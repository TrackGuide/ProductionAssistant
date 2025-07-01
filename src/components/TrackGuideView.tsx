import React, { useRef, useState } from 'react';
import { UserInputs } from '../types/appTypes';
import { useAppStore } from '../store/useAppStore';
import { useTrackGuideGeneration } from '../hooks/useTrackGuideGeneration';
import { useLibraryManagement } from '../hooks/useLibraryManagement';
import { useFormManagement } from '../hooks/useFormManagement';
import { useContentProcessing } from '../hooks/useContentProcessing';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { Button } from './Button';
import { Card } from './Card';
import { Spinner } from './Spinner';
import { SaveIcon, BookOpenIcon, MusicNoteIcon, PlusIcon, UploadIcon } from './icons';
import { TrackGuideForm } from './TrackGuideForm';
import { MidiGeneratorComponent } from './MidiGeneratorComponent';
import { LibraryModal } from './LibraryModal';
import { MarkdownRenderer } from './MarkdownRenderer';
import { SelectedPills } from './SelectedPills';
import { ContentDisplay } from './ContentDisplay';
import { GENRE_SUGGESTIONS, VIBE_SUGGESTIONS, DAW_SUGGESTIONS } from '../constants/constants';
import { parseSuggestedTitleFromMarkdownStream } from '../utils/guidebookUtils';

export const TrackGuideView: React.FC = () => {
  const {
    inputs,
    currentGenreText,
    currentVibeText,
    showLibraryModal,
    setShowLibraryModal,
    copyStatus
  } = useAppStore();

  const {
    isLoading,
    loadingMessage,
    error,
    midiError,
    generatedGuidebook,
    activeGuidebookDetails,
    generateTrackGuide,
    updateGuidebookEntryMidi
  } = useTrackGuideGeneration();

  const {
    library,
    saveToLibrary,
    loadFromLibrary,
    deleteFromLibrary
  } = useLibraryManagement();

  const {
    handleInputChange,
    handleAddMultiSelectItem,
    handleMultiSelectKeyDown,
    handleMultiSelectToggle,
    handleDAWSuggestionClick,
    resetFormForNewGuidebook
  } = useFormManagement();

  const {
    renderMarkdown,
    handleCopyFormattedContent,
    getTrackGuideCardTitle
  } = useContentProcessing();

  const genreInputRef = useRef<HTMLInputElement>(null);
  const vibeInputRef = useRef<HTMLInputElement>(null);
  const [showAdvancedInput, setShowAdvancedInput] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await generateTrackGuide(inputs);
  };

  const handleSaveToLibrary = () => {
    if (activeGuidebookDetails) {
      saveToLibrary(activeGuidebookDetails);
    }
  };

  const trackGuideCardTitle = getTrackGuideCardTitle(
    inputs.songTitle,
    activeGuidebookDetails,
    generatedGuidebook,
    isLoading
  );

  return (
    <div className="max-w-full mx-auto grid grid-cols-1 lg:grid-cols-7 gap-6 px-4">
      {/* Form Section */}
      <Card title="Blueprint Your Sound" className="lg:col-span-2 bg-gray-800/80 backdrop-blur-md shadow-xl border border-gray-700/50">
        <p className="text-sm text-gray-400 mb-4">Describe your vision—everything's optional.</p>
        
        <TrackGuideForm
          inputs={inputs}
          currentGenreText={currentGenreText}
          currentVibeText={currentVibeText}
          onInputChange={handleInputChange}
          onAddMultiSelectItem={handleAddMultiSelectItem}
          onMultiSelectKeyDown={handleMultiSelectKeyDown}
          onMultiSelectToggle={handleMultiSelectToggle}
          onDAWSuggestionClick={handleDAWSuggestionClick}
          genreInputRef={genreInputRef}
          vibeInputRef={vibeInputRef}
          showAdvancedInput={showAdvancedInput}
          setShowAdvancedInput={setShowAdvancedInput}
          isLoading={isLoading}
          onSubmit={handleSubmit}
          onReset={resetFormForNewGuidebook}
          onShowLibrary={() => setShowLibraryModal(true)}
        />
      </Card>

      {/* Content Display Section */}
      <div className="lg:col-span-5 space-y-6">
        {/* TrackGuide Results */}
        <Card 
          title={trackGuideCardTitle}
          className="bg-gray-800/80 backdrop-blur-md shadow-xl border border-gray-700/50"
        >
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Spinner size="lg" />
              <p className="text-gray-400 text-center">
                {loadingMessage || 'Generating your TrackGuide...'}
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-4">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {midiError && (
            <div className="bg-yellow-900/50 border border-yellow-700 rounded-lg p-4 mb-4">
              <p className="text-yellow-300 text-sm">{midiError}</p>
            </div>
          )}

          {(generatedGuidebook || activeGuidebookDetails?.content) && (
            <ContentDisplay
              content={generatedGuidebook || activeGuidebookDetails?.content || ''}
              onCopy={handleCopyFormattedContent}
              copyStatus={copyStatus}
              canSave={!!activeGuidebookDetails}
              onSave={handleSaveToLibrary}
              renderMarkdown={renderMarkdown}
            />
          )}

          {!generatedGuidebook && !activeGuidebookDetails && !isLoading && !error && (
            <div className="text-center py-12">
              <MusicNoteIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-2">Ready to create your TrackGuide?</p>
              <p className="text-gray-500 text-sm">Fill out the form and hit "Generate TrackGuide" to get started.</p>
            </div>
          )}
        </Card>

        {/* MIDI Generator Section */}
        {activeGuidebookDetails && (
          <Card 
            title="MIDI Pattern Generator" 
            className="bg-gray-800/80 backdrop-blur-md shadow-xl border border-gray-700/50"
          >
            <MidiGeneratorComponent
              guidebookEntry={activeGuidebookDetails}
              onUpdateEntry={updateGuidebookEntryMidi}
            />
          </Card>
        )}
      </div>

      {/* Library Modal */}
      {showLibraryModal && (
        <LibraryModal
          library={library}
          onClose={() => setShowLibraryModal(false)}
          onLoad={loadFromLibrary}
          onDelete={deleteFromLibrary}
        />
      )}
    </div>
  );
};