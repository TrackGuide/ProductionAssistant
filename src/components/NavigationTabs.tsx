import React from 'react';
import { Button } from './Button';
import { AdjustmentsHorizontalIcon } from './icons';
import { ActiveView } from '../types/appTypes';
import { TrackGuideLogo } from './TrackGuideLogo';

interface NavigationTabsProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({ activeView, onViewChange }) => {
  return (
    <nav className="mb-8 flex flex-col justify-center items-center md:flex-row md:justify-center gap-2 border-b border-orange-500/20 pb-3 relative z-10">
      <Button
        size="sm"
        className={`w-full md:w-auto px-3 py-2 text-xs md:text-sm rounded-md transition-all duration-150 ease-in-out ${
          activeView === 'trackGuide'
            ? 'bg-orange-500 shadow-lg hover:bg-orange-600'
            : 'bg-gray-700/80 hover:bg-gray-600/80 border border-gray-600'
        }`}
        onClick={() => onViewChange('trackGuide')}
        variant={activeView === 'trackGuide' ? 'primary' : 'secondary'}
        leftIcon={<TrackGuideLogo className="w-4 h-4" />}
      >
        TrackGuide AI
      </Button>

      <Button
        size="sm"
        className={`w-full md:w-auto px-3 py-2 text-xs md:text-sm rounded-md transition-all duration-150 ease-in-out ${
          activeView === 'mixFeedback'
            ? 'bg-orange-500 shadow-lg hover:bg-orange-600'
            : 'bg-gray-700/80 hover:bg-gray-600/80 border border-gray-600'
        }`}
        onClick={() => onViewChange('mixFeedback')}
        variant={activeView === 'mixFeedback' ? 'primary' : 'secondary'}
        leftIcon={<span className="w-4 h-4 text-center">🎚️</span>}
      >
        Mix Feedback AI
      </Button>

      <Button
        size="sm"
        className={`w-full md:w-auto px-3 py-2 text-xs md:text-sm rounded-md transition-all duration-150 ease-in-out ${
          activeView === 'remixGuide'
            ? 'bg-orange-500 shadow-lg hover:bg-orange-600'
            : 'bg-gray-700/80 hover:bg-gray-600/80 border border-gray-600'
        }`}
        onClick={() => onViewChange('remixGuide')}
        variant={activeView === 'remixGuide' ? 'primary' : 'secondary'}
        leftIcon={<span className="w-4 h-4 text-center">🎛️</span>}
      >
        RemixGuide AI
      </Button>

      <Button
        size="sm"
        className={`w-full md:w-auto px-3 py-2 text-xs md:text-sm rounded-md transition-all duration-150 ease-in-out ${
          activeView === 'patchGuide'
            ? 'bg-orange-500 shadow-lg hover:bg-orange-600'
            : 'bg-gray-700/80 hover:bg-gray-600/80 border border-gray-600'
        }`}
        onClick={() => onViewChange('patchGuide')}
        variant={activeView === 'patchGuide' ? 'primary' : 'secondary'}
        leftIcon={<span className="w-4 h-4 text-center">🎹</span>}
      >
        PatchGuide AI
      </Button>

      <Button
        size="sm"
        className={`w-full md:w-auto px-3 py-2 text-xs md:text-sm rounded-md transition-all duration-150 ease-in-out ${
          activeView === 'eqGuide'
            ? 'bg-orange-500 shadow-lg hover:bg-orange-600'
            : 'bg-gray-700/80 hover:bg-gray-600/80 border border-gray-600'
        }`}
        onClick={() => onViewChange('eqGuide')}
        variant={activeView === 'eqGuide' ? 'primary' : 'secondary'}
        leftIcon={<AdjustmentsHorizontalIcon className="w-4 h-4" />}
      >
        EQ Guide
      </Button>
    </nav>
  );
};