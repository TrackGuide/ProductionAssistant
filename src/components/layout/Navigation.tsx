// src/components/layout/Navigation.tsx

import React, { useState } from 'react';
import { useUser } from '../../context/UserContext';
import { useAppState } from '../../hooks/useAppState';
import { ActiveView } from '../../constants/types';
import { Button } from '../Button';
// Use a simple SVG for the user icon to avoid extra dependencies
const UserIcon = () => (
  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="8" r="4" strokeWidth="2"/><path strokeWidth="2" d="M4 20c0-2.5 3.5-4 8-4s8 1.5 8 4"/></svg>
);
// User/account icon button
const UserMenu: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { user, isGuest, logout } = useUser();
  const [open, setOpen] = useState(false);
  return (
    <div className="relative ml-4">
      <button
        className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 text-white focus:outline-none"
        onClick={() => setOpen((v) => !v)}
        aria-label="User menu"
      >
        <UserIcon />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded shadow-lg z-50">
          <div className="px-4 py-2 border-b text-gray-700 font-semibold">
            {user ? `Hi, ${user.username}` : isGuest ? 'Guest' : 'Not logged in'}
          </div>
          {!user && !isGuest && (
            <>
              <button className="w-full text-left px-4 py-2 hover:bg-gray-100" onClick={() => { setOpen(false); onNavigate('login'); }}>Login</button>
              <button className="w-full text-left px-4 py-2 hover:bg-gray-100" onClick={() => { setOpen(false); onNavigate('register'); }}>Register</button>
              <button className="w-full text-left px-4 py-2 hover:bg-gray-100" onClick={() => { setOpen(false); onNavigate('guest'); }}>Continue as Guest</button>
            </>
          )}
          {user && (
            <button className="w-full text-left px-4 py-2 hover:bg-gray-100" onClick={() => { setOpen(false); logout(); }}>Logout</button>
          )}
        </div>
      )}
    </div>
  );
};
// ...existing code...

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
  { id: 'trackGuide', label: 'TrackGuide', icon: '🎵' },
  { id: 'mixFeedback', label: 'MixFeedback', icon: '🎚️' },
  { id: 'remixGuide', label: 'RemixGuide', icon: '🔄' },
  { id: 'patchGuide', label: 'PatchGuide', icon: '🎛️' },
  { id: 'eqGuide', label: 'EQGuide', icon: '📊' },
];
export const Navigation: React.FC<{ onNavigate: (view: string) => void }> = ({ onNavigate }) => {
  const { state } = useAppState();

  return (
    <nav className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center py-4">
          {/* Logo and Title Centered */}
          <div className="flex flex-col items-center mb-2">
            <div className="flex items-center space-x-3">
              <TrackGuideLogo className="w-8 h-8" />
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                ProductionAssistant
              </h1>
            </div>
            <p className="text-gray-400 text-base mt-1">Your Smartest Studio Assistant</p>
          </div>
          {/* Navigation Items Row */}
          <div className="flex flex-wrap justify-center gap-2 mt-2">
            {navigationItems.map((item) => (
              <Button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                variant={state.activeView === item.id ? 'primary' : 'secondary'}
                size="sm"
                className={`
                  flex items-center space-x-2 transition-all duration-200
                  border-2
                  ${state.activeView === item.id 
                    ? 'bg-orange-500 border-orange-400 shadow-lg text-white' 
                    : 'bg-gray-900 border-transparent hover:bg-gray-700 text-gray-300'
                  }
                `}
              >
                <span className="text-sm">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </Button>
            ))}
            <UserMenu onNavigate={onNavigate} />
          </div>
        </div>
      </div>
    </nav>
  );
}
