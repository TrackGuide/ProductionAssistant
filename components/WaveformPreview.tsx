import React, { useEffect, useRef } from 'react';

interface WaveformPreviewProps {
  waveform?: string;
  width?: number;
  height?: number;
}

/**
 * Waveform visualization component using Canvas API
 * Displays a visual representation of common synthesizer waveforms
 */
export const WaveformPreview: React.FC<WaveformPreviewProps> = ({
  waveform = 'sine',
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
    
    // Draw waveform
    ctx.strokeStyle = '#f97316'; // orange-500
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    const centerY = height / 2;
    const amplitude = height * 0.4; // 40% of height
    const samples = width;
    
    for (let i = 0; i < samples; i++) {
      const x = i;
      let y = centerY;
      
      // Calculate y position based on waveform type
      const normalizedX = (i / samples) * 16; // 16 cycles across the width
      
      switch (waveform.toLowerCase()) {
        case 'sine':
          y = centerY + Math.sin(normalizedX * Math.PI) * amplitude;
          break;
          
        case 'square':
          y = centerY + (Math.sin(normalizedX * Math.PI) >= 0 ? amplitude : -amplitude);
          break;
          
        case 'saw':
        case 'sawtooth':
          y = centerY + ((normalizedX % 1) * 2 - 1) * amplitude;
          break;
          
        case 'triangle':
          const tri = normalizedX % 1;
          y = centerY + (tri < 0.5 ? tri * 4 - 1 : 3 - tri * 4) * amplitude;
          break;
          
        case 'noise':
          y = centerY + (Math.random() * 2 - 1) * amplitude;
          break;
          
        case 'pulse':
          y = centerY + (Math.sin(normalizedX * Math.PI) > 0.5 ? amplitude : -amplitude);
          break;
          
        default:
          // Default to sine with some harmonics for custom/complex waveforms
          y = centerY + (
            Math.sin(normalizedX * Math.PI) * 0.6 + 
            Math.sin(normalizedX * Math.PI * 2) * 0.3 + 
            Math.sin(normalizedX * Math.PI * 3) * 0.1
          ) * amplitude;
      }
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
    
    // Draw center line
    ctx.strokeStyle = '#4b5563'; // gray-600
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();
    
    // Draw waveform label
    ctx.fillStyle = '#d1d5db'; // gray-300
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(waveform.toUpperCase(), width - 10, height - 10);
    
  }, [waveform, width, height]);
  
  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="w-full h-auto rounded border border-gray-700"
    />
  );
};