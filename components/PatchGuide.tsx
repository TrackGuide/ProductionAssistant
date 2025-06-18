import React, { useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { Spinner } from './Spinner';
import { MarkdownRenderer } from './MarkdownRenderer';
import { WaveformPreview } from './WaveformPreview';
import { EnvelopeChart } from './EnvelopeChart';

import { Knob } from './Knob';
import { generatePatchGuide, PatchGuideResult, PatchStep } from '../services/patchGuideService';
import { DAW_SUGGESTIONS } from '../constants';

// Common plugin list for electronic music production
const COMMON_PLUGINS = [
  'Serum',
  'Massive X',
  'Sylenth1',
  'Diva',
  'Omnisphere',
  'Operator',
  'Wavetable',
  'Bass',
  'Simpler',
  'Analog',
  'FM8',
  'Reaktor',
  'Zebra2',
  'Hive 2',
  'Pigments',
  'Phase Plant',
  'Vital',
  'Spire',
  'Nexus',
  'Kontakt'
];

/**
 * Main PatchGuide component for generating synthesizer patch recipes
 * Includes visual aids like waveforms, envelopes, and modulation matrices
 */
export const PatchGuide: React.FC = () => {
  const [targetSound, setTargetSound] = useState<string>('');
  const [selectedPlugins, setSelectedPlugins] = useState<string[]>([]);
  const [selectedDAW, setSelectedDAW] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [patchGuide, setPatchGuide] = useState<PatchGuideResult | null>(null);
  const [error, setError] = useState<string>('');

  const handlePluginToggle = (plugin: string) => {
    setSelectedPlugins(prev => 
      prev.includes(plugin) 
        ? prev.filter(p => p !== plugin)
        : [...prev, plugin]
    );
  };

  const handleGenerate = async () => {
    if (!targetSound.trim()) {
      setError('Please describe your target sound');
      return;
    }

    if (selectedPlugins.length === 0) {
      setError('Please select at least one plugin');
      return;
    }

    setIsGenerating(true);
    setError('');
    setPatchGuide(null);

    try {
      const result = await generatePatchGuide(targetSound, selectedPlugins, selectedDAW);
      setPatchGuide(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate PatchGuide');
    } finally {
      setIsGenerating(false);
    }
  };

  const resetForm = () => {
    setTargetSound('');
    setSelectedPlugins([]);
    setSelectedDAW('');
    setPatchGuide(null);
    setError('');
  };



  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">🎛️ PatchGuide AI</h1>
            <p className="text-gray-400">
              Describe your target sound and get detailed patch recipes with visual guides
            </p>
          </div>

          {/* Target Sound Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Describe Your Target Sound
            </label>
            <textarea
              value={targetSound}
              onChange={(e) => setTargetSound(e.target.value)}
              placeholder="e.g., warm analog bass with slight distortion, plucky lead synth with bright attack, atmospheric pad with slow filter sweep..."
              className="w-full h-24 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
            />
          </div>

          {/* DAW Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Preferred DAW (Optional)
            </label>
            <Input 
              value={selectedDAW}
              onChange={(e) => setSelectedDAW(e.target.value)}
              placeholder="Select or type your DAW..."
              list="daw-suggestions"
              className="w-full"
            />
            <datalist id="daw-suggestions">
              {DAW_SUGGESTIONS.map(daw => <option key={daw} value={daw} />)}
            </datalist>
            <div className="flex flex-wrap gap-2 mt-2">
              {DAW_SUGGESTIONS.slice(0, 5).map(daw => (
                <button
                  key={daw}
                  type="button"
                  onClick={() => setSelectedDAW(daw)}
                  className={`px-3 py-1 text-xs rounded-full transition-all duration-150 ease-in-out ${
                    selectedDAW === daw
                      ? 'bg-orange-600 text-white ring-2 ring-orange-400'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {daw}
                </button>
              ))}
            </div>
          </div>

          {/* Plugin Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Available Plugins ({selectedPlugins.length} selected)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-48 overflow-y-auto p-2 bg-gray-700 rounded-lg border border-gray-600">
              {COMMON_PLUGINS.map((plugin) => (
                <label
                  key={plugin}
                  className="flex items-center space-x-2 cursor-pointer hover:bg-gray-600 p-2 rounded"
                >
                  <input
                    type="checkbox"
                    checked={selectedPlugins.includes(plugin)}
                    onChange={() => handlePluginToggle(plugin)}
                    className="rounded border-gray-500 text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-300">{plugin}</span>
                </label>
              ))}
            </div>
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
              onClick={handleGenerate}
              disabled={isGenerating || !targetSound.trim() || selectedPlugins.length === 0}
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <Spinner size="sm" /> Generating PatchGuide...
                </>
              ) : (
                '🎛️ Generate PatchGuide'
              )}
            </Button>
            <Button onClick={resetForm} variant="outline">
              Reset
            </Button>
          </div>
        </div>
      </Card>

      {/* Results */}
      {patchGuide && (
        <div className="space-y-6">
          {/* Patch Steps */}
          <Card>
            <h2 className="text-xl font-bold text-white mb-4">Patch Recipe</h2>
            <div className="space-y-6">
              {patchGuide.steps.map((step, index) => (
                <div key={index} className="border-l-4 border-orange-500 pl-4">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {index + 1}. {step.plugin}
                  </h3>
                  <div className="text-gray-300 mb-4">
                    <MarkdownRenderer content={step.description} />
                  </div>
                  
                  {/* Parameter Knobs */}
                  {Object.keys(step.parameters).length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-400 mb-2">Parameters</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {Object.entries(step.parameters).map(([param, value]) => (
                          <Knob
                            key={param}
                            value={typeof value === 'number' ? value : 0.5}
                            label={param.replace(/([A-Z])/g, ' $1').trim()}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {patchGuide.notes && (
                <div className="mt-6 p-4 bg-gray-700 rounded-lg border border-gray-600">
                  <h3 className="text-sm font-medium text-gray-300 mb-2">Additional Notes</h3>
                  <div className="text-gray-400">
                    <MarkdownRenderer content={patchGuide.notes} />
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Visual Aids */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Waveform Preview */}
            <WaveformPreview />
            
            {/* Envelope Chart */}
            {patchGuide.steps[0]?.envelope && (
              <EnvelopeChart
                attack={patchGuide.steps[0].envelope.attack}
                decay={patchGuide.steps[0].envelope.decay}
                sustain={patchGuide.steps[0].envelope.sustain}
                release={patchGuide.steps[0].envelope.release}
              />
            )}
          </div>


        </div>
      )}
    </div>
  );
};