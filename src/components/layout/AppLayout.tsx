// src/components/layout/AppLayout.tsx

import React from 'react';
import { AppStateProvider } from '../../hooks/useAppState';
import { Navigation } from './Navigation';
import { ErrorBoundary } from '../ErrorBoundary';



interface AppLayoutProps {
  children: React.ReactNode;
  onNavigateAuthPage?: (page: string) => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, onNavigateAuthPage }) => {
  return (
    <AppStateProvider>
      <ErrorBoundary>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
          <Navigation onNavigateAuthPage={onNavigateAuthPage} />
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
        </div>
      </ErrorBoundary>
    </AppStateProvider>
  );
};
  return (
    <AppStateProvider>
      <ErrorBoundary>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
          <Navigation onNavigateAuthPage={props.onNavigateAuthPage} />
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
        </div>
      </ErrorBoundary>
    </AppStateProvider>
  );
};
