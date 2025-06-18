import React, { useEffect, useRef } from 'react';

interface WaveformPreviewProps {
  audioData?: string;
  width?: number;
  height?: number;
}

/**
 * Waveform visualization component using Canvas API
 * Displays a static waveform representation
 */
export const WaveformPreview: React.FC<WaveformPreviewProps> = ({
  audioData,
  width = 400,
  height = 100
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.fillStyle = '#1f2937'; // gray-800
    ctx.fillRect(0, 0, width, height);
    
    if (!audioData) {
      // Draw placeholder waveform
      drawPlaceholderWaveform(ctx, width, height);
      return;
    }
    
    // If audioData is provided, try to decode and draw
    // For now, we'll draw a sample waveform
    drawSampleWaveform(ctx, width, height);
  }, [audioData, width, height]);
  
  const drawPlaceholderWaveform = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.strokeStyle = '#6b7280'; // gray-500
    ctx.lineWidth = 1;
    ctx.beginPath();
    
    const centerY = h / 2;
    const samples = 200;
    
    for (let i = 0; i < samples; i++) {
      const x = (i / samples) * w;
      const amplitude = Math.sin(i * 0.1) * Math.sin(i * 0.02) * 0.3;
      const y = centerY + amplitude * centerY;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
  };
  
  const drawSampleWaveform = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.strokeStyle = '#f97316'; // orange-500
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    const centerY = h / 2;
    const samples = 300;
    
    for (let i = 0; i < samples; i++) {
      const x = (i / samples) * w;
      // Generate a more complex waveform
      const freq1 = Math.sin(i * 0.05) * 0.4;
      const freq2 = Math.sin(i * 0.15) * 0.2;
      const freq3 = Math.sin(i * 0.3) * 0.1;
      const amplitude = freq1 + freq2 + freq3;
      const y = centerY + amplitude * centerY;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
    
    // Add grid lines
    ctx.strokeStyle = '#374151'; // gray-700
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    
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
      <h3 className="text-sm font-medium text-gray-300 mb-2">Waveform Preview</h3>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full h-auto rounded border border-gray-600"
      />
    </div>
  );
};