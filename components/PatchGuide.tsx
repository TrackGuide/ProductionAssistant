import React, { useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Spinner } from './Spinner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { EnvelopeChart } from './EnvelopeChart';
import { generateSynthPatchGuide } from '../services/patchGuideService';
import { PATCH_INPUT_CATEGORIES, SYNTH_OPTIONS } from '../constants';

const DEFAULT_INPUT_KEYS = ['genre', 'voiceType', 'timbre', 'notes'];
const ADVANCED_INPUT_KEYS = PATCH_INPUT_CATEGORIES.map(c => c.key).filter(k => !DEFAULT_INPUT_KEYS.includes(k));

// Helper: Group synths by company
const synthGroups: Record<string, string[]> = {};
SYNTH_OPTIONS.forEach(synth => {
  const [company] = synth.split(' ');
  if (!synthGroups[company]) synthGroups[company] = [];
  synthGroups[company].push(synth);
});
Object.keys(synthGroups).forEach(company => {
  synthGroups[company].sort();
});
const synthGroupList = Object.entries(synthGroups).sort(([a], [b]) => a.localeCompare(b));

// Helper: Genre categories and mapping
const GENRE_CATEGORIES = PATCH_INPUT_CATEGORIES.find(cat => cat.key === 'genre')?.examples as { subCategory: string; examples: string[]; }[];

export const PatchGuide: React.FC = () => {
  // Form inputs
  const [synth, setSynth] = useState('Generic');
  // New input state for robust form
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [inputs, setInputs] = useState<Record<string, string[]>>({
    genre: [],
    voiceType: [],
    timbre: [],
    // advanced keys default to []
    ...Object.fromEntries(ADVANCED_INPUT_KEYS.map(k => [k, []]))
  });
  // Fix type error: add index signature to collapsed state type
  type CollapsedState = {
    [key: string]: boolean;
    genre: boolean;
    synth: boolean;
    voiceType: boolean;
    timbre: boolean;
    notes: boolean;
    movement: boolean;
    mood: boolean;
    era: boolean;
    inspiration: boolean;
    dynamics: boolean;
  };

  const [collapsed, setCollapsed] = useState<CollapsedState>({
    genre: false,
    synth: false,
    voiceType: true,
    timbre: true,
    notes: true,
    movement: true,
    mood: true,
    era: true,
    inspiration: true,
    dynamics: true,
  });

  // AI results & parameters
  const [guide, setGuide] = useState<string | null>(null);
  const [adsrVCF, setAdsrVCF] = useState({ attack: 0.1, decay: 0.5, sustain: 0.8, release: 1.5 });
  const [adsrVCA, setAdsrVCA] = useState({ attack: 0.05, decay: 0.3, sustain: 0.9, release: 0.6 });
  const [synthConfig, setSynthConfig] = useState<any>(null);

  // Loading / error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      timbre: [],
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
          <h2 className="text-xl font-semibold text-white">Patch Guide Parameters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Genre selection grouped by category */}
            <div>
              <label className="block text-gray-200">Genre</label>
              <select
                multiple
                value={inputs.genre as string[]}
                onChange={e => setInputs({ ...inputs, genre: Array.from(e.target.selectedOptions, o => o.value) })}
                className="mt-1 block w-full bg-gray-700 text-white p-2 rounded"
              >
                {GENRE_CATEGORIES.map(cat => (
                  <optgroup key={cat.subCategory} label={cat.subCategory}>
                    {cat.examples.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            {/* Synth selection grouped by company */}
            <div>
              <label className="block text-gray-200">Synth</label>
              <select
                value={synth}
                onChange={e => setSynth(e.target.value)}
                className="mt-1 block w-full bg-gray-700 text-white p-2 rounded"
              >
                {synthGroupList.map(([company, synths]) => (
                  <optgroup key={company} label={company}>
                    {synths.map(s => (
                      <option key={s} value={s}>{s.replace(company + ' ', '')}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            {/* Bubble selector for other categories */}
            {PATCH_INPUT_CATEGORIES.filter(cat => cat.key !== 'genre').map(cat => (
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
                    {cat.examples.map((ex: any) => (
                      <button
                        type="button"
                        key={typeof ex === 'string' ? ex : ex.subCategory}
                        className={`px-3 py-1 rounded-full border text-sm ${Array.isArray(inputs[cat.key]) && (inputs[cat.key] as string[]).includes(typeof ex === 'string' ? ex : ex.subCategory) ? 'bg-orange-500 text-white border-orange-500' : 'bg-gray-700 text-gray-300 border-gray-500'}`}
                        onClick={() => {
                          const val = typeof ex === 'string' ? ex : ex.subCategory;
                          const arr = Array.isArray(inputs[cat.key]) ? [...inputs[cat.key] as string[]] : [];
                          if (arr.includes(val)) {
                            setInputs({ ...inputs, [cat.key]: arr.filter(v => v !== val) });
                          } else {
                            setInputs({ ...inputs, [cat.key]: [...arr, val] });
                          }
                        }}
                      >
                        {typeof ex === 'string' ? ex : ex.subCategory}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <Button type="button" onClick={() => setShowAdvanced(v => !v)}>
            {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
          </Button>
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
