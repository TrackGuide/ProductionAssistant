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
  // === ORIGINAL FULL EQ DATA (keep yours unchanged) ===
  { frequency: '20-30 Hz', description: 'Sub-bass rumble, often felt more than heard. Can cause speaker damage if excessive.', instruments: ['Kick drum', 'Sub bass', '808s', 'Synthesizer bass'], action: 'cut', category: 'sub' },
  { frequency: '30-40 Hz', description: 'Deep bass foundation, adds power and weight. Essential for electronic music.', instruments: ['Kick drum', 'Bass guitar', 'Sub bass', '808s'], action: 'boost', category: 'sub' },
  { frequency: '40-60 Hz', description: 'Bass fundamentals, warmth and body. Key frequency for bass instruments.', instruments: ['Kick drum', 'Bass guitar', 'Sub bass', 'Synthesizer bass', 'Tuba'], action: 'boost', category: 'sub' },
  // ... KEEP THE REST OF YOUR FULL EQ_DATA
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
    const matchesSearch = searchTerm === '' ||
      band.frequency.toLowerCase().includes(searchTerm.toLowerCase()) ||
      band.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      band.instruments.some(inst => inst.toLowerCase().includes(searchTerm.toLowerCase()));

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
            <label className="block text-sm font-medium text-gray-300 mb-2">Search (Freq, Instrument, Issue...)</label>
            <Input 
              type="text"
              placeholder="Ex: 'muddiness', 'harshness', 'sibilance', 'kick drum', '2kHz'..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
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
