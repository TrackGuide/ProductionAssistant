import React, { useState } from 'react';
import { Card } from './Card';

interface EQRange {
  frequency: string;
  description: string;
  instruments: string[];
  tips: string[];
}

const EQ_RANGES: EQRange[] = [
  {
    frequency: "20-60 Hz",
    description: "Sub Bass",
    instruments: ["Kick drum", "Sub bass", "808s"],
    tips: ["High-pass filter most instruments here", "Boost sparingly for power", "Watch for muddiness"]
  },
  {
    frequency: "60-200 Hz",
    description: "Bass",
    instruments: ["Bass guitar", "Kick drum body", "Piano low end"],
    tips: ["Foundation of your mix", "Cut here to reduce muddiness", "Boost for warmth"]
  },
  {
    frequency: "200-500 Hz",
    description: "Low Mids",
    instruments: ["Guitar body", "Snare body", "Vocal warmth"],
    tips: ["Often needs cutting", "Can make mix sound boxy", "Critical for clarity"]
  },
  {
    frequency: "500Hz-2kHz",
    description: "Mids",
    instruments: ["Vocals", "Guitar", "Snare", "Most instruments"],
    tips: ["Presence and clarity", "Boost for forward sound", "Cut for space"]
  },
  {
    frequency: "2-5 kHz",
    description: "Upper Mids",
    instruments: ["Vocal presence", "Guitar attack", "Snare crack"],
    tips: ["Intelligibility range", "Boost for clarity", "Can be harsh if overdone"]
  },
  {
    frequency: "5-10 kHz",
    description: "Presence",
    instruments: ["Vocal sibilance", "Cymbal attack", "Guitar brightness"],
    tips: ["Adds definition", "De-ess vocals here", "Boost for sparkle"]
  },
  {
    frequency: "10-20 kHz",
    description: "Air/Brilliance",
    instruments: ["Cymbals", "Acoustic guitar", "Vocal air"],
    tips: ["Adds openness", "Shelf boost for shine", "High-frequency detail"]
  }
];

export const EQCheatSheet: React.FC = () => {
  const [selectedRange, setSelectedRange] = useState<EQRange | null>(null);

  return (
    <Card title="🎛️ EQ Frequency Guide" className="bg-gray-800/80 backdrop-blur-md">
      <div className="space-y-3">
        {EQ_RANGES.map((range, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
              selectedRange === range
                ? 'bg-purple-600/20 border-purple-500'
                : 'bg-gray-700/50 border-gray-600 hover:bg-gray-700/70 hover:border-gray-500'
            }`}
            onClick={() => setSelectedRange(selectedRange === range ? null : range)}
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-white">{range.frequency}</h3>
                <p className="text-sm text-gray-300">{range.description}</p>
              </div>
              <div className="text-purple-400">
                {selectedRange === range ? '−' : '+'}
              </div>
            </div>
            
            {selectedRange === range && (
              <div className="mt-3 pt-3 border-t border-gray-600">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-purple-300 mb-2">Common Instruments</h4>
                    <ul className="text-xs text-gray-300 space-y-1">
                      {range.instruments.map((instrument, i) => (
                        <li key={i} className="flex items-center">
                          <span className="w-1 h-1 bg-purple-400 rounded-full mr-2"></span>
                          {instrument}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-purple-300 mb-2">Mixing Tips</h4>
                    <ul className="text-xs text-gray-300 space-y-1">
                      {range.tips.map((tip, i) => (
                        <li key={i} className="flex items-start">
                          <span className="w-1 h-1 bg-green-400 rounded-full mr-2 mt-1.5 flex-shrink-0"></span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        
        <div className="mt-4 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
          <h4 className="text-sm font-medium text-blue-300 mb-2">💡 Pro Tips</h4>
          <ul className="text-xs text-gray-300 space-y-1">
            <li>• Use your ears, not just visual feedback</li>
            <li>• Cut before you boost</li>
            <li>• EQ in context of the full mix</li>
            <li>• Use reference tracks for comparison</li>
          </ul>
        </div>
      </div>
    </Card>
  );
};