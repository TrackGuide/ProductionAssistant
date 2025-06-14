import React, { useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { SparklesIcon, PlusIcon } from './icons';
import { GENRE_SUGGESTIONS, VIBE_SUGGESTIONS, DAW_SUGGESTIONS } from '../constants';
import { UserInputs } from '../types';

interface TrackInputFormProps {
  onSubmit?: (inputs: UserInputs) => void;
}

export const TrackInputForm: React.FC<TrackInputFormProps> = ({ onSubmit }) => {
  const [inputs, setInputs] = useState<UserInputs>({
    songTitle: '',
    genre: [],
    artistReference: '',
    vibe: [],
    daw: '',
    plugins: '',
    availableInstruments: '',
    referenceTrack: ''
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customGenre, setCustomGenre] = useState('');
  const [customVibe, setCustomVibe] = useState('');

  const handleGenreToggle = (genre: string) => {
    setInputs(prev => ({
      ...prev,
      genre: prev.genre.includes(genre)
        ? prev.genre.filter(g => g !== genre)
        : [...prev.genre, genre]
    }));
  };

  const handleVibeToggle = (vibe: string) => {
    setInputs(prev => ({
      ...prev,
      vibe: prev.vibe.includes(vibe)
        ? prev.vibe.filter(v => v !== vibe)
        : [...prev.vibe, vibe]
    }));
  };

  const handleAddCustomGenre = () => {
    if (customGenre.trim() && !inputs.genre.includes(customGenre.trim())) {
      setInputs(prev => ({
        ...prev,
        genre: [...prev.genre, customGenre.trim()]
      }));
      setCustomGenre('');
    }
  };

  const handleAddCustomVibe = () => {
    if (customVibe.trim() && !inputs.vibe.includes(customVibe.trim())) {
      setInputs(prev => ({
        ...prev,
        vibe: [...prev.vibe, customVibe.trim()]
      }));
      setCustomVibe('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(inputs);
    }
  };

  const isFormValid = inputs.songTitle && inputs.genre.length > 0;

  return (
    <Card title="🎵 Track Information" className="bg-gray-800/80 backdrop-blur-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Information */}
        <div className="space-y-3">
          <Input
            placeholder="Song title..."
            value={inputs.songTitle || ''}
            onChange={(e) => setInputs(prev => ({ ...prev, songTitle: e.target.value }))}
            required
          />
          
          <Input
            placeholder="Artist reference (e.g., 'Daft Punk', 'Deadmau5')..."
            value={inputs.artistReference}
            onChange={(e) => setInputs(prev => ({ ...prev, artistReference: e.target.value }))}
          />
        </div>

        {/* Genre Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Genre(s) *
          </label>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto mb-3">
            {GENRE_SUGGESTIONS.slice(0, 20).map(genre => (
              <button
                key={genre}
                type="button"
                onClick={() => handleGenreToggle(genre)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  inputs.genre.includes(genre)
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
          
          {/* Custom Genre Input */}
          <div className="flex gap-2 mb-2">
            <Input
              placeholder="Add custom genre..."
              value={customGenre}
              onChange={(e) => setCustomGenre(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomGenre())}
              className="flex-1"
            />
            <Button
              type="button"
              onClick={handleAddCustomGenre}
              variant="secondary"
              size="sm"
              disabled={!customGenre.trim()}
            >
              Add
            </Button>
          </div>
          
          {inputs.genre.length > 0 && (
            <div className="mt-2 text-xs text-gray-400">
              Selected: {inputs.genre.map(genre => (
                <span key={genre} className="inline-flex items-center gap-1 mr-2">
                  {genre}
                  <button
                    type="button"
                    onClick={() => handleGenreToggle(genre)}
                    className="text-red-400 hover:text-red-300"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Vibe Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Vibe/Mood
          </label>
          <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto mb-3">
            {VIBE_SUGGESTIONS.slice(0, 15).map(vibe => (
              <button
                key={vibe}
                type="button"
                onClick={() => handleVibeToggle(vibe)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  inputs.vibe.includes(vibe)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {vibe}
              </button>
            ))}
          </div>
          
          {/* Custom Vibe Input */}
          <div className="flex gap-2 mb-2">
            <Input
              placeholder="Add custom vibe..."
              value={customVibe}
              onChange={(e) => setCustomVibe(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomVibe())}
              className="flex-1"
            />
            <Button
              type="button"
              onClick={handleAddCustomVibe}
              variant="secondary"
              size="sm"
              disabled={!customVibe.trim()}
            >
              Add
            </Button>
          </div>
          
          {inputs.vibe.length > 0 && (
            <div className="mt-2 text-xs text-gray-400">
              Selected: {inputs.vibe.map(vibe => (
                <span key={vibe} className="inline-flex items-center gap-1 mr-2">
                  {vibe}
                  <button
                    type="button"
                    onClick={() => handleVibeToggle(vibe)}
                    className="text-red-400 hover:text-red-300"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Advanced Options Toggle */}
        <Button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          variant="secondary"
          size="sm"
          className="w-full"
          leftIcon={<PlusIcon className="w-4 h-4" />}
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced Options
        </Button>

        {/* Advanced Options */}
        {showAdvanced && (
          <div className="space-y-3 pt-3 border-t border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  DAW
                </label>
                <select
                  value={inputs.daw}
                  onChange={(e) => setInputs(prev => ({ ...prev, daw: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm"
                >
                  <option value="">Select DAW...</option>
                  {DAW_SUGGESTIONS.map(daw => (
                    <option key={daw} value={daw}>{daw}</option>
                  ))}
                </select>
              </div>
              
              <Input
                placeholder="Available instruments..."
                value={inputs.availableInstruments || ''}
                onChange={(e) => setInputs(prev => ({ ...prev, availableInstruments: e.target.value }))}
              />
            </div>
            
            <Textarea
              placeholder="Plugins and tools you have access to..."
              value={inputs.plugins}
              onChange={(e) => setInputs(prev => ({ ...prev, plugins: e.target.value }))}
              rows={2}
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Reference Track (Optional)
              </label>
              <Input
                placeholder="e.g., Spotify/YouTube link or 'Artist - Song Name'"
                value={inputs.referenceTrack || ''}
                onChange={(e) => setInputs(prev => ({ ...prev, referenceTrack: e.target.value }))}
              />
              <p className="text-xs text-gray-500 mt-1">
                Share a reference track to help inform the track guide generation
              </p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          disabled={!isFormValid}
          className="w-full"
          leftIcon={<SparklesIcon className="w-4 h-4" />}
        >
          {isFormValid ? 'Generate Track Guide' : 'Fill required fields'}
        </Button>
      </form>
    </Card>
  );
};