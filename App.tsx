
import React, { useState, useEffect, useRef } from 'react';
import { UserInputs, GuidebookEntry, MidiSettings, GeneratedMidiPatterns, KeyOfGeneratedMidiPatterns, MixFeedbackInputs, ActiveView } from './types.ts';
import { generateGuidebookContent, generateMidiPatternSuggestions, generateMixFeedback, generateMixComparison } from './services/geminiService.ts';
import { Input } from './components/Input.tsx';
import { Textarea } from './components/Textarea.tsx';
import { Button } from './components/Button.tsx';
import { Card } from './components/Card.tsx';
import { Spinner } from './components/Spinner.tsx';
import { SaveIcon, BookOpenIcon, MusicNoteIcon, PlusIcon, CopyIcon, UploadIcon, AdjustmentsHorizontalIcon, CloseIcon } from './components/icons.tsx';

// Custom TrackGuide Logo Component
const TrackGuideLogo = ({ className = "w-4 h-4" }: { className?: string }) => (
  <div className={`${className} bg-orange-500 transform rotate-45 flex items-center justify-center`}>
    <div className="w-1/2 h-1/2 bg-white transform -rotate-45"></div>
  </div>
);
import { APP_TITLE, LOCAL_STORAGE_KEY, GENRE_SUGGESTIONS, VIBE_SUGGESTIONS, DAW_SUGGESTIONS, MIDI_DEFAULT_SETTINGS, MIDI_SCALES, MIDI_CHORD_PROGRESSIONS, MIDI_TEMPO_RANGES, LAST_USED_DAW_KEY, LAST_USED_PLUGINS_KEY } from './constants.ts';
import { MidiGeneratorComponent } from './components/MidiGeneratorComponent.tsx';
import { LibraryModal } from './components/LibraryModal.tsx';
import { AIAssistant } from './components/AIAssistant.tsx';


import { LandingPage } from './components/LandingPage.tsx';
import { RemixGuideAI } from './components/RemixGuideAI.tsx';
import { EQCheatSheet } from './components/EQCheatSheet.tsx';
import { MarkdownRenderer } from './components/MarkdownRenderer.tsx';
import { stopPlayback } from './services/audioService.ts';


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
};

const MAX_AUDIO_FILE_SIZE_MB = 100;
const MAX_AUDIO_FILE_SIZE_BYTES = MAX_AUDIO_FILE_SIZE_MB * 1024 * 1024;


export const parseBpmFromGuidebook = (content: string): number | null => {
  const bpmMatch = content.match(/Estimated BPM Range:\s*.*?(\d+)\s*(?:-|to)\s*(\d+)\s*BPM/i);
  if (bpmMatch && bpmMatch[1] && bpmMatch[2]) {
    return Math.round((parseInt(bpmMatch[1], 10) + parseInt(bpmMatch[2], 10)) / 2);
  }
  const singleBpmMatch = content.match(/Estimated BPM Range:\s*.*?(\d+)\s*BPM/i);
  if (singleBpmMatch && singleBpmMatch[1]) {
    return parseInt(singleBpmMatch[1], 10);
  }
  const bpmValueMatch = content.match(/BPM:\s*(\d+)/i); 
    if (bpmValueMatch && bpmValueMatch[1]) {
        return parseInt(bpmValueMatch[1], 10);
    }
  return null;
};

export const parseKeyFromGuidebook = (content: string): string | null => {
  const keyMatch = content.match(/Suggested Key\(s\) \/ Scale\(s\):\s*([^(\n]+)/i);
  if (keyMatch && keyMatch[1]) {
    const keys = keyMatch[1].split(/,|\/| or /).map(k => k.trim().replace(/\.$/, ''));
    for (const k of keys) {
      const normalizedKey = k.includes(" Minor") ? k : k.replace("Major", "").trim() + " Major";
        if (MIDI_SCALES.includes(k) || MIDI_SCALES.includes(normalizedKey)) {
          if (MIDI_SCALES.includes(k)) return k;
          return normalizedKey;
        }
    }
    const firstPotentialKey = keys[0];
    if (firstPotentialKey) {
        for (const scale of MIDI_SCALES) {
            if (firstPotentialKey.toLowerCase().startsWith(scale.split(' ')[0].toLowerCase())) {
                 if (firstPotentialKey.toLowerCase().includes('minor')) {
                    if (scale.includes('Minor')) return scale;
                 } else if (firstPotentialKey.toLowerCase().includes('major')) {
                    if (scale.includes('Major')) return scale;
                 } else { 
                    return scale; 
                 }
            }
        }
        return firstPotentialKey; 
    }
  }
  return null;
};

export const parseChordProgressionFromGuidebook = (content: string): string | null => {
  const sectionMatch = content.match(/## (?:3|4)\.(?:.*Harmony.*|.*Chord Progressions.*)\s*\n(?:[^\n]*\n)*?.*?Chord Progression\(s\)\s*(?:\([^)]+\))?:\s*([^\n]+)/im);

  if (sectionMatch && sectionMatch[1]) {
    const progressionsText = sectionMatch[1];
    const firstProgMatch = progressionsText.match(/([ivclxmdIVCLXMDab#ø°dimaug\d\/sus-]+(?:\s*-\s*[ivclxmdIVCLXMDab#ø°dimaug\d\/sus-]+)*)/);
    if (firstProgMatch && firstProgMatch[1]) {
        let progression = firstProgMatch[1].trim();
        if (progression.endsWith('.')) progression = progression.slice(0, -1);
        const commonSeparators = [', ', '. ', '; '];
        for (const sep of commonSeparators) {
            if (progression.includes(sep)) {
                progression = progression.split(sep)[0];
                break;
            }
        }
        if (/[IVXLCDMivxlcdm]/.test(progression)) {
           return progression;
        }
    }
  }
  const simpleProgMatch = content.match(/Chord Progression\(s\).*?:\s*([IVXLCDMivxlcdm\d\s,-]+)/i);
  if (simpleProgMatch && simpleProgMatch[1]) {
    const found = simpleProgMatch[1].split(',')[0].trim();
    if (/[IVXLCDMivxlcdm]/.test(found)) {
        return found;
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
  essentialContext += extractSectionContent(guidebookContent, overviewSectionRegex) + "\n\n";
  
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


const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ActiveView>('landing');
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
  const [showAdvancedInput, setShowAdvancedInput] = useState<boolean>(false);
  
  // Production Coach chat state
  const [isProductionCoachCollapsed, setIsProductionCoachCollapsed] = useState<boolean>(true);


  // Mix Feedback State
  const [mixFeedbackInputs, setMixFeedbackInputs] = useState<MixFeedbackInputs>(initialMixFeedbackInputsState);
  const [mixFeedbackResult, setMixFeedbackResult] = useState<string | null>(null);
  const [isGeneratingMixFeedback, setIsGeneratingMixFeedback] = useState<boolean>(false);
  const [mixFeedbackError, setMixFeedbackError] = useState<string | null>(null);
  const [mixFeedbackTab, setMixFeedbackTab] = useState<'single' | 'compare'>('single');

  // Mix Comparison State
  const [mixCompareInputs, setMixCompareInputs] = useState<{
    mixA: File | null;
    mixB: File | null;
    userNotes: string;
    includeMixBFeedback?: boolean;
  }>({
    mixA: null,
    mixB: null,
    userNotes: '',
    includeMixBFeedback: false
  });
  const [mixCompareResult, setMixCompareResult] = useState<string | null>(null);
  const [isGeneratingMixComparison, setIsGeneratingMixComparison] = useState<boolean>(false);
  const [mixCompareError, setMixCompareError] = useState<string | null>(null);
  const audioFileInputRef = useRef<HTMLInputElement>(null);


  const genreInputRef = useRef<HTMLInputElement>(null);
  const vibeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const savedLibrary = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedLibrary) {
        const parsedLibrary = JSON.parse(savedLibrary);
        const migratedLibrary = parsedLibrary.map((entry: any) => ({
          ...entry,
          genre: Array.isArray(entry.genre) ? entry.genre : (entry.genre ? [entry.genre] : []),
          vibe: Array.isArray(entry.vibe) ? entry.vibe : (entry.vibe ? [entry.vibe] : []),
          scale: entry.scale || '',
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

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(library));
    } catch (e) {
      console.error("Failed to save library to local storage:", e);
    }
  }, [library]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
  
    if (name === "currentGenreText") {
      setCurrentGenreText(value); 
    } else if (name === "currentVibeText") {
      setCurrentVibeText(value); 
    } else {
      setInputs(prev => ({ ...prev, [name]: value }));
      if (name === 'daw') {
        localStorage.setItem(LAST_USED_DAW_KEY, value);
      } else if (name === 'plugins') {
        localStorage.setItem(LAST_USED_PLUGINS_KEY, value);
      }
    }
  };

  const handleAddMultiSelectItem = (type: 'genre' | 'vibe') => {
    const textToAdd = type === 'genre' ? currentGenreText.trim() : currentVibeText.trim();
    if (textToAdd && !inputs[type].includes(textToAdd)) {
      setInputs(prev => ({ ...prev, [type]: [...prev[type], textToAdd] }));
    }
    if (type === 'genre') {
      setCurrentGenreText('');
      genreInputRef.current?.focus();
    } else {
      setCurrentVibeText('');
      vibeInputRef.current?.focus();
    }
  };

  const handleMultiSelectKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, type: 'genre' | 'vibe') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddMultiSelectItem(type);
    }
  };
  
  const handleMultiSelectToggle = (field: 'genre' | 'vibe', value: string) => {
    setInputs(prev => {
      const currentValues = prev[field];
      const newValues = currentValues.filter(v => v !== value);
      return { ...prev, [field]: newValues };
    });
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
    setGeneratedGuidebook("");
    setActiveGuidebookDetails(null);
    setError(null);
    setMidiError(null);
    setCopyStatus('');
    stopPlayback();
    setShowLibraryModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMidiError(null);
    setGeneratedGuidebook(""); // Clear previous content for streaming
    setActiveGuidebookDetails(null);
    setCopyStatus('');
    stopPlayback();

    // Auto-scroll to top when generation starts
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (inputs.daw) localStorage.setItem(LAST_USED_DAW_KEY, inputs.daw);
    if (inputs.plugins) localStorage.setItem(LAST_USED_PLUGINS_KEY, inputs.plugins);

    let finalGuidebookContent = "";
    let initialPatternsData: GeneratedMidiPatterns | undefined;
    let finalMidiSettings: MidiSettings | undefined;

    try {
      setLoadingMessage('TrackGuide is generating...');
      const guidebookStream = await generateGuidebookContent(inputs);
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
      const primaryGenre = inputs.genre[0] || MIDI_DEFAULT_SETTINGS.genre;
      
      const tempoRange = MIDI_TEMPO_RANGES[primaryGenre] || MIDI_TEMPO_RANGES.Default;
      const defaultTempoForGenre = Math.round((tempoRange[0] + tempoRange[1]) / 2);
      const defaultChordProgForGenre = (MIDI_CHORD_PROGRESSIONS[primaryGenre] || MIDI_CHORD_PROGRESSIONS.Default)[0];

      const essentialMidiContext = extractEssentialMidiContext(finalGuidebookContent);
      const initialSongSection = MIDI_DEFAULT_SETTINGS.songSection; 
      
      let initialBars = 8;
      const primaryGenreLower = primaryGenre.toLowerCase();
      const shortLoopGenres = [
        'lo-fi hip hop', 'lofi hip hop', 'lofi', 'trap', 'ambient', 'idm',
        'breakcore', 'footwork', 'juke', 'experimental'
      ];
      if (shortLoopGenres.some(g => primaryGenreLower.includes(g))) {
        initialBars = 4;
      }
      const initialTargetInstruments: KeyOfGeneratedMidiPatterns[] = ['chords', 'bassline', 'melody', 'drums'];

      finalMidiSettings = {
        key: parsedKey || MIDI_DEFAULT_SETTINGS.key,
        tempo: parsedBpm || defaultTempoForGenre,
        timeSignature: MIDI_DEFAULT_SETTINGS.timeSignature,
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
        
        let jsonStr = accumulatedMidiJson.trim();
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[2]) {
          jsonStr = match[2].trim();
        }
        initialPatternsData = JSON.parse(jsonStr) as GeneratedMidiPatterns;
        if (initialPatternsData.drums) {
          const lowercasedDrums: any = {};
          for (const key in initialPatternsData.drums) {
              lowercasedDrums[key.toLowerCase().replace(/\s+/g, '_')] = initialPatternsData.drums[key as keyof typeof initialPatternsData.drums];
          }
          initialPatternsData.drums = lowercasedDrums;
        }
        setMidiError(null);
      } catch (midiErr: any) {
        console.error("Initial MIDI generation failed:", midiErr);
        const midiSpecificMessage = midiErr.message.toLowerCase().includes("json") 
            ? `AI returned invalid JSON for MIDI patterns during initial generation. (${midiErr.message})`
            : `Initial MIDI generation failed: ${midiErr.message}.`;
        setMidiError(midiSpecificMessage + " You can try generating MIDI manually in the MIDI tools section.");
        initialPatternsData = undefined; // Ensure it's undefined on error
      }

      setActiveGuidebookDetails({
        id: newEntryId,
        title: entryTitle,
        genre: inputs.genre,
        artistReference: inputs.artistReference,
        referenceTrackLink: inputs.referenceTrackLink,
        lyrics: inputs.lyrics,
        key: inputs.key,
        chords: inputs.chords,
        generalNotes: inputs.generalNotes,
        vibe: inputs.vibe,
        daw: inputs.daw,
        plugins: inputs.plugins,
        availableInstruments: inputs.availableInstruments || '',
        content: finalGuidebookContent, // Use fully assembled content
        createdAt,
        midiSettings: finalMidiSettings, 
        generatedMidiPatterns: initialPatternsData,
      });

    } catch (err: any) {
       setError(err.message || 'An unexpected error occurred while generating TrackGuide.');
       // If guidebook streaming fails, ensure activeGuidebookDetails is not set with partial data
       setActiveGuidebookDetails(null); 
       setGeneratedGuidebook(""); // Clear potentially partial streamed content
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
        const updatedLibrary = [...prev];
        updatedLibrary[existingIndex] = entryToSave;
        return updatedLibrary;
      }
      return [entryToSave, ...prev];
    });
  };
  
  const handleUpdateGuidebookEntryMidi = (midiSettings: MidiSettings, generatedMidiPatterns: GeneratedMidiPatterns) => {
    setActiveGuidebookDetails(prev => {
        if (!prev) return null; 
        // Ensure content (guidebook text) is preserved from the existing state
        return {
            ...prev, 
            midiSettings,
            generatedMidiPatterns,
        };
    });
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
    setGeneratedGuidebook(entry.content); // Load full content directly
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
        setGeneratedGuidebook("");
        setActiveGuidebookDetails(null);
        stopPlayback();
    }
  };
  
  const getFormattedTextFromHtmlElement = (element: HTMLElement): string => {
    let text = '';
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, null);
    let currentNode;
    let currentLine = '';
    let listLevel = 0;
  
    const appendLine = (line: string) => {
      text += line + '\n';
      currentLine = '';
    };
  
    const appendToCurrentLine = (str: string) => {
      currentLine += str;
    };
  
    while (currentNode = walker.nextNode()) {
      if (currentNode.nodeType === Node.TEXT_NODE) {
        appendToCurrentLine(currentNode.textContent || '');
      } else if (currentNode.nodeType === Node.ELEMENT_NODE) {
        const el = currentNode as HTMLElement;
        const tagName = el.tagName.toLowerCase();
  
        const blockElements = ['h1', 'h2', 'h3', 'p', 'div', 'ul', 'li', 'table', 'hr', 'tr', 'td', 'th'];
        if (blockElements.includes(tagName) && currentLine.trim() !== '') {
          appendLine(currentLine);
        }
  
        switch (tagName) {
          case 'h1': appendToCurrentLine('# '); break;
          case 'h2': appendToCurrentLine('## '); break;
          case 'h3': appendToCurrentLine('### '); break;
          case 'p': if(text.length > 0 && !text.endsWith('\n\n') && !text.endsWith('\n')) appendLine(''); break; 
          case 'strong': case 'b': appendToCurrentLine('**'); break;
          case 'em': case 'i': appendToCurrentLine('*'); break;
          case 'ul': listLevel++; break;
          case 'li': appendToCurrentLine('  '.repeat(listLevel -1) + '- '); break;
          case 'hr': appendLine('---'); break;
          case 'br': appendLine(currentLine); break; 
          case 'tr': if(currentLine.trim() !== '') appendLine(currentLine); break;
          case 'td': case 'th': appendToCurrentLine('| '); break;
        }
  
        switch (tagName) {
          case 'h1': case 'h2': case 'h3': case 'p':
            appendLine(currentLine);
            appendLine(''); 
            break;
          case 'strong': case 'b': appendToCurrentLine('**'); break;
          case 'em': case 'i': appendToCurrentLine('*'); break;
          case 'ul': listLevel--; if (!text.endsWith('\n')) appendLine(currentLine); break;
          case 'li': appendLine(currentLine); break;
          case 'tr': appendToCurrentLine(' |'); appendLine(currentLine); break; 
          case 'table': if (!text.endsWith('\n')) appendLine(''); break; 
        }
      }
    }
    if (currentLine.trim() !== '') {
      appendLine(currentLine); 
    }
    return text.replace(/\n\s*\n/g, '\n\n').trim();
  };

  // Create clean HTML with black text on white/transparent background
  const createCleanHtmlFromText = (text: string): string => {
    const lines = text.split('\n');
    let html = '<div style="color: #000000; font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; background: transparent;">';
    
    for (const line of lines) {
      if (line.trim() === '') {
        html += '<br>';
      } else if (line.startsWith('## ')) {
        html += `<h2 style="color: #000000; font-size: 1.25rem; font-weight: bold; margin: 1rem 0 0.5rem 0;">${line.replace('## ', '')}</h2>`;
      } else if (line.startsWith('### ')) {
        html += `<h3 style="color: #000000; font-size: 1.1rem; font-weight: bold; margin: 0.75rem 0 0.25rem 0;">${line.replace('### ', '')}</h3>`;
      } else if (line.startsWith('#### ')) {
        html += `<h4 style="color: #000000; font-size: 1rem; font-weight: bold; margin: 0.5rem 0 0.25rem 0;">${line.replace('#### ', '')}</h4>`;
      } else if (line.match(/^\d+\./)) {
        html += `<p style="margin: 0.25rem 0; padding-left: 1rem; color: #000000;">${line}</p>`;
      } else if (line.startsWith('• ') || line.startsWith('- ')) {
        html += `<p style="margin: 0.25rem 0; padding-left: 1rem; color: #000000;">${line}</p>`;
      } else if (line.includes(': ')) {
        // Handle key-value pairs with bold keys
        const colonIndex = line.indexOf(': ');
        const key = line.substring(0, colonIndex);
        const value = line.substring(colonIndex + 2);
        html += `<p style="margin: 0.25rem 0; color: #000000;"><strong style="color: #000000;">${key}:</strong> ${value}</p>`;
      } else {
        html += `<p style="margin: 0.5rem 0; color: #000000;">${line}</p>`;
      }
    }
    
    html += '</div>';
    return html;
  };

  const handleCopyFormattedContent = async (elementId: string) => {
    const contentDisplayElement = document.getElementById(elementId);
    if (!contentDisplayElement) {
      setCopyStatus("Content area not found.");
      setTimeout(() => setCopyStatus(''), 3000);
      return;
    }

    const plainTextContent = getFormattedTextFromHtmlElement(contentDisplayElement.cloneNode(true) as HTMLElement);
    
    // Create clean HTML with black text on white/transparent background
    const cleanHtmlContent = createCleanHtmlFromText(plainTextContent);

    try {
      if (navigator.clipboard && navigator.clipboard.write) {
        const htmlBlob = new Blob([cleanHtmlContent], { type: 'text/html' });
        const textBlob = new Blob([plainTextContent], { type: 'text/plain' });
        
        // @ts-ignore
        const clipboardItem = new ClipboardItem({
          'text/html': htmlBlob,
          'text/plain': textBlob,
        });
        await navigator.clipboard.write([clipboardItem]);
        setCopyStatus("Content Copied (Rich Format)!");
      } else { 
        await navigator.clipboard.writeText(plainTextContent);
        setCopyStatus("Content Copied (Plain Text)!");
      }
    } catch (err) {
      console.error("Failed to copy content using modern Clipboard API:", err);
      try {
        const textArea = document.createElement("textarea");
        textArea.value = plainTextContent; 
        textArea.style.position = "fixed"; 
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (successful) {
          setCopyStatus("Content Copied (Legacy Fallback)!");
        } else {
          throw new Error('execCommand failed');
        }
      } catch (execCommandErr) {
        console.error("Failed to copy content using execCommand:", execCommandErr);
        setCopyStatus("Failed to copy. Please try manually.");
      }
    } finally {
      setTimeout(() => setCopyStatus(''), 3000);
    }
  };


  const renderMarkdown = (
    markdownText: string,
    isMixFeedback: boolean = false
  ): React.ReactNode[] => {
    const elements: React.ReactNode[] = [];
    if (!markdownText && !isLoading) return elements;
    if (!markdownText && isLoading && (loadingMessage.includes("TrackGuide is generating") || loadingMessage.includes("Generating TrackGuide"))) { /* Allow rendering placeholder while streaming */ }
    else if (!markdownText) return elements;


    const lines = markdownText.split('\n');
    let inTable = false;
    let currentTableRows: React.ReactNode[] = [];
    let tableHeaderProcessed = false;

    const processStyledLine = (lineContent: string, key: string | number) => {
      const boldLabelMatch = lineContent.match(/^\*\*(.*?):\*\*\s*(.*)/);
      if (boldLabelMatch) {
        const label = boldLabelMatch[1];
        const restOfLine = boldLabelMatch[2];
        elements.push(
          <p key={key} className="my-2.5 text-gray-300 leading-relaxed break-words">
            <strong className="text-orange-300 font-semibold mr-1.5">{label}:</strong> 
            <span dangerouslySetInnerHTML={{ __html: String.prototype.substring.call(restOfLine, 0).replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/✔\s/g, '<span class="text-green-400 mr-1">✔</span>') }} /> 
          </p>
        );
        return;
      }

      let processedLine = lineContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); 
      processedLine = processedLine.replace(/\*(.*?)\*/g, '<em>$1</em>'); 
      processedLine = processedLine.replace(/✔\s/g, '<span class="text-green-400 mr-1">✔</span>'); 


      if (lineContent.startsWith('# TRACKGUIDE:')) {
        const titleMatch = lineContent.match(/^#\s*TRACKGUIDE:\s*"?([^"\n]+)"?/i);
        const actualTitle = titleMatch && titleMatch[1] ? titleMatch[1].trim() : "Generated TrackGuide";
        elements.push(<h1 key={key} className="text-3xl font-bold mt-6 mb-4 text-orange-300 break-words flex items-center"><MusicNoteIcon className="w-6 h-6 mr-3 text-orange-400 opacity-80" />{actualTitle}</h1>); return;
      }
      if (lineContent.startsWith('# ') && !isMixFeedback) { elements.push(<h1 key={key} className="text-3xl font-bold mt-6 mb-4 text-orange-300 break-words flex items-center"><MusicNoteIcon className="w-6 h-6 mr-3 text-orange-400 opacity-80" />{String.prototype.substring.call(processedLine, 2)}</h1>); return; }
      if (lineContent.startsWith('# ') && isMixFeedback) { elements.push(<h1 key={key} className="text-3xl font-bold mt-6 mb-4 text-orange-300 break-words flex items-center"><AdjustmentsHorizontalIcon className="w-6 h-6 mr-3 text-orange-400 opacity-80" />{String.prototype.substring.call(processedLine, 2)}</h1>); return; }
      
      if (lineContent.startsWith('## ')) { 
        const titleText = String.prototype.substring.call(processedLine, 3);
        const iconColor = "text-orange-500";
        const titleColor = "text-orange-400";
        const IconComponent = isMixFeedback ? AdjustmentsHorizontalIcon : MusicNoteIcon;
        elements.push(<h2 key={key} className={`text-2xl font-semibold mt-10 mb-4 pt-4 border-t border-gray-700 ${titleColor} break-words flex items-center guidebook-section-break`}><IconComponent className={`w-5 h-5 mr-2 ${iconColor} opacity-70`} />{titleText}</h2>); 
        return; 
      }
      if (lineContent.startsWith('### ')) { 
        const sectionTitleText = String.prototype.substring.call(processedLine, 4);
        const titleColor = "text-orange-300";
        elements.push(<h3 key={key} className={`text-xl font-medium mt-6 mb-3 ${titleColor} break-words`}>{sectionTitleText}</h3>); 
        return; 
      }
      
      if (lineContent.startsWith('* ') || lineContent.startsWith('- ')) { elements.push(<li key={key} className="ml-7 list-disc text-gray-300 my-1.5" dangerouslySetInnerHTML={{ __html: String.prototype.substring.call(processedLine, 2) }} />); return; }
      if (lineContent.trim() === '---') { elements.push(<hr key={key} className="my-8 border-gray-600" />); return; }
      
      if (lineContent.trim()) {
        elements.push(<p key={key} className="my-2.5 text-gray-300 leading-relaxed break-words" dangerouslySetInnerHTML={{ __html: processedLine }} />);
      }
    };

    const finalizeTable = (keySuffix: string | number) => {
      if (currentTableRows.length > 0) {
        let headerRow: React.ReactNode | null = null;
        let bodyRows = [...currentTableRows];

        if (tableHeaderProcessed && currentTableRows.length > 0) {
          headerRow = currentTableRows[0];
          bodyRows = currentTableRows.slice(1);
        }
        
        elements.push(
          <div key={`table-container-${keySuffix}`} className="overflow-x-auto my-5 shadow-md rounded-lg guidebook-section-break">
            <table className="w-full border-collapse border border-gray-600 bg-gray-800">
              {headerRow && <thead className="bg-gray-700">{headerRow}</thead>}
              {bodyRows.length > 0 && <tbody>{bodyRows}</tbody>}
            </table>
          </div>
        );
      }
      inTable = false;
      currentTableRows = [];
      tableHeaderProcessed = false;
    };

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      const isTablePipeRow = trimmedLine.startsWith('|') && trimmedLine.endsWith('|');
      const isTableSeparator = isTablePipeRow && trimmedLine.includes('---') && trimmedLine.replace(/\|/g, '').replace(/-/g, '').trim() === '';

      if (inTable) {
        if (isTablePipeRow && !isTableSeparator) { 
          const cells = trimmedLine.split('|').slice(1, -1).map(cell => cell.trim());
          const rowContent = cells.map((cellContent, i) => (
            <td key={i} className="p-3 text-gray-300 border border-gray-600 text-sm" dangerouslySetInnerHTML={{ __html: cellContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>') }} />
          ));
          currentTableRows.push(
            <tr key={`row-${index}`} className="border-b border-gray-600 hover:bg-gray-700/50 transition-colors duration-150">{rowContent}</tr>
          );
        } else if (isTableSeparator) {
          if (currentTableRows.length > 0 && !tableHeaderProcessed) {
            const headerTextRowNode = currentTableRows.pop(); 
            if (React.isValidElement<React.HTMLAttributes<HTMLTableRowElement>>(headerTextRowNode)) {
              const headerTextRow = headerTextRowNode;
              const headerBaseColor = "bg-orange-800/30";
              const headerTextColor = "text-orange-200";
              const styledHeaderCells = React.Children.map(headerTextRow.props.children, (childNode: React.ReactNode) => {
                if (React.isValidElement(childNode)) {
                  const tdCell = childNode as React.ReactElement<React.TdHTMLAttributes<HTMLTableCellElement>>;
                  const currentProps = tdCell.props;
                  return React.cloneElement(tdCell, {
                    ...currentProps,
                    className: `p-3 font-semibold ${headerTextColor} text-left border border-gray-500 text-sm ${headerBaseColor}`, 
                  } as React.TdHTMLAttributes<HTMLTableCellElement>);
                }
                return childNode;
              });
              currentTableRows.unshift(<tr key={headerTextRow.key || `header-${index}`} className="border-b border-gray-500">{styledHeaderCells}</tr>);
              tableHeaderProcessed = true;
            } else {
              if (headerTextRowNode) currentTableRows.push(headerTextRowNode);
            }
          }
        } else { 
          finalizeTable(index);
          processStyledLine(line, index); 
        }
      } else { 
        if (isTablePipeRow && !isTableSeparator) { 
          inTable = true;
          currentTableRows = [];
          tableHeaderProcessed = false;
          const cells = trimmedLine.split('|').slice(1, -1).map(cell => cell.trim());
           const rowContent = cells.map((cellContent, i) => (
            <td key={i} className="p-3 text-gray-300 border border-gray-600 text-sm" dangerouslySetInnerHTML={{ __html: cellContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>') }} />
          ));
          currentTableRows.push(
            <tr key={`row-${index}`} className="border-b border-gray-600 hover:bg-gray-700/50 transition-colors duration-150">{rowContent}</tr>
          );
        } else { 
          processStyledLine(line, index);
        }
      }
    });

    if (inTable) { 
      finalizeTable('final');
    }

    const finalElements: React.ReactNode[] = [];
    let currentListItems: React.ReactNode[] = [];
    elements.forEach((el, idx) => {
        if (React.isValidElement(el) && el.type === 'li') {
            currentListItems.push(el);
        } else {
            if (currentListItems.length > 0) {
                finalElements.push(<ul key={`ul-${idx-currentListItems.length}`} className="space-y-1 my-3 ml-2">{currentListItems}</ul>);
                currentListItems = [];
            }
            finalElements.push(el);
        }
    });
    if (currentListItems.length > 0) {
        finalElements.push(<ul key={`ul-final`} className="space-y-1 my-3 ml-2">{currentListItems}</ul>);
    }

    return finalElements;
  };


  const SelectedPills: React.FC<{
    selections: string[],
    onRemove: (value: string) => void,
  }> = ({ selections, onRemove }) => (
    <div className="flex flex-wrap gap-2 mt-2 mb-2 min-h-[2.25rem]">
      {selections.map(selection => (
        <span key={selection} className="flex items-center px-3 py-1 bg-orange-600 text-white text-xs font-medium rounded-full shadow-md hover:bg-orange-700 transition-colors">
          {selection}
          <button 
            type="button" 
            onClick={() => onRemove(selection)}
            className="ml-1.5 -mr-0.5 p-0.5 text-orange-200 hover:text-white rounded-full focus:outline-none focus:bg-orange-800 transition-colors"
            aria-label={`Remove ${selection}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </span>
      ))}
    </div>
  );

  // Mix Feedback Handlers
  const handleMixAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_AUDIO_FILE_SIZE_BYTES) {
        setMixFeedbackError(`File is too large. Maximum size is ${MAX_AUDIO_FILE_SIZE_MB}MB.`);
        setMixFeedbackInputs(prev => ({ ...prev, audioFile: null }));
        if(audioFileInputRef.current) audioFileInputRef.current.value = ""; 
        return;
      }
      if (!file.type.startsWith('audio/')) {
        setMixFeedbackError('Invalid file type. Please upload an audio file (e.g., MP3, WAV).');
        setMixFeedbackInputs(prev => ({ ...prev, audioFile: null }));
        if(audioFileInputRef.current) audioFileInputRef.current.value = "";
        return;
      }
      setMixFeedbackInputs(prev => ({ ...prev, audioFile: file }));
      setMixFeedbackError(null); 
    }
  };

  const handleMixUserNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMixFeedbackInputs(prev => ({ ...prev, userNotes: e.target.value }));
  };

  const handleGetMixFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mixFeedbackInputs.audioFile) {
      setMixFeedbackError("Please upload an audio file for feedback.");
      return;
    }
    setIsGeneratingMixFeedback(true);
    setMixFeedbackResult(null);
    setMixFeedbackError(null);
    try {
      // Mix feedback generation is not streamed for now as it involves audio processing by AI first
      const feedback = await generateMixFeedback(mixFeedbackInputs);
      setMixFeedbackResult(feedback);
    } catch (err: any) {
      setMixFeedbackError(err.message || "An unknown error occurred while generating mix feedback.");
    } finally {
      setIsGeneratingMixFeedback(false);
    }
  };
  
  const resetMixFeedbackForm = () => {
    setMixFeedbackInputs(initialMixFeedbackInputsState);
    setMixFeedbackResult(null);
    setMixFeedbackError(null);
    if(audioFileInputRef.current) audioFileInputRef.current.value = "";
  };

  // Helper function to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix to get just the base64 data
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  // Mix Comparison Handlers
  const handleCompareMixes = async () => {
    if (!mixCompareInputs.mixA || !mixCompareInputs.mixB) {
      setMixCompareError("Please upload both Mix A and Mix B files.");
      return;
    }
    setIsGeneratingMixComparison(true);
    setMixCompareResult(null);
    setMixCompareError(null);
    try {
      // Convert files to base64 for the AI service
      const mixABase64 = await fileToBase64(mixCompareInputs.mixA);
      const mixBBase64 = await fileToBase64(mixCompareInputs.mixB);

      // Call the dedicated mix comparison service
      const comparisonInput = {
        mixAFile: mixABase64,
        mixBFile: mixBBase64,
        mixAName: mixCompareInputs.mixA.name,
        mixBName: mixCompareInputs.mixB.name,
        includeMixBFeedback: mixCompareInputs.includeMixBFeedback,
        userNotes: mixCompareInputs.userNotes
      };

      const feedback = await generateMixComparison(comparisonInput);
      setMixCompareResult(feedback);
    } catch (err: any) {
      setMixCompareError(err.message || "An unknown error occurred while comparing mixes.");
    } finally {
      setIsGeneratingMixComparison(false);
    }
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
  };

  // Determine TrackGuide Card Title
  let trackGuideCardTitle;
  const userProvidedSongTitle = inputs.songTitle?.trim();

  if (userProvidedSongTitle) {
      trackGuideCardTitle = `TrackGuide: ${userProvidedSongTitle}`;
  } else if (activeGuidebookDetails?.title) {
      // Extract the actual generated title from the stored title or content
      const storedTitle = activeGuidebookDetails.title;
      if (storedTitle.startsWith('TrackGuide for ')) {
          // If it's a fallback title, try to get the AI-generated title from content
          const aiGeneratedTitle = extractAiGeneratedTitleFromMarkdown(activeGuidebookDetails.content);
          if (aiGeneratedTitle) {
              trackGuideCardTitle = `TrackGuide: ${aiGeneratedTitle}`;
          } else {
              trackGuideCardTitle = storedTitle;
          }
      } else {
          trackGuideCardTitle = `TrackGuide: ${storedTitle}`;
      }
  } else if (isLoading && activeView === 'trackGuide') {
      const streamedSuggestedTitle = parseSuggestedTitleFromMarkdownStream(generatedGuidebook);
      if (streamedSuggestedTitle) {
          trackGuideCardTitle = `TrackGuide: ${streamedSuggestedTitle}`;
      } else {
          trackGuideCardTitle = "TrackGuide is generating...";
      }
  } else if (generatedGuidebook) {
      const finalSuggestedTitle = parseSuggestedTitleFromMarkdownStream(generatedGuidebook);
      if (finalSuggestedTitle) {
          trackGuideCardTitle = `TrackGuide: ${finalSuggestedTitle}`;
      } else {
           trackGuideCardTitle = "Generated TrackGuide";
      }
  } else {
      trackGuideCardTitle = "TrackGuide"; 
  }


  // Show landing page if activeView is 'landing'
  if (activeView === 'landing') {
    return <LandingPage onGetStarted={() => {
      setActiveView('trackGuide');
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
    }} />;
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-gray-100 p-4 md:p-6 lg:p-8 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, #FF5722 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>
      
      {/* Geometric Elements */}
      <div className="absolute top-10 right-10 w-32 h-32 opacity-10 pointer-events-none">
        <div className="w-full h-full border-2 border-orange-500 transform rotate-12 pointer-events-none"></div>
        <div className="absolute top-2 right-2 w-28 h-28 bg-orange-500 transform rotate-12 pointer-events-none"></div>
      </div>
      
      <header className="text-center mb-6 relative z-10">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-orange-500 transform rotate-45 flex items-center justify-center">
            <div className="w-4 h-4 bg-white transform -rotate-45"></div>
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              {APP_TITLE}
            </h1>
            <p className="text-gray-400 text-lg">Your Smartest Studio Assistant</p>
          </div>
        </div>
        <button
          onClick={() => setActiveView('landing')}
          className="mt-2 text-sm text-orange-500 hover:text-orange-400 transition-colors font-medium"
        >
          ← Back to Landing
        </button>
      </header>
      
  <nav className="mb-8 flex flex-col justify-center items-center md:flex-row md:justify-center gap-2 border-b border-orange-500/20 pb-3 relative z-10">
  <Button
    size="sm"
    className={`w-full md:w-auto px-3 py-2 text-xs md:text-sm rounded-md transition-all duration-150 ease-in-out ${
      activeView === 'trackGuide'
        ? 'bg-orange-500 shadow-lg hover:bg-orange-600'
        : 'bg-gray-700/80 hover:bg-gray-600/80 border border-gray-600'
    }`}
    onClick={() => setActiveView('trackGuide')}
    variant={activeView === 'trackGuide' ? 'primary' : 'secondary'}
    leftIcon={<TrackGuideLogo className="w-4 h-4" />}
  >
    TrackGuide AI
  </Button>

  <Button
    size="sm"
    className={`w-full md:w-auto px-3 py-2 text-xs md:text-sm rounded-md transition-all duration-150 ease-in-out ${
      activeView === 'remixGuide'
        ? 'bg-orange-500 shadow-lg hover:bg-orange-600'
        : 'bg-gray-700/80 hover:bg-gray-600/80 border border-gray-600'
    }`}
    onClick={() => setActiveView('remixGuide')}
    variant={activeView === 'remixGuide' ? 'primary' : 'secondary'}
    leftIcon={<span className="w-4 h-4 text-center">🎛️</span>}
  >
    RemixGuide AI
  </Button>

  <Button
    size="sm"
    className={`w-full md:w-auto px-3 py-2 text-xs md:text-sm rounded-md transition-all duration-150 ease-in-out ${
      activeView === 'mixFeedback'
        ? 'bg-orange-500 shadow-lg hover:bg-orange-600'
        : 'bg-gray-700/80 hover:bg-gray-600/80 border border-gray-600'
    }`}
    onClick={() => setActiveView('mixFeedback')}
    variant={activeView === 'mixFeedback' ? 'primary' : 'secondary'}
    leftIcon={<span className="w-4 h-4 text-center">🎚️</span>}
  >
    Mix Feedback AI
  </Button>



  <Button
    size="sm"
    className={`w-full md:w-auto px-3 py-2 text-xs md:text-sm rounded-md transition-all duration-150 ease-in-out ${
      activeView === 'eqGuide'
        ? 'bg-orange-500 shadow-lg hover:bg-orange-600'
        : 'bg-gray-700/80 hover:bg-gray-600/80 border border-gray-600'
    }`}
    onClick={() => setActiveView('eqGuide')}
    variant={activeView === 'eqGuide' ? 'primary' : 'secondary'}
    leftIcon={<AdjustmentsHorizontalIcon className="w-4 h-4" />}
  >
    EQ Guide
  </Button>


</nav>




      {activeView === 'trackGuide' && (
        <div className="max-w-full mx-auto grid grid-cols-1 lg:grid-cols-7 gap-6 px-4">
          <Card title="Blueprint Your Sound" className="lg:col-span-2 bg-gray-800/80 backdrop-blur-md shadow-xl border border-gray-700/50">
            <p className="text-sm text-gray-400 mb-4">Describe your vision—everything's optional.</p>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <Input label="Song Title / Project Name" name="songTitle" value={inputs.songTitle || ''} onChange={handleInputChange} placeholder="AI will suggest one if left blank" />
                </div>
                
                <div>
                  <Input label="Artist References" name="artistReference" value={inputs.artistReference} onChange={handleInputChange} placeholder="e.g., Daft Punk" />
                </div>

                <div>
                  <Input label="Song Reference" name="referenceTrackLink" value={inputs.referenceTrackLink || ''} onChange={handleInputChange} placeholder="e.g., YouTube, Spotify, SoundCloud link" />
                </div>

                <div className="space-y-2">
                  <div>
                    <label htmlFor="genre-input" className="block text-sm font-medium text-gray-300 mb-1.5">Genre(s)</label>
                    <div className="flex items-center gap-2">
                      <Input 
                        ref={genreInputRef}
                        id="genre-input"
                        name="currentGenreText" 
                        value={currentGenreText} 
                        onChange={handleInputChange}
                        onKeyDown={(e) => handleMultiSelectKeyDown(e, 'genre')}
                        placeholder="Type custom genre..." 
                        list="genre-suggestions" 
                        className="flex-grow"
                      />
                      <Button type="button" onClick={() => handleAddMultiSelectItem('genre')} size="sm" variant="secondary" aria-label="Add Genre" className="px-3">
                        <PlusIcon className="w-4 h-4" />
                      </Button>
                    </div>
                    <datalist id="genre-suggestions">
                        {GENRE_SUGGESTIONS.map(s => <option key={s} value={s} />)}
                    </datalist>
                    <SelectedPills selections={inputs.genre} onRemove={(val) => handleMultiSelectToggle('genre', val)} />
                  </div>

                  <div>
                    <label htmlFor="vibe-input" className="block text-sm font-medium text-gray-300 mb-1.5">Vibe / Mood</label>
                    <div className="flex items-center gap-2">
                        <Input 
                        ref={vibeInputRef}
                        id="vibe-input"
                        name="currentVibeText" 
                        value={currentVibeText} 
                        onChange={handleInputChange}
                        onKeyDown={(e) => handleMultiSelectKeyDown(e, 'vibe')}
                        placeholder="Type custom vibe..." 
                        list="vibe-suggestions" 
                        className="flex-grow"
                        />
                        <Button type="button" onClick={() => handleAddMultiSelectItem('vibe')} size="sm" variant="secondary" aria-label="Add Vibe" className="px-3">
                            <PlusIcon className="w-4 h-4" />
                        </Button>
                    </div>
                    <datalist id="vibe-suggestions">
                        {VIBE_SUGGESTIONS.map(s => <option key={s} value={s} />)}
                    </datalist>
                    <SelectedPills selections={inputs.vibe} onRemove={(val) => handleMultiSelectToggle('vibe', val)} />
                  </div>
                </div>

                <div>
                    <Input label="Preferred DAW" name="daw" value={inputs.daw} onChange={handleInputChange} placeholder="Type or select DAW..." list="daw-suggestions" />
                    <datalist id="daw-suggestions">
                        {DAW_SUGGESTIONS.map(s => <option key={s} value={s} />)}
                    </datalist>
                    <div className="flex flex-wrap gap-2 mt-2 mb-1">
                        {DAW_SUGGESTIONS.slice(0,5).map(suggestion => (
                            <button
                            key={suggestion}
                            type="button"
                            onClick={() => handleDAWSuggestionClick(suggestion)}
                            className={`px-3 py-1 text-xs rounded-full transition-all duration-150 ease-in-out shadow-sm hover:shadow-md ${
                                inputs.daw === suggestion 
                                ? 'bg-orange-600 text-white ring-2 ring-orange-400 ring-offset-2 ring-offset-gray-800' 
                                : 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-gray-100'
                            }`}
                            >
                            {suggestion}
                            </button>
                        ))}
                    </div>
                </div>
                
                <div>
                  <Textarea label="Available Plugins" name="plugins" value={inputs.plugins} onChange={handleInputChange} placeholder="e.g., Serum, Valhalla Reverbs, Arturia V Collection, or 'stock only'" rows={2} />
                </div>
                
                <div>
                  <Textarea label="Available Instruments" name="availableInstruments" value={inputs.availableInstruments || ''} onChange={handleInputChange} placeholder="e.g., Electric Guitar, Moog Subsequent 37, Roland TR-808, Vocals" rows={2} />
                </div>

                {/* Advanced Input Toggle */}
                <div className="border-t border-gray-600 pt-4">
                  <Button 
                    type="button" 
                    onClick={() => setShowAdvancedInput(!showAdvancedInput)}
                    variant="outline" 
                    className="mb-4 w-8 h-8 p-0 flex items-center justify-center"
                    title={showAdvancedInput ? 'Hide Advanced Input' : 'Show Advanced Input'}
                  >
                    <span className={`text-lg transition-transform ${showAdvancedInput ? 'rotate-45' : ''}`}>
                      +
                    </span>
                  </Button>

                  {showAdvancedInput && (
                    <div className="space-y-4 p-4 bg-gray-700/30 rounded-lg border border-gray-600/50">
                      {/* Key and Scale Row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Input label="Key" name="key" value={inputs.key || ''} onChange={handleInputChange} placeholder="e.g., C Major" />
                        </div>
                        <div>
                          <Input label="Scale/Mode" name="scale" value={inputs.scale || ''} onChange={handleInputChange} placeholder="e.g., Dorian, Mixolydian" />
                        </div>
                      </div>

                      {/* Chords and Lyrics Row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Input label="Chords" name="chords" value={inputs.chords || ''} onChange={handleInputChange} placeholder="e.g., Am - F - C - G" />
                        </div>
                        <div>
                          <Textarea label="Lyrics" name="lyrics" value={inputs.lyrics || ''} onChange={handleInputChange} placeholder="Paste your lyrics here if you have any..." rows={2} />
                        </div>
                      </div>

                      {/* General Notes for AI */}
                      <div>
                        <Textarea label="General Notes for AI" name="generalNotes" value={inputs.generalNotes || ''} onChange={handleInputChange} placeholder="Any specific instructions, style notes, or creative direction for the AI to consider..." rows={3} />
                      </div>
                    </div>
                  )}
                </div>
                <Button type="submit" disabled={isLoading} className="w-full text-base py-2.5" leftIcon={<TrackGuideLogo className="w-5 h-5"/>}>
                  {isLoading ? (loadingMessage || 'Generating...') : 'Generate TrackGuide'}
                </Button>
                <div className="flex space-x-2 mt-3">
                      <Button type="button" onClick={() => setShowLibraryModal(true)} variant="secondary" className="flex-1" leftIcon={<BookOpenIcon className="w-4 h-4"/>}>View Library</Button>
                      <Button type="button" onClick={resetFormForNewGuidebook} variant="outline" className="flex-1">Clear Form</Button>
                </div>
              </form>
            </Card>

          <div className="lg:col-span-5 space-y-6">
            {/* Main Error */}
            {error && !isLoading && (
              <Card className="border-red-500 bg-red-900/40 shadow-xl">
                <p className="text-red-300 font-semibold text-lg">TrackGuide Error:</p>
                <p className="text-red-300">{error}</p>
              </Card>
            )}

            {/* MIDI Error (from initial generation) - Show if no main error */}
            {midiError && !loadingMessage.toLowerCase().includes('midi') && !error && (
              <Card className="border-yellow-500 bg-yellow-900/40 shadow-xl">
                <p className="text-yellow-300 font-semibold text-lg">MIDI Generation Note:</p>
                <p className="text-yellow-300">{midiError}</p>
              </Card>
            )}

            {/* Render guidebook content as it streams or if fully loaded */}
            {(generatedGuidebook || (isLoading && loadingMessage.includes("TrackGuide is generating"))) && !error && (
              <Card 
                  title={trackGuideCardTitle} 
                  className="bg-gray-800/80 backdrop-blur-md shadow-xl border border-gray-700/50 sticky top-8"
                  titleClassName="border-b border-gray-700 text-xl"
              >
                {activeGuidebookDetails && !isLoading && ( // Show buttons only when not loading and details are available
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
                        {activeGuidebookDetails.generatedMidiPatterns && <p className="mt-1 text-green-400"><MusicNoteIcon className="w-4 h-4 inline mr-1"/> Initial MIDI patterns generated.</p>}
                    </div>
                  )}

                  <MarkdownRenderer content={generatedGuidebook} />
                  {isLoading && loadingMessage.includes("TrackGuide is generating") && <Spinner size="sm" text="Generating TrackGuide..." />}
                </div>
              </Card>
            )}
            
            {/* Global Loading Spinner for non-text-streaming phases */}
            {isLoading && !error && 
              loadingMessage && !loadingMessage.includes("TrackGuide is generating") && 
              (
                <div className="flex justify-center py-10">
                  <Spinner size="lg" text={loadingMessage || "Processing..."} />
                </div>
              )
            }
            
            {/* MIDI Generator appears after text is complete and activeGuidebookDetails is set and not main error */}
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

            {/* Initial Placeholder or if no content and not loading/error */}
            {!isLoading && !generatedGuidebook && !error && !activeGuidebookDetails && ( 
              <Card className="bg-gray-800/80 backdrop-blur-md shadow-xl border border-gray-700/50 flex flex-col items-center justify-center h-96 text-center min-h-[500px]">
                  <div className="flex justify-center mb-6">
                    <TrackGuideLogo className="w-20 h-20 opacity-80 text-orange-500"/>
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-200 mb-2">Produce Smarter. Create More.</h3>
                  <p className="text-gray-400 max-w-md mx-auto">Tell us what you’re envisioning—TrackGuide AI will generate a custom production guide and MIDI foundation.</p>
              </Card>
            )}
          </div>


        </div>
      )}

      {activeView === 'mixFeedback' && (
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-3 space-y-6">
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
                  <label htmlFor="mix-audio-file" className="block text-sm font-medium text-gray-300 mb-1">Audio File (.mp3, .wav, etc.)</label>
                  <div 
                    className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${mixFeedbackError && mixFeedbackInputs.audioFile === null ? 'border-red-500' : 'border-gray-600'} border-dashed rounded-md cursor-pointer hover:border-orange-500 transition-colors`}
                    onClick={() => audioFileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-orange-500');}}
                    onDragLeave={(e) => e.currentTarget.classList.remove('border-orange-500')}
                    onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('border-orange-500');
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            const file = e.dataTransfer.files[0];
                             if (file.size > MAX_AUDIO_FILE_SIZE_BYTES) {
                                setMixFeedbackError(`File is too large. Max ${MAX_AUDIO_FILE_SIZE_MB}MB.`); return;
                            }
                            if (!file.type.startsWith('audio/')) {
                                setMixFeedbackError('Invalid file type. Please upload audio.'); return;
                            }
                            setMixFeedbackInputs(prev => ({ ...prev, audioFile: file }));
                            setMixFeedbackError(null);
                        }
                    }}
                  >
                    <div className="space-y-1 text-center">
                      <UploadIcon className="mx-auto h-12 w-12 text-gray-500" />
                      <div className="flex text-sm text-gray-400">
                        <span className="relative rounded-md font-medium text-orange-400 hover:text-orange-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-900 focus-within:ring-orange-500">
                          <span>Upload a file</span>
                        </span>
                        <input id="mix-audio-file" name="mix-audio-file" type="file" className="sr-only" accept="audio/*" onChange={handleMixAudioFileChange} ref={audioFileInputRef} />
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">Max file size: {MAX_AUDIO_FILE_SIZE_MB}MB</p>
                    </div>
                  </div>
                  {mixFeedbackInputs.audioFile && <p className="text-xs text-green-400 mt-2">Selected: {mixFeedbackInputs.audioFile.name} ({(mixFeedbackInputs.audioFile.size / 1024 / 1024).toFixed(2)} MB)</p>}
                  {mixFeedbackError && mixFeedbackInputs.audioFile === null && <p className="text-xs text-red-400 mt-2">{mixFeedbackError}</p>}
                </div>
                <div>
                  <Textarea 
                    label="Notes for AI" 
                    name="mixUserNotes" 
                    value={mixFeedbackInputs.userNotes} 
                    onChange={handleMixUserNotesChange} 
                    placeholder="e.g., 'Focus on the low-end clarity', 'Is the vocal too loud?', 'General feedback welcome.'" 
                    rows={4}
                  />
                </div>
                <Button 
                    type="submit" 
                    disabled={isGeneratingMixFeedback || !mixFeedbackInputs.audioFile} 
                    className="w-full text-base py-2.5 !bg-orange-600 hover:!bg-orange-700 focus:!ring-orange-500"
                    leftIcon={<AdjustmentsHorizontalIcon className="w-5 h-5"/>}
                 >
                  {isGeneratingMixFeedback ? 'Analyzing Mix...' : 'Get Mix Feedback'}
                </Button>
                <Button type="button" onClick={resetMixFeedbackForm} variant="outline" className="w-full !border-orange-500 !text-orange-400 hover:!bg-orange-500 hover:!text-white">
                  Clear Mix Form
                </Button>
              </form>
            </Card>
            )}

            {mixFeedbackTab === 'compare' && (
              <div className="space-y-5">
                <Card title="Mix A (Original)" className="bg-gray-800/80 backdrop-blur-md shadow-xl border border-gray-700/50">
                  <div
                    className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${mixCompareError && !mixCompareInputs.mixA ? 'border-red-500' : 'border-gray-600'} border-dashed rounded-md cursor-pointer hover:border-orange-500 transition-colors`}
                    onClick={() => document.getElementById('mixA-upload')?.click()}
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
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (file.size > MAX_AUDIO_FILE_SIZE_BYTES) {
                                setMixCompareError(`File is too large. Max ${MAX_AUDIO_FILE_SIZE_MB}MB.`); return;
                              }
                              if (!file.type.startsWith('audio/')) {
                                setMixCompareError('Invalid file type. Please upload audio.'); return;
                              }
                              setMixCompareInputs(prev => ({ ...prev, mixA: file }));
                              setMixCompareError(null);
                            }}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">MP3, WAV, FLAC up to {MAX_AUDIO_FILE_SIZE_MB}MB</p>
                    </div>
                  </div>
                  {mixCompareInputs.mixA && <p className="text-xs text-green-400 mt-2">Selected: {mixCompareInputs.mixA.name} ({(mixCompareInputs.mixA.size / 1024 / 1024).toFixed(2)} MB)</p>}
                </Card>

                <Card title="Mix B (Revised)" className="bg-gray-800/80 backdrop-blur-md shadow-xl border border-gray-700/50">
                  <div
                    className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${mixCompareError && !mixCompareInputs.mixB ? 'border-red-500' : 'border-gray-600'} border-dashed rounded-md cursor-pointer hover:border-orange-500 transition-colors`}
                    onClick={() => document.getElementById('mixB-upload')?.click()}
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
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (file.size > MAX_AUDIO_FILE_SIZE_BYTES) {
                                setMixCompareError(`File is too large. Max ${MAX_AUDIO_FILE_SIZE_MB}MB.`); return;
                              }
                              if (!file.type.startsWith('audio/')) {
                                setMixCompareError('Invalid file type. Please upload audio.'); return;
                              }
                              setMixCompareInputs(prev => ({ ...prev, mixB: file }));
                              setMixCompareError(null);
                            }}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">MP3, WAV, FLAC up to {MAX_AUDIO_FILE_SIZE_MB}MB</p>
                    </div>
                  </div>
                  {mixCompareInputs.mixB && <p className="text-xs text-green-400 mt-2">Selected: {mixCompareInputs.mixB.name} ({(mixCompareInputs.mixB.size / 1024 / 1024).toFixed(2)} MB)</p>}
                  
                  {/* Include general mix feedback checkbox */}
                  <div className="mt-4 pt-4 border-t border-gray-600">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={mixCompareInputs.includeMixBFeedback || false}
                        onChange={(e) => setMixCompareInputs(prev => ({ ...prev, includeMixBFeedback: e.target.checked }))}
                        className="w-4 h-4 text-orange-600 bg-gray-700 border-gray-600 rounded focus:ring-orange-500 focus:ring-2"
                      />
                      <span className="text-sm text-gray-300">Include Individual Analysis</span>
                    </label>
                  </div>
                </Card>

                <Card title="Notes for AI" className="bg-gray-800/80 backdrop-blur-md shadow-xl border border-gray-700/50">
                  <Textarea
                    placeholder="Describe what you want the AI to focus on when comparing these mixes. For example: 'Focus on the vocal clarity and low-end balance' or 'Compare the stereo width and overall loudness'..."
                    value={mixCompareInputs.userNotes}
                    onChange={(e) => setMixCompareInputs(prev => ({ ...prev, userNotes: e.target.value }))}
                    rows={3}
                    className="w-full"
                  />
                </Card>



                <Button
                  onClick={handleCompareMixes}
                  disabled={isGeneratingMixComparison || !mixCompareInputs.mixA || !mixCompareInputs.mixB}
                  variant="primary"
                  className="w-full px-4 py-3 text-base font-semibold"
                  leftIcon={<span className="w-5 h-5 text-center">⚖️</span>}
                >
                  {isGeneratingMixComparison ? 'Comparing Mixes...' : 'Compare Mixes'}
                </Button>

                <Button 
                  type="button" 
                  onClick={resetMixCompareForm} 
                  variant="outline" 
                  className="w-full !border-orange-500 !text-orange-400 hover:!bg-orange-500 hover:!text-white"
                >
                  Reset
                </Button>

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
            {(isGeneratingMixFeedback || isGeneratingMixComparison) && (
              <div className="flex justify-center items-center h-full min-h-[500px]">
                <Spinner size="lg" color="text-orange-500" text={
                  mixFeedbackTab === 'single' 
                    ? "AI is analyzing your mix... this may take a moment."
                    : "AI is comparing your mixes... this may take a moment."
                }/>
              </div>
            )}
            {mixFeedbackError && !isGeneratingMixFeedback && mixFeedbackTab === 'single' && (
              <Card className="border-red-500 bg-red-900/40 shadow-xl">
                <p className="text-red-300 font-semibold text-lg">Mix Feedback Error:</p>
                <p className="text-red-300">{mixFeedbackError}</p>
              </Card>
            )}
            {mixCompareError && !isGeneratingMixComparison && mixFeedbackTab === 'compare' && (
              <Card className="border-red-500 bg-red-900/40 shadow-xl">
                <p className="text-red-300 font-semibold text-lg">Mix Comparison Error:</p>
                <p className="text-red-300">{mixCompareError}</p>
              </Card>
            )}
            {mixFeedbackResult && !isGeneratingMixFeedback && mixFeedbackTab === 'single' && (
              <Card 
                title="AI Mix Feedback Report" 
                className="bg-gray-800/80 backdrop-blur-md shadow-xl border border-gray-700/50 sticky top-8"
                titleClassName="border-b border-gray-700 text-xl !text-orange-300"
              >

                <div id="mix-feedback-display" className="prose prose-sm md:prose-base prose-invert max-w-none max-h-[calc(100vh-6rem)] overflow-y-auto pr-3 text-gray-300 custom-scrollbar guidebook-content">
                  <MarkdownRenderer content={mixFeedbackResult} />
                </div>
              </Card>
            )}
            {mixCompareResult && !isGeneratingMixComparison && mixFeedbackTab === 'compare' && (
              <Card 
                title="AI Mix Comparison Report" 
                className="bg-gray-800/80 backdrop-blur-md shadow-xl border border-gray-700/50 sticky top-8"
                titleClassName="border-b border-gray-700 text-xl !text-orange-300"
              >

                <div id="mix-comparison-display" className="prose prose-sm md:prose-base prose-invert max-w-none max-h-[calc(100vh-6rem)] overflow-y-auto pr-3 text-gray-300 custom-scrollbar guidebook-content">
                  <MarkdownRenderer content={mixCompareResult} />
                </div>
              </Card>
            )}
            {!isGeneratingMixFeedback && !isGeneratingMixComparison && !mixFeedbackResult && !mixCompareResult && !mixFeedbackError && !mixCompareError && (
              <Card className="bg-gray-800/80 backdrop-blur-md shadow-xl border border-gray-700/50 flex flex-col items-center justify-center h-96 text-center min-h-[500px]">
                  <div className="flex justify-center mb-6">
                    <TrackGuideLogo className="w-20 h-20 opacity-80"/>
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-200 mb-2">Refine Your Sound.</h3>
                  <p className="text-gray-400 max-w-md">
                    {mixFeedbackTab === 'single' 
                      ? 'Upload your mix, add some notes, and get detailed feedback from our AI mixing engineer.'
                      : 'Upload two mix versions to compare them side-by-side and get detailed analysis of the differences.'
                    }
                  </p>
              </Card>
            )}
          </div>
        </div>
      )}

      {activeView === 'remixGuide' && (
        <div className="max-w-7xl mx-auto">
          <RemixGuideAI />
        </div>
      )}



      {activeView === 'eqGuide' && (
        <div className="max-w-7xl mx-auto">
          <EQCheatSheet isOpen={true} onClose={() => setActiveView('trackGuide')} />
        </div>
      )}

      {showLibraryModal && (
        <LibraryModal
          library={library}
          onClose={() => setShowLibraryModal(false)}
          onLoadEntry={handleLoadFromLibrary}
          onDeleteEntry={handleDeleteFromLibrary}
          onCreateNew={resetFormForNewGuidebook}
        />
      )}

      {/* Production Coach - Always Available */}
      <AIAssistant
        isOpen={true}
        onClose={() => {}} // Not used in collapsed mode
        currentGuidebook={activeGuidebookDetails || undefined}
        userInputs={inputs}
        isCollapsed={isProductionCoachCollapsed}
        onToggle={() => setIsProductionCoachCollapsed(!isProductionCoachCollapsed)}
      />





       <footer className="text-center mt-16 py-8 border-t border-gray-700/60">
        <p className="text-sm text-gray-500">{APP_TITLE} - AI Production Assistant</p>
      </footer>
    </div>
  );
};

export default App;
