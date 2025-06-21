import React, { useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Spinner } from './Spinner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { WaveformPreview } from './WaveformPreview';
import { EnvelopeChart } from './EnvelopeChart';
import { Knob } from './Knob';
import { ModulationMatrix } from './ModulationMatrix';
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
  const [synth, setSynth] = useState<string>('Serum');
  const [guide, setGuide] = useState<string | null>(null);
  const [wave, setWave] = useState<string>('saw');
  const [filterEnv, setFilterEnv] = useState({ attack: 0.1, decay: 0.5, sustain: 0.7, release: 1.0 });
  const [ampEnv, setAmpEnv] = useState({ attack: 0.05, decay: 0.3, sustain: 0.8, release: 1.2 });
  const [knobs, setKnobs] = useState<Array<{ name: string; value: number; section: string }>>([
    { name: "Cutoff", value: 0.7, section: "Filter" },
    { name: "Resonance", value: 0.3, section: "Filter" },
    { name: "Drive", value: 0.2, section: "Filter" },
    { name: "Reverb Size", value: 0.6, section: "Effects" },
    { name: "LFO Rate", value: 0.3, section: "Modulation" },
    { name: "LFO Depth", value: 0.5, section: "Modulation" }
  ]);
  const [mods, setMods] = useState<Array<{ source: string; target: string; amount: number }>>([]);
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
        if (result.adsr.filterEnv) {
          setFilterEnv(result.adsr.filterEnv);
        }
        if (result.adsr.ampEnv) {
          setAmpEnv(result.adsr.ampEnv);
        }
      }
      
      if (result.knobs && Array.isArray(result.knobs)) {
        setKnobs(result.knobs);
      }
      
      if (result.modMatrix && Array.isArray(result.modMatrix)) {
        setMods(result.modMatrix);
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
    setSynth('Serum');
    setGuide(null);
    setWave('saw');
    setFilterEnv({ attack: 0.1, decay: 0.5, sustain: 0.7, release: 1.0 });
    setAmpEnv({ attack: 0.05, decay: 0.3, sustain: 0.8, release: 1.2 });
    setKnobs([
      { name: "Cutoff", value: 0.7, section: "Filter" },
      { name: "Resonance", value: 0.3, section: "Filter" },
      { name: "Drive", value: 0.2, section: "Filter" },
      { name: "Reverb Size", value: 0.6, section: "Effects" },
      { name: "LFO Rate", value: 0.3, section: "Modulation" },
      { name: "LFO Depth", value: 0.5, section: "Modulation" }
    ]);
    setMods([]);
    setError('');
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">🎛️ PatchGuide AI</h1>
            <p className="text-gray-400">
              Create professional synth patches with AI-powered sound design recipes
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
                placeholder="e.g., warm analog bass with slight distortion, plucky lead synth with bright attack, ethereal pad with slow filter sweep..."
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
                    <Spinner size="sm" /> Generating Patch...
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
            <div className="bg-gray-800 text-gray-200 p-4 rounded-lg prose prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {guide}
              </ReactMarkdown>
            </div>
          </Card>

          {/* Visual Aids */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Waveform Preview */}
            <WaveformPreview waveform={wave} width={500} height={150} />
            
            {/* Filter Envelope Chart */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Filter Envelope</h3>
              <EnvelopeChart
                attack={filterEnv.attack}
                decay={filterEnv.decay}
                sustain={filterEnv.sustain}
                release={filterEnv.release}
                width={500}
                height={200}
              />
            </div>
          </div>

          {/* Amp Envelope */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Amplitude Envelope</h3>
            <EnvelopeChart
              attack={ampEnv.attack}
              decay={ampEnv.decay}
              sustain={ampEnv.sustain}
              release={ampEnv.release}
              width={500}
              height={200}
            />
          </div>

          {/* Knobs */}
          <Card>
            <h3 className="text-lg font-semibold text-white mb-4">Key Parameters</h3>
            <div className="space-y-6">
              {/* Group knobs by section */}
              {['Filter', 'Effects', 'Modulation'].map(section => {
                const sectionKnobs = knobs.filter(knob => knob.section === section);
                if (sectionKnobs.length === 0) return null;
                
                return (
                  <div key={section}>
                    <h4 className="text-md font-medium text-gray-300 mb-3">{section}</h4>
                    <div className="flex flex-wrap gap-6 justify-center">
                      {sectionKnobs.map((knob) => (
                        <Knob 
                          key={knob.name} 
                          label={knob.name} 
                          value={knob.value} 
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Modulation Matrix */}
          {mods.length > 0 && (
            <Card>
              <h3 className="text-lg font-semibold text-white mb-4">Modulation Matrix</h3>
              <ModulationMatrix routings={mods} />
            </Card>
          )}
        </div>
      )}
    </div>
  );
};