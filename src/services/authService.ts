import { User, LoginCredentials, RegisterCredentials, SavedGeneration } from '../types/authTypes';

class AuthService {
  private readonly STORAGE_KEYS = {
    USER: 'trackguide_user',
    TOKEN: 'trackguide_token',
    GENERATIONS: 'trackguide_generations'
  };

  async login(credentials: LoginCredentials): Promise<User> {
    try {
      await this.delay(1000);
      
      if (!credentials.email || !credentials.password) {
        throw new Error('Email and password are required');
      }

      if (credentials.password.length < 6) {
        throw new Error('Invalid credentials');
      }

      const user: User = {
        id: `user_${Date.now()}`,
        email: credentials.email,
        username: credentials.email.split('@')[0],
        createdAt: new Date().toISOString(),
        subscription: 'free'
      };

      localStorage.setItem(this.STORAGE_KEYS.USER, JSON.stringify(user));
      localStorage.setItem(this.STORAGE_KEYS.TOKEN, `token_${user.id}`);

      return user;
    } catch (error) {
      throw new Error(error.message || 'Login failed');
    }
  }

  async register(credentials: RegisterCredentials): Promise<User> {
    try {
      await this.delay(1000);

      if (!credentials.email || !credentials.username || !credentials.password) {
        throw new Error('All fields are required');
      }

      if (credentials.password !== credentials.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (credentials.password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      if (!this.isValidEmail(credentials.email)) {
        throw new Error('Please enter a valid email address');
      }

      const user: User = {
        id: `user_${Date.now()}`,
        email: credentials.email,
        username: credentials.username,
        createdAt: new Date().toISOString(),
        subscription: 'free'
      };

      localStorage.setItem(this.STORAGE_KEYS.USER, JSON.stringify(user));
      localStorage.setItem(this.STORAGE_KEYS.TOKEN, `token_${user.id}`);

      return user;
    } catch (error) {
      throw new Error(error.message || 'Registration failed');
    }
  }

  async logout(): Promise<void> {
    localStorage.removeItem(this.STORAGE_KEYS.USER);
    localStorage.removeItem(this.STORAGE_KEYS.TOKEN);
  }

  getCurrentUser(): User | null {
    try {
      const userData = localStorage.getItem(this.STORAGE_KEYS.USER);
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    const user = this.getCurrentUser();
    const token = localStorage.getItem(this.STORAGE_KEYS.TOKEN);
    return !!(user && token);
  }

  async saveGeneration(generation: Omit<SavedGeneration, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<SavedGeneration> {
    const user = this.getCurrentUser();
    if (!user) {
      throw new Error('User must be logged in to save generations');
    }

    const savedGeneration: SavedGeneration = {
      ...generation,
      id: `gen_${Date.now()}`,
      userId: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const existingGenerations = this.getUserGenerations();
    existingGenerations.push(savedGeneration);
    
    localStorage.setItem(
      `${this.STORAGE_KEYS.GENERATIONS}_${user.id}`, 
      JSON.stringify(existingGenerations)
    );

    return savedGeneration;
  }

  getUserGenerations(): SavedGeneration[] {
    const user = this.getCurrentUser();
    if (!user) return [];

    try {
      const data = localStorage.getItem(`${this.STORAGE_KEYS.GENERATIONS}_${user.id}`);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

export const authService = new AuthService();