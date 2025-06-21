import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import Chart from 'chart.js/auto';
import Meyda from 'meyda';

/**
 * Data definitions
 */
export interface EqBand {
  id: string;
  name: string;
  range: [number, number]; // [minFreq, maxFreq]
  description: string;
  commonIssues?: string[];
  proTips?: string[];
  instruments?: Record<string, string>;
  categories: string[]; // e.g. ['vocals', 'bass']
  genreTips?: Record<string, string[]>;
}

const EQ_BANDS: EqBand[] = [
  // Example entries; add full data as needed
  {
    id: 'sub',
    name: 'Sub Bass',
    range: [20, 60],
    description: 'Deep sub-bass rumble. Rarely needed except for sub-heavy genres.',
    commonIssues: ['no low-end', 'muddy'],
    proTips: ['High-pass non-bass instruments at ~60Hz'],
    instruments: { 'Kick drum': 'Feel-only rumble, focus on 30–50Hz for thump.' },
    categories: ['Kick drum', 'Sub bass', '808s'],
    genreTips: { HipHop: ['Boost 50Hz for 808 power'], EDM: ['Use tight low-pass to avoid boom'] }
  },
  {
    id: 'low-mid',
    name: 'Low Mids',
    range: [250, 500],
    description: 'Boxiness and muddiness can occur here.',
    commonIssues: ['boxy', 'muddy'],
    proTips: ['Cut a wide bell to clear mud'],
    instruments: { 'Guitar': 'Cut ~300Hz to reduce boxiness.' },
    categories: ['Guitar', 'Vocals', 'Piano'],
    genreTips: { Rock: ['Slight scoop for clarity'], Jazz: ['Keep warmth, cut sparingly'] }
  },
  // ... add remaining bands
];

export interface AnalysisResult {
  freq: number;
  amplitude: number;
}

/**
 * Frequency Chart Component
 */
interface FrequencyChartProps {
  analysisData?: number[]; // spectrum array
  highlight?: [number, number];
}
export const FrequencyChart: React.FC<FrequencyChartProps> = ({ analysisData, highlight }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const labels = Array.from({ length: analysisData?.length || 64 }, (_, i) => {
      // map index to freq (log scale) placeholder
      return Math.round(20 * Math.pow( (20000/20), i / (analysisData!.length - 1) ));
    });

    const data = {
      labels,
      datasets: [
        {
          label: 'Spectrum',
          data: analysisData || [],
          borderColor: '#60A5FA',
          pointRadius: 0,
          tension: 0.1
        }
      ]
    };

    const options: any = {
      scales: {
        x: {
          type: 'logarithmic',
          title: { display: true, text: 'Frequency (Hz)' }
        },
        y: {
          title: { display: true, text: 'Amplitude' }
        }
      },
      plugins: {
        annotation: {
          annotations: highlight
            ? {
                box1: {
                  type: 'box',
                  xMin: highlight[0],
                  xMax: highlight[1],
                  backgroundColor: 'rgba(255, 165, 0, 0.2)'
                }
              }
            : {}
        }
      },
      maintainAspectRatio: false
    };

    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new Chart(canvasRef.current, { type: 'line', data, options });

    return () => chartRef.current && chartRef.current.destroy();
  }, [analysisData, highlight]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '300px' }} />;
};

/**
 * Audio Analyzer Component
 */
interface AudioAnalyzerProps {
  onAnalyze: (spectrum: number[]) => void;
}
export const AudioAnalyzer: React.FC<AudioAnalyzerProps> = ({ onAnalyze }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
  };

  const analyze = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      const offlineCtx = new OfflineAudioContext(1, audioBuffer.length, audioBuffer.sampleRate);
      const source = offlineCtx.createBufferSource();
      source.buffer = audioBuffer;
      const analyzer = Meyda.createMeydaAnalyzer({
        audioContext: offlineCtx,
        source,
        bufferSize: 512,
        featureExtractors: ['amplitudeSpectrum'],
        callback: () => {}
      });
      source.start();
      offlineCtx.startRendering().then(() => {
        const spectrum = analyzer.get('amplitudeSpectrum') as number[];
        onAnalyze(spectrum);
        analyzer.stop();
        setIsAnalyzing(false);
      });
    } catch (err) {
      console.error(err);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-sm text-gray-300 mb-1">Upload Isolated Track</label>
      <input type="file" accept="audio/*" onChange={handleFileChange} className="text-gray-100" />
      <Button onClick={analyze} disabled={!file || isAnalyzing} size="sm">{isAnalyzing ? 'Analyzing...' : 'Analyze EQ'}</Button>
    </div>
  );
};

/**
 * EQGuide Component
 */
export const EQGuide: React.FC = () => {
  const [selectedInstrument, setInstrument] = useState<string>('All');
  const [selectedCategory, setCategory] = useState<string>('All');
  const [searchTerm, setSearch] = useState<string>('');
  const [spectrum, setSpectrum] = useState<number[]>();
  const [highlightRange, setHighlightRange] = useState<[number, number] | undefined>(undefined);

  // Filtered bands based on UI controls
  const filteredBands = EQ_BANDS.filter(b => {
    const instrMatch = selectedInstrument === 'All' || b.categories.includes(selectedInstrument);
    const catMatch = selectedCategory === 'All' || b.id === selectedCategory;
    const textMatch = searchTerm === '' || b.description.toLowerCase().includes(searchTerm.toLowerCase());
    return instrMatch && catMatch && textMatch;
  });

  // Simple rule-based suggestions based on spectrum peaks
  const suggestions = () => {
    if (!spectrum) return [] as string[];
    const bandLevels = EQ_BANDS.map(b => {
      // approximate index by frequency
      const idx = Math.floor((Math.log(b.range[0]) / Math.log(20000)) * spectrum.length);
      return { band: b, level: spectrum[idx] || 0 };
    });
    // find the highest problematic band (> threshold)
    const peakBand = bandLevels.reduce((max, cur) => (cur.level > max.level ? cur : max));
    if (peakBand.level > 0.5) {
      return [`High energy detected around ${peakBand.band.name} (${peakBand.band.range[0]}–${peakBand.band.range[1]} Hz). Consider a ${peakBand.band.proTips?.[0] || 'cut'} here.`];
    }
    return ['Spectrum looks balanced.'];
  };

  return (
    <div className="p-4 bg-gray-900 text-gray-100 rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Enhanced EQ Guide</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm text-gray-300">Instrument</label>
          <select value={selectedInstrument} onChange={e => setInstrument(e.target.value)} className="w-full bg-gray-700 rounded p-2">
            {['All', ...new Set(EQ_BANDS.flatMap(b => b.categories))].map(inst => <option key={inst}>{inst}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-300">Category</label>
          <select value={selectedCategory} onChange={e => setCategory(e.target.value)} className="w-full bg-gray-700 rounded p-2">
            {['All', ...new Set(EQ_BANDS.map(b => b.id))].map(cat => <option key={cat}>{cat}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-300">Search</label>
          <input type="text" value={searchTerm} onChange={e => setSearch(e.target.value)} placeholder="e.g. muddy" className="w-full bg-gray-700 rounded p-2" />
        </div>
      </div>
      {/* Audio Analyzer and Suggestions */}
      <AudioAnalyzer onAnalyze={setSpectrum} />
      {spectrum && (
        <div className="mb-6">
          <h3 className="text-xl font-semibold">AI EQ Suggestions</h3>
          <ul className="list-disc list-inside">
            {suggestions().map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}
      {/* Frequency Chart */}
      <FrequencyChart analysisData={spectrum} highlight={highlightRange} />
      {/* Band List */}
      <div className="mt-6 space-y-4">
        {filteredBands.length === 0 ? (
          <p className="text-gray-400">No entries match your filters.</p>
        ) : (
          filteredBands.map(b => (
            <Card key={b.id} className="bg-gray-800/50 p-4 hover:bg-gray-800">
              <h4 className="text-lg font-bold mb-1">
                {b.name} 
                <small className="text-sm text-gray-400">({b.range[0]}–{b.range[1]} Hz)</small>
              </h4>
              <p className="mb-2">{b.description}</p>
              {b.commonIssues && (
                <p className="italic text-gray-300 mb-2">Issues: {b.commonIssues.join(', ')}</p>
              )}
              {b.proTips && (
                <p className="text-green-400 mb-2">Pro Tip: {b.proTips.join(' ')}</p>
              )}
              <div className="flex flex-wrap gap-2">
                {Object.entries(b.instruments || {}).map(([inst, note]) => (
                  <Button
                    key={inst}
                    size="xs"
                    variant="outline"
                    onMouseEnter={() => setHighlightRange(b.range as [number, number])}
                    onMouseLeave={() => setHighlightRange(undefined)}
                  >{inst}</Button>
                ))}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
