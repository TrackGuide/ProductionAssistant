import React, { useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Spinner } from './Spinner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { EnvelopeChart } from './EnvelopeChart';
import { generateSynthPatchGuide } from '../services/patchGuideService';
import { PATCH_INPUT_CATEGORIES, SYNTH_OPTIONS } from '../constants';
import { Knob } from './Knob';

const DEFAULT_INPUT_KEYS = ['genre', 'voiceType', 'styleMood'];
const ADVANCED_INPUT_KEYS = PATCH_INPUT_CATEGORIES.map(c => c.key).filter(k => !DEFAULT_INPUT_KEYS.includes(k));

export const PatchGuide: React.FC = () => {
  // Form inputs
  const [synth, setSynth] = useState('Generic');
  // New input state for robust form
  const [inputs, setInputs] = useState<Record<string, string[]>>({
    genre: [],
    voiceType: [],
    styleMood: [],
    notes: ['']
  });
  // Fix type error: add index signature to collapsed state type
  type CollapsedState = {
    [key: string]: boolean;
    genre: boolean;
    synth: boolean;
    voiceType: boolean;
    styleMood: boolean;
  };

  // Set all collapsible categories except dropdowns to default collapsed
  const [collapsed, setCollapsed] = useState<CollapsedState>({
    genre: false,
    synth: false,
    voiceType: false,
    styleMood: true,
  });

  // AI results & parameters
  const [guide, setGuide] = useState<string | null>(null);
  const [adsrVCF, setAdsrVCF] = useState({ attack: 0.1, decay: 0.5, sustain: 0.8, release: 1.5 });
  const [adsrVCA, setAdsrVCA] = useState({ attack: 0.05, decay: 0.3, sustain: 0.9, release: 0.6 });
  const [synthConfig, setSynthConfig] = useState<any>(null);
  const [summary, setSummary] = useState<string>('');

  // Loading / error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Helper to build PatchGuideInputs for backend
  const buildPatchGuideInputs = () => ({
    description: inputs.styleMood.join(', '),
    synth,
    genre: inputs.genre.join(', '),
    voiceType: inputs.voiceType.join(', '),
    notes: inputs.notes?.[0] || ''
  });

  // Submit
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setGuide(null);
    setSummary('');
    try {
      const res = await generateSynthPatchGuide(buildPatchGuideInputs());
      setGuide(res.text || '');
      setSummary(res.summary || '');
      // Always set and normalize synthConfig, even if oscSettings is missing
      if (res.synthConfig) {
        const normalizedSynthConfig = {
          ...res.synthConfig,
          oscillators: Array.isArray(res.synthConfig?.oscillators) ? res.synthConfig.oscillators : [],
          filters: Array.isArray(res.synthConfig?.filters) ? res.synthConfig.filters : [],
          effects: Array.isArray(res.synthConfig?.effects) ? res.synthConfig.effects : [],
          modSources: Array.isArray(res.synthConfig?.modSources) ? res.synthConfig.modSources : [],
          modDestinations: Array.isArray(res.synthConfig?.modDestinations) ? res.synthConfig.modDestinations : [],
          modMatrix: Array.isArray(res.synthConfig?.modMatrix) ? res.synthConfig.modMatrix : [],
        };
        setSynthConfig(normalizedSynthConfig);
      } else {
        setSynthConfig({
          oscillators: [],
          filters: [],
          effects: [],
          modSources: [],
          modDestinations: [],
          modMatrix: []
        });
      }
      if (res.adsrVCF) setAdsrVCF(res.adsrVCF);
      if (res.adsrVCA) setAdsrVCA(res.adsrVCA);
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
      styleMood: [],
      notes: ['']
    });
    setGuide(null);
    setError('');
    setAdsrVCF({ attack: 0.1, decay: 0.5, sustain: 0.8, release: 1.5 });
    setAdsrVCA({ attack: 0.05, decay: 0.3, sustain: 0.9, release: 0.6 });
    setSynthConfig(null);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* FORM */}
      <form onSubmit={onSubmit} className="space-y-4">
        <Card>
          <h2 className="text-xl font-semibold text-white">Describe the sound, select your synth and voice type, and get a detailed patch recipe.</h2>
          {/* --- User Inputs: 3-column dropdowns, then bubbles --- */}
          <div className="space-y-6 mb-6">
            {/* 3-column row: Synth, Genre, Voice Type dropdowns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Synth dropdown */}
              <div>
                <label className="block text-gray-200">Synth</label>
                <select
                  value={synth}
                  onChange={e => setSynth(e.target.value)}
                  className="mt-1 block w-full bg-gray-700 text-white p-2 rounded"
                >
                  <option value="" disabled>Select synth</option>
                  {SYNTH_OPTIONS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              {/* Genre dropdown */}
              <div>
                <label className="block text-gray-200">Genre</label>
                <select
                  value={inputs.genre[0] || ''}
                  onChange={e => setInputs({ ...inputs, genre: [e.target.value] })}
                  className="mt-1 block w-full bg-gray-700 text-white p-2 rounded"
                >
                  <option value="" disabled>Select genre</option>
                  {PATCH_INPUT_CATEGORIES.find(cat => cat.key === 'genre')?.examples.map((ex: string) => (
                    <option key={ex} value={ex}>{ex}</option>
                  ))}
                </select>
              </div>
              {/* Voice Type dropdown */}
              <div>
                <label className="block text-gray-200">Voice Type</label>
                <select
                  value={inputs.voiceType[0] || ''}
                  onChange={e => setInputs({ ...inputs, voiceType: [e.target.value] })}
                  className="mt-1 block w-full bg-gray-700 text-white p-2 rounded"
                >
                  <option value="" disabled>Select voice type</option>
                  {PATCH_INPUT_CATEGORIES.find(cat => cat.key === 'voiceType')?.examples.map((ex: string) => (
                    <option key={ex} value={ex}>{ex}</option>
                  ))}
                </select>
              </div>
            </div>
            {/* Style & Mood bubbles */}
            <div>
              <label className="block text-gray-200">Style & Mood</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {PATCH_INPUT_CATEGORIES.find(cat => cat.key === 'styleMood')?.examples.map((ex: string) => (
                  <button
                    type="button"
                    key={ex}
                    className={`px-3 py-1 rounded-full border text-sm ${inputs.styleMood.includes(ex) ? 'bg-orange-500 text-white border-orange-500' : 'bg-gray-700 text-gray-300 border-gray-500'}`}
                    onClick={() => {
                      const arr = [...inputs.styleMood];
                      if (arr.includes(ex)) {
                        setInputs({ ...inputs, styleMood: arr.filter(v => v !== ex) });
                      } else {
                        setInputs({ ...inputs, styleMood: [...arr, ex] });
                      }
                    }}
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
            {/* Dynamics/Movement bubbles (hardcoded options) */}
            <div>
              <label className="block text-gray-200">Dynamics / Movement</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {["Evolving", "Pulsing", "Rhythmic", "Sweeping", "Morphing", "Glitchy", "Fluttering", "Driving", "Floating", "Warped", "Phasing", "Percussive", "Sustained", "Punchy", "Decaying"].map((ex: string) => (
                  <button
                    type="button"
                    key={ex}
                    className={`px-3 py-1 rounded-full border text-sm ${Array.isArray(inputs.movement) && inputs.movement.includes(ex) ? 'bg-orange-500 text-white border-orange-500' : 'bg-gray-700 text-gray-300 border-gray-500'}`}
                    onClick={() => {
                      const arr = Array.isArray(inputs.movement) ? [...inputs.movement] : [];
                      if (arr.includes(ex)) {
                        setInputs({ ...inputs, movement: arr.filter(v => v !== ex) });
                      } else {
                        setInputs({ ...inputs, movement: [...arr, ex] });
                      }
                    }}
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
            {/* Freeform Reference Notes */}
            <div>
              <label className="block text-gray-200 mb-1">Reference Notes</label>
              <textarea
                value={inputs.notes?.[0] || ''}
                onChange={e => setInputs({ ...inputs, notes: [e.target.value] })}
                placeholder="Reference artist, track, sound design concept, or extra notes..."
                className="w-full p-2 bg-gray-700 text-white rounded"
                rows={3}
              />
            </div>
          </div>
        </Card>
        <div className="flex items-center space-x-4">
          <Button type="submit" disabled={loading}>
            {loading ? 'Generating…' : 'Generate PatchGuide'}
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
          {/* Error boundary for AI result rendering */}
          <ErrorBoundary>
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

            {/* Oscillators */}
            <Card>
              <h3 className="text-lg font-semibold text-white">Oscillators</h3>
              {(() => {
                // Always show at least two oscillators (fill with defaults if needed)
                const oscArr = Array.isArray(synthConfig?.oscillators) ? [...synthConfig.oscillators] : [];
                while (oscArr.length < 2) {
                  oscArr.push({ name: `Oscillator ${oscArr.length + 1}`, values: { Waveform: 'Sawtooth', Coarse: 0, Fine: 0, Level: 1 } });
                }
                return oscArr.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {oscArr.map((osc: any, idx: number) => {
                      const values = osc.values || {};
                      const isSub = osc.name?.toLowerCase().includes('sub');
                      const waveform = values.Waveform || values.waveform || osc.waveform || 'Sawtooth';
                      const coarse = typeof values.Coarse === 'number' ? values.Coarse : 0;
                      const fine = typeof values.Fine === 'number' ? values.Fine : 0;
                      let level = typeof values.Level === 'number' ? values.Level : 0;
                      if (level <= 1 && level >= 0) {
                        level = Math.round(level * 60 - 60);
                      }
                      return (
                        <div key={osc.id || osc.name || idx} className="bg-gray-800 rounded p-4">
                          <div className="font-bold text-orange-300 mb-2">{osc.name || `Oscillator ${idx + 1}`}</div>
                          <ul className="list-disc list-inside ml-4 mb-2">
                            <li className="flex items-center gap-2"><span className="font-semibold">Waveform:</span> {waveform}</li>
                            <li className="flex items-center gap-2">
                              <span className="font-semibold">{isSub ? 'Octave:' : 'Coarse:'}</span> {coarse}
                            </li>
                            <li className="flex items-center gap-2"><span className="font-semibold">Fine:</span> {fine}</li>
                            <li className="flex items-center gap-2"><span className="font-semibold">Level (dB):</span> {level}</li>
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                ) : <div className="text-gray-400">No oscillator data.</div>;
              })()}
            </Card>

            {/* Effects */}
            <Card>
              <h3 className="text-lg font-semibold text-white">Effects</h3>
              {Array.isArray(synthConfig?.effects) && synthConfig.effects.length > 0 ? (
                <div className="space-y-4">
                  {synthConfig.effects.map((fx: any, idx: number) => {
                    // Enhanced: handle parameter objects (with name/unit/type/range)
                    const paramObjs = Array.isArray(fx.parameters) && typeof fx.parameters[0] === 'object'
                      ? fx.parameters
                      : Array.isArray(fx.parameters)
                        ? fx.parameters.map((p: any) => ({ name: p }))
                        : [];
                    return (
                      <div key={fx.name || idx} className="mb-2 grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                        {/* Left: effect name and all point-form notes (numeric and non-numeric params) */}
                        <div>
                          <div className="font-bold text-green-300 mb-1">{fx.name}</div>
                          <ul className="list-disc list-inside ml-4">
                            {paramObjs.length > 0 ? paramObjs.map((param: any) => (
                              <li key={param.name} className="flex items-center gap-2">
                                <span className="font-semibold">{param.name}:</span>
                                {fx[param.name] !== undefined ? (
                                  <>
                                    {fx[param.name]}{param.unit ? <span className="text-xs text-gray-400 ml-1">{param.unit}</span> : null}
                                  </>
                                ) : '—'}
                              </li>
                            )) : <li className="text-gray-400">No parameters</li>}
                          </ul>
                        </div>
                        {/* Right: Knobs for numeric params only as visual aids */}
                        <div className="flex flex-wrap gap-4">
                          {paramObjs.filter((param: any) => param.type === 'float' || param.type === 'int').filter((param: any) => typeof fx[param.name] === 'number').length > 0 ? paramObjs.filter((param: any) => (param.type === 'float' || param.type === 'int') && typeof fx[param.name] === 'number').map((param: any) => (
                            <div key={param.name} className="flex flex-col items-center">
                              <Knob value={fx[param.name]} label={param.name} size={48} min={param.range ? param.range[0] : 0} max={param.range ? param.range[1] : 1} />
                              {param.unit && <span className="text-xs text-gray-400">{param.unit}</span>}
                            </div>
                          )) : <span className="text-gray-400">No numeric parameters</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : <div className="text-gray-400">No relevant effects for this patch.</div>}
            </Card>

            {/* Filter and Envelopes */}
            <Card>
              <h3 className="text-lg font-semibold text-white">Filter and Envelopes</h3>
              <div className="flex flex-col md:flex-row gap-8 items-center justify-center">
                {/* Filter knobs and info */}
                <div className="flex flex-col items-center">
                  {Array.isArray(synthConfig?.filters) && synthConfig.filters.map((filter: any, idx: number) => {
                    // Dynamic fallback for cutoff/resonance
                    const genre = (inputs.genre[0] || '').toLowerCase();
                    const voiceType = (inputs.voiceType[0] || '').toLowerCase();
                    let cutoff = typeof filter.cutoff === 'number' ? filter.cutoff : undefined;
                    let resonance = typeof filter.resonance === 'number' ? filter.resonance : undefined;
                    if (typeof cutoff !== 'number' || isNaN(cutoff)) {
                      if (voiceType.includes('lead') || genre.includes('lead') || genre.includes('pluck')) cutoff = 0.7;
                      else if (voiceType.includes('pad') || genre.includes('pad') || genre.includes('ambient')) cutoff = 0.4;
                      else if (voiceType.includes('bass') || genre.includes('bass')) cutoff = 0.25;
                      else cutoff = 0.5;
                    }
                    if (typeof resonance !== 'number' || isNaN(resonance)) {
                      if (voiceType.includes('lead') || genre.includes('lead') || genre.includes('pluck')) resonance = 0.18;
                      else if (voiceType.includes('pad') || genre.includes('pad') || genre.includes('ambient')) resonance = 0.35;
                      else if (voiceType.includes('bass') || genre.includes('bass')) resonance = 0.28;
                      else resonance = 0.3;
                    }
                    const cutoffHz = cutoff * 20000;
                    return (
                      <div key={filter.name || idx} className="mb-4 flex flex-col items-center">
                        <div className="font-medium text-gray-200 mb-2">Filter type: <span className="font-bold text-orange-400">{filter.selectedType || (Array.isArray(filter.types) && filter.types[0]) || 'Lowpass'}</span></div>
                        <div className="flex flex-row gap-6 mb-2">
                          <Knob value={cutoff} label="Cutoff" size={80} min={0} max={1} />
                          <Knob value={resonance} label="Resonance" size={80} min={0} max={1} />
                        </div>
                        <div className="text-gray-300">
                          <span>Cutoff: <span className="font-mono">{cutoffHz.toFixed(0)} Hz</span></span>
                          <span className="ml-4">Resonance: <span className="font-mono">{resonance.toFixed(2)}</span></span>
                        </div>
                        {(typeof filter.slope === 'number') && (
                          <div className="text-gray-300">Slope: <span className="font-mono">{filter.slope} dB/oct</span></div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* Envelope visuals side by side */}
                <div className="flex flex-col md:flex-row gap-8 items-center">
                  {/* Filter Envelope */}
                  <div className="flex flex-col items-center">
                    <div className="font-medium text-gray-200">Filter Envelope</div>
                    <EnvelopeChart {...(synthConfig?.envelopes?.values?.[0] || adsrVCF)} width={240} height={120} />
                  </div>
                  {/* Amp Envelope */}
                  <div className="flex flex-col items-center">
                    <div className="font-medium text-gray-200">Amp Envelope</div>
                    <EnvelopeChart {...(synthConfig?.envelopes?.values?.[1] || adsrVCA)} width={240} height={120} />
                  </div>
                </div>
              </div>
            </Card>

            {/* Modulation Matrix */}
            {Array.isArray(synthConfig?.modMatrix) ? (
              synthConfig.modMatrix.length > 0 ? (
                <Card>
                  <h3 className="text-lg font-semibold text-white">Modulation Matrix</h3>
                  <table className="w-full text-gray-200 border-collapse mb-3">
                    <thead>
                      <tr className="bg-gray-800">
                        <th className="p-2">Source</th>
                        <th className="p-2">Target</th>
                        <th className="p-2">Parameter</th>
                        <th className="p-2">Amount</th>
                        <th className="p-2">LFO Waveform</th>
                        <th className="p-2">LFO Freq</th>
                        <th className="p-2">LFO Rate</th>
                        <th className="p-2">LFO Depth</th>
                      </tr>
                    </thead>
                    <tbody>
                      {synthConfig.modMatrix.filter((row: any) => !(row.source === 'Env' && row.parameter && row.parameter.toLowerCase().includes('cutoff'))).map((row: any, idx: number) => (
                        <tr key={(row?.source || '') + (row?.target || '') + (row?.parameter || '') + idx} className="border-t border-gray-700">
                          <td className="p-2">{row?.source || '—'}</td>
                          <td className="p-2">{row?.target || '—'}</td>
                          <td className="p-2">{row?.parameter || '—'}</td>
                          <td className="p-2">{typeof row?.amount === 'number' ? `${Math.round(row.amount * 100)}%` : '—'}</td>
                          <td className="p-2">{row?.lfoWaveform || '—'}</td>
                          <td className="p-2">{typeof row?.lfoFrequency === 'number' ? row.lfoFrequency.toFixed(2) : '—'}</td>
                          <td className="p-2">{typeof row?.lfoRate === 'number' ? row.lfoRate.toFixed(2) : '—'}</td>
                          <td className="p-2">{typeof row?.lfoDepth === 'number' ? row.lfoDepth.toFixed(2) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              ) : (
                <div className="text-gray-400">This patch does not use explicit mod matrix routings — try adding more modulation to bring it to life!</div>
              )
            ) : <div className="text-gray-400">This patch does not use explicit mod matrix routings — try adding more modulation to bring it to life!</div>}
          </ErrorBoundary>
        </>
      )}

      {/* Creative Suggestions (Summary) */}
      {typeof summary === 'string' && summary.trim() ? (
        <Card>
          <h3 className="text-lg font-semibold text-white">Creative Tips & Suggestions</h3>
          <div className="prose prose-invert p-4 bg-gray-800 rounded">
            <ul className="list-disc list-inside ml-4">
              {summary.split(/\n|\n- |\n\n|\r\n|\r/).filter(Boolean).map((tip, idx) => (
                <li key={idx}>{tip.replace(/^[-\s]+/, '').trim()}</li>
              ))}
            </ul>
          </div>
        </Card>
      ) : null}
    </div>
  );
};

// ErrorBoundary component for robust error handling
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; errorMsg: string }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, errorMsg: error?.message || String(error) };
  }
  componentDidCatch(error: any, info: any) {
    // Optionally log error
    // console.error('ErrorBoundary caught:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return <div className="text-red-500 bg-gray-900 p-4 rounded">Error rendering patch guide: {this.state.errorMsg}</div>;
    }
    return this.props.children;
  }
}
