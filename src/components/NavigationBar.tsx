import React from 'react';
import { ActiveView } from '../types/appTypes';
import { Button } from './Button';
import { AdjustmentsHorizontalIcon } from './icons';

// Custom TrackGuide Logo Component
const TrackGuideLogo = ({ className = "w-4 h-4" }: { className?: string }) => (
  <div className={`${className} bg-orange-500 transform rotate-45 flex items-center justify-center`}>
    <div className="w-1/2 h-1/2 bg-white transform -rotate-45"></div>
  </div>
);

interface NavigationBarProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
}

export const NavigationBar: React.FC<NavigationBarProps> = ({ 
  activeView, 
  onViewChange 
}) => {
  const navItems = [
    {
      id: 'trackGuide' as ActiveView,
      label: 'TrackGuide AI',
      icon: <TrackGuideLogo className="w-4 h-4" />
    },
    {
      id: 'mixFeedback' as ActiveView,
      label: 'Mix Feedback AI',
      icon: <span className="w-4 h-4 text-center">🎚️</span>
    },
    {
      id: 'remixGuide' as ActiveView,
      label: 'RemixGuide AI',
      icon: <span className="w-4 h-4 text-center">🎛️</span>
    },
    {
      id: 'patchGuide' as ActiveView,
      label: 'PatchGuide AI',
      icon: <span className="w-4 h-4 text-center">🎹</span>
    },
    {
      id: 'eqGuide' as ActiveView,
      label: 'EQ Guide',
      icon: <AdjustmentsHorizontalIcon className="w-4 h-4" />
    }
  ];

  return (
    <nav className="mb-8 flex flex-col justify-center items-center md:flex-row md:justify-center gap-2 border-b border-orange-500/20 pb-3 relative z-10">
      {navItems.map((item) => (
        <Button
          key={item.id}
          size="sm"
          className={`w-full md:w-auto px-3 py-2 text-xs md:text-sm rounded-md transition-all duration-150 ease-in-out ${
            activeView === item.id
              ? 'bg-orange-500 shadow-lg hover:bg-orange-600'
              : 'bg-gray-700/80 hover:bg-gray-600/80 border border-gray-600'
          }`}
          onClick={() => onViewChange(item.id)}
          variant={activeView === item.id ? 'primary' : 'secondary'}
          leftIcon={item.icon}
        >
          {item.label}
        </Button>
      ))}
    </nav>
  );
};