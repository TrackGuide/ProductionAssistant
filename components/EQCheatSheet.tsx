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
  // Sub Bass (20-60 Hz)
  { frequency: '20-30 Hz', description: 'Sub-bass rumble, often felt more than heard. Can cause speaker damage if excessive.', instruments: ['Kick drum', 'Sub bass', '808s', 'Synthesizer bass'], action: 'cut', category: 'sub' },
  { frequency: '30-40 Hz', description: 'Deep bass foundation, adds power and weight. Essential for electronic music.', instruments: ['Kick drum', 'Bass guitar', 'Sub bass', '808s'], action: 'boost', category: 'sub' },
  { frequency: '40-60 Hz', description: 'Bass fundamentals, warmth and body. Key frequency for bass instruments.', instruments: ['Kick drum', 'Bass guitar', 'Sub bass', 'Synthesizer bass', 'Tuba'], action: 'boost', category: 'sub' },
  
  // Bass (60-250 Hz)
  { frequency: '60-80 Hz', description: 'Bass guitar fundamentals, kick drum thump. Critical for rhythm section.', instruments: ['Bass guitar', 'Kick drum', 'Male vocals', 'Cello', 'Synthesizer bass'], action: 'boost', category: 'bass' },
  { frequency: '80-120 Hz', description: 'Bass clarity and definition. Too much causes muddiness.', instruments: ['Bass guitar', 'Piano', 'Guitar', 'Vocals', 'Drums'], action: 'boost', category: 'bass' },
  { frequency: '120-200 Hz', description: 'Warmth zone, can get muddy if excessive. Often needs gentle cutting.', instruments: ['Bass guitar', 'Piano', 'Guitar', 'Vocals', 'Strings', 'Brass'], action: 'cut', category: 'bass' },
  { frequency: '200-250 Hz', description: 'Muddiness zone, often problematic. Cut to clean up mix.', instruments: ['Most instruments', 'Vocals', 'Guitar', 'Piano'], action: 'cut', category: 'bass' },
  
  // Low Mids (250-500 Hz)
  { frequency: '250-350 Hz', description: 'Cardboard/boxy sound, often problematic. Cut to reduce boxiness.', instruments: ['Vocals', 'Snare', 'Guitar', 'Piano', 'Strings'], action: 'cut', category: 'low-mid' },
  { frequency: '350-450 Hz', description: 'Honky/nasal frequencies. Can make vocals sound unnatural.', instruments: ['Vocals', 'Horns', 'Guitar', 'Saxophone', 'Trumpet'], action: 'cut', category: 'low-mid' },
  { frequency: '450-500 Hz', description: 'Lower midrange clarity. Boost for warmth, cut for clarity.', instruments: ['Vocals', 'Guitar', 'Piano', 'Strings', 'Woodwinds'], action: 'cut', category: 'low-mid' },
  
  // Mids (500-2000 Hz)
  { frequency: '500-800 Hz', description: 'Vocal clarity and instrument definition. Key for presence.', instruments: ['Vocals', 'Snare', 'Guitar', 'Piano', 'Violin'], action: 'boost', category: 'mid' },
  { frequency: '800-1200 Hz', description: 'Vocal presence, can sound harsh if overdone. Critical for intelligibility.', instruments: ['Vocals', 'Snare', 'Hi-hats', 'Guitar', 'Brass'], action: 'boost', category: 'mid' },
  { frequency: '1-1.5 kHz', description: 'Attack and punch, vocal intelligibility. Boost for clarity.', instruments: ['Vocals', 'Snare', 'Guitar', 'Piano', 'Drums'], action: 'boost', category: 'mid' },
  { frequency: '1.5-2 kHz', description: 'Presence and definition. Can become fatiguing if excessive.', instruments: ['Vocals', 'Snare', 'Guitar', 'Piano', 'Cymbals'], action: 'boost', category: 'mid' },
  
  // High Mids (2-6 kHz)
  { frequency: '2-2.5 kHz', description: 'Vocal presence, can be fatiguing. Boost for clarity, cut for smoothness.', instruments: ['Vocals', 'Snare', 'Cymbals', 'Guitar', 'Violin'], action: 'boost', category: 'high-mid' },
  { frequency: '2.5-4 kHz', description: 'Clarity and definition, harshness zone. Often needs careful handling.', instruments: ['Vocals', 'Snare', 'Guitar', 'Cymbals', 'Piano'], action: 'cut', category: 'high-mid' },
  { frequency: '4-5 kHz', description: 'Vocal intelligibility, can sound harsh. Critical for speech clarity.', instruments: ['Vocals', 'Snare', 'Guitar', 'Cymbals', 'Brass'], action: 'boost', category: 'high-mid' },
  { frequency: '5-6 kHz', description: 'Sibilance in vocals, cymbal harshness. Often needs de-essing.', instruments: ['Vocals', 'Cymbals', 'Hi-hats', 'Acoustic guitar'], action: 'cut', category: 'high-mid' },
  
  // Presence (6-12 kHz)
  { frequency: '6-8 kHz', description: 'Vocal sibilance, cymbal brightness. Cut to reduce harshness.', instruments: ['Vocals', 'Cymbals', 'Acoustic guitar', 'Hi-hats'], action: 'cut', category: 'presence' },
  { frequency: '8-10 kHz', description: 'Brightness and clarity, can be harsh. Boost for sparkle.', instruments: ['Cymbals', 'Hi-hats', 'Vocals', 'Acoustic guitar', 'Strings'], action: 'boost', category: 'presence' },
  { frequency: '10-12 kHz', description: 'High-frequency clarity and definition. Adds presence and life.', instruments: ['Cymbals', 'Hi-hats', 'Vocals', 'Strings', 'Flute'], action: 'boost', category: 'presence' },
  
  // Air (12+ kHz)
  { frequency: '12-16 kHz', description: 'Air and sparkle, openness. Adds dimension and space.', instruments: ['Cymbals', 'Vocals', 'Strings', 'Acoustic guitar', 'Room mics'], action: 'boost', category: 'air' },
  { frequency: '16-20 kHz', description: 'Ultra-high frequencies, air and space. Subtle but important for realism.', instruments: ['Cymbals', 'Room mics', 'Strings', 'Vocals'], action: 'boost', category: 'air' },
  { frequency: '20+ kHz', description: 'Extreme high frequencies, mostly harmonics. Can add subtle air.', instruments: ['Cymbals', 'Room mics'], action: 'boost', category: 'air' },
];

const INSTRUMENTS = [
  'All', 'Vocals', 'Male vocals', 'Kick drum', 'Snare', 'Bass guitar', 'Guitar', 'Acoustic guitar', 'Piano', 'Cymbals', 'Hi-hats', 'Sub bass', '808s', 'Synthesizer bass', 'Horns', 'Strings', 'Room mics', 'Drums', 'Violin', 'Cello', 'Tuba', 'Saxophone', 'Trumpet', 'Brass', 'Woodwinds', 'Flute'
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
    const matchesInstrument = selectedInstrument === 'All' || band.instruments.includes(selectedInstrument);
    const matchesZone = selectedZone === 'all' || band.category === selectedZone;
    const matchesSearch = searchTerm === '' || 
      band.frequency.toLowerCase().includes(searchTerm.toLowerCase()) ||
      band.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      band.instruments.some(inst => inst.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesInstrument && matchesZone && matchesSearch;
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
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:ring-purple-500 focus:border-purple-500"
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
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:ring-purple-500 focus:border-purple-500"
              >
                {FREQUENCY_ZONES.map(zone => (
                  <option key={zone.id} value={zone.id}>{zone.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
              <Input 
                type="text"
                placeholder="Search frequencies, descriptions..."
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
              <p className="text-gray-400 text-center py-8">No EQ data matches your current filters.</p>
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