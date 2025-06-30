export interface User {
  id: string;
  email: string;
  username: string;
  createdAt: string;
  subscription?: 'free' | 'pro' | 'premium';
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

export interface SavedGeneration {
  id: string;
  userId: string;
  type: 'trackGuide' | 'mixFeedback' | 'mixCompare' | 'remixGuide' | 'patchGuide';
  title: string;
  content: string;
  inputs: any; // The original inputs used to generate
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}