import { create } from 'zustand';
import { User, AuthState, LoginCredentials, RegisterCredentials, SavedGeneration } from '../types/authTypes';
import { authService } from '../services/authService';

interface AuthStore extends AuthState {
  // Auth actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => void;
  clearError: () => void;
  
  // Generation actions
  savedGenerations: SavedGeneration[];
  saveGeneration: (generation: Omit<SavedGeneration, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<SavedGeneration>;
  loadUserGenerations: () => void;
  deleteGeneration: (id: string) => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  savedGenerations: [],

  // Auth actions
  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authService.login(credentials);
      set({ user, isAuthenticated: true, isLoading: false });
      get().loadUserGenerations();
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  register: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authService.register(credentials);
      set({ user, isAuthenticated: true, isLoading: false });
      get().loadUserGenerations();
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authService.logout();
      set({ 
        user: null, 
        isAuthenticated: false, 
        isLoading: false, 
        savedGenerations: [],
        error: null 
      });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  checkAuth: () => {
    const user = authService.getCurrentUser();
    const isAuthenticated = authService.isAuthenticated();
    set({ user, isAuthenticated });
    if (isAuthenticated) {
      get().loadUserGenerations();
    }
  },

  clearError: () => set({ error: null }),

  // Generation actions
  saveGeneration: async (generationData) => {
    try {
      const savedGeneration = await authService.saveGeneration(generationData);
      set(state => ({
        savedGenerations: [savedGeneration, ...state.savedGenerations]
      }));
      return savedGeneration;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  loadUserGenerations: () => {
    const generations = authService.getUserGenerations();
    set({ savedGenerations: generations.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )});
  },

  deleteGeneration: async (id) => {
    try {
      await authService.deleteGeneration(id);
      set(state => ({
        savedGenerations: state.savedGenerations.filter(g => g.id !== id)
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  }
}));