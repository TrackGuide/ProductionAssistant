import { GeneratedMidiPatterns, UserInputs } from '../types';

// Add the missing function
export const generateMidiPatternSuggestions = async (
  userInputs: UserInputs
): Promise<GeneratedMidiPatterns> => {
  try {
    // Check if the API key is being accessed correctly
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    console.log('API Key available:', !!apiKey); // Log if key exists, not the actual key
    
    if (!apiKey) {
      throw new Error('API key not found. Please add your Gemini API key to the .env file.');
    }
  } catch (error) {
    console.error('Error in generateMidiPatternSuggestions:', error);
    throw error;
  }
};