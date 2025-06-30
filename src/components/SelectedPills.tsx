import React from 'react';

interface SelectedPillsProps {
  selections: string[];
  onRemove: (value: string) => void;
}

export const SelectedPills: React.FC<SelectedPillsProps> = ({ selections, onRemove }) => (
  <div className="flex flex-wrap gap-2 mt-2 mb-2 min-h-[2.25rem]">
    {selections.map(selection => (
      <span key={selection} className="flex items-center px-3 py-1 bg-orange-600 text-white text-xs font-medium rounded-full shadow-md hover:bg-orange-700 transition-colors">
        {selection}
        <button 
          type="button" 
          onClick={() => onRemove(selection)}
          className="ml-1.5 -mr-0.5 p-0.5 text-orange-200 hover:text-white rounded-full focus:outline-none focus:bg-orange-800 transition-colors"
          aria-label={`Remove ${selection}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </span>
    ))}
  </div>
);