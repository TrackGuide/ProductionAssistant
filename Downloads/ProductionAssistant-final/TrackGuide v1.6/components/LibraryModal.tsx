
import React, { useState } from 'react';
import { GuidebookEntry } from '../types';
import { Button } from './Button';
import { Input } from './Input';
import { Card } from './Card';
import { BookOpenIcon, TrashIcon, CloseIcon, PlusIcon, MusicNoteIcon, PencilSquareIcon } from './icons';

interface LibraryModalProps {
  library: GuidebookEntry[];
  onClose: () => void;
  onLoadEntry: (entry: GuidebookEntry) => void;
  onDeleteEntry: (id: string) => void;
  onCreateNew: () => void;
  onEditEntry?: (entry: GuidebookEntry) => void;
}

export const LibraryModal: React.FC<LibraryModalProps> = ({ 
  library, 
  onClose, 
  onLoadEntry, 
  onDeleteEntry, 
  onCreateNew,
  onEditEntry
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'genre' | 'artist' | 'vibe'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'genre'>('date');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filteredLibrary = library.filter(entry => {
    const searchLower = searchTerm.toLowerCase();
    const titleMatch = entry.title.toLowerCase().includes(searchLower);
    const genreMatch = entry.genre.join(', ').toLowerCase().includes(searchLower);
    const artistMatch = entry.artistReference.toLowerCase().includes(searchLower);
    const vibeMatch = entry.vibe.join(', ').toLowerCase().includes(searchLower);
    
    if (filterBy === 'all') {
      return titleMatch || genreMatch || artistMatch || vibeMatch;
    } else if (filterBy === 'genre') {
      return genreMatch;
    } else if (filterBy === 'artist') {
      return artistMatch;
    } else if (filterBy === 'vibe') {
      return vibeMatch;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortBy === 'title') {
      return a.title.localeCompare(b.title);
    } else if (sortBy === 'genre') {
      return a.genre.join(', ').localeCompare(b.genre.join(', '));
    }
    return 0;
  });

  const handleDeleteClick = (id: string) => {
    if (confirmDelete === id) {
      onDeleteEntry(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      // Auto-cancel confirmation after 3 seconds
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

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

        <div className="px-6 py-4 border-b border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Input 
                type="search"
                placeholder="Search by title, genre, artist, or vibe..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-700 border-gray-600 placeholder-gray-500"
                aria-label="Search library"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select 
                value={filterBy} 
                onChange={(e) => setFilterBy(e.target.value as any)}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:ring-purple-500 focus:border-purple-500 text-sm"
              >
                <option value="all">All Fields</option>
                <option value="genre">Genre</option>
                <option value="artist">Artist</option>
                <option value="vibe">Vibe</option>
              </select>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:ring-purple-500 focus:border-purple-500 text-sm"
              >
                <option value="date">Date</option>
                <option value="title">Title</option>
                <option value="genre">Genre</option>
              </select>
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-400">
            {filteredLibrary.length} of {library.length} entries
          </div>
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
                    <div className="space-y-1">
                      <p className="text-sm text-gray-400 truncate" title={Array.isArray(entry.genre) ? entry.genre.join(', ') : entry.genre}>
                        <span className="font-medium">Genre:</span> {Array.isArray(entry.genre) ? entry.genre.join(', ') : entry.genre}
                      </p>
                      {entry.artistReference && (
                        <p className="text-sm text-gray-400 truncate" title={entry.artistReference}>
                          <span className="font-medium">Artist:</span> {entry.artistReference}
                        </p>
                      )}
                      {entry.vibe.length > 0 && (
                        <p className="text-sm text-gray-400 truncate" title={entry.vibe.join(', ')}>
                          <span className="font-medium">Vibe:</span> {entry.vibe.join(', ')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center mt-2">
                      <p className="text-xs text-gray-500">
                        Created: {new Date(entry.createdAt).toLocaleDateString()}
                      </p>
                      {entry.generatedMidiPatterns && (
                        <MusicNoteIcon className="w-3 h-3 text-green-400 ml-2" title="MIDI patterns available" />
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2 items-end shrink-0 ml-3">
                    <div className="flex space-x-2">
                      <Button 
                        onClick={() => onLoadEntry(entry)} 
                        size="sm" 
                        variant="outline" 
                        className="text-xs px-3 py-1.5" 
                        leftIcon={<BookOpenIcon className="w-4 h-4"/>}
                      >
                        Load
                      </Button>
                      {onEditEntry && (
                        <Button 
                          onClick={() => onEditEntry(entry)} 
                          size="sm" 
                          variant="secondary" 
                          className="text-xs px-3 py-1.5" 
                          leftIcon={<PencilSquareIcon className="w-4 h-4"/>}
                          title="Edit entry"
                        >
                          Edit
                        </Button>
                      )}
                    </div>
                    <Button 
                      onClick={() => handleDeleteClick(entry.id)} 
                      size="sm" 
                      variant={confirmDelete === entry.id ? "danger" : "outline"} 
                      className={`text-xs px-3 py-1.5 transition-all ${
                        confirmDelete === entry.id ? 'bg-red-600 hover:bg-red-700' : ''
                      }`}
                      leftIcon={<TrashIcon className="w-4 h-4"/>}
                    >
                      {confirmDelete === entry.id ? 'Confirm Delete' : 'Delete'}
                    </Button>
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
