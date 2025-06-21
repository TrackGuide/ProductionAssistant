import React, { useEffect, useRef } from 'react';

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
  }, [waveform, width, height]);
  
  const drawWaveform = (ctx: CanvasRenderingContext2D, w: number, h: number, type: string) => {
    ctx.strokeStyle = '#f97316'; // orange-500
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    const centerY = h / 2;
    const samples = 600; // Higher resolution
    const cycles = 4; // Show 4 cycles of the waveform
    
    for (let i = 0; i < samples; i++) {
      const x = (i / samples) * w;
      let amplitude = 0;
      const t = (i / samples) * cycles * Math.PI * 2;
      
      // Generate different waveforms based on type
      switch (type.toLowerCase()) {
        case 'sine':
          amplitude = Math.sin(t) * 0.8;
          break;
        case 'square':
          amplitude = Math.sin(t) >= 0 ? 0.8 : -0.8;
          break;
        case 'saw':
        case 'sawtooth':
          amplitude = ((t % (Math.PI * 2)) / (Math.PI * 2) * 2 - 1) * 0.8;
          break;
        case 'triangle':
          const phase = (t % (Math.PI * 2)) / (Math.PI * 2);
          amplitude = (phase < 0.5 ? phase * 4 - 1 : 3 - phase * 4) * 0.8;
          break;
        case 'noise':
          // For noise, we use a seeded random to make it consistent
          amplitude = (Math.sin(i * 12345.6789) * 0.5 + Math.sin(i * 9876.54321) * 0.5) * 0.7;
          break;
        case 'pulse':
          amplitude = Math.sin(t) > 0.5 ? 0.8 : -0.8; // 25% duty cycle pulse
          break;
        default:
          // Custom/complex waveform - a mix of harmonics
          const fundamental = Math.sin(t) * 0.5;
          const harmonic2 = Math.sin(t * 2) * 0.25;
          const harmonic3 = Math.sin(t * 3) * 0.125;
          const harmonic5 = Math.sin(t * 5) * 0.0625;
          amplitude = fundamental + harmonic2 + harmonic3 + harmonic5;
      }
      
      const y = centerY + amplitude * centerY * 0.8;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
    
    // Add a subtle glow effect
    ctx.save();
    ctx.filter = 'blur(2px)';
    ctx.strokeStyle = 'rgba(249, 115, 22, 0.4)'; // orange-500 with transparency
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();
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
    
    // Horizontal grid lines (25% and 75%)
    ctx.beginPath();
    ctx.moveTo(0, h * 0.25);
    ctx.lineTo(w, h * 0.25);
    ctx.moveTo(0, h * 0.75);
    ctx.lineTo(w, h * 0.75);
    ctx.stroke();
    
    // Vertical grid lines
    for (let i = 1; i < 8; i++) {
      const x = (i / 8) * w;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    
    ctx.setLineDash([]);
  };
  
  // Format the waveform name for display
  const formatWaveformName = (name: string): string => {
    if (!name) return 'Custom';
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };
  
  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-gray-300">Oscillator Waveform</h3>
        <span className="text-sm font-medium text-orange-500">{formatWaveformName(waveform)}</span>
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