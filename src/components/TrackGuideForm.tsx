import React, { useRef } from 'react';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { Button } from './Button';
import { PlusIcon, BookOpenIcon } from './icons';
import { UserInputs } from '../types/appTypes';
import { GENRE_SUGGESTIONS, VIBE_SUGGESTIONS, DAW_SUGGESTIONS } from '../constants/constants';

interface TrackGuideFormProps {
  inputs: UserInputs;
  currentGenreText: string;
  currentVibeText: string;
  showAdvancedInput: boolean;
  isLoading: boolean;
  loadingMessage: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onAddMultiSelectItem: (type: 'genre' | 'vibe') => void;
  onMultiSelectKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, type: 'genre' | 'vibe') => void;
  onMultiSelectToggle: (field: 'genre' | 'vibe', value: string) => void;
  onDAWSuggestionClick: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onShowLibrary: () => void;
  onClearForm: () => void;
  setShowAdvancedInput: (show: boolean) => void;
  onSaveToLibrary?: () => void;
}

const SelectedPills: React.FC<{
  selections: string[],
  onRemove: (value: string) => void,
}> = ({ selections, onRemove }) => (
  <div className="flex flex-wrap gap-2 mt-2 mb-2 min-h-[2.25rem]">
    {selections.map(selection => (
      <span key={selection} className="flex items-center px-3 py-1 bg-orange-600 text-white text-xs font-medium rounded-full shadow-md hover:bg-orange-700 transition-colors">
        {selection}
        <button 
          type="button" 
          onClick={() => onRemove(selection)}
          className="ml-1.5 -mr-0.5 p-0.5 text-orange-200 hover:text-white rounded-full focus:outline-none focus:bg-orange-800 transition-colors"
          aria-label={`Remove ${selection}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </span>
    ))}
  </div>
);

export const TrackGuideForm: React.FC<TrackGuideFormProps> = ({
  inputs,
  currentGenreText,
  currentVibeText,
  showAdvancedInput,
  isLoading,
  loadingMessage,
  onInputChange,
  onAddMultiSelectItem,
  onMultiSelectKeyDown,
  onMultiSelectToggle,
  onDAWSuggestionClick,
  onSubmit,
  onShowLibrary,
  onClearForm,
  setShowAdvancedInput,
  onSaveToLibrary
}) => {
  const genreInputRef = useRef<HTMLInputElement>(null);
  const vibeInputRef = useRef<HTMLInputElement>(null);

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <Input label="Song Title / Project Name" name="songTitle" value={inputs.songTitle || ''} onChange={onInputChange} placeholder="AI will suggest one if left blank" />
      </div>
      <div>
        <Input label="Artist References" name="artistReference" value={inputs.artistReference} onChange={onInputChange} placeholder="e.g., Daft Punk" />
      </div>
      <div>
        <Input label="Song Reference" name="referenceTrackLink" value={inputs.referenceTrackLink || ''} onChange={onInputChange} placeholder="e.g., YouTube, Spotify, SoundCloud link" />
      </div>
      <div className="space-y-2">
        {/* Genre Multi-select Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">Genre(s) <span className="text-red-400">*</span></label>
          <select
            multiple
            value={inputs.genre.filter(g => GENRE_SUGGESTIONS.includes(g) || g === "__other__")}
            onChange={e => {
              const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
              // Keep custom genres if present
              const customs = inputs.genre.filter(g => !GENRE_SUGGESTIONS.includes(g) && g !== "__other__");
              onInputChange({
                target: { name: 'genre', value: [...selected, ...customs] }
              } as any);
            }}
            className="w-full mb-2 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 h-32"
          >
            {GENRE_SUGGESTIONS.map((genre) => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
            <option value="__other__">Other...</option>
          </select>
          {/* Show text input for custom genre if "Other..." is selected or custom genres exist */}
          {(inputs.genre.some(g => !GENRE_SUGGESTIONS.includes(g)) || inputs.genre.includes("__other__")) && (
            <div className="mt-2">
              <Input
                type="text"
                value={currentGenreText}
                onChange={onInputChange}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (currentGenreText.trim()) {
                      const customs = currentGenreText.split(',').map(g => g.trim()).filter(Boolean);
                      // Remove __other__ and add customs
                      const filtered = inputs.genre.filter(g => GENRE_SUGGESTIONS.includes(g));
                      onInputChange({
                        target: { name: 'genre', value: [...filtered, ...customs] }
                      } as any);
                    }
                  }
                }}
                placeholder="Enter custom genre(s), comma separated"
                className="w-full"
                onBlur={() => {
                  if (currentGenreText.trim()) {
                    const customs = currentGenreText.split(',').map(g => g.trim()).filter(Boolean);
                    // Remove __other__ and add customs
                    const filtered = inputs.genre.filter(g => GENRE_SUGGESTIONS.includes(g));
                    onInputChange({
                      target: { name: 'genre', value: [...filtered, ...customs] }
                    } as any);
                  }
                }}
              />
              <span className="text-xs text-gray-400">Press enter or click away to add</span>
            </div>
          )}
          <SelectedPills selections={inputs.genre.filter(g => g !== "__other__")} onRemove={(val) => onMultiSelectToggle('genre', val)} />
        </div>
        {/* Vibe Multi-select Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">Vibe(s) <span className="text-red-400">*</span></label>
          <select
            multiple
            value={inputs.vibe.filter(v => VIBE_SUGGESTIONS.includes(v) || v === "__other__")}
            onChange={e => {
              const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
              // Keep custom vibes if present
              const customs = inputs.vibe.filter(v => !VIBE_SUGGESTIONS.includes(v) && v !== "__other__");
              onInputChange({
                target: { name: 'vibe', value: [...selected, ...customs] }
              } as any);
            }}
            className="w-full mb-2 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 h-32"
          >
            {VIBE_SUGGESTIONS.map((vibe) => (
              <option key={vibe} value={vibe}>{vibe}</option>
            ))}
            <option value="__other__">Other...</option>
          </select>
          {/* Show text input for custom vibe if "Other..." is selected or custom vibes exist */}
          {(inputs.vibe.some(v => !VIBE_SUGGESTIONS.includes(v)) || inputs.vibe.includes("__other__")) && (
            <div className="mt-2">
              <Input
                type="text"
                value={currentVibeText}
                onChange={onInputChange}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (currentVibeText.trim()) {
                      const customs = currentVibeText.split(',').map(v => v.trim()).filter(Boolean);
                      // Remove __other__ and add customs
                      const filtered = inputs.vibe.filter(v => VIBE_SUGGESTIONS.includes(v));
                      onInputChange({
                        target: { name: 'vibe', value: [...filtered, ...customs] }
                      } as any);
                    }
                  }
                }}
                placeholder="Enter custom vibe(s), comma separated"
                className="w-full"
                onBlur={() => {
                  if (currentVibeText.trim()) {
                    const customs = currentVibeText.split(',').map(v => v.trim()).filter(Boolean);
                    // Remove __other__ and add customs
                    const filtered = inputs.vibe.filter(v => VIBE_SUGGESTIONS.includes(v));
                    onInputChange({
                      target: { name: 'vibe', value: [...filtered, ...customs] }
                    } as any);
                  }
                }}
              />
              <span className="text-xs text-gray-400">Press enter or click away to add</span>
            </div>
          )}
          <SelectedPills selections={inputs.vibe.filter(v => v !== "__other__")} onRemove={(val) => onMultiSelectToggle('vibe', val)} />
        </div>
      </div>
      <div>
        <Input label="Preferred DAW" name="daw" value={inputs.daw} onChange={onInputChange} placeholder="Type or select DAW..." list="daw-suggestions" />
        <datalist id="daw-suggestions">
          {DAW_SUGGESTIONS.map(s => <option key={s} value={s} />)}
        </datalist>
      </div>
      <div>
        <Textarea label="Available Plugins" name="plugins" value={inputs.plugins} onChange={onInputChange} placeholder="e.g., Serum, Valhalla Reverbs, Arturia V Collection, or 'stock only'" rows={2} />
      </div>
      <div>
        <Textarea label="Available Instruments" name="availableInstruments" value={inputs.availableInstruments || ''} onChange={onInputChange} placeholder="e.g., Electric Guitar, Moog Subsequent 37, Roland TR-808, Vocals" rows={2} />
      </div>
      {/* Advanced Input Toggle */}
      <div className="border-t border-gray-600 pt-4">
        <Button 
          type="button" 
          onClick={() => setShowAdvancedInput(!showAdvancedInput)}
          variant="outline" 
          className="mb-4 w-8 h-8 p-0 flex items-center justify-center"
          title={showAdvancedInput ? 'Hide Advanced Input' : 'Show Advanced Input'}
        >
          <span className={`text-lg transition-transform ${showAdvancedInput ? 'rotate-45' : ''}`}>
            +
          </span>
        </Button>
        {showAdvancedInput && (
          // Advanced input fields can be added here
          null
        )}
      </div>
      <Button type="submit" disabled={isLoading} className="w-full text-base py-2.5">
        {isLoading ? (loadingMessage || 'Generating...') : 'Generate TrackGuide'}
      </Button>
      <div className="flex space-x-2 mt-3">
        <Button type="button" onClick={onShowLibrary} variant="secondary" className="flex-1" leftIcon={<BookOpenIcon className="w-4 h-4"/>}>View Library</Button>
        <Button type="button" onClick={onClearForm} variant="outline" className="flex-1">Clear Form</Button>
      </div>
    </form>
  );
};
