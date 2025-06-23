import React, { useState, useCallback, useMemo } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Spinner } from './Spinner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { EnvelopeChart } from './EnvelopeChart';
import { generateSynthPatchGuide } from '../services/patchGuideServiceOptimized';
import { PATCH_INPUT_CATEGORIES, SYNTH_OPTIONS } from '../constants';
import { Knob } from './Knob';

// ✅ Simplified, consistent state structure
interface PatchGuideInputs {
  synth: string;
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
    synth: 'Generic',
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
    inputs.synth && inputs.genre && inputs.voiceType
  , [inputs.synth, inputs.genre, inputs.voiceType]);

  // ✅ Optimized submit handler
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await generateSynthPatchGuide({
        description: [
          ...inputs.styleMood,
          ...inputs.dynamicsMovement
        ].join(', '),
        synth: inputs.synth,
        genre: inputs.genre,
        voiceType: inputs.voiceType,
        notes: inputs.notes
      });

      const patchResult = {
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
      synth: 'Generic',
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
            {/* Synth Selection */}
            <div>
              <label className="block text-gray-200 mb-2 font-medium">Synthesizer</label>
              <select
                value={inputs.synth}
                onChange={e => updateInput('synth', e.target.value)}
                className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                required
              >
                <option value="">Select synth...</option>
                {SYNTH_OPTIONS.map(synth => (
                  <option key={synth} value={synth}>{synth}</option>
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

          {/* ✅ Simplified Style/Mood Selection */}
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

// ✅ Separate Results Component for better organization
const PatchGuideResults: React.FC<{ result: PatchGuideResult }> = ({ result }) => {
  return (
    <>
      {/* Instructions */}
      {result.text && (
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">Patch Instructions</h3>
          <div className="prose prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {result.text}
            </ReactMarkdown>
          </div>
        </Card>
      )}

      {/* Oscillators */}
      {result.synthConfig?.oscillators && (
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">Oscillator Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.synthConfig.oscillators.map((osc: any, idx: number) => (
              <div key={idx} className="bg-gray-800 rounded-lg p-4">
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
        </Card>
      )}

      {/* Filter */}
      {result.synthConfig?.filters && result.synthConfig.filters.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">Filter Settings</h3>
          <div className="flex flex-col items-center space-y-4">
            {result.synthConfig.filters.map((filter: any, idx: number) => {
              // ✅ Robust value parsing with proper type checking
              const cutoff = Math.max(0, Math.min(1, Number(filter.cutoff) || 0.5));
              const resonance = Math.max(0, Math.min(1, Number(filter.resonance) || 0.3));
              const cutoffHz = cutoff * 20000;
              
              return (
                <div key={idx} className="text-center">
                  <div className="font-medium text-gray-200 mb-4">
                    Filter Type: <span className="font-bold text-purple-400">{filter.selectedType || 'Lowpass'}</span>
                  </div>
                  <div className="flex flex-row gap-8 justify-center mb-3">
                    <Knob value={cutoff} label="Cutoff" size={80} min={0} max={1} />
                    <Knob value={resonance} label="Resonance" size={80} min={0} max={1} />
                  </div>
                  <div className="text-gray-300 space-x-6">
                    <span>Cutoff: <span className="font-mono text-white">{Number.isFinite(cutoffHz) ? cutoffHz.toFixed(0) : '0'} Hz</span></span>
                    <span>Resonance: <span className="font-mono text-white">{Number.isFinite(resonance) ? resonance.toFixed(2) : '0.00'}</span></span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Envelopes */}
      <Card>
        <h3 className="text-lg font-semibold text-white mb-4">Envelope Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="text-center">
            <h4 className="font-medium text-gray-200 mb-3">Filter Envelope</h4>
            <EnvelopeChart {...result.adsrVCF} width={300} height={150} />
          </div>
          <div className="text-center">
            <h4 className="font-medium text-gray-200 mb-3">Amp Envelope</h4>
            <EnvelopeChart {...result.adsrVCA} width={300} height={150} />
          </div>
        </div>
      </Card>

      {/* Creative Tips */}
      {result.summary && (
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">Creative Tips</h3>
          <div className="prose prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {result.summary}
            </ReactMarkdown>
          </div>
        </Card>
      )}
    </>
  );
};

export default PatchGuide;
