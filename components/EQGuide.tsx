import React, { useState } from 'react';
import { Card } from './Card.tsx';
import { EQ_INSTRUMENT_ADVICE } from '../constants/eqInstrumentAdvice';

// === Main Component ===
export const EQGuide: React.FC = () => {
  const [selectedInstrument, setSelectedInstrument] = useState('All');
  const [selectedZone, setSelectedZone] = useState('all');

  // --- General EQ Guidance for Default View ---
  const generalEQGuidance = [
    {
      frequencyRange: '20-60 Hz (Sub Bass)',
      action: 'High-pass filter',
      description: 'Remove subsonic rumble and unwanted low-end build-up. Most instruments don\'t need content below 40-60 Hz.',
      zoneId: 'sub'
    },
    {
      frequencyRange: '60-250 Hz (Bass)',
      action: 'Shape with care',
      description: 'Foundation of your mix. Boost for warmth and fullness, cut to reduce muddiness. Critical for kick drums and bass instruments.',
      zoneId: 'bass'
    },
    {
      frequencyRange: '250-500 Hz (Low Mids)',
      action: 'Often cut',
      description: 'Common problem area. Often causes "boxiness" or "muddiness." Light cuts here can clean up your mix significantly.',
      zoneId: 'low-mid'
    },
    {
      frequencyRange: '500 Hz-2 kHz (Mids)',
      action: 'Balance carefully',
      description: 'Core of most instruments. Cuts can make things sound distant, boosts bring instruments forward in the mix.',
      zoneId: 'mid'
    },
    {
      frequencyRange: '2-6 kHz (High Mids)',
      action: 'Clarity & presence',
      description: 'Critical for vocal clarity and instrument definition. Boost for presence, cut to reduce harshness.',
      zoneId: 'high-mid'
    },
    {
      frequencyRange: '6-12 kHz (Presence)',
      action: 'Add brightness',
      description: 'Adds clarity and attack to instruments. Boost for more "bite," cut to smooth harsh elements.',
      zoneId: 'presence'
    },
    {
      frequencyRange: '12 kHz+ (Air)',
      action: 'Gentle enhancement',
      description: 'Adds "air" and openness to your mix. Subtle high-shelf boosts can make mixes sound more polished.',
      zoneId: 'air'
    }
  ];

  // --- Filtering ---
  const showGeneralView = selectedInstrument === 'All' && selectedZone === 'all';
  
  // Filter by instrument and frequency zone for detailed view
  const filteredInstrumentAdvice = showGeneralView ? [] : EQ_INSTRUMENT_ADVICE.filter(advice => {
    const matchesInstrument = selectedInstrument === 'All' || advice.instrument === selectedInstrument;
    const matchesZone = selectedZone === 'all' || advice.frequencyRange.toLowerCase().includes(FREQUENCY_ZONES.find(z => z.id === selectedZone)?.label.split(' ')[0].toLowerCase() || '');
    return matchesInstrument && matchesZone;
  });

  // Filter general guidance by zone if needed
  const filteredGeneralGuidance = selectedZone === 'all' ? generalEQGuidance : generalEQGuidance.filter(guidance => guidance.zoneId === selectedZone);

  // --- Render ---
  return (
    <div className="max-w-6xl mx-auto w-full py-8 px-4 md:px-0">
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

      {/* Instrument-specific EQ advice cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {showGeneralView ? (
          // Show general EQ guidance for default view
          filteredGeneralGuidance.map((guidance, index) => {
            const frequencyZone = FREQUENCY_ZONES.find(zone => zone.id === guidance.zoneId);
            const zoneColor = frequencyZone?.color || 'bg-gray-600';
            
            return (
              <Card key={index} className="bg-gray-800/80 h-fit">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${zoneColor}`}></div>
                    <span className="text-sm font-bold text-white">{guidance.frequencyRange}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${guidance.action.toLowerCase().includes('boost') || guidance.action.toLowerCase().includes('enhance') ? 'bg-green-600 text-white' : guidance.action.toLowerCase().includes('cut') || guidance.action.toLowerCase().includes('filter') ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}>
                      {guidance.action.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-400">General Guidance</span>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">{guidance.description}</p>
                </div>
              </Card>
            );
          })
        ) : filteredInstrumentAdvice.length === 0 ? (
          <div className="col-span-full">
            <Card className="bg-gray-700/80 text-center py-16">
              <p className="text-gray-300 text-lg">No EQ advice matches your current filters.<br />Try another instrument or frequency zone.</p>
            </Card>
          </div>
        ) : (
          // Show detailed instrument-specific advice
          filteredInstrumentAdvice.map((advice, index) => {
            // Find the appropriate frequency zone color
            const frequencyZone = FREQUENCY_ZONES.find(zone => {
              if (zone.id === 'all') return false;
              const zoneKeyword = zone.label.split(' ')[0].toLowerCase();
              return advice.frequencyRange.toLowerCase().includes(zoneKeyword);
            });
            const zoneColor = frequencyZone?.color || 'bg-gray-600';
            
            return (
              <Card key={index} className="bg-gray-800/80 h-fit">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${zoneColor}`}></div>
                    <span className="text-sm font-bold text-white">{advice.frequencyRange}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${advice.action.toLowerCase().includes('boost') ? 'bg-green-600 text-white' : advice.action.toLowerCase().includes('cut') ? 'bg-red-600 text-white' : 'bg-yellow-600 text-black'}`}>
                      {advice.action.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-400">{advice.instrument}</span>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">{advice.description}</p>
                </div>
              </Card>
            );
          })
        )}
      </div>
      <div className="text-xs text-gray-500 mt-8 text-center px-2">
        Tip: These are general guidelines—trust your ears and reference pro mixes for your genre.
      </div>
    </div>
  );
};

// Add back FREQUENCY_ZONES with type
const FREQUENCY_ZONES: { id: string; label: string; color: string }[] = [
  { id: 'all', label: 'All Frequencies', color: 'bg-gray-600' },
  { id: 'sub', label: 'Sub Bass (20-60Hz)', color: 'bg-red-600' },
  { id: 'bass', label: 'Bass (60-250Hz)', color: 'bg-orange-600' },
  { id: 'low-mid', label: 'Low Mids (250-500Hz)', color: 'bg-yellow-600' },
  { id: 'mid', label: 'Mids (500-2kHz)', color: 'bg-green-600' },
  { id: 'high-mid', label: 'High Mids (2-6kHz)', color: 'bg-blue-600' },
  { id: 'presence', label: 'Presence (6-12kHz)', color: 'bg-indigo-600' },
  { id: 'air', label: 'Air (12kHz+)', color: 'bg-purple-600' },
];
