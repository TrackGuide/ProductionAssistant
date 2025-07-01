import {
  generateTrackGuide,
  generateRemixGuide,
  generatePatchGuide,
  generateMixFeedback,
  compareMixes,
  generateAIResponse,
  validateInputs,
  sanitizeInputs,
  geminiService,
} from '../geminiService';

// Mock the Google Generative AI
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: jest.fn().mockResolvedValue('Mocked AI response'),
        },
      }),
    }),
  })),
}));

// Mock environment variables
const mockEnv = {
  VITE_GEMINI_API_KEY: 'test-api-key',
};

Object.defineProperty(import.meta, 'env', {
  value: mockEnv,
  writable: true,
});

describe('GeminiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateTrackGuide', () => {
    const validInputs = {
      genres: ['Electronic', 'House'],
      vibes: ['Energetic', 'Uplifting'],
      dawName: 'Ableton Live',
      userNotes: 'Looking for a summer hit',
    };

    it('should generate track guide successfully', async () => {
      const result = await generateTrackGuide(validInputs);

      expect(result).toBe('Mocked AI response');
    });

    it('should handle inputs with missing optional fields', async () => {
      const minimalInputs = { genres: ['Electronic'] };

      const result = await generateTrackGuide(minimalInputs);

      expect(result).toBe('Mocked AI response');
    });

    it('should handle empty inputs', async () => {
      const result = await generateTrackGuide({});

      expect(result).toBe('Mocked AI response');
    });

    it('should throw error when API fails', async () => {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      GoogleGenerativeAI.mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: jest.fn().mockRejectedValue(new Error('API Error')),
        }),
      }));

      await expect(generateTrackGuide(validInputs)).rejects.toThrow(
        'Failed to generate track guide: API Error'
      );
    });
  });

  describe('generateRemixGuide', () => {
    const validInputs = {
      originalArtist: 'Artist Name',
      originalTrack: 'Track Name',
      originalGenre: 'Pop',
      remixGenre: 'Electronic',
      remixStyle: 'Progressive House',
      remixVibe: 'Energetic',
      dawName: 'Logic Pro',
      userNotes: 'Festival remix',
    };

    it('should generate remix guide successfully', async () => {
      const result = await generateRemixGuide(validInputs);

      expect(result).toBe('Mocked AI response');
    });

    it('should handle minimal inputs', async () => {
      const minimalInputs = { originalArtist: 'Test Artist' };

      const result = await generateRemixGuide(minimalInputs);

      expect(result).toBe('Mocked AI response');
    });
  });

  describe('generatePatchGuide', () => {
    const validInputs = {
      synthModel: 'Serum',
      soundType: 'Lead',
      genre: 'Dubstep',
      characteristics: ['Aggressive', 'Distorted'],
      userNotes: 'Need a screaming lead',
    };

    it('should generate patch guide successfully', async () => {
      const result = await generatePatchGuide(validInputs);

      expect(result).toBe('Mocked AI response');
    });

    it('should handle inputs without characteristics array', async () => {
      const inputsWithoutCharacteristics = {
        ...validInputs,
        characteristics: undefined,
      };

      const result = await generatePatchGuide(inputsWithoutCharacteristics);

      expect(result).toBe('Mocked AI response');
    });
  });

  describe('generateMixFeedback', () => {
    const validInputs = {
      genre: 'Hip Hop',
      dawName: 'Pro Tools',
      trackElements: ['Vocals', 'Drums', 'Bass', 'Piano'],
      currentIssues: 'Vocals are muddy',
      referenceTrack: 'Reference Song by Artist',
      userNotes: 'Need commercial sound',
    };

    it('should generate mix feedback successfully', async () => {
      const result = await generateMixFeedback(validInputs);

      expect(result).toBe('Mocked AI response');
    });

    it('should handle inputs without track elements', async () => {
      const inputsWithoutElements = {
        ...validInputs,
        trackElements: undefined,
      };

      const result = await generateMixFeedback(inputsWithoutElements);

      expect(result).toBe('Mocked AI response');
    });
  });

  describe('compareMixes', () => {
    const validInputs = {
      mixADescription: 'First mix version',
      mixACharacteristics: 'Bright and punchy',
      mixBDescription: 'Second mix version',
      mixBCharacteristics: 'Warm and smooth',
      genre: 'Rock',
      focusAreas: ['Frequency Balance', 'Dynamics'],
      userNotes: 'Which one sounds better?',
    };

    it('should compare mixes successfully', async () => {
      const result = await compareMixes(validInputs);

      expect(result).toBe('Mocked AI response');
    });

    it('should handle inputs without focus areas', async () => {
      const inputsWithoutFocus = {
        ...validInputs,
        focusAreas: undefined,
      };

      const result = await compareMixes(