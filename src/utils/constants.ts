// src/utils/constants.ts

// Naming convention utilities
export const NAMING_CONVENTIONS = {
  // Component naming
  COMPONENT_PREFIX: 'PA', // ProductionAssistant
  FEATURE_SUFFIX: 'Feature',
  HOOK_PREFIX: 'use',
  SERVICE_SUFFIX: 'Service',
  
  // File naming patterns
  COMPONENT_PATTERN: /^[A-Z][a-zA-Z0-9]*\.tsx?$/,
  HOOK_PATTERN: /^use[A-Z][a-zA-Z0-9]*\.ts$/,
  SERVICE_PATTERN: /^[a-z][a-zA-Z0-9]*Service\.ts$/,
  TYPE_PATTERN: /^[a-z][a-zA-Z0-9]*\.types\.ts$/,
  
  // CSS class naming (BEM-inspired)
  CSS_PREFIX: 'pa-',
  MODIFIER_SEPARATOR: '--',
  ELEMENT_SEPARATOR: '__',
} as const;

// Error message templates
export const ERROR_MESSAGES = {
  NETWORK: 'Network error. Please check your connection and try again.',
  API_QUOTA: 'API quota exceeded. Please try again in a few minutes.',
  API_KEY: 'Invalid API key. Please check your configuration.',
  VALIDATION: 'Please check your input and try again.',
  AUDIO_TOO_LARGE: 'Audio file is too large. Please use a file under 100MB.',
  AUDIO_INVALID_FORMAT: 'Invalid audio format. Please use WAV or MP3 files only.',
  UNEXPECTED: 'An unexpected error occurred. Please try again.',
} as const;

// Feature flags for gradual rollout
export const FEATURE_FLAGS = {
  IMPROVED_GEMINI_SERVICE: true,
  STREAMING_RESPONSES: true,
  ERROR_BOUNDARIES: true,
  PERFORMANCE_MONITORING: false,
  ADVANCED_VALIDATION: true,
  LAZY_LOADING: true,
} as const;

// Performance monitoring thresholds
export const PERFORMANCE_THRESHOLDS = {
  API_RESPONSE_TIME: 30000, // 30 seconds
  COMPONENT_RENDER_TIME: 100, // 100ms
  BUNDLE_SIZE_WARNING: 5 * 1024 * 1024, // 5MB
  MEMORY_USAGE_WARNING: 100 * 1024 * 1024, // 100MB
} as const;

// Validation rules
export const VALIDATION_RULES = {
  MIN_GENRE_COUNT: 1,
  MAX_GENRE_COUNT: 5,
  MIN_VIBE_COUNT: 1,
  MAX_VIBE_COUNT: 3,
  MAX_INPUT_LENGTH: 2000,
  MAX_LYRICS_LENGTH: 5000,
  MAX_NOTES_LENGTH: 1000,
  AUDIO_FILE_MAX_SIZE: 100 * 1024 * 1024, // 100MB
} as const;
