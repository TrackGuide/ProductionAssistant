import React, { useState } from 'react';
import { Card } from './Card.tsx';
import { Button } from './Button.tsx';
import { Input } from './Input.tsx';
import { AdjustmentsHorizontalIcon } from './icons.tsx';

interface EQBand {
  frequency: string;
  description: string;
  instruments: string[];
  action: 'boost' | 'cut' | 'notch';
  category: 'sub' | 'bass' | 'low-mid' | 'mid' | 'high-mid' | 'presence' | 'air';
}

const EQ_DATA: EQBand[] = [
  // SUB BASS
  { frequency: '20-30 Hz', description: 'Extreme sub-bass rumble. Rarely useful except for cinematic or sub-heavy genres.', instruments: ['Kick drum', 'Sub bass', '808s', 'Synth bass'], action: 'cut', category: 'sub' },
  { frequency: '30-50 Hz', description: 'Deep low-end power. Adds weight, but too much = flabbiness.', instruments: ['Kick drum', 'Sub bass', 'Bass guitar', '808s'], action: 'boost', category: 'sub' },
  { frequency: '50-60 Hz', description: 'Bass punch and fullness. Defines the "bottom" of mix.', instruments: ['Kick drum', 'Bass guitar', 'Sub bass', 'Synths'], action: 'boost', category: 'sub' },

  // BASS
  { frequency: '60-100 Hz', description: 'Bass body and tone. Core of bass instruments. Too much = boom.', instruments: ['Bass guitar', 'Kick drum', 'Synth bass', 'Cello'], action: 'boost', category: 'bass' },
  { frequency: '100-160 Hz', description: 'Low warmth. Helps glue bass + low mids. Overdone = muddiness.', instruments: ['Bass guitar', 'Piano', 'Guitar', 'Vocals', 'Drums'], action: 'cut', category: 'bass' },
  { frequency: '160-250 Hz', description: 'Upper bass/low mid overlap. Often cut to clean mud.', instruments: ['Bass guitar', 'Vocals', 'Strings', 'Brass'], action: 'cut', category: 'bass' },

  // LOW MIDS
  { frequency: '250-350 Hz', description: 'Boxiness / wool. Can cloud guitars & vocals.', instruments: ['Vocals', 'Guitar', 'Piano', 'Snare'], action: 'cut', category: 'low-mid' },
  { frequency: '350-500 Hz', description: 'Warmth vs. mud. Boost for body, cut for clarity.', instruments: ['Vocals', 'Snare', 'Guitar', 'Keys'], action: 'cut', category: 'low-mid' },

  // MIDS
  { frequency: '500-800 Hz', description: 'Core midrange — thickness and presence. Often cluttered.', instruments: ['Vocals', 'Guitar', 'Snare', 'Keys'], action: 'cut', category: 'mid' },
  { frequency: '800 Hz - 1.5 kHz', description: 'Body and clarity. Essential for definition.', instruments: ['Vocals', 'Guitar', 'Piano', 'Snare'], action: 'boost', category: 'mid' },
  { frequency: '1.5-2 kHz', description: 'Presence and attack. Boost for definition.', instruments: ['Vocals', 'Snare', 'Guitar'], action: 'boost', category: 'mid' },

  // HIGH MIDS
  { frequency: '2-3 kHz', description: 'Vocal clarity and edge. Boost carefully.', instruments: ['Vocals', 'Snare', 'Guitar', 'Piano'], action: 'boost', category: 'high-mid' },
  { frequency: '3-5 kHz', description: 'Presence, bite, intelligibility. Too much = harsh.', instruments: ['Vocals', 'Snare', 'Cymbals'], action: 'cut', category: 'high-mid' },

  // PRESENCE
  { frequency: '5-8 kHz', description: 'Detail and sparkle. Brings life, but sibilant if overdone.', instruments: ['Vocals', 'Hi-hats', 'Acoustic guitar', 'Cymbals'], action: 'boost', category: 'presence' },

  // AIR
  { frequency: '8-12 kHz', description: 'Air and openness. Adds space.', instruments: ['Vocals', 'Strings', 'Cymbals', 'Room mics'], action: 'boost', category: 'air' },
  { frequency: '12-20 kHz', description: 'Extreme highs. Use for shimmer.', instruments: ['Cymbals', 'Room mics', 'Vocals'], action: 'boost', category: 'air' },
];


const INSTRUMENTS = [
  'All', 'Vocals', 'Male vocals', 'Kick drum', 'Snare', 'Bass guitar', 'Guitar', 'Acoustic guitar', 'Piano',
  'Cymbals', 'Hi-hats', 'Sub bass', '808s', 'Synthesizer bass', 'Horns', 'Strings', 'Room mics', 'Drums',
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

interface EQCheatSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EQCheatSheet: React.FC<EQCheatSheetProps> = ({ isOpen, onClose }) => {
  const [selectedInstrument, setSelectedInstrument] = useState('All');
  const [selectedZone, setSelectedZone] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredData = EQ_DATA.filter(band => {
    const matchesZone = selectedZone === 'all' || band.category === selectedZone;
   const matchesSearch = searchTerm === '' || band.description.toLowerCase().includes(searchTerm.toLowerCase());

    // "All" = show all relevant instruments
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
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
      <div className="p-6 border-b border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <AdjustmentsHorizontalIcon className="w-6 h-6 mr-2" />
            EQ Guide
          </h2>
          <div className="flex items-center gap-3">
            <Button onClick={onClose} variant="outline" size="sm">
              ✕ Close
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Filter by Instrument</label>
            <select 
              value={selectedInstrument} 
              onChange={(e) => setSelectedInstrument(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100"
            >
              {INSTRUMENTS.map(inst => (
                <option key={inst} value={inst}>{inst}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Frequency Zone</label>
            <select 
              value={selectedZone} 
              onChange={(e) => setSelectedZone(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100"
            >
              {FREQUENCY_ZONES.map(zone => (
                <option key={zone.id} value={zone.id}>{zone.label}</option>
              ))}
            </select>
          </div>

          <div>
  <label className="block text-sm font-medium text-gray-300 mb-2">Issue</label>
  <select
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:ring-purple-500 focus:border-purple-500"
  >
    <option value="">All</option>
    <option value="boxy">Boxiness</option>
    <option value="muddy">Muddiness</option>
    <option value="honky">Honkiness</option>
    <option value="nasal">Nasal</option>
    <option value="harsh">Harshness</option>
    <option value="sibilant">Sibilance</option>
    <option value="thin">Thinness</option>
    <option value="dull">Dullness</option>
    <option value="bright">Too Bright</option>
    <option value="no punch">No Punch</option>
    <option value="no low-end">No Low-end</option>
    <option value="no air">No Air</option>
  </select>
 </div>
</div> 

      <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">Frequency Zones</h3>
          <div className="flex flex-wrap gap-2">
            {FREQUENCY_ZONES.map(zone => (
              <button
                key={zone.id}
                onClick={() => setSelectedZone(zone.id)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                  selectedZone === zone.id 
                    ? `${zone.color} text-white shadow-lg` 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {zone.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filteredData.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No EQ data matches your current filters or search.</p>
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
      </div>

      <div className="p-4 border-t border-gray-700 bg-gray-800/50">
        <p className="text-xs text-gray-400 text-center">
          💡 Tip: These are general guidelines. Always trust your ears and adjust based on the specific context of your mix.
        </p>
      </div>
    </div>
  </div>
);
};
