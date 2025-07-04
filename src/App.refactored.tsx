// src/App.refactored.tsx

import React, { Suspense, lazy, useEffect, useState } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { useAppState } from './hooks/useAppState';
import { LibraryModal } from './components/LibraryModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Card } from './components/Card';
import { LOCAL_STORAGE_KEY } from './constants/constants';
import { SavePromptModal } from './components/SavePromptModal';
import { Toast } from './components/Toast';

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
  const [authPage, setAuthPage] = useState<string | null>(null);
  const [isAIAssistantCollapsed, setAIAssistantCollapsed] = useState(true);
  // Save prompt/modal state
  const [showSavePrompt, setShowSavePrompt] = useState<null | { type: 'trackGuide' | 'mixFeedback' | 'mixCompare' | 'remixGuide' | 'patchGuide', data?: any }>(null);
  const [showToast, setShowToast] = useState<string | null>(null);

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

  // Save to Library handler for all features
  const handleSaveToLibrary = (type: 'trackGuide' | 'mixFeedback' | 'mixCompare' | 'remixGuide' | 'patchGuide', data?: any) => {
    setShowSavePrompt({ type, data });
  };

  // Actually save to library after prompt
  const handleSavePrompt = async (title: string, tags: string[]) => {
    if (!showSavePrompt) return;
    const { type, data } = showSavePrompt;
    // Compose entry for each type
    let entry: any = {};
    if (type === 'trackGuide' && state.currentGuidebook) {
      entry = {
        ...state.currentGuidebook,
        title,
        tags,
        id: state.currentGuidebook.id || Date.now().toString(),
        timestamp: Date.now(),
      };
    } else if ((type === 'mixFeedback' || type === 'mixCompare') && data) {
      entry = {
        ...data.inputs,
        content: data.content,
        title,
        tags,
        id: Date.now().toString(),
        timestamp: Date.now(),
        type,
      };
    } else if (type === 'remixGuide' && data) {
      entry = {
        ...data,
        title,
        tags,
        id: Date.now().toString(),
        timestamp: Date.now(),
        type,
      };
    } else if (type === 'patchGuide' && data) {
      entry = {
        ...data,
        title,
        tags,
        id: Date.now().toString(),
        timestamp: Date.now(),
        type,
      };
    }
    if (entry && entry.title) {
      actions.addToLibrary(entry);
      setShowToast('Saved to library!');
    }
    setShowSavePrompt(null);
  };

  // Render the appropriate feature based on active view
  const renderAppContent = () => {
    // Standalone pages (no app shell)
    if (authPage === 'login') {
      const LoginPage = require('./components/LoginPage').default;
      return <LoginPage />;
    }
    if (authPage === 'register') {
      const RegisterPage = require('./components/RegisterPage').default;
      return <RegisterPage />;
    }
    if (state.activeView === 'landing') {
      return (
        <Suspense fallback={<FeatureLoadingSkeleton />}>
          <LandingPage onGetStarted={() => actions.setActiveView('trackGuide')} />
        </Suspense>
      );
    }

    // Main app shell for all other views
    const handleNavigate = (view: string) => {
      if (view === 'login' || view === 'register') {
        setAuthPage(view);
      } else {
        setAuthPage(null);
        actions.setActiveView(view as any);
      }
    };
    return (
      <AppLayout onNavigate={handleNavigate}>
        {/* Feature view */}
        {(() => {
          switch (state.activeView) {
            case 'trackGuide':
              return (
                <Suspense fallback={<FeatureLoadingSkeleton />}>
                  <TrackGuideFeature onSaveToLibrary={() => handleSaveToLibrary('trackGuide')} />
                </Suspense>
              );
            case 'mixFeedback':
              return (
                <Suspense fallback={<FeatureLoadingSkeleton />}>
                  <MixFeedbackFeature onSaveToLibrary={(type, data) => handleSaveToLibrary(type, data)} />
                </Suspense>
              );
            case 'remixGuide':
              return (
                <Suspense fallback={<FeatureLoadingSkeleton />}>
                  <RemixGuideAI onSaveToLibrary={(data) => handleSaveToLibrary('remixGuide', data)} />
                </Suspense>
              );
            case 'patchGuide':
              return (
                <Suspense fallback={<FeatureLoadingSkeleton />}>
                  <PatchGuide onSaveToLibrary={(data) => handleSaveToLibrary('patchGuide', data)} />
                </Suspense>
              );
            case 'eqGuide':
              return (
                <Suspense fallback={<FeatureLoadingSkeleton />}>
                  <EQGuide />
                </Suspense>
              );
            default:
              return null;
          }
        })()}

        {/* Global Modals */}
        {state.isLibraryModalOpen && (
          <LibraryModal
            library={state.library}
            onClose={() => actions.setLibraryModalOpen(false)}
            onLoadEntry={(entry) => {
              actions.setCurrentGuidebook(entry);
              actions.setGeneratedContent(entry.content);
              actions.setActiveView('trackGuide');
              actions.setLibraryModalOpen(false);
            }}
            onDeleteEntry={(id) => {
              actions.removeFromLibrary(id);
            }}
            onCreateNew={() => {
              actions.setCurrentGuidebook(null);
              actions.setActiveView('trackGuide');
              actions.setLibraryModalOpen(false);
            }}
          />
        )}

        {/* Save Prompt Modal for all features */}
        <SavePromptModal
          isOpen={!!showSavePrompt}
          onClose={() => setShowSavePrompt(null)}
          onSave={handleSavePrompt}
          generationType={showSavePrompt?.type || 'trackGuide'}
        />
        {/* Toast Notification */}
        {showToast && (
          <Toast message={showToast} onClose={() => setShowToast(null)} />
        )}

        {/* AI Assistant - can be opened from any view */}
        <Suspense fallback={null}>
          <AIAssistant
            isCollapsed={isAIAssistantCollapsed}
            onToggleCollapse={() => setAIAssistantCollapsed((prev) => !prev)}
          />
        </Suspense>

        {/* MIDI Generator - can be opened from TrackGuide */}
        {state.activeView === 'trackGuide' && state.currentGuidebook && (
          <Suspense fallback={null}>
            <MidiGeneratorComponent
              currentGuidebookEntry={state.currentGuidebook}
            />
          </Suspense>
        )}
      </AppLayout>
    );
  };

  return renderAppContent();
};
