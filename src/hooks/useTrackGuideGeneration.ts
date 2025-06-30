import { useState } from 'react';
import { UserInputs, GuidebookEntry, MidiSettings, GeneratedMidiPatterns } from '../types/appTypes';
import { useAppStore } from '../store/useAppStore';
import { 
  generateGuidebookContent, 
  generateMidiPatternSuggestions 
} from '../services/geminiService';
import { parseAiMidiResponse } from '../utils/jsonParsingUtils';
import { KeyParsingService } from '../services/keyParsing.service';
import { TitleExtractionService } from '../services/titleExtraction.service';
import {
  parseBpmFromGuidebook,
  parseChordProgressionFromGuidebook,
  extractEssentialMidiContext
} from '../utils/guidebookUtils';
import { 
  MIDI_DEFAULT_SETTINGS, 
  MIDI_CHORD_PROGRESSIONS, 
  MIDI_TEMPO_RANGES 
} from '../constants/constants';

export const useTrackGuideGeneration = () => {
  const {
    generatedGuidebook,
    setGeneratedGuidebook,
    activeGuidebookDetails,
    setActiveGuidebookDetails,
    error,
    setError,
    midiError,
    setMidiError,
    isLoading,
    setIsLoading,
    loadingMessage,
    setLoadingMessage
  } = useAppStore();

  const generateTrackGuide = async (inputs: UserInputs) => {
    setIsLoading(true);
    setError(null);
    setMidiError(null);
    setGeneratedGuidebook("");
    setActiveGuidebookDetails(null);

    // Auto-scroll to top when generation starts
    window.scrollTo({ top: 0, behavior: 'smooth' });

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
      
      const aiGeneratedTitle = TitleExtractionService.extractAiGeneratedTitleFromMarkdown(finalGuidebookContent);
      const entryTitle = inputs.songTitle?.trim() ? inputs.songTitle.trim() : (aiGeneratedTitle || `TrackGuide for ${inputs.genre.join(', ') || 'Unknown Genre'}`);
      
      const newEntryId = Date.now().toString();
      const createdAt = new Date().toISOString();
      
      const parsedBpm = parseBpmFromGuidebook(finalGuidebookContent);
      const parsedKey = KeyParsingService.parseKeyFromGuidebook(finalGuidebookContent);
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
        initialPatternsData = undefined;
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
        content: finalGuidebookContent,
        createdAt,