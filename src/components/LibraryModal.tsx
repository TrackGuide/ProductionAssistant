import React, { useState, useEffect } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { BookOpenIcon, PlusIcon, TrashIcon, StarIcon, DownloadIcon } from './icons';
import { GuidebookEntry } from '../types';
import { LOCAL_STORAGE_KEY } from '../constants';

interface LibraryEntry extends GuidebookEntry {
  isFavorite?: boolean;
  tags?: string[];
}

export const LibraryModal: React.FC = () => {
  const [entries, setEntries] = useState<LibraryEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newEntry, setNewEntry] = useState<Partial<LibraryEntry>>({
    title: '',
    genre: [],
    artistReference: '',
    vibe: [],
    daw: '',
    plugins: '',
    availableInstruments: '',
    content: ''
  });

  // Load entries from localStorage on component mount
  useEffect(() => {
    const savedEntries = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedEntries) {
      try {
        setEntries(JSON.parse(savedEntries));
      } catch (error) {
        console.error('Error loading library entries:', error);
      }
    }
  }, []);

  // Save entries to localStorage whenever entries change
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.artistReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = selectedGenre === 'All' || entry.genre.includes(selectedGenre);
    return matchesSearch && matchesGenre;
  });

  const allGenres = ['All', ...Array.from(new Set(entries.flatMap(entry => entry.genre)))];

  const handleCreateEntry = () => {
    if (!newEntry.title) return;

    const entry: LibraryEntry = {
      id: Date.now().toString(),
      title: newEntry.title,
      genre: newEntry.genre || [],
      artistReference: newEntry.artistReference || '',
      vibe: newEntry.vibe || [],
      daw: newEntry.daw || '',
      plugins: newEntry.plugins || '',
      availableInstruments: newEntry.availableInstruments || '',
      content: newEntry.content || '',
      createdAt: new Date().toISOString(),
      isFavorite: false,
      tags: []
    };

    setEntries(prev => [entry, ...prev]);
    setNewEntry({
      title: '',
      genre: [],
      artistReference: '',
      vibe: [],
      daw: '',
      plugins: '',
      availableInstruments: '',
      content: ''
    });
    setShowCreateForm(false);
  };

  const toggleFavorite = (id: string) => {
    setEntries(prev => prev.map(entry => 
      entry.id === id ? { ...entry, isFavorite: !entry.isFavorite } : entry
    ));
  };

  const deleteEntry = (id: string) => {
    if (confirm('Are you sure you want to delete this entry?')) {
      setEntries(prev => prev.filter(entry => entry.id !== id));
    }
  };

  const exportEntry = (entry: LibraryEntry) => {
    const dataStr = JSON.stringify(entry, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${entry.title.replace(/[^a-z0-9]/gi, '_')}_trackguide.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card title="📚 Track Library" className="bg-gray-800/80 backdrop-blur-md">
      <div className="space-y-4">
        {/* Search and Filter */}
        <div className="flex gap-3">
          <Input
            placeholder="Search tracks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm"
          >
            {allGenres.map(genre => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>
        </div>

        {/* Create New Entry Button */}
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          variant="primary"
          leftIcon={<PlusIcon className="w-4 h-4" />}
          className="w-full"
        >
          {showCreateForm ? 'Cancel' : 'Create New Track Guide'}
        </Button>

        {/* Create Form */}
        {showCreateForm && (
          <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600 space-y-3">
            <Input
              placeholder="Track title..."
              value={newEntry.title || ''}
              onChange={(e) => setNewEntry(prev => ({ ...prev, title: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Artist reference..."
                value={newEntry.artistReference || ''}
                onChange={(e) => setNewEntry(prev => ({ ...prev, artistReference: e.target.value }))}
              />
              <Input
                placeholder="DAW..."
                value={newEntry.daw || ''}
                onChange={(e) => setNewEntry(prev => ({ ...prev, daw: e.target.value }))}
              />
            </div>
            <textarea
              placeholder="Track guide content..."
              value={newEntry.content || ''}
              onChange={(e) => setNewEntry(prev => ({ ...prev, content: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm h-24 resize-none"
            />
            <Button
              onClick={handleCreateEntry}
              variant="primary"
              disabled={!newEntry.title}
              className="w-full"
            >
              Create Entry
            </Button>
          </div>
        )}

        {/* Entries List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <BookOpenIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">
                {entries.length === 0 
                  ? 'No track guides in your library yet.' 
                  : 'No tracks match your search criteria.'
                }
              </p>
              <p className="text-xs mt-1">
                {entries.length === 0 
                  ? 'Create your first track guide to get started.' 
                  : 'Try adjusting your search or filter.'
                }
              </p>
            </div>
          ) : (
            filteredEntries.map((entry) => (
              <div key={entry.id} className="p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-white">{entry.title}</h3>
                      {entry.isFavorite && (
                        <StarIcon className="w-4 h-4 text-yellow-400" isFilled />
                      )}
                    </div>
                    {entry.artistReference && (
                      <p className="text-xs text-gray-400 mb-1">
                        Reference: {entry.artistReference}
                      </p>
                    )}
                    {entry.genre.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {entry.genre.map((g, i) => (
                          <span key={i} className="px-2 py-1 bg-purple-600/30 text-purple-300 text-xs rounded">
                            {g}
                          </span>
                        ))}
                      </div>
                    )}
                    {entry.content && (
                      <p className="text-xs text-gray-300 line-clamp-2">
                        {entry.content.substring(0, 100)}...
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-3">
                    <button
                      onClick={() => toggleFavorite(entry.id)}
                      className="p-1 text-gray-400 hover:text-yellow-400 transition-colors"
                      title={entry.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <StarIcon className="w-4 h-4" isFilled={entry.isFavorite} />
                    </button>
                    <button
                      onClick={() => exportEntry(entry)}
                      className="p-1 text-gray-400 hover:text-blue-400 transition-colors"
                      title="Export entry"
                    >
                      <DownloadIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteEntry(entry.id)}
                      className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                      title="Delete entry"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Created: {new Date(entry.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Stats */}
        {entries.length > 0 && (
          <div className="pt-3 border-t border-gray-700 text-xs text-gray-400">
            <div className="flex justify-between">
              <span>{entries.length} total tracks</span>
              <span>{entries.filter(e => e.isFavorite).length} favorites</span>
              <span>{filteredEntries.length} showing</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};