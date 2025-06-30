import { User, LoginCredentials, RegisterCredentials, SavedGeneration } from '../types/authTypes';

// Simulated API - replace with your actual backend
class AuthService {
  private readonly STORAGE_KEYS = {
    USER: 'trackguide_user',
    TOKEN: 'trackguide_token',
    GENERATIONS: 'trackguide_generations'
  };

  // Authentication methods
  async login(credentials: LoginCredentials): Promise<User> {
    try {
      // Simulate API call
      await this.delay(1000);
      
      // For demo purposes, accept any email/password combination
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

      // Store user data
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

      // Validation
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

      // Check if user already exists (simulate)
      const existingUsers = this.getStoredUsers();
      if (existingUsers.some(u => u.email === credentials.email)) {
        throw new Error('An account with this email already exists');
      }

      const user: User = {
        id: `user_${Date.now()}`,
        email: credentials.email,
        username: credentials.username,
        createdAt: new Date().toISOString(),
        subscription: 'free'
      };

      // Store user data
      existingUsers.push(user);
      localStorage.setItem('trackguide_all_users', JSON.stringify(existingUsers));
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

  // Generation storage methods
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

  async deleteGeneration(generationId: string): Promise<void> {
    const user = this.getCurrentUser();
    if (!user) throw new Error('User must be logged in');

    const generations = this.getUserGenerations();
    const filtered = generations.filter(g => g.id !== generationId);
    
    localStorage.setItem(
      `${this.STORAGE_KEYS.GENERATIONS}_${user.id}`, 
      JSON.stringify(filtered)
    );
  }

  // Helper methods
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private getStoredUsers(): User[] {
    try {
      const data = localStorage.getItem('trackguide_all_users');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }
}

export const authService = new AuthService();