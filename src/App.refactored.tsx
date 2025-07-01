// src/App.refactored.tsx

import React, { Suspense, lazy, useEffect } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { useAppState } from './hooks/useAppState';
import { LibraryModal } from './components/LibraryModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Card } from './components/Card';
import { LOCAL_STORAGE_KEY } from './constants/constants';

// Lazy load feature components for better performance
const TrackGuideFeature = lazy(() => 
  import('./features/trackGuide/components/TrackGuideFeature').then(module => ({
    default: module.TrackGuideFeature
  }))
);

const LandingPage = lazy(() => 
  import('./components/LandingPage').then(module => ({
    default: module.LandingPage
  }))
);

const AIAssistant = lazy(() => 
  import('./components/AIAssistant').then(module => ({
    default: module.AIAssistant
  }))
);

const EQGuide = lazy(() => 
  import('./components/EQGuide').then(module => ({
    default: module.EQGuide
  }))
);

const RemixGuideAI = lazy(() => 
  import('./components/RemixGuideAI').then(module => ({
    default: module.RemixGuideAI
  }))
);

const PatchGuide = lazy(() => 
  import('./components/PatchGuide').then(module => ({
    default: module.PatchGuide
  }))
);

const MidiGeneratorComponent = lazy(() => 
  import('./components/MidiGeneratorComponent').then(module => ({
    default: module.MidiGeneratorComponent
  }))
);

const MixFeedbackFeature = lazy(() => 
  import('./features/mixFeedback/components/MixFeedbackFeature').then(module => ({
    default: module.MixFeedbackFeature
  }))
);

// Loading component for Suspense fallback
const FeatureLoadingSkeleton: React.FC = () => (
  <Card className="animate-pulse">
    <div className="space-y-4">
      <div className="h-8 bg-gray-700 rounded w-1/3"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-700 rounded"></div>
        <div className="h-4 bg-gray-700 rounded w-5/6"></div>
        <div className="h-4 bg-gray-700 rounded w-4/6"></div>
      </div>
      <div className="h-10 bg-gray-700 rounded w-32"></div>
    </div>
  </Card>
);

export const App: React.FC = () => {
  const { state, actions } = useAppState();
  const [authPage, setAuthPage] = React.useState<string | null>(null);

  // Load library from localStorage on mount
  useEffect(() => {
    try {
      const savedLibrary = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedLibrary) {
        const library = JSON.parse(savedLibrary);
        if (Array.isArray(library)) {
          actions.setLibrary(library);
        }
      }
    } catch (error) {
      console.warn('Failed to load library from localStorage:', error);
    }
  }, [actions]);

  // Save library to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state.library));
    } catch (error) {
      console.warn('Failed to save library to localStorage:', error);
    }
  }, [state.library]);

  // Render the appropriate feature based on active view
  const renderActiveFeature = () => {
    if (authPage === 'login') {
      const LoginPage = require('./components/LoginPage').default;
      return <LoginPage />;
    }
    if (authPage === 'register') {
      const RegisterPage = require('./components/RegisterPage').default;
      return <RegisterPage />;
    }
    // Optionally handle guest logic here
    switch (state.activeView) {
      case 'landing':
        return (
          <Suspense fallback={<FeatureLoadingSkeleton />}>
            <LandingPage onNavigate={actions.setActiveView} />
          </Suspense>
        );
      case 'trackGuide':
        return (
          <Suspense fallback={<FeatureLoadingSkeleton />}>
            <TrackGuideFeature />
          </Suspense>
        );
      case 'mixFeedback':
        return (
          <Suspense fallback={<FeatureLoadingSkeleton />}>
            <MixFeedbackFeature />
          </Suspense>
        );
      case 'remixGuide':
        return (
          <Suspense fallback={<FeatureLoadingSkeleton />}>
            <RemixGuideAI />
          </Suspense>
        );
      case 'patchGuide':
        return (
          <Suspense fallback={<FeatureLoadingSkeleton />}>
            <PatchGuide />
          </Suspense>
        );
      case 'eqGuide':
        return (
          <Suspense fallback={<FeatureLoadingSkeleton />}>
            <EQGuide />
          </Suspense>
        );
      default:
        return (
          <Suspense fallback={<FeatureLoadingSkeleton />}>
            <LandingPage onNavigate={actions.setActiveView} />
          </Suspense>
        );
    }
  };

  return (
    <ErrorBoundary>
      <AppLayout onNavigateAuthPage={setAuthPage}>
        {renderActiveFeature()}

        {/* Global Modals */}
        {state.isLibraryModalOpen && (
          <LibraryModal
            library={state.library}
            onClose={() => actions.setLibraryModalOpen(false)}
            onSelect={(guidebook) => {
              actions.setCurrentGuidebook(guidebook);
              actions.setGeneratedContent(guidebook.content);
              actions.setActiveView('trackGuide');
              actions.setLibraryModalOpen(false);
            }}
            onDelete={(id) => {
              actions.removeFromLibrary(id);
            }}
          />
        )}

        {/* AI Assistant - can be opened from any view */}
        <Suspense fallback={null}>
          <AIAssistant
            isOpen={false}
            onClose={() => {}}
            currentGuidebook={state.currentGuidebook}
            userInputs={state.userInputs}
            activeView={state.activeView}
          />
        </Suspense>

        {/* MIDI Generator - can be opened from TrackGuide */}
        {state.activeView === 'trackGuide' && state.currentGuidebook && (
          <Suspense fallback={null}>
            <MidiGeneratorComponent
              guidebookContext={state.currentGuidebook.content}
              isVisible={true}
            />
          </Suspense>
        )}
      </AppLayout>
    </ErrorBoundary>
  );
};
