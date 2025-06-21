/* ===== components/PatchGuide.tsx ===== */
import React, { useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Spinner } from './Spinner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AnimatedWaveformPreview } from './AnimatedWaveformPreview';
import { EnvelopeChart } from './EnvelopeChart';
import { Knob } from './Knob';
import { ModulationMatrix, ModRouting } from './ModulationMatrix';
import { generateSynthPatchGuide } from '../services/patchGuideService';

const SYNTH_OPTIONS = ['Serum','Vital','Pigments','Massive','Massive X','Diva','Hive 2','Sylenth1','Wavestate','Jupiter-8','Juno-106','SH-101','Operator','Wavetable','Retro Synth','Alchemy','FM8','Phase Plant','Omnisphere','Analog Lab','Generic'];

export const PatchGuide: React.FC = () => {
  const [desc, setDesc] = useState('');
  const [synth, setSynth] = useState('Generic');
  const [guide, setGuide] = useState<string | null>(null);
  const [wave, setWave] = useState<string>('sawtooth');
  const [octaves, setOctaves] = useState({ osc1: 0, osc2: 0 });
  const [tunings, setTunings] = useState({ osc1Fine: 0, osc2Fine: 0, osc1Coarse: 0, osc2Coarse: 0 });
  const [adsr, setAdsr] = useState({ attack: 0.1, decay: 0.5, sustain: 0.8, release: 1.5 });
  const [knobs, setKnobs] = useState<Record<string, number>>({ Cutoff: 0.3, Resonance: 0.4, Drive: 0.1, Mix: 0.5, 'Filter Drive': 0.2 });
  const [mods, setMods] = useState<ModRouting[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const duration = 1;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setGuide(null); setError('');
    try {
      const res = await generateSynthPatchGuide({ description: desc, synth });
      setGuide(res.text || '');
      setWave(res.waveform || wave);
      if (res.adsr) setAdsr(res.adsr);
      if (res.knobs) setKnobs(res.knobs);
      if (res.modMatrix) setMods(res.modMatrix.filter(m => m.amount > 0));
      if (res.oscSettings) {
        setOctaves({ osc1: res.oscSettings.osc1Oct||0, osc2: res.oscSettings.osc2Oct||0 });
        setTunings({ osc1Fine: res.oscSettings.osc1Fine||0, osc2Fine: res.oscSettings.osc2Fine||0, osc1Coarse: res.oscSettings.osc1Coarse||0, osc2Coarse: res.oscSettings.osc2Coarse||0 });
      }
    } catch (err) { setError(err instanceof Error ? err.message : 'Error'); }
    finally { setLoading(false); }
  };

  const reset = () => {
    setDesc(''); setSynth('Generic'); setGuide(null); setError('');
    setWave('sawtooth'); setOctaves({ osc1: 0, osc2: 0 }); setTunings({ osc1Fine: 0, osc2Fine: 0, osc1Coarse: 0, osc2Coarse: 0 });
    setAdsr({ attack: 0.1, decay: 0.5, sustain: 0.8, release: 1.5 }); setKnobs({ Cutoff: 0.3, Resonance: 0.4, Drive: 0.1, Mix: 0.5, 'Filter Drive': 0.2 }); setMods([]);
  };

  const renderAudioGraph = (ctx: OfflineAudioContext) => {
    const osc1 = ctx.createOscillator(); osc1.type = wave as OscillatorType;
    const osc2 = ctx.createOscillator(); osc2.type = wave as OscillatorType; osc2.detune.value = tunings.osc2Fine;
    const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = knobs.Cutoff * ctx.sampleRate / 2; filter.Q.value = knobs.Resonance * 20;
    const gain = ctx.createGain();
    osc1.connect(filter); osc2.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    osc1.start(); osc2.start();
    const now = 0;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(1, now + adsr.attack);
    gain.gain.linearRampToValueAtTime(adsr.sustain, now + adsr.attack + adsr.decay);
    gain.gain.setValueAtTime(adsr.sustain, now + duration);
    gain.gain.linearRampToValueAtTime(0, now + duration + adsr.release);
    return gain;
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <Card>
        <h1 className="text-2xl font-bold text-white">PatchGuide AI</h1>
        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Describe your target sound..." className="w-full p-3 bg-gray-700 rounded text-white h-24" />
          <select value={synth} onChange={e => setSynth(e.target.value)} className="w-full p-2 bg-gray-700 rounded text-white">
            {SYNTH_OPTIONS.map(o => <option key={o}>{o}</option>)}
          </select>
          {error && <div className="text-red-400">{error}</div>}
          <div className="flex space-x-3">
            <Button type="submit" disabled={loading||!desc.trim()} className="flex-1">{loading?<><Spinner size="sm"/>Generating...</>:"Generate Guide"}</Button>
            <Button variant="outline" onClick={reset}>Reset</Button>
          </div>
        </form>
      </Card>

      {guide && <>        
        <Card>
          <h2 className="text-xl font-semibold text-white mb-2">1. Oscillator Settings</h2>
          <table className="w-full text-gray-200">
            <thead><tr><th>Osc</th><th>Shape/Wave</th><th>Octave</th><th>Coarse Tune</th><th>Fine Tune</th></tr></thead>
            <tbody>
              <tr><td>Osc 1</td><td>{wave}</td><td>{octaves.osc1}</td><td>{tunings.osc1Coarse}</td><td>{tunings.osc1Fine}</td></tr>
              <tr><td>Osc 2</td><td>{wave}</td><td>{octaves.osc2}</td><td>{tunings.osc2Coarse}</td><td>{tunings.osc2Fine}</td></tr>
            </tbody>
          </table>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold text-white mb-2">2. Filter Settings</h2>
          <table className="w-full text-gray-200">
            <thead><tr><th>Param</th><th>Value</th><th>Notes</th></tr></thead>
            <tbody>
              <tr><td>Type</td><td>Low-pass</td><td>Shapes tone</td></tr>
              <tr><td>Cutoff</td><td>{Math.round(knobs.Cutoff*100)}%</td><td>Sweep range</td></tr>
              <tr><td>Resonance</td><td>{Math.round(knobs.Resonance*100)}%</td><td>Sharpness</td></tr>
              <tr><td>Drive</td><td>{Math.round(knobs['Filter Drive']*100)}%</td><td>Warmth</td></tr>
            </tbody>
          </table>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold text-white mb-2">3. ADSR Envelope</h2>
          <div className="flex items-center gap-6">
            <table className="text-gray-200">
              <thead><tr><th>Env</th><th>A</th><th>D</th><th>S</th><th>R</th></tr></thead>
              <tbody><tr><td>Amp</td><td>{adsr.attack}</td><td>{adsr.decay}</td><td>{adsr.sustain}</td><td>{adsr.release}</td></tr></tbody>
            </table>
            <EnvelopeChart {...adsr} width={300} height={150} />
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold text-white mb-2">4. Effects & Performance Tips</h2>
          <ReactMarkdown className="prose prose-invert text-gray-200" remarkPlugins={[remarkGfm]}>``` 
- **Reverb**: Large hall (3–5s decay)
- **Chorus**: Subtle ensemble width
- **Delay**: Long delay, low feedback

**Performance**: Use mod wheel to sweep live; layer pads for depth
```</ReactMarkdown>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold text-white mb-2">5. Visual Aids</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatedWaveformPreview renderAudioGraph={renderAudioGraph} width={400} height={120} duration={duration} fps={20} />
            <EnvelopeChart {...adsr} width={300} height={150} />
            <div className="flex flex-wrap gap-4">{Object.entries(knobs).map(([l,v])=> <Knob key={l} label={l} value={v}/> )}</div>
            {mods.length>0 && <ModulationMatrix routings={mods} />}
          </div>
        </Card>
      </>}
    </div>
  );
};
