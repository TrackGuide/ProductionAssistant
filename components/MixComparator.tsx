import { useState } from 'react';
import { UploadIcon, CloseIcon, PlayIcon, RefreshIcon, CopyIcon } from './icons.tsx';

interface MixComparatorProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyze: (mixA: File | null, mixB: File | null, options?: {
    requestMixAAnalysis?: boolean;
    requestMixBAnalysis?: boolean;
  }) => void;
}

export default function MixComparator({ isOpen, onClose, onAnalyze }: MixComparatorProps) {
  const [mixA, setMixA] = useState<File | null>(null);
  const [mixB, setMixB] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string>('');
  const [copyStatus, setCopyStatus] = useState<string>('');
  const [requestMixAAnalysis, setRequestMixAAnalysis] = useState(false);
  const [requestMixBAnalysis, setRequestMixBAnalysis] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (file: File, type: 'A' | 'B') => {
    if (type === 'A') setMixA(file);
    else setMixB(file);
  };

  const handleAnalyze = async () => {
    if (!mixA && !mixB) return;
    
    setIsAnalyzing(true);
    try {
      await onAnalyze(mixA, mixB, {
        requestMixAAnalysis,
        requestMixBAnalysis
      });
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
    setCopyStatus('');
    setRequestMixAAnalysis(false);
    setRequestMixBAnalysis(false);
  };

  const handleCopyAnalysis = async () => {
    if (!analysis) return;
    
    try {
      // Create styled HTML content with no background color
      const styledHtml = `
        <div style="color: #d1d5db; font-family: system-ui, -apple-system, sans-serif; line-height: 1.6;">
          ${analysis.split('\n').map(line => {
            if (line.startsWith('## ')) {
              return `<h2 style="color: #f3f4f6; font-size: 1.25rem; font-weight: bold; margin: 1rem 0 0.5rem 0;">${line.replace('## ', '')}</h2>`;
            } else if (line.startsWith('### ')) {
              return `<h3 style="color: #e5e7eb; font-size: 1.1rem; font-weight: bold; margin: 0.75rem 0 0.25rem 0;">${line.replace('### ', '')}</h3>`;
            } else if (line.startsWith('- **')) {
              const match = line.match(/- \*\*(.*?)\*\*:\s*(.*)/);
              if (match) {
                return `<p style="margin: 0.25rem 0;"><strong style="color: #f9fafb;">${match[1]}:</strong> ${match[2]}</p>`;
              }
            } else if (line.startsWith('- ')) {
              return `<p style="margin: 0.25rem 0; padding-left: 1rem;">• ${line.replace('- ', '')}</p>`;
            } else if (line.match(/^\d+\./)) {
              return `<p style="margin: 0.25rem 0; padding-left: 1rem;">${line}</p>`;
            } else if (line.trim()) {
              return `<p style="margin: 0.5rem 0;">${line}</p>`;
            }
            return '<br>';
          }).join('')}
        </div>
      `;

      if (navigator.clipboard && navigator.clipboard.write) {
        const htmlBlob = new Blob([styledHtml], { type: 'text/html' });
        const textBlob = new Blob([analysis], { type: 'text/plain' });
        
        // @ts-ignore
        const clipboardItem = new ClipboardItem({
          'text/html': htmlBlob,
          'text/plain': textBlob,
        });
        await navigator.clipboard.write([clipboardItem]);
        setCopyStatus("Analysis Copied (Rich Format)!");
      } else {
        await navigator.clipboard.writeText(analysis);
        setCopyStatus("Analysis Copied (Plain Text)!");
      }
    } catch (err) {
      console.error("Failed to copy analysis:", err);
      setCopyStatus("Failed to copy. Please try manually.");
    } finally {
      setTimeout(() => setCopyStatus(''), 3000);
    }
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
            {mixA && (
              <div className="mt-4 pt-4 border-t border-gray-600">
                <label className="flex items-center justify-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requestMixAAnalysis}
                    onChange={(e) => setRequestMixAAnalysis(e.target.checked)}
                    className="rounded border-gray-500 text-blue-600 focus:ring-blue-500"
                  />
                  Request full mix analysis for Mix A
                </label>
              </div>
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
            {mixB && (
              <div className="mt-4 pt-4 border-t border-gray-600">
                <label className="flex items-center justify-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requestMixBAnalysis}
                    onChange={(e) => setRequestMixBAnalysis(e.target.checked)}
                    className="rounded border-gray-500 text-blue-600 focus:ring-blue-500"
                  />
                  Request full mix analysis for Mix B
                </label>
              </div>
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
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Analysis Results</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCopyAnalysis}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <CopyIcon className="w-4 h-4" />
                  Copy Analysis
                </button>
                {copyStatus && (
                  <span className={`text-sm ${copyStatus.includes("Failed") ? "text-red-400" : "text-green-400"}`}>
                    {copyStatus}
                  </span>
                )}
              </div>
            </div>
            <div className="text-gray-300 whitespace-pre-line">{analysis}</div>
          </div>
        )}
      </div>
    </div>
  );
}