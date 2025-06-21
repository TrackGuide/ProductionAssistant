import React, { useState } from 'react';
import { Card } from './Card.tsx';
import { Button } from './Button.tsx';
import { AdjustmentsHorizontalIcon } from './icons.tsx';

// 1. Define your EQ band dataset (expand as you wish)
const EQ_DATA = [
  // SUB
  { frequency: '20-30 Hz', min: 20, max: 30, description: 'Extreme sub-bass rumble. Rarely useful except for cinematic or sub-heavy genres.', instruments: ['Kick drum', 'Sub bass', '808s', 'Synth bass'], action: 'cut', category: 'sub' },
  { frequency: '30-50 Hz', min: 30, max: 50, description: 'Deep low-end power. Adds weight, but too much = flabbiness.', instruments: ['Kick drum', 'Sub bass', 'Bass guitar', '808s'], action: 'boost', category: 'sub' },
  { frequency: '50-60 Hz', min: 50, max: 60, description: 'Bass punch and fullness. Defines the "bottom" of mix.', instruments: ['Kick drum', 'Bass guitar', 'Sub bass', 'Synths'], action: 'boost', category: 'sub' },
  // BASS
  { frequency: '60-100 Hz', min: 60, max: 100, description: 'Bass body and tone. Core of bass instruments. Too much = boom.', instruments: ['Bass guitar', 'Kick drum', 'Synth bass', 'Cello'], action: 'boost', category: 'bass' },
  { frequency: '100-160 Hz', min: 100, max: 160, description: 'Low warmth. Helps glue bass + low mids. Overdone = muddiness.', instruments: ['Bass guitar', 'Piano', 'Guitar', 'Vocals', 'Drums'], action: 'cut', category: 'bass' },
  { frequency: '160-250 Hz', min: 160, max: 250, description: 'Upper bass/low mid overlap. Often cut to clean mud.', instruments: ['Bass guitar', 'Vocals', 'Strings', 'Brass'], action: 'cut', category: 'bass' },
  // LOW-MID
  { frequency: '250-350 Hz', min: 250, max: 350, description: 'Boxiness/wool. Can cloud guitars & vocals.', instruments: ['Vocals', 'Guitar', 'Piano', 'Snare'], action: 'cut', category: 'low-mid' },
  { frequency: '350-500 Hz', min: 350, max: 500, description: 'Warmth vs. mud. Boost for body, cut for clarity.', instruments: ['Vocals', 'Snare', 'Guitar', 'Keys'], action: 'cut', category: 'low-mid' },
  // MID
  { frequency: '500-800 Hz', min: 500, max: 800, description: 'Core midrange — thickness and presence. Often cluttered.', instruments: ['Vocals', 'Guitar', 'Snare', 'Keys'], action: 'cut', category: 'mid' },
  { frequency: '800 Hz - 1.5 kHz', min: 800, max: 1500, description: 'Body and clarity. Essential for definition.', instruments: ['Vocals', 'Guitar', 'Piano', 'Snare'], action: 'boost', category: 'mid' },
  { frequency: '1.5-2 kHz', min: 1500, max: 2000, description: 'Presence and attack. Boost for definition.', instruments: ['Vocals', 'Snare', 'Guitar'], action: 'boost', category: 'mid' },
  // HIGH-MID
  { frequency: '2-3 kHz', min: 2000, max: 3000, description: 'Vocal clarity and edge. Boost carefully.', instruments: ['Vocals', 'Snare', 'Guitar', 'Piano'], action: 'boost', category: 'high-mid' },
  { frequency: '3-5 kHz', min: 3000, max: 5000, description: 'Presence, bite, intelligibility. Too much = harsh.', instruments: ['Vocals', 'Snare', 'Cymbals'], action: 'cut', category: 'high-mid' },
  // PRESENCE
  { frequency: '5-8 kHz', min: 5000, max: 8000, description: 'Detail and sparkle. Brings life, but sibilant if overdone.', instruments: ['Vocals', 'Hi-hats', 'Acoustic guitar', 'Cymbals'], action: 'boost', category: 'presence' },
  // AIR
  { frequency: '8-12 kHz', min: 8000, max: 12000, description: 'Air and openness. Adds space.', instruments: ['Vocals', 'Strings', 'Cymbals', 'Room mics'], action: 'boost', category: 'air' },
  { frequency: '12-20 kHz', min: 12000, max: 20000, description: 'Extreme highs. Use for shimmer.', instruments: ['Cymbals', 'Room mics', 'Vocals'], action: 'boost', category: 'air' },
];

// Fill in the rest for all your target instruments for “pro-level coverage” as you like!

const ALL_INSTRUMENTS = [
  'All', 'Vocals', 'Male vocals', 'Female vocals', 'Kick drum', 'Snare', 'Bass guitar', 'Guitar', 'Acoustic guitar', 'Piano',
  'Cymbals', 'Hi-hats', 'Sub bass', '808s', 'Synth bass', 'Horns', 'Strings', 'Room mics', 'Drums',
  'Violin', 'Cello', 'Tuba', 'Saxophone', 'Trumpet', 'Brass', 'Woodwinds', 'Flute'
];

const FREQUENCY_ZONES = [
  { id: 'all', label: 'All Frequencies', color: 'bg-gray-600', min: 20, max: 20000 },
  { id: 'sub', label: 'Sub Bass (20-60Hz)', color: 'bg-red-600', min: 20, max: 60 },
  { id: 'bass', label: 'Bass (60-250Hz)', color: 'bg-orange-600', min: 60, max: 250 },
  { id: 'low-mid', label: 'Low Mids (250-500Hz)', color: 'bg-yellow-600', min: 250, max: 500 },
  { id: 'mid', label: 'Mids (500-2kHz)', color: 'bg-green-600', min: 500, max: 2000 },
  { id: 'high-mid', label: 'High Mids (2-6kHz)', color: 'bg-blue-600', min: 2000, max: 6000 },
  { id: 'presence', label: 'Presence (6-12kHz)', color: 'bg-indigo-600', min: 6000, max: 12000 },
  { id: 'air', label: 'Air (12kHz+)', color: 'bg-purple-600', min: 12000, max: 20000 },
];

// Helper for action color & icon
const getActionColor = (action: string) => {
  switch (action) {
    case 'boost': return 'text-green-400';
    case 'cut': return 'text-red-400';
    case 'notch': return 'text-yellow-400';
    default: return 'text-gray-400';
  }
};
const getActionIcon = (action: string) => {
  switch (action) {
    case 'boost': return '↑';
    case 'cut': return '↓';
    case 'notch': return '∿';
    default: return '•';
  }
};

// Map for instrument coverage fallback
const getBandsForInstrument = (instrument: string) => {
  const matches = EQ_DATA.filter(b =>
    b.instruments.map(i => i.toLowerCase()).includes(instrument.toLowerCase())
  );
  // Fallback: show the most “common” musical advice for unknown/less-covered instruments
  if (matches.length === 0 && instrument !== 'All') {
    // For this demo, just return all “All” (which is just everything)
    return EQ_DATA;
  }
  return matches;
};

// Visual bar component (simple, non-clutter)
const SpectrumBar: React.FC<{ min: number, max: number }> = ({ min, max }) => {
  // Range in Hz (log scale for visualization)
  const total = 20000 - 20;
  const left = ((Math.log10(min) - Math.log10(20)) / (Math.log10(20000) - Math.log10(20))) * 100;
  const right = ((Math.log10(max) - Math.log10(20)) / (Math.log10(20000) - Math.log10(20))) * 100;
  const width = Math.max(right - left, 1.5);
  return (
    <div className="relative h-3 w-full bg-gray-800 rounded-full my-2">
      <div
        className="absolute top-0 h-3 rounded-full opacity-80"
        style={{
          left: `${left}%`,
          width: `${width}%`,
          background: 'linear-gradient(90deg, #FF9800 40%, #6EE7B7 100%)',
          boxShadow: '0 0 10px #ff9800a6',
        }}
      ></div>
    </div>
  );
};

export const EQGuide: React.FC = () => {
  const [selectedInstrument, setSelectedInstrument] = useState('All');
  const [selectedZone, setSelectedZone] = useState('all');

  // Filtering
  let filteredData = EQ_DATA;
  if (selectedInstrument !== 'All') {
    filteredData = getBandsForInstrument(selectedInstrument);
  }
  if (selectedZone !== 'all') {
    filteredData = filteredData.filter(b => b.category === selectedZone);
  }

  // If there’s no match for the specific instrument/zone combo, gracefully fall back to showing “best fit” for that instrument or the whole list
  if (filteredData.length === 0) {
    filteredData = getBandsForInstrument(selectedInstrument);
    if (selectedZone !== 'all') filteredData = filteredData.filter(b => b.category === selectedZone);
    if (filteredData.length === 0) filteredData = EQ_DATA; // last resort: show all
  }

  return (
    <div className="max-w-5xl mx-auto px-2 py-6 min-h-screen">
      <div className="flex items-center mb-6">
        <AdjustmentsHorizontalIcon className="w-8 h-8 text-orange-400 mr-3" />
        <h1 className="text-3xl font-bold text-white">EQ Frequency Cheat Sheet</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block font-semibold text-gray-200 mb-1">Instrument</label>
          <select
            className="w-full px-3 py-2 rounded bg-gray-800 text-gray-100 border border-gray-700"
            value={selectedInstrument}
            onChange={e => setSelectedInstrument(e.target.value)}
          >
            {ALL_INSTRUMENTS.map(inst => (
              <option key={inst} value={inst}>{inst}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-semibold text-gray-200 mb-1">Frequency Zone</label>
          <select
            className="w-full px-3 py-2 rounded bg-gray-800 text-gray-100 border border-gray-700"
            value={selectedZone}
            onChange={e => setSelectedZone(e.target.value)}
          >
            {FREQUENCY_ZONES.map(zone => (
              <option key={zone.id} value={zone.id}>{zone.label}</option>
            ))}
          </select>
        </div>
        <div>
          {/* No extra search box to keep it clean per your request */}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredData.map((band, i) => (
          <Card key={i} className="bg-gray-800/80 p-0 shadow-md rounded-xl">
            <div className="p-4">
              <div className="flex items-center mb-1.5">
                <span className="text-lg font-bold text-white mr-3">{band.frequency}</span>
                <span className={`ml-1 text-sm font-medium ${getActionColor(band.action)}`}>
                  {getActionIcon(band.action)} {band.action.toUpperCase()}
                </span>
                <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${
                  FREQUENCY_ZONES.find(z => z.id === band.category)?.color || 'bg-gray-600'
                } text-white`}>
                  {band.category.replace('-', ' ').toUpperCase()}
                </span>
              </div>
              <SpectrumBar min={band.min} max={band.max} />
              <p className="text-gray-300 mb-2">{band.description}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {band.instruments.map(inst => (
                  <span key={inst} className="px-2 py-1 bg-gray-700 text-gray-200 rounded text-xs">
                    {inst}
                  </span>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-8 mb-2">
        <p className="text-xs text-gray-400 text-center">
          These are general guidelines. Always trust your ears and context.
        </p>
      </div>
    </div>
  );
};
