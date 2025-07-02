// src/components/layout/Navigation.tsx

import React from 'react';
import { useAppState } from '../../hooks/useAppState';
import { ActiveView } from '../../constants/types';
import { Button } from '../Button';

const TrackGuideLogo = ({ className = "w-6 h-6" }: { className?: string }) => (
  <div className={`${className} bg-orange-500 transform rotate-45 flex items-center justify-center`}>
    <div className="w-1/2 h-1/2 bg-white transform -rotate-45"></div>
  </div>
);

interface NavigationItem {
  id: ActiveView;
  label: string;
  icon: string;
}

const navigationItems: NavigationItem[] = [
  { id: 'landing', label: 'Home', icon: '🏠' },
  { id: 'trackGuide', label: 'Track Guide', icon: '🎵' },
  { id: 'mixFeedback', label: 'Mix Feedback', icon: '🎚️' },
  { id: 'remixGuide', label: 'Remix Guide', icon: '🔄' },
  { id: 'patchGuide', label: 'Patch Guide', icon: '🎛️' },
  { id: 'eqGuide', label: 'EQ Guide', icon: '📊' },
  { id: 'songFramework', label: 'Song Framework', icon: '🎼' },
];

export const Navigation: React.FC = () => {
  const { state, actions } = useAppState();

  const handleViewChange = (view: ActiveView) => {
    actions.setActiveView(view);
  };

  return (
    <nav className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <TrackGuideLogo className="w-8 h-8" />
            <h1 className="text-xl font-bold text-white">
              ProductionAssistant
            </h1>
          </div>

          {/* Navigation Items */}
          <div className="hidden md:flex space-x-1">
            {navigationItems.map((item) => (
              <Button
                key={item.id}
                onClick={() => handleViewChange(item.id)}
                variant={state.activeView === item.id ? 'primary' : 'secondary'}
                size="sm"
                className={`
                  flex items-center space-x-2 transition-all duration-200
                  ${state.activeView === item.id 
                    ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                    : 'bg-transparent hover:bg-gray-700 text-gray-300'
                  }
                `}
              >
                <span className="text-sm">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </Button>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="secondary"
              size="sm"
              className="bg-transparent hover:bg-gray-700"
            >
              <span className="text-lg">☰</span>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-4">
          <div className="grid grid-cols-2 gap-2">
            {navigationItems.map((item) => (
              <Button
                key={item.id}
                onClick={() => handleViewChange(item.id)}
                variant={state.activeView === item.id ? 'primary' : 'secondary'}
                size="sm"
                className={`
                  flex items-center justify-center space-x-2 transition-all duration-200
                  ${state.activeView === item.id 
                    ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                    : 'bg-transparent hover:bg-gray-700 text-gray-300'
                  }
                `}
              >
                <span className="text-sm">{item.icon}</span>
                <span className="text-xs font-medium">{item.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};
