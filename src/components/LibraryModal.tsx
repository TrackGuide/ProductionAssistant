
import React, { useState } from 'react';
import { GuidebookEntry } from '../constants/types';
import { Button } from './Button';
import { Input } from './Input';
import { Card } from './Card';
import { BookOpenIcon, TrashIcon, CloseIcon, PlusIcon, MusicNoteIcon } from './icons';

interface LibraryModalProps {
  library: GuidebookEntry[];
  onClose: () => void;
  onLoadEntry: (entry: GuidebookEntry) => void;
  onDeleteEntry: (id: string) => void;
  onCreateNew: () => void;
}

export const LibraryModal: React.FC<LibraryModalProps> = ({ 
  library, 
  onClose, 
  onLoadEntry, 
  onDeleteEntry, 
  onCreateNew 
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLibrary = library.filter(entry => 
    entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.genre.join(', ').toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div 
      className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-in-out"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="library-modal-title"
    >
      <Card 
        className="w-full max-w-2xl bg-gray-800 shadow-2xl border border-gray-700 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()} // Prevent click inside from closing modal
      >
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-700">
          <h2 id="library-modal-title" className="text-2xl font-semibold text-purple-300 flex items-center">
            <BookOpenIcon className="w-7 h-7 mr-3 text-purple-400" />
            TrackGuide Library
          </h2>
          <Button onClick={onClose} variant="secondary" size="sm" className="p-2 -mr-2" aria-label="Close Library">
            <CloseIcon className="w-5 h-5" />
          </Button>
        </div>

        <div className="px-6 py-4">
          <Input 
            type="search"
            placeholder="Search by title or genre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4 bg-gray-700 border-gray-600 placeholder-gray-500"
            aria-label="Search library"
          />
        </div>

        <div className="flex-grow overflow-y-auto px-6 pb-6 space-y-3 custom-scrollbar pr-3">
          {filteredLibrary.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              {searchTerm ? `No entries found for "${searchTerm}".` : "Your library is empty. Create some TrackGuides!"}
            </p>
          ) : (
            filteredLibrary.map(entry => (
              <div key={entry.id} className="p-4 bg-gray-700/60 rounded-lg hover:bg-gray-600/50 transition-colors shadow-md border border-gray-600/50">
                <div className="flex justify-between items-start">
                  <div className="flex-grow min-w-0">
                    <h4 className="font-semibold text-purple-300 truncate text-lg" title={entry.title}>{entry.title}</h4>
                    <p className="text-sm text-gray-400 truncate" title={Array.isArray(entry.genre) ? entry.genre.join(', ') : entry.genre}>
                      {Array.isArray(entry.genre) ? entry.genre.join(', ') : entry.genre}
                    </p>
                    <p className="text-xs text-gray-500">
                      Created: {new Date(entry.createdAt).toLocaleDateString()}
                      {entry.generatedMidiPatterns && <MusicNoteIcon className="w-3 h-3 text-green-400 inline-block ml-2" title="MIDI available" />}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 items-end shrink-0 ml-3 mt-1 sm:mt-0">
                     <Button onClick={() => onLoadEntry(entry)} size="sm" variant="outline" className="text-xs px-3 py-1.5 w-full sm:w-auto" leftIcon={<BookOpenIcon className="w-4 h-4"/>}>Load</Button>
                     <Button onClick={() => onDeleteEntry(entry.id)} size="sm" variant="danger" className="text-xs px-3 py-1.5 w-full sm:w-auto" leftIcon={<TrashIcon className="w-4 h-4"/>} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-700">
            <Button onClick={onCreateNew} variant="primary" className="w-full" leftIcon={<PlusIcon />}>
                Create New TrackGuide
            </Button>
        </div>
      </Card>
    </div>
  );
};
