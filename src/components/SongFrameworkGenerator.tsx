import React, { useState, useRef, useMemo } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Spinner } from './Spinner';
import { MarkdownRenderer } from './MarkdownRenderer';
import { generateStandaloneSongFramework } from '../services/geminiService';

export const SongFrameworkGenerator: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [framework, setFramework] = useState<string | null>(null);
  const [parsedFramework, setParsedFramework] = useState<any>(null);
  const [genre, setGenre] = useState<string>('');
  const [vibe, setVibe] = useState<string>('');
  const [instruments, setInstruments] = useState<string>('');
  const [inputMethod, setInputMethod] = useState<'file' | 'url'>('file');
  const [referenceUrl, setReferenceUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>('');
  
  // Function to generate different colors for each instrument
  const getInstrumentColor = (index: number): string => {
    // Array of vibrant colors
    const colors = [
      'bg-blue-500',      // Blue
      'bg-green-500',     // Green
      'bg-purple-500',    // Purple
      'bg-pink-500',      // Pink
      'bg-yellow-500',    // Yellow
      'bg-red-500',       // Red
      'bg-indigo-500',    // Indigo
      'bg-orange-500',    // Orange
      'bg-teal-500',      // Teal
      'bg-cyan-500',      // Cyan
      'bg-lime-500',      // Lime
      'bg-amber-500',     // Amber
      'bg-rose-500',      // Rose
      'bg-fuchsia-500',   // Fuchsia
      'bg-emerald-500',   // Emerald
    ];
    
    // Return color based on index, wrapping around if there are more instruments than colors
    return colors[index % colors.length];
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
    }
  };

  const handleAnalyzeTrack = async () => {
    setIsLoading(true);
    setError(null);
    setFramework(null);
    
    // Process vibe as string array
    const vibeArray = vibe.split(',').map(v => v.trim()).filter(v => v);
    
    // Process instruments as string array
    const instrumentsArray = instruments.split(',').map(i => i.trim()).filter(i => i);

    try {
      let result;
      
      if (inputMethod === 'file') {
        // Handle file upload
        const fileInput = fileInputRef.current;
        
        if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
          throw new Error('Please select an audio file to analyze.');
        }

        const file = fileInput.files[0];
        const reader = new FileReader();
        
        result = await new Promise<string>((resolve, reject) => {
          reader.onload = async (e) => {
            try {
              if (!e.target || typeof e.target.result !== 'string') {
                reject('Failed to read the file.');
                return;
              }

              // Extract the base64 data from the data URL
              const base64Data = e.target.result.split(',')[1];
              
              const frameworkResult = await generateStandaloneSongFramework(
                { 
                  base64: base64Data, 
                  mimeType: file.type 
                },
                genre || undefined,
                vibeArray.length > 0 ? vibeArray : undefined,
                instrumentsArray.length > 0 ? instrumentsArray : undefined
              );
              
              resolve(frameworkResult);
            } catch (err) {
              reject(err);
            }
          };

          reader.onerror = () => {
            reject('Failed to read the file.');
          };

          reader.readAsDataURL(file);
        });
      } else {
        // Handle URL input
        if (!referenceUrl.trim()) {
          throw new Error('Please enter a reference track URL.');
        }
        
        result = await generateStandaloneSongFramework(
          undefined, // No audio data
          genre || undefined,
          vibeArray.length > 0 ? vibeArray : undefined,
          instrumentsArray.length > 0 ? instrumentsArray : undefined,
          referenceUrl.trim()
        );
      }

      setFramework(result);
      
      // Try to parse the JSON result
      try {
        const jsonResult = JSON.parse(result);
        
        // Validate the parsed result has the required properties
        if (jsonResult && 
            Array.isArray(jsonResult.instruments) && 
            Array.isArray(jsonResult.sections) && 
            Array.isArray(jsonResult.matrix)) {
          setParsedFramework(jsonResult);
        } else {
          console.error("Invalid framework format - missing required properties");
          // We'll still show the raw result even if the parsed result isn't valid
        }
      } catch (jsonError) {
        console.error("Failed to parse framework JSON:", jsonError);
        // We'll still display the raw result if parsing fails
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto w-full py-8 px-4 md:px-0">
      <Card className="bg-gray-800/50 p-6 mb-6">
        <h2 className="text-2xl font-bold text-white mb-4">Song Framework Generator</h2>
        <p className="text-gray-300 mb-6">
          Upload a reference track to generate a detailed song framework and arrangement blueprint. 
          This tool analyzes your audio and creates a structured outline that you can use as a 
          starting point for your production.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-400 mb-1">
              Reference Track Input Method
            </label>
            <div className="flex space-x-4 mb-2">
              <button
                onClick={() => setInputMethod('file')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  inputMethod === 'file' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Upload Audio File
              </button>
              <button
                onClick={() => setInputMethod('url')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  inputMethod === 'url' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Provide URL
              </button>
            </div>
          </div>

          {inputMethod === 'file' ? (
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">
                Reference Track (MP3, WAV, M4A)
              </label>
              <div className="flex flex-col space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="audio/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="secondary"
                    className="bg-gray-700 hover:bg-gray-600"
                  >
                    Select File
                  </Button>
                  <span className="text-sm text-gray-300 truncate">
                    {fileName || "No file selected"}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">
                Reference Track URL (YouTube, SoundCloud, etc.)
              </label>
              <input
                type="text"
                value={referenceUrl}
                onChange={(e) => setReferenceUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 placeholder-gray-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1">
              Genre (Optional)
            </label>
            <input
              type="text"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder="e.g., House, Hip Hop, Rock"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 placeholder-gray-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1">
              Vibe/Mood (Optional, comma-separated)
            </label>
            <input
              type="text"
              value={vibe}
              onChange={(e) => setVibe(e.target.value)}
              placeholder="e.g., Energetic, Dark, Chill"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 placeholder-gray-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1">
              Instruments (Optional, comma-separated)
            </label>
            <input
              type="text"
              value={instruments}
              onChange={(e) => setInstruments(e.target.value)}
              placeholder="e.g., Piano, Guitar, Synth"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 placeholder-gray-500"
            />
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            onClick={handleAnalyzeTrack}
            variant="primary"
            disabled={isLoading}
            className="px-8"
          >
            {isLoading ? <Spinner size="sm" /> : `Analyze ${inputMethod === 'url' ? 'URL' : 'Track'} & Generate Framework`}
          </Button>
        </div>
      </Card>

      {error && (
        <Card className="bg-red-800/30 border border-red-700/50 p-4 mb-6">
          <p className="text-red-200">{error}</p>
        </Card>
      )}

      {framework && !parsedFramework && (
        <Card className="bg-gray-800/50 p-6">
          <h3 className="text-xl font-bold text-white mb-4">Generated Song Framework</h3>
          <div className="markdown-content">
            <pre className="whitespace-pre-wrap text-gray-300 overflow-auto p-4 bg-gray-900 rounded-md">
              {framework}
            </pre>
          </div>
        </Card>
      )}

      {parsedFramework && (
        <Card className="bg-gray-800/50 p-6">
          <h3 className="text-xl font-bold text-white mb-4">Generated Song Framework</h3>
          
          {/* Arrangement Visualization */}
          <div className="mb-8">
            <h4 className="text-lg font-bold text-white mb-3">Song Structure & Arrangement</h4>
            
            {/* Color Legend */}
            <div className="mb-4 flex flex-wrap gap-3">
              {parsedFramework?.instruments?.map((instrument: string, index: number) => (
                <div key={index} className="flex items-center">
                  <div className={`w-4 h-4 ${getInstrumentColor(index)} mr-2 rounded-sm`}></div>
                  <span className="text-sm text-gray-300">{instrument}</span>
                </div>
              ))}
            </div>
            
            <div className="overflow-x-auto pb-4">
              <div className="arrangement-matrix" style={{ minWidth: 'max-content' }}>
                {/* Header showing section markers */}
                <div className="flex border-b border-gray-700 mb-2">
                  <div className="w-32 shrink-0 p-2 font-medium text-gray-400">Instrument</div>
                  {parsedFramework?.sections?.map((section: {name: string, bars: number}, sectionIndex: number) => (
                    <div 
                      key={sectionIndex} 
                      className="text-center text-xs font-medium text-gray-400 border-l border-gray-700 flex flex-col"
                      style={{ 
                        width: `${section.bars * 16}px`,
                        minWidth: `${section.bars * 16}px` 
                      }}
                    >
                      <span className="py-1">{section.name} ({section.bars} bars)</span>
                      <div className="flex justify-between px-2 text-gray-500">
                        <span>1</span>
                        {section.bars > 4 && <span>{Math.floor(section.bars/2)}</span>}
                        <span>{section.bars}</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Matrix rows */}
                {parsedFramework?.instruments?.map((instrument: string, instrumentIndex: number) => (
                  <div key={instrumentIndex} className="flex items-center border-b border-gray-700/50">
                    <div className="w-32 shrink-0 p-2 font-medium text-gray-200 truncate">{instrument}</div>
                    <div className="flex">
                      {parsedFramework?.matrix?.[instrumentIndex]?.map((active: number, barIndex: number) => (
                        <div
                          key={barIndex}
                          className={`h-8 w-4 m-px ${active === 1 ? getInstrumentColor(instrumentIndex) : 'bg-gray-700/30'}`}
                          title={`${instrument}: ${active === 1 ? 'Active' : 'Inactive'}`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Export options */}
          <div className="flex justify-end space-x-4">
            <Button
              onClick={() => {
                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(parsedFramework, null, 2));
                const downloadAnchorNode = document.createElement('a');
                downloadAnchorNode.setAttribute("href", dataStr);
                downloadAnchorNode.setAttribute("download", "song-framework.json");
                document.body.appendChild(downloadAnchorNode);
                downloadAnchorNode.click();
                downloadAnchorNode.remove();
              }}
              variant="secondary"
              className="text-sm"
            >
              Export JSON
            </Button>
          </div>
        </Card>
      )}

      <div className="text-xs text-gray-500 mt-8 text-center px-2">
        Tip: For best results, use high-quality audio and provide genre, vibe, and instruments information.
      </div>
    </div>
  );
};