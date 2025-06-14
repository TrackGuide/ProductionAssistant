import React, { useState } from 'react';
import { Button } from './Button';

interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface TabSystemProps {
  tabs: Tab[];
  defaultTab?: string;
  onTabChange?: (tabId: string) => void;
}

export const TabSystem: React.FC<TabSystemProps> = ({ tabs, defaultTab, onTabChange }) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (onTabChange) {
      onTabChange(tabId);
    }
  };

  const activeTabContent = tabs.find(tab => tab.id === activeTab)?.content;

  return (
    <div className="w-full">
      {/* Tab Headers */}
      <div className="flex gap-2 justify-center mb-8">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`px-6 py-3 rounded-full font-medium text-sm transition-all duration-300 ${
              activeTab === tab.id
                ? 'bg-purple-600 text-white neon-glow'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTabContent}
      </div>
    </div>
  );
};