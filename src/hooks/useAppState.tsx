// src/hooks/useAppState.ts

import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { UserInputs, GuidebookEntry, ActiveView, GeneratedMidiPatterns, MidiSettings } from '../constants/types';
import { AppError } from '../core/errors/AppError';

// State interface
interface AppState {
  // Current guidebook
  currentGuidebook: GuidebookEntry | null;
  generatedContent: string;
  
  // Library
  library: GuidebookEntry[];
  
  // UI state
  activeView: ActiveView;
  isLibraryModalOpen: boolean;
  
  // Form inputs
  userInputs: UserInputs;
  
  // MIDI state
  midiSettings: MidiSettings | null;
  generatedMidiPatterns: GeneratedMidiPatterns | null;
  midiError: string | null;
  
  // Loading states
  loading: {
    trackGuide: boolean;
    mixFeedback: boolean;
    remixGuide: boolean;
    patchGuide: boolean;
    midiGeneration: boolean;
  };
  
  // Errors
  errors: {
    trackGuide: AppError | null;
    mixFeedback: AppError | null;
    remixGuide: AppError | null;
    patchGuide: AppError | null;
    midiGeneration: AppError | null;
    general: AppError | null;
  };
  
  // Loading message
  loadingMessage: string;
}

// Actions
type AppAction =
  | { type: 'SET_CURRENT_GUIDEBOOK'; payload: GuidebookEntry | null }
  | { type: 'SET_GENERATED_CONTENT'; payload: string }
  | { type: 'SET_LIBRARY'; payload: GuidebookEntry[] }
  | { type: 'ADD_TO_LIBRARY'; payload: GuidebookEntry }
  | { type: 'REMOVE_FROM_LIBRARY'; payload: string }
  | { type: 'SET_ACTIVE_VIEW'; payload: ActiveView }
  | { type: 'SET_LIBRARY_MODAL_OPEN'; payload: boolean }
  | { type: 'SET_USER_INPUTS'; payload: Partial<UserInputs> }
  | { type: 'RESET_USER_INPUTS' }
  | { type: 'SET_MIDI_SETTINGS'; payload: MidiSettings | null }
  | { type: 'SET_GENERATED_MIDI_PATTERNS'; payload: GeneratedMidiPatterns | null }
  | { type: 'SET_MIDI_ERROR'; payload: string | null }
  | { type: 'SET_LOADING'; payload: { key: keyof AppState['loading']; value: boolean } }
  | { type: 'SET_ERROR'; payload: { key: keyof AppState['errors']; value: AppError | null } }
  | { type: 'SET_LOADING_MESSAGE'; payload: string }
  | { type: 'CLEAR_ALL_ERRORS' }
  | { type: 'RESET_STATE' };

// Initial state
const initialUserInputs: UserInputs = {
  songTitle: '',
  genre: [],
  artistReference: '',
  referenceTrackLink: '',
  lyrics: '',
  key: '',
  scale: '',
  chords: '',
  generalNotes: '',
  vibe: [],
  daw: '',
  plugins: '',
  availableInstruments: '',
};

const initialState: AppState = {
  currentGuidebook: null,
  generatedContent: '',
  library: [],
  activeView: 'landing',
  isLibraryModalOpen: false,
  userInputs: initialUserInputs,
  midiSettings: null,
  generatedMidiPatterns: null,
  midiError: null,
  loading: {
    trackGuide: false,
    mixFeedback: false,
    remixGuide: false,
    patchGuide: false,
    midiGeneration: false,
  },
  errors: {
    trackGuide: null,
    mixFeedback: null,
    remixGuide: null,
    patchGuide: null,
    midiGeneration: null,
    general: null,
  },
  loadingMessage: '',
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_CURRENT_GUIDEBOOK':
      return { ...state, currentGuidebook: action.payload };
      
    case 'SET_GENERATED_CONTENT':
      return { ...state, generatedContent: action.payload };
      
    case 'SET_LIBRARY':
      return { ...state, library: action.payload };
      
    case 'ADD_TO_LIBRARY':
      const existingIndex = state.library.findIndex(item => item.id === action.payload.id);
      if (existingIndex > -1) {
        const updatedLibrary = [...state.library];
        updatedLibrary[existingIndex] = action.payload;
        return { ...state, library: updatedLibrary };
      }
      return { ...state, library: [action.payload, ...state.library] };
      
    case 'REMOVE_FROM_LIBRARY':
      return { 
        ...state, 
        library: state.library.filter(item => item.id !== action.payload) 
      };
      
    case 'SET_ACTIVE_VIEW':
      return { ...state, activeView: action.payload };
      
    case 'SET_LIBRARY_MODAL_OPEN':
      return { ...state, isLibraryModalOpen: action.payload };
      
    case 'SET_USER_INPUTS':
      return { 
        ...state, 
        userInputs: { ...state.userInputs, ...action.payload } 
      };
      
    case 'RESET_USER_INPUTS':
      return { ...state, userInputs: initialUserInputs };
      
    case 'SET_MIDI_SETTINGS':
      return { ...state, midiSettings: action.payload };
      
    case 'SET_GENERATED_MIDI_PATTERNS':
      return { ...state, generatedMidiPatterns: action.payload };
      
    case 'SET_MIDI_ERROR':
      return { ...state, midiError: action.payload };
      
    case 'SET_LOADING':
      return {
        ...state,
        loading: { ...state.loading, [action.payload.key]: action.payload.value }
      };
      
    case 'SET_ERROR':
      return {
        ...state,
        errors: { ...state.errors, [action.payload.key]: action.payload.value }
      };
      
    case 'SET_LOADING_MESSAGE':
      return { ...state, loadingMessage: action.payload };
      
    case 'CLEAR_ALL_ERRORS':
      return {
        ...state,
        errors: {
          trackGuide: null,
          mixFeedback: null,
          remixGuide: null,
          patchGuide: null,
          midiGeneration: null,
          general: null,
        }
      };
      
    case 'RESET_STATE':
      return initialState;
      
    default:
      return state;
  }
}

// Context
interface AppContextType {
  state: AppState;
  actions: {
    setCurrentGuidebook: (guidebook: GuidebookEntry | null) => void;
    setGeneratedContent: (content: string) => void;
    setLibrary: (library: GuidebookEntry[]) => void;
    addToLibrary: (guidebook: GuidebookEntry) => void;
    removeFromLibrary: (id: string) => void;
    setActiveView: (view: ActiveView) => void;
    setLibraryModalOpen: (open: boolean) => void;
    setUserInputs: (inputs: Partial<UserInputs>) => void;
    resetUserInputs: () => void;
    setMidiSettings: (settings: MidiSettings | null) => void;
    setGeneratedMidiPatterns: (patterns: GeneratedMidiPatterns | null) => void;
    setMidiError: (error: string | null) => void;
    setLoading: (key: keyof AppState['loading'], value: boolean) => void;
    setError: (key: keyof AppState['errors'], error: AppError | null) => void;
    setLoadingMessage: (message: string) => void;
    clearAllErrors: () => void;
    resetState: () => void;
  };
}

const AppContext = createContext<AppContextType | null>(null);

// Provider component
export function AppStateProvider({ children }: { children: ReactNode }): JSX.Element {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Action creators
  const actions = {
    setCurrentGuidebook: useCallback((guidebook: GuidebookEntry | null) => {
      dispatch({ type: 'SET_CURRENT_GUIDEBOOK', payload: guidebook });
    }, []),

    setGeneratedContent: useCallback((content: string) => {
      dispatch({ type: 'SET_GENERATED_CONTENT', payload: content });
    }, []),

    setLibrary: useCallback((library: GuidebookEntry[]) => {
      dispatch({ type: 'SET_LIBRARY', payload: library });
    }, []),

    addToLibrary: useCallback((guidebook: GuidebookEntry) => {
      dispatch({ type: 'ADD_TO_LIBRARY', payload: guidebook });
    }, []),

    removeFromLibrary: useCallback((id: string) => {
      dispatch({ type: 'REMOVE_FROM_LIBRARY', payload: id });
    }, []),

    setActiveView: useCallback((view: ActiveView) => {
      dispatch({ type: 'SET_ACTIVE_VIEW', payload: view });
    }, []),

    setLibraryModalOpen: useCallback((open: boolean) => {
      dispatch({ type: 'SET_LIBRARY_MODAL_OPEN', payload: open });
    }, []),

    setUserInputs: useCallback((inputs: Partial<UserInputs>) => {
      dispatch({ type: 'SET_USER_INPUTS', payload: inputs });
    }, []),

    resetUserInputs: useCallback(() => {
      dispatch({ type: 'RESET_USER_INPUTS' });
    }, []),

    setMidiSettings: useCallback((settings: MidiSettings | null) => {
      dispatch({ type: 'SET_MIDI_SETTINGS', payload: settings });
    }, []),

    setGeneratedMidiPatterns: useCallback((patterns: GeneratedMidiPatterns | null) => {
      dispatch({ type: 'SET_GENERATED_MIDI_PATTERNS', payload: patterns });
    }, []),

    setMidiError: useCallback((error: string | null) => {
      dispatch({ type: 'SET_MIDI_ERROR', payload: error });
    }, []),

    setLoading: useCallback((key: keyof AppState['loading'], value: boolean) => {
      dispatch({ type: 'SET_LOADING', payload: { key, value } });
    }, []),

    setError: useCallback((key: keyof AppState['errors'], error: AppError | null) => {
      dispatch({ type: 'SET_ERROR', payload: { key, value: error } });
    }, []),

    setLoadingMessage: useCallback((message: string) => {
      dispatch({ type: 'SET_LOADING_MESSAGE', payload: message });
    }, []),

    clearAllErrors: useCallback(() => {
      dispatch({ type: 'CLEAR_ALL_ERRORS' });
    }, []),

    resetState: useCallback(() => {
      dispatch({ type: 'RESET_STATE' });
    }, []),
  };

  return (
    <AppContext.Provider value={{ state, actions }}>
      {children}
    </AppContext.Provider>
  );
}

// Hook to use the app state
export function useAppState() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}

// Convenience hooks for specific parts of state
export function useCurrentGuidebook() {
  const { state, actions } = useAppState();
  return {
    currentGuidebook: state.currentGuidebook,
    setCurrentGuidebook: actions.setCurrentGuidebook,
    generatedContent: state.generatedContent,
    setGeneratedContent: actions.setGeneratedContent,
  };
}

export function useLibrary() {
  const { state, actions } = useAppState();
  return {
    library: state.library,
    setLibrary: actions.setLibrary,
    addToLibrary: actions.addToLibrary,
    removeFromLibrary: actions.removeFromLibrary,
    isLibraryModalOpen: state.isLibraryModalOpen,
    setLibraryModalOpen: actions.setLibraryModalOpen,
  };
}

export function useUserInputs() {
  const { state, actions } = useAppState();
  return {
    userInputs: state.userInputs,
    setUserInputs: actions.setUserInputs,
    resetUserInputs: actions.resetUserInputs,
  };
}

export function useLoadingAndErrors() {
  const { state, actions } = useAppState();
  return {
    loading: state.loading,
    errors: state.errors,
    loadingMessage: state.loadingMessage,
    setLoading: actions.setLoading,
    setError: actions.setError,
    setLoadingMessage: actions.setLoadingMessage,
    clearAllErrors: actions.clearAllErrors,
  };
}

export function useMidiState() {
  const { state, actions } = useAppState();
  return {
    midiSettings: state.midiSettings,
    generatedMidiPatterns: state.generatedMidiPatterns,
    midiError: state.midiError,
    setMidiSettings: actions.setMidiSettings,
    setGeneratedMidiPatterns: actions.setGeneratedMidiPatterns,
    setMidiError: actions.setMidiError,
  };
}
