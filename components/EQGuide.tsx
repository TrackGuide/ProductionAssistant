import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { Card } from './Card.tsx';
import { Button } from './Button.tsx';
import { Input } from './Input.tsx';
import { AdjustmentsHorizontalIcon } from './icons.tsx';
import { Chart, registerables } from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import Meyda from 'meyda';

// Register Chart.js and annotation plugin
Chart.register(...registerables, annotationPlugin);

// Extended EQ band interface
interface EQBand {
  frequency: string;
  description: string;
  instruments: string[];
  action: 'boost' | 'cut' | 'notch';
  category: 'sub' | 'bass' | 'low-mid' | 'mid' | 'high-mid' | 'presence' | 'air';
  commonIssues?: string[];
  proTips?: string[];
}

// Original data plus extra fields
const EQ_DATA: EQBand[] = [
  { frequency: '20-30 Hz', description: 'Extreme sub-bass rumble. Rarely useful except for cinematic or sub-heavy genres.', instruments: ['Kick drum','Sub bass','808s','Synth bass'], action: 'cut', category: 'sub', commonIssues:['rumble'], proTips:['Use high-pass filter'] },
  { frequency: '30-50 Hz', description: 'Deep low-end power. Adds weight, but too much = flabbiness.', instruments: ['Kick drum','Sub bass','Bass guitar','808s'], action: 'boost', category: 'sub', commonIssues:['flabby'], proTips:['Tight boost with narrow Q'] },
  // ... keep all original entries and add commonIssues/proTips where relevant
];

const INSTRUMENTS = ['All', 'Vocals','Male vocals','Kick drum','Snare','Bass guitar','Guitar','Acoustic guitar','Piano','Cymbals','Hi-hats','Sub bass','808s','Synthesizer bass','Horns','Strings','Room mics','Drums','Violin','Cello','Tuba','Saxophone','Trumpet','Brass','Woodwinds','Flute'];

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

const ISSUE_OPTIONS = ['All','Boxiness','Muddiness','Honkiness','Nasal','Harsh','Sibilant','Thin','Dull','Bright','No Punch','No Low-end','No Air'];

// FrequencyChart Component
const FrequencyChart: React.FC<{ spectrum?: number[]; highlight?: [number,number] }> = ({ spectrum, highlight }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const bins = spectrum?.length ?? 32;
    const data = spectrum ?? new Array(bins).fill(0);
    const labels = Array.from({ length: bins }, (_, i) => {
      const frac = i/(bins-1);
      return Math.round(20 * Math.pow(20000/20, frac));
    });
    const cfg = {
      type:'line',
      data:{ labels, datasets:[{ data, borderColor:'#60A5FA', pointRadius:0 }] },
      options:{
        scales:{ x:{ type:'logarithmic' }, y:{} },
        plugins:{ annotation:{ annotations: highlight ? { box1:{ type:'box', xMin:highlight[0], xMax:highlight[1], backgroundColor:'rgba(255,165,0,0.2)' } } : {} } },
        maintainAspectRatio:false
      }
    };
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new Chart(canvasRef.current, cfg);
    return () => chartRef.current?.destroy();
  }, [spectrum, highlight]);

  return <div className="w-full h-48 mb-4"><canvas ref={canvasRef} /></div>;
};

// AudioAnalyzer Component
const AudioAnalyzer: React.FC<{ onAnalyze:(s:number[])=>void }> = ({ onAnalyze }) => {
  const [file,setFile]=useState<File|null>(null), [busy,setBusy]=useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const handle = (e:ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0]||null);
  const run = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const buf = await file.arrayBuffer();
      const ctx = new (window.AudioContext||((window as any).webkitAudioContext))();
      const audio = await ctx.decodeAudioData(buf);
      const off = new OfflineAudioContext(1,audio.length,audio.sampleRate);
      const src = off.createBufferSource(); src.buffer=audio;
      const analyzer = Meyda.createMeydaAnalyzer({ audioContext:off, source:src, bufferSize:512, featureExtractors:['amplitudeSpectrum'], callback:()=>{} });
      src.start(); await off.startRendering();
      const spec = analyzer.get('amplitudeSpectrum') as number[];
      onAnalyze(spec);
      analyzer.stop();
    } catch {};
    setBusy(false);
  };
  return (
    <div className="mb-4">
      <input type="file" accept="audio/*" onChange={handle} ref={inputRef} className="mb-2" />
      <Button onClick={run} disabled={!file||busy} size="sm">{busy?'Analyzing...':'Analyze Track'}</Button>
    </div>
  );
};

// Main EQGuide
export const EQGuide: React.FC = () => {
  const [selectedInstrument,setInst]=useState('All');
  const [selectedZone,setZone]=useState('all');
  const [searchTerm,setSearch]=useState('');
  const [spectrum,setSpectrum]=useState<number[]>();
  const [highlight,setHighlight]=useState<[number,number]>();

  const filtered = EQ_DATA.filter(band => {
    const matchZone = selectedZone==='all'||band.category===selectedZone;
    const matchInst = selectedInstrument==='All'||band.instruments.includes(selectedInstrument);
    const matchSearch = !searchTerm || band.description.toLowerCase().includes(searchTerm.toLowerCase()) || (band.commonIssues||[]).some(ci=>ci.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchZone && matchInst && matchSearch;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white flex items-center mb-4"><AdjustmentsHorizontalIcon className="w-6 h-6 mr-2" />EQ Guide</h2>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <select className="bg-gray-700 text-gray-100 p-2" value={selectedInstrument} onChange={e=>setInst(e.target.value)}>
              {INSTRUMENTS.map(i=> <option key={i} value={i}>{i}</option>)}
            </select>
            <select className="bg-gray-700 text-gray-100 p-2" value={selectedZone} onChange={e=>setZone(e.target.value)}>
              {FREQUENCY_ZONES.map(z=> <option key={z.id} value={z.id}>{z.label}</option>)}
            </select>
            <select className="bg-gray-700 text-gray-100 p-2" value={searchTerm} onChange={e=>setSearch(e.target.value)}>
              <option value="">All Issues</option>
              {ISSUE_OPTIONS.map(opt=> <option key={opt} value={opt.toLowerCase()}>{opt}</option>)}
            </select>
          </div>
          {/* Audio Analyzer & Chart */}
          <AudioAnalyzer onAnalyze={setSpectrum} />
          <FrequencyChart spectrum={spectrum} highlight={highlight} />
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {filtered.length===0 ? (
            <p className="text-gray-400 text-center py-8">No EQ data matches your filters.</p>
          ) : filtered.map((band,i)=>(
            <Card key={i} className="bg-gray-700/50 hover:bg-gray-700/70 transition-colors" onMouseEnter={()=>setHighlight([parseInt(band.frequency),parseInt(band.frequency.split('-')[1])])} onMouseLeave={()=>setHighlight(undefined)}>
              <div className="p-4">
                <div className="flex items-center mb-2">
                  <span className="text-lg font-bold text-white mr-3">{band.frequency}</span>
                  <span className={`text-sm font-medium ${band.action==='boost'?'text-green-400':band.action==='cut'?'text-red-400':'text-yellow-400'}`}>↗️ {band.action.toUpperCase()}</span>
                  <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-gray-600 text-white">{band.category.toUpperCase()}</span>
                </div>
                <p className="text-gray-300 mb-2">{band.description}</p>
                {band.commonIssues && <p className="italic text-gray-400 text-xs mb-1">Issues: {band.commonIssues.join(', ')}</p>}
                {band.proTips && <p className="text-green-400 text-xs mb-2">Tip: {band.proTips.join(' ')}</p>}
                <div className="flex flex-wrap gap-1">
                  {band.instruments.map(inst=> <span key={inst} className="px-2 py-1 bg-gray-600 text-gray-200 rounded text-xs">{inst}</span>)}
                </div>
              </div>
            </Card>
          ))}
        </div>
        <div className="p-4 border-t border-gray-700 bg-gray-800/50 text-center text-xs text-gray-400">
          💡 Tip: These are guidelines. Trust your ears and context!
        </div>
      </div>
    </div>
  );
};
