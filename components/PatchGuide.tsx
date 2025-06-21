
import React, { useState, useEffect, FormEvent } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Spinner } from './Spinner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { EnvelopeChart } from './EnvelopeChart';
import { ModulationMatrix } from './ModulationMatrix';
import synthConfigs, { SynthConfig } from '../config/synthConfigs';
import { generateSynthPatchGuide } from '../services/patchGuideService';

const VOICE_TYPES = [
  'Soft Lead','Hard Lead','Evolving Pad','Bass','Pluck',
  'Ambient Texture','Arpeggio','Drone','FX','Keys'
];

const DESCRIPTORS = [
  'Warm','Bright','Gritty','Smooth','Distorted',
  'Clean','Vintage','Modern','Aggressive','Subtle'
];

const GENRES = [
  'Ambient','EDM','Rock','Pop','Hip-Hop',
  'Jazz','Classical','Experimental','Techno','House'
];

export const PatchGuide: React.FC = () => {
  const [synth, setSynth] = useState<string>('Generic');
  const config: SynthConfig = synthConfigs[synth] || synthConfigs['Generic'];

  const [voiceType, setVoiceType] = useState('Soft Lead');
  const [descriptor, setDescriptor] = useState('Warm');
  const [genre, setGenre] = useState('Ambient');
  const [notes, setNotes] = useState('');

  const [guide, setGuide] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [envParams, setEnvParams] = useState<Record<string, number>>({});
  const [mods, setMods] = useState<any[]>([]);

  useEffect(() => {
    const eParams: Record<string, number> = {};
    for (let i = 0; i < (config.envelopes.count || 0); i++) {
      ['A','D','S','R'].forEach(stage => {
        eParams[`env${i+1}_${stage}`] = stage === 'S' ? 1 : 0;
      });
    }
    setEnvParams(eParams);
    setMods([]);
    setGuide(null);
    setError('');
  }, [synth]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setGuide(null);
    try {
      const res = await generateSynthPatchGuide({ synth });
      setGuide(res.text || '');
      if (res.adsrVCF && res.adsrVCA) {
        setEnvParams(prev => ({
          ...prev,
          'env1_A': res.adsrVCF?.attack ?? 0,
          'env1_D': res.adsrVCF?.decay ?? 0,
          'env1_S': res.adsrVCF?.sustain ?? 0,
          'env1_R': res.adsrVCF?.release ?? 0
        }));
      }
      if (res.modMatrix) setMods(res.modMatrix);
    } catch (err: any) {
      setError(err.message || 'Error generating patch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <form onSubmit={onSubmit} className="space-y-4">
        <Card>
          <h2 className="text-xl font-semibold text-white">Patch Guide Parameters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div>
              <label className="block text-gray-200">Synth</label>
              <select value={synth} onChange={e => setSynth(e.target.value)} className="mt-1 block w-full bg-gray-700 text-white p-2 rounded">
                {Object.keys(synthConfigs).map(name => <option key={name}>{name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-gray-200">Voice Type</label>
              <select value={voiceType} onChange={e => setVoiceType(e.target.value)} className="mt-1 block w-full bg-gray-700 text-white p-2 rounded">
                {VOICE_TYPES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-gray-200">Descriptor</label>
              <select value={descriptor} onChange={e => setDescriptor(e.target.value)} className="mt-1 block w-full bg-gray-700 text-white p-2 rounded">
                {DESCRIPTORS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-gray-200">Genre</label>
              <select value={genre} onChange={e => setGenre(e.target.value)} className="mt-1 block w-full bg-gray-700 text-white p-2 rounded">
                {GENRES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-gray-200">Additional Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="mt-1 block w-full bg-gray-700 text-white p-2 rounded" placeholder="Any specifics…" />
            </div>

          </div>
        </Card>

        <div className="flex space-x-4">
          <Button type="submit" disabled={loading}>{loading ? 'Generating…' : 'Generate Patch Guide'}</Button>
          {loading && <Spinner />}
          {error && <span className="text-red-500">{error}</span>}
        </div>
      </form>

      {guide && (
        <>
          <Card>
            <h2 className="text-xl font-semibold text-white">Patch Instructions</h2>
            <div className="prose prose-invert p-4 bg-gray-800 rounded">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{guide}</ReactMarkdown>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-white">Modulation Matrix</h3>
            <ModulationMatrix config={config} routings={mods} />
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-white">Envelopes</h3>
            <div className="flex space-x-4">
              {Array.from({ length: config.envelopes.count }, (_, i) => (
                <EnvelopeChart key={i}
                  attack={envParams[`env${i+1}_A`]}
                  decay={envParams[`env${i+1}_D`]}
                  sustain={envParams[`env${i+1}_S`]}
                  release={envParams[`env${i+1}_R`]}
                  width={300}
                  height={150} />
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
};
