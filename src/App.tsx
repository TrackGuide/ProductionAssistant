import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { UserInputs, GuidebookEntry, MidiSettings, GeneratedMidiPatterns, KeyOfGeneratedMidiPatterns, MixFeedbackInputs, ActiveView } from './types.ts';
import { generateGuidebookContent, generateMidiPatternSuggestions, generateMixFeedback } from './services/geminiService.ts';
import { Input } from './components/Input.tsx';
import { Textarea } from './components/Textarea.tsx';
import { Button } from './components/Button.tsx';
import { Card } from './components/Card.tsx';
import { Spinner } from './components/Spinner.tsx';
import { SparklesIcon, SaveIcon, BookOpenIcon, MusicNoteIcon, PlusIcon, CopyIcon, UploadIcon, AdjustmentsHorizontalIcon, PencilSquareIcon } from './components/icons.tsx';
import { EQCheatSheet } from './components/EQCheatSheet.tsx';
import { MarkdownRenderer } from './components/MarkdownRenderer.tsx';
import { AIAssistant } from './components/AIAssistant.tsx';
import MixComparator from './components/MixComparator.tsx';
import { APP_TITLE, LOCAL_STORAGE_KEY, GENRE_SUGGESTIONS, VIBE_SUGGESTIONS, DAW_SUGGESTIONS, MIDI_DEFAULT_SETTINGS, MIDI_SCALES, MIDI_CHORD_PROGRESSIONS, MIDI_TEMPO_RANGES, LAST_USED_DAW_KEY, LAST_USED_PLUGINS_KEY } from './constants.ts';
import MidiGeneratorComponent from './components/MidiGeneratorComponent';
import { LibraryModal } from './components/LibraryModal.tsx';
import { stopPlayback } from './services/audioService.ts';
import './pages/MainPage.css'; // Import the CSS for the main grid layout

// Import the components for the three-column layout
import BlueprintYourSound from './components/BlueprintYourSound.tsx';
import TrackGuide from './components/TrackGuide.tsx';

// Import parser functions if they're in a separate file
import { 
  parseBpmFromGuidebook, 
  parseKeyFromGuidebook, 
  parseChordProgressionFromGuidebook,
  extractEssentialMidiContext,
  parseSuggestedTitleFromMarkdownStream
} from './utils/guidebookParser.ts';

const initialInputsState: UserInputs = {
  songTitle: '',
  genre: [],
  artistReference: '',
  vibe: [],
  daw: '',
  plugins: '',
  availableInstruments: '',
};

const initialMixFeedbackInputsState: MixFeedbackInputs = {
  audioFile: null,
  userNotes: '',
};

const MAX_AUDIO_FILE_SIZE_MB = 50;
const MAX_AUDIO_FILE_SIZE_BYTES = MAX_AUDIO_FILE_SIZE_MB * 1024 * 1024;

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ActiveView>('trackGuide');
  const [inputs, setInputs] = useState<UserInputs>(initialInputsState);
  const [currentGenreText, setCurrentGenreText] = useState('');
  const [currentVibeText, setCurrentVibeText] = useState('');
  const [generatedGuidebook, setGeneratedGuidebook] = useState<string>(""); // Initialize as empty for streaming
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [midiError, setMidiError] = useState<string | null>(null);
  const [library, setLibrary] = useState<GuidebookEntry[]>([]);
  const [activeGuidebookDetails, setActiveGuidebookDetails] = useState<GuidebookEntry | null>(null);
  const [showLibraryModal, setShowLibraryModal] = useState<boolean>(false);
  const [copyStatus, setCopyStatus] = useState<string>('');
  
  // New feature states
  const [showEQCheatSheet, setShowEQCheatSheet] = useState<boolean>(false);
  const [showAIAssistant, setShowAIAssistant] = useState<boolean>(false);
  const [useMarkdownRenderer, setUseMarkdownRenderer] = useState<boolean>(true);
  const [showMixComparator, setShowMixComparator] = useState<boolean>(false);

  // Mix Feedback State
  const [mixFeedbackInputs, setMixFeedbackInputs] = useState<MixFeedbackInputs>(initialMixFeedbackInputsState);
  const [mixFeedbackResult, setMixFeedbackResult] = useState<string | null>(null);
  const [isGeneratingMixFeedback, setIsGeneratingMixFeedback] = useState<boolean>(false);
  const [mixFeedbackError, setMixFeedbackError] = useState<string | null>(null);
  const audioFileInputRef = useRef<HTMLInputElement>(null);

  const genreInputRef = useRef<HTMLInputElement>(null);
  const vibeInputRef = useRef<HTMLInputElement>(null);

  // Add logging to help debug rendering issues
  useEffect(() => {
    console.log('App rendered, activeView:', activeView);
    console.log('activeGuidebookDetails available:', !!activeGuidebookDetails);
  }, [activeView, activeGuidebookDetails]);

  useEffect(() => {
    try {
      const savedLibrary = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedLibrary) {
        const parsedLibrary = JSON.parse(savedLibrary);
        const migratedLibrary = parsedLibrary.map((entry: any) => ({
          ...entry,
          genre: Array.isArray(entry.genre) ? entry.genre : (entry.genre ? [entry.genre] : []),
          vibe: Array.isArray(entry.vibe) ? entry.vibe : (entry.vibe ? [entry.vibe] : []),
          midiSettings: entry.midiSettings || undefined,
          generatedMidiPatterns: entry.generatedMidiPatterns || undefined,
        }));
        setLibrary(migratedLibrary);
      }
    } catch (e) {
      console.error("Failed to load library from local storage:", e);
      setLibrary([]); 
    }

    const lastUsedDAW = localStorage.getItem(LAST_USED_DAW_KEY);
    const lastUsedPlugins = localStorage.getItem(LAST_USED_PLUGINS_KEY);
    setInputs(prev => ({
        ...prev,
        daw: lastUsedDAW || prev.daw || '',
        plugins: lastUsedPlugins || prev.plugins || '',
    }));

  }, []);

  // Modify the render method to use the three-column layout
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 md:p-6 lg:p-8">
      <header className="text-center mb-6">
        <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-orange-400">
          {APP_TITLE}
        </h1>
        <p className="text-gray-400 mt-2 text-lg">Your AI Music Production Assistant</p>
      </header>
      
      <div className="mb-8 flex flex-col items-center space-y-4">
        <div className="flex justify-center space-x-3 md:space-x-4">
          <Button
            onClick={() => setActiveView('trackGuide')}
            variant={activeView === 'trackGuide' ? 'primary' : 'secondary'}
            className={`px-4 py-2 text-sm md:text-base rounded-md transition-all duration-150 ease-in-out ${activeView === 'trackGuide' ? 'bg-purple-600 shadow-lg' : 'bg-gray-700 hover:bg-gray-600'}`}
            leftIcon={<PencilSquareIcon className="w-5 h-5"/>}
          >
            TrackGuide AI
          </Button>
          <Button
            onClick={() => setActiveView('mixFeedback')}
            variant={activeView === 'mixFeedback' ? 'primary' : 'secondary'}
             className={`px-4 py-2 text-sm md:text-base rounded-md transition-all duration-150 ease-in-out ${activeView === 'mixFeedback' ? 'bg-teal-600 shadow-lg !focus:ring-teal-500' : 'bg-gray-700 hover:bg-gray-600'}`}
             style={activeView === 'mixFeedback' ? { backgroundColor: '#0D9488', borderColor: '#0D9488' } : {}}
            leftIcon={<AdjustmentsHorizontalIcon className="w-5 h-5"/>}
          >
            Mix Feedback AI
          </Button>
        </div>
        
        <div className="flex justify-center space-x-2 md:space-x-3 border-b border-gray-700 pb-3">
          <Button
            onClick={() => setShowEQCheatSheet(true)}
            variant="outline"
            size="sm"
            className="text-xs md:text-sm"
            leftIcon={<AdjustmentsHorizontalIcon className="w-4 h-4"/>}
          >
            EQ Cheat Sheet
          </Button>
          <Button
            onClick={() => setShowAIAssistant(true)}
            variant="outline"
            size="sm"
            className="text-xs md:text-sm"
            leftIcon={<SparklesIcon className="w-4 h-4"/>}
          >
            AI Assistant
          </Button>
          <Button
            onClick={() => setShowMixComparator(true)}
            variant="outline"
            size="sm"
            className="text-xs md:text-sm"
          >
            🎚️ Mix Comparator
          </Button>
          <Button
            onClick={() => setUseMarkdownRenderer(!useMarkdownRenderer)}
            variant="outline"
            size="sm"
            className="text-xs md:text-sm"
            leftIcon={<BookOpenIcon className="w-4 h-4"/>}
          >
            {useMarkdownRenderer ? 'Simple View' : 'Rich View'}
          </Button>
        </div>
      </div>

      {activeView === 'trackGuide' && (
        <div className="main-grid">
          <BlueprintYourSound 
            inputs={inputs}
            setInputs={setInputs}
            currentGenreText={currentGenreText}
            setCurrentGenreText={setCurrentGenreText}
            currentVibeText={currentVibeText}
            setCurrentVibeText={setCurrentVibeText}
            genreInputRef={genreInputRef}
            vibeInputRef={vibeInputRef}
            handleInputChange={handleInputChange}
            handleAddMultiSelectItem={handleAddMultiSelectItem}
            handleMultiSelectKeyDown={handleMultiSelectKeyDown}
            handleMultiSelectToggle={handleMultiSelectToggle}
            handleDAWSuggestionClick={handleDAWSuggestionClick}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            loadingMessage={loadingMessage}
            resetFormForNewGuidebook={resetFormForNewGuidebook}
            setShowLibraryModal={setShowLibraryModal}
          />
          
          <TrackGuide 
            error={error}
            midiError={midiError}
            generatedGuidebook={generatedGuidebook}
            isLoading={isLoading}
            loadingMessage={loadingMessage}
            activeGuidebookDetails={activeGuidebookDetails}
            handleSaveToLibrary={handleSaveToLibrary}
            handleCopyFormattedContent={handleCopyFormattedContent}
            copyStatus={copyStatus}
            useMarkdownRenderer={useMarkdownRenderer}
            renderMarkdown={renderMarkdown}
            trackGuideCardTitle={trackGuideCardTitle}
          />
          
          {activeGuidebookDetails && !isLoading && generatedGuidebook && !error && (
            <MidiGeneratorComponent 
              currentGuidebookEntry={activeGuidebookDetails}
              mainAppInputs={inputs}
              onUpdateGuidebookEntryMidi={handleUpdateGuidebookEntryMidi}
              parsedGuidebookBpm={parseBpmFromGuidebook(activeGuidebookDetails.content)}
              parsedGuidebookKey={parseKeyFromGuidebook(activeGuidebookDetails.content)}
              parsedGuidebookChordProg={parseChordProgressionFromGuidebook(activeGuidebookDetails.content)}
            />
          )}
        </div>
      )}

      {/* Rest of your component code... */}

      {showLibraryModal && (
        <LibraryModal
          library={library}
          onClose={() => setShowLibraryModal(false)}
          onLoadEntry={handleLoadFromLibrary}
          onDeleteEntry={handleDeleteFromLibrary}
          onCreateNew={resetFormForNewGuidebook}
        />
      )}

      <EQCheatSheet 
        isOpen={showEQCheatSheet} 
        onClose={() => setShowEQCheatSheet(false)} 
      />

      <AIAssistant
        isOpen={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
        currentGuidebook={activeGuidebookDetails || undefined}
        userInputs={inputs}
        onUpdateGuidebook={(content) => setGeneratedGuidebook(content)}
        onUpdateInputs={(newInputs) => setInputs(prev => ({ ...prev, ...newInputs }))}
      />
      
      <MixComparator
        isOpen={showMixComparator}
        onClose={() => setShowMixComparator(false)}
        onAnalyze={handleMixAnalysis}
      />

      <footer className="text-center mt-16 py-8 border-t border-gray-700/60">
        <p className="text-sm text-gray-500">{APP_TITLE} - AI Production Assistant</p>
      </footer>
    </div>
  );
};

export default App;