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

// Helper: Group synths by company, robust to string/object
const synthGroups: Record<string, string[]> = {};
SYNTH_OPTIONS.forEach(synth => {
  if (typeof synth === 'string') {
    const [company] = synth.split(' ');
    if (!synthGroups[company]) synthGroups[company] = [];
    synthGroups[company].push(synth);
  } else if (synth && typeof synth === 'object' && synth.label && Array.isArray(synth.options)) {
    // For grouped options like Generic Synth
    synth.options.forEach(opt => {
      if (!synthGroups[synth.label]) synthGroups[synth.label] = [];
      synthGroups[synth.label].push(opt.value);
    });
  }
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

  const [collapsed, setCollapsed] = useState<CollapsedState>({
    genre: false,
    synth: false,
    voiceType: false, // Default as expanded
    characterMood: true,
    movementDynamics: true,
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
        description: `${inputs.characterMood.join(', ')} ${inputs.movementDynamics.join(', ')}`,
        synth,
        genre: inputs.genre.join(', '),
        voiceType: inputs.voiceType.join(', ')
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

  // --- GENRE BUBBLE SELECTOR ---
  const [selectedGenreCategory, setSelectedGenreCategory] = useState<string | null>(null);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* FORM */}
      <form onSubmit={onSubmit} className="space-y-4">
        <Card>
          <h2 className="text-xl font-semibold text-white">Patch Guide Parameters</h2>
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
                {PATCH_INPUT_CATEGORIES[0].examples.map(group => (
                  <optgroup key={group.group} label={group.group}>
                    {group.examples.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </optgroup>
                ))}
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
                {PATCH_INPUT_CATEGORIES.find(cat => cat.key === 'voiceType')?.examples.map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Genre selection grouped by category */}
            <div>
              <label className="block text-gray-200">Genre</label>
              {/* Genre bubble selector */}
              <div className="flex flex-wrap gap-2 mt-1">
                {GENRE_CATEGORIES.map(cat => (
                  <button
                    type="button"
                    key={cat.subCategory}
                    className={`px-3 py-1 rounded-full border text-sm ${selectedGenreCategory === cat.subCategory ? 'bg-orange-500 text-white border-orange-500' : 'bg-gray-700 text-gray-300 border-gray-500'}`}
                    onClick={() => setSelectedGenreCategory(cat.subCategory)}
                  >
                    {cat.subCategory}
                  </button>
                ))}
              </div>
              {selectedGenreCategory && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {GENRE_CATEGORIES.find(cat => cat.subCategory === selectedGenreCategory)?.examples.map(g => (
                    <button
                      type="button"
                      key={g}
                      className={`px-3 py-1 rounded-full border text-sm ${inputs.genre.includes(g) ? 'bg-orange-500 text-white border-orange-500' : 'bg-gray-700 text-gray-300 border-gray-500'}`}
                      onClick={() => {
                        setInputs({ ...inputs, genre: inputs.genre.includes(g) ? inputs.genre.filter(v => v !== g) : [...inputs.genre, g] });
                      }}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Synth selection grouped by company */}
            <div>
              <label className="block text-gray-200">Synth</label>
              {/* Synth bubble selector */}
              {synthGroupList.map(([company, synths]) => (
                <div key={company} className="mb-2">
                  <div className="text-xs text-gray-400 mb-1">{company}</div>
                  <div className="flex flex-wrap gap-2">
                    {synths.map(s => (
                      <button
                        type="button"
                        key={s}
                        className={`px-3 py-1 rounded-full border text-sm ${synth === s ? 'bg-orange-500 text-white border-orange-500' : 'bg-gray-700 text-gray-300 border-gray-500'}`}
                        onClick={() => setSynth(s)}
                      >
                        {s.replace(company + ' ', '')}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
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
