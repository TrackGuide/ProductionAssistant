import React, { useState, useEffect, FormEvent } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Spinner } from './Spinner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { EnvelopeChart } from './EnvelopeChart';
import { Knob } from './Knob';
import { ModulationMatrix } from './ModulationMatrix';
import synthConfigs, { SynthConfig } from '../config/synthConfigs';
import { generateSynthPatchGuide } from '../services/patchGuideService';

export const PatchGuide: React.FC = () => {
  const [synth, setSynth] = useState<string>('Generic');
  const config: SynthConfig = synthConfigs[synth] || synthConfigs['Generic'];

  const [guide, setGuide] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [oscParams, setOscParams] = useState<Record<string, number>>({});
  const [filterParams, setFilterParams] = useState<Record<string, number>>({});
  const [envParams, setEnvParams] = useState<Record<string, number>>({});
  const [mods, setMods] = useState<any[]>([]);

  useEffect(() => {
    const oParams: Record<string, number> = {};
    config.oscillators.forEach((osc, i) => {
      osc.params.forEach(p => { oParams[`osc${i}_${p}`] = 0; });
    });
    setOscParams(oParams);

    const fParams: Record<string, number> = {};
    config.filters[0].params.forEach(p => { fParams[p] = 0.5; });
    setFilterParams(fParams);

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
      if (res.oscSettings) setOscParams(prev => ({ ...prev, ...res.oscSettings }));
      if (res.knobs) setFilterParams(prev => ({ ...prev, ...res.knobs }));
      if (res.adsrVCF && res.adsrVCA) {
        setEnvParams(prev => ({
          ...prev,
          'env1_A': res.adsrVCF.attack,
          'env1_D': res.adsrVCF.decay,
          'env1_S': res.adsrVCF.sustain,
          'env1_R': res.adsrVCF.release
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
          <select value={synth} onChange={e => setSynth(e.target.value)}>
            {Object.keys(synthConfigs).map(name => <option key={name}>{name}</option>)}
          </select>
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
            <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose prose-invert p-4 bg-gray-800 rounded">
              {guide}
            </ReactMarkdown>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-white">Oscillator Settings</h3>
            <table className="w-full text-gray-200 border-collapse">
              <thead><tr><th>Osc</th><th>Param</th><th>Value</th></tr></thead>
              <tbody>
                {config.oscillators.map((osc, i) => (
                  <React.Fragment key={osc.id}>
                    {osc.params.map(param => (
                      <tr key={param} className="border-t border-gray-700">
                        <td>{osc.name}</td>
                        <td>{param}</td>
                        <td>{Math.round((oscParams[`osc${i}_${param}`]||0)*100)}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-white">Filter</h3>
            <table className="w-full text-gray-200 border-collapse">
              <thead><tr><th>Param</th><th>Value</th></tr></thead>
              <tbody>
                {config.filters[0].params.map(param => (
                  <tr key={param} className="border-t border-gray-700">
                    <td>{param}</td>
                    <td>{Math.round((filterParams[param]||0)*100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-white">Envelopes</h3>
            <div className="flex space-x-4">
              {Array.from({ length: config.envelopes.count }, (_, i) => (
                <EnvelopeChart key={i}
                  label={config.envelopes.labels?.[i] || `Env ${i+1}`}
                  attack={envParams[`env${i+1}_A`]}
                  decay={envParams[`env${i+1}_D`]}
                  sustain={envParams[`env${i+1}_S`]}
                  release={envParams[`env${i+1}_R`]} width={300} height={150} />
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-white">Modulation Matrix</h3>
            <ModulationMatrix config={config} routings={mods} />
          </Card>
        </>
      )}
    </div>
  );
};
