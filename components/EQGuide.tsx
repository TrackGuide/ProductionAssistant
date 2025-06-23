import React, { useState } from 'react';
import { Card } from './Card.tsx';
import { Button } from './Button.tsx';
import { AdjustmentsHorizontalIcon } from './icons.tsx'; 

// === Pro-level EQ Data (full coverage, crossovers, all instruments) ===
const EQ_DATA = [
  // ---- Sub Bass ----
  {
    frequency: '20-30 Hz', category: 'sub', min: 20, max: 30,
    description: 'Extreme sub-bass rumble. Rarely useful except for cinematic or sub-heavy genres.',
    action: 'cut', instruments: ['Kick drum', 'Sub bass', '808s', 'Synth bass']
  },
  {
    frequency: '30-50 Hz', category: 'sub', min: 30, max: 50,
    description: 'Deep low-end power. Adds weight, but too much = flabbiness.',
    action: 'boost', instruments: ['Kick drum', 'Sub bass', 'Bass guitar', '808s']
  },
  {
    frequency: '50-60 Hz', category: 'sub', min: 50, max: 60,
    description: 'Bass punch and fullness. Defines the "bottom" of mix.',
    action: 'boost', instruments: ['Kick drum', 'Bass guitar', 'Sub bass', 'Synths']
  },

  // ---- Bass ----
  {
    frequency: '60-100 Hz', category: 'bass', min: 60, max: 100,
    description: 'Bass body and tone. Core of bass instruments. Too much = boom.',
    action: 'boost', instruments: ['Bass guitar', 'Kick drum', 'Synth bass', 'Cello']
  },
  {
    frequency: '100-160 Hz', category: 'bass', min: 100, max: 160,
    description: 'Low warmth. Helps glue bass + low mids. Overdone = muddiness.',
    action: 'cut', instruments: ['Bass guitar', 'Piano', 'Guitar', 'Vocals', 'Drums']
  },
  {
    frequency: '160-250 Hz', category: 'bass', min: 160, max: 250,
    description: 'Upper bass/low mid overlap. Often cut to clean mud.',
    action: 'cut', instruments: ['Bass guitar', 'Vocals', 'Strings', 'Brass']
  },

  // ---- Low Mids ----
  {
    frequency: '250-350 Hz', category: 'low-mid', min: 250, max: 350,
    description: 'Boxiness / wool. Can cloud guitars & vocals.',
    action: 'cut', instruments: ['Vocals', 'Guitar', 'Piano', 'Snare']
  },
  {
    frequency: '350-500 Hz', category: 'low-mid', min: 350, max: 500,
    description: 'Warmth vs. mud. Boost for body, cut for clarity.',
    action: 'cut', instruments: ['Vocals', 'Snare', 'Guitar', 'Keys']
  },

  // ---- Mids ----
  {
    frequency: '500-800 Hz', category: 'mid', min: 500, max: 800,
    description: 'Core midrange — thickness and presence. Often cluttered.',
    action: 'cut', instruments: ['Vocals', 'Guitar', 'Snare', 'Keys']
  },
  {
    frequency: '800 Hz - 1.5 kHz', category: 'mid', min: 800, max: 1500,
    description: 'Body and clarity. Essential for definition.',
    action: 'boost', instruments: ['Vocals', 'Guitar', 'Piano', 'Snare']
  },
  {
    frequency: '1.5-2 kHz', category: 'mid', min: 1500, max: 2000,
    description: 'Presence and attack. Boost for definition.',
    action: 'boost', instruments: ['Vocals', 'Snare', 'Guitar']
  },

  // ---- High Mids ----
  {
    frequency: '2-3 kHz', category: 'high-mid', min: 2000, max: 3000,
    description: 'Vocal clarity and edge. Boost carefully.',
    action: 'boost', instruments: ['Vocals', 'Snare', 'Guitar', 'Piano']
  },
  {
    frequency: '3-5 kHz', category: 'high-mid', min: 3000, max: 5000,
    description: 'Presence, bite, intelligibility. Too much = harsh.',
    action: 'cut', instruments: ['Vocals', 'Snare', 'Cymbals']
  },

  // ---- Presence ----
  {
    frequency: '5-8 kHz', category: 'presence', min: 5000, max: 8000,
    description: 'Detail and sparkle. Brings life, but sibilant if overdone.',
    action: 'boost', instruments: ['Vocals', 'Hi-hats', 'Acoustic guitar', 'Cymbals']
  },

  // ---- Air ----
  {
    frequency: '8-12 kHz', category: 'air', min: 8000, max: 12000,
    description: 'Air and openness. Adds space.',
    action: 'boost', instruments: ['Vocals', 'Strings', 'Cymbals', 'Room mics']
  },
  {
    frequency: '12-20 kHz', category: 'air', min: 12000, max: 20000,
    description: 'Extreme highs. Use for shimmer.',
    action: 'boost', instruments: ['Cymbals', 'Room mics', 'Vocals']
  },

  // --- Male Vocals (real pro advice) ---
  {
    frequency: '80-200 Hz', category: 'bass', min: 80, max: 200,
    description: 'Cut gently to reduce muddiness and low-end buildup.',
    action: 'cut', instruments: ['Male vocals']
  },
  {
    frequency: '200-400 Hz', category: 'low-mid', min: 200, max: 400,
    description: 'Boost lightly for body, cut if vocals sound boxy.',
    action: 'boost', instruments: ['Male vocals']
  },
  {
    frequency: '1-2 kHz', category: 'mid', min: 1000, max: 2000,
    description: 'Boost for presence and clarity, helping vocals cut through the mix.',
    action: 'boost', instruments: ['Male vocals']
  },
  {
    frequency: '4-6 kHz', category: 'high-mid', min: 4000, max: 6000,
    description: 'Boost for air and articulation, but watch out for harshness.',
    action: 'boost', instruments: ['Male vocals']
  },

  // --- Female Vocals (real pro advice) ---
  {
    frequency: '100-250 Hz', category: 'bass', min: 100, max: 250,
    description: 'Cut to reduce any muddiness. Female vocals rarely need low-end boosting.',
    action: 'cut', instruments: ['Female vocals']
  },
  {
    frequency: '400-800 Hz', category: 'mid', min: 400, max: 800,
    description: 'Boost for warmth and body, but cut if vocals sound “boxy”.',
    action: 'boost', instruments: ['Female vocals']
  },
  {
    frequency: '2-4 kHz', category: 'high-mid', min: 2000, max: 4000,
    description: 'Boost for presence, articulation, and “forward” vocals.',
    action: 'boost', instruments: ['Female vocals']
  },
  {
    frequency: '7-10 kHz', category: 'presence', min: 7000, max: 10000,
    description: 'Boost for air and breathiness, cut if sibilant (“ess” sounds).',
    action: 'boost', instruments: ['Female vocals']
  },
  {
    frequency: '7-10 kHz', category: 'presence', min: 7000, max: 10000,
    description: 'Cut to control sibilance if vocals are too “essy”.',
    action: 'cut', instruments: ['Female vocals']
  },

  // --- Saxophone Example (crossovers) ---
  {
    frequency: '200-400 Hz', category: 'low-mid', min: 200, max: 400,
    description: 'Boost for warmth, fullness.',
    action: 'boost', instruments: ['Saxophone']
  },
  {
    frequency: '1-2 kHz', category: 'mid', min: 1000, max: 2000,
    description: 'Boost for body and presence.',
    action: 'boost', instruments: ['Saxophone']
  },
  {
    frequency: '3-5 kHz', category: 'high-mid', min: 3000, max: 5000,
    description: 'Cut to tame harshness or reed noise.',
    action: 'cut', instruments: ['Saxophone']
  },
  {
    frequency: '8-12 kHz', category: 'air', min: 8000, max: 12000,
    description: 'Boost for air and shine.',
    action: 'boost', instruments: ['Saxophone']
  },

  // -- More instruments with pro data here --
];

// === Dropdown data and category colors ===
const INSTRUMENTS = [
  'All', 'Vocals', 'Male vocals', 'Female vocals', 'Kick drum', 'Snare', 'Bass guitar', 'Guitar', 'Acoustic guitar', 'Piano',
  'Cymbals', 'Hi-hats', 'Sub bass', '808s', 'Synth bass', 'Horns', 'Strings', 'Room mics', 'Drums',
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

// === Visual Frequency Spectrum Bar ===
function SpectrumBar({ min, max }: { min: number, max: number }) {
  // Normalize to 20-20,000Hz log scale for display
  const left = 100 * (Math.log10(min) - Math.log10(20)) / (Math.log10(20000) - Math.log10(20));
  const right = 100 * (Math.log10(max) - Math.log10(20)) / (Math.log10(20000) - Math.log10(20));
  return (
    <div className="relative h-2 w-full bg-gray-900 rounded-full my-2">
      <div
        className="absolute h-2 rounded-full bg-orange-500 transition-all"
        style={{
          left: `${left}%`,
          width: `${Math.max(right - left, 3)}%`
        }}
      ></div>
    </div>
  );
}

// === Main Component ===
export const EQGuide: React.FC = () => {
  const [selectedInstrument, setSelectedInstrument] = useState('All');
  const [selectedZone, setSelectedZone] = useState('all');

  // --- Filtering ---
  const filteredData = EQ_DATA.filter(band => {
    // Filter by zone (unless "all")
    const matchesZone = selectedZone === 'all' || band.category === selectedZone;
    // Filter by instrument (unless "All")
    const matchesInstrument = selectedInstrument === 'All' || band.instruments.includes(selectedInstrument);
    // Crossovers: if zone selected but no instrument, show all (so both boost & cut show up)
    return matchesZone && (selectedInstrument === 'All' ? true : matchesInstrument);
  });

  // Helper: what instruments for this card
  const allInstrumentsForBand = (band) => {
    return EQ_DATA
      .filter(b => b.frequency === band.frequency && b.category === band.category && b.action === band.action)
      .flatMap(b => b.instruments)
      .filter((v, i, arr) => arr.indexOf(v) === i); // Dedup
  };

  // --- Render ---
  return (
    <div className="max-w-4xl mx-auto w-full py-8 px-4 md:px-0">
      <div className="flex flex-wrap gap-6 mb-6 items-end">
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-bold text-gray-400 mb-1">Instrument</label>
          <select
            value={selectedInstrument}
            onChange={e => setSelectedInstrument(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100"
          >
            <option disabled>Vocals</option>
            <option value="Vocals">Vocals (general)</option>
            <option value="Male vocals">Male vocals</option>
            <option value="Female vocals">Female vocals</option>
            <option disabled>Rhythm Section</option>
            <option value="Kick drum">Kick drum</option>
            <option value="Snare">Snare</option>
            <option value="Bass guitar">Bass guitar</option>
            <option value="808s">808s</option>
            <option value="Sub bass">Sub bass</option>
            <option value="Synth bass">Synth bass</option>
            <option value="Drums">Drums</option>
            <option disabled>Other Instruments</option>
            <option value="Guitar">Guitar</option>
            <option value="Acoustic guitar">Acoustic guitar</option>
            <option value="Piano">Piano</option>
            <option value="Cymbals">Cymbals</option>
            <option value="Hi-hats">Hi-hats</option>
            <option value="Horns">Horns</option>
            <option value="Strings">Strings</option>
            <option value="Room mics">Room mics</option>
            <option value="Violin">Violin</option>
            <option value="Cello">Cello</option>
            <option value="Tuba">Tuba</option>
            <option value="Saxophone">Saxophone</option>
            <option value="Trumpet">Trumpet</option>
            <option value="Brass">Brass</option>
            <option value="Woodwinds">Woodwinds</option>
            <option value="Flute">Flute</option>
            <option disabled>All/General</option>
            <option value="All">All Instruments</option>
          </select>
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-bold text-gray-400 mb-1">Frequency Range</label>
          <select
            value={selectedZone}
            onChange={e => setSelectedZone(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100"
          >
            {FREQUENCY_ZONES.map(zone => (
              <option key={zone.id} value={zone.id}>{zone.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredData.length === 0 ? (
          <Card className="bg-gray-700/80 text-center py-16">
            <p className="text-gray-300 text-lg">No EQ data matches your current filters.<br />Try another instrument or frequency zone.</p>
          </Card>
        ) : (
          filteredData.map((band, index) => (
            <Card key={index} className="bg-gray-800/80">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-white">{band.frequency}</span>
                  <span className={`text-xs font-bold rounded-full px-2 py-1 ${FREQUENCY_ZONES.find(z => z.id === band.category)?.color || 'bg-gray-600'} text-white`}>
                    {band.category.replace('-', ' ').toUpperCase()}
                  </span>
                  <span className={`ml-2 text-sm font-medium ${band.action === 'boost' ? 'text-green-400' : band.action === 'cut' ? 'text-red-400' : 'text-yellow-400'}`}>
                    {band.action === 'boost' ? '↑ BOOST' : band.action === 'cut' ? '↓ CUT' : 'NOTCH'}
                  </span>
                </div>
                <SpectrumBar min={band.min} max={band.max} />
                <p className="text-gray-300">{band.description}</p>
                <div className="flex flex-wrap gap-1 items-center">
                  <span className="text-xs font-bold text-gray-400 mr-1">Applies to:</span>
                  {allInstrumentsForBand(band).map(inst =>
                    <span key={inst} className="bg-gray-700 text-orange-200 rounded px-2 py-1 text-xs font-medium">{inst}</span>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
      <div className="text-xs text-gray-500 mt-8 text-center px-2">
        Tip: These are general guidelines—trust your ears and reference pro mixes for your genre.
      </div>
    </div>
  );
};
