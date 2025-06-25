import React, { useState, useCallback, useMemo } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Spinner } from './Spinner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import { PATCH_INPUT_CATEGORIES } from '../constants';
import { generateSynthPatchGuide } from '../services/patchGuideServiceOptimized';
import { SYNTHESIS_TYPES, MODEL_OVERRIDES } from '../synthesisTypes';
import { copyToClipboard } from '../utils/copyUtils';
import { dawMetadata } from '../constants/dawMetadata';

// ✅ Simplified, consistent state structure
interface PatchGuideInputs {
  synthesisType: string;
  synthModel?: string;
  genre: string;
  voiceType: string;
  styleMood: string[];
  dynamicsMovement: string[];
  notes: string;
  dawName?: string;
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
    notes: '',
    dawName: undefined
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

      const response = await generateSynthPatchGuide({
        description,
        synthesisType: inputs.synthesisType as any,
        synthModel: inputs.synthModel,
        genre: inputs.genre,
        voiceType: inputs.voiceType,
        notes: inputs.notes,
        dawName: inputs.dawName
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
      notes: '',
      dawName: undefined
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
                {SYNTHESIS_TYPES.map((t: { key: string; label: string }) => (
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
                {MODEL_OVERRIDES[inputs.synthesisType as keyof typeof MODEL_OVERRIDES]?.map((model: string) => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>
          )}
          
          {/* Optional DAW Selection */}
          <div>
            <label className="block text-gray-200 mb-2 font-medium">DAW (optional)</label>
            <select
              value={inputs.dawName || ""}
              onChange={e => updateInput('dawName', e.target.value || undefined)}
              className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            >
              <option value="">None</option>
              {dawMetadata.map(daw => (
                <option key={daw.dawName} value={daw.dawName}>{daw.dawName}</option>
              ))}
            </select>
          </div>

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

// ✅ Results Component: render markdown directly
const PatchGuideResults: React.FC<{ result: PatchGuideResult }> = ({ result }) => {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = () => {
    copyToClipboard(result.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Complete Patch Guide</h3>
        <button
          onClick={handleCopy}
          className="px-3 py-1.5 rounded-lg bg-gray-700 text-gray-200 border border-gray-600 hover:bg-purple-600 hover:text-white transition-colors text-sm font-medium"
        >
          {copied ? 'Copied!' : 'Copy Text'}
        </button>
      </div>
      <div className="prose prose-invert max-w-none overflow-auto">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm, remarkBreaks]} 
          rehypePlugins={[rehypeRaw]}
          components={{
            table: ({node, ...props}) => (
              <div className="overflow-auto my-4">
                <table className="border-collapse border border-gray-700" {...props} />
              </div>
            ),
            tr: ({node, ...props}) => (
              <tr className="border-b border-gray-700" {...props} />
            ),
            th: ({node, ...props}) => (
              <th className="border border-gray-700 px-4 py-2 bg-gray-800" {...props} />
            ),
            td: ({node, ...props}) => (
              <td className="border border-gray-700 px-4 py-2" {...props} />
            ),
            h2: ({node, ...props}) => (
              <h2 className="text-xl font-bold mt-8 mb-4 text-purple-400" {...props} />
            ),
            h3: ({node, ...props}) => (
              <h3 className="text-lg font-bold mt-6 mb-3 text-blue-400" {...props} />
            ),
            p: ({node, ...props}) => (
              <p className="my-4" {...props} />
            ),
            ul: ({node, ...props}) => (
              <ul className="list-disc pl-6 my-4" {...props} />
            ),
            ol: ({node, ...props}) => (
              <ol className="list-decimal pl-6 my-4" {...props} />
            ),
            li: ({node, ...props}) => (
              <li className="my-1" {...props} />
            )
          }}
        >
          {result.text}
        </ReactMarkdown>
      </div>
    </Card>
  );
};

export default PatchGuide;
