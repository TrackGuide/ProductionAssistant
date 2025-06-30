// src/features/trackGuide/components/TrackGuideResults.tsx

import React, { useState } from 'react';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { MarkdownRenderer } from '../../../components/MarkdownRenderer';
import { GuidebookEntry } from '../../../constants/types';
import { copyToClipboard } from '../../../utils/copyUtils';

interface TrackGuideResultsProps {
  guidebook: GuidebookEntry;
  generatedContent: string;
  onSaveToLibrary: () => void;
  className?: string;
}

export const TrackGuideResults: React.FC<TrackGuideResultsProps> = ({
  guidebook,
  generatedContent,
  onSaveToLibrary,
  className = ''
}) => {
  const [copyStatus, setCopyStatus] = useState<string>('');

  const handleCopy = async () => {
    try {
      const result = await copyToClipboard(generatedContent);
      setCopyStatus(result.message);
      setTimeout(() => setCopyStatus(''), 3000);
    } catch (error) {
      setCopyStatus('Failed to copy');
      setTimeout(() => setCopyStatus(''), 3000);
    }
  };

  const renderMetadata = () => {
    const metadata = [
      { label: 'Genre', value: guidebook.genre?.join(', ') },
      { label: 'Vibe', value: guidebook.vibe?.join(', ') },
      { label: 'DAW', value: guidebook.daw },
      { label: 'Key', value: guidebook.key },
      { label: 'Scale', value: guidebook.scale },
      { label: 'Artist Reference', value: guidebook.artistReference },
      { label: 'Reference Track', value: guidebook.referenceTrackLink },
      { label: 'Plugins', value: guidebook.plugins },
      { label: 'Available Instruments', value: guidebook.availableInstruments }
    ].filter(item => item.value && item.value.trim() !== '');

    if (metadata.length === 0) return null;

    return (
      <div className="mb-6 p-4 bg-gray-800/50 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-3">Track Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {metadata.map((item, index) => (
            <div key={index} className="flex flex-col sm:flex-row sm:items-center">
              <span className="text-sm font-medium text-gray-400 sm:w-32 mb-1 sm:mb-0">
                {item.label}:
              </span>
              <span className="text-sm text-gray-200 break-words">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {guidebook.title || 'Track Guide'}
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Generated on {new Date(guidebook.createdAt).toLocaleDateString()}
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button
            onClick={handleCopy}
            variant="secondary"
            size="sm"
            className="min-w-20"
          >
            {copyStatus || 'Copy'}
          </Button>
          <Button
            onClick={onSaveToLibrary}
            variant="primary"
            size="sm"
            className="bg-green-600 hover:bg-green-700"
          >
            Save to Library
          </Button>
        </div>
      </div>

      {/* Metadata */}
      {renderMetadata()}

      {/* Lyrics Section */}
      {guidebook.lyrics && (
        <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-300 mb-3">Lyrics/Vocal Ideas</h3>
          <div className="text-gray-200 whitespace-pre-wrap">
            {guidebook.lyrics}
          </div>
        </div>
      )}

      {/* Additional Notes */}
      {guidebook.generalNotes && (
        <div className="p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
          <h3 className="text-lg font-semibold text-purple-300 mb-3">Additional Notes</h3>
          <div className="text-gray-200 whitespace-pre-wrap">
            {guidebook.generalNotes}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="prose prose-invert max-w-none">
        <MarkdownRenderer content={generatedContent} />
      </div>

      {/* Footer Actions */}
      <div className="flex justify-center pt-6 border-t border-gray-700">
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-400">
            Use this guide as a starting point for your production
          </p>
          <Button
            onClick={onSaveToLibrary}
            variant="primary"
            className="bg-green-600 hover:bg-green-700"
          >
            Save to Library for Future Reference
          </Button>
        </div>
      </div>
    </Card>
  );
};
