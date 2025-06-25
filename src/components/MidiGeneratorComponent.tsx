
import React, { useState, useEffect, useRef } from 'react';
import { MidiSettings, GeneratedMidiPatterns, UserInputs, GuidebookEntry, ChordNoteEvent, MidiNote, KeyOfGeneratedMidiPatterns } from '../constants/types';
import { generateMidiPatternSuggestions } from '../services/geminiService';
import { generateMidiFile, downloadMidi } from '../services/midiService';
import { playMidiPatterns, stopPlayback, initializeAudio } from '../services/audioService';
import { Card } from './Card';
import { Button } from './Button';
import { Spinner } from './Spinner';
import { Input } from './Input';
import { PlayIcon, StopIcon, DownloadIcon, RefreshIcon, CheckboxCheckedIcon, CheckboxUncheckedIcon, KeyboardIcon } from './icons';
import { MIDI_SCALES, MIDI_MODES, MIDI_TIME_SIGNATURES, MIDI_DEFAULT_SETTINGS, MIDI_CHORD_PROGRESSIONS, MIDI_TEMPO_RANGES, GENRE_SUGGESTIONS, MIDI_TARGET_INSTRUMENTS, MIDI_SONG_SECTIONS } from '../constants/constants';

// Drum name mapping for display
const DRUM_NAMES: { [key: string]: string } = {
  'kick': 'Kick',
  'snare': 'Snare', 
  'hihat': 'Hi-Hat',
  'hihat_open': 'Hi-Hat Open',
  'hihat_closed': 'Hi-Hat Closed',
  'crash': 'Crash',
  'ride': 'Ride',
  'tom': 'Tom',
  'tom_high': 'High Tom',
  'tom_mid': 'Mid Tom', 
  'tom_low': 'Low Tom',
  'clap': 'Clap',
  'shaker': 'Shaker',
  'tambourine': 'Tambourine',
  'cowbell': 'Cowbell',
  'rim': 'Rimshot'
};

interface MidiGeneratorProps {
  currentGuidebookEntry?: GuidebookEntry;
  mainAppInputs?: UserInputs; 
  onUpdateGuidebookEntryMidi?: (midiSettings: MidiSettings, generatedMidiPatterns: GeneratedMidiPatterns) => void;
  parsedGuidebookBpm?: number | null; 
  parsedGuidebookKey?: string | null;
  parsedGuidebookChordProg?: string | null;
  // Remix mode props
  initialPatterns?: { [section: string]: { [instrument: string]: string } };
  sections?: string[];
  targetTempo?: number;
  targetKey?: string;
  isRemixMode?: boolean;
}

const extractRichMidiContext = (guidebookContent: string): string => {
    if (!guidebookContent) return "General musical context. Focus on genre and vibe.";
    const summaryEndIndex = guidebookContent.indexOf('## 3. Instrument & Sound Design Guide');
    const endIndex = summaryEndIndex > 0 ? summaryEndIndex : 
                     (guidebookContent.indexOf('## 2. Structural Blueprint') > 0 ? guidebookContent.indexOf('## 2. Structural Blueprint') : 1500);
    return guidebookContent.substring(0, Math.min(endIndex, guidebookContent.length));
};

const getKeyCenterFromScale = (keyScale: string): string => {
    // Extract the key center from strings like "C Major", "A Minor", etc.
    const match = keyScale.match(/^([A-G][#b]?)/);
    return match ? match[1] : 'C';
};

const getAvailableModesForKey = (keyScale: string): string[] => {
    const keyCenter = getKeyCenterFromScale(keyScale);
    return MIDI_MODES[keyCenter] || MIDI_MODES['C'];
};

const getChordProgressionsForGenre = (genre: string): string[] => {
    return MIDI_CHORD_PROGRESSIONS[genre] || MIDI_CHORD_PROGRESSIONS.Default;
};

const BAR_OPTIONS = [1, 2, 4, 8, 16, 32];

export const MidiGeneratorComponent: React.FC<MidiGeneratorProps> = ({ 
    currentGuidebookEntry, 
    mainAppInputs, 
    onUpdateGuidebookEntryMidi,
    parsedGuidebookBpm,
    parsedGuidebookKey,
    parsedGuidebookChordProg,
    // Remix mode props
    initialPatterns,
    sections,
    targetTempo,
    targetKey,
    isRemixMode = false
}) => {
  const [settings, setSettings] = useState<MidiSettings>(() => {
    // Remix mode initialization
    if (isRemixMode) {
      return {
        ...MIDI_DEFAULT_SETTINGS,
        key: targetKey || MIDI_DEFAULT_SETTINGS.key,
        tempo: targetTempo || MIDI_DEFAULT_SETTINGS.tempo,
        genre: 'Electronic', // Default for remix mode
        songSection: sections?.[0] || MIDI_DEFAULT_SETTINGS.songSection,
        guidebookContext: `Remix mode for ${targetKey || 'C minor'} at ${targetTempo || 128} BPM`,
        targetInstruments: ['bassline', 'drums', 'melody', 'chords'],
        bars: 8
      };
    }

    if (currentGuidebookEntry?.midiSettings) {
        return {
            ...currentGuidebookEntry.midiSettings, 
            bars: BAR_OPTIONS.includes(currentGuidebookEntry.midiSettings.bars) ? currentGuidebookEntry.midiSettings.bars : MIDI_DEFAULT_SETTINGS.bars,
            songSection: currentGuidebookEntry.midiSettings.songSection || MIDI_DEFAULT_SETTINGS.songSection,
            targetInstruments: currentGuidebookEntry.midiSettings.targetInstruments && currentGuidebookEntry.midiSettings.targetInstruments.length > 0
                ? currentGuidebookEntry.midiSettings.targetInstruments
                : [...MIDI_DEFAULT_SETTINGS.targetInstruments],
            guidebookContext: currentGuidebookEntry.midiSettings.guidebookContext || extractRichMidiContext(currentGuidebookEntry.content)
        };
    }
    const initialGenre = currentGuidebookEntry?.genre?.[0] || mainAppInputs?.genre?.[0] || MIDI_DEFAULT_SETTINGS.genre;
    const richContextForMidi = extractRichMidiContext(currentGuidebookEntry?.content || '');
    
    const tempoRange = MIDI_TEMPO_RANGES[initialGenre] || MIDI_TEMPO_RANGES.Default;
    const defaultTempoForGenre = Math.round((tempoRange[0] + tempoRange[1]) / 2);
    
    const initialSongSection = MIDI_DEFAULT_SETTINGS.songSection;
    let initialBars = MIDI_DEFAULT_SETTINGS.bars; 
    const sectionLower = initialSongSection.toLowerCase();
    if (sectionLower.includes('intro') || sectionLower.includes('outro') || sectionLower.includes('fill') || sectionLower.includes('breakdown')) {
      initialBars = 4;
    } else {
      initialBars = 8; 
    }
    initialBars = BAR_OPTIONS.includes(initialBars) ? initialBars : MIDI_DEFAULT_SETTINGS.bars;

    return {
      ...MIDI_DEFAULT_SETTINGS, 
      genre: initialGenre,
      key: parsedGuidebookKey || MIDI_DEFAULT_SETTINGS.key,
      tempo: parsedGuidebookBpm || defaultTempoForGenre,
      chordProgression: parsedGuidebookChordProg || (MIDI_CHORD_PROGRESSIONS[initialGenre] || MIDI_CHORD_PROGRESSIONS.Default)[0],
      guidebookContext: richContextForMidi,
      targetInstruments: [...MIDI_DEFAULT_SETTINGS.targetInstruments], 
      songSection: initialSongSection,
      bars: initialBars,
    };
  });

  const [patterns, setPatterns] = useState<GeneratedMidiPatterns | null>(() => {
    if (isRemixMode && initialPatterns) {
      // Convert remix patterns to GeneratedMidiPatterns format
      const convertedPatterns: GeneratedMidiPatterns = {};
      Object.entries(initialPatterns).forEach(([section, instruments]) => {
        Object.entries(instruments).forEach(([instrument, pattern]) => {
          const key = `${section}_${instrument}` as KeyOfGeneratedMidiPatterns;
          // For now, skip conversion as pattern structure needs to be properly defined
          // TODO: Implement proper pattern conversion from remix format
          if (typeof pattern !== 'string') {
            convertedPatterns[key] = pattern as any;
          }
        });
      });
      return convertedPatterns;
    }
    return currentGuidebookEntry?.generatedMidiPatterns || null;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const isPlayingRef = useRef(isPlaying); 

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const [showSettingsInputs, setShowSettingsInputs] = useState(false);
  
  useEffect(() => {
    let initialBarsVal;
    if (currentGuidebookEntry?.midiSettings) {
        initialBarsVal = currentGuidebookEntry.midiSettings.bars || MIDI_DEFAULT_SETTINGS.bars;
        setSettings({
            ...currentGuidebookEntry.midiSettings, 
            bars: BAR_OPTIONS.includes(initialBarsVal) ? initialBarsVal : MIDI_DEFAULT_SETTINGS.bars,
            songSection: currentGuidebookEntry.midiSettings.songSection || MIDI_DEFAULT_SETTINGS.songSection,
            targetInstruments: currentGuidebookEntry.midiSettings.targetInstruments && currentGuidebookEntry.midiSettings.targetInstruments.length > 0
                ? currentGuidebookEntry.midiSettings.targetInstruments
                : [...MIDI_DEFAULT_SETTINGS.targetInstruments],
            guidebookContext: currentGuidebookEntry.midiSettings.guidebookContext || extractRichMidiContext(currentGuidebookEntry.content)
        });
    } else {
        const primaryGenre = currentGuidebookEntry?.genre?.[0] || mainAppInputs?.genre?.[0] || MIDI_DEFAULT_SETTINGS.genre;
        const richContextForMidi = extractRichMidiContext(currentGuidebookEntry?.content || '');
        
        const tempoRange = MIDI_TEMPO_RANGES[primaryGenre] || MIDI_TEMPO_RANGES.Default;
        const defaultTempoForGenre = Math.round((tempoRange[0] + tempoRange[1]) / 2);
        
        const initialSongSection = MIDI_DEFAULT_SETTINGS.songSection;
        let calculatedInitialBars = MIDI_DEFAULT_SETTINGS.bars; 
        const sectionLower = initialSongSection.toLowerCase();
        if (sectionLower.includes('intro') || sectionLower.includes('outro') || sectionLower.includes('fill') || sectionLower.includes('breakdown')) {
          calculatedInitialBars = 4;
        } else {
          calculatedInitialBars = 8;
        }
        initialBarsVal = BAR_OPTIONS.includes(calculatedInitialBars) ? calculatedInitialBars : MIDI_DEFAULT_SETTINGS.bars;

        setSettings({
            ...MIDI_DEFAULT_SETTINGS, 
            key: parsedGuidebookKey || MIDI_DEFAULT_SETTINGS.key,
            tempo: parsedGuidebookBpm || defaultTempoForGenre,
            chordProgression: parsedGuidebookChordProg || (MIDI_CHORD_PROGRESSIONS[primaryGenre] || MIDI_CHORD_PROGRESSIONS.Default)[0],
            genre: primaryGenre, 
            guidebookContext: richContextForMidi,
            targetInstruments: [...MIDI_DEFAULT_SETTINGS.targetInstruments],
            songSection: initialSongSection,
            bars: initialBarsVal,
        });
    }
    setPatterns(currentGuidebookEntry?.generatedMidiPatterns || null);
    setError(null);
    if (isPlayingRef.current) {
        stopPlayback();
        setIsPlaying(false);
    }
  }, [
    currentGuidebookEntry, 
    mainAppInputs?.genre, 
    parsedGuidebookBpm, 
    parsedGuidebookKey, 
    parsedGuidebookChordProg
  ]);

  const handleSettingChange = (field: keyof MidiSettings, value: any) => {
    setSettings(prev => {
      const newSettings = { ...prev, [field]: value };
      if (field === 'genre') {
        const newGenre = value as string;
        const oldGenreDefaultProg = (MIDI_CHORD_PROGRESSIONS[prev.genre] || MIDI_CHORD_PROGRESSIONS.Default)[0];
        if (prev.chordProgression === oldGenreDefaultProg) {
            newSettings.chordProgression = (MIDI_CHORD_PROGRESSIONS[newGenre] || MIDI_CHORD_PROGRESSIONS.Default)[0];
        }
        const oldTempoRange = MIDI_TEMPO_RANGES[prev.genre] || MIDI_TEMPO_RANGES.Default;
        const oldDefaultTempo = Math.round((oldTempoRange[0] + oldTempoRange[1]) / 2);
        if (prev.tempo === oldDefaultTempo) {
            const newTempoRange = MIDI_TEMPO_RANGES[newGenre] || MIDI_TEMPO_RANGES.Default;
            newSettings.tempo = Math.round((newTempoRange[0] + newTempoRange[1]) / 2);
        }
      }
      if (currentGuidebookEntry?.content) {
          newSettings.guidebookContext = extractRichMidiContext(currentGuidebookEntry.content);
      }
      return newSettings;
    });
  };
  
  const handleTargetInstrumentChange = (instrumentId: string) => {
    setSettings(prev => {
        const currentSelection = prev.targetInstruments;
        const newSelection = currentSelection.includes(instrumentId)
            ? currentSelection.filter(id => id !== instrumentId)
            : [...currentSelection, instrumentId];
        return { ...prev, targetInstruments: newSelection };
    });
  };

  const handleGeneratePatterns = async () => {
    setIsLoading(true);
    setLoadingMessage('Regenerating MIDI patterns...');
    setError(null);
    if (isPlayingRef.current) {
        stopPlayback();
        setIsPlaying(false);
    }
    await initializeAudio();

    let settingsForGeneration;

    if (isRemixMode) {
        settingsForGeneration = {
            ...settings,
            guidebookContext: `${settings.genre} remix at ${settings.tempo} BPM in ${settings.key}`,
            genre: settings.genre
        };
    } else {
        const primaryGenre = currentGuidebookEntry?.genre?.[0] || settings.genre;
        const richContextForRegeneration = extractRichMidiContext(currentGuidebookEntry?.content || '');

        settingsForGeneration = {
            ...settings,
            guidebookContext: richContextForRegeneration,
            genre: primaryGenre
        };
    }

    try {
        const midiStream = await generateMidiPatternSuggestions(settingsForGeneration);
        let jsonStr = '';
        
        // Handle streaming response
        for await (const chunk of midiStream) {
          if (chunk.text) {
            jsonStr += chunk.text;
          }
        }

        console.log('Raw MIDI response:', jsonStr);

        // Clean up the JSON response
        jsonStr = jsonStr.trim();
        
        // Remove code blocks if present
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[2]) {
            console.log('Found code block, extracting JSON:', match[2]);
            jsonStr = match[2].trim();
        }

        // Try to parse JSON
        let patternsData;
        try {
            patternsData = JSON.parse(jsonStr) as GeneratedMidiPatterns;
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            console.error('Failed to parse:', jsonStr);
            throw new Error(`Invalid JSON response from AI: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}. Response was: ${jsonStr.substring(0, 200)}...`);
        }

        console.log('Parsed MIDI patterns:', patternsData);

        // Validate patterns before setting them
        const validatePatterns = (patterns: GeneratedMidiPatterns) => {
          console.log('🔍 Validating MIDI patterns...');
          
          // Validate chords
          if (patterns.chords) {
            patterns.chords.forEach((chord, i) => {
              if (!Number.isFinite(chord.time) || !Number.isFinite(chord.duration)) {
                console.error(`🚨 Invalid chord ${i}:`, chord);
              }
              chord.notes.forEach((note, j) => {
                if (!Number.isFinite(note.midi)) {
                  console.error(`🚨 Invalid chord ${i} note ${j}:`, note);
                }
              });
            });
          }
          
          // Validate bassline and melody
          ['bassline', 'melody'].forEach(trackType => {
            const track = patterns[trackType as keyof GeneratedMidiPatterns] as MidiNote[];
            if (track) {
              track.forEach((note, i) => {
                if (!Number.isFinite(note.time) || !Number.isFinite(note.duration) || !Number.isFinite(note.midi)) {
                  console.error(`🚨 Invalid ${trackType} note ${i}:`, note);
                }
              });
            }
          });
          
          // Validate drums
          if (patterns.drums) {
            Object.entries(patterns.drums).forEach(([drumName, hits]) => {
              hits.forEach((hit, i) => {
                if (!Number.isFinite(hit.time) || !Number.isFinite(hit.duration) || !Number.isFinite(hit.velocity || 100)) {
                  console.error(`🚨 Invalid ${drumName} hit ${i}:`, hit);
                }
              });
            });
          }
        };
        
        validatePatterns(patternsData);

        if (patternsData.drums) {
            const lowercasedDrums: any = {};
            for (const key in patternsData.drums) {
                lowercasedDrums[key.toLowerCase().replace(/\s+/g, '_')] = patternsData.drums[key as keyof typeof patternsData.drums];
            }
            patternsData.drums = lowercasedDrums;
        }

        setPatterns(patternsData);
        onUpdateGuidebookEntryMidi?.(settingsForGeneration, patternsData);
    } catch (err: any) {
        console.error("MIDI Generation Error:", err);
        const specificMessage = err.message.toLowerCase().includes("json")
            ? `AI returned invalid JSON for MIDI patterns. (${err.message})`
            : `Failed to generate MIDI patterns: ${err.message}`;
        setError(specificMessage);
        setPatterns(null);
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
        await new Promise(resolve => setTimeout(resolve, 100)); 
    }
    playMidiPatterns(patterns, settings);
    setIsPlaying(true);
  };

  const handlePlaySingleTrack = async (trackToPlay: KeyOfGeneratedMidiPatterns) => {
    if (!patterns || !patterns[trackToPlay]) return;
    await initializeAudio();
    if (isPlayingRef.current) {
      stopPlayback();
      setIsPlaying(false);
      await new Promise(resolve => setTimeout(resolve, 50)); 
    }
    playMidiPatterns(patterns, settings, trackToPlay);
    setIsPlaying(true);
  };

  const handleStopAll = () => {
    stopPlayback();
    setIsPlaying(false);
  };

  useEffect(() => {
    return () => {
      if (isPlayingRef.current) { 
        stopPlayback();
      }
    };
  }, []); 

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

  const handleDownloadSingleTrack = (trackType: KeyOfGeneratedMidiPatterns) => {
    if (!patterns || !patterns[trackType]) {
        alert(`No ${trackType} data available in current patterns.`);
        return;
    }
    
    const singleTrackPattern: Partial<GeneratedMidiPatterns> = { [trackType]: patterns[trackType] }; 
    const filenameBase = (currentGuidebookEntry?.title || 'TrackGuideMIDI').replace(/[^a-z0-9_.-]/gi, '_');
    const midiData = generateMidiFile(singleTrackPattern as GeneratedMidiPatterns, settings, `${filenameBase}_${trackType}`);
    
    if (midiData) {
      downloadMidi(midiData, `${filenameBase}_${trackType}.mid`);
    } else {
      alert(`No ${trackType} data to download or error in generation.`);
    }
  };
  
  const handleRegenerateSingleTrack = async (trackType: KeyOfGeneratedMidiPatterns) => {
    if (!patterns) return;

    setIsLoading(true);
    setLoadingMessage(`Regenerating ${trackType}...`);
    setError(null);
    if (isPlayingRef.current) {
        stopPlayback();
        setIsPlaying(false);
    }
    await initializeAudio();

    let preservedSettings;

    if (isRemixMode) {
        preservedSettings = {
            ...settings,
            guidebookContext: `${settings.genre} remix at ${settings.tempo} BPM in ${settings.key}`,
            genre: settings.genre,
            targetInstruments: [trackType]
        };
    } else {
        const primaryGenre = currentGuidebookEntry?.genre?.[0] || settings.genre;
        const richContextForRegeneration = extractRichMidiContext(currentGuidebookEntry?.content || '');

        preservedSettings = {
            ...settings,
            guidebookContext: richContextForRegeneration,
            genre: primaryGenre,
            targetInstruments: [trackType]
        };
    }

    try {
        const midiStream = await generateMidiPatternSuggestions(preservedSettings);
        let jsonStr = '';
        
        // Handle streaming response
        for await (const chunk of midiStream) {
          if (chunk.text) {
            jsonStr += chunk.text;
          }
        }

        console.log(`Raw MIDI response for ${trackType}:`, jsonStr);

        // Clean up the JSON response
        jsonStr = jsonStr.trim();
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[2]) {
            console.log(`Found code block for ${trackType}, extracting JSON:`, match[2]);
            jsonStr = match[2].trim();
        }

        let newPatternsData;
        try {
            newPatternsData = JSON.parse(jsonStr) as GeneratedMidiPatterns;
        } catch (parseError) {
            console.error(`JSON parse error for ${trackType}:`, parseError);
            console.error('Failed to parse:', jsonStr);
            throw new Error(`Invalid JSON response from AI for ${trackType}: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`);
        }

        console.log(`Parsed MIDI patterns for ${trackType}:`, newPatternsData);

        const updatedPatterns = {
            ...patterns,
            [trackType]: newPatternsData[trackType]
        };

        if (trackType === 'drums' && newPatternsData.drums) {
            const lowercasedDrums: any = {};
            for (const key in newPatternsData.drums) {
                lowercasedDrums[key.toLowerCase().replace(/\s+/g, '_')] = newPatternsData.drums[key as keyof typeof newPatternsData.drums];
            }
            updatedPatterns.drums = lowercasedDrums;
        }

        setPatterns(updatedPatterns);
        onUpdateGuidebookEntryMidi?.(settings, updatedPatterns);
    } catch (err) {
        console.error('Error regenerating single track:', err);
        setError(`Failed to regenerate ${trackType}. Please try again.`);
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
    }
  };

  const toggleSettingsInputs = async () => {
    if (!showSettingsInputs) {
        await initializeAudio();
    }
    setShowSettingsInputs(prev => !prev);
  };

  const renderTrackCard = (trackId: KeyOfGeneratedMidiPatterns, label: string) => {
    if (!patterns || !patterns[trackId]) return null;
    
    const trackData = patterns[trackId];
    let trackInfo = '';
    
    if (trackId === 'drums' && trackData) {
      const drumElements = Object.keys(trackData as any);
      trackInfo = `${drumElements.length} elements: ${drumElements.map(d => DRUM_NAMES[d] || d).join(', ')}`;
    } else if (trackId === 'chords' && Array.isArray(trackData)) {
      trackInfo = `${trackData.length} chord events`;
    } else if ((trackId === 'bassline' || trackId === 'melody') && Array.isArray(trackData)) {
      trackInfo = `${trackData.length} notes`;
    }

    return (
      <Card key={trackId} title={label} className="p-4 border border-gray-600 rounded-md bg-gray-800/50">
        <div className="mb-3">
          <p className="text-xs text-gray-400">{trackInfo}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={() => handlePlaySingleTrack(trackId)} 
            leftIcon={<PlayIcon />} 
            size="sm"
            variant="primary"
          >
            Play
          </Button>
          <Button 
            onClick={() => handleRegenerateSingleTrack(trackId)} 
            leftIcon={<RefreshIcon className="w-4 h-4" isSpinning={isLoading && loadingMessage.includes(trackId)} />} 
            size="sm"
            variant="secondary"
            disabled={isLoading}
          >
            Regenerate
          </Button>
          <Button 
            onClick={() => handleDownloadSingleTrack(trackId)} 
            leftIcon={<DownloadIcon />} 
            size="sm"
            variant="secondary"
          >
            Download
          </Button>
        </div>
      </Card>
    );
  };

  return (
    <Card title="🎹 MIDI Tools & Pattern Generator" className="mt-6 bg-gray-800/80 backdrop-blur-md shadow-xl border border-gray-700/50">
       <Button 
          onClick={toggleSettingsInputs} 
          variant="secondary" 
          className="w-full mb-4"
          leftIcon={<KeyboardIcon />}
        >
          {showSettingsInputs ? 'Hide MIDI Settings' : 'Adjust MIDI Settings & Regenerate'}
        </Button>

      {showSettingsInputs && (
        <div className="mb-6 border-t border-gray-700 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4 mb-6">
            <div>
              <label htmlFor="midi-key" className="block text-sm font-medium text-gray-300 mb-1">
                Key
              </label>
              <select 
                id="midi-key" 
                value={settings.key} 
                onChange={(e) => handleSettingChange('key', e.target.value)} 
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-gray-100 focus:ring-purple-500 focus:border-purple-500 text-sm"
              >
                {MIDI_SCALES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="midi-scale" className="block text-sm font-medium text-gray-300 mb-1">
                Scale/Mode <span className="text-xs text-gray-400">(Optional)</span>
              </label>
              <select 
                id="midi-scale" 
                value={settings.scale || ''} 
                onChange={(e) => handleSettingChange('scale', e.target.value)} 
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-gray-100 focus:ring-purple-500 focus:border-purple-500 text-sm"
              >
                <option value="">Default (from key)</option>
                {getAvailableModesForKey(settings.key).map(mode => <option key={mode} value={mode}>{mode}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="midi-tempo" className="block text-sm font-medium text-gray-300 mb-1">
                Tempo (BPM)
              </label>
              <Input 
                type="number" 
                id="midi-tempo" 
                value={settings.tempo} 
                onChange={(e) => handleSettingChange('tempo', parseInt(e.target.value,10))} 
                min="30" max="300" 
              />
            </div>
            <div>
              <label htmlFor="midi-timesig" className="block text-sm font-medium text-gray-300 mb-1">Time Signature</label>
              <select 
                id="midi-timesig" 
                value={settings.timeSignature.join('/')} 
                onChange={(e) => handleSettingChange('timeSignature', e.target.value.split('/').map(Number) as [number,number])} 
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-gray-100 focus:ring-purple-500 focus:border-purple-500 text-sm"
              >
                {MIDI_TIME_SIGNATURES.map(ts => <option key={ts.join('/')} value={ts.join('/')}>{ts.join('/')}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="midi-chords" className="block text-sm font-medium text-gray-300 mb-1">
                Chord Progression
              </label>
              <select 
                id="midi-chords" 
                value={settings.chordProgression} 
                onChange={(e) => handleSettingChange('chordProgression', e.target.value)} 
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-gray-100 focus:ring-purple-500 focus:border-purple-500 text-sm"
              >
                {getChordProgressionsForGenre(settings.genre).map(cp => <option key={cp} value={cp}>{cp}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="midi-genre" className="block text-sm font-medium text-gray-300 mb-1">MIDI Genre Context</label>
              <select 
                id="midi-genre" 
                value={settings.genre} 
                onChange={(e) => handleSettingChange('genre', e.target.value)} 
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-gray-100 focus:ring-purple-500 focus:border-purple-500 text-sm"
              >
                <option value={currentGuidebookEntry?.genre?.[0] || mainAppInputs?.genre?.[0] || MIDI_DEFAULT_SETTINGS.genre}>
                    Align with Guidebook ({currentGuidebookEntry?.genre?.[0] || mainAppInputs?.genre?.[0] || "Default"})
                </option>
                {GENRE_SUGGESTIONS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="midi-bars" className="block text-sm font-medium text-gray-300 mb-1">Loop Length (Bars)</label>
              <select 
                id="midi-bars" 
                value={settings.bars} 
                onChange={(e) => handleSettingChange('bars', parseInt(e.target.value,10))} 
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-gray-100 focus:ring-purple-500 focus:border-purple-500 text-sm"
              >
                {BAR_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
             <div className="lg:col-span-1"> 
              <label htmlFor="midi-songsection" className="block text-sm font-medium text-gray-300 mb-1">Song Section Context</label>
              <select 
                id="midi-songsection" 
                value={settings.songSection || MIDI_DEFAULT_SETTINGS.songSection} 
                onChange={(e) => handleSettingChange('songSection', e.target.value)} 
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-gray-100 focus:ring-purple-500 focus:border-purple-500 text-sm"
              >
                {(isRemixMode && sections ? sections : MIDI_SONG_SECTIONS).map(section => <option key={section} value={section}>{section}</option>)}
              </select>
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">Target Instruments to Generate</label>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
                {MIDI_TARGET_INSTRUMENTS.map(inst => (
                    <button
                        key={inst.id}
                        type="button"
                        onClick={() => handleTargetInstrumentChange(inst.id)}
                        className={`flex items-center px-3 py-1.5 rounded-md text-sm transition-colors duration-150 ease-in-out border
                            ${settings.targetInstruments.includes(inst.id)
                                ? 'bg-purple-600 text-white border-purple-500 hover:bg-purple-700 shadow-md'
                                : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600 hover:border-gray-500'}`}
                        aria-pressed={settings.targetInstruments.includes(inst.id)}
                    >
                        {settings.targetInstruments.includes(inst.id) 
                            ? <CheckboxCheckedIcon className="w-4 h-4 mr-2" /> 
                            : <CheckboxUncheckedIcon className="w-4 h-4 mr-2 text-gray-500" />
                        }
                        {inst.label}
                    </button>
                ))}
            </div>
          </div>
          <Button onClick={handleGeneratePatterns} disabled={isLoading || settings.targetInstruments.length === 0} className="w-full" leftIcon={<RefreshIcon className="w-5 h-5" isSpinning={isLoading}/>}>
            {isLoading ? (loadingMessage || 'Regenerating MIDI Patterns...') : (settings.targetInstruments.length === 0 ? 'Select instruments first' : 'Regenerate MIDI Patterns')}
          </Button>
        </div>
      )}

      {error && <p className="text-red-400 bg-red-900/30 p-3 rounded-md text-sm my-4">{error}</p>}
      {isLoading && !showSettingsInputs && (!patterns || loadingMessage.includes("MIDI")) && <div className="my-4"><Spinner text={loadingMessage || "AI is composing..."} /></div>}
      
      {patterns && !isLoading && (
        <div className="mt-6 space-y-3">
          <div className="flex flex-wrap gap-3 items-center pb-3 border-b border-gray-700">
            <Button onClick={isPlaying ? handleStopAll : handlePlayAll} variant={isPlaying ? "danger" : "primary"} size="md" leftIcon={isPlaying ? <StopIcon /> : <PlayIcon />}>
              {isPlaying ? 'Stop Preview' : 'Play All Tracks'}
            </Button>
            <Button onClick={handleDownloadAll} variant="secondary" size="md" leftIcon={<DownloadIcon />}>Download All (.mid)</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
            {renderTrackCard('chords', 'Chords')}
            {renderTrackCard('bassline', 'Bassline')}
            {renderTrackCard('melody', 'Melody')}
            {renderTrackCard('drums', 'Drums')}
          </div>
          {patterns.error && <p className="text-sm text-yellow-400 mt-2">AI Note: {patterns.error}</p>}
        </div>
      )}
       {!patterns && !isLoading && !error && (
     <p className="text-gray-400 text-sm mt-4 text-center">
  No MIDI patterns generated yet for this {isRemixMode ? 'RemixGuide' : 'TrackGuide'}. 
  Click "Adjust MIDI Settings" to configure and generate.
</p>
      )}
    </Card>
  );
};
