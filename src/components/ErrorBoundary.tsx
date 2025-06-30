// src/components/ErrorBoundary.tsx

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AppError, ErrorType } from '../core/errors/AppError';
import { Button } from './Button';
import { Card } from './Card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error to external service (implement as needed)
    this.logErrorToService(error, errorInfo);
  }

  private logErrorToService(error: Error, errorInfo: ErrorInfo) {
    // Implement your error logging service here
    // For example: Sentry, LogRocket, etc.
    console.error('Logging error to service:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    });
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error } = this.state;
      const isAppError = AppError.isAppError(error);
      const errorMessage = isAppError ? error.userMessage : error?.message || 'An unexpected error occurred';
      const isRetryable = isAppError ? error.retryable : true;

      return (
        <Card className="border-red-500 bg-red-900/20 max-w-2xl mx-auto mt-8">
          <div className="text-center space-y-4">
            <div className="text-red-400 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-red-300">Something went wrong</h2>
            <p className="text-red-200">{errorMessage}</p>
            
            {process.env.NODE_ENV === 'development' && error && (
              <details className="mt-4 p-4 bg-red-950/50 rounded-lg text-left">
                <summary className="cursor-pointer text-red-300 font-semibold mb-2">
                  Technical Details (Development Mode)
                </summary>
                <div className="text-xs text-red-200 font-mono">
                  <div className="mb-2">
                    <strong>Error:</strong> {error.message}
                  </div>
                  {error.stack && (
                    <div className="mb-2">
                      <strong>Stack:</strong>
                      <pre className="whitespace-pre-wrap text-xs mt-1">
                        {error.stack}
                      </pre>
                    </div>
                  )}
                  {this.state.errorInfo?.componentStack && (
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="whitespace-pre-wrap text-xs mt-1">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                  {isAppError && (
                    <div className="mt-2">
                      <strong>Error Type:</strong> {error.type}<br/>
                      <strong>Retryable:</strong> {error.retryable ? 'Yes' : 'No'}<br/>
                      <strong>Context:</strong> {JSON.stringify(error.context, null, 2)}
                    </div>
                  )}
                </div>
              </details>
            )}

            <div className="flex justify-center space-x-4">
              {isRetryable && (
                <Button 
                  onClick={this.handleRetry}
                  variant="primary"
                  className="bg-red-600 hover:bg-red-700"
                >
                  Try Again
                </Button>
              )}
              <Button 
                onClick={this.handleReload}
                variant="secondary"
              >
                Reload Page
              </Button>
            </div>

            <div className="text-xs text-gray-400 mt-4">
              If this problem persists, please refresh the page or contact support.
            </div>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

// Specialized error boundaries for different parts of the app
export const TrackGuideErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary 
    fallback={
      <Card className="border-red-500 bg-red-900/20">
        <div className="text-center p-8">
          <div className="text-red-400 text-4xl mb-4">🎵</div>
          <h3 className="text-lg font-semibold text-red-300 mb-2">
            TrackGuide Error
          </h3>
          <p className="text-red-200 mb-4">
            There was an error generating or displaying your track guide.
          </p>
          <Button 
            onClick={() => window.location.reload()} 
            variant="primary"
            className="bg-red-600 hover:bg-red-700"
          >
            Reload and Try Again
          </Button>
        </div>
      </Card>
    }
  >
    {children}
  </ErrorBoundary>
);

export const MidiGeneratorErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary 
    fallback={
      <Card className="border-red-500 bg-red-900/20">
        <div className="text-center p-8">
          <div className="text-red-400 text-4xl mb-4">🎹</div>
          <h3 className="text-lg font-semibold text-red-300 mb-2">
            MIDI Generator Error
          </h3>
          <p className="text-red-200 mb-4">
            There was an error generating or playing MIDI patterns.
          </p>
          <Button 
            onClick={() => window.location.reload()} 
            variant="primary"
            className="bg-red-600 hover:bg-red-700"
          >
            Reload and Try Again
          </Button>
        </div>
      </Card>
    }
  >
    {children}
  </ErrorBoundary>
);

export const AudioErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary 
    fallback={
      <Card className="border-red-500 bg-red-900/20">
        <div className="text-center p-8">
          <div className="text-red-400 text-4xl mb-4">🔊</div>
          <h3 className="text-lg font-semibold text-red-300 mb-2">
            Audio Processing Error
          </h3>
          <p className="text-red-200 mb-4">
            There was an error processing audio. Please check your audio file and try again.
          </p>
          <Button 
            onClick={() => window.location.reload()} 
            variant="primary"
            className="bg-red-600 hover:bg-red-700"
          >
            Reload and Try Again
          </Button>
        </div>
      </Card>
    }
  >
    {children}
  </ErrorBoundary>
);
