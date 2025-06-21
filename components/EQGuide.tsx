import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Chart, registerables } from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import Meyda from 'meyda';

// Register Chart.js components and annotation plugin
Chart.register(...registerables, annotationPlugin);

/** Data definitions **/
export interface EqBand {
  id: string;
  name: string;
  range: [number, number];
  description: string;
  commonIssues?: string[];
  proTips?: string[];
  instruments?: string[];
  categories: string[];
}

const EQ_BANDS: EqBand[] = [
  { id: 'sub', name: 'Sub Bass', range: [20, 60], description: 'Deep rumble felt more than heard. Cut on non-bass elements.', commonIssues: ['boom', 'excess rumble'], proTips: ['High-pass non-bass at ~60Hz'], instruments: ['Kick drum','Sub bass','808s'], categories: ['Bass'] },
  { id: 'bass', name: 'Bass', range: [60, 250], description: 'Core weight and punch of bass instruments.', commonIssues: ['mud', 'flab'], proTips: ['Cut 150-200Hz to clean mud'], instruments: ['Bass guitar','Kick drum','Synth bass'], categories: ['Bass'] },
  { id: 'low-mid', name: 'Low Mids', range: [250, 500], description: 'Boxiness or wooliness can cloud mix.', commonIssues: ['boxy', 'muddy'], proTips: ['Cut wide bell around 300Hz'], instruments: ['Guitar','Vocals','Piano'], categories: ['Guitar','Vocals'] },
  { id: 'mid', name: 'Midrange', range: [500, 1500], description: 'Body and presence of most instruments.', commonIssues: ['honky','nasal'], proTips: ['Cut 800-1kHz to reduce honk'], instruments: ['Vocals','Guitar','Snare'], categories: ['Vocals','Drums','Guitar'] },
  { id: 'high-mid', name: 'High Mids', range: [1500, 6000], description: 'Clarity and attack; too much can harshen.', commonIssues: ['harsh','sibilant'], proTips: ['Use narrow cut at 3-5kHz'], instruments: ['Vocals','Hi-hats','Cymbals'], categories: ['Drums','Vocals'] },
  { id: 'presence', name: 'Presence', range: [6000, 12000], description: 'Sparkle and detail; watch sibilance.', commonIssues: ['sibilance','harsh'], proTips: ['Shelf boost lightly 8-10kHz'], instruments: ['Vocals','Acoustic guitar'], categories: ['Vocals','Guitar'] },
  { id: 'air', name: 'Air', range: [12000, 20000], description: 'Openness and sheen.', commonIssues: ['thin'], proTips: ['Gentle high-shelf boost'], instruments: ['Strings','Room mics'], categories: ['Ambience'] },
];

/** FrequencyChart Component **/
interface FrequencyChartProps {
  analysisData?: number[];
  highlight?: [number, number];
}
const FrequencyChart: React.FC<FrequencyChartProps> = ({ analysisData, highlight }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const chart = useRef<any>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const binCount = analysisData?.length ?? 32;
    const data = analysisData ?? new Array(binCount).fill(0);
    const labels = Array.from({ length: binCount }, (_, i) => Math.round(20 * Math.pow(20000/20, i/(binCount-1))));
    const cfg = {
      type: 'line',
      data: { labels, datasets: [{ data, borderColor: '#60A5FA', pointRadius:0 }] },
      options: {
        scales:{ x:{ type:'logarithmic' }, y:{} },
        plugins:{ annotation:{ annotations: highlight ? { box1:{ type:'box', xMin:highlight[0], xMax:highlight[1], backgroundColor:'rgba(255,165,0,0.2)' } } : {} } },
        maintainAspectRatio:false
      }
    };
    if (chart.current) chart.current.destroy();
    chart.current = new Chart(canvas, cfg);
    return () => chart.current?.destroy();
  }, [analysisData, highlight]);
  return <div style={{ height:'200px' }}><canvas ref={ref} /></div>;
};

/** AudioAnalyzer Component **/
interface AudioAnalyzerProps { onAnalyze: (spectrum:number[])=>void }
const AudioAnalyzer: React.FC<AudioAnalyzerProps> = ({ onAnalyze }) => {
  const [file,setFile]=useState<File|null>(null), [busy,setBusy]=useState(false);
  const handle=(e:ChangeEvent<HTMLInputElement>)=>setFile(e.target.files?.[0]||null);
  const run=async()=>{ if(!file) return; setBusy(true);
    try{ const buf=await file.arrayBuffer(); const ctx=new(AudioContext)(); const audio=await ctx.decodeAudioData(buf);
      const off=new OfflineAudioContext(1,audio.length,audio.sampleRate),src=off.createBufferSource(); src.buffer=audio;
      const analyzer=Meyda.createMeydaAnalyzer({audioContext:off,source:src,bufferSize:512,featureExtractors:['amplitudeSpectrum'],callback:()=>{}});
      src.start(); await off.startRendering(); const spec=analyzer.get('amplitudeSpectrum') as number[]; onAnalyze(spec); analyzer.stop(); }
    catch{} setBusy(false);
  };
  return (<div className="mb-4"><input type="file" accept="audio/*" onChange={handle} /><Button onClick={run} disabled={!file||busy} size="sm">{busy?'Analyzing...':'Analyze Audio'}</Button></div>);
};

/** Main EQGuide Component **/
export const EQGuide: React.FC = () => {
  const [inst,setInst]=useState('All'), [cat,setCat]=useState('All'), [search,setSearch]=useState(''), [spec,setSpec]=useState<number[]>(), [hl,setHl]=useState<[number,number]>();

  const instruments = ['All', ...Array.from(new Set(EQ_BANDS.flatMap(b=>b.categories)))];
  const categories = ['All', ...EQ_BANDS.map(b=>b.id)];

  const filtered = EQ_BANDS.filter(b=>
    (inst==='All'||b.categories.includes(inst))&&
    (cat==='All'||b.id===cat)&&
    (!search||b.description.toLowerCase().includes(search.toLowerCase()))
  );

  const suggestions = () => {
    if(!spec) return ['Upload audio to analyze.'];
    const levels = EQ_BANDS.map(b=>{ const idx=Math.floor((Math.log(b.range[0])/Math.log(20000))*spec.length); return {b,level:spec[idx]||0}; });
    const peak=levels.reduce((a,c)=>c.level>a.level?c:a);
    return peak.level>0.5?[`High energy at ${peak.b.name}. Try ${peak.b.proTips?.[0]||'EQ tweak'}`]:['Balanced.'];
  };

  return (
    <Card className="bg-gray-800 p-4">
      <h2 className="text-xl mb-4">EQ Guide</h2>
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <select value={inst} onChange={e=>setInst(e.target.value)} className="p-2 bg-gray-700 text-white">{instruments.map(i=><option key={i}>{i}</option>)}</select>
        <select value={cat} onChange={e=>setCat(e.target.value)} className="p-2 bg-gray-700 text-white">{categories.map(c=> <option key={c} value={c}>{c}</option>)}</select>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search description" className="p-2 bg-gray-700 text-white" />
      </div>
      {/* Analyzer & Suggestions */}
      <AudioAnalyzer onAnalyze={setSpec} />
      {spec && (<ul className="mb-4 list-disc list-inside text-gray-300">{suggestions().map((s,i)=><li key={i}>{s}</li>)}</ul>)}
      {/* Chart */}
      <FrequencyChart analysisData={spec} highlight={hl} />
      {/* Band Cards */}
      <div className="mt-4 space-y-3">
        {filtered.length===0?
          <p className="text-gray-400">No results.</p>:
          filtered.map(b=>(
            <Card key={b.id} className="bg-gray-700 p-3 hover:bg-gray-600" onMouseEnter={()=>setHl(b.range)} onMouseLeave={()=>setHl(undefined)}>
              <h3 className="font-semibold">{b.name} ({b.range[0]}–{b.range[1]}Hz)</h3>
              <p className="text-gray-300 text-sm mb-1">{b.description}</p>
              {b.commonIssues && <p className="italic text-gray-400 text-xs">Issues: {b.commonIssues.join(', ')}</p>}
              {b.proTips && <p className="text-green-400 text-xs">Tip: {b.proTips.join(' ')}</p>}
            </Card>
          ))
        }
      </div>
    </Card>
  );
};
