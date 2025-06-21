import React from 'react';

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
  // Normalize values to 0-1 range
  const normalizedAttack = Math.max(0, Math.min(1, attack));
  const normalizedDecay = Math.max(0, Math.min(1, decay));
  const normalizedSustain = Math.max(0, Math.min(1, sustain));
  const normalizedRelease = Math.max(0, Math.min(1, release));
  
  // Calculate time segments (proportional to parameter values)
  const totalTime = normalizedAttack + normalizedDecay + 0.3 + normalizedRelease; // 0.3 for sustain hold
  const attackWidth = (normalizedAttack / totalTime) * width * 0.8;
  const decayWidth = (normalizedDecay / totalTime) * width * 0.8;
  const sustainWidth = (0.3 / totalTime) * width * 0.8;
  const releaseWidth = (normalizedRelease / totalTime) * width * 0.8;
  
  // Calculate Y positions (inverted for SVG coordinate system)
  const maxY = height * 0.9;
  const minY = height * 0.1;
  const sustainY = minY + (1 - normalizedSustain) * (maxY - minY);
  
  // Build the path with exponential curves for more realistic ADSR
  const padding = width * 0.1;
  let currentX = padding;
  
  // Start point
  const pathData = [`M ${currentX} ${maxY}`];
  
  // Attack phase (exponential curve)
  const attackControlX = currentX + attackWidth * 0.5;
  const attackControlY = maxY - (maxY - minY) * 0.1; // Slight curve
  pathData.push(`C ${attackControlX} ${attackControlY}, ${currentX + attackWidth * 0.8} ${minY + 10}, ${currentX + attackWidth} ${minY}`);
  currentX += attackWidth;
  
  // Decay phase (exponential curve)
  const decayControlX = currentX + decayWidth * 0.3;
  const decayControlY = minY + (sustainY - minY) * 0.2;
  pathData.push(`C ${decayControlX} ${decayControlY}, ${currentX + decayWidth * 0.7} ${sustainY - 5}, ${currentX + decayWidth} ${sustainY}`);
  currentX += decayWidth;
  
  // Sustain phase (straight line)
  pathData.push(`L ${currentX + sustainWidth} ${sustainY}`);
  currentX += sustainWidth;
  
  // Release phase (exponential curve)
  const releaseControlX = currentX + releaseWidth * 0.7;
  const releaseControlY = sustainY + (maxY - sustainY) * 0.8;
  pathData.push(`C ${currentX + releaseWidth * 0.3} ${sustainY + 5}, ${releaseControlX} ${releaseControlY}, ${currentX + releaseWidth} ${maxY}`);
  
  const path = pathData.join(' ');
  
  return (
    <svg width={width} height={height} className="w-full h-auto">
      {/* Background */}
      <rect width="100%" height="100%" fill="#1f2937" rx="4" ry="4" />
      
      {/* Grid lines */}
      <line x1="0" y1={maxY} x2={width} y2={maxY} stroke="#4b5563" strokeWidth="1" strokeDasharray="4,4" />
      <line x1="0" y1={minY} x2={width} y2={minY} stroke="#4b5563" strokeWidth="1" strokeDasharray="4,4" />
      <line x1="0" y1={sustainY} x2={width} y2={sustainY} stroke="#4b5563" strokeWidth="1" strokeDasharray="4,4" />
      
      {/* Envelope curve */}
      <path
        d={path}
        fill="none"
        stroke="#f97316"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Phase markers */}
      <line 
        x1={padding + attackWidth} 
        y1={minY - 5} 
        x2={padding + attackWidth} 
        y2={maxY + 5} 
        stroke="#6b7280" 
        strokeWidth="1" 
        strokeDasharray="4,4" 
      />
      <line 
        x1={padding + attackWidth + decayWidth} 
        y1={minY - 5} 
        x2={padding + attackWidth + decayWidth} 
        y2={maxY + 5} 
        stroke="#6b7280" 
        strokeWidth="1" 
        strokeDasharray="4,4" 
      />
      <line 
        x1={padding + attackWidth + decayWidth + sustainWidth} 
        y1={minY - 5} 
        x2={padding + attackWidth + decayWidth + sustainWidth} 
        y2={maxY + 5} 
        stroke="#6b7280" 
        strokeWidth="1" 
        strokeDasharray="4,4" 
      />
      
      {/* Phase labels */}
      <text 
        x={padding + attackWidth / 2} 
        y={height - 5} 
        textAnchor="middle" 
        fill="#d1d5db" 
        fontSize="10"
      >
        A
      </text>
      <text 
        x={padding + attackWidth + decayWidth / 2} 
        y={height - 5} 
        textAnchor="middle" 
        fill="#d1d5db" 
        fontSize="10"
      >
        D
      </text>
      <text 
        x={padding + attackWidth + decayWidth + sustainWidth / 2} 
        y={height - 5} 
        textAnchor="middle" 
        fill="#d1d5db" 
        fontSize="10"
      >
        S
      </text>
      <text 
        x={padding + attackWidth + decayWidth + sustainWidth + releaseWidth / 2} 
        y={height - 5} 
        textAnchor="middle" 
        fill="#d1d5db" 
        fontSize="10"
      >
        R
      </text>
      
      {/* Value indicators */}
      <text x="5" y={minY + 15} fill="#d1d5db" fontSize="10">1.0</text>
      <text x="5" y={sustainY + 15} fill="#d1d5db" fontSize="10">{normalizedSustain.toFixed(1)}</text>
      <text x="5" y={maxY - 5} fill="#d1d5db" fontSize="10">0.0</text>
      
      {/* Parameter values */}
      <text x={width - 5} y={15} textAnchor="end" fill="#d1d5db" fontSize="10">
        A: {normalizedAttack.toFixed(2)} D: {normalizedDecay.toFixed(2)} S: {normalizedSustain.toFixed(2)} R: {normalizedRelease.toFixed(2)}
      </text>
    </svg>
  );
};