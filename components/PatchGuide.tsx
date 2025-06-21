import React, { useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { Spinner } from './Spinner';

import { WaveformPreview } from './WaveformPreview';
import { EnvelopeChart } from './EnvelopeChart';
import { Knob } from './Knob';
import { ModulationMatrix } from './ModulationMatrix';
import { PluginUI } from './PluginUI';
import { generateSynthPatchGuide, PatchGuideResult } from '../services/patchGuideService';

// Common synth list for electronic music production
const SYNTH_OPTIONS = [
  'Serum', 'Vital', 'Pigments', 'Massive', 'Massive X', 'Diva', 'Hive 2', 'Sylenth1',
  'Wavestate', 'Jupiter-8', 'Juno-106', 'SH-101', 'Operator', 'Wavetable', 'Retro Synth', 'Alchemy',
  'FM8', 'Phase Plant', 'Omnisphere', 'Analog Lab', 'Generic'
];

/**
 * Main PatchGuide component for generating synthesizer patch recipes
 * Includes visual aids like waveforms, envelopes, and modulation matrices
 */
export const PatchGuide: React.FC = () => {
  const [desc, setDesc] = useState<string>('');
  const [synth, setSynth] = useState<string>('Generic');
  const [guide, setGuide] = useState<string | null>(null);
  const [wave, setWave] = useState<string>('saw');
  const [adsr, setAdsr] = useState({ attack: 0.1, decay: 0.5, sustain: 0.8, release: 1.5 });
  const [knobs, setKnobs] = useState<Record<string, number>>({ cutoff: 0.7, resonance: 0.2, drive: 0.1, mix: 0.5 });
  const [mods, setMods] = useState<Array<{ source: string; target: string; amount: number }>>([]);
  const [uiData, setUI] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setGuide(null);
    setError('');
    
    try {
      const result = await generateSynthPatchGuide({ description: desc, synth });
      setGuide(result.text || '');
      
      if (result.waveform) {
        setWave(result.waveform);
      }
      
      if (result.adsr) {
        setAdsr(result.adsr);
      }
      
      if (result.knobs) {
        setKnobs(result.knobs);
      }
      
      if (result.modMatrix && Array.isArray(result.modMatrix)) {
        setMods(result.modMatrix);
      }
      
      if (result.pluginUI) {
        setUI(result.pluginUI);
      }
    } catch (err) {
      console.error('Error generating patch guide:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate PatchGuide');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setDesc('');
    setSynth('Generic');
    setGuide(null);
    setWave('saw');
    setAdsr({ attack: 0.1, decay: 0.5, sustain: 0.8, release: 1.5 });
    setKnobs({ cutoff: 0.7, resonance: 0.2, drive: 0.1, mix: 0.5 });
    setMods([]);
    setUI(null);
    setError('');
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">🎛️ PatchGuide AI (Gemini)</h1>
            <p className="text-gray-400">
              Describe your target sound and get detailed patch recipes with visual guides
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {/* Target Sound Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Describe Your Target Sound
              </label>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="e.g., warm analog bass with slight distortion, plucky lead synth with bright attack, atmospheric pad with slow filter sweep..."
                className="w-full h-24 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Synth Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Synthesizer
              </label>
              <select
                value={synth}
                onChange={(e) => setSynth(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                {SYNTH_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300">
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button
                type="submit"
                disabled={loading || !desc.trim()}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Spinner size="sm" /> Generating PatchGuide...
                  </>
                ) : (
                  '🎛️ Generate Patch Guide'
                )}
              </Button>
              <Button onClick={resetForm} variant="outline" type="button">
                Reset
              </Button>
            </div>
          </form>
        </div>
      </Card>

      {/* Results */}
      {guide && (
        <div className="space-y-6">
          {/* Patch Guide Text */}
          <Card>
            <h2 className="text-xl font-bold text-white mb-4">Patch Recipe</h2>
            <div className="bg-gray-800 text-gray-200 p-4 rounded-lg whitespace-pre-wrap">
              {guide}
            </div>
          </Card>

          {/* Visual Aids */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Waveform Preview */}
            <WaveformPreview waveform={wave} width={500} height={150} />
            
            {/* Envelope Chart */}
            <EnvelopeChart
              attack={adsr.attack}
              decay={adsr.decay}
              sustain={adsr.sustain}
              release={adsr.release}
              width={500}
              height={200}
            />
          </div>

          {/* Knobs */}
          <Card>
            <h3 className="text-lg font-semibold text-white mb-4">Parameters</h3>
            <div className="flex flex-wrap gap-6">
              {Object.entries(knobs).map(([name, value]) => (
                <Knob key={name} label={name} value={value} />
              ))}
            </div>
          </Card>

          {/* Modulation Matrix */}
          {mods.length > 0 && (
            <Card>
              <h3 className="text-lg font-semibold text-white mb-4">Modulation Matrix</h3>
              <ModulationMatrix routings={mods} />
            </Card>
          )}

          {/* Plugin UI */}
          {uiData && (
            <Card>
              <h3 className="text-lg font-semibold text-white mb-4">Plugin Interface</h3>
              <PluginUI 
                data={uiData} 
                synthName={synth}
                patchName={desc.substring(0, 30) + (desc.length > 30 ? '...' : '')}
              />
            </Card>
          )}
        </div>
      )}
    </div>
  );
};