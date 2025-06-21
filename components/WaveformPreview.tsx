import React, { useEffect, useRef, useState } from 'react';

interface WaveformPreviewProps {
  waveform?: string;
  width?: number;
  height?: number;
}

/**
 * Waveform visualization component using Canvas API
 * Displays a static waveform representation based on type
 */
export const WaveformPreview: React.FC<WaveformPreviewProps> = ({
  waveform = 'custom',
  width = 400,
  height = 100
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.fillStyle = '#1f2937'; // gray-800
    ctx.fillRect(0, 0, width, height);
    
    // Draw waveform based on type
    drawWaveform(ctx, width, height, waveform);
    
    // Add grid lines
    drawGridLines(ctx, width, height);
    
    // Convert to image URL for download
    setImageUrl(canvas.toDataURL('image/png'));
  }, [waveform, width, height]);

  const downloadWaveform = () => {
    if (!imageUrl) return;
    
    const link = document.createElement('a');
    link.download = `waveform_${waveform}.png`;
    link.href = imageUrl;
    link.click();
  };
  
  const drawWaveform = (ctx: CanvasRenderingContext2D, w: number, h: number, type: string) => {
    ctx.strokeStyle = '#f97316'; // orange-500
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    const centerY = h / 2;
    const samples = 300;
    
    for (let i = 0; i < samples; i++) {
      const x = (i / samples) * w;
      let amplitude = 0;
      
      // Generate different waveforms based on type
      switch (type.toLowerCase()) {
        case 'sine':
          amplitude = Math.sin(i * 0.1) * 0.8;
          break;
        case 'square':
          amplitude = (i % 50 < 25) ? 0.8 : -0.8;
          break;
        case 'saw':
        case 'sawtooth':
          amplitude = ((i % 50) / 50 * 2 - 1) * 0.8;
          break;
        case 'triangle':
          const phase = (i % 50) / 50;
          amplitude = (phase < 0.5 ? phase * 4 - 1 : 3 - phase * 4) * 0.8;
          break;
        case 'noise':
          amplitude = (Math.random() * 2 - 1) * 0.7;
          break;
        case 'pulse':
          amplitude = (i % 50 < 10) ? 0.8 : -0.8;
          break;
        default:
          // Custom/complex waveform
          const freq1 = Math.sin(i * 0.05) * 0.4;
          const freq2 = Math.sin(i * 0.15) * 0.2;
          const freq3 = Math.sin(i * 0.3) * 0.1;
          amplitude = freq1 + freq2 + freq3;
      }
      
      const y = centerY + amplitude * centerY * 0.8;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
  };
  
  const drawGridLines = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.strokeStyle = '#374151'; // gray-700
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    
    const centerY = h / 2;
    
    // Horizontal center line
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(w, centerY);
    ctx.stroke();
    
    // Vertical grid lines
    for (let i = 1; i < 4; i++) {
      const x = (i / 4) * w;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    
    ctx.setLineDash([]);
  };
  
  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-gray-300">Waveform: {waveform}</h3>
        <button
          onClick={downloadWaveform}
          className="px-2 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
        >
          Download
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full h-auto rounded border border-gray-600"
      />
    </div>
  );
};