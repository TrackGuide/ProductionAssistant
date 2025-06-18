import React, { useState, useRef } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Spinner } from './Spinner';
import { MarkdownRenderer } from './MarkdownRenderer';
import { MidiGeneratorComponent } from './MidiGeneratorComponent';
import { getAllGenres, getGenreInfo, getGenresByCategory } from '../constants/remixGenres';
import { generateRemixGuide } from '../services/geminiService';
import { uploadAudio } from '../services/audioService';

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
}

export const RemixGuideAI: React.FC = () => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [remixGuide, setRemixGuide] = useState<RemixGuideData | null>(null);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const genresByCategory = getGenresByCategory();
  const categories = Object.keys(genresByCategory);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3'];
      if (validTypes.includes(file.type) || file.name.toLowerCase().endsWith('.wav') || file.name.toLowerCase().endsWith('.mp3')) {
        if (file.size <= 100 * 1024 * 1024) {
          setAudioFile(file);
          setError('');
        } else {
          setError('File size must be under 100MB');
        }
      } else {
        setError('Please upload a WAV or MP3 file');
      }
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      const validTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3'];
      if (validTypes.includes(file.type) || file.name.toLowerCase().endsWith('.wav') || file.name.toLowerCase().endsWith('.mp3')) {
        if (file.size <= 100 * 1024 * 1024) {
          setAudioFile(file);
          setError('');
        } else {
          setError('File size must be under 100MB');
        }
      } else {
        setError('Please upload a WAV or MP3 file');
      }
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
      // Convert audio file to base64 string first
      const audioBase64 = await uploadAudio(audioFile);

      const genreInfo = getGenreInfo(selectedGenre);

      // Now generate remix guide using the base64 string
      const result = await generateRemixGuide(audioBase64, selectedGenre, genreInfo);

      setRemixGuide(result);
    } catch (err) {
      console.error('Error generating remix guide:', err);
      setError('Failed to generate remix guide. Please try again.');
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
              <Spinner size="sm" />
              Analyzing & Generating Remix Guide...
            </>
          ) : (
            '🎛️ Generate Remix Guide'
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
            <h3 className="text-xl font-bold text-white mb-6">🎹 MIDI Remix Patterns</h3>
            <MidiGeneratorComponent
              key={`remix-${selectedGenre}-${Date.now()}`}
              initialPatterns={remixGuide.midiPatterns}
              sections={remixGuide.sections}
              targetTempo={remixGuide.targetTempo}
              targetKey={remixGuide.targetKey}
              isRemixMode={true}
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
              Upload your original track and select a target genre. Our AI will analyze the harmonic progression, 
              melodies, and rhythmic elements, then generate a comprehensive remix guide with genre-appropriate 
              MIDI patterns for basslines, drums, melodies, and textures.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};
