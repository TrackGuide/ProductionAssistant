import React, { Component } from 'react';
import ReactDOM from 'react-dom/client';
// Debug: log when index.tsx executes
console.log('src/index.tsx loaded');

import App from '../App.tsx';

// Error boundary to catch runtime errors in App
class ErrorBoundary extends Component<{ children?: React.ReactNode }, { error: Error | null }> {
  constructor(props: {}) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: any) {
    console.error('ErrorBoundary caught:', error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ color: 'red', padding: '1rem', fontFamily: 'monospace' }}>
          <h2>Runtime Error in App:</h2>
          <pre>{this.state.error.message}</pre>
          <pre>{this.state.error.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
