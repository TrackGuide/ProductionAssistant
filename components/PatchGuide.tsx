import React, { useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Spinner } from './Spinner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { EnvelopeChart } from './EnvelopeChart';
import { generateSynthPatchGuide } from '../services/patchGuideService';
import { PATCH_INPUT_CATEGORIES, SYNTH_OPTIONS } from '../constants';

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
      if (res.oscSettings) {
        setSynthConfig(res.synthConfig);
        if (res.adsrVCF) setAdsrVCF(res.adsrVCF);
        if (res.adsrVCA) setAdsrVCA(res.adsrVCA);
      }
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

            {/* 1. Oscillators */}
            <Card>
              <h3 className="text-lg font-semibold text-white">1. Oscillators</h3>
              {Array.isArray(synthConfig?.oscillators) && synthConfig.oscillators.length > 0 ? (
                <table className="w-full text-gray-200 border-collapse">
                  <thead>
                    <tr className="bg-gray-800">
                      <th className="p-2">Source</th>
                      {Array.isArray(synthConfig.oscillators[0]?.params) && synthConfig.oscillators[0].params.map((param: string) => (
                        <th key={param} className="p-2">{param}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {synthConfig.oscillators.map((osc: any, idx: number) => (
                      <tr key={osc.id || idx} className="border-t border-gray-700">
                        <td className="p-2">{osc.name}</td>
                        {Array.isArray(osc.params) && osc.params.map((param: string) => (
                          <td key={param} className="p-2">{osc.values && osc.values[param] !== undefined ? osc.values[param] : '—'}</td>
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
              {Array.isArray(synthConfig?.effects) && synthConfig.effects.length > 0 ? (
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

            {/* 3. Envelope & Filter Settings */}
            <Card>
              <h3 className="text-lg font-semibold text-white">3. Envelope & Filter Settings</h3>
              <div className="flex flex-wrap gap-8">
                {Array.isArray(synthConfig?.filters) && synthConfig.filters.map((filter: any, idx: number) => (
                  <div key={filter.name || idx} className="flex flex-col">
                    <div className="font-medium text-gray-200">{filter.name}</div>
                    <div className="text-gray-300">
                      Selected Type: <span className="font-bold text-orange-400">{filter.selectedType || (Array.isArray(filter.types) && filter.types[0]) || 'Lowpass'}</span>
                    </div>
                    <div className="text-gray-300">
                      Cutoff: <span className="font-mono">{typeof filter.cutoff === 'number' ? filter.cutoff.toFixed(2) : '—'}</span>
                      , Resonance: <span className="font-mono">{typeof filter.resonance === 'number' ? filter.resonance.toFixed(2) : '—'}</span>
                      , Slope: <span className="font-mono">{typeof filter.slope === 'number' ? filter.slope + ' dB/oct' : '—'}</span>
                    </div>
                  </div>
                ))}
                {synthConfig && synthConfig.envelopes && Array.isArray(synthConfig.envelopes.labels) && synthConfig.envelopes.labels.map((label: string, idx: number) => (
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
              {Array.isArray(synthConfig?.modSources) && Array.isArray(synthConfig?.modDestinations) && synthConfig.modSources.length > 0 && synthConfig.modDestinations.length > 0 ? (
                <table className="w-full text-gray-200 border-collapse mb-3">
                  <thead>
                    <tr className="bg-gray-800">
                      <th className="p-2">Source</th>
                      <th className="p-2">Target</th>
                      <th className="p-2">Parameter</th>
                      <th className="p-2">Amount</th>
                      <th className="p-2">LFO Shape</th>
                      <th className="p-2">LFO Waveform</th>
                      <th className="p-2">LFO Freq</th>
                      <th className="p-2">LFO Rate</th>
                      <th className="p-2">LFO Depth</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(synthConfig.modMatrix)
                      ? synthConfig.modMatrix.map((row: any, idx: number) => (
                          <tr key={row.source + row.target + row.parameter + idx} className="border-t border-gray-700">
                            <td className="p-2">{row.source}</td>
                            <td className="p-2">{row.target}</td>
                            <td className="p-2">{row.parameter}</td>
                            <td className="p-2">{typeof row.amount === 'number' ? `${Math.round(row.amount * 100)}%` : '—'}</td>
                            <td className="p-2">{row.lfoShape || '—'}</td>
                            <td className="p-2">{row.lfoWaveform || '—'}</td>
                            <td className="p-2">{typeof row.lfoFrequency === 'number' ? row.lfoFrequency.toFixed(2) : '—'}</td>
                            <td className="p-2">{typeof row.lfoRate === 'number' ? row.lfoRate.toFixed(2) : '—'}</td>
                            <td className="p-2">{typeof row.lfoDepth === 'number' ? row.lfoDepth.toFixed(2) : '—'}</td>
                          </tr>
                        ))
                      : <tr><td colSpan={9} className="text-gray-400">No modulation matrix available for this synth.</td></tr>}
                  </tbody>
                </table>
              ) : <div className="text-gray-400">No modulation matrix available for this synth.</div>}
            </Card>

            {/* Summary paragraph from AI */}
            {typeof summary === 'string' && summary && (
              <Card>
                <h3 className="text-lg font-semibold text-white">Creative Tips & Considerations</h3>
                <div className="prose prose-invert p-4 bg-gray-800 rounded">
                  {summary}
                </div>
              </Card>
            )}
          </ErrorBoundary>
        </>
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
