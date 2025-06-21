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

export const PatchGuide: React.FC = () => {
  // User inputs
  const [voiceType, setVoiceType] = useState('Soft Lead');
  const [descriptor, setDescriptor] = useState('Warm');
  const [genre, setGenre] = useState('Ambient');
  const [notes, setNotes] = useState('');
  const [synth, setSynth] = useState('Generic');

  // AI results & parameters
  const [guide, setGuide] = useState<string | null>(null);
  const [wave, setWave] = useState('sawtooth + noise');
  const [oscOct, setOscOct] = useState({ o1: 0, o2: 0, o3: 0 });
  const [tunings, setTunings] = useState({ c1: 0, c2: 0, c3: 0, f1: 0, f2: 0, f3: 0 });
  const [adsrVCF, setAdsrVCF] = useState({ attack: 0.1, decay: 0.5, sustain: 0.8, release: 1.5 });
  const [adsrVCA, setAdsrVCA] = useState({ attack: 0.05, decay: 0.3, sustain: 0.9, release: 0.6 });
  const [knobs, setKnobs] = useState<Record<string, number>>({ Cutoff: 0, Resonance: 0, Drive: 0, Mix: 0, 'Filter Drive': 0 });
  const [mods, setMods] = useState<ModRouting[]>([]);

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const duration = 1; // seconds

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setGuide(null);
    const description = `${voiceType}, ${descriptor} for ${genre}. ${notes}`;
    try {
      const res = await generateSynthPatchGuide({ description, synth, voiceType, descriptor, genre, notes });
      setGuide(res.text || '');
      setWave(res.waveform || wave);
      if (res.oscSettings) {
        setOscOct({
          o1: res.oscSettings.o1Oct || 0,
          o2: res.oscSettings.o2Oct || 0,
          o3: res.oscSettings.o3Oct || 0
        });
        setTunings({
          c1: res.oscSettings.o1Coarse || 0,
          c2: res.oscSettings.o2Coarse || 0,
          c3: res.oscSettings.o3Coarse || 0,
          f1: res.oscSettings.o1Fine || 0,
          f2: res.oscSettings.o2Fine || 0,
          f3: res.oscSettings.o3Fine || 0
        });
      }
      if (res.adsrVCF) setAdsrVCF(res.adsrVCF);
      if (res.adsrVCA) setAdsrVCA(res.adsrVCA);
      if (res.knobs) setKnobs(res.knobs);
      const matrix = Array.isArray(res.modMatrix) ? res.modMatrix : [];
      setMods(matrix.filter(m => m.amount > 0));
    } catch (err) {
      console.error('PatchGuide error', err);
      setError(err instanceof Error ? err.message : 'Error generating guide');
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setVoiceType('Soft Lead');
    setDescriptor('Warm');
    setGenre('Ambient');
    setNotes('');
    setSynth('Generic');
    setGuide(null);
    setError('');
    setWave('sawtooth + noise');
    setOscOct({ o1: 0, o2: 0, o3: 0 });
    setTunings({ c1: 0, c2: 0, c3: 0, f1: 0, f2: 0, f3: 0 });
    setAdsrVCF({ attack: 0.1, decay: 0.5, sustain: 0.8, release: 1.5 });
    setAdsrVCA({ attack: 0.05, decay: 0.3, sustain: 0.9, release: 0.6 });
    setKnobs({ Cutoff: 0, Resonance: 0, Drive: 0, Mix: 0, 'Filter Drive': 0 });
    setMods([]);
  };

  const renderAudioGraph = (ctx: OfflineAudioContext) => {
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.05;
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const o1 = ctx.createOscillator();
    o1.type = 'sawtooth';

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = knobs.Cutoff * (ctx.sampleRate / 2);
    filter.Q.value = knobs.Resonance * 20;

    const gain = ctx.createGain();

    o1.connect(filter);
    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    o1.start();
    noiseSource.start();

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
      <form onSubmit={onSubmit} className="space-y-4">
        <Card>
          <h2 className="text-xl font-semibold text-white">Patch Guide Parameters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="synth" className="block text-gray-200">Synth</label>
              <select id="synth" value={synth} onChange={e => setSynth(e.target.value)} className="mt-1 block w-full bg-gray-700 text-white p-2 rounded">
                {SYNTH_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="voiceType" className="block text-gray-200">Voice Type</label>
              <select id="voiceType" value={voiceType} onChange={e => setVoiceType(e.target.value)} className="mt-1 block w-full bg-gray-700 text-white p-2 rounded">
                                {VOICE_TYPES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="descriptor" className="block text-gray-200">Descriptor</label>
              <select id="descriptor" value={descriptor} onChange={e => setDescriptor(e.target.value)} className="mt-1 block w-full bg-gray-700 text-white p-2 rounded">
                {DESCRIPTORS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="genre" className="block text-gray-200">Genre</label>
              <select id="genre" value={genre} onChange={e => setGenre(e.target.value)} className="mt-1 block w-full bg-gray-700 text-white p-2 rounded">
                {GENRES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="notes" className="block text-gray-200">Additional Notes</label>
              <textarea
                id="notes"
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="mt-1 block w-full bg-gray-700 text-white p-2 rounded"
                placeholder="Any specific guidance…"
              />
            </div>
          </div>
        </Card>

        <div className="flex items-center space-x-4">
          <Button type="submit" disabled={loading}>
            {loading ? 'Generating…' : 'Generate Patch Guide'}
          </Button>
          {loading && <Spinner />}
          {error && <span className="text-red-400">{error}</span>}
          <Button type="button" variant="secondary" onClick={resetAll}>
            Reset
          </Button>
        </div>
      </form>

      {guide && (
        <>
          <Card>
            <h2 className="text-xl font-semibold text-white">Patch Instructions</h2>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              className="prose prose-invert p-4 bg-gray-800 rounded"
            >
              {guide}
            </ReactMarkdown>
          </Card>

          {/* 1. Oscillator Settings */}
          <Card>
            <h2 className="text-xl font-semibold text-white">1. Oscillator Settings</h2>
            <table className="w-full text-gray-200 border-collapse">
              <thead>
                <tr className="bg-gray-800">
                  <th className="p-2">Osc</th>
                  <th className="p-2">Wave</th>
                  <th className="p-2">Oct</th>
                  <th className="p-2">Coarse</th>
                  <th className="p-2">Fine</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-gray-700">
                  <td className="p-2">Osc 1</td>
                  <td className="p-2">{wave}</td>
                  <td className="p-2">{oscOct.o1}</td>
                  <td className="p-2">{tunings.c1}</td>
                  <td className="p-2">{tunings.f1}</td>
                </tr>
                {oscOct.o2 !== 0 && (
                  <tr className="border-t border-gray-700">
                    <td className="p-2">Osc 2</td>
                    <td className="p-2">{wave}</td>
                    <td className="p-2">{oscOct.o2}</td>
                    <td className="p-2">{tunings.c2}</td>
                    <td className="p-2">{tunings.f2}</td>
                  </tr>
                )}
                {oscOct.o3 !== 0 && (
                  <tr className="border-t border-gray-700">
                    <td className="p-2">Osc 3</td>
                    <td className="p-2">{wave}</td>
                    <td className="p-2">{oscOct.o3}</td>
                    <td className="p-2">{tunings.c3}</td>
                    <td className="p-2">{tunings.f3}</td>
                  </tr>
                )}
                <tr className="border-t border-gray-700">
                  <td className="p-2">Sub Osc</td>
                  <td className="p-2">Square</td>
                  <td className="p-2">—</td>
                  <td className="p-2">—</td>
                  <td className="p-2">-12 dB</td>
                </tr>
                <tr className="border-t border-gray-700">
                  <td className="p-2">Noise</td>
                  <td className="p-2">White Noise</td>
                  <td className="p-2">—</td>
                  <td className="p-2">—</td>
                  <td className="p-2">—</td>
                </tr>
              </tbody>
            </table>
          </Card>

          {/* 2. Filter Settings */}
          <Card>
            <h2 className="text-xl font-semibold text-white">2. Filter Settings</h2>
            <table className="w-full text-gray-200 border-collapse">
              <thead>
                <tr className="bg-gray-800">
                  <th className="p-2">Param</th>
                  <th className="p-2">Value</th>
                  <th className="p-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(knobs).map(([label, val]) => (
                  <tr key={label} className="border-t border-gray-700">
                    <td className="p-2">{label}</td>
                    <td className="p-2">{Math.round(val * 100)}%</td>
                    <td className="p-2">—</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* 3. Envelopes */}
          <Card>
            <h2 className="text-xl font-semibold text-white">3. Envelopes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <EnvelopeChart {...adsrVCF} width={300} height={150} label="VCF (Filter)" />
              <EnvelopeChart {...adsrVCA} width={300} height={150} label="VCA (Amp)" />
            </div>
          </Card>

          {/* 4. Effects & Modulation */}
          <Card>
            <h2 className="text-xl font-semibold text-white">4. Effects & Modulation</h2>
            <div className="flex flex-wrap gap-4 mb-4">
              {Object.entries(knobs).map(([label, val]) => (
                <Knob key={label} label={label} value={val} />
              ))}
            </div>
            {mods.length > 0 && <ModulationMatrix routings={mods} />}
          </Card>

          {/* 5. Visual Preview */}
          <Card>
            <h2 className="text-xl font-semibold text-white">5. Visual Preview</h2>
            <AnimatedWaveformPreview
              renderAudioGraph={renderAudioGraph}
              width={400}
              height={120}
              duration={duration}
              fps={20}
            />
          </Card>
        </>
      )}
    </div>
  );
};
