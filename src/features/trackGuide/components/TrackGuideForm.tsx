// src/features/trackGuide/components/TrackGuideForm.tsx

import React, { useState } from 'react';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { Textarea } from '../../../components/Textarea';
import { SaveIcon, BookOpenIcon } from '../../../components/icons';
import { UserInputs } from '../../../constants/types';
import { GENRE_SUGGESTIONS, VIBE_SUGGESTIONS, DAW_SUGGESTIONS } from '../../../constants/constants';

interface TrackGuideFormProps {
  userInputs: UserInputs;
  onInputsChange: (inputs: Partial<UserInputs>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onSaveToLibrary: () => void;
  onViewLibrary: () => void;
  onClearForm: () => void;
  isLoading: boolean;
  canSave: boolean;
  className?: string;
}

export const TrackGuideForm: React.FC<TrackGuideFormProps> = ({
  userInputs,
  onInputsChange,
  onSubmit,
  onSaveToLibrary,
  onViewLibrary,
  onClearForm,
  isLoading,
  canSave,
  className = ''
}) => {
  const handleGenreToggle = (genre: string) => {
    const genres = Array.isArray(userInputs.genre) ? userInputs.genre : (userInputs.genre ? [userInputs.genre] : []);
    const updatedGenres = genres.includes(genre)
      ? genres.filter(g => g !== genre)
      : [...genres, genre];
    onInputsChange({ genre: updatedGenres });
  };

  const handleVibeToggle = (vibe: string) => {
    const vibes = Array.isArray(userInputs.vibe) ? userInputs.vibe : (userInputs.vibe ? [userInputs.vibe] : []);
    const updatedVibes = vibes.includes(vibe)
      ? vibes.filter(v => v !== vibe)
      : [...vibes, vibe];
    onInputsChange({ vibe: updatedVibes });
  };

  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <Card className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Create Track Guide</h2>
        {canSave && (
          <Button
            type="button"
            onClick={onSaveToLibrary}
            variant="primary"
            leftIcon={<SaveIcon className="w-4 h-4" />}
            className="bg-green-600 hover:bg-green-700"
          >
            Save to Library
          </Button>
        )}
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Song Title */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Song Title (Optional)
          </label>
          <Input
            type="text"
            value={userInputs.songTitle || ''}
            onChange={(e) => onInputsChange({ songTitle: e.target.value })}
            placeholder="Enter your song title..."
            className="w-full"
          />
        </div>

        {/* Genre Selection (Text Input + Suggestions) */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Genre(s) <span className="text-red-400">*</span>
          </label>
          <Input
            type="text"
            value={userInputs.genre.join(', ')}
            onChange={e => {
              const val = e.target.value;
              const genres = val.split(',').map(g => g.trim()).filter(Boolean);
              onInputsChange({ genre: genres });
            }}
            placeholder="Type or select genres (comma separated)"
            className="w-full mb-2"
          />
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 bg-gray-800 rounded-lg">
            {GENRE_SUGGESTIONS.map((genre) => (
              <button
                key={genre}
                type="button"
                onClick={() => {
                  if (!userInputs.genre.includes(genre)) {
                    onInputsChange({ genre: [...userInputs.genre, genre] });
                  }
                }}
                className={`px-3 py-1 rounded-full text-xs transition-colors ${
                  userInputs.genre.includes(genre)
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        {/* Vibe Selection (Text Input + Suggestions) */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Vibe(s) <span className="text-red-400">*</span>
          </label>
          <Input
            type="text"
            value={userInputs.vibe.join(', ')}
            onChange={e => {
              const val = e.target.value;
              const vibes = val.split(',').map(v => v.trim()).filter(Boolean);
              onInputsChange({ vibe: vibes });
            }}
            placeholder="Type or select vibes (comma separated)"
            className="w-full mb-2"
          />
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-gray-800 rounded-lg">
            {VIBE_SUGGESTIONS.map((vibe) => (
              <button
                key={vibe}
                type="button"
                onClick={() => {
                  if (!userInputs.vibe.includes(vibe)) {
                    onInputsChange({ vibe: [...userInputs.vibe, vibe] });
                  }
                }}
                className={`px-3 py-1 rounded-full text-xs transition-colors ${
                  userInputs.vibe.includes(vibe)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {vibe}
              </button>
            ))}
          </div>
        </div>

        {/* DAW Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            DAW <span className="text-red-400">*</span>
          </label>
          <select
            value={userInputs.daw}
            onChange={(e) => onInputsChange({ daw: e.target.value })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            <option value="">Select DAW...</option>
            {DAW_SUGGESTIONS.map((daw) => (
              <option key={daw} value={daw}>
                {daw}
              </option>
            ))}
          </select>
        </div>

        {/* Artist Reference */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Artist Reference (Optional)
          </label>
          <Input
            type="text"
            value={userInputs.artistReference}
            onChange={(e) => onInputsChange({ artistReference: e.target.value })}
            placeholder="e.g., Deadmau5, Porter Robinson, Aphex Twin..."
            className="w-full"
          />
        </div>

        {/* Reference Track Link */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Reference Track Link (Optional)
          </label>
          <Input
            type="url"
            value={userInputs.referenceTrackLink || ''}
            onChange={(e) => onInputsChange({ referenceTrackLink: e.target.value })}
            placeholder="YouTube, Spotify, SoundCloud link..."
            className="w-full"
          />
        </div>

        {/* Preferred Plugins */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Preferred Plugins (Optional)
          </label>
          <Input
            type="text"
            value={userInputs.plugins}
            onChange={(e) => onInputsChange({ plugins: e.target.value })}
            placeholder="e.g., Serum, Massive, FabFilter Pro-Q 3..."
            className="w-full"
          />
        </div>

        {/* Available Instruments */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Available Instruments (Optional)
          </label>
          <Input
            type="text"
            value={userInputs.availableInstruments || ''}
            onChange={(e) => onInputsChange({ availableInstruments: e.target.value })}
            placeholder="e.g., Guitar, Bass, Vocals, Hardware synths..."
            className="w-full"
          />
        </div>

        {/* Additional Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Additional Notes (Optional)
          </label>
          <Textarea
            value={userInputs.generalNotes || ''}
            onChange={(e) => onInputsChange({ generalNotes: e.target.value })}
            placeholder="Any specific requirements, creative ideas, or constraints..."
            className="w-full"
            rows={3}
          />
        </div>

        {/* Advanced Options Collapsible */}
        <div>
          <button
            type="button"
            className="text-orange-400 underline text-sm mb-2 focus:outline-none"
            onClick={() => setShowAdvanced((v) => !v)}
            aria-expanded={showAdvanced}
          >
            {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
          </button>
          {showAdvanced && (
            <div className="space-y-4 bg-gray-800 rounded-lg p-4 mt-2">
              {/* Musical Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Key (Optional)
                  </label>
                  <Input
                    type="text"
                    value={userInputs.key || ''}
                    onChange={(e) => onInputsChange({ key: e.target.value })}
                    placeholder="e.g., C Major, A Minor"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Scale/Mode (Optional)
                  </label>
                  <Input
                    type="text"
                    value={userInputs.scale || ''}
                    onChange={(e) => onInputsChange({ scale: e.target.value })}
                    placeholder="e.g., Dorian, Mixolydian"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tempo (Optional)
                  </label>
                  <Input
                    type="text"
            value={userInputs.tempo || ''}
            onChange={(e) => {
              const val = e.target.value;
              onInputsChange({ tempo: val === '' ? undefined : Number(val) });
            }}
                    placeholder="e.g., 128 BPM"
                    className="w-full"
                  />
                </div>
              </div>

              {/* Chord Progression */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Chord Progression (Optional)
                </label>
                <Input
                  type="text"
                  value={userInputs.chords || ''}
                  onChange={(e) => onInputsChange({ chords: e.target.value })}
                  placeholder="e.g., I-V-vi-IV, Cm-Ab-Eb-Bb"
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            type="submit"
            disabled={isLoading || userInputs.genre.length === 0 || !userInputs.daw}
            className="flex-1"
          >
            {isLoading ? 'Generating...' : 'Generate Track Guide'}
          </Button>
          <Button
            type="button"
            onClick={onViewLibrary}
            variant="secondary"
            className="flex-1"
            leftIcon={<BookOpenIcon className="w-4 h-4" />}
          >
            View Library
          </Button>
          <Button
            type="button"
            onClick={onClearForm}
            variant="outline"
            className="flex-1"
          >
            Clear Form
          </Button>
        </div>
      </form>
    </Card>
  );
};
