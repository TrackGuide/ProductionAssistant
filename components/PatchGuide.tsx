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

const SYNTH_OPTIONS = [
  'Serum', 'Vital', 'Pigments', 'Massive', 'Massive X', 'Diva', 'Hive 2', 'Sylenth1',
  'Wavestate', 'Jupiter-8', 'Juno-106', 'SH-101', 'Operator', 'Wavetable', 'Retro Synth',
  'Alchemy', 'FM8', 'Phase Plant', 'Omnisphere', 'Analog Lab', 'Generic'
];
const VOICE_TYPES = ['Soft Lead','Hard Lead','Evolving Pad','Bass','Pluck','Ambient Texture','Arpeggio','Drone','FX','Keys'];
const DESCRIPTORS = ['Warm','Bright','Gritty','Smooth','Distorted','Clean','Vintage','Modern','Aggressive','Subtle'];
const GENRES = ['Ambient','EDM','Rock','Pop','Hip-Hop','Jazz','Classical','Experimental','Techno','House'];

export const PatchGuide: React.FC = () => {
  // User inputs
  const [voiceType, setVoiceType] = useState('Soft Lead');
  const [descriptor, setDescriptor] = useState('Warm');
  const [genre, setGenre] = useState('Ambient');
  const [notes, setNotes] = useState('');
  const [synth, setSynth] = useState('Generic');

  // AI results
  const [guide, setGuide] = useState<string|null>(null);
  const [wave, setWave] = useState('sawtooth + noise');
  const [oscOct, setOscOct] = useState({ o1:0, o2:0, o3:0 });
  const [tunings, setTunings] = useState({ c1:0, c2:0, c3:0, f1:0, f2:0, f3:0 });
  const [adsrVCF, setAdsrVCF] = useState({ attack:0.1, decay:0.5, sustain:0.8, release:1.5 });
  const [adsrVCA, setAdsrVCA] = useState({ attack:0.05, decay:0.3, sustain:0.9, release:0.6 });
  const [knobs, setKnobs] = useState<Record<string,number>>({ Cutoff:0, Resonance:0, Drive:0, Mix:0, 'Filter Drive':0 });
  const [mods, setMods] = useState<ModRouting[]>([]);

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const duration = 1; // seconds

  // Submit handler
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setGuide(null);
    const description = `${voiceType}, ${descriptor} for ${genre}. ${notes}`;
    try {
      const res = await generateSynthPatchGuide({ description, synth, voiceType, descriptor, genre, notes });
      setGuide(res.text || '');
      setWave(res.waveform || wave);
      if (res.oscSettings) {
        setOscOct({ o1: res.oscSettings.o1Oct||0, o2: res.oscSettings.o2Oct||0, o3: res.oscSettings.o3Oct||0 });
        setTunings({ c1: res.oscSettings.o1Coarse||0, c2: res.oscSettings.o2Coarse||0, c3: res.oscSettings.o3Coarse||0, f1: res.oscSettings.o1Fine||0, f2: res.oscSettings.o2Fine||0, f3: res.oscSettings.o3Fine||0 });
      }
      if (res.adsrVCF) setAdsrVCF(res.adsrVCF);
      if (res.adsrVCA) setAdsrVCA(res.adsrVCA);
      if (res.knobs) setKnobs(res.knobs);
      if (res.modMatrix) setMods(res.modMatrix.filter(m => m.amount > 0));
    } catch(err) {
      setError(err instanceof Error ? err.message : 'Error generating guide');
    } finally { setLoading(false); }
  };

  const resetAll = () => {
    setVoiceType('Soft Lead'); setDescriptor('Warm'); setGenre('Ambient'); setNotes(''); setSynth('Generic');
    setGuide(null); setError(''); setWave('sawtooth + noise'); setOscOct({ o1:0, o2:0, o3:0 });
    setTunings({ c1:0, c2:0, c3:0, f1:0, f2:0, f3:0 }); setAdsrVCF({ attack:0.1, decay:0.5, sustain:0.8, release:1.5 });
    setAdsrVCA({ attack:0.05, decay:0.3, sustain:0.9, release:0.6 }); setKnobs({ Cutoff:0, Resonance:0, Drive:0, Mix:0, 'Filter Drive':0 }); setMods([]);
  };

  // Graph renderer
  const renderAudioGraph = (ctx: OfflineAudioContext) => {
    // Oscillators + noise
    const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i=0; i<d.length; i++) d[i] = (Math.random()*2 -1)*0.05;
    const noise = ctx.createBufferSource(); noise.buffer = noiseBuf; noise.loop = true;

    const o1 = ctx.createOscillator(); o1.type = 'sawtooth';
    const filter = ctx.createBiquadFilter(); filter.type = 'lowpass';
    filter.frequency.value = knobs.Cutoff * ctx.sampleRate/2;
    filter.Q.value = knobs.Resonance * 20;

    const gain = ctx.createGain();
    o1.connect(filter); noise.connect(filter);
    filter.connect(gain); gain.connect(ctx.destination);
    o1.start(); noise.start();

    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(1, now + adsrVCA.attack);
    gain.gain.linearRampToValueAtTime(adsrVCA.sustain, now + adsrVCA.attack + adsrVCA.decay);
    gain.gain.setValueAtTime(adsrVCA.sustain, now + duration);
    gain.gain.linearRampToValueAtTime(0, now + duration + adsrVCA.release);

    return gain;
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <Card>
        <h1 className="text-2xl font-bold text-white">PatchGuide AI</h1>
        <p className="text-gray-300">Select parameters to generate your patch.</p>
        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select value={voiceType} onChange={e=>setVoiceType(e.target.value)} className="p-2 bg-gray-700 rounded text-white">
              {VOICE_TYPES.map(o => <option key={o}>{o}</option>)}
            </select>
            <select value={descriptor} onChange={e=>setDescriptor(e.target.value)} className="p-2 bg-gray-700 rounded text-white">
              {DESCRIPTORS.map(o => <option key={o}>{o}</option>)}
            </select>
            <select value={genre} onChange={e=>setGenre(e.target.value)} className="p-2 bg-gray-700 rounded text-white">
              {GENRES.map(o => <option key={o}>{o}</option>)}
            </select>
            <input type="text" placeholder="Notes..." value={notes} onChange={e=>setNotes(e.target.value)} className="p-2 bg-gray-700 rounded text-white" />
          </div>
          <select value={synth} onChange={e=>setSynth(e.target.value)} className="w-full p-2 bg-gray-700 rounded text-white">
            {SYNTH_OPTIONS.map(o => <option key={o}>{o}</option>)}
          </select>
          {error && <div className="text-red-400">{error}</div>}
          <div className="flex space-x-3">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? <><Spinner size="sm"/> Generating...</> : 'Generate Guide'}
            </Button>
            <Button variant="outline" onClick={resetAll}>Reset</Button>
          </div>
        </form>
      </Card>

      {guide && (
        <>
          {/* Oscillator Settings */}
          <Card>
            <h2 className="text-xl font-semibold text-white mb-2">1. Oscillator Settings</h2>
            <table className="w-full text-gray-200 border-collapse">
              <thead><tr className="bg-gray-800"><th className="p-2">Osc</th><th className="p-2">Wave</th><th className="p-2">Oct</th><th className="p-2">Coarse</th><th className="p-2">Fine</th></tr></thead>
              <tbody>
                <tr className="border-t border-gray-700"><td className="p-2">Osc 1</td><td className="p-2">{wave}</td><td className="p-2">{oscOct.o1}</td><td className="p-2">{tunings.c1}</td><td className="p-2">{tunings.f1}</td></tr>
                {oscOct.o2!==0 && <tr className="border-t border-gray-700"><td className="p-2">Osc 2</td><td className="p-2">{wave}</td><td className="p-2">{oscOct.o2}</td><td className="p-2">{tunings.c2}</td><td className="p-2">{tunings.f2}</td></tr>}
                {oscOct.o3!==0 && <tr className="border-t border-gray-700"><td className="p-2">Osc 3</td><td className="p-2">{wave}</td><td className="p-2">{oscOct.o3}</td><td className="p-2">{tunings.c3}</td><td className="p-2">{tunings.f3}</td></tr>}
              </tbody>
            </table>
          </Card>

          {/* Filter Settings */}
          <Card>
            <h2 className="text-xl font-semibold text-white mb-2">2. Filter Settings</h2>
            <table className="w-full text-gray-200 border-collapse">
              <thead><tr className="bg-gray-800"><th className="p-2">Param</th><th className="p-2">Value</th><th className="p-2">Notes</th></tr></thead>
              <tbody>
                {Object.keys(knobs).map(k => (
                  <tr key={k} className="border-t border-gray-700"><td className="p-2">{k}</td><td className="p-2">{Math.round(knobs[k]*100)}%</td><td className="p-2">—</td></tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Envelopes */}
          <Card>
            <h2 className="text-xl font-semibold text-white mb-2">3. VCF & VCA Envelopes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <EnvelopeChart {...adsrVCF} width={300} height={150} label="VCF" />
              <EnvelopeChart {...adsrVCA} width={300} height={150} label="VCA" />
            </div>
          </Card>

          {/* Effects & Performance */}
          <Card>
            <h2 className="text-xl font-semibold text-white mb-2">4. Effects & Performance</h2>
            <div className="flex flex-wrap gap-4 mb-4">
              {Object.entries(knobs).map(([l,v]) => <Knob key={l} label={l} value={v} />)}
            </div>
            {mods.length>0 && <ModulationMatrix routings={mods} />}
          </Card>

          {/* Visual Aids */}
          <Card>
            <h2 className="text-xl font-semibold text-white mb-2">5. Visual Aids</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AnimatedWaveformPreview renderAudioGraph={renderAudioGraph} width={400} height={120} duration={duration} fps={20} />
            </div>
          </Card>
        </>
      )}
    </div>
  );
};
