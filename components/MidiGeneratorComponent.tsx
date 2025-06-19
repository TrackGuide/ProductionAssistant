
import React, { useState, useEffect, useRef } from 'react';
import { MidiSettings, GeneratedMidiPatterns, UserInputs, GuidebookEntry, KeyOfGeneratedMidiPatterns } from '../types.ts';
import { generateMidiPatternSuggestions } from '../services/geminiService.ts';
import { generateMidiFile, downloadMidi } from '../services/midiService.ts';
import { playMidiPatterns, stopPlayback, initializeAudio } from '../services/audioService.ts';
import { Card } from './Card.tsx';
import { Button } from './Button.tsx';
import { Spinner } from './Spinner.tsx';
import { Input } from './Input.tsx';
import { PlayIcon, StopIcon, DownloadIcon, RefreshIcon, CheckboxCheckedIcon, CheckboxUncheckedIcon, KeyboardIcon } from './icons.tsx';
import { MIDI_SCALES, MIDI_MODES, MIDI_TIME_SIGNATURES, MIDI_DEFAULT_SETTINGS, MIDI_CHORD_PROGRESSIONS, MIDI_TEMPO_RANGES, GENRE_SUGGESTIONS, MIDI_TARGET_INSTRUMENTS, MIDI_SONG_SECTIONS } from '../constants.ts';

const extractRichMidiContext = (guidebookContent: string): string => {
  if (!guidebookContent) return "General musical context. Focus on genre and vibe.";
  const summaryEndIndex = guidebookContent.indexOf('## 3. Instrument & Sound Design Guide');
  const endIndex = summaryEndIndex > 0 ? summaryEndIndex : (guidebookContent.indexOf('## 2. Structural Blueprint') > 0 ? guidebookContent.indexOf('## 2. Structural Blueprint') : 1500);
  return guidebookContent.substring(0, Math.min(endIndex, guidebookContent.length));
};

const getKeyCenterFromScale = (keyScale: string): string => {
  const match = keyScale.match(/^([A-G][#b]?)/);
  return match ? match[1] : 'C';
};

const getAvailableModesForKey = (keyScale: string): string[] => {
  const keyCenter = getKeyCenterFromScale(keyScale);
  return MIDI_MODES[keyCenter] || MIDI_MODES['C'];
};

const BAR_OPTIONS = [1, 2, 4, 8, 16, 32];

export const MidiGeneratorComponent: React.FC<{ currentGuidebookEntry?: GuidebookEntry; mainAppInputs?: UserInputs; onUpdateGuidebookEntryMidi?: (midiSettings: MidiSettings, generatedMidiPatterns: GeneratedMidiPatterns) => void; parsedGuidebookBpm?: number | null; parsedGuidebookKey?: string | null; parsedGuidebookChordProg?: string | null; initialPatterns?: { [section: string]: { [instrument: string]: string } }; sections?: string[]; targetTempo?: number; targetKey?: string; isRemixMode?: boolean; }> = ({ currentGuidebookEntry, mainAppInputs, onUpdateGuidebookEntryMidi, parsedGuidebookBpm, parsedGuidebookKey, parsedGuidebookChordProg, initialPatterns, sections, targetTempo, targetKey, isRemixMode = false }) => {

  const [settings, setSettings] = useState<MidiSettings>(() => {
    const initialGenre = currentGuidebookEntry?.genre?.[0] || mainAppInputs?.genre?.[0] || MIDI_DEFAULT_SETTINGS.genre;
    const tempoRange = MIDI_TEMPO_RANGES[initialGenre] || MIDI_TEMPO_RANGES.Default;
    const defaultTempo = Math.round((tempoRange[0] + tempoRange[1]) / 2);
    return {
      ...MIDI_DEFAULT_SETTINGS,
      genre: initialGenre,
      key: parsedGuidebookKey || MIDI_DEFAULT_SETTINGS.key,
      tempo: parsedGuidebookBpm || defaultTempo,
      chordProgression: parsedGuidebookChordProg || (MIDI_CHORD_PROGRESSIONS[initialGenre] || MIDI_CHORD_PROGRESSIONS.Default)[0],
      guidebookContext: extractRichMidiContext(currentGuidebookEntry?.content || ''),
    };
  });

  const [patterns, setPatterns] = useState<GeneratedMidiPatterns | null>(currentGuidebookEntry?.generatedMidiPatterns || null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const isPlayingRef = useRef(isPlaying);
  const [showSettingsInputs, setShowSettingsInputs] = useState(false);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const handleGeneratePatterns = async () => {
    setIsLoading(true);
    setLoadingMessage('Generating MIDI patterns...');
    setError(null);
    if (isPlayingRef.current) {
      stopPlayback();
      setIsPlaying(false);
    }
    await initializeAudio();

    try {
      const midiResult = await generateMidiPatternSuggestions(settings);
      const jsonStr = typeof midiResult === 'string' ? midiResult.trim() : JSON.stringify(midiResult);
      const patternsData = JSON.parse(jsonStr) as GeneratedMidiPatterns;
      setPatterns(patternsData);
      onUpdateGuidebookEntryMidi?.(settings, patternsData);
    } catch (err: any) {
      console.error("MIDI Generation Error:", err);
      setError(`Failed to generate MIDI patterns: ${err.message}`);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handlePlayAll = async () => {
    if (!patterns) return;
    await initializeAudio();
    if (isPlayingRef.current) {
      stopPlayback();
      setIsPlaying(false);
    }
    playMidiPatterns(patterns, settings);
    setIsPlaying(true);
  };

  const handleStopAll = () => {
    stopPlayback();
    setIsPlaying(false);
  };

  const handleDownloadAll = () => {
    if (!patterns) return;
    const filenameBase = (currentGuidebookEntry?.title || 'TrackGuideMIDI').replace(/[^a-z0-9_.-]/gi, '_');
    const midiData = generateMidiFile(patterns, settings, filenameBase);
    if (midiData) {
      downloadMidi(midiData, `${filenameBase}_all_tracks.mid`);
    } else {
      alert("No MIDI data to download or error in generation.");
    }
  };

  const renderTrackCard = (trackId: KeyOfGeneratedMidiPatterns, label: string) => {
    if (!patterns || !patterns[trackId]) return null;
    return (
      <Card key={trackId} title={label} className="p-4 border border-gray-600 rounded-md">
        <Button onClick={() => handlePlayAll()} leftIcon={<PlayIcon />} className="mr-2">Play</Button>
        <Button onClick={() => handleDownloadAll()} leftIcon={<DownloadIcon />}>Download</Button>
      </Card>
    );
  };

  return (
    <Card title="🎹 MIDI Tools & Pattern Generator">
      <Button onClick={() => setShowSettingsInputs(!showSettingsInputs)} variant="secondary" className="mb-4" leftIcon={<KeyboardIcon />}>
        MIDI Settings
      </Button>

      {showSettingsInputs && (
        <div className="mb-6">
          <Button onClick={handleGeneratePatterns} disabled={isLoading} className="w-full mb-4" leftIcon={<RefreshIcon />}>
            {isLoading ? (loadingMessage || 'Regenerating MIDI Patterns...') : 'Generate MIDI Patterns'}
          </Button>
        </div>
      )}

      {error && <p className="text-red-400 bg-red-900/30 p-3 rounded-md text-sm my-4">{error}</p>}
      {isLoading && !patterns && <Spinner text={loadingMessage || "AI is composing..."} />}

      {patterns && !isLoading && (
        <div className="mt-6 space-y-4">
          <Button onClick={isPlaying ? handleStopAll : handlePlayAll} variant={isPlaying ? "danger" : "primary"} leftIcon={isPlaying ? <StopIcon /> : <PlayIcon />}>
            {isPlaying ? 'Stop Preview' : 'Play All Tracks'}
          </Button>
          <Button onClick={handleDownloadAll} variant="secondary" leftIcon={<DownloadIcon />}>Download All (.mid)</Button>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderTrackCard('chords', 'Chords')}
            {renderTrackCard('bassline', 'Bassline')}
            {renderTrackCard('melody', 'Melody')}
            {renderTrackCard('drums', 'Drums')}
          </div>
        </div>
      )}

      {!patterns && !isLoading && !error && (
        <p className="text-gray-400 text-sm mt-4 text-center">
          No MIDI patterns generated yet. Click "MIDI Settings" to configure and generate.
        </p>
      )}
    </Card>
  );
};
