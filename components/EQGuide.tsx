import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { Card } from './Card.tsx';
import { Button } from './Button.tsx';
import { Input } from './Input.tsx';
import { AdjustmentsHorizontalIcon } from './icons.tsx';
import { Chart, registerables } from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';

// Register Chart.js
Chart.register(...registerables, annotationPlugin);

interface EQBand {
  frequency: string;
  description: string;
  instruments: string[];
  action: 'boost' | 'cut' | 'notch';
  category: 'sub' | 'bass' | 'low-mid' | 'mid' | 'high-mid' | 'presence' | 'air';
  // extra data fields
  commonIssues?: string[];
  proTips?: string[];
}

const EQ_DATA: EQBand[] = [
  // SUB BASS
  { frequency: '20-30 Hz', description: 'Extreme sub-bass rumble. Rarely useful except for cinematic or sub-heavy genres.', instruments: ['Kick drum','Sub bass','808s','Synth bass'], action: 'cut', category: 'sub', commonIssues:['rumble'], proTips:['High-pass above 30Hz'] },
  { frequency: '30-50 Hz', description: 'Deep low-end power. Adds weight, but too much = flabbiness.', instruments: ['Kick drum','Sub bass','Bass guitar','808s'], action: 'boost', category: 'sub', commonIssues:['flabby'], proTips:['Narrow Q boost'] },
  { frequency: '50-60 Hz', description: 'Bass punch and fullness. Defines the "bottom" of mix.', instruments: ['Kick drum','Bass guitar','Sub bass','Synths'], action: 'boost', category: 'sub', commonIssues:['weak punch'], proTips:['Boost around 55Hz'] },
  // BASS
  { frequency: '60-100 Hz', description: 'Bass body and tone. Core of bass instruments. Too much = boom.', instruments: ['Bass guitar','Kick drum','Synth bass','Cello'], action: 'boost', category: 'bass', commonIssues:['boom'], proTips:['Wide cut at 80Hz'] },
  { frequency: '100-160 Hz', description: 'Low warmth. Helps glue bass + low mids. Overdone = muddiness.', instruments: ['Bass guitar','Piano','Guitar','Vocals','Drums'], action: 'cut', category: 'bass', commonIssues:['mud'], proTips:['Gentle cut around 120Hz'] },
  { frequency: '160-250 Hz', description: 'Upper bass/low mid overlap. Often cut to clean mud.', instruments: ['Bass guitar','Vocals','Strings','Brass'], action: 'cut', category: 'bass', commonIssues:['mud'], proTips:['Bell cut at 200Hz'] },
  // LOW MIDS
  { frequency: '250-350 Hz', description: 'Boxiness / wool. Can cloud guitars & vocals.', instruments: ['Vocals','Guitar','Piano','Snare'], action: 'cut', category: 'low-mid', commonIssues:['boxy'], proTips:['Cut around 300Hz'] },
  { frequency: '350-500 Hz', description: 'Warmth vs. mud. Boost for body, cut for clarity.', instruments: ['Vocals','Snare','Guitar','Keys'], action: 'cut', category: 'low-mid', commonIssues:['mud'], proTips:['Subtle cut at 400Hz'] },
  // MIDS
  { frequency: '500-800 Hz', description: 'Core midrange — thickness and presence. Often cluttered.', instruments: ['Vocals','Guitar','Snare','Keys'], action: 'cut', category: 'mid', commonIssues:['honky'], proTips:['Dip at 600Hz'] },
  { frequency: '800 Hz - 1.5 kHz', description: 'Body and clarity. Essential for definition.', instruments: ['Vocals','Guitar','Piano','Snare'], action: 'boost', category: 'mid', commonIssues:['thin'], proTips:['Boost around 1kHz'] },
  { frequency: '1.5-2 kHz', description: 'Presence and attack. Boost for definition.', instruments: ['Vocals','Snare','Guitar'], action: 'boost', category: 'mid', commonIssues:['harsh'], proTips:['Moderate boost at 1.8kHz'] },
  // HIGH MIDS
  { frequency: '2-3 kHz', description: 'Vocal clarity and edge. Boost carefully.', instruments: ['Vocals','Snare','Guitar','Piano'], action: 'boost', category: 'high-mid', commonIssues:['harsh'], proTips:['Narrow Q boost at 2.5kHz'] },
  { frequency: '3-5 kHz', description: 'Presence, bite, intelligibility. Too much = harsh.', instruments: ['Vocals','Snare','Cymbals'], action: 'cut', category: 'high-mid', commonIssues:['harsh'], proTips:['Cut around 4kHz'] },
  // PRESENCE
  { frequency: '5-8 kHz', description: 'Detail and sparkle. Brings life, but sibilant if overdone.', instruments: ['Vocals','Hi-hats','Acoustic guitar','Cymbals'], action: 'boost', category: 'presence', commonIssues:['sibilance'], proTips:['Shelf boost above 6kHz'] },
  // AIR
  { frequency: '8-12 kHz', description: 'Air and openness. Adds space.', instruments: ['Vocals','Strings','Cymbals','Room mics'], action: 'boost', category: 'air', commonIssues:['thin'], proTips:['High-shelf at 10kHz'] },
  { frequency: '12-20 kHz', description: 'Extreme highs. Use for shimmer.', instruments: ['Cymbals','Room mics','Vocals'], action: 'boost', category: 'air', commonIssues:['overbright'], proTips:['Subtle shelf boost'] },
];

const INSTRUMENTS = ['All','Vocals','Male vocals','Kick drum','Snare','Bass guitar','Guitar','Acoustic guitar','Piano','Cymbals','Hi-hats','Sub bass','808s','Synth bass','Strings','Brass','Room mics'];
const FREQUENCY_ZONES = [
  { id:'all', label:'All Frequencies', color:'bg-gray-600' },
  { id:'sub', label:'Sub Bass (20-60Hz)', color:'bg-red-600' },
  { id:'bass', label:'Bass (60-250Hz)', color:'bg-orange-600' },
  { id:'low-mid', label:'Low Mids (250-500Hz)', color:'bg-yellow-600' },
  { id:'mid', label:'Mids (500-2kHz)', color:'bg-green-600' },
  { id:'high-mid', label:'High Mids (2-6kHz)', color:'bg-blue-600' },
  { id:'presence', label:'Presence (6-12kHz)', color:'bg-indigo-600' },
  { id:'air', label:'Air (12kHz+)', color:'bg-purple-600' },
];

interface EQGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EQGuide: React.FC<EQGuideProps>: React.FC<EQCheatSheetProps> = ({ isOpen,onClose }) => {
  const [selectedInstrument,setSelectedInstrument]=useState('All');
  const [selectedZone,setSelectedZone]=useState('all');
  const [searchTerm,setSearchTerm]=useState('');
  const [highlightRange,setHighlightRange]=useState<[number,number]|null>(null);
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const chartRef=useRef<any>(null);

  useEffect(()=>{
    if(!canvasRef.current) return;
    const bins=32;
    const zeros=new Array(bins).fill(0);
    const labels=Array.from({length:bins},(_,i)=>Math.round(20*Math.pow(20000/20,i/(bins-1))));
    const cfg={type:'line',data:{labels,datasets:[{data:zeros,borderColor:'#60A5FA',pointRadius:0}]},options:{scales:{x:{type:'logarithmic'},y:{}},plugins:{annotation:{annotations:highlightRange?{box1:{type:'box',xMin:highlightRange[0],xMax:highlightRange[1],backgroundColor:'rgba(255,165,0,0.3)'}}:{}}},maintainAspectRatio:false}};
    chartRef.current?.destroy();
    chartRef.current=new Chart(canvasRef.current,cfg);
    return ()=>chartRef.current?.destroy();
  },[highlightRange]);

  if(!isOpen) return null;
  const filteredData=EQ_DATA.filter(band=>{
    const matchesZone=selectedZone==='all'||band.category===selectedZone;
    const matchesSearch=!searchTerm||band.description.toLowerCase().includes(searchTerm.toLowerCase());
    if(selectedInstrument==='All') return matchesZone&&matchesSearch;
    return matchesZone&&matchesSearch&&band.instruments.includes(selectedInstrument);
  });

  return(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white flex items-center"><AdjustmentsHorizontalIcon className="w-6 h-6 mr-2"/>EQ Guide</h2>
          <Button onClick={onClose} variant="outline" size="sm">Close</Button>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <select value={selectedInstrument} onChange={e=>setSelectedInstrument(e.target.value)} className="p-2 bg-gray-700 text-white rounded">
              {INSTRUMENTS.map(i=><option key={i} value={i}>{i}</option>)}
            </select>
            <select value={selectedZone} onChange={e=>setSelectedZone(e.target.value)} className="p-2 bg-gray-700 text-white rounded">
              {FREQUENCY_ZONES.map(z=><option key={z.id} value={z.id}>{z.label}</option>)}
            </select>
            <Input placeholder="Search descriptions..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="bg-gray-700 text-white rounded"/>
          </div>
          <div className="w-full h-40 mb-4"><canvas ref={canvasRef}/></div>
          {filteredData.length===0?
            <p className="text-gray-400 text-center">No EQ data matches your filters.</p>:
            filteredData.map((band,i)=>(
              <Card key={i} className="bg-gray-700 mb-3 p-4 hover:bg-gray-600 transition"
                onMouseEnter={()=>{
                  const parts=band.frequency.split(/[- ]+/).map(f=>parseInt(f));
                  setHighlightRange([parts[0],parts[1]||parts[0]]);
                }}
                onMouseLeave={()=>setHighlightRange(null)}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-white">{band.frequency}</span>
                  <span className={band.action==='boost'?'text-green-400':band.action==='cut'?'text-red-400':'text-yellow-400'}>
                    {band.action.toUpperCase()}
                  </span>
                </div>
                <p className="text-gray-300 mb-2">{band.description}</p>
                {band.commonIssues&&<p className="italic text-gray-400 text-xs mb-1">Issues: {band.commonIssues.join(', ')}</p>}
                {band.proTips&&<p className="text-green-400 text-xs mb-1">Tip: {band.proTips.join('; ')}</p>}
                <div className="flex flex-wrap gap-2">
                  {band.instruments.map(inst=><span key={inst} className="px-2 py-1 bg-gray-600 text-gray-200 rounded text-xs">{inst}</span>)}
                </div>
              </Card>
            ))}
        </div>
      </div>
    </div>
  );
};
