// src/utils/validation.ts

import { UserInputs, MidiSettings } from '../constants/types';
import { VALIDATION_RULES } from './constants';
import { AppError, ErrorType } from '../core/errors/AppError';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// User inputs validation
export function validateUserInputs(inputs: UserInputs): ValidationResult {
  const errors: string[] = [];

  // Genre validation
  if (!inputs.genre || inputs.genre.length === 0) {
    errors.push('At least one genre is required');
  } else if (inputs.genre.length > VALIDATION_RULES.MAX_GENRE_COUNT) {
    errors.push(`Maximum ${VALIDATION_RULES.MAX_GENRE_COUNT} genres allowed`);
  }

  // Vibe validation
  if (!inputs.vibe || inputs.vibe.length === 0) {
    errors.push('At least one vibe is required');
  } else if (inputs.vibe.length > VALIDATION_RULES.MAX_VIBE_COUNT) {
    errors.push(`Maximum ${VALIDATION_RULES.MAX_VIBE_COUNT} vibes allowed`);
  }

  // DAW validation
  if (!inputs.daw || inputs.daw.trim() === '') {
    errors.push('DAW selection is required');
  }

  // Text length validations
  if (inputs.generalNotes && inputs.generalNotes.length > VALIDATION_RULES.MAX_NOTES_LENGTH) {
    errors.push(`Notes must be under ${VALIDATION_RULES.MAX_NOTES_LENGTH} characters`);
  }

  if (inputs.lyrics && inputs.lyrics.length > VALIDATION_RULES.MAX_LYRICS_LENGTH) {
    errors.push(`Lyrics must be under ${VALIDATION_RULES.MAX_LYRICS_LENGTH} characters`);
  }

  // Reference track URL validation
  if (inputs.referenceTrackLink && inputs.referenceTrackLink.trim() !== '') {
    try {
      new URL(inputs.referenceTrackLink);
    } catch {
      errors.push('Reference track link must be a valid URL');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// MIDI settings validation
export function validateMidiSettings(settings: MidiSettings): ValidationResult {
  const errors: string[] = [];

  // Tempo validation
  if (!settings.tempo || settings.tempo < 60 || settings.tempo > 200) {
    errors.push('Tempo must be between 60 and 200 BPM');
  }

  // Bars validation
  if (!settings.bars || settings.bars < 1 || settings.bars > 32) {
    errors.push('Bars must be between 1 and 32');
  }

  // Time signature validation
  if (!settings.timeSignature || settings.timeSignature.length !== 2) {
    errors.push('Time signature must be in format [numerator, denominator]');
  } else {
    const [numerator, denominator] = settings.timeSignature;
    if (numerator < 1 || numerator > 16 || ![2, 4, 8, 16].includes(denominator)) {
      errors.push('Invalid time signature values');
    }
  }

  // Key validation
  if (!settings.key || settings.key.trim() === '') {
    errors.push('Key is required');
  }

  // Target instruments validation
  if (!settings.targetInstruments || settings.targetInstruments.length === 0) {
    errors.push('At least one target instrument is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Audio file validation
export function validateAudioFile(file: File): ValidationResult {
  const errors: string[] = [];

  // Size validation
  if (file.size > VALIDATION_RULES.AUDIO_FILE_MAX_SIZE) {
    errors.push(`Audio file must be under ${VALIDATION_RULES.AUDIO_FILE_MAX_SIZE / (1024 * 1024)}MB`);
  }

  // Type validation
  const validTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3'];
  const isValidType = validTypes.includes(file.type) ||
    file.name.toLowerCase().endsWith('.wav') ||
    file.name.toLowerCase().endsWith('.mp3');

  if (!isValidType) {
    errors.push('Audio file must be WAV or MP3 format');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Validation error factory
export function createValidationError(validationResult: ValidationResult, context: string): AppError {
  return new AppError(
    ErrorType.VALIDATION_FAILED,
    `Validation failed in ${context}: ${validationResult.errors.join(', ')}`,
    validationResult.errors.length === 1 
      ? validationResult.errors[0]
      : `Please fix the following issues: ${validationResult.errors.join(', ')}`,
    false,
    { component: context }
  );
}

// Input sanitization
export function sanitizeUserInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .slice(0, VALIDATION_RULES.MAX_INPUT_LENGTH); // Limit length
}

// URL validation
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Email validation (if needed for future features)
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
