import React, { useState } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { Card } from './Card';
import { CloseIcon, CloudIcon } from './icons';

interface SavePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, tags: string[]) => Promise<void>;
  generationType: 'trackGuide' | 'mixFeedback' | 'mixCompare' | 'remixGuide' | 'patchGuide';
}

export const SavePromptModal: React.FC<SavePromptModalProps> = ({
  isOpen,
  onClose,
  onSave,
  generationType
}) => {
  const [title, setTitle] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getGenerationTypeLabel = () => {
    switch (generationType) {
      case 'trackGuide': return 'TrackGuide';
      case 'mixFeedback': return 'Mix Feedback';
      case 'mixCompare': return 'Mix Comparison';
      case 'remixGuide': return 'RemixGuide';
      case 'patchGuide': return 'PatchGuide';
      default: return 'Generation';
    }
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags(prev => [...prev, trimmedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    
    setIsLoading(true);
    try {
      await onSave(title.trim(), tags);
      // Reset form
      setTitle('');
      setTags([]);
      setTagInput('');
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md">
        <Card className="bg-gray-800/95 backdrop-blur-md shadow-2xl border border-gray-700/50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <CloudIcon className="w-5 h-5 text-orange-500" />
              <h2 className="text-xl font-semibold text-white">
                Save {getGenerationTypeLabel()}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              disabled={isLoading}
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <Input
                label="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`Enter a title for your ${getGenerationTypeLabel().toLowerCase()}`}
                disabled={isLoading}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tags (optional)
              </label>
              <div className="flex space-x-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="Add tags..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleAddTag}
                  variant="secondary"
                  size="sm"
                  disabled={!tagInput.trim() || isLoading}
                >
                  Add
                </Button>
              </div>
              
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 bg-orange-600/20 text-orange-300 text-xs rounded-full"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 text-orange-400 hover:text-orange-200"
                        disabled={isLoading}
                      >
                        <CloseIcon className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex space-x-3 mt-6">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={!title.trim() || isLoading}
              className="flex-1"
              leftIcon={isLoading ? undefined : <CloudIcon className="w-4 h-4" />}
            >
              {isLoading ? 'Saving...' : 'Save to Cloud'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};