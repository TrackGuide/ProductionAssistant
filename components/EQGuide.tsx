import React, { useState } from 'react';
import { Card } from './Card.tsx';
import { Button } from './Button.tsx';
import { AdjustmentsHorizontalIcon } from './icons.tsx';

const INSTRUMENTS = [
  'All', 'Vocals', 'Male vocals', 'Female vocals', 'Kick drum', 'Snare', 'Bass guitar', 'Guitar', 'Acoustic guitar', 'Piano',
  'Cymbals', 'Hi-hats', 'Sub bass', '808s', 'Synth bass', 'Strings', 'Room mics', 'Drums',
  'Violin', 'Cello', 'Tuba', 'Saxophone', 'Trumpet', 'Brass', 'Woodwinds', 'Flute'
];

const FREQUENCY_ZONES = [
  { id: 'sub', label: 'Sub Bass (20-60Hz)', color: 'bg-red-600' },
  { id: 'bass', label: 'Bass (60-250Hz)', color: 'bg-orange-600' },
  { id: 'low-mid', label: 'Low Mids (250-500Hz)', color: 'bg-yellow-600' },
  { id: 'mid', label: 'Mids (500-2kHz)', color: 'bg-green-600' },
  { id: 'high-mid', label: 'High Mids (2-6kHz)', color: 'bg-blue-600' },
  { id: 'presence', label: 'Presence (6-12kHz)', color: 'bg-indigo-600' },
  { id: 'air', label: 'Air (12kHz+)', color: 'bg-purple-600' },
];

interface EQBand {
  frequency: string;
  description: string;
  action: 'boost' | 'cut' | 'notch';
  category: string;
}

// This "master" dictionary ensures every instrument has practical EQ cards (boost/cut advice)
const INSTRUMENT_EQ_LOOKUP: Record<string, EQBand[]> = {
  'Vocals': [
    { frequency: '100-160 Hz', description: 'Add warmth. Cut for muddiness.', action: 'cut', category: 'bass' },
    { frequency: '250-350 Hz', description: 'Boxiness. Cut if vocals sound "cloudy."', action: 'cut', category: 'low-mid' },
    { frequency: '3-5 kHz', description: 'Clarity & presence. Boost for intelligibility.', action: 'boost', category: 'high-mid' },
    { frequency: '6-8 kHz', description: 'Air & shine. Boost gently for brightness.', action: 'boost', category: 'presence' },
    { frequency: '8-12 kHz', description: 'Sibilance. Cut if harsh or piercing.', action: 'cut', category: 'air' }
  ],
  'Male vocals': [
    { frequency: '120-180 Hz', description: 'Fullness/warmth. Boost or cut to taste.', action: 'boost', category: 'bass' },
    { frequency: '200-350 Hz', description: 'Mud. Cut here if needed.', action: 'cut', category: 'low-mid' },
    { frequency: '3-5 kHz', description: 'Presence & clarity.', action: 'boost', category: 'high-mid' }
  ],
  'Female vocals': [
    { frequency: '200 Hz', description: 'Fullness. Boost slightly for body.', action: 'boost', category: 'bass' },
    { frequency: '4-7 kHz', description: 'Presence & air.', action: 'boost', category: 'presence' },
    { frequency: '8-12 kHz', description: 'Sibilance. Cut if excessive.', action: 'cut', category: 'air' }
  ],
  'Kick drum': [
    { frequency: '30-60 Hz', description: 'Sub & punch. Boost for low end.', action: 'boost', category: 'sub' },
    { frequency: '100-150 Hz', description: 'Body. Boost/cut for thickness.', action: 'boost', category: 'bass' },
    { frequency: '300-500 Hz', description: 'Boxiness. Cut for clarity.', action: 'cut', category: 'low-mid' },
    { frequency: '2-4 kHz', description: 'Attack/click. Boost for beater.', action: 'boost', category: 'high-mid' }
  ],
  'Snare': [
    { frequency: '150-250 Hz', description: 'Body. Boost for fullness.', action: 'boost', category: 'bass' },
    { frequency: '400-800 Hz', description: 'Boxiness/ring. Cut for clarity.', action: 'cut', category: 'mid' },
    { frequency: '1.5-3 kHz', description: 'Attack/crack. Boost for snap.', action: 'boost', category: 'high-mid' },
    { frequency: '7-12 kHz', description: 'Air. Boost for brightness.', action: 'boost', category: 'air' }
  ],
  'Bass guitar': [
    { frequency: '50-80 Hz', description: 'Fundamental. Boost for weight.', action: 'boost', category: 'sub' },
    { frequency: '120-250 Hz', description: 'Muddiness. Cut if boomy.', action: 'cut', category: 'bass' },
    { frequency: '700-1.2 kHz', description: 'Growl/attack. Boost for definition.', action: 'boost', category: 'mid' },
    { frequency: '2-5 kHz', description: 'Presence. Boost to cut through.', action: 'boost', category: 'high-mid' }
  ],
  'Guitar': [
    { frequency: '80-120 Hz', description: 'Body. Boost for fullness.', action: 'boost', category: 'bass' },
    { frequency: '250-350 Hz', description: 'Boxiness. Cut if muddy.', action: 'cut', category: 'low-mid' },
    { frequency: '2-5 kHz', description: 'Presence/attack. Boost for bite.', action: 'boost', category: 'high-mid' },
    { frequency: '8-12 kHz', description: 'Air. Boost for sparkle.', action: 'boost', category: 'air' }
  ],
  'Acoustic guitar': [
    { frequency: '80-120 Hz', description: 'Warmth. Boost for body.', action: 'boost', category: 'bass' },
    { frequency: '200-350 Hz', description: 'Mud/boxiness. Cut for clarity.', action: 'cut', category: 'low-mid' },
    { frequency: '2-4 kHz', description: 'Attack/brightness.', action: 'boost', category: 'high-mid' },
    { frequency: '10-16 kHz', description: 'Air. Boost for shimmer.', action: 'boost', category: 'air' }
  ],
  'Piano': [
    { frequency: '80-120 Hz', description: 'Body. Boost for fullness.', action: 'boost', category: 'bass' },
    { frequency: '300-500 Hz', description: 'Mud. Cut for clarity.', action: 'cut', category: 'low-mid' },
    { frequency: '2-5 kHz', description: 'Attack. Boost for definition.', action: 'boost', category: 'high-mid' }
  ],
  'Cymbals': [
    { frequency: '200-500 Hz', description: 'Muddiness. Cut here.', action: 'cut', category: 'low-mid' },
    { frequency: '5-8 kHz', description: 'Brightness. Boost for sizzle.', action: 'boost', category: 'presence' },
    { frequency: '10-16 kHz', description: 'Air. Boost for sheen.', action: 'boost', category: 'air' }
  ],
  'Hi-hats': [
    { frequency: '6-8 kHz', description: 'Brilliance. Boost here.', action: 'boost', category: 'presence' },
    { frequency: '10-14 kHz', description: 'Air. Boost for shimmer.', action: 'boost', category: 'air' }
  ],
  'Sub bass': [
    { frequency: '20-60 Hz', description: 'Fundamental. Boost for power.', action: 'boost', category: 'sub' },
    { frequency: '80-120 Hz', description: 'Cut to avoid muddiness.', action: 'cut', category: 'bass' }
  ],
  '808s': [
    { frequency: '30-60 Hz', description: 'Thump. Boost for power.', action: 'boost', category: 'sub' },
    { frequency: '100-250 Hz', description: 'Overtones. Cut for clarity.', action: 'cut', category: 'bass' }
  ],
  'Synth bass': [
    { frequency: '40-80 Hz', description: 'Weight. Boost for fullness.', action: 'boost', category: 'sub' },
    { frequency: '200-400 Hz', description: 'Mud. Cut if too thick.', action: 'cut', category: 'low-mid' }
  ],
  'Strings': [
    { frequency: '200-350 Hz', description: 'Warmth. Boost for fullness.', action: 'boost', category: 'low-mid' },
    { frequency: '1.5-3 kHz', description: 'Presence. Boost for detail.', action: 'boost', category: 'high-mid' },
    { frequency: '8-12 kHz', description: 'Air. Boost for space.', action: 'boost', category: 'air' }
  ],
  'Room mics': [
    { frequency: '80-120 Hz', description: 'Body. Boost for warmth.', action: 'boost', category: 'bass' },
    { frequency: '1-2 kHz', description: 'Boxiness. Cut for space.', action: 'cut', category: 'mid' },
    { frequency: '8-12 kHz', description: 'Air. Boost for openness.', action: 'boost', category: 'air' }
  ],
  'Drums': [
    { frequency: '60-80 Hz', description: 'Punch. Boost for energy.', action: 'boost', category: 'bass' },
    { frequency: '250-400 Hz', description: 'Boxiness. Cut if muddy.', action: 'cut', category: 'low-mid' },
    { frequency: '2-4 kHz', description: 'Attack. Boost for snap.', action: 'boost', category: 'high-mid' },
    { frequency: '8-12 kHz', description: 'Air. Boost for sparkle.', action: 'boost', category: 'air' }
  ],
  'Violin': [
    { frequency: '200-400 Hz', description: 'Body. Boost for warmth.', action: 'boost', category: 'low-mid' },
    { frequency: '3-5 kHz', description: 'Presence/brightness. Boost to cut through.', action: 'boost', category: 'high-mid' },
    { frequency: '8-14 kHz', description: 'Air. Boost for shimmer.', action: 'boost', category: 'air' }
  ],
  'Cello': [
    { frequency: '100-200 Hz', description: 'Body. Boost for fullness.', action: 'boost', category: 'bass' },
    { frequency: '400-700 Hz', description: 'Warmth. Cut if muddy.', action: 'cut', category: 'mid' }
  ],
  'Tuba': [
    { frequency: '30-60 Hz', description: 'Fundamental. Boost for power.', action: 'boost', category: 'sub' },
    { frequency: '200-300 Hz', description: 'Muddiness. Cut for clarity.', action: 'cut', category: 'bass' }
  ],
  'Saxophone': [
    { frequency: '150-250 Hz', description: 'Fullness. Boost for body.', action: 'boost', category: 'bass' },
    { frequency: '800 Hz - 1.5 kHz', description: 'Honky/nasal. Cut for clarity.', action: 'cut', category: 'mid' },
    { frequency: '5-9 kHz', description: 'Presence. Boost for brightness.', action: 'boost', category: 'presence' }
  ],
  'Trumpet': [
    { frequency: '200-300 Hz', description: 'Body. Boost for warmth.', action: 'boost', category: 'bass' },
    { frequency: '1.5-4 kHz', description: 'Brilliance. Boost for presence.', action: 'boost', category: 'high-mid' }
  ],
  'Brass': [
    { frequency: '200-400 Hz', description: 'Body. Boost for fullness.', action: 'boost', category: 'bass' },
    { frequency: '1.5-4 kHz', description: 'Brilliance/presence. Boost for detail.', action: 'boost', category: 'high-mid' }
  ],
  'Woodwinds': [
    { frequency: '250-500 Hz', description: 'Body. Boost for warmth.', action: 'boost', category: 'low-mid' },
    { frequency: '1.5-4 kHz', description: 'Presence/definition.', action: 'boost', category: 'high-mid' }
  ],
  'Flute': [
    { frequency: '250-400 Hz', description: 'Body. Boost for fullness.', action: 'boost', category: 'low-mid' },
    { frequency: '3-5 kHz', description: 'Presence. Boost for brightness.', action: 'boost', category: 'high-mid' },
    { frequency: '10-14 kHz', description: 'Air. Boost for shimmer.', action: 'boost', category: 'air' }
  ],
  'All': [
    // Show everything for "All"
    ...Object.values(FREQUENCY_ZONES).flatMap((zone, i) => [
      { frequency: zone.label, description: 'See individual instruments for detailed advice.', action: 'boost', category: zone.id }
    ])
  ]
};

// For any "unknown" instrument (future-proof), show a smart fallback
const getEqCardsForInstrument = (instrument: string): EQBand[] => {
  return INSTRUMENT_EQ_LOOKUP[instrument] ||
    [
      { frequency: '100-200 Hz', description: 'Body/warmth. Boost for fullness.', action: 'boost', category: 'bass' },
      { frequency: '250-500 Hz', description: 'Mud/boxiness. Cut for clarity.', action: 'cut', category: 'low-mid' },
      { frequency: '2-4 kHz', description: 'Presence. Boost for detail.', action: 'boost', category: 'high-mid' },
      { frequency: '8-14 kHz', description: 'Air/sparkle. Boost for openness.', action: 'boost', category: 'air' }
    ];
};

export const EQGuide: React.FC = () => {
  const [selectedInstrument, setSelectedInstrument] = useState('All');
  const [selectedZone, setSelectedZone] = useState('all');

  // Only show cards that match selected frequency zone (or all)
  const eqCards = getEqCardsForInstrument(selectedInstrument).filter(card =>
    selectedZone === 'all' || card.category === selectedZone
  );

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
    <div className="w-full max-w-4xl mx-auto py-8 px-2 md:px-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-3">
        <div className="flex items-center gap-2">
          <AdjustmentsHorizontalIcon className="w-7 h-7 text-orange-500" />
          <h2 className="text-2xl font-bold text-white">EQ Guide</h2>
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
            <option value="all">All Frequency Zones</option>
            {FREQUENCY_ZONES.map(zone => <option key={zone.id} value={zone.id}>{zone.label}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto" style={{ maxHeight: '70vh' }}>
        {eqCards.length === 0 ? (
          <div className="col-span-full text-gray-400 text-center py-8">No EQ data for this instrument/zone. Try another zone.</div>
        ) : (
          eqCards.map((band, index) => (
            <Card key={index} className="bg-gray-700/50 hover:bg-gray-700/70 transition-colors">
              <div className="p-4">
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
                <p className="text-gray-300 mb-1">{band.description}</p>
              </div>
            </Card>
          ))
        )}
      </div>
      <div className="pt-6 pb-2 text-center text-xs text-gray-500">
        These are general guidelines. Always trust your ears and context!
      </div>
    </div>
  );
};
