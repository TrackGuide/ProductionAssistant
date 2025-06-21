import React, { useState } from 'react';
import { Card } from './Card.tsx';
import { AdjustmentsHorizontalIcon } from './icons.tsx';

// --- BEGIN PRO-LEVEL DATA ---
// (Extensive real-world EQ advice. Feel free to expand, but this covers almost everything for modern and classic production.)

interface EQBand {
  frequency: string;
  description: string;
  instruments: string[];
  action: 'boost' | 'cut' | 'notch';
  category: 'sub' | 'bass' | 'low-mid' | 'mid' | 'high-mid' | 'presence' | 'air';
}

const EQ_DATA: EQBand[] = [
  // SUB BASS
  { frequency: '20-30 Hz', description: 'Extreme sub-bass rumble. Remove for clarity except in hip hop/cinematic.', instruments: ['Kick Drum', 'Sub Bass', '808s', 'Synth Bass', 'Bass Guitar'], action: 'cut', category: 'sub' },
  { frequency: '30-50 Hz', description: 'Deepest weight. Boost for sub, cut for mud.', instruments: ['Kick Drum', 'Sub Bass', 'Bass Guitar', '808s', 'Tuba', 'Synth Bass'], action: 'boost', category: 'sub' },
  // BASS
  { frequency: '50-60 Hz', description: 'Low bass punch. Boost for energy, cut for muddiness.', instruments: ['Kick Drum', 'Bass Guitar', 'Synth Bass', '808s', 'Tuba'], action: 'boost', category: 'sub' },
  { frequency: '60-100 Hz', description: 'Bass body and tone. Boost for warmth, cut if boomy.', instruments: ['Bass Guitar', 'Kick Drum', 'Synth Bass', 'Cello', '808s', 'Tuba'], action: 'boost', category: 'bass' },
  { frequency: '80-100 Hz', description: 'Adds fullness to male vocals and brass. Careful: mud zone.', instruments: ['Male Vocals', 'Trumpet', 'Tuba', 'Saxophone'], action: 'boost', category: 'bass' },
  { frequency: '100-160 Hz', description: 'Low warmth. Boost for body, cut to reduce mud.', instruments: ['Bass Guitar', 'Piano', 'Guitar', 'Vocals', 'Drums', 'Cello'], action: 'cut', category: 'bass' },
  { frequency: '160-250 Hz', description: 'Upper bass/lower mids. Often cut for clarity.', instruments: ['Bass Guitar', 'Vocals', 'Strings', 'Brass', 'Drums', 'Guitar'], action: 'cut', category: 'bass' },
  // LOW MIDS
  { frequency: '250-350 Hz', description: 'Boxiness or warmth. Cut for clarity, boost for fullness.', instruments: ['Vocals', 'Guitar', 'Piano', 'Snare', 'Drums', 'Saxophone', 'Strings'], action: 'cut', category: 'low-mid' },
  { frequency: '300-400 Hz', description: 'Body for female vocals, warmth for woodwinds.', instruments: ['Female Vocals', 'Flute', 'Woodwinds', 'Saxophone'], action: 'boost', category: 'low-mid' },
  { frequency: '350-500 Hz', description: 'Mud and body. Boost for warmth, cut for clarity.', instruments: ['Vocals', 'Snare', 'Guitar', 'Keys', 'Brass', 'Drums'], action: 'cut', category: 'low-mid' },
  // MIDS
  { frequency: '500-800 Hz', description: 'Midrange thickness. Cut to declutter, boost for body.', instruments: ['Vocals', 'Guitar', 'Snare', 'Keys', 'Piano', 'Drums', 'Brass', 'Saxophone'], action: 'cut', category: 'mid' },
  { frequency: '800 Hz - 1.5 kHz', description: 'Definition for acoustic guitar, woodwinds, and vocals.', instruments: ['Vocals', 'Guitar', 'Piano', 'Snare', 'Acoustic Guitar', 'Flute', 'Saxophone'], action: 'boost', category: 'mid' },
  { frequency: '1.5-2 kHz', description: 'Presence and attack. Boost for bite, cut for harshness.', instruments: ['Vocals', 'Snare', 'Guitar', 'Brass', 'Saxophone', 'Tuba', 'Trumpet'], action: 'boost', category: 'mid' },
  // HIGH MIDS
  { frequency: '2-3 kHz', description: 'Vocal clarity/attack, guitar bite. Boost carefully.', instruments: ['Vocals', 'Snare', 'Guitar', 'Piano', 'Acoustic Guitar', 'Strings', 'Saxophone'], action: 'boost', category: 'high-mid' },
  { frequency: '2-4 kHz', description: 'Nasal/honky. Cut for smoothness (esp. horns/brass).', instruments: ['Vocals', 'Saxophone', 'Brass', 'Trumpet', 'Guitar'], action: 'cut', category: 'high-mid' },
  { frequency: '3-5 kHz', description: 'Presence and bite. Boost for energy, cut if harsh.', instruments: ['Vocals', 'Snare', 'Cymbals', 'Acoustic Guitar', 'Piano', 'Guitar', 'Hi-hats', 'Saxophone'], action: 'boost', category: 'high-mid' },
  // PRESENCE
  { frequency: '5-8 kHz', description: 'Air, detail, sparkle. Boost for brilliance, cut if sibilant.', instruments: ['Vocals', 'Hi-hats', 'Acoustic Guitar', 'Cymbals', 'Flute', 'Strings', 'Piano', 'Saxophone', 'Trumpet'], action: 'boost', category: 'presence' },
  { frequency: '6-7 kHz', description: 'Sibilance. Cut for harsh “S” sounds, especially vocals.', instruments: ['Vocals', 'Hi-hats', 'Acoustic Guitar', 'Cymbals', 'Saxophone'], action: 'cut', category: 'presence' },
  // AIR
  { frequency: '8-12 kHz', description: 'Air and sheen. Boost for openness, cut if brittle.', instruments: ['Vocals', 'Strings', 'Cymbals', 'Room Mics', 'Hi-hats', 'Flute', 'Trumpet', 'Piano', 'Acoustic Guitar', 'Saxophone'], action: 'boost', category: 'air' },
  { frequency: '12-20 kHz', description: 'Shimmer. Boost subtly for “expensive” gloss.', instruments: ['Cymbals', 'Room Mics', 'Vocals', 'Hi-hats', 'Flute', 'Saxophone'], action: 'boost', category: 'air' },

  // ——— INSTRUMENT-SPECIFIC ADDITIONS FOR FULL COVERAGE ———

  // Drums (general, for those who filter by "Drums")
  { frequency: '80-120 Hz', description: 'Punch for toms and snare. Boost for fullness.', instruments: ['Drums', 'Snare'], action: 'boost', category: 'bass' },
  { frequency: '180-250 Hz', description: 'Cut to reduce mud from drum bus.', instruments: ['Drums', 'Snare', 'Kick Drum'], action: 'cut', category: 'bass' },
  { frequency: '3-5 kHz', description: 'Attack and snap for snare, stick on cymbals.', instruments: ['Drums', 'Snare', 'Cymbals', 'Hi-hats'], action: 'boost', category: 'high-mid' },

  // Acoustic guitar
  { frequency: '80-120 Hz', description: 'Body and fullness for acoustic guitar.', instruments: ['Acoustic Guitar'], action: 'boost', category: 'bass' },
  { frequency: '300-500 Hz', description: 'Boxiness—cut for clarity.', instruments: ['Acoustic Guitar'], action: 'cut', category: 'low-mid' },
  { frequency: '2-3 kHz', description: 'Pluck and presence. Boost for clarity.', instruments: ['Acoustic Guitar'], action: 'boost', category: 'high-mid' },
  { frequency: '8-12 kHz', description: 'Air, string noise. Boost for shimmer.', instruments: ['Acoustic Guitar'], action: 'boost', category: 'air' },

  // Electric Guitar
  { frequency: '80-120 Hz', description: 'Low-end thump (watch out for mud).', instruments: ['Guitar'], action: 'cut', category: 'bass' },
  { frequency: '2-4 kHz', description: 'Attack and bite. Boost for cut.', instruments: ['Guitar'], action: 'boost', category: 'high-mid' },

  // Strings/Violin
  { frequency: '200-350 Hz', description: 'Warmth and body for violin/strings.', instruments: ['Violin', 'Strings'], action: 'boost', category: 'low-mid' },
  { frequency: '3-7 kHz', description: 'Definition and bow noise—boost for presence.', instruments: ['Violin', 'Strings'], action: 'boost', category: 'presence' },

  // Brass (Trumpet, Tuba, Trombone)
  { frequency: '120-180 Hz', description: 'Weight and power for brass/tuba.', instruments: ['Tuba', 'Trumpet', 'Brass'], action: 'boost', category: 'bass' },
  { frequency: '1.5-3 kHz', description: 'Edge and attack. Boost for brightness, cut for harshness.', instruments: ['Trumpet', 'Brass', 'Tuba'], action: 'boost', category: 'high-mid' },

  // Saxophone
  { frequency: '250-500 Hz', description: 'Body and warmth for sax.', instruments: ['Saxophone'], action: 'boost', category: 'low-mid' },
  { frequency: '2-3 kHz', description: 'Presence and projection. Boost for brightness.', instruments: ['Saxophone'], action: 'boost', category: 'high-mid' },
  { frequency: '7-10 kHz', description: 'Air, cut if too edgy.', instruments: ['Saxophone'], action: 'cut', category: 'air' },

  // Flute/Woodwinds
  { frequency: '300-500 Hz', description: 'Body and warmth.', instruments: ['Flute', 'Woodwinds'], action: 'boost', category: 'low-mid' },
  { frequency: '2-5 kHz', description: 'Clarity and presence.', instruments: ['Flute', 'Woodwinds'], action: 'boost', category: 'presence' },
  { frequency: '8-12 kHz', description: 'Air and breathiness.', instruments: ['Flute', 'Woodwinds'], action: 'boost', category: 'air' },
];

const INSTRUMENTS = [
  'All', 'Vocals', 'Male Vocals', 'Female Vocals', 'Kick Drum', 'Snare', 'Bass Guitar', 'Guitar', 'Acoustic Guitar', 'Piano',
  'Cymbals', 'Hi-hats', 'Sub Bass', '808s', 'Synth Bass', 'Horns', 'Strings', 'Violin', 'Cello', 'Tuba', 'Saxophone', 'Trumpet',
  'Brass', 'Woodwinds', 'Flute', 'Room Mics', 'Drums'
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

// --- END DATA ---

const groupBandsByAction = (bands: EQBand[]) => {
  // Groups by frequency/desc/category, then action
  const actionMap: Record<string, Record<string, EQBand>> = {};
  for (const band of bands) {
    const key = `${band.frequency}__${band.category}__${band.description}`;
    if (!actionMap[band.action]) actionMap[band.action] = {};
    if (!actionMap[band.action][key]) {
      actionMap[band.action][key] = { ...band, instruments: [] };
    }
    actionMap[band.action][key].instruments.push(...band.instruments);
  }
  return actionMap;
};

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

export const EQGuide: React.FC = () => {
  const [selectedInstrument, setSelectedInstrument] = useState('All');
  const [selectedZone, setSelectedZone] = useState('all');

  // Filter by freq zone and instrument
  const filteredData = EQ_DATA.filter(band => {
    const matchesZone = selectedZone === 'all' || band.category === selectedZone;
    if (selectedInstrument === 'All') return matchesZone;
    return matchesZone && band.instruments.includes(selectedInstrument);
  });

  // When "All" instruments, group cards by (frequency+desc+zone), and by action
  let displayCards: any[] = [];
  if (selectedInstrument === 'All') {
    const actionMap = groupBandsByAction(filteredData);
    for (const action of Object.keys(actionMap)) {
      for (const key of Object.keys(actionMap[action])) {
        displayCards.push({
          ...actionMap[action][key],
          action,
        });
      }
    }
    displayCards.sort((a, b) => {
      const order = FREQUENCY_ZONES.map(z => z.id);
      return order.indexOf(a.category) - order.indexOf(b.category);
    });
  } else {
    displayCards = filteredData;
  }

  return (
    <div className="max-w-5xl mx-auto py-6 px-2 md:px-8">
      <div className="flex items-center mb-6">
        <AdjustmentsHorizontalIcon className="w-7 h-7 mr-3 text-orange-500" />
        <h2 className="text-3xl font-bold text-white">EQ Cheat Sheet</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-7">
        <div>
          <label className="block text-xs font-bold text-orange-400 uppercase mb-1.5 tracking-wide">Instrument</label>
          <select 
            value={selectedInstrument}
            onChange={e => setSelectedInstrument(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100"
          >
            {INSTRUMENTS.map(inst => (
              <option key={inst} value={inst}>{inst}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-orange-400 uppercase mb-1.5 tracking-wide">Frequency Zone</label>
          <select 
            value={selectedZone}
            onChange={e => setSelectedZone(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100"
          >
            {FREQUENCY_ZONES.map(zone => (
              <option key={zone.id} value={zone.id}>{zone.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-4">
        {displayCards.length === 0 ? (
          <Card className="bg-gray-700/70 text-center p-10">
            <p className="text-gray-300">No frequency recommendations for this instrument/zone. Try another filter!</p>
          </Card>
        ) : (
          displayCards.map((band, index) => (
            <Card key={index} className="bg-gray-700/70">
              <div className="p-4">
                <div className="flex items-center mb-1.5">
                  <span className="text-lg font-bold text-white mr-3">{band.frequency}</span>
                  <span className={`text-sm font-medium ${getActionColor(band.action)}`}>
                    {getActionIcon(band.action)} {band.action.toUpperCase()}
                  </span>
                  <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${FREQUENCY_ZONES.find(z => z.id ===
