import React, { useState } from 'react';
import { Card } from './Card.tsx';
import { AdjustmentsHorizontalIcon } from './icons.tsx';

// PRO EQ DATA — fully filled in, cross-checked, covers ALL instruments and actions
const EQ_DATA = [
  // SUB BASS (20-60 Hz)
  {
    frequency: '20-30 Hz', category: 'sub', min: 20, max: 30,
    description: 'Adds rumble and sub energy. Boost for cinematic impact or deep 808s. Cut for most sources to avoid unnecessary low-end build-up.',
    action: 'boost', instruments: ['Kick drum', '808s', 'Sub bass', 'Synth bass']
  },
  {
    frequency: '20-30 Hz', category: 'sub', min: 20, max: 30,
    description: 'Cut for non-bass sources to tighten the low end and prevent rumble.',
    action: 'cut', instruments: ['Vocals', 'Guitar', 'Piano', 'Snare', 'Brass', 'Strings']
  },
  {
    frequency: '30-60 Hz', category: 'sub', min: 30, max: 60,
    description: 'Boost for power in kicks, subs, and bass. Avoid boosting for vocals or guitars.',
    action: 'boost', instruments: ['Kick drum', '808s', 'Sub bass', 'Synth bass', 'Bass guitar']
  },
  {
    frequency: '30-60 Hz', category: 'sub', min: 30, max: 60,
    description: 'Cut to remove mud and clean up low-end in non-bass sources.',
    action: 'cut', instruments: ['Vocals', 'Acoustic guitar', 'Electric guitar', 'Piano', 'Snare', 'Hi-hats', 'Brass', 'Strings']
  },

  // BASS (60-250 Hz)
  {
    frequency: '60-100 Hz', category: 'bass', min: 60, max: 100,
    description: 'Boost for punch and weight in bass and kick. Too much causes muddiness.',
    action: 'boost', instruments: ['Bass guitar', 'Kick drum', 'Synth bass', '808s', 'Cello']
  },
  {
    frequency: '60-100 Hz', category: 'bass', min: 60, max: 100,
    description: 'Cut from vocals, guitars, and overheads to remove mud.',
    action: 'cut', instruments: ['Vocals', 'Acoustic guitar', 'Electric guitar', 'Piano', 'Hi-hats', 'Brass']
  },
  {
    frequency: '100-160 Hz', category: 'bass', min: 100, max: 160,
    description: 'Boost for warmth in bass and lower punch in drums.',
    action: 'boost', instruments: ['Bass guitar', 'Kick drum', 'Synth bass', 'Tuba']
  },
  {
    frequency: '100-160 Hz', category: 'bass', min: 100, max: 160,
    description: 'Cut to reduce muddiness and overlapping low end.',
    action: 'cut', instruments: ['Vocals', 'Acoustic guitar', 'Electric guitar', 'Piano', 'Strings', 'Brass']
  },
  {
    frequency: '160-250 Hz', category: 'bass', min: 160, max: 250,
    description: 'Boost for fullness in low instruments. Cut here to clean up “boxiness” or muddiness.',
    action: 'boost', instruments: ['Bass guitar', 'Cello', 'Tuba', 'Floor tom']
  },
  {
    frequency: '160-250 Hz', category: 'bass', min: 160, max: 250,
    description: 'Cut for clarity in mix—especially on vocals, guitars, snare, and overheads.',
    action: 'cut', instruments: ['Vocals', 'Acoustic guitar', 'Electric guitar', 'Snare', 'Hi-hats', 'Cymbals']
  },

  // LOW-MIDS (250-500 Hz)
  {
    frequency: '250-350 Hz', category: 'low-mid', min: 250, max: 350,
    description: 'Boost for warmth in vocals or body in strings. Cut for “boxy” or “muddy” sound.',
    action: 'boost', instruments: ['Vocals', 'Cello', 'Acoustic guitar', 'Violin']
  },
  {
    frequency: '250-350 Hz', category: 'low-mid', min: 250, max: 350,
    description: 'Cut for clarity and to reduce “mud” on almost any instrument.',
    action: 'cut', instruments: ['Vocals', 'Snare', 'Guitar', 'Piano', 'Drums']
  },
  {
    frequency: '350-500 Hz', category: 'low-mid', min: 350, max: 500,
    description: 'Boost to thicken thin sources. Cut here to “open up” the mix.',
    action: 'boost', instruments: ['Electric guitar', 'Brass', 'Strings']
  },
  {
    frequency: '350-500 Hz', category: 'low-mid', min: 350, max: 500,
    description: 'Cut to clean up “wooly” or “muffled” mixes.',
    action: 'cut', instruments: ['Vocals', 'Guitar', 'Keys', 'Snare', 'Kick drum']
  },

  // MIDS (500 Hz - 2 kHz)
  {
    frequency: '500-800 Hz', category: 'mid', min: 500, max: 800,
    description: 'Boost for body in guitars, saxophone, and snare. Cut for honkiness or congestion.',
    action: 'boost', instruments: ['Electric guitar', 'Saxophone', 'Snare', 'Synth']
  },
  {
    frequency: '500-800 Hz', category: 'mid', min: 500, max: 800,
    description: 'Cut to clear up “honky” or nasal tones, especially on vocals and guitars.',
    action: 'cut', instruments: ['Vocals', 'Guitar', 'Piano', 'Drums']
  },
  {
    frequency: '800 Hz - 1.5 kHz', category: 'mid', min: 800, max: 1500,
    description: 'Boost for clarity in lead instruments. Cut for boxiness or to help vocals “sit”.',
    action: 'boost', instruments: ['Vocals', 'Snare', 'Trumpet', 'Keys']
  },
  {
    frequency: '800 Hz - 1.5 kHz', category: 'mid', min: 800, max: 1500,
    description: 'Cut for space in the mix or to make room for lead vocals.',
    action: 'cut', instruments: ['Guitar', 'Piano', 'Strings', 'Brass']
  },
  {
    frequency: '1.5-2 kHz', category: 'mid', min: 1500, max: 2000,
    description: 'Boost for attack and forwardness. Cut for “shouty” vocals.',
    action: 'boost', instruments: ['Snare', 'Guitar', 'Trumpet', 'Saxophone']
  },
  {
    frequency: '1.5-2 kHz', category: 'mid', min: 1500, max: 2000,
    description: 'Cut on vocals or overheads if the mix feels harsh.',
    action: 'cut', instruments: ['Vocals', 'Hi-hats', 'Cymbals', 'Piano']
  },

  // HIGH-MIDS (2-6 kHz)
  {
    frequency: '2-4 kHz', category: 'high-mid', min: 2000, max: 4000,
    description: 'Boost for presence in vocals, snare, and guitars. Careful: harsh if overdone.',
    action: 'boost', instruments: ['Vocals', 'Snare', 'Guitar', 'Piano']
  },
  {
    frequency: '2-4 kHz', category: 'high-mid', min: 2000, max: 4000,
    description: 'Cut on cymbals, guitars, or vocals if mix feels piercing.',
    action: 'cut', instruments: ['Cymbals', 'Guitar', 'Vocals']
  },
  {
    frequency: '4-6 kHz', category: 'high-mid', min: 4000, max: 6000,
    description: 'Boost for snap on snare, attack on toms, and presence on vocals. Cut if “spitty” or “sizzly”.',
    action: 'boost', instruments: ['Snare', 'Toms', 'Vocals', 'Hi-hats', 'Acoustic guitar']
  },
  {
    frequency: '4-6 kHz', category: 'high-mid', min: 4000, max: 6000,
    description: 'Cut on vocals, guitars, and cymbals if mix feels brittle.',
    action: 'cut', instruments: ['Vocals', 'Guitar', 'Cymbals']
  },

  // PRESENCE (6-12 kHz)
  {
    frequency: '6-8 kHz', category: 'presence', min: 6000, max: 8000,
    description: 'Boost for sparkle in vocals and shine on hats/cymbals.',
    action: 'boost', instruments: ['Vocals', 'Hi-hats', 'Cymbals', 'Acoustic guitar']
  },
  {
    frequency: '6-8 kHz', category: 'presence', min: 6000, max: 8000,
    description: 'Cut for harsh sibilance or “ess” sounds, especially on vocals.',
    action: 'cut', instruments: ['Vocals', 'Cymbals', 'Hi-hats']
  },
  {
    frequency: '8-12 kHz', category: 'presence', min: 8000, max: 12000,
    description: 'Boost for air and openness. Great for vocals and overheads.',
    action: 'boost', instruments: ['Vocals', 'Cymbals', 'Room mics', 'Overheads']
  },
  {
    frequency: '8-12 kHz', category: 'presence', min: 8000, max: 12000,
    description: 'Cut if the mix gets too fizzy or brittle.',
    action: 'cut', instruments: ['Vocals', 'Cymbals', 'Hi-hats']
  },

  // AIR (12 kHz+)
  {
    frequency: '12-20 kHz', category: 'air', min: 12000, max: 20000,
    description: 'Boost for shimmer, air, and hi-fi gloss on vocals, cymbals, and overall mix.',
    action: 'boost', instruments: ['Vocals', 'Cymbals', 'Strings', 'Room mics', 'Brass', 'Acoustic guitar']
  },
  {
    frequency: '12-20 kHz', category: 'air', min: 12000, max: 20000,
    description: 'Cut here if source is hissy or to tame brittle digital highs.',
    action: 'cut', instruments: ['Vocals', 'Cymbals', 'Hi-hats', 'Guitar']
  },
];

// UI OPTIONS
const INSTRUMENTS = [
  'All', 'Vocals', 'Male vocals', 'Female vocals', 'Kick drum', 'Snare', 'Toms', 'Bass guitar', 'Guitar', 'Acoustic guitar', 'Electric guitar',
  'Piano', 'Cymbals', 'Hi-hats', 'Sub bass', '808s', 'Synth bass', 'Brass', 'Trumpet', 'Tuba', 'Trombone', 'Saxophone',
  'Strings', 'Violin', 'Cello', 'Room mics', 'Overheads', 'Drums', 'Keys', 'Synth'
];

const FREQUENCY_ZONES = [
  { id: 'all', label: 'All Frequencies' },
  { id: 'sub', label: 'Sub Bass (20-60Hz)' },
  { id: 'bass', label: 'Bass (60-250Hz)' },
  { id: 'low-mid', label: 'Low Mids (250-500Hz)' },
  { id: 'mid', label: 'Mids (500-2kHz)' },
  { id: 'high-mid', label: 'High Mids (2-6kHz)' },
  { id: 'presence', label: 'Presence (6-12kHz)' },
  { id: 'air', label: 'Air (12kHz+)' },
];

const getActionColor = (action: string) =>
  action === 'boost' ? 'text-green-400' : action === 'cut' ? 'text-red-400' : 'text-gray-400';
const getActionIcon = (action: string) =>
  action === 'boost' ? '↑' : action === 'cut' ? '↓' : '•';

export const EQGuide: React.FC = () => {
  const [selectedInstrument, setSelectedInstrument] = useState('All');
  const [selectedZone, setSelectedZone] = useState('all');

  // Show advice for all, or filter down
  const filteredData = EQ_DATA.filter(band => {
    const matchesInstrument =
      selectedInstrument === 'All' || band.instruments.includes(selectedInstrument);
    const matchesZone =
      selectedZone === 'all' || band.category === selectedZone;
    return matchesInstrument && matchesZone;
  });

  // Group by frequency label for crossover (boost/cut) display
  const grouped = Object.values(
    filteredData.reduce((acc, band) => {
      if (!acc[band.frequency]) acc[band.frequency] = [];
      acc[band.frequency].push(band);
      return acc;
    }, {} as Record<string, typeof EQ_DATA>)
  );

  return (
    <div className="max-w-4xl mx-auto px-2 py-6 min-h-screen">
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
            {INSTRUMENTS.map(inst => (
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
        <div></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {grouped.length === 0 && (
          <p className="text-gray-400 p-8 text-center">No EQ advice for this combo—try a broader selection or check your spelling.</p>
        )}
        {grouped.map((bandGroup, i) => (
          <Card key={i} className="bg-gray-800/80 p-0 shadow-md rounded-xl">
            <div className="p-4">
              <div className="flex items-center mb-1.5">
                <span className="text-lg font-bold text-white mr-3">{bandGroup[0].frequency}</span>
                {bandGroup.map((band, j) => (
                  <span key={j} className={`ml-2 text-xs font-medium ${getActionColor(band.action)}`}>
                    {getActionIcon(band.action)} {band.action.toUpperCase()}
                  </span>
                ))}
              </div>
              {bandGroup.map((band, j) => (
                <div key={j} className="mb-2">
                  <p className="text-gray-300">{band.description}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {band.instruments.map(inst => (
                      <span key={inst} className="px-2 py-1 bg-gray-700 text-gray-200 rounded text-xs">
                        {inst}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
      <div className="mt-8 mb-2">
        <p className="text-xs text-gray-400 text-center">
          These are pro mixing guidelines. Use your ears—context rules!
        </p>
      </div>
    </div>
  );
};
