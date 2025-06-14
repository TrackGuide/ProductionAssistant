import React, { useState, useRef } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { PlayIcon, StopIcon, UploadIcon } from './icons';

interface AudioTrack {
  id: string;
  name: string;
  file: File;
  url: string;
  duration?: number;
}

export const MixComparator: React.FC = () => {
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('audio/')) {
        const url = URL.createObjectURL(file);
        const newTrack: AudioTrack = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
          file,
          url
        };
        
        setTracks(prev => [...prev, newTrack]);
      }
    });
    
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const playTrack = (trackId: string) => {
    // Stop any currently playing track
    if (currentlyPlaying && audioRefs.current[currentlyPlaying]) {
      audioRefs.current[currentlyPlaying].pause();
    }

    const audio = audioRefs.current[trackId];
    if (audio) {
      audio.currentTime = currentTime;
      audio.play();
      setCurrentlyPlaying(trackId);
    }
  };

  const stopAllTracks = () => {
    Object.values(audioRefs.current).forEach(audio => {
      audio.pause();
    });
    setCurrentlyPlaying(null);
  };

  const removeTrack = (trackId: string) => {
    const track = tracks.find(t => t.id === trackId);
    if (track) {
      URL.revokeObjectURL(track.url);
    }
    
    if (audioRefs.current[trackId]) {
      delete audioRefs.current[trackId];
    }
    
    setTracks(prev => prev.filter(t => t.id !== trackId));
    
    if (currentlyPlaying === trackId) {
      setCurrentlyPlaying(null);
    }
  };

  const handleTimeUpdate = (trackId: string) => {
    const audio = audioRefs.current[trackId];
    if (audio && currentlyPlaying === trackId) {
      setCurrentTime(audio.currentTime);
    }
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
    Object.values(audioRefs.current).forEach(audio => {
      audio.currentTime = time;
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const maxDuration = Math.max(...tracks.map(track => {
    const audio = audioRefs.current[track.id];
    return audio?.duration || 0;
  }));

  return (
    <Card title="🎧 Mix Comparator" className="bg-gray-800/80 backdrop-blur-md">
      <div className="space-y-4">
        {/* Upload Section */}
        <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="secondary"
            leftIcon={<UploadIcon className="w-4 h-4" />}
          >
            Upload Audio Files
          </Button>
          <p className="text-xs text-gray-400 mt-2">
            Upload multiple versions of your mix to compare them
          </p>
        </div>

        {/* Playback Controls */}
        {tracks.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Button
                onClick={stopAllTracks}
                variant="danger"
                size="sm"
                leftIcon={<StopIcon className="w-4 h-4" />}
              >
                Stop All
              </Button>
              <div className="flex-1">
                <div className="text-xs text-gray-400 mb-1">
                  {formatTime(currentTime)} / {formatTime(maxDuration)}
                </div>
                <input
                  type="range"
                  min="0"
                  max={maxDuration || 100}
                  value={currentTime}
                  onChange={(e) => handleSeek(Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
            </div>
          </div>
        )}

        {/* Track List */}
        <div className="space-y-2">
          {tracks.map((track) => (
            <div key={track.id} className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg">
              <audio
                ref={(el) => {
                  if (el) {
                    audioRefs.current[track.id] = el;
                  }
                }}
                src={track.url}
                onTimeUpdate={() => handleTimeUpdate(track.id)}
                onEnded={() => setCurrentlyPlaying(null)}
                onLoadedMetadata={(e) => {
                  const audio = e.target as HTMLAudioElement;
                  setTracks(prev => prev.map(t => 
                    t.id === track.id ? { ...t, duration: audio.duration } : t
                  ));
                }}
              />
              
              <Button
                onClick={() => currentlyPlaying === track.id ? stopAllTracks() : playTrack(track.id)}
                variant={currentlyPlaying === track.id ? "danger" : "primary"}
                size="sm"
                leftIcon={currentlyPlaying === track.id ? 
                  <StopIcon className="w-4 h-4" /> : 
                  <PlayIcon className="w-4 h-4" />
                }
              >
                {currentlyPlaying === track.id ? 'Stop' : 'Play'}
              </Button>
              
              <div className="flex-1">
                <div className="text-sm font-medium text-white">{track.name}</div>
                <div className="text-xs text-gray-400">
                  {track.duration ? formatTime(track.duration) : 'Loading...'}
                </div>
              </div>
              
              <button
                onClick={() => removeTrack(track.id)}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        {tracks.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">No audio files uploaded yet.</p>
            <p className="text-xs mt-1">Upload different versions of your mix to compare them side by side.</p>
          </div>
        )}

        {/* Tips */}
        <div className="mt-4 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
          <h4 className="text-sm font-medium text-blue-300 mb-2">💡 Comparison Tips</h4>
          <ul className="text-xs text-gray-300 space-y-1">
            <li>• Use the same playback position to compare different versions</li>
            <li>• Listen for differences in EQ, compression, and stereo width</li>
            <li>• Compare at consistent volume levels</li>
            <li>• Focus on one element at a time (vocals, drums, etc.)</li>
          </ul>
        </div>
      </div>
    </Card>
  );
};