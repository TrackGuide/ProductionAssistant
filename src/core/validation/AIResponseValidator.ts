// src/core/validation/AIResponseValidator.ts

export interface ValidationRule<T> {
  field: keyof T;
  required: boolean;
  type: 'string' | 'number' | 'array' | 'object' | 'boolean';
  validator?: (value: any) => boolean;
  errorMessage?: string;
}

export interface ValidationResult<T> {
  isValid: boolean;
  data?: T;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export class AIResponseValidator<T> {
  constructor(private rules: ValidationRule<T>[]) {}

  validate(response: any, strict = false): ValidationResult<T> {
    const errors: ValidationError[] = [];

    // Check if response is null or undefined
    if (!response || typeof response !== 'object') {
      return {
        isValid: false,
        errors: [{ field: 'root', message: 'Response is not a valid object' }]
      };
    }

    // Validate each rule
    for (const rule of this.rules) {
      const fieldName = String(rule.field);
      const value = response[rule.field];

      // Check required fields
      if (rule.required && (value === undefined || value === null)) {
        errors.push({
          field: fieldName,
          message: rule.errorMessage || `Missing required field: ${fieldName}`,
          value: undefined
        });
        continue;
      }

      // Skip validation if field is not required and not present
      if (!rule.required && (value === undefined || value === null)) {
        continue;
      }

      // Type validation
      if (!this.validateType(value, rule.type)) {
        errors.push({
          field: fieldName,
          message: rule.errorMessage || `Invalid type for ${fieldName}: expected ${rule.type}, got ${typeof value}`,
          value
        });
        continue;
      }

      // Custom validation
      if (rule.validator && !rule.validator(value)) {
        errors.push({
          field: fieldName,
          message: rule.errorMessage || `Custom validation failed for ${fieldName}`,
          value
        });
      }
    }

    // In strict mode, check for unexpected fields
    if (strict) {
      const allowedFields = new Set(this.rules.map(rule => String(rule.field)));
      for (const key of Object.keys(response)) {
        if (!allowedFields.has(key)) {
          errors.push({
            field: key,
            message: `Unexpected field: ${key}`,
            value: response[key]
          });
        }
      }
    }

    return {
      isValid: errors.length === 0,
      data: errors.length === 0 ? response as T : undefined,
      errors
    };
  }

  private validateType(value: any, expectedType: string): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      default:
        return false;
    }
  }
}

// Predefined validators for common response types
export const MidiPatternValidator = new AIResponseValidator<GeneratedMidiPatterns>([
  { field: 'chords', required: false, type: 'array' },
  { field: 'bassline', required: false, type: 'array' },
  { field: 'melody', required: false, type: 'array' },
  { field: 'drums', required: false, type: 'object' },
  { field: 'error', required: false, type: 'string' }
]);

export const GuidebookValidator = new AIResponseValidator<Partial<GuidebookEntry>>([
  { field: 'content', required: true, type: 'string', validator: (v) => v.length > 100 },
  { field: 'title', required: true, type: 'string', validator: (v) => v.length > 0 },
  { field: 'genre', required: false, type: 'array' },
  { field: 'vibe', required: false, type: 'array' },
  { field: 'daw', required: false, type: 'string' }
]);

export const RemixGuideValidator = new AIResponseValidator<{
  guide: string;
  targetTempo: number;
  targetKey: string;
  sections: string[];
}>([
  { field: 'guide', required: true, type: 'string', validator: (v) => v.length > 200 },
  { field: 'targetTempo', required: true, type: 'number', validator: (v) => v > 60 && v < 200 },
  { field: 'targetKey', required: true, type: 'string', validator: (v) => /^[A-G][#b]?\s*(major|minor|maj|min)?$/i.test(v) },
  { field: 'sections', required: true, type: 'array', validator: (v) => v.length > 0 }
]);

// Import types
import { GeneratedMidiPatterns, GuidebookEntry } from '../../constants/types';
