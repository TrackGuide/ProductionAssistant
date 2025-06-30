import { create } from 'zustand';
import { UserInputs, GuidebookEntry, MidiSettings, GeneratedMidiPatterns, MixFeedbackInputs, ActiveView } from '../types/types';
import { initialInputsState, initialMixFeedbackInputsState } from '../constants/initialStates';

interface AppState {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;

  inputs: UserInputs;
  setInputs: (inputs: UserInputs) => void;
  updateInput: (key: keyof UserInputs, value: any) => void;

  library: GuidebookEntry[];
  setLibrary: (library: GuidebookEntry[]) => void;
  addToLibrary: (entry: GuidebookEntry) => void;
  removeFromLibrary: (id: string) => void;

  activeGuidebookDetails: GuidebookEntry | null;
  setActiveGuidebookDetails: (entry: GuidebookEntry | null) => void;

  mixFeedbackInputs: MixFeedbackInputs;
  setMixFeedbackInputs: (inputs: MixFeedbackInputs) => void;
  mixFeedbackResult: string | null;
  setMixFeedbackResult: (result: string | null) => void;

  generatedGuidebook: string;
  setGeneratedGuidebook: (content: string) => void;

  error: string | null;
  setError: (error: string | null) => void;

  midiError: string | null;
  setMidiError: (error: string | null) => void;

  copyStatus: string;
  setCopyStatus: (status: string) => void;

  showLibraryModal: boolean;
  setShowLibraryModal: (show: boolean) => void;

  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  loadingMessage: string;
  setLoadingMessage: (msg: string) => void;

  remixGuideContent: string;
  setRemixGuideContent: (content: string) => void;

  patchGuideContent: string;
  setPatchGuideContent: (content: string) => void;

  currentGenreText: string;
  setCurrentGenreText: (text: string) => void;

  currentVibeText: string;
  setCurrentVibeText: (text: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  activeView: 'landing',
  setActiveView: (view) => set({ activeView: view }),

  inputs: initialInputsState,
  setInputs: (inputs) => set({ inputs }),
  updateInput: (key, value) => set(state => ({
    inputs: { ...state.inputs, [key]: value }
  })),

  library: [],
  setLibrary: (library) => set({ library }),
  addToLibrary: (entry) => set(state => ({ library: [entry, ...state.library] })),
  removeFromLibrary: (id) => set(state => ({ library: state.library.filter(e => e.id !== id) })),

  activeGuidebookDetails: null,
  setActiveGuidebookDetails: (entry) => set({ activeGuidebookDetails: entry }),

  mixFeedbackInputs: initialMixFeedbackInputsState,
  setMixFeedbackInputs: (inputs) => set({ mixFeedbackInputs: inputs }),
  mixFeedbackResult: null,
  setMixFeedbackResult: (result) => set({ mixFeedbackResult: result }),

  generatedGuidebook: '',
  setGeneratedGuidebook: (content) => set({ generatedGuidebook: content }),

  error: null,
  setError: (error) => set({ error }),

  midiError: null,
  setMidiError: (error) => set({ midiError: error }),

  copyStatus: '',
  setCopyStatus: (status) => set({ copyStatus: status }),

  showLibraryModal: false,
  setShowLibraryModal: (show) => set({ showLibraryModal: show }),

  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  loadingMessage: '',
  setLoadingMessage: (msg) => set({ loadingMessage: msg }),

  remixGuideContent: '',
  setRemixGuideContent: (content) => set({ remixGuideContent: content }),

  patchGuideContent: '',
  setPatchGuideContent: (content) => set({ patchGuideContent: content }),

  currentGenreText: '',
  setCurrentGenreText: (text) => set({ currentGenreText: text }),

  currentVibeText: '',
  setCurrentVibeText: (text) => set({ currentVibeText: text }),
}));
