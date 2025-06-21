import React, { useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Spinner } from './Spinner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { EnvelopeChart } from './EnvelopeChart';
import { Knob } from './Knob';
import { ModulationMatrix, ModRouting } from './ModulationMatrix';
import { generateSynthPatchGuide } from '../services/patchGuideService';

const SYNTH_OPTIONS = [
  'Serum', 'Vital', 'Pigments', 'Massive', 'Massive X',
  'Diva', 'Hive 2', 'Sylenth1', 'Wavestate', 'Jupiter-8',
  'Juno-106', 'SH-101', 'Operator', 'Wavetable', 'Retro Synth',
  'Alchemy', 'FM8', 'Phase Plant', 'Omnisphere', 'Analog Lab', 'Generic'
];
const VOICE_TYPES = [
  'Soft Lead', 'Hard Lead', 'Evolving Pad', 'Bass', 'Pluck',
  'Ambient Texture', 'Arpeggio', 'Drone', 'FX', 'Keys'
];
const DESCRIPTORS = [
  'Warm', 'Bright', 'Gritty', 'Smooth', 'Distorted',
  'Clean', 'Vintage', 'Modern', 'Aggressive', 'Subtle'
];
const GENRES = [
  'Ambient', 'EDM', 'Rock', 'Pop', 'Hip-Hop',
  'Jazz', 'Classical', 'Experimental', 'Techno', 'House'
];

// Map knob [0-1] to frequency [20-20000] Hz
const knobToHz = (v: number) => Math.round(Math.max(20, Math.min(20000, 20 + v * (20000 - 20))));

export const PatchGuide: React.FC = () => {
  // Form inputs
  const [synth, setSynth] = useState('Generic');
  const [voiceType, setVoiceType] = useState('Soft Lead');
  const [descriptor, setDescriptor] = useState('Warm');
  const [genre, setGenre] = useState('Ambient');
  const [notes, setNotes] = useState('');

  // AI results & parameters
  const [guide, setGuide] = useState<string | null>(null);
  const [oscOct, setOscOct] = useState({ o1: 0, o2: 0, o3: 0 });
  const [tunings, setTunings] = useState({ c1: 0, c2: 0, c3: 0, f1: 0, f2: 0, f3: 0 });
  const [adsrVCF, setAdsrVCF] = useState({ attack: 0.1, decay: 0.5, sustain: 0.8, release: 1.5 });
  const [adsrVCA, setAdsrVCA] = useState({ attack: 0.05, decay: 0.3, sustain: 0.9, release: 0.6 });
  const [knobs, setKnobs] = useState<Record<string, number>>({
    Cutoff: 0.5, Resonance: 0.3, Drive: 0, Mix: 0,
    Reverb: 0.7, DelayTime: 0.4, DelayFB: 0.5,
    ChorusDepth: 0.25, ChorusRate: 0.15, MasterTune: 0
  });
  const [mods, setMods] = useState<ModRouting[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(''); setGuide(null);
    try {
      const res = await generateSynthPatchGuide({ description: `${voiceType}, ${descriptor} for ${genre}. ${notes}`, synth, voiceType, descriptor, genre, notes });
      setGuide(res.text || '');
      if (res.oscSettings) {
        setOscOct({ o1: res.oscSettings.o1Oct||0, o2: res.oscSettings.o2Oct||0, o3: res.oscSettings.o3Oct||0 });
        setTunings({ c1:res.oscSettings.o1Coarse||0, c2:res.oscSettings.o2Coarse||0, c3:res.oscSettings.o3Coarse||0, f1:res.oscSettings.o1Fine||0, f2:res.oscSettings.o2Fine||0, f3:res.oscSettings.o3Fine||0 });
      }
      if (res.adsrVCF) setAdsrVCF(res.adsrVCF);
      if (res.adsrVCA) setAdsrVCA(res.adsrVCA);
      if (res.knobs) setKnobs(res.knobs);
      if (Array.isArray(res.modMatrix)) setMods(res.modMatrix);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally { setLoading(false); }
  };

  const resetAll = () => {
    setSynth('Generic'); setVoiceType('Soft Lead'); setDescriptor('Warm'); setGenre('Ambient'); setNotes('');
    setGuide(null); setError(''); setOscOct({o1:0,o2:0,o3:0}); setTunings({c1:0,c2:0,c3:0,f1:0,f2:0,f3:0});
    setAdsrVCF({attack:0.1,decay:0.5,sustain:0.8,release:1.5}); setAdsrVCA({attack:0.05,decay:0.3,sustain:0.9,release:0.6});
    setKnobs({Cutoff:0.5,Resonance:0.3,Drive:0,Mix:0,Reverb:0.7,DelayTime:0.4,DelayFB:0.5,ChorusDepth:0.25,ChorusRate:0.15,MasterTune:0}); setMods([]);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Parameter Form */}
      <form onSubmit={onSubmit} className="space-y-4">
        <Card><h2 className="text-xl font-semibold text-white">Patch Guide Parameters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Synth, Voice, Descriptor, Genre, Notes inputs as above */}
          </div>
        </Card>
        <div className="flex items-center space-x-4">
          <Button type="submit" disabled={loading}>{loading?'Generating…':'Generate Patch Guide'}</Button>
          {loading && <Spinner />}
          <Button type="button" variant="secondary" onClick={resetAll}>Reset</Button>
        </div>
      </form>

      {/* Results */}
      {guide && (
        <>
          <Card><h2 className="text-xl font-semibold text-white">Patch Instructions</h2>
            <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose prose-invert p-4 bg-gray-800 rounded">{guide}</ReactMarkdown>
          </Card>

          {/* 1. Oscillator Settings */}
          <Card><h3 className="text-lg font-semibold text-white">1. Oscillator Settings</h3>
            <table className="w-full text-gray-200 border-collapse">
              <thead><tr className="bg-gray-800"><th>Osc</th><th>Wave</th><th>Oct</th><th>Coarse</th><th>Fine</th></tr></thead>
              <tbody>
                <tr className="border-t border-gray-700"><td>Osc 1</td><td>Sawtooth</td><td>{oscOct.o1}</td><td>{tunings.c1}</td><td>{tunings.f1}</td></tr>
                {oscOct.o2!==0 && <tr className="border-t border-gray-700"><td>Osc 2</td><td>Sawtooth</td><td>{oscOct.o2}</td><td>{tunings.c2}</td><td>{tunings.f2}</td></tr>}
                {oscOct.o3!==0 && <tr className="border-t border-gray-700"><td>Osc 3</td><td>Sawtooth</td><td>{oscOct.o3}</td><td>{tunings.c3}</td><td>{tunings.f3}</td></tr>}
              </tbody>
            </table>
          </Card>

          {/* 2. Filter & Effects */}
          <Card><h3 className="text-lg font-semibold text-white">2. Filter & Effects</h3>
            <table className="w-full text-gray-200 border-collapse">
              <thead><tr className="bg-gray-800"><th>Param</th><th>Value</th><th>Type</th></tr></thead>
              <tbody>
                <tr><td>Cutoff</td><td>{knobToHz(knobs.Cutoff)} Hz</td><td>Lowpass</td></tr>
                <tr><td>Resonance</td><td>{Math.round(knobs.Resonance*100)}%</td><td>Q</td></tr>
                <tr><td>Reverb</td><td>{Math.round(knobs.Reverb*100)}%</td><td>Mix</td></tr>
                <tr><td>Delay Time</td><td>{Math.round(knobs.DelayTime*100)}%</td><td>Time</td></tr>
                <tr><td>Delay FB</td><td>{Math.round(knobs.DelayFB*100)}%</td><td>Feedback</td></tr>
                <tr><td>Chorus Depth</td><td>{Math.round(knobs.ChorusDepth*100)}%</td><td>Depth</td></tr>
                <tr><td>Chorus Rate</td><td>{Math.round(knobs.ChorusRate*100)}%</td><td>Rate</td></tr>
                <tr><td>Master Tune</td><td>{Math.round(knobs.MasterTune*100)}%</td><td>Tune</td></tr>
              </tbody>
            </table>
            <div className="flex flex-wrap gap-4 mt-4">
              {Object.entries(knobs).map(([label,val])=><Knob key={label} label={label} value={val}/>)}
            </div>
          </Card>

          {/* 3. Modulation Matrix */}
          {mods.length>0 && (
            <Card><h3 className="text-lg font-semibold text-white">3. Modulation Matrix</h3>
              <ModulationMatrix routings={mods} />
            </Card>
          )}

          {/* 4. Envelopes */}
          <Card><h3 className="text-lg font-semibold text-white">4. Envelopes</h3>
            <h4 className="mt-2 font-medium text-gray-200">VCF (Voltage Controlled Filter)</h4>
            <EnvelopeChart {...adsrVCF} width={300} height={150} label="VCF Envelope" />
            <h4 className="mt-2 font-medium text-gray-200">VCA (Voltage Controlled Amp)</h4>
            <EnvelopeChart {...adsrVCA} width={300} height={150} label="VCA Envelope" />
          </Card>
        </>
      )}
    </div>
  );
};
