import { useState, useEffect } from 'react';
import { GuidebookEntry, UserInputs } from '../types/appTypes';
import { LOCAL_STORAGE_KEY, LAST_USED_DAW_KEY, LAST_USED_PLUGINS_KEY } from '../constants/constants';
import { stopPlayback } from '../services/audioService';
import { useAppStore } from '../store/useAppStore';

export const useLibraryManagement = () => {
  const {
    library,
    setLibrary,
    setInputs,
    setCurrentGenreText,
    setCurrentVibeText,
    setGeneratedGuidebook,
    setActiveGuidebookDetails,
    setError,
    setMidiError,
    setCopyStatus,
    setShowLibraryModal,
    setActiveView
  } = useAppStore();

  // Initialize library from localStorage
  useEffect(() => {
    try {
      const savedLibrary = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedLibrary) {
        const parsedLibrary = JSON.parse(savedLibrary);
        const migratedLibrary = parsedLibrary.map((entry: any) => ({
          ...entry,
          genre: Array.isArray(entry.genre) ? entry.genre : (entry.genre ? [entry.genre] : []),
          vibe: Array.isArray(entry.vibe) ? entry.vibe : (entry.vibe ? [entry.vibe] : []),
          scale: entry.scale || '',
          midiSettings: entry.midiSettings || undefined,
          generatedMidiPatterns: entry.generatedMidiPatterns || undefined,
        }));
        setLibrary(migratedLibrary);
      }
    } catch (e) {
      console.error("Failed to load library from local storage:", e);
      setLibrary([]);
    }
  }, [setLibrary]);

  // Save library to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(library));
    } catch (e) {
      console.error("Failed to save library to local storage:", e);
    }
  }, [library]);

  const saveToLibrary = (entry: GuidebookEntry) => {
    setLibrary(prev => {
      const existingIndex = prev.findIndex(item => item.id === entry.id);
      if (existingIndex > -1) {
        const updatedLibrary = [...prev];
        updatedLibrary[existingIndex] = entry;
        return updatedLibrary;
      }
      return [entry, ...prev];
    });
  };

  const loadFromLibrary = (entry: GuidebookEntry) => {
    setInputs({ 
      songTitle: entry.title, 
      genre: Array.isArray(entry.genre) ? entry.genre : (entry.genre ? [String(entry.genre)] : []),
      artistReference: entry.artistReference,
      referenceTrackLink: entry.referenceTrackLink || '',
      lyrics: entry.lyrics || '',
      key: entry.key || '',
      chords: entry.chords || '',
      generalNotes: entry.generalNotes || '',
      vibe: Array.isArray(entry.vibe) ? entry.vibe : (entry.vibe ? [String(entry.vibe)] : []),
      daw: entry.daw,
      plugins: entry.plugins,
      availableInstruments: entry.availableInstruments || '',
    });
    
    setCurrentGenreText('');
    setCurrentVibeText('');
    setGeneratedGuidebook(entry.content);
    setActiveGuidebookDetails(entry);
    setError(null);
    setMidiError(null);
    setCopyStatus('');
    stopPlayback();
    setShowLibraryModal(false);
    setActiveView('trackGuide');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteFromLibrary = (id: string) => {
    setLibrary(prev => prev.filter(entry => entry.id !== id));
    // If the currently active guidebook is being deleted, clear it
    setActiveGuidebookDetails(prev => {
      if (prev && prev.id === id) {
        setGeneratedGuidebook("");
        stopPlayback();
        return null;
      }
      return prev;
    });
  };

  return {
    library,
    saveToLibrary,
    loadFromLibrary,
    deleteFromLibrary
  };
};