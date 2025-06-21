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
  
  // Attack phase - exponential curve
  const attackPoints = 20;
  for (let i = 1; i <= attackPoints; i++) {
    const t = i / attackPoints;
    const x = currentX + t * attackTime;
    // Exponential curve for attack (1 - e^(-5t))
    const y = maxY - (1 - Math.exp(-5 * t)) * (maxY - minY);
    pathData.push(`L ${x} ${y}`);
  }
  currentX += attackTime;
  
  // Decay phase - exponential curve
  const decayPoints = 20;
  for (let i = 1; i <= decayPoints; i++) {
    const t = i / decayPoints;
    const x = currentX + t * decayTime;
    // Exponential curve for decay
    const y = minY + (1 - Math.exp(-3 * t)) * (sustainY - minY);
    pathData.push(`L ${x} ${y}`);
  }
  currentX += decayTime;
  
  // Sustain phase
  pathData.push(`L ${currentX + sustainTime} ${sustainY}`);
  currentX += sustainTime;
  
  // Release phase - exponential curve
  const releasePoints = 20;
  for (let i = 1; i <= releasePoints; i++) {
    const t = i / releasePoints;
    const x = currentX + t * releaseTime;
    // Exponential curve for release
    const y = sustainY + (1 - Math.exp(-3 * t)) * (maxY - sustainY);
    pathData.push(`L ${x} ${y}`);
  }
  
  const path = pathData.join(' ');
  
  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-gray-300">ADSR Envelope</h3>
        <div className="flex space-x-2">
          <span className="text-xs text-orange-500">A: {normalizedAttack.toFixed(2)}</span>
          <span className="text-xs text-orange-500">D: {normalizedDecay.toFixed(2)}</span>
          <span className="text-xs text-orange-500">S: {normalizedSustain.toFixed(2)}</span>
          <span className="text-xs text-orange-500">R: {normalizedRelease.toFixed(2)}</span>
        </div>
      </div>
      <svg width={width} height={height} className="w-full h-auto">
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
        
        {/* Add a subtle glow effect */}
        <path
          d={path}
          fill="none"
          stroke="rgba(249, 115, 22, 0.3)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="blur(3px)"
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
        <circle cx={padding + attackTime + decayTime + sustainTime} cy={sustainY} r="3" fill="#f97316" />
        
        {/* Y-axis labels */}
        <text x="5" y={minY + 5} className="fill-gray-400 text-xs">1.0</text>
        <text x="5" y={sustainY + 5} className="fill-gray-400 text-xs">
          {normalizedSustain.toFixed(1)}
        </text>
        <text x="5" y={maxY + 5} className="fill-gray-400 text-xs">0.0</text>
      </svg>
    </div>
  );
};