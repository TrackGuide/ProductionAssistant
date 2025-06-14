import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.warn('API_KEY is not set. Using demo mode - AI features will return placeholder content.');
}

const genAI = new GoogleGenerativeAI(API_KEY || 'demo-key');
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

/**
 * Generate MIDI pattern suggestions based on a text prompt.
 */
export const generateMidiPatternSuggestions = async (prompt: string): Promise<string> => {
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API error:', error);
    return 'Cmaj7 - Am - F - G'; // fallback
  }
};
