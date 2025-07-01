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

  // For custom genre/vibe
  const [customGenre, setCustomGenre] = useState('');
  const [customVibe, setCustomVibe] = useState('');
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
            Song Title
          </label>
          <Input
            type="text"
            value={userInputs.songTitle || ''}
            onChange={(e) => onInputsChange({ songTitle: e.target.value })}
            placeholder="Enter your song title..."
            className="w-full"
          />
        </div>

        {/* Genre Selection (Multi-select Dropdown + Optional Text Input) */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Genre(s) <span className="text-red-400">*</span>
          </label>
          <select
            multiple
            value={userInputs.genre.filter(g => GENRE_SUGGESTIONS.includes(g))}
            onChange={e => {
              const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
              // Keep custom genres if present
              const customs = userInputs.genre.filter(g => !GENRE_SUGGESTIONS.includes(g));
              onInputsChange({ genre: [...selected, ...customs] });
            }}
            className="w-full mb-2 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 h-32"
          >
            {GENRE_SUGGESTIONS.map((genre) => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
            <option value="__other__">Other...</option>
          </select>
          {/* Show text input for custom genre if "Other..." is selected or custom genres exist */}
          {(userInputs.genre.some(g => !GENRE_SUGGESTIONS.includes(g)) || userInputs.genre.includes("__other__")) && (
            <div className="mt-2">
              <Input
                type="text"
                value={customGenre}
                onChange={e => setCustomGenre(e.target.value)}
                placeholder="Enter custom genre(s), comma separated"
                className="w-full"
                onBlur={() => {
                  if (customGenre.trim()) {
                    const customs = customGenre.split(',').map(g => g.trim()).filter(Boolean);
                    // Remove __other__ and add customs
                    const filtered = userInputs.genre.filter(g => GENRE_SUGGESTIONS.includes(g));
                    onInputsChange({ genre: [...filtered, ...customs] });
                    setCustomGenre('');
                  }
                }}
              />
              <span className="text-xs text-gray-400">Press enter or click away to add</span>
            </div>
          )}
        </div>

        {/* Vibe Selection (Multi-select Dropdown + Optional Text Input) */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Vibe(s) <span className="text-red-400">*</span>
          </label>
          <select
            multiple
            value={userInputs.vibe.filter(v => VIBE_SUGGESTIONS.includes(v))}
            onChange={e => {
              const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
              // Keep custom vibes if present
              const customs = userInputs.vibe.filter(v => !VIBE_SUGGESTIONS.includes(v));
              onInputsChange({ vibe: [...selected, ...customs] });
            }}
            className="w-full mb-2 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-32"
          >
            {VIBE_SUGGESTIONS.map((vibe) => (
              <option key={vibe} value={vibe}>{vibe}</option>
            ))}
            <option value="__other__">Other...</option>
          </select>
          {/* Show text input for custom vibe if "Other..." is selected or custom vibes exist */}
          {(userInputs.vibe.some(v => !VIBE_SUGGESTIONS.includes(v)) || userInputs.vibe.includes("__other__")) && (
            <div className="mt-2">
              <Input
                type="text"
                value={customVibe}
                onChange={e => setCustomVibe(e.target.value)}
                placeholder="Enter custom vibe(s), comma separated"
                className="w-full"
                onBlur={() => {
                  if (customVibe.trim()) {
                    const customs = customVibe.split(',').map(v => v.trim()).filter(Boolean);
                    // Remove __other__ and add customs
                    const filtered = userInputs.vibe.filter(v => VIBE_SUGGESTIONS.includes(v));
                    onInputsChange({ vibe: [...filtered, ...customs] });
                    setCustomVibe('');
                  }
                }}
              />
              <span className="text-xs text-gray-400">Press enter or click away to add</span>
            </div>
          )}
        </div>

        {/* Move DAW above Plugins */}

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

        {/* Preferred Plugins */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Preferred Plugins
          </label>
          <Input
            type="text"
            value={userInputs.plugins}
            onChange={(e) => onInputsChange({ plugins: e.target.value })}
            placeholder="e.g., Serum, Massive, FabFilter Pro-Q 3..."
            className="w-full"
          />
        </div>

        {/* Artist Reference */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Artist Reference
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
            Reference Track Link
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
            Available Instruments
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
            Additional Notes
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
                    Key
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
                    Scale/Mode
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
                    Tempo
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
                  Chord Progression
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
