import React, { useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Spinner } from './Spinner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { EnvelopeChart } from './EnvelopeChart';
import { Knob } from './Knob';
import { generateSynthPatchGuide } from '../services/patchGuideService';
import { PATCH_INPUT_CATEGORIES, SYNTH_OPTIONS } from '../constants';

const knobToHz = (v: number) =>
  Math.round(Math.max(20, Math.min(20000, 20 + v * (20000 - 20))));

const DEFAULT_INPUT_KEYS = ['genre', 'voiceType', 'timbre', 'notes'];
const ADVANCED_INPUT_KEYS = PATCH_INPUT_CATEGORIES.map(c => c.key).filter(k => !DEFAULT_INPUT_KEYS.includes(k));

// Use SYNTH_OPTIONS_LIST for synth selection
const SYNTH_OPTIONS_LIST = [
  'Xfer Serum',
  'Vital',
  'Pigments',
  'Native Instruments Massive',
  'Native Instruments Massive X',
  'Diva',
  'Hive 2',
  'Sylenth1',
  'Korg Wavestate',
  'Roland Jupiter-8',
  'Roland Juno-106',
  'Roland SH-101',
  'Ableton Operator',
  'Ableton Wavetable',
  'Apple Retro Synth',
  'Apple Alchemy',
  'Native Instruments FM8',
  'Kilohearts Phase Plant',
  'Omnisphere',
  'Arturia Analog Lab',
  'Generic Synth',
  'TAL TAL-U-No-LX',
  'u-he Repro-5',
  'u-he Repro-1',
  'Native Instruments Monark',
  'Bazille',
  'Zebra2',
  'Arturia PolyBrute',
  'Moog Minimoog',
  'DiscoDSP OB-Xd',
  'Korg MS-20'
];

export const PatchGuide: React.FC = () => {
  // Form inputs
  const [synth, setSynth] = useState('Generic');
  // New input state for robust form
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [inputs, setInputs] = useState<Record<string, string[] | string>>({
    genre: [],
    voiceType: [],
    timbre: [],
    notes: '',
    // advanced keys default to []
    ...Object.fromEntries(ADVANCED_INPUT_KEYS.map(k => [k, []]))
  });

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
  const [modMatrixMarkdown, setModMatrixMarkdown] = useState<string | null>(null);
  const [synthConfig, setSynthConfig] = useState<any>(null);

  // Loading / error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Helper
  const getKnob = (k: string) =>
    typeof knobs[k] === 'number' && isFinite(knobs[k]) ? knobs[k] : 0;

  // Submit
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setGuide(null);
    try {
      const res = await generateSynthPatchGuide({
        description: `${inputs.patchStyle}, ${inputs.timbre} ${inputs.movement} ${inputs.mood} ${inputs.era} ${inputs.inspiration} ${inputs.dynamics}. ${inputs.notes}`,
        synth, ...inputs
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
      if (res.synthConfig) setSynthConfig(res.synthConfig);
      if (res.adsrVCF) setAdsrVCF(res.adsrVCF);
      if (res.adsrVCA) setAdsrVCA(res.adsrVCA);
      if (res.knobs) setKnobs(res.knobs);
      if (res.modMatrixMarkdown) setModMatrixMarkdown(res.modMatrixMarkdown);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error generating guide');
    } finally {
      setLoading(false);
    }
  };

  // Reset
  const resetAll = () => {
    setSynth('Generic');
    setInputs({
      genre: [],
      voiceType: [],
      timbre: [],
      notes: '',
      // advanced keys default to []
      ...Object.fromEntries(ADVANCED_INPUT_KEYS.map(k => [k, []]))
    });
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
    setModMatrixMarkdown(null);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* FORM */}
      <form onSubmit={onSubmit} className="space-y-4">
        <Card>
          <h2 className="text-xl font-semibold text-white">Patch Guide Parameters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PATCH_INPUT_CATEGORIES.filter(cat => DEFAULT_INPUT_KEYS.includes(cat.key)).map(cat => (
              <div key={cat.category}>
                <label className="block text-gray-200">{cat.category}</label>
                {Array.isArray(cat.examples[0]) || cat.examples[0]?.subCategory ? (
                  <select
                    multiple
                    value={inputs[cat.key] as string[]}
                    onChange={e => setInputs({ ...inputs, [cat.key]: Array.from(e.target.selectedOptions, o => o.value) })}
                    className="mt-1 block w-full bg-gray-700 text-white p-2 rounded"
                  >
                    {cat.examples.map((sub: any) => (
                      sub.subCategory ? (
                        <optgroup key={sub.subCategory} label={sub.subCategory}>
                          {sub.examples.map((ex: string) => (
                            <option key={ex} value={ex}>{ex}</option>
                          ))}
                        </optgroup>
                      ) : (
                        <option key={sub} value={sub}>{sub}</option>
                      )
                    ))}
                  </select>
                ) : (
                  <select
                    multiple
                    value={inputs[cat.key] as string[]}
                    onChange={e => setInputs({ ...inputs, [cat.key]: Array.from(e.target.selectedOptions, o => o.value) })}
                    className="mt-1 block w-full bg-gray-700 text-white p-2 rounded"
                  >
                    {cat.examples.map((ex: string) => (
                      <option key={ex} value={ex}>{ex}</option>
                    ))}
                  </select>
                )}
              </div>
            ))}
            <div className="col-span-2">
              <label className="block text-gray-200">Notes</label>
              <textarea
                value={inputs.notes as string}
                onChange={e => setInputs({ ...inputs, notes: e.target.value })}
                className="mt-1 block w-full bg-gray-700 text-white p-2 rounded"
                rows={2}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-gray-200">Synth</label>
              <select
                value={synth}
                onChange={e => setSynth(e.target.value)}
                className="mt-1 block w-full bg-gray-700 text-white p-2 rounded"
              >
                {SYNTH_OPTIONS_LIST.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>
          <Button type="button" onClick={() => setShowAdvanced(v => !v)}>
            {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
          </Button>
          {showAdvanced && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {PATCH_INPUT_CATEGORIES.filter(cat => ADVANCED_INPUT_KEYS.includes(cat.key)).map(cat => (
                <div key={cat.category}>
                  <label className="block text-gray-200">{cat.category}</label>
                  <select
                    multiple
                    value={inputs[cat.key] as string[]}
                    onChange={e => setInputs({ ...inputs, [cat.key]: Array.from(e.target.selectedOptions, o => o.value) })}
                    className="mt-1 block w-full bg-gray-700 text-white p-2 rounded"
                  >
                    {cat.examples.map((ex: string) => (
                      <option key={ex} value={ex}>{ex}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
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
            <div className="prose prose-invert p-4 bg-gray-800 rounded">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
              >
                {guide}
              </ReactMarkdown>
            </div>
          </Card>

          {/* 1. Oscillators */}
          <Card>
            <h3 className="text-lg font-semibold text-white">1. Oscillators</h3>
            {synthConfig && synthConfig.oscillators ? (
              <table className="w-full text-gray-200 border-collapse">
                <thead>
                  <tr className="bg-gray-800">
                    <th className="p-2">Source</th>
                    {synthConfig.oscillators[0]?.params?.map((param: string) => (
                      <th key={param} className="p-2">{param}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {synthConfig.oscillators.map((osc: any, idx: number) => (
                    <tr key={osc.id || idx} className="border-t border-gray-700">
                      <td className="p-2">{osc.name}</td>
                      {osc.params.map((param: string) => (
                        <td key={param} className="p-2">{/* TODO: Show actual value if available */}—</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <div className="text-gray-400">No oscillator data.</div>}
          </Card>

          {/* 3. Effects */}
          <Card>
            <h3 className="text-lg font-semibold text-white">3. Effects</h3>
            {synthConfig && synthConfig.effects && synthConfig.effects.length > 0 ? (
              <table className="w-full text-gray-200 border-collapse mb-3">
                <thead>
                  <tr className="bg-gray-800">
                    <th className="p-2 text-left">Effect</th>
                    <th className="p-2 text-left">Default Setting</th>
                  </tr>
                </thead>
                <tbody>
                  {synthConfig.effects.map((fx: any, idx: number) => (
                    <tr key={fx.name || idx} className="border-t border-gray-700">
                      <td className="p-2 font-bold text-green-300">{fx.name}</td>
                      <td className="p-2">{fx.defaultSetting || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <div className="text-gray-400">No relevant effects for this patch.</div>}
          </Card>

          {/* 2. Filters and Envelopes */}
          <Card>
            <h3 className="text-lg font-semibold text-white">2. Filters and Envelopes</h3>
            <div className="flex flex-wrap gap-8">
              {synthConfig && synthConfig.filters && synthConfig.filters.map((filter: any, idx: number) => (
                <div key={filter.name || idx} className="flex flex-col">
                  <div className="font-medium text-gray-200">{filter.name}</div>
                  <div className="text-gray-300">Types: {filter.types?.join(', ')}</div>
                  <div className="text-gray-300">Relevant Params: {filter.relevantParams?.join(', ')}</div>
                </div>
              ))}
              {synthConfig && synthConfig.envelopes && synthConfig.envelopes.labels && synthConfig.envelopes.labels.map((label: string, idx: number) => (
                <div key={label} className="flex flex-col items-center">
                  <div className="font-medium text-gray-200">{label}</div>
                  <EnvelopeChart {...(idx === 0 ? adsrVCF : adsrVCA)} width={200} height={100} />
                </div>
              ))}
            </div>
          </Card>

          {/* 4. Modulation Matrix */}
          <Card>
            <h3 className="text-lg font-semibold text-white">4. Modulation Matrix</h3>
            {synthConfig && synthConfig.modSources && synthConfig.modDestinations ? (
              <table className="w-full text-gray-200 border-collapse mb-3">
                <thead>
                  <tr className="bg-gray-800">
                    <th className="p-2">Source</th>
                    <th className="p-2">Target</th>
                    <th className="p-2">Parameter</th>
                  </tr>
                </thead>
                <tbody>
                  {synthConfig.modSources.map((source: string) => (
                    Object.entries(synthConfig.modDestinations).map(([target, params]: [string, any]) => (
                      (params as string[]).map((param: string) => (
                        <tr key={source + target + param} className="border-t border-gray-700">
                          <td className="p-2">{source}</td>
                          <td className="p-2">{target}</td>
                          <td className="p-2">{param}</td>
                        </tr>
                      ))
                    ))
                  ))}
                </tbody>
              </table>
            ) : <div className="text-gray-400">No modulation matrix available for this synth.</div>}
          </Card>
        </>
      )}
    </div>
  );
};
