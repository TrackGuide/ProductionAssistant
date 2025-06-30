// src/core/services/APIRetryService.ts

import { AppError, ErrorType, createErrorHandler } from '../errors/AppError';

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitterMax: number;
}

export class APIRetryService {
  private static readonly DEFAULT_CONFIG: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 30000, // 30 seconds
    backoffMultiplier: 2,
    jitterMax: 1000 // Random delay up to 1 second
  };

  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: { component?: string; service?: string; operation?: string } = {},
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    const errorHandler = createErrorHandler(context);
    let lastError: AppError;

    for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
      try {
        // Add attempt info to logs for debugging
        if (attempt > 0) {
          console.log(`Retry attempt ${attempt}/${finalConfig.maxRetries} for ${context.operation || 'operation'}`);
        }

        const result = await operation();
        
        // Log successful retry
        if (attempt > 0) {
          console.log(`Operation succeeded on attempt ${attempt + 1}`);
        }
        
        return result;
      } catch (error) {
        lastError = errorHandler(error);
        
        // Log the error
        console.error(`Attempt ${attempt + 1} failed:`, {
          error: lastError.toJSON(),
          context
        });
        
        // Don't retry if:
        // 1. It's the last attempt
        // 2. Error is not retryable
        // 3. It's a validation error (user input issue)
        if (
          attempt === finalConfig.maxRetries ||
          !lastError.retryable ||
          lastError.type === ErrorType.API_KEY_INVALID ||
          lastError.type === ErrorType.VALIDATION_FAILED ||
          lastError.type === ErrorType.REQUIRED_FIELD_MISSING
        ) {
          throw lastError;
        }
        
        // Calculate delay with exponential backoff and jitter
        const exponentialDelay = Math.min(
          finalConfig.baseDelay * Math.pow(finalConfig.backoffMultiplier, attempt),
          finalConfig.maxDelay
        );
        
        const jitter = Math.random() * finalConfig.jitterMax;
        const totalDelay = exponentialDelay + jitter;
        
        console.log(`Waiting ${Math.round(totalDelay)}ms before retry...`);
        await this.delay(totalDelay);
      }
    }
    
    throw lastError!;
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Specialized retry for streaming operations
  static async executeStreamWithRetry<T>(
    streamOperation: () => AsyncIterable<T>,
    context: { component?: string; service?: string; operation?: string } = {},
    config: Partial<RetryConfig> = {}
  ): Promise<T[]> {
    return this.executeWithRetry(async () => {
      const results: T[] = [];
      
      try {
        for await (const chunk of streamOperation()) {
          results.push(chunk);
        }
        return results;
      } catch (error) {
        // If streaming fails partway through, we still throw to trigger retry
        throw error;
      }
    }, context, config);
  }

  // Rate limiting helper
  private static rateLimiters = new Map<string, { lastCall: number; callCount: number }>();

  static async withRateLimit<T>(
    operation: () => Promise<T>,
    key: string,
    maxCallsPerMinute: number = 60
  ): Promise<T> {
    const now = Date.now();
    const limiter = this.rateLimiters.get(key) || { lastCall: 0, callCount: 0 };
    
    // Reset counter if more than a minute has passed
    if (now - limiter.lastCall > 60000) {
      limiter.callCount = 0;
    }
    
    // Check if we're over the limit
    if (limiter.callCount >= maxCallsPerMinute) {
      const waitTime = 60000 - (now - limiter.lastCall);
      if (waitTime > 0) {
        console.log(`Rate limit reached for ${key}. Waiting ${Math.round(waitTime)}ms...`);
        await this.delay(waitTime);
      }
      limiter.callCount = 0;
    }
    
    // Update limiter
    limiter.lastCall = now;
    limiter.callCount++;
    this.rateLimiters.set(key, limiter);
    
    return operation();
  }
}
