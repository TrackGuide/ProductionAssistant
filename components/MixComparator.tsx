import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { UploadIcon, CloseIcon, PlayIcon, RefreshIcon, CopyIcon } from './icons.tsx';
import { generateMixComparison } from '../services/geminiService.ts';

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
    if (!mixA) return;
    
    setIsAnalyzing(true);
    try {
      // Convert files to base64 for the AI service
      const mixABase64 = await fileToBase64(mixA);
      const mixBBase64 = mixB ? await fileToBase64(mixB) : undefined;
      
      // Call the AI service
      const analysisContent = await generateMixComparison({
        mixAFile: mixABase64,
        mixBFile: mixBBase64,
        mixAName: mixA.name,
        mixBName: mixB?.name,
        requestMixAAnalysis,
        requestMixBAnalysis
      });

      setAnalysis(analysisContent);
    } catch (error) {
      console.error('Error analyzing mixes:', error);
      setAnalysis('Error analyzing mixes. Please try again.');
    }
    setIsAnalyzing(false);
  };

  // Helper function to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix to get just the base64 data
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
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
      // Create styled HTML content with black text on white/transparent background
      const styledHtml = `
        <div style="color: #000000; font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; background: transparent;">
          ${analysis.split('\n').map(line => {
            if (line.startsWith('## ')) {
              return `<h2 style="color: #000000; font-size: 1.25rem; font-weight: bold; margin: 1rem 0 0.5rem 0;">${line.replace('## ', '')}</h2>`;
            } else if (line.startsWith('### ')) {
              return `<h3 style="color: #000000; font-size: 1.1rem; font-weight: bold; margin: 0.75rem 0 0.25rem 0;">${line.replace('### ', '')}</h3>`;
            } else if (line.startsWith('- **')) {
              const match = line.match(/- \*\*(.*?)\*\*:\s*(.*)/);
              if (match) {
                return `<p style="margin: 0.25rem 0; color: #000000;"><strong style="color: #000000;">${match[1]}:</strong> ${match[2]}</p>`;
              }
            } else if (line.startsWith('- ')) {
              return `<p style="margin: 0.25rem 0; padding-left: 1rem; color: #000000;">• ${line.replace('- ', '')}</p>`;
            } else if (line.match(/^\d+\./)) {
              return `<p style="margin: 0.25rem 0; padding-left: 1rem; color: #000000;">${line}</p>`;
            } else if (line.trim()) {
              return `<p style="margin: 0.5rem 0; color: #000000;">${line}</p>`;
            }
            return '<br>';
          }).join('')}
        </div>
      `;

      // Create clean plain text version without markdown formatting
      const cleanText = analysis.split('\n').map(line => {
        if (line.startsWith('## ')) {
          return line.replace('## ', '');
        } else if (line.startsWith('### ')) {
          return line.replace('### ', '');
        } else if (line.startsWith('- **')) {
          const match = line.match(/- \*\*(.*?)\*\*:\s*(.*)/);
          if (match) {
            return `${match[1]}: ${match[2]}`;
          }
        } else if (line.startsWith('- ')) {
          return `• ${line.replace('- ', '')}`;
        }
        return line;
      }).join('\n');

      if (navigator.clipboard && navigator.clipboard.write) {
        const htmlBlob = new Blob([styledHtml], { type: 'text/html' });
        const textBlob = new Blob([cleanText], { type: 'text/plain' });
        
        // @ts-ignore
        const clipboardItem = new ClipboardItem({
          'text/html': htmlBlob,
          'text/plain': textBlob,
        });
        await navigator.clipboard.write([clipboardItem]);
        setCopyStatus("Analysis Copied (Rich Format)!");
      } else {
        await navigator.clipboard.writeText(cleanText);
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
            🎚️ Mix Comparison
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
            <h3 className="text-lg font-semibold text-white mb-4">Mix B (Revised)</h3>
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
            disabled={!mixA || !mixB || isAnalyzing}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            {isAnalyzing ? 'Comparing...' : 'Compare Mixes'}
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
            <div className="prose prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-2xl font-bold text-white mb-4 border-b border-gray-600 pb-2">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-xl font-semibold text-white mt-6 mb-3 border-l-4 border-blue-500 pl-3">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-lg font-semibold text-white mt-4 mb-2">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="text-gray-300 mb-3 leading-relaxed">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside text-gray-300 mb-3 space-y-1 ml-4">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside text-gray-300 mb-3 space-y-1 ml-4">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-gray-300 mb-1">
                      {children}
                    </li>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-blue-300">
                      {children}
                    </strong>
                  ),
                }}
              >
                {analysis}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
