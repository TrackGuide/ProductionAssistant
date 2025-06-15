import { GeneratedMidiPatterns, UserInputs } from '../types';

// Add the missing function
export const generateMidiPatternSuggestions = async (
  userInputs: UserInputs
): Promise<GeneratedMidiPatterns> => {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('API key not found. Please add your Gemini API key to the .env file.');
    }