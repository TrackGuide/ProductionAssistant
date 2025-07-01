import React, { useState, useRef } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Spinner } from './Spinner';
import { MarkdownRenderer } from './MarkdownRenderer';
import { MidiGeneratorComponent } from './MidiGeneratorComponent';
import { getGenreInfo, getGenresByCategory, getCombinedGenreData } from '../constants/genreMetadata';
import { dawMetadata } from '../constants/dawMetadata';
import { generateAIResponse } from '../services/geminiService';
import { parseAiMidiResponse } from '../utils/jsonParsingUtils';
import { uploadAudio, initializeAudio } from '../services/audioService';
import { MidiSettings, GeneratedMidiPatterns } from '../constants/types';

interface RemixGuideData {
  guide: string;
  targetTempo: number;
  targetKey: string;
  sections: string[];
  generatedMidiPatterns?: GeneratedMidiPatterns;
  originalKey?: string;
  originalTempo?: number;
  originalChordProgression?: string;
}

const extractOriginalChordProgression = (guideContent: string): string | null => {
  if (!guideContent) return null;

  const dnaSectionRegex = /##\s*🎵\s*Original Track DNA Analysis/i;
  const match = guideContent.match(dnaSectionRegex);
  if (!match || typeof match.index === 'undefined') return null;

  const startIndex = match.index;
  const nextSectionMatch = guideContent.substring(startIndex + match[0].length).match(/^##\s+/m);
  const endIndex = nextSectionMatch && typeof nextSectionMatch.index !== 'undefined'
    ? startIndex + match[0].length + nextSectionMatch.index
    : guideContent.length;

  const dnaContent = guideContent.substring(startIndex, endIndex).trim();

  const harmonicMatch = dnaContent.match(/\*\*Harmonic Blueprint\*\*:\s*([^\n]+)/i);
  if (harmonicMatch && harmonicMatch[1]) {
    const harmonicText = harmonicMatch[1];
    const chordProgMatch = harmonicText.match(/([IVXLCDMivxlcdm\d\s,-]+(?:\s*-\s*[IVXLCDMivxlcdm\d\s,-]+)*)/);
    if (chordProgMatch && chordProgMatch[1]) {
      return chordProgMatch[1].trim();
    }
  }

  return null;
};

export const RemixGuideAI: React.FC<{ onContentUpdate?: (content: string) => void, onSaveToLibrary?: (data: any) => void }> = ({ onContentUpdate, onSaveToLibrary }) => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [selectedDAW, setSelectedDAW] = useState<string>('');
  const [plugins, setPlugins] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isGeneratingMidi, setIsGeneratingMidi] = useState<boolean>(false);
  const [remixGuide, setRemixGuide] = useState<RemixGuideData | null>(null);
  const [streamingContent, setStreamingContent] = useState<string>('');
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const genresByCategory = getGenresByCategory();
  const categories = Object.keys(genresByCategory);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const validTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3'];
    const isValidType = validTypes.includes(file.type)
      || file.name.toLowerCase().endsWith('.wav')
      || file.name.toLowerCase().endsWith('.mp3');
    if (!isValidType) {
      setError('Please upload a WAV or MP3 file');
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setError('File size must be under 100MB');
      return;
    }
    setAudioFile(file);
    setError('');
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileUpload({ target: { files: [file] } } as any);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const generateRemix = async () => {
    if (!audioFile || !selectedGenre) {
      setError('Please upload an audio file and select a target genre');
      return;
    }

    setIsGenerating(true);
    setError('');
    setStreamingContent('');
    setRemixGuide(null);

    try {
      // Use combined genre data that includes both basic info and enhanced metadata
      const combinedGenreData = getCombinedGenreData(selectedGenre);

      // --- Optimized, concise prompt ---
      let genreInfo: any = {};
      if (combinedGenreData) {
        // Only include essential fields and check for key in metadata
        genreInfo = {
          tempoRange: combinedGenreData.tempoRange,
          // If key exists in metadata, include it
          ...(combinedGenreData.metadata && typeof combinedGenreData.metadata === 'object' && 'key' in combinedGenreData.metadata && combinedGenreData.metadata.key
            ? { key: combinedGenreData.metadata.key }
            : {})
        };
      }

      let contextLines = [
        `Task: Generate a detailed remix guide.`,
        `Genre: ${selectedGenre}`
      ];
      if (selectedDAW) contextLines.push(`DAW: ${selectedDAW}`);
      if (plugins) contextLines.push(`Plugins: ${plugins}`);
      contextLines.push(`GenreInfo: ${JSON.stringify(genreInfo)}`);
      contextLines.push(`Instructions: Focus on genre-appropriate arrangement, sound design, and MIDI suggestions. Do not include audio data.`);
      const remixPrompt = contextLines.join('\n');

      // Step 1: Generate the remix guide
      const remixGuide = await generateAIResponse(remixPrompt);
      const fullGuideContent = remixGuide;
      let extractedMetadata: any = null; // (future: parse metadata if needed)

      // Step 2: Generate MIDI patterns with dynamic defaults from remix guide
      console.log('Remix guide generated, now generating MIDI patterns...');
      setIsGeneratingMidi(true);

      const originalChordProgression = extractOriginalChordProgression(fullGuideContent);

      // Use extracted metadata or fallback values
      const targetTempo = extractedMetadata?.targetTempo || 128;
      const targetKey = extractedMetadata?.targetKey || 'C minor';
      const detectedChordProg = extractedMetadata?.originalChordProgression || originalChordProgression;
      const sections = extractedMetadata?.sections || ['Intro', 'Build-Up', 'Drop', 'Breakdown', 'Outro'];

      // Set the guide content first so it shows while MIDI is generating
      const initialResult: RemixGuideData = {
        guide: fullGuideContent,
        targetTempo,
        targetKey,
        sections,
        originalKey: extractedMetadata?.originalKey,
        originalTempo: extractedMetadata?.originalTempo,
        originalChordProgression: detectedChordProg
      };

      setRemixGuide(initialResult);
      setStreamingContent(''); // Clear streaming content since we now have the final guide

      const midiSettings: MidiSettings = {
        tempo: targetTempo,
        timeSignature: [4, 4],
        bars: 8,
      };

      console.log('MIDI settings with remix defaults:', midiSettings);

      // Ensure audio context is properly initialized before generating patterns
      await initializeAudio();

      // Example: Use generateAIResponse to get MIDI pattern suggestions as JSON
      // Build a string prompt for MIDI pattern suggestions
      const midiPrompt = `You are an expert AI MIDI generator. Given these settings, generate a JSON object of MIDI patterns for a song section.\nSettings: ${JSON.stringify(midiSettings)}\nRespond ONLY with valid JSON.`;
      const aiResponse = await generateAIResponse(midiPrompt);
      let jsonStr = '';
      // ...existing code for parsing aiResponse and normalizing drums...

    } catch (error) {
      console.error('Error generating remix guide:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate remix guide');
    } finally {
      setIsGenerating(false);
      setIsGeneratingMidi(false);
    }
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSelectedGenre('');
  };

  const regenerateMidi = async () => {
    if (!remixGuide) return;

    setIsGeneratingMidi(true);
    setError('');

    try {
      // Extract chord progression from the generated guide
      const originalChordProgression = extractOriginalChordProgression(remixGuide.guide);
      
      const midiSettings: MidiSettings = {
        // key: remixGuide.targetKey, // Removed invalid property
        tempo: remixGuide.targetTempo, // Use the target tempo from remix guide
        timeSignature: [4, 4],
        // chordProgression: originalChordProgression || remixGuide.originalChordProgression || 'i-VI-III-VII', // Not in MidiSettings type, handled in prompt/AI
        // genre: selectedGenre, // Removed invalid property
        bars: 8,
        // targetInstruments: ['bassline', 'drums', 'melody', 'chords'], // Not in MidiSettings type, handled in prompt/AI
        // guidebookContext: `${selectedGenre} remix at ${remixGuide.targetTempo} BPM in ${remixGuide.targetKey}`, // Not in MidiSettings type, handled in prompt/AI
        // songSection: remixGuide.sections[0] || 'Intro', // Not in MidiSettings type, handled in prompt/AI
      };

      console.log('Regenerating MIDI with settings:', midiSettings);

      // Ensure audio context is properly initialized before generating patterns
      await initializeAudio();
      
      // Example: Use generateAIResponse to get MIDI pattern suggestions as JSON
      // Build a string prompt for MIDI pattern suggestions (single track)
      const midiPrompt = `You are an expert AI MIDI generator. Given these settings, generate a JSON object of MIDI patterns for a single track.\nSettings: ${JSON.stringify(midiSettings)}\nRespond ONLY with valid JSON.`;
      const aiResponse = await generateAIResponse(midiPrompt);
      // Parse aiResponse to get patternsData (of type GeneratedMidiPatterns)
      let jsonStr = '';
      
      // Handle streaming response


      // Enhanced JSON extraction and cleaning
      jsonStr = jsonStr.trim();
      
      // Handle various markdown code block formats
      const codeBlockPatterns = [
        /^```json\s*\n(.*?)\n\s*```$/s,          // ```json\n...\n```
        /^```\s*json\s*\n(.*?)\n\s*```$/s,       // ``` json\n...\n```
        /^```\s*\n(.*?)\n\s*```$/s,              // ```\n...\n```
        /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s       // General case
      ];
      
      for (const pattern of codeBlockPatterns) {
        const match = jsonStr.match(pattern);
        if (match) {
          jsonStr = match[match.length - 1].trim(); // Get the last capture group
          break;
        }
      }
      
      // Remove any remaining backticks or markdown artifacts
      jsonStr = jsonStr
        .replace(/^`+/g, '')      // Remove leading backticks
        .replace(/`+$/g, '')      // Remove trailing backticks
        .replace(/^json\s*/i, '') // Remove 'json' language identifier
        .trim();
      
      // Validate we have valid JSON structure
      if (!jsonStr.startsWith('{') || !jsonStr.endsWith('}')) {
        throw new Error(`Response doesn't contain valid JSON structure for regeneration. Got: ${jsonStr.substring(0, 100)}...`);
      }

      console.log('Raw regenerated MIDI JSON:', jsonStr);

      const generatedMidiPatterns = parseAiMidiResponse<GeneratedMidiPatterns>(jsonStr, 'remix MIDI regeneration');
      
      // Normalize drum patterns and ensure standard elements exist
      if (generatedMidiPatterns.drums) {
        // Convert all drum keys to lowercase
        const lowercasedDrums: Record<string, any> = {};
        for (const key in generatedMidiPatterns.drums) {
          lowercasedDrums[key.toLowerCase().replace(/\s+/g, '_')] = generatedMidiPatterns.drums[key as keyof typeof generatedMidiPatterns.drums];
        }
        
        // Add standard drum elements if they don't exist
        if (!lowercasedDrums['kick']) lowercasedDrums['kick'] = [];
        if (!lowercasedDrums['snare']) lowercasedDrums['snare'] = [];
        if (!lowercasedDrums['hihat_closed']) lowercasedDrums['hihat_closed'] = [];
        if (!lowercasedDrums['hihat_open']) lowercasedDrums['hihat_open'] = [];
        if (!lowercasedDrums['crash']) lowercasedDrums['crash'] = [];
        
        // Update the drums in the generated patterns
        generatedMidiPatterns.drums = lowercasedDrums;
      }

      console.log('Regenerated MIDI patterns:', generatedMidiPatterns);

      // Update the remix guide with new MIDI patterns
      setRemixGuide(prev => prev ? {
        ...prev,
        generatedMidiPatterns
      } : null);

    } catch (midiError) {
      console.error('Error regenerating MIDI patterns:', midiError);
      setError(`Failed to regenerate MIDI patterns: ${midiError instanceof Error ? midiError.message : 'Unknown error'}`);
    } finally {
      setIsGeneratingMidi(false);
    }
  };

  const resetForm = () => {
    setAudioFile(null);
    setSelectedCategory('');
    setSelectedGenre('');
    setSelectedDAW('');
    setPlugins('');
    setRemixGuide(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-white">Upload Original Track</h3>
          <div
            className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-gray-500 transition-colors"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".wav,.mp3,audio/wav,audio/mpeg"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="space-y-2">
              <div className="text-4xl">🎵</div>
              <div className="text-white font-medium">
                {audioFile ? audioFile.name : 'Upload Original Track'}
              </div>
              <p className="text-gray-400 text-sm">or drag and drop</p>
            </div>
            <p className="text-gray-500 text-xs mt-2">
              MP3, WAV up to <span className="text-orange-400">100</span>MB
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-white">Target Remix Genre</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                1. Select Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Choose a category...</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {selectedCategory && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  2. Select Genre
                </label>
                <select
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Choose a genre...</option>
                  {genresByCategory[selectedCategory].map((genre: string) => (
                    <option key={genre} value={genre}>
                      {genre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedGenre && (
              <div className="text-sm text-gray-400 bg-gray-800 p-3 rounded-lg">
                {(() => {
                  const info = getGenreInfo(selectedGenre);
                  return info ? `🎵 Tempo: ${info.tempoRange[0]}-${info.tempoRange[1]} BPM` : '';
                })()}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* DAW and Plugins Configuration */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-white">Production Setup (Optional)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              DAW (Digital Audio Workstation)
            </label>
            <select
              value={selectedDAW}
              onChange={(e) => setSelectedDAW(e.target.value)}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Select your DAW...</option>
              {dawMetadata.map(daw => (
                <option key={daw.dawName} value={daw.dawName}>
                  {daw.dawName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Available Plugins
            </label>
            <input
              type="text"
              value={plugins}
              onChange={(e) => setPlugins(e.target.value)}
              placeholder="e.g., Serum, FabFilter Pro-Q 3, Valhalla VintageVerb..."
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Specify your DAW and plugins to get tailored parameter recommendations in the remix guide
        </p>
      </Card>

      {error && (
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 text-red-200">
          {error}
        </div>
      )}

      <div className="flex gap-4">
        <Button
          onClick={generateRemix}
          disabled={!audioFile || !selectedGenre || isGenerating}
          className="flex-1"
        >
          {isGenerating ? (
            <>
              <Spinner size="sm" /> Generating RemixGuide...
            </>
          ) : (
            '🎛️ Generate RemixGuide'
          )}
        </Button>
        <Button onClick={resetForm} variant="outline">
          Reset
        </Button>
      </div>

      {/* Show streaming content during generation OR show the final guide */}
      {(isGenerating && streamingContent) && (
        <Card className="p-6">
          <h3 className="text-xl font-bold text-white mb-4">
            🎛️ Generating {selectedGenre} Remix Guide...
          </h3>
          <div className="bg-gray-800/50 rounded-lg p-6 max-h-[calc(100vh-8rem)] overflow-y-auto">
            <MarkdownRenderer content={streamingContent} />
          </div>
        </Card>
      )}

      {/* Show MIDI Generation Card when generating MIDI but guide is complete */}
      {isGeneratingMidi && remixGuide && !isGenerating && (
        <Card className="p-6">
          <div className="text-center py-8">
            <Spinner size="lg" />
            <h3 className="text-xl font-bold text-white mt-4">
              🎹 Generating MIDI Patterns...
            </h3>
            <p className="text-gray-400 mt-2">
              Creating {selectedGenre}-specific patterns based on your remix guide
            </p>
          </div>
        </Card>
      )}

      {remixGuide && !isGenerating && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">
                🎛️ {selectedGenre} Remix Guide
              </h3>
              <div className="text-sm text-gray-400">
                Target: {remixGuide.targetTempo} BPM • {remixGuide.targetKey}
              </div>
            </div>
            <div className="flex justify-end mb-2">
              {onSaveToLibrary && (
                <button
                  className="px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 text-sm font-medium"
                  onClick={() => onSaveToLibrary({
                    ...remixGuide,
                    genre: [selectedGenre],
                    daw: selectedDAW,
                    plugins,
                  })}
                >
                  Save to Library
                </button>
              )}
            </div>
            <div className="bg-gray-800/50 rounded-lg p-6 max-h-[calc(100vh-8rem)] overflow-y-auto">
              <MarkdownRenderer content={remixGuide.guide} />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">
                🎹 MIDI Remix Patterns
              </h3>
              <Button
                onClick={regenerateMidi}
                disabled={isGeneratingMidi}
                variant="outline"
                className="text-sm"
              >
                {isGeneratingMidi ? (
                  <>
                    <Spinner size="sm" /> Regenerating...
                  </>
                ) : (
                  '🔄 Regenerate MIDI'
                )}
              </Button>
            </div>
            {/* Always show the MIDI generator after the remix guide, just like TrackGuide */}
            <MidiGeneratorComponent
              key={`remix-${selectedGenre}-${Date.now()}`}
              sections={remixGuide.sections}
              targetTempo={remixGuide.targetTempo}
              targetKey={remixGuide.targetKey}
              isRemixMode={true}
              currentGuidebookEntry={{
                id: `remix-${Date.now()}`,
                title: `${selectedGenre} Remix`,
                genre: [selectedGenre],
                artistReference: '',
                referenceTrackLink: '',
                lyrics: '',
                key: remixGuide.targetKey,
                chords: '',
                generalNotes: '',
                vibe: [],
                daw: selectedDAW || '',
                plugins: plugins || '',
                availableInstruments: '',
                content: remixGuide.guide,
                createdAt: new Date().toISOString(),
                midiSettings: {},
              }}
            />
          </Card>
        </div>
      )}

      {!remixGuide && (
        <Card className="p-6 bg-gray-800/30">
          <div className="text-center space-y-4">
            <div className="text-6xl">🎛️</div>
            <h3 className="text-xl font-bold text-white">Transform Your Track</h3>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Upload your original track and select a target genre. Our AI will
              analyze the harmonic progression, melodies, and rhythmic elements,
              then generate a comprehensive remix guide with genre-appropriate
              MIDI patterns for basslines, drums, melodies, and textures.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};
