import React, { useState, useEffect, useRef } from 'react';
import { MidiSettings, GeneratedMidiPatterns, UserInputs, GuidebookEntry } from '../types';
import { generateMidiPatternSuggestions } from '../services/geminiService.ts';
import { generateMidiFile, downloadMidi } from '../services/midiService.ts';
import { playMidiPatterns, stopPlayback, initializeAudio } from '../services/audioService.ts';
import { MIDI_TEMPO_RANGES } from '../constants';

export const MidiGeneratorComponent = ({ 
    currentGuidebookEntry, 
    mainAppInputs, 
    onUpdateGuidebookEntryMidi,
    parsedGuidebookBpm,
    parsedGuidebookKey,
    parsedGuidebookChordProg
}) => {
  // Your existing state variables
  
  // Update the regeneration logic
  const handleRegenerateSingleTrack = async (instrumentType: string) => {
    setIsGenerating(true);
    setGenerationError(null);
    
    try {
      // Preserve the original bar length and harmonic structure
      const regenerationSettings = {
        ...settings,
        // Don't allow changing the bar length for single track regeneration
        bars: currentGuidebookEntry.midiSettings?.bars || settings.bars,
      };
      
      // Call your API to regenerate just this track
      const response = await generateMidiPatternSuggestions({
        ...mainAppInputs,
        ...regenerationSettings,
        targetInstruments: [instrumentType],
        preserveHarmonicStructure: true,
      });
      
      // Merge the new track with existing patterns
      const updatedPatterns = { ...generatedPatterns };
      if (response.patterns && response.patterns.length > 0) {
        // Find and replace just the regenerated instrument pattern
        updatedPatterns[instrumentType] = response.patterns.find(p => p.instrument === instrumentType) || updatedPatterns[instrumentType];
      }
      
      setGeneratedPatterns(updatedPatterns);
      
      // Update the guidebook entry with the new patterns
      if (onUpdateGuidebookEntryMidi) {
        onUpdateGuidebookEntryMidi({
          ...currentGuidebookEntry,
          midiSettings: regenerationSettings,
          midiPatterns: updatedPatterns,
        });
      }
    } catch (error) {
      console.error('Error regenerating track:', error);
      setGenerationError('Failed to regenerate track. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Update the full regeneration logic
  const handleRegenerateAll = async () => {
    setIsGenerating(true);
    setGenerationError(null);
    
    try {
      // For full regeneration, we can allow changing the bar length
      const response = await generateMidiPatternSuggestions({
        ...mainAppInputs,
        ...settings,
        targetInstruments: settings.targetInstruments,
        preserveHarmonicStructure: false,
      });
      
      if (response.patterns) {
        const newPatterns = {};
        response.patterns.forEach(pattern => {
          if (pattern.instrument) {
            newPatterns[pattern.instrument] = pattern;
          }
        });
        
        setGeneratedPatterns(newPatterns);
        
        // Update the guidebook entry with the new patterns
        if (onUpdateGuidebookEntryMidi) {
          onUpdateGuidebookEntryMidi({
            ...currentGuidebookEntry,
            midiSettings: settings,
            midiPatterns: newPatterns,
          });
        }
      }
    } catch (error) {
      console.error('Error regenerating all tracks:', error);
      setGenerationError('Failed to regenerate tracks. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Update the tempo caption to reflect the selected genre's BPM range
  const getTempoCaption = () => {
    const genreKey = settings.genre || 'Default';
    const tempoRange = MIDI_TEMPO_RANGES[genreKey] || MIDI_TEMPO_RANGES.Default;
    return `${tempoRange[0]}–${tempoRange[1]} BPM for ${genreKey}`;
  };
  
  // Rest of your component code
  
  return (
    <div className="midi-generator-container bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <h2 className="text-xl font-bold mb-4">MIDI Generator</h2>
      
      {/* Your existing UI elements */}
      
      {/* Update the tempo slider to show dynamic caption */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          Tempo: {settings.tempo} BPM
          <span className="text-xs text-gray-500 ml-2">
            {getTempoCaption()}
          </span>
        </label>
        <input
          type="range"
          min="60"
          max="180"
          value={settings.tempo}
          onChange={(e) => handleSettingChange('tempo', parseInt(e.target.value))}
          className="w-full"
        />
      </div>
      
      {/* Rest of your UI */}
    </div>
  );
};