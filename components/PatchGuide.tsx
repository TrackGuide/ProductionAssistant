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

const DEFAULT_INPUT_KEYS = ['genre', 'voiceType', 'characterMood', 'movementDynamics'];
const ADVANCED_INPUT_KEYS = PATCH_INPUT_CATEGORIES.map(c => c.key).filter(k => !DEFAULT_INPUT_KEYS.includes(k));

export const PatchGuide: React.FC = () => {
  // Form inputs
  const [synth, setSynth] = useState('Generic');
  // New input state for robust form
  const [inputs, setInputs] = useState<Record<string, string[]>>({
    genre: [],
    voiceType: [],
    characterMood: [],
    movementDynamics: [],
    // advanced keys default to []
    ...Object.fromEntries(ADVANCED_INPUT_KEYS.map(k => [k, []]))
  });
  // Fix type error: add index signature to collapsed state type
  type CollapsedState = {
    [key: string]: boolean;
    genre: boolean;
    synth: boolean;
    voiceType: boolean;
    characterMood: boolean;
    movementDynamics: boolean;
  };

  // Set all collapsible categories except dropdowns to default collapsed
  const [collapsed, setCollapsed] = useState<CollapsedState>({
    genre: false,
    synth: false,
    voiceType: false,
    characterMood: true,
    movementDynamics: true,
    era: true,
    concept: true,
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

  // Submit
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setGuide(null);
    setSummary('');
    try {
      const res = await generateSynthPatchGuide({
        description: `${inputs.characterMood.join(', ')} ${inputs.movementDynamics.join(', ')}`,
        synth,
        genre: inputs.genre.join(', '),
        voiceType: inputs.voiceType.join(', ')
      });
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
      characterMood: [],
      movementDynamics: [],
      // advanced keys default to []
      ...Object.fromEntries(ADVANCED_INPUT_KEYS.map(k => [k, []]))
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
          {/* --- Top row: genre, synth, voice type as dropdowns in three columns --- */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Genre dropdown */}
            <div>
              <label className="block text-gray-200">Genre</label>
              <select
                value={inputs.genre[0] || ''}
                onChange={e => setInputs({ ...inputs, genre: [e.target.value] })}
                className="mt-1 block w-full bg-gray-700 text-white p-2 rounded"
              >
                <option value="" disabled>Select genre</option>
                {Array.isArray(PATCH_INPUT_CATEGORIES[0].examples)
                  ? (PATCH_INPUT_CATEGORIES[0].examples as any[]).filter(group => group && typeof group === 'object' && group.group && Array.isArray(group.examples)).map(group => (
                      <optgroup key={group.group} label={group.group}>
                        {Array.isArray(group.examples)
                          ? group.examples.filter((g: string) => typeof g === 'string').map((g: string) => (
                              <option key={g} value={g}>{g}</option>
                            ))
                          : null}
                      </optgroup>
                    ))
                  : null}
              </select>
            </div>
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
            {/* Voice type dropdown */}
            <div>
              <label className="block text-gray-200">Voice Type</label>
              <select
                value={inputs.voiceType[0] || ''}
                onChange={e => setInputs({ ...inputs, voiceType: [e.target.value] })}
                className="mt-1 block w-full bg-gray-700 text-white p-2 rounded"
              >
                <option value="" disabled>Select voice type</option>
                {PATCH_INPUT_CATEGORIES.find(cat => cat.key === 'voiceType')?.examples.filter((v: any) => typeof v === 'string').map((v: string) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Render collapsible bubble selectors for all additional categories (characterMood, movementDynamics, era, concept) */}
            {['characterMood', 'movementDynamics', 'era', 'concept'].map(key => {
              const cat = PATCH_INPUT_CATEGORIES.find(c => c.key === key);
              if (!cat) return null;
              return (
                <div key={cat.category} className="col-span-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-gray-200">{cat.category}</label>
                    <button
                      type="button"
                      onClick={() => setCollapsed(c => ({ ...c, [cat.key]: !c[cat.key] }))}
                      className="text-gray-400 hover:text-gray-200"
                    >
                      {collapsed[cat.key] ? '▼' : '▲'}
                    </button>
                  </div>
                  {!collapsed[cat.key] && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {Array.isArray(cat.examples) && cat.examples.filter((ex: any) => typeof ex === 'string').map((ex: string) => (
                        <button
                          type="button"
                          key={ex}
                          className={`px-3 py-1 rounded-full border text-sm ${Array.isArray(inputs[cat.key]) && (inputs[cat.key] as string[]).includes(ex) ? 'bg-orange-500 text-white border-orange-500' : 'bg-gray-700 text-gray-300 border-gray-500'}`}
                          onClick={() => {
                            const arr = Array.isArray(inputs[cat.key]) ? [...inputs[cat.key] as string[]] : [];
                            if (arr.includes(ex)) {
                              setInputs({ ...inputs, [cat.key]: arr.filter(v => v !== ex) });
                            } else {
                              setInputs({ ...inputs, [cat.key]: [...arr, ex] });
                            }
                          }}
                        >
                          {ex}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
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
              {Array.isArray(synthConfig?.oscillators) && synthConfig.oscillators.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {synthConfig.oscillators.map((osc: any, idx: number) => (
                    <div key={osc.id || osc.name || idx} className="bg-gray-800 rounded p-4">
                      <div className="font-bold text-orange-300 mb-2">{osc.name || `Oscillator ${idx + 1}`}</div>
                      <ul className="list-disc list-inside ml-4 mb-2">
                        {Array.isArray(osc.params) && osc.params.filter((param: string) => !/oct/i.test(param)).map((param: string) => (
                          <li key={param} className="flex items-center gap-2">
                            <span className="font-semibold">{param}:</span> {osc.values && osc.values[param] !== undefined ? osc.values[param] : '—'}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : <div className="text-gray-400">No oscillator data.</div>}
            </Card>

            {/* Effects */}
            <Card>
              <h3 className="text-lg font-semibold text-white">Effects</h3>
              {Array.isArray(synthConfig?.effects) && synthConfig.effects.length > 0 ? (
                <div className="space-y-4">
                  {synthConfig.effects.map((fx: any, idx: number) => {
                    const allParams = Array.isArray(fx.parameters) ? fx.parameters : [];
                    return (
                      <div key={fx.name || idx} className="mb-2 grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                        {/* Left: effect name and all point-form notes (numeric and non-numeric params) */}
                        <div>
                          <div className="font-bold text-green-300 mb-1">{fx.name}</div>
                          <ul className="list-disc list-inside ml-4">
                            {allParams.length > 0 ? allParams.map((param: string) => (
                              <li key={param} className="flex items-center gap-2">
                                <span className="font-semibold">{param}:</span> {fx[param] !== undefined ? fx[param] : '—'}
                              </li>
                            )) : <li className="text-gray-400">No parameters</li>}
                          </ul>
                        </div>
                        {/* Right: Knobs for numeric params only as visual aids */}
                        <div className="flex flex-wrap gap-4">
                          {allParams.filter((param: string) => typeof fx[param] === 'number').length > 0 ? allParams.filter((param: string) => typeof fx[param] === 'number').map((param: string) => (
                            <div key={param} className="flex flex-col items-center">
                              <Knob value={fx[param]} label={param} size={48} min={0} max={1} />
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
              <div className="flex flex-wrap gap-8">
                {/* Filter knobs row */}
                {Array.isArray(synthConfig?.filters) && synthConfig.filters.map((filter: any, idx: number) => (
                  <div key={filter.name || idx} className="flex flex-col items-center">
                    <div className="font-medium text-gray-200">Filter type: <span className="font-bold text-orange-400">{filter.selectedType || (Array.isArray(filter.types) && filter.types[0]) || 'Lowpass'}</span></div>
                    <div className="flex flex-row gap-6 mt-2 mb-2">
                      <Knob value={typeof filter.cutoff === 'number' ? filter.cutoff : 0.5} label="Cutoff" size={80} min={0} max={1} />
                      <Knob value={typeof filter.resonance === 'number' ? filter.resonance : 0.3} label="Resonance" size={80} min={0} max={1} />
                    </div>
                    {(typeof filter.cutoff === 'number' || typeof filter.resonance === 'number' || typeof filter.slope === 'number') && (
                      <div className="text-gray-300">
                        {typeof filter.cutoff === 'number' && (<span>Cutoff: <span className="font-mono">{(filter.cutoff * 20000).toFixed(0)} Hz</span></span>)}
                        {typeof filter.resonance === 'number' && (<span>, Resonance: <span className="font-mono">{filter.resonance.toFixed(2)}</span></span>)}
                        {typeof filter.slope === 'number' && (<span>, Slope: <span className="font-mono">{filter.slope} dB/oct</span></span>)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {/* Envelope row: always show filter and amp envelope side by side, below filter knobs */}
              <div className="flex flex-row gap-8 mt-8 justify-center">
                {/* Filter Envelope */}
                <div className="flex flex-col items-center">
                  <div className="font-medium text-gray-200">Filter Envelope</div>
                  <EnvelopeChart {...(synthConfig?.envelopes?.values?.[0] || adsrVCF)} width={360} height={180} />
                </div>
                {/* Amp Envelope */}
                <div className="flex flex-col items-center">
                  <div className="font-medium text-gray-200">Amp Envelope</div>
                  <EnvelopeChart {...(synthConfig?.envelopes?.values?.[1] || adsrVCA)} width={360} height={180} />
                </div>
              </div>
            </Card>

            {/* Modulation Matrix */}
            {Array.isArray(synthConfig?.modSources) && Array.isArray(synthConfig?.modDestinations) && Array.isArray(synthConfig?.modMatrix) && synthConfig.modMatrix.length > 0 && (
              <Card>
                <h3 className="text-lg font-semibold text-white">Modulation Matrix</h3>
                <table className="w-full text-gray-200 border-collapse mb-3">
                  <thead>
                    <tr className="bg-gray-800">
                      <th className="p-2">Source</th>
                      <th className="p-2">Target</th>
                      <th className="p-2">Parameter</th>
                      <th className="p-2">Amount</th>
                      {/* Removed LFO Shape column */}
                      <th className="p-2">LFO Waveform</th>
                      <th className="p-2">LFO Freq</th>
                      <th className="p-2">LFO Rate</th>
                      <th className="p-2">LFO Depth</th>
                    </tr>
                  </thead>
                  <tbody>
                    {synthConfig.modMatrix.map((row: any, idx: number) => (
                        <tr key={(row?.source || '') + (row?.target || '') + (row?.parameter || '') + idx} className="border-t border-gray-700">
                          <td className="p-2">{row?.source || '—'}</td>
                          <td className="p-2">{row?.target || '—'}</td>
                          <td className="p-2">{row?.parameter || '—'}</td>
                          <td className="p-2">{typeof row?.amount === 'number' ? `${Math.round(row.amount * 100)}%` : '—'}</td>
                          {/* Removed LFO Shape cell */}
                          <td className="p-2">{row?.lfoWaveform || '—'}</td>
                          <td className="p-2">{typeof row?.lfoFrequency === 'number' ? row.lfoFrequency.toFixed(2) : '—'}</td>
                          <td className="p-2">{typeof row?.lfoRate === 'number' ? row.lfoRate.toFixed(2) : '—'}</td>
                          <td className="p-2">{typeof row?.lfoDepth === 'number' ? row.lfoDepth.toFixed(2) : '—'}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </Card>
            )}
          </ErrorBoundary>
        </>
      )}

      {/* Creative Suggestions (Summary) */}
      {typeof summary === 'string' && summary && (
        <Card>
          <h3 className="text-lg font-semibold text-white">Creative Tips & Suggestions</h3>
          <div className="prose prose-invert p-4 bg-gray-800 rounded">
            <ul className="list-disc list-inside ml-4">
              {summary.split(/\n|\n- |\n\n|\r\n|\r/).filter(Boolean).map((tip, idx) => (
                <li key={idx}>{tip.trim()}</li>
              ))}
            </ul>
          </div>
        </Card>
      )}
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
