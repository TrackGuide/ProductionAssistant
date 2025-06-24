import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Spinner } from './Spinner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { EnvelopeChart } from './EnvelopeChart';
import * as PatchGuideService from '../services/patchGuideServiceOptimized';
import { PATCH_INPUT_CATEGORIES } from '../constants';
import { SYNTHESIS_TYPES, MODEL_OVERRIDES, SynthesisType } from '../synthesisTypes';
import { getModelsByType } from '../utils/getModelOverrideMap';
import { Knob } from './Knob';
import { copyToClipboard } from '../utils/copyUtils';
import { stripHtmlTags } from '../utils/stripHtmlTags';

// ✅ Simplified, consistent state structure
interface PatchGuideInputs {
  synthesisType: string;
  synthModel?: string;
  genre: string;
  voiceType: string;
  styleMood: string[];
  dynamicsMovement: string[];
  notes: string;
}

interface PatchGuideResult {
  text: string;
  synthConfig: any;
  adsrVCF: any;
  adsrVCA: any;
  summary: string;
}

// ✅ Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-900/20 border border-red-500 rounded-lg">
          <p className="text-red-400">
            Something went wrong displaying the patch guide. Please try regenerating.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

// ✅ Optimized component with better state management
export const PatchGuide: React.FC<{ onContentUpdate?: (content: string) => void }> = ({ onContentUpdate }) => {
  // ✅ Clean, consistent state structure
  const [inputs, setInputs] = useState<PatchGuideInputs>({
    synthesisType: '',
    synthModel: undefined,
    genre: '',
    voiceType: '',
    styleMood: [],
    dynamicsMovement: [],
    notes: ''
  });

  const [result, setResult] = useState<PatchGuideResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // ✅ Memoized options to prevent re-renders
  const genreOptions = useMemo(() => 
    PATCH_INPUT_CATEGORIES.find(c => c.key === 'genre')?.examples || []
  , []);

  const voiceTypeOptions = useMemo(() => 
    PATCH_INPUT_CATEGORIES.find(c => c.key === 'voiceType')?.examples || []
  , []);

  const styleMoodOptions = useMemo(() => 
    PATCH_INPUT_CATEGORIES.find(c => c.key === 'styleMood')?.examples || []
  , []);

  const dynamicsMovementOptions = useMemo(() => 
    PATCH_INPUT_CATEGORIES.find(c => c.key === 'dynamicsMovement')?.examples || []
  , []);

  // ✅ Optimized input handlers with useCallback
  const updateInput = useCallback((key: keyof PatchGuideInputs, value: any) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  }, []);

  const toggleStyleMood = useCallback((mood: string) => {
    setInputs(prev => ({
      ...prev,
      styleMood: prev.styleMood.includes(mood)
        ? prev.styleMood.filter(m => m !== mood)
        : [...prev.styleMood, mood]
    }));
  }, []);

  const toggleDynamicsMovement = useCallback((movement: string) => {
    setInputs(prev => ({
      ...prev,
      dynamicsMovement: prev.dynamicsMovement.includes(movement)
        ? prev.dynamicsMovement.filter(m => m !== movement)
        : [...prev.dynamicsMovement, movement]
    }));
  }, []);

  // ✅ Simplified form validation
  const isValid = useMemo(() => 
    inputs.synthesisType && inputs.genre && inputs.voiceType
  , [inputs.synthesisType, inputs.genre, inputs.voiceType]);

  // ✅ Optimized submit handler
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      // Ensure description is never empty
      let description = [
        ...inputs.styleMood,
        ...inputs.dynamicsMovement
      ].join(', ');
      if (!description.trim()) {
        description = inputs.notes?.trim() || 'No specific style or movement provided';
      }

      const response = await PatchGuideService.generateSynthPatchGuide({
        description,
        synthesisType: inputs.synthesisType,
        synthModel: inputs.synthModel,
        genre: inputs.genre,
        voiceType: inputs.voiceType,
        notes: inputs.notes
      });

      const patchResult: PatchGuideResult = {
        text: response.text || '',
        synthConfig: response.synthConfig || {},
        adsrVCF: response.adsrVCF || { attack: 0.1, decay: 0.5, sustain: 0.8, release: 1.5 },
        adsrVCA: response.adsrVCA || { attack: 0.05, decay: 0.3, sustain: 0.9, release: 0.6 },
        summary: response.summary || ''
      };

      setResult(patchResult);
      // Notify parent component of content update
      onContentUpdate?.(patchResult.text);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate patch guide');
    } finally {
      setLoading(false);
    }
  }, [inputs, isValid]);

  // ✅ Clean reset handler
  const handleReset = useCallback(() => {
    setInputs({
      synthesisType: '',
      synthModel: undefined,
      genre: '',
      voiceType: '',
      styleMood: [],
      dynamicsMovement: [],
      notes: ''
    });
    setResult(null);
    setError('');
    // Clear content from parent as well
    onContentUpdate?.('');
  }, [onContentUpdate]);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* ✅ Simplified Form */}
      <Card>
        <h2 className="text-xl font-semibold text-white mb-6">
          Create Synth Patch Guide
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ✅ Clean 3-column layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Synthesis Type Selection */}
            <div className="col-span-1">
              <label className="block text-gray-200 mb-2 font-medium">Synthesis Type</label>
              <select
                value={inputs.synthesisType}
                onChange={e => {
                  updateInput('synthesisType', e.target.value);
                  // Reset synthModel if the type changes
                  updateInput('synthModel', undefined);
                }}
                className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                required
              >
                <option value="">Select synthesis type...</option>
                {SYNTHESIS_TYPES.map(t => (
                  <option key={t.key} value={t.key}>{t.label}</option>
                ))}
              </select>
            </div>
            
            {/* Genre Selection */}
            <div>
              <label className="block text-gray-200 mb-2 font-medium">Genre</label>
              <select
                value={inputs.genre}
                onChange={e => updateInput('genre', e.target.value)}
                className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                required
              >
                <option value="">Select genre...</option>
                {genreOptions.map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
            </div>

            {/* Voice Type Selection */}
            <div>
              <label className="block text-gray-200 mb-2 font-medium">Voice Type</label>
              <select
                value={inputs.voiceType}
                onChange={e => updateInput('voiceType', e.target.value)}
                className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                required
              >
                <option value="">Select voice type...</option>
                {voiceTypeOptions.map(voice => (
                  <option key={voice} value={voice}>{voice}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Optional Synth Model Selection - Now below Synthesis Type */}
          {inputs.synthesisType && MODEL_OVERRIDES[inputs.synthesisType as keyof typeof MODEL_OVERRIDES]?.length > 0 && (
            <div>
              <label className="block text-gray-200 mb-2 font-medium">Synth Model (optional)</label>
              <select
                value={inputs.synthModel || ""}
                onChange={e => updateInput('synthModel', e.target.value || undefined)}
                className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              >
                <option value="">None</option>
                {MODEL_OVERRIDES[inputs.synthesisType as keyof typeof MODEL_OVERRIDES]?.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>
          )}

          {/* Style/Mood and Dynamics/Movement in a 2-column grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ✅ Style/Mood Selection */}
            <div>
              <label className="block text-gray-200 mb-3 font-medium">
                Style & Mood <span className="text-gray-400 text-sm">(optional)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {styleMoodOptions.slice(0, 15).map(mood => (
                  <button
                    key={mood}
                    type="button"
                    onClick={() => toggleStyleMood(mood)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      inputs.styleMood.includes(mood)
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
                    } border`}
                  >
                    {mood}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamics & Movement Selection */}
            <div>
              <label className="block text-gray-200 mb-3 font-medium">
                Dynamics & Movement <span className="text-gray-400 text-sm">(optional)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {dynamicsMovementOptions.slice(0, 15).map(movement => (
                  <button
                    key={movement}
                    type="button"
                    onClick={() => toggleDynamicsMovement(movement)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      inputs.dynamicsMovement.includes(movement)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
                    } border`}
                  >
                    {movement}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ✅ Notes Section */}
          <div>
            <label className="block text-gray-200 mb-2 font-medium">
              Additional Notes <span className="text-gray-400 text-sm">(optional)</span>
            </label>
            <textarea
              value={inputs.notes}
              onChange={e => updateInput('notes', e.target.value)}
              placeholder="Reference artist, track, or specific sound characteristics..."
              className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none"
              rows={3}
            />
          </div>

          {/* ✅ Action Buttons */}
          <div className="flex items-center gap-4">
            <Button 
              type="submit" 
              disabled={loading || !isValid}
              className="flex items-center gap-2"
            >
              {loading && <Spinner />}
              {loading ? 'Generating...' : 'Generate Patch Guide'}
            </Button>
            
            <Button 
              type="button" 
              variant="secondary" 
              onClick={handleReset}
              disabled={loading}
            >
              Reset
            </Button>
          </div>

          {/* ✅ Error Display */}
          {error && (
            <div className="p-4 bg-red-900/20 border border-red-500 rounded-lg">
              <p className="text-red-400">{error}</p>
            </div>
          )}
        </form>
      </Card>

      {/* ✅ Results Section */}
      {result && (
        <ErrorBoundary>
          <PatchGuideResults result={result} />
        </ErrorBoundary>
      )}
    </div>
  );
};

// Utility: Map normalized value to Hz (logarithmic for audio, linear for LFO)
function normalizedToHz(value: number, type: 'audio' | 'lfo' = 'audio') {
  if (type === 'lfo') {
    // 0-20 Hz linear
    return (value * 20).toFixed(2);
  } else {
    // 20-20,000 Hz logarithmic
    const min = 20, max = 20000;
    const hz = min * Math.pow(max / min, value);
    return hz.toFixed(0);
  }
}

// ✅ Integrated Results Component with visual controls embedded
const PatchGuideResults: React.FC<{ result: PatchGuideResult }> = ({ result }) => {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = () => {
    copyToClipboard(result.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  // Clean AI output of HTML/JSX tags before rendering as Markdown
  const cleanText = stripHtmlTags(result.text);
  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Complete Patch Guide</h3>
        <button
          onClick={handleCopy}
          className="px-3 py-1.5 rounded-lg bg-gray-700 text-gray-200 border border-gray-600 hover:bg-purple-600 hover:text-white transition-colors text-sm font-medium flex items-center gap-2"
        >
          {copied ? 'Copied!' : 'Copy Text'}
        </button>
      </div>
      {/* Main Instructions with integrated visual controls */}
      {result.text && (
        <div className="space-y-8">
          {/* Core Sound Engine Section - Oscillators Only */}
          {result.synthConfig?.oscillators && result.synthConfig.oscillators.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-6 border-b border-gray-600 pb-2">🎛️ Core Sound Engine</h2>
              <h3 className="font-semibold text-purple-300 mb-4 text-lg">🌊 Oscillator Setup</h3>
              <div className="bg-gray-800 rounded-lg p-6">
                {/* Display oscillators in columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {result.synthConfig.oscillators.map((osc: any, idx: number) => (
                    <div key={idx} className="bg-gray-700 rounded-lg p-4">
                      <h4 className="font-semibold text-purple-300 mb-3">{osc.name || `Oscillator ${idx + 1}`}</h4>
                      <div className="space-y-2">
                        {Object.entries(osc.values || {}).map(([param, value]) => (
                          <div key={param} className="flex justify-between">
                            <span className="text-gray-300">{param}:</span>
                            <span className="text-white font-mono">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Filter Configuration Section with Filter Visualization */}
          {result.synthConfig?.filters && result.synthConfig.filters.length > 0 && (
            <div className="border-t border-gray-600 pt-8 mt-8">
              <h2 className="text-xl font-bold text-white mb-6 border-b border-gray-600 pb-2">🎚️ Filter Configuration</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left: Filter Table(s) */}
                <div>
                  {result.synthConfig.filters.map((filter: any, idx: number) => (
                    <div key={idx} className="mb-6">
                      <h3 className="font-semibold text-purple-300 mb-3 text-sm">{filter.name || `Filter ${idx + 1}`}</h3>
                      <table className="w-full border-collapse border border-gray-600 text-sm mb-4">
                        <thead>
                          <tr>
                            <th className="border border-gray-600 bg-gray-800 py-2 px-3 text-left font-semibold">Type</th>
                            <th className="border border-gray-600 bg-gray-800 py-2 px-3 text-left font-semibold">Cutoff</th>
                            <th className="border border-gray-600 bg-gray-800 py-2 px-3 text-left font-semibold">Resonance</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-gray-600 py-2 px-3">{filter.selectedType || 'Lowpass'}</td>
                            <td className="border border-gray-600 py-2 px-3">{Number.isFinite(Number(filter.cutoff)) ? Number(filter.cutoff).toFixed(2) : '0.50'}</td>
                            <td className="border border-gray-600 py-2 px-3">{Number.isFinite(Number(filter.resonance)) ? Number(filter.resonance).toFixed(2) : '0.30'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
                {/* Right: Filter Visualization */}
                <div>
                  {result.synthConfig.filters.map((filter: any, idx: number) => {
                    const cutoff = Math.max(0, Math.min(1, Number(filter.cutoff) || 0.5));
                    const resonance = Math.max(0, Math.min(1, Number(filter.resonance) || 0.3));
                    // Use logarithmic mapping for cutoff
                    const cutoffHz = normalizedToHz(cutoff, 'audio');
                    return (
                      <div key={idx} className="text-center mb-8">
                        <div className="font-medium text-gray-200 mb-4">
                          Filter Type: <span className="font-bold text-purple-400">{filter.selectedType || 'Lowpass'}</span>
                        </div>
                        <div className="flex flex-row gap-8 justify-center mb-3">
                          <Knob value={cutoff} label="Cutoff" size={80} min={0} max={1} />
                          <Knob value={resonance} label="Resonance" size={80} min={0} max={1} />
                        </div>
                        <div className="text-gray-300 space-x-6 text-sm">
                          <span>Cutoff: <span className="font-mono text-white">{cutoffHz} Hz</span></span>
                          <span>Resonance: <span className="font-mono text-white">{Number.isFinite(resonance) ? resonance.toFixed(2) : '0.00'}</span></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Main Envelopes Section */}
          {result.adsrVCF && result.adsrVCA && (
          <div className="border-t border-gray-600 pt-8 mt-8">
            <h2 className="text-xl font-bold text-white mb-6 border-b border-gray-600 pb-2">Main Envelopes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* 📈 Filter Envelope (VCF) */}
              <div>
                <h3 className="font-semibold text-purple-300 mb-3 text-sm">📈 Filter Envelope (VCF)</h3>
                <table className="w-full border-collapse border border-gray-600 text-sm mb-4">
                  <thead>
                    <tr>
                      <th className="border border-gray-600 bg-gray-800 py-2 px-3 text-left font-semibold">Attack</th>
                      <th className="border border-gray-600 bg-gray-800 py-2 px-3 text-left font-semibold">Decay</th>
                      <th className="border border-gray-600 bg-gray-800 py-2 px-3 text-left font-semibold">Sustain</th>
                      <th className="border border-gray-600 bg-gray-800 py-2 px-3 text-left font-semibold">Release</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-600 py-2 px-3">{(result.adsrVCF.attack * 1000).toFixed(0)}ms</td>
                      <td className="border border-gray-600 py-2 px-3">{(result.adsrVCF.decay * 1000).toFixed(0)}ms</td>
                      <td className="border border-gray-600 py-2 px-3">{(result.adsrVCF.sustain * 100).toFixed(0)}%</td>
                      <td className="border border-gray-600 py-2 px-3">{(result.adsrVCF.release * 1000).toFixed(0)}ms</td>
                    </tr>
                  </tbody>
                </table>
                {/* EnvelopeChart beside the table */}
                <div className="flex justify-center mt-4">
                  <EnvelopeChart {...result.adsrVCF} width={300} height={150} />
                </div>
              </div>
              {/* 🔊 Amplitude Envelope (VCA) */}
              <div>
                <h3 className="font-semibold text-purple-300 mb-3 text-sm">🔊 Amplitude Envelope (VCA)</h3>
                <table className="w-full border-collapse border border-gray-600 text-sm mb-4">
                  <thead>
                    <tr>
                      <th className="border border-gray-600 bg-gray-800 py-2 px-3 text-left font-semibold">Attack</th>
                      <th className="border border-gray-600 bg-gray-800 py-2 px-3 text-left font-semibold">Decay</th>
                      <th className="border border-gray-600 bg-gray-800 py-2 px-3 text-left font-semibold">Sustain</th>
                      <th className="border border-gray-600 bg-gray-800 py-2 px-3 text-left font-semibold">Release</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-600 py-2 px-3">{(result.adsrVCA.attack * 1000).toFixed(0)}ms</td>
                      <td className="border border-gray-600 py-2 px-3">{(result.adsrVCA.decay * 1000).toFixed(0)}ms</td>
                      <td className="border border-gray-600 py-2 px-3">{(result.adsrVCA.sustain * 100).toFixed(0)}%</td>
                      <td className="border border-gray-600 py-2 px-3">{(result.adsrVCA.release * 1000).toFixed(0)}ms</td>
                    </tr>
                  </tbody>
                </table>
                {/* EnvelopeChart beside the table */}
                <div className="flex justify-center mt-4">
                  <EnvelopeChart {...result.adsrVCA} width={300} height={150} />
                </div>
              </div>
            </div>
          </div>
          )}

          {/* Main Markdown Instructions (cleaned) */}
          <div className="prose prose-invert max-w-none prose-headings:text-white prose-h2:text-xl prose-h2:font-bold prose-h2:mt-8 prose-h2:mb-4 prose-h2:border-b prose-h2:border-gray-600 prose-h2:pb-2 prose-h3:text-lg prose-h3:font-semibold prose-h3:mt-6 prose-h3:mb-3 prose-h3:text-purple-300 prose-table:text-sm prose-td:py-2 prose-td:px-3 prose-th:py-2 prose-th:px-3 prose-li:my-2">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h2: ({children, ...props}) => (
                  <h2 {...props} className="text-xl font-bold text-white mt-8 mb-4 border-b border-gray-600 pb-2 first:mt-0">
                    {children}
                  </h2>
                ),
                h3: ({children, ...props}) => (
                  <h3 {...props} className="text-lg font-semibold text-purple-300 mt-6 mb-3">
                    {children}
                  </h3>
                ),
                p: ({children, ...props}) => (
                  <p {...props} className="mb-4 leading-relaxed">
                    {children}
                  </p>
                ),
                ul: ({children, ...props}) => (
                  <ul {...props} className="space-y-2 mb-4">
                    {children}
                  </ul>
                ),
                li: ({children, ...props}) => (
                  <li {...props} className="my-2">
                    {children}
                  </li>
                ),
                table: ({children, ...props}) => (
                  <div className="overflow-x-auto my-6">
                    <table {...props} className="w-full border-collapse border border-gray-600 text-sm">
                      {children}
                    </table>
                  </div>
                ),
                th: ({children, ...props}) => (
                  <th {...props} className="border border-gray-600 bg-gray-800 py-2 px-3 text-left font-semibold">
                    {children}
                  </th>
                ),
                td: ({children, ...props}) => (
                  <td {...props} className="border border-gray-600 py-2 px-3">
                    {children}
                  </td>
                )
              }}
            >
              {cleanText}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </Card>
  );
};

export default PatchGuide;
