import React, { useState, useRef } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Spinner } from './Spinner';
import { MarkdownRenderer } from './MarkdownRenderer';
import { MidiGeneratorComponent } from './MidiGeneratorComponent';
import { getAllGenres, getGenreInfo, getGenresByCategory } from '../constants/remixGenres';
import { generateRemixGuide, generateMidiPatternSuggestions } from '../services/geminiService';
import { uploadAudio } from '../services/audioService';
import { MidiSettings, GeneratedMidiPatterns } from '../types';

interface RemixGuideData {
  guide: string;
  midiPatterns: {
    [section: string]: {
      bassline?: string;
      drums?: string;
      melody?: string;
      pads?: string;
    };
  };
  targetTempo: number;
  targetKey: string;
  sections: string[];
  generatedMidiPatterns?: GeneratedMidiPatterns;
}



const extractOriginalChordProgression = (guideContent: string): string | null => {
  if (!guideContent) return null;
  
  // Look for the "Original Track DNA Analysis" section
  const dnaSectionRegex = /##\s*🎵\s*Original Track DNA Analysis/i;
  const match = guideContent.match(dnaSectionRegex);
  if (!match || typeof match.index === 'undefined') return null;

  const startIndex = match.index;
  const nextSectionMatch = guideContent.substring(startIndex + match[0].length).match(/^##\s+/m);
  const endIndex = nextSectionMatch && typeof nextSectionMatch.index !== 'undefined' 
                   ? startIndex + match[0].length + nextSectionMatch.index 
                   : guideContent.length;
  
  const dnaContent = guideContent.substring(startIndex, endIndex).trim();
  
  // Look for harmonic blueprint with chord progressions
  const harmonicMatch = dnaContent.match(/\*\*Harmonic Blueprint\*\*:\s*([^\n]+)/i);
  if (harmonicMatch && harmonicMatch[1]) {
    const harmonicText = harmonicMatch[1];
    // Try to extract chord progression patterns like "I-V-vi-IV" or "Am-F-C-G"
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
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isGeneratingMidi, setIsGeneratingMidi] = useState<boolean>(false);
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
    // Convert to base64 for the API call
    const base64Data = await uploadAudio(audioFile);
    const audioData = { base64: base64Data.base64, mimeType: base64Data.mimeType };

    const genreInfo = getGenreInfo(selectedGenre);

    // Call the generateRemixGuide function
    const result = await generateRemixGuide(audioData, selectedGenre, genreInfo);
    setRemixGuide(result);

    // Automatically generate MIDI patterns after the guide is created
    setIsGeneratingMidi(true);
    try {
      // Extract original chord progression from the guide
      const originalChordProgression = extractOriginalChordProgression(result.guide);
      
      const midiSettings: MidiSettings = {
        key: result.targetKey,
        tempo: result.targetTempo,
        timeSignature: [4, 4] as [number, number],
        chordProgression: originalChordProgression || 'i-VI-III-VII', // Use original or fallback
        genre: 'Electronic', // Default for remix mode, not genre-specific
        bars: 8,
        targetInstruments: ['Bassline', 'Drums', 'Melody', 'Pads'], // Capitalized for consistency
        guidebookContext: `RemixGuide AI patterns for ${result.targetKey} at ${result.targetTempo} BPM`,
        songSection: result.sections[0] || 'Intro'
      };

      let accumulatedMidiJson = "";
      const midiStream = await generateMidiPatternSuggestions(midiSettings);
      for await (const chunk of midiStream) {
        accumulatedMidiJson += chunk.text;
      }

      // Parse the MIDI JSON
      let jsonStr = accumulatedMidiJson.trim();
      const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
      const match = jsonStr.match(fenceRegex);
      if (match && match[2]) {
        jsonStr = match[2].trim();
      }

      const generatedMidiPatterns = JSON.parse(jsonStr) as GeneratedMidiPatterns;
      
      // Update the remix guide with generated MIDI patterns
      setRemixGuide(prev => prev ? { ...prev, generatedMidiPatterns } : null);
    } catch (midiErr) {
      console.error('Error generating MIDI patterns for remix:', midiErr);
      // Don't fail the whole process if MIDI generation fails
    } finally {
      setIsGeneratingMidi(false);
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

  const resetForm = () => {
    setAudioFile(null);
    setSelectedCategory('');
    setSelectedGenre('');
    setRemixGuide(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Audio Upload */}
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

        {/* Genre Selection */}
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
                  return info
                    ? `🎵 Tempo: ${info.tempoRange[0]}-${info.tempoRange[1]} BPM`
                    : '';
                })()}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 text-red-200">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          onClick={generateRemix}
          disabled={!audioFile || !selectedGenre || isGenerating || isGeneratingMidi}
          className="flex-1"
        >
          {isGenerating ? (
            <>
              <Spinner size="sm" /> Analyzing & Generating Remix Guide...
            </>
          ) : isGeneratingMidi ? (
            <>
              <Spinner size="sm" /> Generating MIDI Patterns...
            </>
          ) : (
            '🎛️ Generate Remix Guide'
          )}
        </Button>
        <Button onClick={resetForm} variant="outline">
          Reset
        </Button>
      </div>

      {/* Results Section */}
      {remixGuide && (
        <div className="space-y-6">
          {/* Remix Guide */}
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



          {/* MIDI Patterns */}
          <Card className="p-6">
            <h3 className="text-xl font-bold text-white mb-6">
              🎹 MIDI Remix Patterns
            </h3>
            <MidiGeneratorComponent
              key={`remix-${selectedGenre}-${Date.now()}`}
              initialPatterns={remixGuide.generatedMidiPatterns || remixGuide.midiPatterns}
              sections={remixGuide.sections}
              targetTempo={remixGuide.targetTempo}
              targetKey={remixGuide.targetKey}
              isRemixMode={true}
              preGeneratedPatterns={remixGuide.generatedMidiPatterns}
              originalChordProgression={extractOriginalChordProgression(remixGuide.guide)}
              remixGuideContent={remixGuide.guide}
            />
          </Card>
        </div>
      )}

      {/* Info Section */}
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
