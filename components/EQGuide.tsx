import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Chart, registerables } from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import Meyda from 'meyda';

// Register Chart.js components and annotation plugin once
Chart.register(...registerables, annotationPlugin);

/**
 * Data definitions
 */
export interface EqBand {
  id: string;
  name: string;
  range: [number, number];
  description: string;
  commonIssues?: string[];
  proTips?: string[];
  instruments?: Record<string, string>;
  categories: string[];
  genreTips?: Record<string, string[]>;
}

const EQ_BANDS: EqBand[] = [
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

interface FrequencyChartProps {
  analysisData?: number[];
  highlight?: [number, number];
}
export const FrequencyChart: React.FC<FrequencyChartProps> = ({ analysisData, highlight }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const binCount = analysisData?.length ?? 64;
    const dataArray = analysisData ?? new Array(binCount).fill(0);

    const labels = Array.from({ length: binCount }, (_, i) => {
      const frac = i / (binCount - 1);
      return Math.round(20 * Math.pow(20000 / 20, frac));
    });

    const chartData = {
      labels,
      datasets: [
        {
          label: 'Spectrum',
          data: dataArray,
          borderColor: '#60A5FA',
          pointRadius: 0,
          tension: 0.1
        }
      ]
    };

    const options: any = {
      scales: {
        x: { type: 'logarithmic', title: { display: true, text: 'Frequency (Hz)' } },
        y: { title: { display: true, text: 'Amplitude' } }
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
    chartRef.current = new Chart(canvasRef.current, { type: 'line', data: chartData, options });
    return () => chartRef.current && chartRef.current.destroy();
  }, [analysisData, highlight]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '300px' }} />;
};

interface AudioAnalyzerProps {
  onAnalyze: (spectrum: number[]) => void;
}
export const AudioAnalyzer: React.FC<AudioAnalyzerProps> = ({ onAnalyze }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] || null);
  const analyze = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      const offlineCtx = new OfflineAudioContext(1, audioBuffer.length, audioBuffer.sampleRate);
      const source = offlineCtx.createBufferSource(); source.buffer = audioBuffer;
      const analyzer = Meyda.createMeydaAnalyzer({ audioContext: offlineCtx, source, bufferSize: 512, featureExtractors: ['amplitudeSpectrum'], callback: () => {} });
      source.start();
      const rendered = await offlineCtx.startRendering();
      const spectrum = analyzer.get('amplitudeSpectrum') as number[];
      onAnalyze(spectrum);
      analyzer.stop();
    } catch { /* handle errors if needed */ }
    setIsAnalyzing(false);
  };
  return (
    <div className="mb-4">
      <label className="block text-sm text-gray-300 mb-1">Upload Isolated Track</label>
      <input type="file" accept="audio/*" onChange={handleFileChange} className="text-gray-100 mb-2" />
      <Button onClick={analyze} disabled={!file || isAnalyzing} size="sm">
        {isAnalyzing ? 'Analyzing...' : 'Analyze EQ'}
      </Button>
    </div>
  );
};

export const EQGuide: React.FC = () => {
  const [selectedInstrument, setInstrument] = useState('All');
  const [selectedCategory, setCategory] = useState('All');
  const [searchTerm, setSearch] = useState('');
  const [spectrum, setSpectrum] = useState<number[]>();
  const [highlightRange, setHighlightRange] = useState<[number, number]>();

  const filteredBands = EQ_BANDS.filter(b => {
    const instrMatch = selectedInstrument === 'All' || b.categories.includes(selectedInstrument);
    const catMatch = selectedCategory === 'All' || b.id === selectedCategory;
    const textMatch = !searchTerm || b.description.toLowerCase().includes(searchTerm.toLowerCase());
    return instrMatch && catMatch && textMatch;
  });

  const suggestions = () => {
    if (!spectrum) return ['No analysis data yet.'];
    const bandLevels = EQ_BANDS.map(b => {
      const idx = Math.floor((Math.log(b.range[0]) / Math.log(20000)) * spectrum.length);
      return { band: b, level: spectrum[idx] || 0 };
    });
    const peak = bandLevels.reduce((max, cur) => cur.level > max.level ? cur : max);
    return peak.level > 0.5
      ? [`High energy at ${peak.band.name}. Consider ${peak.band.proTips?.[0] || 'an EQ adjustment'}.`]
      : ['Spectrum looks balanced.'];
  };

  return (
    <div className="p-4 bg-gray-900 text-gray-100 rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Enhanced EQ Guide</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Filters... */}
      </div>
      <AudioAnalyzer onAnalyze={setSpectrum} />
      {spectrum && (
        <div className="mb-6">
          <h3 className="text-xl font-semibold">AI EQ Suggestions</h3>
          <ul className="list-disc list-inside">
            {suggestions().map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}
      <FrequencyChart analysisData={spectrum} highlight={highlightRange} />
      <div className="mt-6 space-y-4">{/* band cards */}</div>
    </div>
  );
};
