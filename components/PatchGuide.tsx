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

const SYNTH_OPTIONS = [ /* … */ ];
const VOICE_TYPES = [ /* … */ ];
const DESCRIPTORS = [ /* … */ ];
const GENRES = [ /* … */ ];

// Map knob [0-1] to frequency [20-20000] Hz
const knobToHz = (v: number) =>
  Math.round(Math.max(20, Math.min(20000, 20 + v * (20000 - 20))));

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
    Cutoff: 0.5,
    Resonance: 0.3,
    Drive: 0,
    Mix: 0,
    Reverb: 0.7,
    DelayTime: 0.4,
    DelayFB: 0.5,
    ChorusDepth: 0.25,
    ChorusRate: 0.15,
    MasterTune: 0
  });
  const [mods, setMods] = useState<ModRouting[]>([]);

  // Loading / error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Helpers to safely pull knob values
  const getKnob = (k: string) => Number.isFinite(knobs[k]) ? knobs[k] : 0;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setGuide(null);
    try {
      const res = await generateSynthPatchGuide({
        description: `${voiceType}, ${descriptor} for ${genre}. ${notes}`,
        synth, voiceType, descriptor, genre, notes
      });

      setGuide(res.text || '');

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
      if (Array.isArray(res.modMatrix)) setMods(res.modMatrix);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error generating guide');
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setSynth('Generic');
    setVoiceType('Soft Lead');
    setDescriptor('Warm');
    setGenre('Ambient');
    setNotes('');
    setGuide(null);
    setError('');
    setOscOct({ o1: 0, o2: 0, o3: 0 });
    setTunings({ c1: 0, c2: 0, c3: 0, f1: 0, f2: 0, f3: 0 });
    setAdsrVCF({ attack: 0.1, decay: 0.5, sustain: 0.8, release: 1.5 });
    setAdsrVCA({ attack: 0.05, decay: 0.3, sustain: 0.9, release: 0.6 });
    setKnobs({
      Cutoff: 0.5,
      Resonance: 0.3,
      Drive: 0,
      Mix: 0,
      Reverb: 0.7,
      DelayTime: 0.4,
      DelayFB: 0.5,
      ChorusDepth: 0.25,
      ChorusRate: 0.15,
      MasterTune: 0
    });
    setMods([]);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* FORM */}
      <form onSubmit={onSubmit} className="space-y-4">
        <Card>
          <h2 className="text-xl font-semibold text-white">Patch Guide Parameters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Synth */}
            <div>
              <label className="block text-gray-200">Synth</label>
              <select
                value={synth}
                onChange={e => setSynth(e.target.value)}
                className="mt-1 block w-full bg-gray-700 text-white p-2 rounded"
              >
                {SYNTH_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            {/* Voice Type */}
            <div>
              <label className="block text-gray-200">Voice Type</label>
              <select
                value={voiceType}
                onChange={e => setVoiceType(e.target.value)}
                className="mt-1 block w-full bg-gray-700 text-white p-2 rounded"
              >
                {VOICE_TYPES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            {/* Descriptor */}
            <div>
              <label className="block text-gray-200">Descriptor</label>
              <select
                value={descriptor}
                onChange={e => setDescriptor(e.target.value)}
                className="mt-1 block w-full bg-gray-700 text-white p-2 rounded"
              >
                {DESCRIPTORS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            {/* Genre */}
            <div>
              <label className="block text-gray-200">Genre</label>
              <select
                value={genre}
                onChange={e => setGenre(e.target.value)}
                className="mt-1 block w-full bg-gray-700 text-white p-2 rounded"
              >
                {GENRES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-gray-200">Additional Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                className="mt-1 block w-full bg-gray-700 text-white p-2 rounded"
                placeholder="Any specifics…"
              />
            </div>
          </div>
        </Card>
        <div className="flex items-center space-x-4">
          <Button type="submit" disabled={loading}>
            {loading ? 'Generating…' : 'Generate Patch Guide'}
          </Button>
          {loading && <Spinner />}
          <Button type="button" variant="secondary" onClick={resetAll}>
            Reset
          </Button>
          {error && <span className="text-red-500">{error}</span>}
        </div>
      </form>

      {/* RESULTS */}
      {guide && (
        <>
          {/* Instructions */}
          <Card>
            <h2 className="text-xl font-semibold text-white">Patch Instructions</h2>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              className="prose prose-invert p-4 bg-gray-800 rounded"
            >
              {guide}
            </ReactMarkdown>
          </Card>

          {/* 1. Oscillators */}
          <Card>
            <h3 className="text-lg font-semibold text-white">1. Oscillators</h3>
            <table className="w-full text-gray-200 border-collapse">
              <thead>
                <tr className="bg-gray-800">
                  <th className="p-2">Source</th>
                  <th className="p-2">Wave</th>
                  <th className="p-2">Oct</th>
                  <th className="p-2">Coarse</th>
                  <th className="p-2">Fine</th>
                </tr>
              </thead>
              <tbody>
                {/* Up to 3 oscillators */}
                {[1, 2, 3].map(i => {
                  const o = oscOct[`o${i}` as keyof typeof oscOct];
                  if (o === 0 && i > 1) return null;
                  return (
                    <tr key={i} className="border-t border-gray-700">
                      <td className="p-2">{`Osc ${i}`}</td>
                      <td className="p-2">Sawtooth</td>
                      <td className="p-2">{o}</td>
                      <td className="p-2">{tunings[`c${i}` as keyof typeof tunings]}</td>
                      <td className="p-2">{tunings[`f${i}` as keyof typeof tunings]}</td>
                    </tr>
                  );
                })}
                {/* Sub + Noise */}
                <tr className="border-t border-gray-700">
                  <td className="p-2">Sub Osc</td>
                  <td className="p-2">Square</td>
                  <td className="p-2">—</td>
                  <td className="p-2">—</td>
                  <td className="p-2">—12 dB</td>
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

          {/* 2. Filter */}
          <Card>
            <h3 className="text-lg font-semibold text-white">2. Filter</h3>
            <div className="space-y-1 text-gray-200">
              <div><strong>Type:</strong> Lowpass</div>
              <div><strong>Slope:</strong> 12 dB/oct</div>
            </div>
            <div className="flex flex-wrap gap-6 mt-3">
              <Knob label="Cutoff (Hz)" value={getKnob('Cutoff')} />
              <Knob label="Resonance (%)" value={getKnob('Resonance')} />
            </div>
            <div className="mt-1 text-gray-200">
              {knobToHz(getKnob('Cutoff'))} Hz &nbsp;|&nbsp; {Math.round(getKnob('Resonance') * 100)}%
            </div>
          </Card>

          {/* 3. Effects */}
          <Card>
            <h3 className="text-lg font-semibold text-white">3. Effects</h3>
            {/* Table of params */}
            <table className="w-full text-gray-200 border-collapse mb-3">
              <thead>
                <tr className="bg-gray-800">
                  <th className="p-2 text-left">Parameter</th>
                  <th className="p-2 text-left">Value</th>
                </tr>
              </thead>
              <tbody>
                {[
                  'Drive', 'Mix', 'Reverb',
                  'DelayTime', 'DelayFB', 'ChorusDepth',
                  'ChorusRate', 'MasterTune'
                ].map(key => (
                  <tr key={key} className="border-t border-gray-700">
                    <td className="p-2">{key.replace(/([A-Z])/g, ' $1').trim()}</td>
                    <td className="p-2">{Math.round(getKnob(key) * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Knobs */}
            <div className="flex flex-wrap gap-6">
              {[
                'Drive', 'Mix', 'Reverb',
                'DelayTime', 'DelayFB', 'ChorusDepth',
                'ChorusRate', 'MasterTune'
              ].map(key => (
                <Knob key={key} label={key.replace(/([A-Z])/g, ' $1').trim()} value={getKnob(key)} />
              ))}
            </div>
          </Card>

          {/* 4. Modulation Matrix */}
          <Card>
            <h3 className="text-lg font-semibold text-white">4. Modulation Matrix</h3>
            {mods.length > 0 ? (
              <ModulationMatrix routings={mods} />
            ) : (
              <div className="text-gray-200">
                <p>No visual available. Here’s your routing list:</p>
                <ul className="list-disc ml-5">
                  {mods.map((m, i) => (
                    <li key={i}>
                      <strong>Modulator:</strong> {m.source} → 
                      <strong> Carrier:</strong> {m.target} = 
                      <strong> {Math.round(m.amount * 100)}%</strong>
                    </li>
                  ))}
                  {mods.length === 0 && <li>(none)</li>}
                </ul>
              </div>
            )}
          </Card>

          {/* 5. Envelopes */}
          <Card>
            <h3 className="text-lg font-semibold text-white">5. Envelopes</h3>
            <div className="flex flex-col md:flex-row gap-8 mt-4">
              <div>
                <h4 className="font-medium text-gray-200">VCF (Voltage Controlled Filter)</h4>
                <EnvelopeChart {...adsrVCF} width={300} height={150} label="VCF Env" />
              </div>
              <div>
                <h4 className="font-medium text-gray-200">VCA (Voltage Controlled Amp)</h4>
                <EnvelopeChart {...adsrVCA} width={300} height={150} label="VCA Env" />
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};