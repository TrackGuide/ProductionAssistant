// src/core/errors/AppError.ts

export enum ErrorType {
  // API Errors
  API_QUOTA_EXCEEDED = 'API_QUOTA_EXCEEDED',
  API_KEY_INVALID = 'API_KEY_INVALID',
  API_NETWORK_ERROR = 'API_NETWORK_ERROR',
  API_RESPONSE_BLOCKED = 'API_RESPONSE_BLOCKED',
  
  // Audio Processing Errors
  AUDIO_FILE_TOO_LARGE = 'AUDIO_FILE_TOO_LARGE',
  AUDIO_FORMAT_INVALID = 'AUDIO_FORMAT_INVALID',
  AUDIO_PROCESSING_FAILED = 'AUDIO_PROCESSING_FAILED',
  
  // Validation Errors
  INVALID_JSON_RESPONSE = 'INVALID_JSON_RESPONSE',
  MISSING_REQUIRED_FIELDS = 'MISSING_REQUIRED_FIELDS',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  
  // User Input Errors
  REQUIRED_FIELD_MISSING = 'REQUIRED_FIELD_MISSING',
  INVALID_INPUT_FORMAT = 'INVALID_INPUT_FORMAT',
  INVALID_INPUT = 'INVALID_INPUT',
  
  // General Errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  INITIALIZATION_FAILED = 'INITIALIZATION_FAILED'
}

export interface ErrorContext {
  component?: string;
  service?: string;
  operation?: string;
  metadata?: Record<string, any>;
}

export class AppError extends Error {
  public readonly timestamp: Date;
  public readonly id: string;

  constructor(
    public readonly type: ErrorType,
    message: string,
    public readonly userMessage: string,
    public readonly retryable: boolean = false,
    public readonly context?: ErrorContext,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'AppError';
    this.timestamp = new Date();
    this.id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      message: this.message,
      userMessage: this.userMessage,
      timestamp: this.timestamp.toISOString(),
      retryable: this.retryable,
      context: this.context,
      stack: this.stack
    };
  }

  static isAppError(error: unknown): error is AppError {
    return error instanceof AppError;
  }
}

// Error handler factory functions
export const createErrorHandler = (context: ErrorContext) => {
  return (error: unknown): AppError => {
    // If it's already an AppError, just add context
    if (AppError.isAppError(error)) {
      return new AppError(
        error.type,
        error.message,
        error.userMessage,
        error.retryable,
        { ...error.context, ...context },
        error.originalError
      );
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // API-specific error mapping
    if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
      return new AppError(
        ErrorType.API_QUOTA_EXCEEDED,
        errorMessage,
        'API quota exceeded. Please try again in a few minutes.',
        true,
        context,
        error instanceof Error ? error : undefined
      );
    }

    if (errorMessage.includes('API key') || errorMessage.includes('permission')) {
      return new AppError(
        ErrorType.API_KEY_INVALID,
        errorMessage,
        'Invalid API key. Please check your configuration.',
        false,
        context,
        error instanceof Error ? error : undefined
      );
    }

    if (errorMessage.toLowerCase().includes('network') || errorMessage.includes('fetch')) {
      return new AppError(
        ErrorType.API_NETWORK_ERROR,
        errorMessage,
        'Network error. Please check your internet connection and try again.',
        true,
        context,
        error instanceof Error ? error : undefined
      );
    }

    if (errorMessage.includes('blocked') || errorMessage.includes('content policies')) {
      return new AppError(
        ErrorType.API_RESPONSE_BLOCKED,
        errorMessage,
        'AI response was blocked due to content policies. Please adjust your input and try again.',
        false,
        context,
        error instanceof Error ? error : undefined
      );
    }

    // Audio processing errors
    if (errorMessage.includes('file size') || errorMessage.includes('100MB')) {
      return new AppError(
        ErrorType.AUDIO_FILE_TOO_LARGE,
        errorMessage,
        'Audio file is too large. Please use a file under 100MB.',
        false,
        context,
        error instanceof Error ? error : undefined
      );
    }

    if (errorMessage.includes('audio format') || errorMessage.includes('WAV') || errorMessage.includes('MP3')) {
      return new AppError(
        ErrorType.AUDIO_FORMAT_INVALID,
        errorMessage,
        'Invalid audio format. Please use WAV or MP3 files only.',
        false,
        context,
        error instanceof Error ? error : undefined
      );
    }

    // JSON parsing errors
    if (errorMessage.includes('JSON') || errorMessage.includes('parse')) {
      return new AppError(
        ErrorType.INVALID_JSON_RESPONSE,
        errorMessage,
        'AI returned invalid response format. Please try again.',
        true,
        context,
        error instanceof Error ? error : undefined
      );
    }

    // Default unknown error
    return new AppError(
      ErrorType.UNKNOWN_ERROR,
      errorMessage,
      'An unexpected error occurred. Please try again.',
      true,
      context,
      error instanceof Error ? error : undefined
    );
  };
};
