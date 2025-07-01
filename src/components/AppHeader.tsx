import React from 'react';
import { APP_TITLE } from '../constants/constants';

interface AppHeaderProps {
  onBackToLanding: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onBackToLanding }) => {
  return (
    <header className="text-center mb-6 relative z-10">
      <div className="flex items-center justify-center space-x-3 mb-4">
        <div className="w-8 h-8 bg-orange-500 transform rotate-45 flex items-center justify-center">
          <div className="w-4 h-4 bg-white transform -rotate-45"></div>
        </div>
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            {APP_TITLE}
          </h1>
          <p className="text-gray-400 text-lg">Your Smartest Studio Assistant</p>
        </div>
      </div>
      <button
        onClick={onBackToLanding}
        className="mt-2 text-sm text-orange-500 hover:text-orange-400 transition-colors font-medium"
      >
        ← Back to Landing
      </button>
    </header>
  );
};