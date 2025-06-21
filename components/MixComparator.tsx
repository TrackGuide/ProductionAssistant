// MixComparator v1.4 - fixed to show full analysis checkbox only for Mix B

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { UploadIcon, CloseIcon, PlayIcon, RefreshIcon, CopyIcon } from './icons.tsx';
import { generateMixComparison } from '../services/geminiService';

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
      const mixABase64 = await fileToBase64(mixA);
      const mixBBase64 = mixB ? await fileToBase64(mixB) : undefined;

      const analysisContent = await generateMixComparison({
        mixAFile: mixABase64,
        mixBFile: mixBBase64,
        mixAName: mixA.name,
        mixBName: mixB?.name,
        requestMixBAnalysis
      });

      setAnalysis(analysisContent);
    } catch (error) {
      console.error('Error analyzing mixes:', error);
      setAnalysis('Error analyzing mixes. Please try again.');
    }
    setIsAnalyzing(false);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
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
    setRequestMixBAnalysis(false);
  };

  const handleCopyAnalysis = async () => {
    if (!analysis) return;

    try {
      await navigator.clipboard.writeText(analysis);
      setCopyStatus("Copied!");
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
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">⚖️ Mix Comparison</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <MixUploadBox type="A" file={mixA} setFile={setMixA} showFullAnalysisCheckbox={false} />
          <MixUploadBox type="B" file={mixB} setFile={setMixB} showFullAnalysisCheckbox={true} requestFullAnalysis={requestMixBAnalysis} setRequestFullAnalysis={setRequestMixBAnalysis} />
        </div>

        <div className="flex gap-4 mb-6">
          <button onClick={handleAnalyze} disabled={!mixA || !mixB || isAnalyzing} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
            {isAnalyzing ? 'Comparing...' : 'Compare Mixes'}
          </button>
          <button onClick={reset} className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2">
            <RefreshIcon className="w-5 h-5" /> Reset
          </button>
        </div>

        {analysis && (
          <div className="bg-gray-900 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Analysis Results</h3>
              <button onClick={handleCopyAnalysis} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
                <CopyIcon className="w-4 h-4" /> Copy
              </button>
              {copyStatus && <span className="text-sm text-green-400">{copyStatus}</span>}
            </div>
            <ReactMarkdown className="prose prose-invert">{analysis}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

function MixUploadBox({ type, file, setFile, showFullAnalysisCheckbox, requestFullAnalysis, setRequestFullAnalysis }) {
  const label = type === 'A' ? 'Mix A (Original)' : 'Mix B (Revised)';
  return (
    <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
      <h3 className="text-lg font-semibold text-white mb-4">{label}</h3>
      {file ? (
        <div className="text-green-400">
          <PlayIcon className="w-6 h-6 mx-auto mb-2" />
          <p>{file.name}</p>
          <button onClick={() => setFile(null)} className="mt-2 text-red-400 hover:text-red-300">Remove</button>
        </div>
      ) : (
        <label className="cursor-pointer">
          <UploadIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-400 mb-2">Upload audio file</p>
          <input type="file" accept="audio/*" className="hidden" onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])} />
        </label>
      )}
      {showFullAnalysisCheckbox && file && (
        <div className="mt-4 pt-4 border-t border-gray-600">
          <label className="flex items-center justify-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input type="checkbox" checked={requestFullAnalysis} onChange={(e) => setRequestFullAnalysis(e.target.checked)} className="rounded border-gray-500 text-blue-600" />
            Request full mix analysis
          </label>
        </div>
      )}
    </div>
  );
}
