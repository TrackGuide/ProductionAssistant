
import React, { useEffect, useRef, useState } from 'react';
import { 
  UserInputs,
  GuidebookEntry,
  MidiSettings,
  MidiFromToplineSettings,
  GeneratedMidiPatterns,
  KeyOfGeneratedMidiPatterns,
  MixFeedbackInputs,
  ActiveView,
  ToplineAnalysis
} from './src/constants/types';

import { 
  generateGuidebookContent, 
  generateMidiPatternSuggestions, 
  generateMixFeedbackWithAudioStream,
  generateMixComparisonStream,
  analyzeTopline,
  generateGuidebookFromToplineStream,
  generateMidiFromTopline
} from './src/services/geminiService';

import { parseAiMidiResponse } from './src/utils/jsonParsingUtils';
import { Input } from './src/components/Input.tsx';
import { Textarea } from './src/components/Textarea.tsx';
import { Button } from './src/components/Button.tsx';
import { Card } from './src/components/Card.tsx';
import { Spinner } from './src/components/Spinner.tsx';
import { SaveIcon, BookOpenIcon, MusicNoteIcon, PlusIcon, UploadIcon, AdjustmentsHorizontalIcon, CloseIcon } from './src/components/icons.tsx';
import { AIAssistant } from './src/components/AIAssistant.tsx';
import { EQGuide } from './src/components/EQGuide';
import { LandingPage } from './src/components/LandingPage.tsx';
import { RemixGuideAI } from './src/components/RemixGuideAI.tsx';
import { PatchGuide } from './src/components/PatchGuide';
import { MidiGeneratorComponent } from './src/components/MidiGeneratorComponent.tsx';
import { LibraryModal } from './src/components/LibraryModal.tsx';
import { MarkdownRenderer } from './src/components/MarkdownRenderer.tsx';
import ToplineBuilderPanel from './src/components/ToplineBuilderPanel.tsx';
import { stopPlayback } from './src/services/audioService.ts';
import { generateToplineMidi } from './src/services/toplineMidi';
import { ensureToplineMelody } from './src/services/toplineMidi'; // adjust path as needed
import { transcribeTopline } from './src/services/deepgramTranscriber';

import { APP_TITLE, LOCAL_STORAGE_KEY, GENRE_SUGGESTIONS, VIBE_SUGGESTIONS, DAW_SUGGESTIONS, MIDI_DEFAULT_SETTINGS, MIDI_SCALES, MIDI_CHORD_PROGRESSIONS, MIDI_TEMPO_RANGES, LAST_USED_DAW_KEY, LAST_USED_PLUGINS_KEY } from './src/constants/constants';

// Simple logo
const TrackGuideLogo = ({ className = "w-4 h-4" }: { className?: string }) => (
  <div className={`${className} bg-orange-500 transform rotate-45 flex items-center justify-center`}>
    <div className="w-1/2 h-1/2 bg-white transform -rotate-45"></div>
  </div>
);

// ---------- Initial States ----------
const initialInputsState: UserInputs = {
  songTitle: '',
  genre: [],
  artistReference: '',
  referenceTrackLink: '',
  lyrics: '',
  key: '',
  scale: '',
  chords: '',
  generalNotes: '',
  vibe: [],
  daw: '',
  plugins: '',
  availableInstruments: '',
};

const initialMixFeedbackInputsState: MixFeedbackInputs = {
  audioFile: null,
  userNotes: '',
  trackName: '',
  dawName: '',
};

const MAX_AUDIO_FILE_SIZE_MB = 100;
const MAX_AUDIO_FILE_SIZE_BYTES = MAX_AUDIO_FILE_SIZE_MB * 1024 * 1024;

// ---------- Helpers (BPM/Key/Chords parsing from text) ----------
export const parseBpmFromGuidebook = (content: string): number | null => {
  const patterns = [
    /Tempo.*?(\d+)\s*(?:-|to)\s*(\d+)\s*BPM/i,
    /BPM.*?(\d+)\s*(?:-|to)\s*(\d+)/i,
    /(\d+)\s*(?:-|to)\s*(\d+)\s*BPM/i,
    /Tempo.*?(\d+)\s*BPM/i,
    /BPM.*?(\d+)/i,
    /(\d+)\s*BPM/i
  ];
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      if (match[2]) return Math.round((parseInt(match[1], 10) + parseInt(match[2], 10)) / 2);
      if (match[1]) return parseInt(match[1], 10);
    }
  }
  return null;
};

export const parseKeyFromGuidebook = (content: string): string | null => {
  const patterns = [
    /Suggested Key\(s\) \/ Scale\(s\):\s*([^(\n]+)/i,
    /Key.*?:\s*([A-G][#b]?\s*(?:Major|Minor|major|minor))/i,
    /([A-G][#b]?\s*(?:Major|Minor|major|minor))/i
  ];
  for (const pattern of patterns) {
    const keyMatch = content.match(pattern);
    if (keyMatch && keyMatch[1]) {
      const keys = keyMatch[1].split(/,|\/| or /).map(k => k.trim().replace(/\.$/, ''));
      for (const k of keys) {
        const normalizedKey = k.includes(" Minor") || k.includes(" minor") ? 
          k.replace(/minor/i, "Minor") : 
          k.replace(/major/i, "Major").replace(/Major$/, "").trim() + " Major";
        if ((MIDI_SCALES as any).includes(k) || (MIDI_SCALES as any).includes(normalizedKey)) {
          return (MIDI_SCALES as any).includes(k) ? k : normalizedKey;
        }
      }
      const firstKey = keys[0];
      if (firstKey) return firstKey;
    }
  }
  return null;
};

export const parseChordProgressionFromGuidebook = (content: string): string | null => {
  const patterns = [
    /Chord Progression\(s\)?:\s*([^\n]+)/i,
    /Progression\(s\)?:\s*([^\n]+)/i,
    /Chords?:\s*([ivclxmdIVCLXMDab#ø°dimaug\d\/sus-][^\n]*)/i,
    /([ivclxmdIVCLXMD]+(?:\s*-\s*[ivclxmdIVCLXMD]+){2,})/i
  ];
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      let p = match[1].trim();
      if (p.endsWith('.')) p = p.slice(0, -1);
      return p.split(/[,;] /)[0].trim();
    }
  }
  return null;
};

const extractSectionContent = (markdownText: string, sectionTitleRegex: RegExp): string => {
  const match = markdownText.match(sectionTitleRegex);
  if (!match || typeof match.index === 'undefined') return "";
  const startIndex = match.index;
  const nextSectionMatch = markdownText.substring(startIndex + match[0].length).match(/^##\s+/m);
  const endIndex = nextSectionMatch && typeof nextSectionMatch.index !== 'undefined' 
                   ? startIndex + match[0].length + nextSectionMatch.index 
                   : markdownText.length;
  return markdownText.substring(startIndex, endIndex).trim();
};

const extractEssentialMidiContext = (guidebookContent: string): string => {
  if (!guidebookContent) return "";
  let essentialContext = "";
  const overviewSectionRegex = /^##\s*1\.\s*Song Overview/im;
  essentialContext += extractSectionContent(guidebookContent, overviewSectionRegex) + "\\n\\n";
  const harmonySectionRegex = /^##\s*4\.\s*Harmony, Melody & Rhythmic Core/im;
  essentialContext += extractSectionContent(guidebookContent, harmonySectionRegex);
  return essentialContext.trim() || "General musical context not fully parsed. Focus on genre and vibe.";
};

const parseSuggestedTitleFromMarkdownStream = (markdownText: string): string | null => {
  const match = markdownText.match(/^\s*-\s*\*\*Suggested Title:\*\*\s*(.*)/im);
  if (match && match[1]) {
    return match[1].trim().replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1');
  }
  return null;
};

// ---------- Component ----------
const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ActiveView>('landing');
  const [inputs, setInputs] = useState<UserInputs>(initialInputsState);
  const [currentGenreText, setCurrentGenreText] = useState('');
  const [currentVibeText, setCurrentVibeText] = useState('');
  const [generatedGuidebook, setGeneratedGuidebook] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [midiError, setMidiError] = useState<string | null>(null);
  const [library, setLibrary] = useState<GuidebookEntry[]>([]);
  const [activeGuidebookDetails, setActiveGuidebookDetails] = useState<GuidebookEntry | null>(null);
  const [showLibraryModal, setShowLibraryModal] = useState<boolean>(false);
  const [copyStatus, setCopyStatus] = useState<string>('');
  const [showAdvancedInput, setShowAdvancedInput] = useState<boolean>(false);

  // NEW: topline
  const [toplineFile, setToplineFile] = useState<File | null>(null);
  const [toplineAnalysis, setToplineAnalysis] = useState<ToplineAnalysis | null>(null);
  const [toplineAnalyzeStatus, setToplineAnalyzeStatus] = useState<string>('');

  // Coach
  const [isProductionCoachCollapsed, setIsProductionCoachCollapsed] = useState<boolean>(true);

  // Mix Feedback State
  const [mixFeedbackInputs, setMixFeedbackInputs] = useState<MixFeedbackInputs>(initialMixFeedbackInputsState);
  const [mixFeedbackResult, setMixFeedbackResult] = useState<string | null>(null);
  const [streamingMixFeedback, setStreamingMixFeedback] = useState<string>('');
  const [isGeneratingMixFeedback, setIsGeneratingMixFeedback] = useState<boolean>(false);
  const [mixFeedbackError, setMixFeedbackError] = useState<string | null>(null);
  const [mixFeedbackTab, setMixFeedbackTab] = useState<'single' | 'compare'>('single');

  // Mix comparison
  const [mixCompareInputs, setMixCompareInputs] = useState<{ mixA: File | null; mixB: File | null; userNotes: string; includeMixBFeedback?: boolean; }>({
    mixA: null, mixB: null, userNotes: '', includeMixBFeedback: false
  });
  const [mixCompareResult, setMixCompareResult] = useState<string | null>(null);
  const [streamingMixComparison, setStreamingMixComparison] = useState<string>('');
  const [isGeneratingMixComparison, setIsGeneratingMixComparison] = useState<boolean>(false);
  const [mixCompareError, setMixCompareError] = useState<string | null>(null);
  const audioFileInputRef = useRef<HTMLInputElement>(null);

  // Assistants context
  const [remixGuideContent, setRemixGuideContent] = useState<string>('');
  const [patchGuideContent, setPatchGuideContent] = useState<string>('');

  const genreInputRef = useRef<HTMLInputElement>(null);
  const vibeInputRef = useRef<HTMLInputElement>(null);

  // ---------- storage hydrate ----------
  useEffect(() => {
    try {
      const savedLibrary = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedLibrary) {
        const parsed = JSON.parse(savedLibrary);
        const migrated = parsed.map((entry: any) => ({
          ...entry,
          genre: Array.isArray(entry.genre) ? entry.genre : (entry.genre ? [entry.genre] : []),
          vibe: Array.isArray(entry.vibe) ? entry.vibe : (entry.vibe ? [entry.vibe] : []),
          scale: entry.scale || '',
          midiSettings: entry.midiSettings || undefined,
          generatedMidiPatterns: entry.generatedMidiPatterns || undefined,
        }));
        setLibrary(migrated);
      }
    } catch (e) {
      console.error('Failed to load library', e);
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

  useEffect(() => {
    try { localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(library)); }
    catch (e) { console.error('Failed to save library', e); }
  }, [library]);

  useEffect(() => {
    if (activeView !== 'remixGuide') setRemixGuideContent('');
    if (activeView !== 'patchGuide') setPatchGuideContent('');
  }, [activeView]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'currentGenreText') setCurrentGenreText(value);
    else if (name === 'currentVibeText') setCurrentVibeText(value);
    else {
      setInputs(prev => ({ ...prev, [name]: value }));
      if (name === 'daw') localStorage.setItem(LAST_USED_DAW_KEY, value);
      else if (name === 'plugins') localStorage.setItem(LAST_USED_PLUGINS_KEY, value);
    }
  };

  const handleAddMultiSelectItem = (type: 'genre' | 'vibe') => {
    const text = type === 'genre' ? currentGenreText.trim() : currentVibeText.trim();
    if (text && !inputs[type].includes(text)) {
      setInputs(prev => ({ ...prev, [type]: [...prev[type], text] }));
    }
    if (type === 'genre') { setCurrentGenreText(''); genreInputRef.current?.focus(); }
    else { setCurrentVibeText(''); vibeInputRef.current?.focus(); }
  };

  const handleMultiSelectKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, type: 'genre' | 'vibe') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddMultiSelectItem(type);
    }
  };

  const handleMultiSelectToggle = (field: 'genre' | 'vibe', value: string) => {
    setInputs(prev => ({ ...prev, [field]: prev[field].filter(v => v !== value) }));
  };

  const handleDAWSuggestionClick = (value: string) => {
    setInputs(prev => ({ ...prev, daw: value }));
    localStorage.setItem(LAST_USED_DAW_KEY, value);
  };

  const extractAiGeneratedTitleFromMarkdown = (markdownText: string): string | null => {
    const match = markdownText.match(/^#\s*TRACKGUIDE:\s*"?([^"\n]+)"?/im);
    return match && match[1] ? match[1].trim() : null;
  };

  const resetFormForNewGuidebook = () => {
    const lastUsedDAW = localStorage.getItem(LAST_USED_DAW_KEY) || '';
    const lastUsedPlugins = localStorage.getItem(LAST_USED_PLUGINS_KEY) || '';
    setInputs({
      ...initialInputsState,
      songTitle: '',
      daw: lastUsedDAW,
      plugins: lastUsedPlugins,
    });
    setCurrentGenreText('');
    setCurrentVibeText('');
    setGeneratedGuidebook('');
    setActiveGuidebookDetails(null);
    setError(null);
    setMidiError(null);
    setCopyStatus('');
    stopPlayback();
    setShowLibraryModal(false);
    // topline
    setToplineFile(null);
    setToplineAnalysis(null);
    setToplineAnalyzeStatus('');
  };

  // ---------- Topline: auto-analyze when chosen ----------
  useEffect(() => {
    const doAnalyze = async () => {
      if (!toplineFile) return;
      try {
        setToplineAnalyzeStatus('Analyzing vocal…');
        const result = await analyzeTopline({
          file: toplineFile,
          filename: toplineFile.name,
          context: {
            genre: inputs.genre,
            key: inputs.key,
            scale: inputs.scale,
            chords: inputs.chords,
            notes: inputs.generalNotes
          }
        } as any);
        setToplineAnalysis(result as ToplineAnalysis);
        setToplineAnalyzeStatus('Topline analyzed ✓');
        const anyRes: any = result;
        setInputs(prev => ({
          ...prev,
          lyrics: prev.lyrics || anyRes?.lyrics || anyRes?.transcribedLyrics || prev.lyrics,
          key: prev.key || anyRes?.key || anyRes?.detectedKey || prev.key,
          scale: prev.scale || anyRes?.scale || anyRes?.detectedScale || prev.scale,
          chords: prev.chords || anyRes?.chords || anyRes?.suggestedChords || prev.chords,
        }));
      } catch (err: any) {
        console.error('topline analyze failed', err);
        setToplineAnalyzeStatus(`error: ${err?.message || 'failed to analyze'}`);
      }
    };
    doAnalyze();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toplineFile]);

  // ---------- Submit ----------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMidiError(null);
    setGeneratedGuidebook("");
    setActiveGuidebookDetails(null);
    setCopyStatus('');
    stopPlayback();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (inputs.daw) localStorage.setItem(LAST_USED_DAW_KEY, inputs.daw);
    if (inputs.plugins) localStorage.setItem(LAST_USED_PLUGINS_KEY, inputs.plugins);

    let finalGuidebookContent = "";
    let initialPatternsData: GeneratedMidiPatterns | undefined;
    let finalMidiSettings: MidiSettings | undefined;

    try {
      setLoadingMessage('TrackGuide is generating...');

      let guidebookStream: AsyncIterable<{ text: string }>;
      if (toplineFile) {
        guidebookStream = await generateGuidebookFromToplineStream({
          inputs,
          file: toplineFile,
          analysis: toplineAnalysis || undefined,
        } as any);
      } else {
        guidebookStream = await generateGuidebookContent(inputs);
      }

      for await (const chunk of guidebookStream) {
        finalGuidebookContent += chunk.text;
        setGeneratedGuidebook(prev => prev + chunk.text);
      }

      setLoadingMessage('Initial MIDI patterns are generating...');

      const aiGeneratedTitle = extractAiGeneratedTitleFromMarkdown(finalGuidebookContent);
      const entryTitle = inputs.songTitle?.trim() ? inputs.songTitle.trim() : (aiGeneratedTitle || `TrackGuide for ${inputs.genre.join(', ') || 'Unknown Genre'}`);
      
      const newEntryId = Date.now().toString();
      const createdAt = new Date().toISOString();
      
      const parsedBpm = parseBpmFromGuidebook(finalGuidebookContent);
      const parsedKey = parseKeyFromGuidebook(finalGuidebookContent);
      const parsedProg = parseChordProgressionFromGuidebook(finalGuidebookContent);
      const primaryGenre = inputs.genre[0] || (MIDI_DEFAULT_SETTINGS as any).genre;
      
      const tempoRange = (MIDI_TEMPO_RANGES as any)[primaryGenre] || (MIDI_TEMPO_RANGES as any).Default;
      const defaultTempoForGenre = Math.round((tempoRange[0] + tempoRange[1]) / 2);
      const defaultChordProgForGenre = ((MIDI_CHORD_PROGRESSIONS as any)[primaryGenre] || (MIDI_CHORD_PROGRESSIONS as any).Default)[0];

      const essentialMidiContext = extractEssentialMidiContext(finalGuidebookContent);
      const initialSongSection = (MIDI_DEFAULT_SETTINGS as any).songSection; 
      
      let initialBars = 8;
      const primaryGenreLower = String(primaryGenre).toLowerCase();
      const shortLoopGenres = ['lo-fi hip hop','lofi hip hop','lofi','trap','ambient','idm','breakcore','footwork','juke','experimental'];
      if (shortLoopGenres.some(g => primaryGenreLower.includes(g))) initialBars = 4;
      const initialTargetInstruments: KeyOfGeneratedMidiPatterns[] = ['chords','bassline','melody','drums'];

      finalMidiSettings = {
        key: parsedKey || (MIDI_DEFAULT_SETTINGS as any).key,
        tempo: parsedBpm || defaultTempoForGenre,
        timeSignature: (MIDI_DEFAULT_SETTINGS as any).timeSignature,
        chordProgression: parsedProg || defaultChordProgForGenre,
        genre: primaryGenre,
        bars: initialBars,
        targetInstruments: initialTargetInstruments, 
        guidebookContext: essentialMidiContext,
        songSection: initialSongSection,
      };

      try {
        const midiStream = await generateMidiPatternSuggestions(finalMidiSettings);
        let accumulatedMidiJson = "";
        for await (const chunk of midiStream) {
          accumulatedMidiJson += chunk.text;
        }
        initialPatternsData = parseAiMidiResponse<GeneratedMidiPatterns>(accumulatedMidiJson, 'initial MIDI generation');
        if ((initialPatternsData as any)?.drums) {
          const lowercasedDrums: any = {};
          for (const key in (initialPatternsData as any).drums) {
            lowercasedDrums[key.toLowerCase().replace(/\s+/g, '_')] = (initialPatternsData as any).drums[key];
          }
          (initialPatternsData as any).drums = lowercasedDrums;
        }
        setMidiError(null);


// ...

if (toplineAnalysis) {
  try {
    initialPatternsData = ensureToplineMelody(
      initialPatternsData || {},
      toplineAnalysis,
      {
        bars: finalMidiSettings?.bars,
        timeSignature: finalMidiSettings?.timeSignature,
        defaultVelocity: 92, // optional override
      }
    );
  } catch (err) {
    console.error("Topline melody merge failed:", err);
  }
}


        
      } catch (midiErr: any) {
        console.error("Initial MIDI generation failed:", midiErr);
        setMidiError((midiErr?.message || "MIDI generation failed.") + " You can try generating MIDI manually in the MIDI tools section.");
        initialPatternsData = undefined;
      }

      setActiveGuidebookDetails({
        id: newEntryId,
        title: entryTitle,
        genre: inputs.genre,
        artistReference: inputs.artistReference,
        referenceTrackLink: inputs.referenceTrackLink,
        lyrics: toplineAnalysis?.lyrics?.trim()
  ? toplineAnalysis.lyrics.trim()
  : inputs.lyrics,
        key: inputs.key,
        chords: inputs.chords,
        generalNotes: inputs.generalNotes,
        vibe: inputs.vibe,
        daw: inputs.daw,
        plugins: inputs.plugins,
        availableInstruments: inputs.availableInstruments || '',
        content: finalGuidebookContent,
        createdAt,
        midiSettings: finalMidiSettings, 
        generatedMidiPatterns: initialPatternsData,
      });

    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred while generating TrackGuide.');
      setActiveGuidebookDetails(null);
      setGeneratedGuidebook("");
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleSaveToLibrary = () => {
    if (!activeGuidebookDetails) return;
    const entryToSave: GuidebookEntry = { ...activeGuidebookDetails };
    setLibrary(prev => {
      const existingIndex = prev.findIndex(item => item.id === entryToSave.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = entryToSave;
        return updated;
      }
      return [entryToSave, ...prev];
    });
  };

  const handleUpdateGuidebookEntryMidi = (midiSettings: MidiSettings, generatedMidiPatterns: GeneratedMidiPatterns) => {
    setActiveGuidebookDetails(prev => prev ? ({ ...prev, midiSettings, generatedMidiPatterns }) : prev);
  };

  const handleLoadFromLibrary = (entry: GuidebookEntry) => {
    setInputs({ 
      songTitle: entry.title, 
      genre: Array.isArray(entry.genre) ? entry.genre : (entry.genre ? [String(entry.genre)] : []),
      artistReference: entry.artistReference,
      referenceTrackLink: entry.referenceTrackLink || '',
      lyrics: entry.lyrics || '',
      key: entry.key || '',
      chords: entry.chords || '',
      generalNotes: entry.generalNotes || '',
      vibe: Array.isArray(entry.vibe) ? entry.vibe : (entry.vibe ? [String(entry.vibe)] : []),
      daw: entry.daw,
      plugins: entry.plugins,
      availableInstruments: entry.availableInstruments || '',
    });
    setCurrentGenreText('');
    setCurrentVibeText('');
    setGeneratedGuidebook(entry.content);
    setActiveGuidebookDetails(entry); 
    setError(null);
    setMidiError(null);
    setCopyStatus('');
    stopPlayback();
    setShowLibraryModal(false);
    setActiveView('trackGuide'); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteFromLibrary = (id: string) => {
    setLibrary(prev => prev.filter(entry => entry.id !== id));
    if (activeGuidebookDetails && activeGuidebookDetails.id === id) {
      setGeneratedGuidebook('');
      setActiveGuidebookDetails(null);
      stopPlayback();
    }
  };

  // ---------- Simple renderer helpers ----------
  const SelectedPills: React.FC<{ selections: string[], onRemove: (value: string) => void }> = ({ selections, onRemove }) => (
    <div className="flex flex-wrap gap-2 mt-2 mb-2 min-h-[2.25rem]">
      {selections.map((selection) => (
        <span key={selection} className="flex items-center px-3 py-1 bg-orange-600 text-white text-xs font-medium rounded-full shadow-md hover:bg-orange-700 transition-colors">
          {selection}
          <button type="button" onClick={() => onRemove(selection)} className="ml-1.5 -mr-0.5 p-0.5 text-orange-200 hover:text-white rounded-full focus:outline-none focus:bg-orange-800 transition-colors" aria-label={`Remove ${selection}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
          </button>
        </span>
      ))}
    </div>
  );

  // ---------- Mix Feedback ----------
  const handleMixAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_AUDIO_FILE_SIZE_BYTES) {
        setMixFeedbackError(`File is too large. Maximum size is ${MAX_AUDIO_FILE_SIZE_MB}MB.`);
        setMixFeedbackInputs(prev => ({ ...prev, audioFile: null }));
        if (audioFileInputRef.current) audioFileInputRef.current.value = "";
        return;
      }
      if (!file.type.startsWith('audio/')) {
        setMixFeedbackError('Invalid file type. Please upload audio.');
        setMixFeedbackInputs(prev => ({ ...prev, audioFile: null }));
        if (audioFileInputRef.current) audioFileInputRef.current.value = "";
        return;
      }
      setMixFeedbackInputs(prev => ({ ...prev, audioFile: file }));
      setMixFeedbackError(null);
    }
  };

  const handleGetMixFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mixFeedbackInputs.audioFile) {
      setMixFeedbackError("Please upload an audio file for feedback.");
      return;
    }
    setIsGeneratingMixFeedback(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setMixFeedbackResult(null);
    setStreamingMixFeedback('');
    setMixFeedbackError(null);

    try {
      let fullFeedback = '';
      const stream = generateMixFeedbackWithAudioStream(mixFeedbackInputs);
      for await (const chunk of stream) {
        if ((chunk as any).text) {
          fullFeedback += (chunk as any).text;
          setStreamingMixFeedback(fullFeedback);
        }
      }
      setMixFeedbackResult(fullFeedback.trim());
      setStreamingMixFeedback('');
    } catch (err: any) {
      console.error('MixFeedback error:', err);
      setMixFeedbackError(err?.message || "Unknown error while generating mix feedback.");
      setStreamingMixFeedback('');
    } finally {
      setIsGeneratingMixFeedback(false);
    }
  };

  const resetMixFeedbackForm = () => {
    setMixFeedbackInputs(initialMixFeedbackInputsState);
    setMixFeedbackResult(null);
    setMixFeedbackError(null);
    if (audioFileInputRef.current) audioFileInputRef.current.value = "";
  };

  const handleCompareMixes = async () => {
    if (!mixCompareInputs.mixA || !mixCompareInputs.mixB) {
      setMixCompareError("Please upload both Mix A and Mix B.");
      return;
    }
    setIsGeneratingMixComparison(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setMixCompareResult(null);
    setStreamingMixComparison('');
    setMixCompareError(null);
    
    try {
      const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const mixABase64 = await toBase64(mixCompareInputs.mixA);
      const mixBBase64 = await toBase64(mixCompareInputs.mixB);
      const comparisonInput = {
        mixAFile: mixABase64,
        mixBFile: mixBBase64,
        mixAName: mixCompareInputs.mixA.name,
        mixBName: mixCompareInputs.mixB.name,
        includeMixBFeedback: mixCompareInputs.includeMixBFeedback,
        userNotes: mixCompareInputs.userNotes
      };
      let fullComparison = '';
      const stream = generateMixComparisonStream(comparisonInput as any);
      for await (const chunk of stream) {
        if ((chunk as any).text) {
          fullComparison += (chunk as any).text;
          setStreamingMixComparison(fullComparison);
        }
      }
      setMixCompareResult(fullComparison.trim());
      setStreamingMixComparison('');
    } catch (err: any) {
      setMixCompareError(err?.message || "Unknown error while comparing mixes.");
      setStreamingMixComparison('');
    } finally {
      setIsGeneratingMixComparison(false);
    }
  };

  const resetMixCompareForm = () => {
    setMixCompareInputs({ mixA: null, mixB: null, userNotes: '', includeMixBFeedback: false });
    setMixCompareResult(null);
    setMixCompareError(null);
  };

  // ---------- TrackGuide Title ----------
  let trackGuideCardTitle;
  const userProvidedSongTitle = inputs.songTitle?.trim();
  if (userProvidedSongTitle) trackGuideCardTitle = `TrackGuide: ${userProvidedSongTitle}`;
  else if (activeGuidebookDetails?.title) trackGuideCardTitle = `TrackGuide: ${activeGuidebookDetails.title}`;
  else if (isLoading && activeView === 'trackGuide') trackGuideCardTitle = "TrackGuide is generating...";
  else trackGuideCardTitle = "TrackGuide";

  // ---------- Landing ----------
  if (activeView === 'landing') {
    return <LandingPage onGetStarted={() => {
      setActiveView('trackGuide');
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
    }} />;
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-gray-100 p-4 md:p-6 lg:p-8 relative overflow-hidden">
      {/* Header */}
      <header className="text-center mb-6 relative z-10">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-orange-500 transform rotate-45 flex items-center justify-center">
            <div className="w-4 h-4 bg-white transform -rotate-45"></div>
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-white">{APP_TITLE}</h1>
            <p className="text-gray-400 text-lg">Your Smartest Studio Assistant</p>
          </div>
        </div>
        <button onClick={() => setActiveView('landing')} className="mt-2 text-sm text-orange-500 hover:text-orange-400 transition-colors font-medium">← Back to Landing</button>
      </header>

      {/* Nav */}
      <nav className="mb-8 flex flex-col justify-center items-center md:flex-row md:justify-center gap-2 border-b border-orange-500/20 pb-3 relative z-10">
        <Button size="sm" className={`w-full md:w-auto px-3 py-2 text-xs md:text-sm rounded-md ${activeView==='trackGuide'?'bg-orange-500 shadow-lg hover:bg-orange-600':'bg-gray-700/80 hover:bg-gray-600/80 border border-gray-600'}`} onClick={()=>setActiveView('trackGuide')} variant={activeView==='trackGuide'?'primary':'secondary'} leftIcon={<TrackGuideLogo className="w-4 h-4" />}>TrackGuide AI</Button>
        <Button size="sm" className={`w-full md:w-auto px-3 py-2 text-xs md:text-sm rounded-md ${activeView==='mixFeedback'?'bg-orange-500 shadow-lg hover:bg-orange-600':'bg-gray-700/80 hover:bg-gray-600/80 border border-gray-600'}`} onClick={()=>setActiveView('mixFeedback')} variant={activeView==='mixFeedback'?'primary':'secondary'} leftIcon={<span className="w-4 h-4 text-center">🎚️</span>}>Mix Feedback AI</Button>
        <Button size="sm" className={`w-full md:w-auto px-3 py-2 text-xs md:text-sm rounded-md ${activeView==='remixGuide'?'bg-orange-500 shadow-lg hover:bg-orange-600':'bg-gray-700/80 hover:bg-gray-600/80 border border-gray-600'}`} onClick={()=>setActiveView('remixGuide')} variant={activeView==='remixGuide'?'primary':'secondary'} leftIcon={<span className="w-4 h-4 text-center">🎛️</span>}>RemixGuide AI</Button>
        <Button size="sm" className={`w-full md:w-auto px-3 py-2 text-xs md:text-sm rounded-md ${activeView==='patchGuide'?'bg-orange-500 shadow-lg hover:bg-orange-600':'bg-gray-700/80 hover:bg-gray-600/80 border border-gray-600'}`} onClick={()=>setActiveView('patchGuide')} variant={activeView==='patchGuide'?'primary':'secondary'} leftIcon={<span className="w-4 h-4 text-center">🎹</span>}>PatchGuide AI</Button>
        <Button size="sm" className={`w-full md:w-auto px-3 py-2 text-xs md:text-sm rounded-md ${activeView==='eqGuide'?'bg-orange-500 shadow-lg hover:bg-orange-600':'bg-gray-700/80 hover:bg-gray-600/80 border border-gray-600'}`} onClick={()=>setActiveView('eqGuide')} variant={activeView==='eqGuide'?'primary':'secondary'} leftIcon={<AdjustmentsHorizontalIcon className="w-4 h-4" />}>EQ Guide</Button>
      </nav>

      {activeView === 'trackGuide' && (
        <div className="max-w-full mx-auto grid grid-cols-1 lg:grid-cols-7 gap-6 px-4">
          <Card title="Blueprint Your Sound" className="lg:col-span-2 bg-gray-800/80 backdrop-blur-md shadow-xl border border-gray-700/50">
            <p className="text-sm text-gray-400 mb-4">Describe your vision—everything's optional.</p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div><Input label="Song Title / Project Name" name="songTitle" value={inputs.songTitle || ''} onChange={handleInputChange} placeholder="AI will suggest one if left blank" /></div>
              <div><Input label="Artist References" name="artistReference" value={inputs.artistReference} onChange={handleInputChange} placeholder="e.g., Daft Punk" /></div>
              <div><Input label="Song Reference" name="referenceTrackLink" value={inputs.referenceTrackLink || ''} onChange={handleInputChange} placeholder="e.g., YouTube, Spotify, SoundCloud link" /></div>

              {/* Genre / Vibe */}
              <div className="space-y-2">
                <div>
                  <label htmlFor="genre-input" className="block text-sm font-medium text-gray-300 mb-1.5">Genre(s)</label>
                  <div className="flex items-center gap-2">
                    <Input ref={genreInputRef as any} id="genre-input" name="currentGenreText" value={currentGenreText} onChange={handleInputChange} onKeyDown={(e)=>handleMultiSelectKeyDown(e,'genre')} placeholder="Type custom genre..." list="genre-suggestions" className="flex-grow" />
                    <Button type="button" onClick={()=>handleAddMultiSelectItem('genre')} size="sm" variant="secondary" aria-label="Add Genre" className="px-3"><PlusIcon className="w-4 h-4" /></Button>
                  </div>
                  <datalist id="genre-suggestions">{GENRE_SUGGESTIONS.map(s => <option key={s} value={s} />)}</datalist>
                  <SelectedPills selections={inputs.genre} onRemove={(val)=>handleMultiSelectToggle('genre', val)} />
                </div>
                <div>
                  <label htmlFor="vibe-input" className="block text-sm font-medium text-gray-300 mb-1.5">Vibe / Mood</label>
                  <div className="flex items-center gap-2">
                    <Input ref={vibeInputRef as any} id="vibe-input" name="currentVibeText" value={currentVibeText} onChange={handleInputChange} onKeyDown={(e)=>handleMultiSelectKeyDown(e,'vibe')} placeholder="Type custom vibe..." list="vibe-suggestions" className="flex-grow" />
                    <Button type="button" onClick={()=>handleAddMultiSelectItem('vibe')} size="sm" variant="secondary" aria-label="Add Vibe" className="px-3"><PlusIcon className="w-4 h-4" /></Button>
                  </div>
                  <datalist id="vibe-suggestions">{VIBE_SUGGESTIONS.map(s => <option key={s} value={s} />)}</datalist>
                  <SelectedPills selections={inputs.vibe} onRemove={(val)=>handleMultiSelectToggle('vibe', val)} />
                </div>
              </div>

              <div>
                <Input label="Preferred DAW" name="daw" value={inputs.daw} onChange={handleInputChange} placeholder="Type or select DAW..." list="daw-suggestions" />
                <datalist id="daw-suggestions">{DAW_SUGGESTIONS.map(s => <option key={s} value={s} />)}</datalist>
                <div className="flex flex-wrap gap-2 mt-2 mb-1">
                  {DAW_SUGGESTIONS.slice(0,5).map(s => (
                    <button key={s} type="button" onClick={()=>handleDAWSuggestionClick(s)} className={`px-3 py-1 text-xs rounded-full ${inputs.daw===s?'bg-orange-600 text-white ring-2 ring-orange-400 ring-offset-2 ring-offset-gray-800':'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-gray-100'}`}>{s}</button>
                  ))}
                </div>
              </div>

              <div><Textarea label="Available Plugins" name="plugins" value={inputs.plugins} onChange={handleInputChange} placeholder="e.g., Serum, Valhalla Reverbs, Arturia V Collection, or 'stock only'" rows={2} /></div>
              <div><Textarea label="Available Instruments" name="availableInstruments" value={inputs.availableInstruments || ''} onChange={handleInputChange} placeholder="e.g., Electric Guitar, Moog Subsequent 37, Roland TR-808, Vocals" rows={2} /></div>

              {/* Advanced */}
              <div className="border-t border-gray-600 pt-4">
                <Button type="button" onClick={()=>setShowAdvancedInput(!showAdvancedInput)} variant="outline" className="mb-4 w-8 h-8 p-0 flex items-center justify-center" title={showAdvancedInput ? 'Hide Advanced Input' : 'Show Advanced Input'}>
                  <span className={`text-lg transition-transform ${showAdvancedInput ? 'rotate-45':''}`}>+</span>
                </Button>

                {showAdvancedInput && (
                  <div className="space-y-4 p-4 bg-gray-700/30 rounded-lg border border-gray-600/50">
                    {/* Key / Scale */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><Input label="Key" name="key" value={inputs.key || ''} onChange={handleInputChange} placeholder="e.g., C Major" /></div>
                      <div><Input label="Scale/Mode" name="scale" value={inputs.scale || ''} onChange={handleInputChange} placeholder="e.g., Dorian, Mixolydian" /></div>
                    </div>

                    {/* Build Around Vocal */}
                    <div className="mt-6 border-t border-gray-600 pt-4">
                      <h4 className="text-sm font-semibold text-gray-200 mb-3">Additional Options</h4>
                      <div className="mt-2 border rounded p-3 bg-gray-700/30">
                        <h5 className="font-semibold mb-2 text-gray-100">🎤 Build Around Vocal (Auto)</h5>

                        {/* Lightweight inline uploader */}
                        <div className="space-y-2">
                          <label className="block text-xs text-gray-300 mb-1">Upload Vocal / Topline (optional)</label>
                          <input
                            type="file"
                            accept="audio/*"
                            onChange={(e)=>setToplineFile(e.target.files?.[0] || null)}
                            className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2"
                          />
                          {toplineAnalyzeStatus && <p className={`text-xs ${toplineAnalyzeStatus.startsWith('error')?'text-red-400':'text-green-400'}`}>{toplineAnalyzeStatus}</p>}
                        </div>

                        {/* Advanced panel (kept, if you also want the dedicated UI) */}
                        <ToplineBuilderPanel
                          inputs={inputs}
                          defaultMidi={{
                            tempo: 120,
                            timeSignature: [4,4],
                            bars: 8,
                            targetInstruments: ["chords","bassline","melody","drums"],
                            songSection: "Verse",
                          }}
                          onGuideDone={(fullGuide: string) => {
                            setGeneratedGuidebook(fullGuide);
                            setActiveGuidebookDetails(prev => (prev ? { ...prev, content: fullGuide } : prev));
                          }}
                          onMidiReady={(midi) => {
                            setActiveGuidebookDetails(prev => (prev ? { ...prev, generatedMidiPatterns: midi } : prev));
                          }}
                        />
                      </div>
                    </div>

                    {/* Chords / Lyrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><Input label="Chords" name="chords" value={inputs.chords || ''} onChange={handleInputChange} placeholder="e.g., Am - F - C - G" /></div>
                      <div><Textarea label="Lyrics" name="lyrics" value={inputs.lyrics || ''} onChange={handleInputChange} placeholder="Paste your lyrics here if you have any..." rows={2} /></div>
                    </div>

                    <div><Textarea label="General Notes for AI" name="generalNotes" value={inputs.generalNotes || ''} onChange={handleInputChange} placeholder="Any specific instructions, style notes, or creative direction for the AI to consider..." rows={3} /></div>
                  </div>
                )}
              </div>

              <Button type="submit" disabled={isLoading} className="w-full text-base py-2.5" leftIcon={<TrackGuideLogo className="w-5 h-5"/>}>
                {isLoading ? (loadingMessage || 'Generating...') : 'Generate TrackGuide'}
              </Button>
              <div className="flex space-x-2 mt-3">
                <Button type="button" onClick={()=>setShowLibraryModal(true)} variant="secondary" className="flex-1" leftIcon={<BookOpenIcon className="w-4 h-4"/>}>View Library</Button>
                <Button type="button" onClick={resetFormForNewGuidebook} variant="outline" className="flex-1">Clear Form</Button>
              </div>
            </form>
          </Card>

          {/* Right side: content */}
          <div className="lg:col-span-5 space-y-6">
            {/* Error cards */}
            {error && !isLoading && (
              <Card className="border-red-500 bg-red-900/40 shadow-xl">
                <p className="text-red-300 font-semibold text-lg">TrackGuide Error:</p>
                <p className="text-red-300">{error}</p>
              </Card>
            )}

            {midiError && !loadingMessage.toLowerCase().includes('midi') && !error && (
              <Card className="border-yellow-500 bg-yellow-900/40 shadow-xl">
                <p className="text-yellow-300 font-semibold text-lg">MIDI Generation Note:</p>
                <p className="text-yellow-300">{midiError}</p>
              </Card>
            )}

            {/* Guidebook streaming/complete */}
            {(generatedGuidebook || (isLoading && loadingMessage.includes("TrackGuide is generating"))) && !error && (
              <Card title={trackGuideCardTitle} className="bg-gray-800/80 backdrop-blur-md shadow-xl border border-gray-700/50 sticky top-8" titleClassName="border-b border-gray-700 text-xl">
                {activeGuidebookDetails && !isLoading && (
                  <div className="flex flex-wrap gap-3 mb-5 pb-4 border-b border-gray-700 items-center">
                    <Button onClick={handleSaveToLibrary} variant="secondary" leftIcon={<SaveIcon />}>Save to Library</Button>
                    <div className="flex-grow"></div>
                    <Button onClick={resetFormForNewGuidebook} variant="outline" size="sm" className="!border-gray-500 !text-gray-400 hover:!bg-gray-600 hover:!text-white" leftIcon={<CloseIcon />}>Close</Button>
                    {copyStatus && <span className={`ml-3 text-sm ${copyStatus.includes("Failed") || copyStatus.includes("not supported") ? "text-red-400" : "text-green-400"}`}>{copyStatus}</span>}
                  </div>
                )}
                <div id="guidebook-content-display" className="prose prose-sm md:prose-base prose-invert max-w-none max-h-[calc(100vh-6rem)] overflow-y-auto pr-3 text-gray-300 custom-scrollbar guidebook-content">
                  {activeGuidebookDetails && !isLoading && (
                    <div className="mb-6 p-4 bg-gray-700/50 rounded-lg text-sm shadow-inner border border-gray-600/50 guidebook-section-break"> 
                      <strong className="text-orange-300 block mb-2 text-base">TrackGuide Snapshot:</strong>
                      <p><strong>Project Title:</strong> {activeGuidebookDetails.title}</p>
                      <p><strong>Genre(s):</strong> {Array.isArray(activeGuidebookDetails.genre) ? activeGuidebookDetails.genre.join(', ') : activeGuidebookDetails.genre}</p>
                      <p><strong>Artist/Song Ref:</strong> {activeGuidebookDetails.artistReference || "N/A"}</p>
                      <p><strong>Vibe(s):</strong> {Array.isArray(activeGuidebookDetails.vibe) ? activeGuidebookDetails.vibe.join(', ') : activeGuidebookDetails.vibe}</p>
                      <p><strong>DAW:</strong> {activeGuidebookDetails.daw}</p>
                      <p><strong>Plugins:</strong> {activeGuidebookDetails.plugins || "N/A"}</p>
                      <p><strong>Instruments:</strong> {activeGuidebookDetails.availableInstruments || "N/A"}</p>
                      {/* Extracted Lyrics (if present) */}
{activeGuidebookDetails.lyrics && (
  <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-600/50 shadow-inner guidebook-section-break">
    <strong className="text-orange-300 block mb-2 text-base">Extracted Lyrics:</strong>
    <p className="whitespace-pre-line text-gray-300 text-sm">{activeGuidebookDetails.lyrics}</p>
  </div>
)}

       {activeGuidebookDetails.generatedMidiPatterns && (
  <div className="mt-1 space-y-1">
    <p className="text-green-400">
      <MusicNoteIcon className="w-4 h-4 inline mr-1" /> Initial MIDI patterns generated.
    </p>
    {activeGuidebookDetails.generatedMidiPatterns.melody && (
      <>
        <p className="text-blue-400 text-sm ml-6">
          🎤 Topline melody merged into MIDI.
        </p>
        {toplineAnalysis?.hasLyrics && (
          <p className="text-blue-300 text-xs ml-8">
            ✏️ Lyrics extracted from vocal pitch contour.
          </p>
        )}
      </>
    )}
  </div>
)}


                    </div>
                  )}
                  <MarkdownRenderer content={generatedGuidebook} />
                  {isLoading && loadingMessage.includes("TrackGuide is generating") && <Spinner size="sm" text="Generating TrackGuide..." />}
                </div>
              </Card>
            )}

            {/* Spinner for phases that aren't text-streaming */}
            {isLoading && !error && loadingMessage && !loadingMessage.includes("TrackGuide is generating") && (
              <div className="flex justify-center py-10"><Spinner size="lg" text={loadingMessage || "Processing..."} /></div>
            )}

            {/* MIDI tools */}
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

            {/* Placeholder */}
            {!isLoading && !generatedGuidebook && !error && !activeGuidebookDetails && (
              <Card className="bg-gray-800/80 backdrop-blur-md shadow-xl border border-gray-700/50 flex flex-col items-center justify-center h-96 text-center min-h-[500px]">
                <div className="flex justify-center mb-6"><TrackGuideLogo className="w-20 h-20 opacity-80 text-orange-500"/></div>
                <h3 className="text-2xl font-semibold text-gray-200 mb-2">Produce Smarter. Create More.</h3>
                <p className="text-gray-400 max-w-md mx-auto">Tell us what you’re envisioning—TrackGuide AI will generate a custom production guide and MIDI foundation.</p>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Mix Feedback */}
      {activeView === 'mixFeedback' && (
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-3 space-y-6">
            <div className="flex bg-gray-800/80 backdrop-blur-md shadow-xl border border-gray-700/50 rounded-lg overflow-hidden">
              <button onClick={()=>setMixFeedbackTab('single')} className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${mixFeedbackTab==='single'?'bg-orange-500 text-white':'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'}`}>🎚️ Mix Analysis</button>
              <button onClick={()=>setMixFeedbackTab('compare')} className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${mixFeedbackTab==='compare'?'bg-orange-500 text-white':'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'}`}>⚖️ Mix Compare</button>
            </div>

            {mixFeedbackTab === 'single' && (
              <Card title="Upload Your Mix" className="bg-gray-800/80 backdrop-blur-md shadow-xl border border-gray-700/50">
                <form onSubmit={handleGetMixFeedback} className="space-y-5">
                  <div>
                    <label htmlFor="mix-audio-file" className="block text-sm font-medium text-gray-300 mb-1">Audio File (.mp3, .wav, etc.)</label>
                    <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${mixFeedbackError && mixFeedbackInputs.audioFile === null ? 'border-red-500' : 'border-gray-600'} border-dashed rounded-md cursor-pointer hover:border-orange-500 transition-colors`} onClick={()=>audioFileInputRef.current?.click()} >
                      <div className="space-y-1 text-center">
                        <UploadIcon className="mx-auto h-12 w-12 text-gray-500" />
                        <div className="flex text-sm text-gray-400">
                          <span className="relative rounded-md font-medium text-orange-400 hover:text-orange-300">Upload a file</span>
                          <input id="mix-audio-file" name="mix-audio-file" type="file" className="sr-only" accept="audio/*" onChange={handleMixAudioFileChange} ref={audioFileInputRef} />
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">Max file size: {MAX_AUDIO_FILE_SIZE_MB}MB</p>
                      </div>
                    </div>
                    {mixFeedbackInputs.audioFile && <p className="text-xs text-green-400 mt-2">Selected: {mixFeedbackInputs.audioFile.name} ({(mixFeedbackInputs.audioFile.size / 1024 / 1024).toFixed(2)} MB)</p>}
                    {mixFeedbackError && mixFeedbackInputs.audioFile === null && <p className="text-xs text-red-400 mt-2">{mixFeedbackError}</p>}
                  </div>
                  <div><Textarea label="Notes for AI" name="mixUserNotes" value={mixFeedbackInputs.userNotes} onChange={(e)=>setMixFeedbackInputs(prev=>({...prev, userNotes: e.target.value}))} placeholder="e.g., 'Focus on the low-end clarity', 'Is the vocal too loud?', 'General feedback welcome.'" rows={4} /></div>
                  <div>
                    <label htmlFor="mix-daw-select" className="block text-sm font-medium text-gray-300 mb-1">Your DAW (Optional)</label>
                    <select id="mix-daw-select" value={mixFeedbackInputs.dawName} onChange={(e)=>setMixFeedbackInputs(prev=>({...prev, dawName: e.target.value}))} className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
                      <option value="">Select your DAW (optional)</option>
                      {DAW_SUGGESTIONS.map(daw => <option key={daw} value={daw}>{daw}</option>)}
                    </select>
                    <p className="text-xs text-gray-400 mt-1">Selecting your DAW will provide feedback tailored to your specific tools.</p>
                  </div>
                  <Button type="submit" disabled={isGeneratingMixFeedback || !mixFeedbackInputs.audioFile} className="w-full text-base py-2.5 !bg-orange-600 hover:!bg-orange-700 focus:!ring-orange-500" leftIcon={<AdjustmentsHorizontalIcon className="w-5 h-5"/>}>
                    {isGeneratingMixFeedback ? 'Analyzing Mix...' : 'Get Mix Feedback'}
                  </Button>
                  <Button type="button" onClick={resetMixFeedbackForm} variant="outline" className="w-full !border-orange-500 !text-orange-400 hover:!bg-orange-500 hover:!text-white">Clear Mix Form</Button>
                </form>
              </Card>
            )}

            {mixFeedbackTab === 'compare' && (
              <div className="space-y-5">
                <Card title="Mix A (Original)" className="bg-gray-800/80 backdrop-blur-md shadow-xl border border-gray-700/50">
                  <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${mixCompareError && !mixCompareInputs.mixA ? 'border-red-500' : 'border-gray-600'} border-dashed rounded-md cursor-pointer hover:border-orange-500 transition-colors`} onClick={()=>document.getElementById('mixA-upload')?.click()}>
                    <div className="space-y-1 text-center">
                      <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-400">
                        <label htmlFor="mixA-upload" className="relative cursor-pointer rounded-md font-medium text-orange-400 hover:text-orange-300">
                          <span>Upload Mix A</span>
                          <input id="mixA-upload" name="mixA-upload" type="file" className="sr-only" accept="audio/*" onChange={(e)=>{ const f=e.target.files?.[0]; if(!f) return; if(f.size>MAX_AUDIO_FILE_SIZE_BYTES){setMixCompareError(`File is too large. Max ${MAX_AUDIO_FILE_SIZE_MB}MB.`);return;} if(!f.type.startsWith('audio/')){setMixCompareError('Invalid file type.');return;} setMixCompareInputs(prev=>({...prev,mixA:f})); setMixCompareError(null);} } />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">MP3, WAV, FLAC up to {MAX_AUDIO_FILE_SIZE_MB}MB</p>
                    </div>
                  </div>
                  {mixCompareInputs.mixA && <p className="text-xs text-green-400 mt-2">Selected: {mixCompareInputs.mixA.name} ({(mixCompareInputs.mixA.size / 1024 / 1024).toFixed(2)} MB)</p>}
                </Card>

                <Card title="Mix B (Revised)" className="bg-gray-800/80 backdrop-blur-md shadow-xl border border-gray-700/50">
                  <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${mixCompareError && !mixCompareInputs.mixB ? 'border-red-500' : 'border-gray-600'} border-dashed rounded-md cursor-pointer hover:border-orange-500 transition-colors`} onClick={()=>document.getElementById('mixB-upload')?.click()}>
                    <div className="space-y-1 text-center">
                      <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-400">
                        <label htmlFor="mixB-upload" className="relative cursor-pointer rounded-md font-medium text-orange-400 hover:text-orange-300">
                          <span>Upload Mix B</span>
                          <input id="mixB-upload" name="mixB-upload" type="file" className="sr-only" accept="audio/*" onChange={(e)=>{ const f=e.target.files?.[0]; if(!f) return; if(f.size>MAX_AUDIO_FILE_SIZE_BYTES){setMixCompareError(`File is too large. Max ${MAX_AUDIO_FILE_SIZE_MB}MB.`);return;} if(!f.type.startsWith('audio/')){setMixCompareError('Invalid file type.');return;} setMixCompareInputs(prev=>({...prev,mixB:f})); setMixCompareError(null);} } />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">MP3, WAV, FLAC up to {MAX_AUDIO_FILE_SIZE_MB}MB</p>
                    </div>
                  </div>
                  {mixCompareInputs.mixB && <p className="text-xs text-green-400 mt-2">Selected: {mixCompareInputs.mixB.name} ({(mixCompareInputs.mixB.size / 1024 / 1024).toFixed(2)} MB)</p>}
                </Card>

                <Card title="Notes for AI" className="bg-gray-800/80 backdrop-blur-md shadow-xl border border-gray-700/50">
                  <Textarea placeholder="Describe what you want the AI to focus on..." value={mixCompareInputs.userNotes} onChange={(e)=>setMixCompareInputs(prev=>({...prev, userNotes: e.target.value}))} rows={3} className="w-full" />
                </Card>

                <Button onClick={handleCompareMixes} disabled={isGeneratingMixComparison || !mixCompareInputs.mixA || !mixCompareInputs.mixB} variant="primary" className="w-full px-4 py-3 text-base font-semibold" leftIcon={<span className="w-5 h-5 text-center">⚖️</span>}>
                  {isGeneratingMixComparison ? 'Comparing Mixes...' : 'Compare Mixes'}
                </Button>

                <Button type="button" onClick={resetMixCompareForm} variant="outline" className="w-full !border-orange-500 !text-orange-400 hover:!bg-orange-500 hover:!text-white">Reset</Button>

                {mixCompareError && !isGeneratingMixComparison && (
                  <Card className="border-red-500 bg-red-900/40 shadow-xl">
                    <p className="text-red-300 font-semibold text-lg">Mix Comparison Error:</p>
                    <p className="text-red-300">{mixCompareError}</p>
                  </Card>
                )}
              </div>
            )}
          </div>

          <div className="md:col-span-9 space-y-6">
            {isGeneratingMixFeedback && streamingMixFeedback && mixFeedbackTab === 'single' && (
              <Card title="AI Mix Feedback Report (Generating...)" className="bg-gray-800/80 backdrop-blur-md shadow-xl border border-gray-700/50 sticky top-8" titleClassName="border-b border-gray-700 text-xl !text-orange-300">
                <div className="prose prose-sm md:prose-base prose-invert max-w-none max-h-[calc(100vh-6rem)] overflow-y-auto pr-3 text-gray-300 custom-scrollbar guidebook-content">
                  <MarkdownRenderer content={streamingMixFeedback} />
                </div>
              </Card>
            )}

            {isGeneratingMixComparison && streamingMixComparison && mixFeedbackTab === 'compare' && (
              <Card title="AI Mix Comparison Report (Generating...)" className="bg-gray-800/80 backdrop-blur-md shadow-xl border border-gray-700/50 sticky top-8" titleClassName="border-b border-gray-700 text-xl !text-orange-300">
                <div className="prose prose-sm md:prose-base prose-invert max-w-none max-h-[calc(100vh-6rem)] overflow-y-auto pr-3 text-gray-300 custom-scrollbar guidebook-content">
                  <MarkdownRenderer content={streamingMixComparison} />
                </div>
              </Card>
            )}

            {((isGeneratingMixFeedback && !streamingMixFeedback && mixFeedbackTab === 'single') || (isGeneratingMixComparison && !streamingMixComparison && mixFeedbackTab === 'compare')) && (
              <div className="flex justify-center items-center h-full min-h-[500px]">
                <Spinner size="lg" color="text-orange-500" text={mixFeedbackTab === 'single' ? "AI is analyzing your mix..." : "AI is comparing your mixes..."} />
              </div>
            )}
            {mixFeedbackError && !isGeneratingMixFeedback && mixFeedbackTab === 'single' && (
              <Card className="border-red-500 bg-red-900/40 shadow-xl"><p className="text-red-300 font-semibold text-lg">Mix Feedback Error:</p><p className="text-red-300">{mixFeedbackError}</p></Card>
            )}
            {mixCompareError && !isGeneratingMixComparison && mixFeedbackTab === 'compare' && (
              <Card className="border-red-500 bg-red-900/40 shadow-xl"><p className="text-red-300 font-semibold text-lg">Mix Comparison Error:</p><p className="text-red-300">{mixCompareError}</p></Card>
            )}
            {mixFeedbackResult && !isGeneratingMixFeedback && mixFeedbackTab === 'single' && (
              <Card title="AI Mix Feedback Report" className="bg-gray-800/80 backdrop-blur-md shadow-xl border border-gray-700/50 sticky top-8" titleClassName="border-b border-gray-700 text-xl !text-orange-300">
                <div id="mix-feedback-display" className="prose prose-sm md:prose-base prose-invert max-w-none max-h-[calc(100vh-6rem)] overflow-y-auto pr-3 text-gray-300 custom-scrollbar guidebook-content">
                  <MarkdownRenderer content={mixFeedbackResult} />
                </div>
              </Card>
            )}
            {mixCompareResult && !isGeneratingMixComparison && mixFeedbackTab === 'compare' && (
              <Card title="AI Mix Comparison Report" className="bg-gray-800/80 backdrop-blur-md shadow-xl border border-gray-700/50 sticky top-8" titleClassName="border-b border-gray-700 text-xl !text-orange-300">
                <div id="mix-comparison-display" className="prose prose-sm md:prose-base prose-invert max-w-none max-h-[calc(100vh-6rem)] overflow-y-auto pr-3 text-gray-300 custom-scrollbar guidebook-content">
                  <MarkdownRenderer content={mixCompareResult} />
                </div>
              </Card>
            )}
            {!isGeneratingMixFeedback && !isGeneratingMixComparison && !mixFeedbackResult && !mixCompareResult && !mixFeedbackError && !mixCompareError && (
              <Card className="bg-gray-800/80 backdrop-blur-md shadow-xl border border-gray-700/50 flex flex-col items-center justify-center h-96 text-center min-h-[500px]">
                <div className="flex justify-center mb-6"><TrackGuideLogo className="w-20 h-20 opacity-80"/></div>
                <h3 className="text-2xl font-semibold text-gray-200 mb-2">Refine Your Sound.</h3>
                <p className="text-gray-400 max-w-md">{mixFeedbackTab === 'single' ? 'Upload your mix, add some notes, and get detailed feedback.' : 'Upload two mix versions to compare them side-by-side.'}</p>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Remix / EQ / Patch views */}
      {activeView === 'remixGuide' && <div className="max-w-7xl mx-auto"><RemixGuideAI onContentUpdate={setRemixGuideContent} /></div>}
      {activeView === 'eqGuide' && <div className="max-w-7xl mx-auto"><EQGuide /></div>}
      {activeView === 'patchGuide' && <div className="max-w-7xl mx-auto"><PatchGuide onContentUpdate={setPatchGuideContent} /></div>}

      {showLibraryModal && (
        <LibraryModal
          library={library}
          onClose={()=>setShowLibraryModal(false)}
          onLoadEntry={handleLoadFromLibrary}
          onDeleteEntry={handleDeleteFromLibrary}
          onCreateNew={resetFormForNewGuidebook}
        />
      )}

      {/* Floating Assistant */}
      <AIAssistant
        isOpen={!isProductionCoachCollapsed}
        onClose={()=>setIsProductionCoachCollapsed(true)}
        currentGuidebook={activeGuidebookDetails || undefined}
        userInputs={inputs}
        isCollapsed={isProductionCoachCollapsed}
        onToggle={()=>setIsProductionCoachCollapsed(!isProductionCoachCollapsed)}
        remixGuideContent={remixGuideContent}
        mixFeedbackContent={mixFeedbackResult || undefined}
        mixComparisonContent={mixCompareResult || undefined}
        patchGuideContent={patchGuideContent}
        activeView={activeView}
      />

      <footer className="text-center mt-16 py-8 border-t border-gray-700/60">
        <p className="text-sm text-gray-500">{APP_TITLE} - AI Production Assistant</p>
      </footer>
    </div>
  );
};

export default App;
