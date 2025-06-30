import { useAppStore } from '../store/useAppStore';
import { LAST_USED_DAW_KEY, LAST_USED_PLUGINS_KEY } from '../constants/constants';

/**
 * Custom hook for form input handlers
 */
export const useFormHandlers = () => {
  const {
    inputs, setInputs,
    currentGenreText, setCurrentGenreText,
    currentVibeText, setCurrentVibeText,
  } = useAppStore();

  /**
   * Handles input changes for form fields
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
  
    if (name === "currentGenreText") {
      setCurrentGenreText(value); 
    } else if (name === "currentVibeText") {
      setCurrentVibeText(value); 
    } else {
      setInputs(prev => ({ ...prev, [name]: value }));
      if (name === 'daw') {
        localStorage.setItem(LAST_USED_DAW_KEY, value);
      } else if (name === 'plugins') {
        localStorage.setItem(LAST_USED_PLUGINS_KEY, value);
      }
    }
  };

  /**
   * Adds an item to multi-select fields (genre/vibe)
   */
  const handleAddMultiSelectItem = (type: 'genre' | 'vibe', genreInputRef?: React.RefObject<HTMLInputElement>, vibeInputRef?: React.RefObject<HTMLInputElement>) => {
    const textToAdd = type === 'genre' ? currentGenreText.trim() : currentVibeText.trim();
    if (textToAdd && !inputs[type].includes(textToAdd)) {
      setInputs(prev => ({ ...prev, [type]: [...prev[type], textToAdd] }));
    }
    if (type === 'genre') {
      setCurrentGenreText('');
      genreInputRef?.current?.focus();
    } else {
      setCurrentVibeText('');
      vibeInputRef?.current?.focus();
    }
  };

  /**
   * Handles keydown events for multi-select inputs
   */
  const handleMultiSelectKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, type: 'genre' | 'vibe', genreInputRef?: React.RefObject<HTMLInputElement>, vibeInputRef?: React.RefObject<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddMultiSelectItem(type, genreInputRef, vibeInputRef);
    }
  };
  
  /**
   * Toggles multi-select items (removes them)
   */
  const handleMultiSelectToggle = (field: 'genre' | 'vibe', value: string) => {
    setInputs(prev => {
      const currentValues = prev[field];
      const newValues = currentValues.filter(v => v !== value);
      return { ...prev, [field]: newValues };
    });
  };
  
  /**
   * Handles DAW suggestion clicks
   */
  const handleDAWSuggestionClick = (value: string) => {
    setInputs(prev => ({ ...prev, daw: value }));
    localStorage.setItem(LAST_USED_DAW_KEY, value);
  };

  return {
    handleInputChange,
    handleAddMultiSelectItem,
    handleMultiSelectKeyDown,
    handleMultiSelectToggle,
    handleDAWSuggestionClick,
  };
};