import React, { useState } from 'react';
import { Card } from './Card.tsx';
import { Button } from './Button.tsx';
import { AdjustmentsHorizontalIcon } from './icons.tsx';

interface EQBand {
  frequency: string;
  description: string;
  instruments: string[];
  action: 'boost' | 'cut' | 'notch';
  category: 'sub' | 'bass' | 'low-mid' | 'mid' | 'high-mid' | 'presence' | 'air';
}

const EQ_DATA: EQBand[] = [
  // ... (unchanged full dataset as before)
  { frequency: '20-30 Hz', description: 'Extreme sub-bass rumble. Rarely useful except for cinematic or sub-heavy genres.', instruments: ['Kick drum', 'Sub bass', '808s', 'Synth bass'], action: 'cut', category: 'sub' },
  { frequency: '30-50 Hz', description: 'Deep low-end power. Adds weight, but too much = flabbiness.', instruments: ['Kick drum', 'Sub bass', 'Bass guitar', '808s'], action: 'boost', category: 'sub' },
  { frequency: '50-60 Hz', description: 'Bass punch and fullness. Defines the "bottom" of mix.', instruments: ['Kick drum', 'Bass guitar', 'Sub bass', 'Synths'], action: 'boost', category: 'sub' },
  { frequency: '60-100 Hz', description: 'Bass body and tone. Core of bass instruments. Too much = boom.', instruments: ['Bass guitar', 'Kick drum', 'Synth bass', 'Cello'], action: 'boost', category: 'bass' },
  { frequency: '100-160 Hz', description: 'Low warmth. Helps glue bass + low mids. Overdone = muddiness.', instruments: ['Bass guitar', 'Piano', 'Guitar', 'Vocals', 'Drums'], action: 'cut', category: 'bass' },
  { frequency: '160-250 Hz', description: 'Upper bass/low mid overlap. Often cut to clean mud.', instruments: ['Bass guitar', 'Vocals', 'Strings', 'Brass'], action: 'cut', category: 'bass' },
  { frequency: '250-350 Hz', description: 'Boxiness / wool. Can cloud guitars & vocals.', instruments: ['Vocals', 'Guitar', 'Piano', 'Snare'], action: 'cut', category: 'low-mid' },
  { frequency: '350-500 Hz', description: 'Warmth vs. mud. Boost for body, cut for clarity.', instruments: ['Vocals', 'Snare', 'Guitar', 'Keys'], action: 'cut', category: 'low-mid' },
  { frequency: '500-800 Hz', description: 'Core midrange — thickness and presence. Often cluttered.', instruments: ['Vocals', 'Guitar', 'Snare', 'Keys'], action: 'cut', category: 'mid' },
  { frequency: '800 Hz - 1.5 kHz', description: 'Body and clarity. Essential for definition.', instruments: ['Vocals', 'Guitar', 'Piano', 'Snare'], action: 'boost', category: 'mid' },
  { frequency: '1.5-2 kHz', description: 'Presence and attack. Boost for definition.', instruments: ['Vocals', 'Snare', 'Guitar'], action: 'boost', category: 'mid' },
  { frequency: '2-3 kHz', description: 'Vocal clarity and edge. Boost carefully.', instruments: ['Vocals', 'Snare', 'Guitar', 'Piano'], action: 'boost', category: 'high-mid' },
  { frequency: '3-5 kHz', description: 'Presence, bite, intelligibility. Too much = harsh.', instruments: ['Vocals', 'Snare', 'Cymbals'], action: 'cut', category: 'high-mid' },
  { frequency: '5-8 kHz', description: 'Detail and sparkle. Brings life, but sibilant if overdone.', instruments: ['Vocals', 'Hi-hats', 'Acoustic guitar', 'Cymbals'], action: 'boost', category: 'presence' },
  { frequency: '8-12 kHz', description: 'Air and openness. Adds space.', instruments: ['Vocals', 'Strings', 'Cymbals', 'Room mics'], action: 'boost', category: 'air' },
  { frequency: '12-20 kHz', description: 'Extreme highs. Use for shimmer.', instruments: ['Cymbals', 'Room mics', 'Vocals'], action: 'boost', category: 'air' },
];

const INSTRUMENTS = [
  'All', 'Vocals', 'Male vocals', 'Kick drum', 'Snare', 'Bass guitar', 'Guitar', 'Acoustic guitar', 'Piano',
  'Cymbals', 'Hi-hats', 'Sub bass', '808s', 'Synth bass', 'Strings', 'Room mics', 'Drums',
  'Violin', 'Cello', 'Tuba', 'Saxophone', 'Trumpet', 'Brass', 'Woodwinds', 'Flute'
];

const FREQUENCY_ZONES = [
  { id: 'all', label: 'All Frequencies', color: 'bg-gray-600' },
  { id: 'sub', label: 'Sub Bass (20-60Hz)', color: 'bg-red-600' },
  { id: 'bass', label: 'Bass (60-250Hz)', color: 'bg-orange-600' },
  { id: 'low-mid', label: 'Low Mids (250-500Hz)', color: 'bg-yellow-600' },
  { id: 'mid', label: 'Mids (500-2kHz)', color: 'bg-green-600' },
  { id: 'high-mid', label: 'High Mids (2-6kHz)', color: 'bg-blue-600' },
  { id: 'presence', label: 'Presence (6-12kHz)', color: 'bg-indigo-600' },
  { id: 'air', label: 'Air (12kHz+)', color: 'bg-purple-600' },
];

export const EQGuide: React.FC = () => {
  const [selectedInstrument, setSelectedInstrument] = useState('All');
  const [selectedZone, setSelectedZone] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filtering
  const filteredData = EQ_DATA.filter(band => {
    const matchesZone = selectedZone === 'all' || band.category === selectedZone;
    const matchesSearch = searchTerm === '' || band.description.toLowerCase().includes(searchTerm.toLowerCase());
    if (selectedInstrument === 'All') {
      return matchesZone && matchesSearch;
    } else {
      const matchesInstrument = band.instruments.includes(selectedInstrument);
      return matchesInstrument && matchesZone && matchesSearch;
    }
  });

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
      case 'boost': return '↗️';
      case 'cut': return '↘️';
      case 'notch': return '🔻';
      default: return '•';
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-2 md:px-6">
      {/* Title/Filters */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-3">
        <div className="flex items-center gap-2">
          <AdjustmentsHorizontalIcon className="w-7 h-7 text-orange-500" />
          <h2 className="text-2xl font-bold text-white">EQ Cheat Sheet</h2>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <select
            value={selectedInstrument}
            onChange={e => setSelectedInstrument(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-100"
          >
            {INSTRUMENTS.map(inst => <option key={inst} value={inst}>{inst}</option>)}
          </select>
          <select
            value={selectedZone}
            onChange={e => setSelectedZone(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-100"
          >
            {FREQUENCY_ZONES.map(zone => <option key={zone.id} value={zone.id}>{zone.label}</option>)}
          </select>
          <input
            type="text"
            placeholder="Search description…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-100"
          />
        </div>
      </div>
      {/* Responsive Frequency Zone Buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FREQUENCY_ZONES.map(zone => (
          <button
            key={zone.id}
            onClick={() => setSelectedZone(zone.id)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
              selectedZone === zone.id ? `${zone.color} text-white shadow-lg` : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {zone.label}
          </button>
        ))}
      </div>
      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto" style={{ maxHeight: '70vh' }}>
        {filteredData.length === 0 ? (
          <div className="col-span-full text-gray-400 text-center py-8">No EQ data matches your filters.</div>
        ) : (
          filteredData.map((band, index) => (
            <Card key={index} className="bg-gray-700/50 hover:bg-gray-700/70 transition-colors">
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className="text-lg font-bold text-white mr-3">{band.frequency}</span>
                      <span className={`text-sm font-medium ${getActionColor(band.action)}`}>
                        {getActionIcon(band.action)} {band.action.toUpperCase()}
                      </span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                        FREQUENCY_ZONES.find(z => z.id === band.category)?.color || 'bg-gray-600'
                      } text-white`}>
                        {band.category.replace('-', ' ').toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-300 mb-2">{band.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {band.instruments.map(inst => (
                        <span key={inst} className="px-2 py-1 bg-gray-600 text-gray-200 rounded text-xs">
                          {inst}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
      {/* Mobile scroll tip */}
      <div className="pt-3 pb-1 text-center text-xs text-gray-400">
        💡 Tip: Scroll right/left on cards for more frequencies.
      </div>
      <div className="pt-6 pb-2 text-center text-xs text-gray-500">
        These are general guidelines. Always trust your ears and context!
      </div>
    </div>
  );
};
