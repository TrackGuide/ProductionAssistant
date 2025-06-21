import React, { useRef } from 'react';

interface EnvelopeChartProps {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  width?: number;
  height?: number;
}

/**
 * ADSR envelope visualization component using SVG
 * Displays the attack, decay, sustain, and release curve
 */
export const EnvelopeChart: React.FC<EnvelopeChartProps> = ({
  attack,
  decay,
  sustain,
  release,
  width = 400,
  height = 150
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  const downloadEnvelope = () => {
    if (!svgRef.current) return;
    
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    canvas.width = width;
    canvas.height = height;
    
    img.onload = () => {
      if (ctx) {
        ctx.fillStyle = '#111827';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0);
        
        const link = document.createElement('a');
        link.download = `envelope_A${attack}_D${decay}_S${sustain}_R${release}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };
  // Normalize values to 0-1 range
  const normalizedAttack = Math.max(0, Math.min(1, attack));
  const normalizedDecay = Math.max(0, Math.min(1, decay));
  const normalizedSustain = Math.max(0, Math.min(1, sustain));
  const normalizedRelease = Math.max(0, Math.min(1, release));
  
  // Calculate time segments (proportional to parameter values)
  const totalTime = normalizedAttack + normalizedDecay + 0.3 + normalizedRelease; // 0.3 for sustain hold
  const attackTime = (normalizedAttack / totalTime) * width * 0.8;
  const decayTime = (normalizedDecay / totalTime) * width * 0.8;
  const sustainTime = (0.3 / totalTime) * width * 0.8;
  const releaseTime = (normalizedRelease / totalTime) * width * 0.8;
  
  // Calculate Y positions (inverted for SVG coordinate system)
  const maxY = height * 0.9;
  const minY = height * 0.1;
  const sustainY = minY + (1 - normalizedSustain) * (maxY - minY);
  
  // Build the path
  const padding = width * 0.1;
  let currentX = padding;
  
  // Start point
  const pathData = [`M ${currentX} ${maxY}`];
  
  // Attack phase
  currentX += attackTime;
  pathData.push(`L ${currentX} ${minY}`);
  
  // Decay phase
  currentX += decayTime;
  pathData.push(`L ${currentX} ${sustainY}`);
  
  // Sustain phase
  currentX += sustainTime;
  pathData.push(`L ${currentX} ${sustainY}`);
  
  // Release phase
  currentX += releaseTime;
  pathData.push(`L ${currentX} ${maxY}`);
  
  const path = pathData.join(' ');
  
  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-gray-300">ADSR Envelope</h3>
        <button
          onClick={downloadEnvelope}
          className="px-2 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
        >
          Download
        </button>
      </div>
      <svg ref={svgRef} width={width} height={height} className="w-full h-auto">
        {/* Background grid */}
        <defs>
          <pattern id="grid" width="40" height="30" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 30" fill="none" stroke="#374151" strokeWidth="1" opacity="0.3"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Envelope curve */}
        <path
          d={path}
          fill="none"
          stroke="#f97316"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Phase labels */}
        <text x={padding + attackTime / 2} y={height - 5} 
              textAnchor="middle" className="fill-gray-400 text-xs">
          A
        </text>
        <text x={padding + attackTime + decayTime / 2} y={height - 5} 
              textAnchor="middle" className="fill-gray-400 text-xs">
          D
        </text>
        <text x={padding + attackTime + decayTime + sustainTime / 2} y={height - 5} 
              textAnchor="middle" className="fill-gray-400 text-xs">
          S
        </text>
        <text x={padding + attackTime + decayTime + sustainTime + releaseTime / 2} y={height - 5} 
              textAnchor="middle" className="fill-gray-400 text-xs">
          R
        </text>
        
        {/* Value indicators */}
        <circle cx={padding + attackTime} cy={minY} r="3" fill="#f97316" />
        <circle cx={padding + attackTime + decayTime} cy={sustainY} r="3" fill="#f97316" />
        
        {/* Y-axis labels */}
        <text x="5" y={minY + 5} className="fill-gray-400 text-xs">1.0</text>
        <text x="5" y={sustainY + 5} className="fill-gray-400 text-xs">
          {normalizedSustain.toFixed(1)}
        </text>
        <text x="5" y={maxY + 5} className="fill-gray-400 text-xs">0.0</text>
      </svg>
      
      {/* Parameter values */}
      <div className="grid grid-cols-4 gap-2 mt-2 text-xs text-gray-400">
        <div className="text-center">
          <div className="font-medium">Attack</div>
          <div>{normalizedAttack.toFixed(2)}</div>
        </div>
        <div className="text-center">
          <div className="font-medium">Decay</div>
          <div>{normalizedDecay.toFixed(2)}</div>
        </div>
        <div className="text-center">
          <div className="font-medium">Sustain</div>
          <div>{normalizedSustain.toFixed(2)}</div>
        </div>
        <div className="text-center">
          <div className="font-medium">Release</div>
          <div>{normalizedRelease.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
};