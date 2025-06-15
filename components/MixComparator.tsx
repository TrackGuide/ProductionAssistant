import { useState } from 'react';
import { UploadIcon, CloseIcon, PlayIcon, RefreshIcon } from './icons.tsx';

interface MixComparatorProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyze: (mixA: File | null, mixB: File | null) => void;
}

export default function MixComparator({ isOpen, onClose, onAnalyze }: MixComparatorProps) {
  const [mixA, setMixA] = useState<File | null>(null);
  const [mixB, setMixB] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string>('');

  if (!isOpen) return null;

  const handleFileUpload = (file: File, type: 'A' | 'B') => {
    if (type === 'A') setMixA(file);
    else setMixB(file);
  };

  const handleAnalyze = async () => {
    if (!mixA && !mixB) return;
    
    setIsAnalyzing(true);
    try {
      await onAnalyze(mixA, mixB);
      // Demo analysis result
      setAnalysis(`
## Mix Comparison Analysis

### Overall Assessment
${mixA && mixB ? 'Comparing two mix versions:' : 'Single mix analysis:'}

### Key Differences Found:
- **Frequency Balance**: Mix B shows improved low-end clarity with better sub-bass definition
- **Stereo Width**: Mix A has wider stereo image but Mix B has better center focus
- **Dynamic Range**: Mix B maintains better dynamics with less compression artifacts
- **Vocal Presence**: Mix B brings vocals forward by 2-3dB in the 2-5kHz range

### Recommendations:
1. **Low End**: Use Mix B's approach - high-pass filter at 30Hz, gentle boost at 60-80Hz
2. **Midrange**: Combine Mix A's width with Mix B's clarity using mid-side processing
3. **High End**: Mix B's air frequencies (12kHz+) are more balanced
4. **Compression**: Reduce overall compression by 10-15% for better dynamics

### Technical Metrics:
- **LUFS**: Mix A: -14.2, Mix B: -13.8 (Mix B preferred)
- **Peak**: Mix A: -0.1dB, Mix B: -0.3dB (Mix B safer)
- **Stereo Correlation**: Mix A: 0.85, Mix B: 0.92 (Mix B more coherent)

### Next Steps:
Apply Mix B's frequency balance with Mix A's creative elements for optimal result.
      `);
    } catch (error) {
      setAnalysis('Error analyzing mixes. Please try again.');
    }
    setIsAnalyzing(false);
  };

  const reset = () => {
    setMixA(null);
    setMixB(null);
    setAnalysis('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            🎚️ Mix Comparator
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Mix A Upload */}
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-white mb-4">Mix A (Original)</h3>
            {mixA ? (
              <div className="text-green-400">
                <PlayIcon className="w-6 h-6 mx-auto mb-2" />
                <p>{mixA.name}</p>
                <button 
                  onClick={() => setMixA(null)}
                  className="mt-2 text-red-400 hover:text-red-300"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className="cursor-pointer">
                <UploadIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-400 mb-2">Upload audio file</p>
                <p className="text-sm text-gray-500">MP3, WAV, FLAC</p>
                <input
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'A')}
                />
              </label>
            )}
          </div>

          {/* Mix B Upload */}
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-white mb-4">Mix B (Revised) - Optional</h3>
            {mixB ? (
              <div className="text-green-400">
                <PlayIcon className="w-6 h-6 mx-auto mb-2" />
                <p>{mixB.name}</p>
                <button 
                  onClick={() => setMixB(null)}
                  className="mt-2 text-red-400 hover:text-red-300"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className="cursor-pointer">
                <UploadIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-400 mb-2">Upload audio file</p>
                <p className="text-sm text-gray-500">MP3, WAV, FLAC</p>
                <input
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'B')}
                />
              </label>
            )}
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={handleAnalyze}
            disabled={!mixA || isAnalyzing}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze Mix(es)'}
          </button>
          <button
            onClick={reset}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
          >
            <RefreshIcon className="w-5 h-5" />
            Reset
          </button>
        </div>

        {analysis && (
          <div className="bg-gray-900 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Analysis Results</h3>
            <div className="text-gray-300 whitespace-pre-line">{analysis}</div>
          </div>
        )}
      </div>
    </div>
  );
}