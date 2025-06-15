
import React, { useState, useEffect, useRef } from 'react';
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
import { MidiGeneratorComponent } from './components/MidiGeneratorComponent.tsx';
import { LibraryModal } from './components/LibraryModal.tsx';
import { stopPlayback } from './services/audioService.ts';


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

  const handleMixAnalysis = async (mixA: File | null, mixB: File | null) => {
    // This would integrate with audio analysis service in production
    // For now, the component handles demo analysis internally
    console.log('Analyzing mixes:', mixA?.name, mixB?.name);
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

    if (inputs.daw) localStorage.setItem(LAST_USED_DAW_KEY, inputs.daw);
    if (inputs.plugins) localStorage.setItem(LAST_USED_PLUGINS_KEY, inputs.plugins);

    let finalGuidebookContent = "";
    let initialPatternsData: GeneratedMidiPatterns | undefined;
    let finalMidiSettings: MidiSettings | undefined;

    try {
      setLoadingMessage('TrackGuide is generating...');
      const guidebookStream = await generateGuidebookContent(inputs);
      for await (const chunk of guidebookStream) {
        const chunkText = typeof chunk.text === 'function' ? chunk.text() : chunk.text;
        finalGuidebookContent += chunkText;
        setGeneratedGuidebook(prev => prev + chunkText);
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
          const chunkText = typeof chunk.text === 'function' ? chunk.text() : chunk.text;
          accumulatedMidiJson += chunkText;
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

  const handleCopyFormattedContent = async (elementId: string) => {
    const contentDisplayElement = document.getElementById(elementId);
    if (!contentDisplayElement) {
      setCopyStatus("Content area not found.");
      setTimeout(() => setCopyStatus(''), 3000);
      return;
    }

    const htmlContent = contentDisplayElement.innerHTML;
    const plainTextContent = getFormattedTextFromHtmlElement(contentDisplayElement.cloneNode(true) as HTMLElement);

    try {
      if (navigator.clipboard && navigator.clipboard.write) {
        const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
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
            <strong className="text-purple-300 font-semibold mr-1.5">{label}:</strong> 
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
        elements.push(<h1 key={key} className="text-3xl font-bold mt-6 mb-4 text-purple-300 break-words flex items-center"><MusicNoteIcon className="w-6 h-6 mr-3 text-purple-400 opacity-80" />{actualTitle}</h1>); return;
      }
      if (lineContent.startsWith('# ') && !isMixFeedback) { elements.push(<h1 key={key} className="text-3xl font-bold mt-6 mb-4 text-purple-300 break-words flex items-center"><MusicNoteIcon className="w-6 h-6 mr-3 text-purple-400 opacity-80" />{String.prototype.substring.call(processedLine, 2)}</h1>); return; }
      if (lineContent.startsWith('# ') && isMixFeedback) { elements.push(<h1 key={key} className="text-3xl font-bold mt-6 mb-4 text-teal-300 break-words flex items-center"><AdjustmentsHorizontalIcon className="w-6 h-6 mr-3 text-teal-400 opacity-80" />{String.prototype.substring.call(processedLine, 2)}</h1>); return; }
      
      if (lineContent.startsWith('## ')) { 
        const titleText = String.prototype.substring.call(processedLine, 3);
        const iconColor = isMixFeedback ? "text-teal-500" : "text-purple-500";
        const titleColor = isMixFeedback ? "text-teal-400" : "text-purple-400";
        const IconComponent = isMixFeedback ? AdjustmentsHorizontalIcon : MusicNoteIcon;
        elements.push(<h2 key={key} className={`text-2xl font-semibold mt-10 mb-4 pt-4 border-t border-gray-700 ${titleColor} break-words flex items-center guidebook-section-break`}><IconComponent className={`w-5 h-5 mr-2 ${iconColor} opacity-70`} />{titleText}</h2>); 
        return; 
      }
      if (lineContent.startsWith('### ')) { 
        const sectionTitleText = String.prototype.substring.call(processedLine, 4);
        const titleColor = isMixFeedback ? "text-teal-300" : "text-purple-300";
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
              const headerBaseColor = isMixFeedback ? "bg-teal-800/30" : "bg-purple-800/30";
              const headerTextColor = isMixFeedback ? "text-teal-200" : "text-purple-200";
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
        <span key={selection} className="flex items-center px-3 py-1 bg-purple-600 text-white text-xs font-medium rounded-full shadow-md hover:bg-purple-700 transition-colors">
          {selection}
          <button 
            type="button" 
            onClick={() => onRemove(selection)}
            className="ml-1.5 -mr-0.5 p-0.5 text-purple-200 hover:text-white rounded-full focus:outline-none focus:bg-purple-800 transition-colors"
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

  // Determine TrackGuide Card Title
  let trackGuideCardTitle;
  const userProvidedSongTitle = inputs.songTitle?.trim();

  if (userProvidedSongTitle) {
      trackGuideCardTitle = `TrackGuide: ${userProvidedSongTitle}`;
  } else if (activeGuidebookDetails?.title && activeGuidebookDetails.title !== `TrackGuide for ${inputs.genre.join(', ') || 'Unknown Genre'}`) {
      trackGuideCardTitle = `TrackGuide: ${activeGuidebookDetails.title}`;
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
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-4 space-y-6">
            <Card title="Blueprint Your Sound" className="bg-gray-800/80 backdrop-blur-md shadow-xl border border-gray-700/50">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Input label="Song Title / Project Name (Optional)" name="songTitle" value={inputs.songTitle || ''} onChange={handleInputChange} placeholder="AI suggests a title if blank" />
                </div>
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
                  <Input label="Artist/Song Reference(s) (Optional)" name="artistReference" value={inputs.artistReference} onChange={handleInputChange} placeholder="e.g., Daft Punk - Around the World" />
                </div>
                
                <div>
                  <label htmlFor="vibe-input" className="block text-sm font-medium text-gray-300 mb-1.5">Vibe(s) / Mood(s)</label>
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
                              ? 'bg-purple-600 text-white ring-2 ring-purple-400 ring-offset-2 ring-offset-gray-800' 
                              : 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-gray-100'
                          }`}
                          >
                          {suggestion}
                          </button>
                      ))}
                  </div>
                </div>
                <div>
                  <Textarea label="Available Plugins (Optional)" name="plugins" value={inputs.plugins} onChange={handleInputChange} placeholder="e.g., Serum, Valhalla Reverbs, Arturia V Collection, or type 'stock only'" />
                </div>
                <div>
                  <Textarea label="Available Instruments (Optional)" name="availableInstruments" value={inputs.availableInstruments || ''} onChange={handleInputChange} placeholder="e.g., Guitar, Analog Synth, MPC, Vocals" />
                  <Input label="Reference Track (Optional)" name="referenceTrack" value={inputs.referenceTrack || ''} onChange={handleInputChange} placeholder="e.g., Spotify/YouTube link or artist - song name" />
                </div>
                <Button type="submit" disabled={isLoading} className="w-full text-base py-2.5" leftIcon={<SparklesIcon className="w-5 h-5"/>}>
                  {isLoading ? (loadingMessage || 'Generating...') : 'Generate TrackGuide'}
                </Button>
                <div className="flex space-x-2 mt-3">
                      <Button type="button" onClick={() => setShowLibraryModal(true)} variant="secondary" className="flex-1" leftIcon={<BookOpenIcon className="w-4 h-4"/>}>View Library</Button>
                      <Button type="button" onClick={resetFormForNewGuidebook} variant="outline" className="flex-1">Clear Form</Button>
                </div>
              </form>
            </Card>
          </div>

          <div className="md:col-span-8 space-y-6">
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
                    <Button onClick={() => handleCopyFormattedContent('guidebook-content-display')} variant="outline" leftIcon={<CopyIcon />}>Copy TrackGuide</Button>
                    {copyStatus && <span className={`ml-3 text-sm ${copyStatus.includes("Failed") || copyStatus.includes("not supported") ? "text-red-400" : "text-green-400"}`}>{copyStatus}</span>}
                  </div>
                )}
                <div id="guidebook-content-display" className="prose prose-sm md:prose-base prose-invert max-w-none max-h-[calc(100vh-18rem)] overflow-y-auto pr-3 text-gray-300 custom-scrollbar guidebook-content">
                  {activeGuidebookDetails && !isLoading && (
                     <div className="mb-6 p-4 bg-gray-700/50 rounded-lg text-sm shadow-inner border border-gray-600/50 guidebook-section-break"> 
                        <strong className="text-purple-300 block mb-2 text-base">TrackGuide Snapshot:</strong>
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
                  {useMarkdownRenderer ? (
                    <MarkdownRenderer 
                      content={generatedGuidebook}
                      title={activeGuidebookDetails?.title}
                      onCopy={() => handleCopyFormattedContent('guidebook-display')}
                      onExportPDF={() => {
                        // TODO: Implement PDF export functionality
                        console.log('PDF export not yet implemented');
                      }}
                    />
                  ) : (
                    renderMarkdown(generatedGuidebook)
                  )}
                  {isLoading && loadingMessage.includes("TrackGuide is generating") && <Spinner size="sm" text="Receiving content..." />}
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
              <Card className="bg-gray-800/80 backdrop-blur-md shadow-xl border border-gray-700/50 flex flex-col items-center justify-center h-96 text-center min-h-[300px]">
                  <SparklesIcon className="w-20 h-20 text-purple-500 mb-6 opacity-80"/>
                  <h3 className="text-2xl font-semibold text-gray-200 mb-2">Produce Smarter. Create More.</h3>
                  <p className="text-gray-400 max-w-md">Tell us what you’re envisioning—TrackGuide AI will generate a custom production guide and MIDI foundation.</p>
              </Card>
            )}
          </div>
        </div>
      )}

      {activeView === 'mixFeedback' && (
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-4 space-y-6">
            <Card title="Upload Your Mix" className="bg-gray-800/80 backdrop-blur-md shadow-xl border border-gray-700/50">
              <form onSubmit={handleGetMixFeedback} className="space-y-5">
                <div>
                  <label htmlFor="mix-audio-file" className="block text-sm font-medium text-gray-300 mb-1">Audio File (.mp3, .wav, etc.)</label>
                  <div 
                    className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${mixFeedbackError && mixFeedbackInputs.audioFile === null ? 'border-red-500' : 'border-gray-600'} border-dashed rounded-md cursor-pointer hover:border-teal-500 transition-colors`}
                    onClick={() => audioFileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-teal-500');}}
                    onDragLeave={(e) => e.currentTarget.classList.remove('border-teal-500')}
                    onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('border-teal-500');
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
                        <span className="relative rounded-md font-medium text-teal-400 hover:text-teal-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-900 focus-within:ring-teal-500">
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
                    label="Notes for AI (Optional)" 
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
                    className="w-full text-base py-2.5 !bg-teal-600 hover:!bg-teal-700 focus:!ring-teal-500"
                    leftIcon={<AdjustmentsHorizontalIcon className="w-5 h-5"/>}
                 >
                  {isGeneratingMixFeedback ? 'Analyzing Mix...' : 'Get Mix Feedback'}
                </Button>
                <Button type="button" onClick={resetMixFeedbackForm} variant="outline" className="w-full !border-teal-500 !text-teal-400 hover:!bg-teal-500 hover:!text-white">
                  Clear Mix Form
                </Button>
              </form>
            </Card>
          </div>
          <div className="md:col-span-8 space-y-6">
            {isGeneratingMixFeedback && (
              <div className="flex justify-center items-center h-full min-h-[300px]">
                <Spinner size="lg" color="text-teal-500" text="AI is analyzing your mix... this may take a moment."/>
              </div>
            )}
            {mixFeedbackError && !isGeneratingMixFeedback && (
              <Card className="border-red-500 bg-red-900/40 shadow-xl">
                <p className="text-red-300 font-semibold text-lg">Mix Feedback Error:</p>
                <p className="text-red-300">{mixFeedbackError}</p>
              </Card>
            )}
            {mixFeedbackResult && !isGeneratingMixFeedback && (
              <Card 
                title="AI Mix Feedback Report" 
                className="bg-gray-800/80 backdrop-blur-md shadow-xl border border-gray-700/50 sticky top-8"
                titleClassName="border-b border-gray-700 text-xl !text-teal-300"
              >
                 <div className="flex flex-wrap gap-3 mb-5 pb-4 border-b border-gray-700 items-center">
                  <Button onClick={() => handleCopyFormattedContent('mix-feedback-display')} variant="outline" className="!border-teal-500 !text-teal-400 hover:!bg-teal-500 hover:!text-white" leftIcon={<CopyIcon />}>Copy Feedback</Button>
                  {copyStatus && <span className={`ml-3 text-sm ${copyStatus.includes("Failed") ? "text-red-400" : "text-green-400"}`}>{copyStatus}</span>}
                </div>
                <div id="mix-feedback-display" className="prose prose-sm md:prose-base prose-invert max-w-none max-h-[calc(100vh-18rem)] overflow-y-auto pr-3 text-gray-300 custom-scrollbar guidebook-content">
                  {renderMarkdown(mixFeedbackResult, true)}
                </div>
              </Card>
            )}
            {!isGeneratingMixFeedback && !mixFeedbackResult && !mixFeedbackError && (
              <Card className="bg-gray-800/80 backdrop-blur-md shadow-xl border border-gray-700/50 flex flex-col items-center justify-center h-96 text-center min-h-[300px]">
                  <AdjustmentsHorizontalIcon className="w-20 h-20 text-teal-500 mb-6 opacity-80"/>
                  <h3 className="text-2xl font-semibold text-gray-200 mb-2">Refine Your Sound.</h3>
                  <p className="text-gray-400 max-w-md">Upload your mix, add some notes, and get detailed feedback from our AI mixing engineer.</p>
              </Card>
            )}
          </div>
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
