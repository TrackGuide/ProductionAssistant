import { useAppStore } from '../store/useAppStore';
import { LAST_USED_DAW_KEY, LAST_USED_PLUGINS_KEY } from '../constants/constants';
import { initialInputsState } from '../constants/initialStates';
import { stopPlayback } from '../services/audioService';

export const useFormManagement = () => {
  const {
    inputs,
    setInputs,
    currentGenreText,
    setCurrentGenreText,
    currentVibeText,
    setCurrentVibeText,
    setGeneratedGuidebook,
    setActiveGuidebookDetails,
    setError,
    setMidiError,
    setCopyStatus,
    setShowLibraryModal
  } = useAppStore();

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

  const handleAddMultiSelectItem = (type: 'genre' | 'vibe') => {
    const textToAdd = type === 'genre' ? currentGenreText.trim() : currentVibeText.trim();
    if (textToAdd && !inputs[type].includes(textToAdd)) {
      setInputs(prev => ({ ...prev, [type]: [...prev[type], textToAdd] }));
    }
    if (type === 'genre') {
      setCurrentGenreText('');
    } else {
      setCurrentVibeText('');
    }
  };

  const handleMultiSelectKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, type: 'genre' | 'vibe') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddMultiSelectItem(type);
    }
  };
  
  const handleMultiSelectToggle = (field: 'genre' | 'vibe', value: string) => {
    setInputs(prev => {
      const currentValues = prev[field];
      const newValues = currentValues.filter(v => v !== value);
      return { ...prev, [field]: newValues };
    });
  };
  
  const handleDAWSuggestionClick = (value: string) => {
    setInputs(prev => ({ ...prev, daw: value }));
    localStorage.setItem(LAST_USED_DAW_KEY, value);
  };

  const resetFormForNewGuidebook = () => {
    const lastUsedDAW = localStorage.getItem(LAST_USED_DAW_KEY) || '';
    const lastUsedPlugins = localStorage.getItem(LAST_USED_PLUGINS_KEY) || '';
    setInputs({
      ...initialInputsState,
      songTitle: '', 
      daw: lastUsedDAW,
      plugins: lastUsedPlugins,
    });
    setCurrentGenreText('');
    setCurrentVibeText('');
    setGeneratedGuidebook("");
    setActiveGuidebookDetails(null);
    setError(null);
    setMidiError(null);
    setCopyStatus('');
    stopPlayback();
    setShowLibraryModal(false);
  };

  return {
    handleInputChange,
    handleAddMultiSelectItem,
    handleMultiSelectKeyDown,
    handleMultiSelectToggle,
    handleDAWSuggestionClick,
    resetFormForNewGuidebook
  };
};