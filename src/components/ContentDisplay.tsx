import React from 'react';
import { Button } from './Button';
import { SaveIcon } from './icons';

interface ContentDisplayProps {
  content: string;
  onCopy: (elementId: string) => void;
  copyStatus: string;
  canSave: boolean;
  onSave: () => void;
  renderMarkdown: (content: string, isMixFeedback?: boolean) => React.ReactNode[];
  elementId?: string;
}

export const ContentDisplay: React.FC<ContentDisplayProps> = ({
  content,
  onCopy,
  copyStatus,
  canSave,
  onSave,
  renderMarkdown,
  elementId = 'guidebook-content'
}) => {
  return (
    <>
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-gray-700">
        <Button
          size="sm"
          onClick={() => onCopy(elementId)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-xs"
        >
          📋 Copy Content
        </Button>
        
        {canSave && (
          <Button
            size="sm"
            onClick={onSave}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 text-xs"
            leftIcon={<SaveIcon className="w-3 h-3" />}
          >
            Save to Library
          </Button>
        )}
        
        {copyStatus && (
          <span className="text-green-400 text-xs flex items-center px-2">
            {copyStatus}
          </span>
        )}
      </div>

      {/* Content */}
      <div 
        id={elementId}
        className="prose prose-invert max-w-none"
      >
        {renderMarkdown(content)}
      </div>
    </>
  );
};