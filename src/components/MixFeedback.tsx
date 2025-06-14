import React, { useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { UploadIcon, PlayIcon, PauseIcon } from 'lucide-react';

export const MixFeedback: React.FC = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<string>('');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setUploadedFile(file);
      analyzeMix(file);
    }
  };

  const analyzeMix = async (file: File) => {
    setIsAnalyzing(true);
    
    // Simulate AI analysis
    setTimeout(() => {
      const feedbackMessages = [
        "🎛️ **Mix Analysis Complete**\n\n**Frequency Balance:**\n• Low-end: Well controlled, good sub-bass presence\n• Mids: Slightly crowded around 500Hz-1kHz\n• Highs: Nice air and sparkle above 10kHz\n\n**Dynamics:**\n• Good punch on the kick and snare\n• Consider parallel compression on drums\n• Vocals could use some gentle compression\n\n**Stereo Image:**\n• Nice width on the chorus\n• Bass elements properly centered\n• Consider panning some mid-range elements\n\n**Suggestions:**\n• Try a gentle high-pass filter on non-bass elements\n• Add some saturation to the vocal bus\n• Consider a multiband compressor on the mix bus",
        
        "🎵 **Mix Feedback Report**\n\n**Overall Balance:**\n• Great energy and vibe!\n• Low-end sits well in the mix\n• Upper mids could be tamed slightly\n\n**Technical Notes:**\n• Peak levels are well controlled\n• Good use of reverb and delay\n• Stereo field is well utilized\n\n**Enhancement Ideas:**\n• Try some tape saturation on the mix bus\n• Consider automating the vocal level\n• Add some subtle chorus to the lead synth\n• The snare could use more presence around 5kHz\n\n**Reference Comparison:**\n• Your mix has good commercial loudness\n• Frequency balance is competitive\n• Consider A/B testing with similar tracks",
        
        "🔊 **Professional Mix Analysis**\n\n**Strengths:**\n• Excellent low-end control\n• Good separation between elements\n• Nice use of spatial effects\n\n**Areas for Improvement:**\n• Vocal clarity could be enhanced\n• Some frequency masking in the 200-400Hz range\n• Consider more aggressive high-frequency content\n\n**Production Tips:**\n• Try de-essing the vocals around 6-8kHz\n• Use side-chain compression on pads\n• Add some harmonic excitement to the mix bus\n• Consider parallel processing on drums\n\n**Final Notes:**\n• Mix translates well across systems\n• Good dynamic range preservation\n• Professional loudness standards met"
      ];
      
      setFeedback(feedbackMessages[Math.floor(Math.random() * feedbackMessages.length)]);
      setIsAnalyzing(false);
    }, 2000);
  };

  return (
    <Card title="🎛️ Mix Feedback AI" className="glass neon-border">
      <div className="space-y-4">
        {/* Upload Section */}
        <div className="border-2 border-dashed border-purple-500/30 rounded-lg p-6 text-center hover:border-purple-500/50 transition-colors">
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
            id="mix-upload"
          />
          <label htmlFor="mix-upload" className="cursor-pointer">
            <UploadIcon className="w-8 h-8 mx-auto mb-2 text-purple-400" />
            <p className="text-sm text-gray-300">
              {uploadedFile ? uploadedFile.name : 'Upload your mix for AI feedback'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Supports MP3, WAV, FLAC, M4A
            </p>
          </label>
        </div>

        {/* Analysis Status */}
        {isAnalyzing && (
          <div className="text-center py-4">
            <div className="inline-flex items-center gap-2 text-purple-400">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-400 border-t-transparent"></div>
              <span className="text-sm">Analyzing your mix...</span>
            </div>
          </div>
        )}

        {/* Feedback Results */}
        {feedback && !isAnalyzing && (
          <div className="bg-gray-900/50 rounded-lg p-4 border border-purple-500/20">
            <div className="prose prose-invert prose-sm max-w-none">
              {feedback.split('\n').map((line, index) => {
                if (line.startsWith('**') && line.endsWith('**')) {
                  return (
                    <h4 key={index} className="text-purple-400 font-semibold mb-1 mt-3">
                      {line.replace(/\*\*/g, '')}
                    </h4>
                  );
                } else if (line.startsWith('•')) {
                  return (
                    <p key={index} className="text-gray-300 text-sm mb-1 ml-2">
                      {line}
                    </p>
                  );
                } else if (line.trim()) {
                  return (
                    <p key={index} className="text-gray-200 text-sm mb-2">
                      {line}
                    </p>
                  );
                } else {
                  return <br key={index} />;
                }
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {uploadedFile && (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => analyzeMix(uploadedFile)}
              disabled={isAnalyzing}
              className="flex-1"
            >
              Re-analyze Mix
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setUploadedFile(null);
                setFeedback('');
              }}
              className="flex-1"
            >
              Clear
            </Button>
          </div>
        )}

        {/* Tips */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>💡 <strong>Pro Tip:</strong> Upload a bounce of your current mix for detailed feedback</p>
          <p>🎯 <strong>Best Results:</strong> Use high-quality audio files (WAV/FLAC preferred)</p>
        </div>
      </div>
    </Card>
  );
};