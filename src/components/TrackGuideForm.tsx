import React, { useRef } from 'react';
import { CustomMultiSelect } from './CustomMultiSelect';
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
        <CustomMultiSelect
          label="Genre(s) *"
          options={GENRE_SUGGESTIONS}
          selected={inputs.genre}
          onChange={vals => onInputChange({ target: { name: 'genre', value: vals } } as any)}
          placeholder="Select or type genres..."
        />
        <CustomMultiSelect
          label="Vibe(s) *"
          options={VIBE_SUGGESTIONS}
          selected={inputs.vibe}
          onChange={vals => onInputChange({ target: { name: 'vibe', value: vals } } as any)}
          placeholder="Select or type vibes..."
        />
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
