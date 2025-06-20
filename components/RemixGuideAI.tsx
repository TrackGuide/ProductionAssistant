import React, { useState, useRef } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Spinner } from './Spinner';
import { Input } from './Input';
import { MarkdownRenderer } from './MarkdownRenderer';
import { MidiGeneratorComponent } from './MidiGeneratorComponent';
import { getAllGenres, getGenreInfo, getGenresByCategory } from '../constants/remixGenres';
import { generateRemixGuide, generateMidiPatternSuggestions } from '../services/geminiService';
import { uploadAudio } from '../services/audioService';
import { MidiSettings, GeneratedMidiPatterns, RemixGuideInputs } from '../types';
import { DAW_SUGGESTIONS } from '../constants';

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

export const RemixGuideAI: React.FC = () => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [daw, setDaw] = useState<string>('');
  const [plugins, setPlugins] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [remixGuide, setRemixGuide] = useState<RemixGuideData | null>(null);
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

    try {
      const base64Data = await uploadAudio(audioFile);
      const audioData = { base64: base64Data.base64, mimeType: base64Data.mimeType };

      const genreInfo = getGenreInfo(selectedGenre);

      // Step 1: Generate the remix guide (without MIDI)
      const result = await generateRemixGuide(audioData, selectedGenre, genreInfo, daw, plugins);
      
      // Step 2: Automatically generate MIDI patterns
      console.log('Remix guide generated, now generating MIDI patterns...');
      
      try {
        // Extract chord progression from the generated guide
        const originalChordProgression = extractOriginalChordProgression(result.guide);
        
        const midiSettings: MidiSettings = {
          key: result.originalKey || result.targetKey,
          tempo: result.targetTempo,
          timeSignature: [4, 4],
          chordProgression: originalChordProgression || result.originalChordProgression || 'i-VI-III-VII',
          genre: selectedGenre,
          bars: 8,
          targetInstruments: ['bassline', 'drums', 'melody', 'chords'],
          guidebookContext: `${selectedGenre} remix at ${result.targetTempo} BPM in ${result.targetKey}`,
          songSection: result.sections[0] || 'Intro'
        };

        console.log('MIDI settings:', midiSettings);

        const midiStream = await generateMidiPatternSuggestions(midiSettings);
        let jsonStr = '';
        
        // Handle streaming response
        for await (const chunk of midiStream) {
          if (chunk.text) {
            jsonStr += chunk.text;
          }
        }

        // Clean up the JSON response
        jsonStr = jsonStr.trim();
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[2]) {
          jsonStr = match[2].trim();
        }

        console.log('Raw MIDI JSON:', jsonStr);

        const generatedMidiPatterns = JSON.parse(jsonStr) as GeneratedMidiPatterns;
        
        // Normalize drum patterns
        if (generatedMidiPatterns.drums) {
          const lowercasedDrums: any = {};
          for (const key in generatedMidiPatterns.drums) {
            lowercasedDrums[key.toLowerCase().replace(/\s+/g, '_')] = generatedMidiPatterns.drums[key as keyof typeof generatedMidiPatterns.drums];
          }
          generatedMidiPatterns.drums = lowercasedDrums;
        }

        console.log('Generated MIDI patterns:', generatedMidiPatterns);

        // Update the remix guide with MIDI patterns
        const completeResult = {
          ...result,
          generatedMidiPatterns
        };

        setRemixGuide(completeResult);

      } catch (midiError) {
        console.error('Error generating MIDI patterns for remix:', midiError);
        // Still set the remix guide even if MIDI generation fails
        setRemixGuide({
          ...result,
          generatedMidiPatterns: {}
        });
        setError(`Remix guide generated successfully, but MIDI generation failed: ${midiError instanceof Error ? midiError.message : 'Unknown error'}`);
      }

    } catch (err) {
      console.error('Error generating remix guide:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate remix guide. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSelectedGenre('');
  };

  const regenerateMidi = async () => {
    if (!remixGuide) return;

    setIsGenerating(true);
    setError('');

    try {
      // Extract chord progression from the generated guide
      const originalChordProgression = extractOriginalChordProgression(remixGuide.guide);
      
      const midiSettings: MidiSettings = {
        key: remixGuide.originalKey || remixGuide.targetKey,
        tempo: remixGuide.targetTempo,
        timeSignature: [4, 4],
        chordProgression: originalChordProgression || remixGuide.originalChordProgression || 'i-VI-III-VII',
        genre: selectedGenre,
        bars: 8,
        targetInstruments: ['bassline', 'drums', 'melody', 'chords'],
        guidebookContext: `${selectedGenre} remix at ${remixGuide.targetTempo} BPM in ${remixGuide.targetKey}`,
        songSection: remixGuide.sections[0] || 'Intro'
      };

      console.log('Regenerating MIDI with settings:', midiSettings);

      const midiStream = await generateMidiPatternSuggestions(midiSettings);
      let jsonStr = '';
      
      // Handle streaming response
      for await (const chunk of midiStream) {
        if (chunk.text) {
          jsonStr += chunk.text;
        }
      }

      // Clean up the JSON response
      jsonStr = jsonStr.trim();
      const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
      const match = jsonStr.match(fenceRegex);
      if (match && match[2]) {
        jsonStr = match[2].trim();
      }

      console.log('Raw regenerated MIDI JSON:', jsonStr);

      const generatedMidiPatterns = JSON.parse(jsonStr) as GeneratedMidiPatterns;
      
      // Normalize drum patterns
      if (generatedMidiPatterns.drums) {
        const lowercasedDrums: any = {};
        for (const key in generatedMidiPatterns.drums) {
          lowercasedDrums[key.toLowerCase().replace(/\s+/g, '_')] = generatedMidiPatterns.drums[key as keyof typeof generatedMidiPatterns.drums];
        }
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
      setIsGenerating(false);
    }
  };

  const resetForm = () => {
    setAudioFile(null);
    setSelectedCategory('');
    setSelectedGenre('');
    setDaw('');
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
                  {genresByCategory[selectedCategory].map((genre) => (
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
            <input
              type="text"
              value={daw}
              onChange={(e) => setDaw(e.target.value)}
              placeholder="e.g., Ableton Live, Logic Pro X, FL Studio..."
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
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
              <Spinner size="sm" /> Generating Remix Guide + MIDI...
            </>
          ) : (
            '🎛️ Generate Complete Remix Guide + MIDI'
          )}
        </Button>
        <Button onClick={resetForm} variant="outline">
          Reset
        </Button>
      </div>

      {remixGuide && (
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
                disabled={isGenerating}
                variant="outline"
                className="text-sm"
              >
                {isGenerating ? (
                  <>
                    <Spinner size="sm" /> Regenerating...
                  </>
                ) : (
                  '🔄 Regenerate MIDI'
                )}
              </Button>
            </div>
            {remixGuide.generatedMidiPatterns ? (
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
                  artistReference: 'Remix Guide',
                  vibe: [selectedGenre],
                  daw: daw || 'Not specified',
                  plugins: plugins || 'Not specified',
                  availableInstruments: 'Remix instruments',
                  content: remixGuide.guide,
                  createdAt: new Date().toISOString(),
                  generatedMidiPatterns: remixGuide.generatedMidiPatterns
                }}
              />
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  {isGenerating ? (
                    <>
                      <Spinner size="lg" />
                      <p className="mt-4">Generating MIDI patterns...</p>
                    </>
                  ) : (
                    <>
                      <div className="text-4xl mb-2">🎹</div>
                      <p>MIDI patterns will appear here after generation</p>
                      <p className="text-sm mt-2">Click "Regenerate MIDI" to generate patterns</p>
                    </>
                  )}
                </div>
              </div>
            )}
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