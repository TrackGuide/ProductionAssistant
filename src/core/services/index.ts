// src/core/services/index.ts

import { ImprovedGeminiService } from './ImprovedGeminiService';
import { APIRetryService } from './APIRetryService';

// Export the Singleton instance of the ImprovedGeminiService
export const AI = ImprovedGeminiService.getInstance();

// Export other services
export { APIRetryService };

// Re-export the ImprovedGeminiService class for testing/mocking
export { ImprovedGeminiService };
