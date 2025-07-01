import { useState, useEffect } from 'react';
import { UserInputs, GuidebookEntry, MidiSettings, GeneratedMidiPatterns } from '../types/appTypes';
import { generateGuidebookContent, generateMidiPatternSuggestions } from '../services/geminiService';
import { parseAiMidiResponse } from '../utils/jsonParsingUtils';
import { stopPlayback } from '../services/audioService';
import { MIDI_DEFAULT_SETTINGS, MIDI_SCALES, MIDI_CHORD_PROGRESSIONS, MIDI_TEMPO_RANGES, LAST_USED_DAW_KEY, LAST_USED_PLUGINS_KEY } from '../constants/constants';
import { 
  parseBpmFromGuidebook, 
  parseChordProgressionFromGuidebook, 
  extractEssentialMidiContext, 
  parseSuggestedTitleFromMarkdownStream 
} from '../utils/guidebookUtils';
import { initialInputsState } from '../constants/initialStates';
import { useAppStore } from '../store/useAppStore';

/**
 * Custom hook for TrackGuide feature logic
 */
export const useTrackGuide = () => {
  const {
    inputs, setInputs,
    activeGuidebookDetails, setActiveGuidebookDetails,
    library, setLibrary,
    generatedGuidebook, setGeneratedGuidebook,
    error, setError,
    midiError, setMidiError,
    copyStatus, setCopyStatus,
    isLoading, setIsLoading,
    loadingMessage, setLoadingMessage,
  } = useAppStore();

  /**
   * Extracts AI-generated title from markdown content
   */
  const extractAiGeneratedTitleFromMarkdown = (markdownText: string): string | null => {
    const match = markdownText.match(/^#\s*TRACKGUIDE:\s*"?([^"\n]+)"?/im);
    return match && match[1] ? match[1].trim() : null;
  };

  /**
   * Resets the form for a new guidebook
   */
  const resetFormForNewGuidebook = () => {
    const lastUsedDAW = localStorage.getItem(LAST_USED_DAW_KEY) || '';
    const lastUsedPlugins = localStorage.getItem(LAST_USED_PLUGINS_KEY) || '';
    setInputs({
      ...initialInputsState,
      songTitle: '', 
      daw: lastUsedDAW,
      plugins: lastUsedPlugins,
    });
    setGeneratedGuidebook("");
    setActiveGuidebookDetails(null);
    setError(null);
    setMidiError(null);
    setCopyStatus('');
    stopPlayback();
  };

  /**
   * Handles the submission of TrackGuide form
   */
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
      
      // Added: Abort controller for stream cancellation
      const abortController = new AbortController();
      const signal = abortController.signal;
      
      try {
        for await (const chunk of guidebookStream) {
          if (signal.aborted) break;
          finalGuidebookContent += chunk.text;
          setGeneratedGuidebook(prev => prev + chunk.text);
        }
      } catch (streamError) {
        if (streamError instanceof Error && !signal.aborted) {
          throw streamError;
        }
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
      const initialTargetInstruments: string[] = ['chords', 'bassline', 'melody', 'drums'];

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
        
        initialPatternsData = parseAiMidiResponse<GeneratedMidiPatterns>(accumulatedMidiJson, 'initial MIDI generation');
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

  /**
   * Handles saving a guidebook to library
   */
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

  /**
   * Updates MIDI settings and patterns for a guidebook entry
   */
  const handleUpdateGuidebookEntryMidi = (midiSettings: MidiSettings, generatedMidiPatterns: GeneratedMidiPatterns) => {
    setActiveGuidebookDetails(prev => {
        if (!prev) return null; 
        return {
            ...prev, 
            midiSettings,
            generatedMidiPatterns,
        };
    });
  };

  return {
    handleSubmit,
    resetFormForNewGuidebook,
    handleSaveToLibrary,
    handleUpdateGuidebookEntryMidi,
    extractAiGeneratedTitleFromMarkdown,
  };
};

/**
 * Parse key from guidebook content
 */
export const parseKeyFromGuidebook = (content: string): string | null => {
  // Enhanced key detection patterns
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
        
        if (MIDI_SCALES.includes(k) || MIDI_SCALES.includes(normalizedKey)) {
          return MIDI_SCALES.includes(k) ? k : normalizedKey;
        }
      }
      
      // Fallback: try to match the first key
      const firstKey = keys[0];
      if (firstKey) {
        for (const scale of MIDI_SCALES) {
          if (firstKey.toLowerCase().startsWith(scale.split(' ')[0].toLowerCase())) {
            if (firstKey.toLowerCase().includes('minor')) {
              if (scale.includes('Minor')) return scale;
            } else {
              if (scale.includes('Major')) return scale;
            }
          }
        }
        return firstKey; 
      }
    }
  }
  return null;
};