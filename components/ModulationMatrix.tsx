import React from 'react';

interface ModulationRouting {
  source: string;
  target: string;
  amount: number;
}

interface ModulationMatrixProps {
  routings: ModulationRouting[];
}

/**
 * Modulation matrix visualization component
 * Shows connections between modulation sources and targets
 */
export const ModulationMatrix: React.FC<ModulationMatrixProps> = ({ routings }) => {
  if (!routings || routings.length === 0) {
    return null;
  }
  
  // Extract unique sources and targets
  const sources = Array.from(new Set(routings.map(r => r.source)));
  const targets = Array.from(new Set(routings.map(r => r.target)));
  
  const cellSize = 40;
  const labelWidth = 120;
  const labelHeight = 40;
  
  const matrixWidth = labelWidth + targets.length * cellSize;
  const matrixHeight = labelHeight + sources.length * cellSize;
  
  // Create a lookup for active connections
  const connectionMap = new Map<string, number>();
  routings.forEach(routing => {
    const key = `${routing.source}-${routing.target}`;
    connectionMap.set(key, routing.amount);
  });
  
  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 overflow-x-auto">
      <svg width={matrixWidth} height={matrixHeight} className="min-w-full">
        {/* Background */}
        <rect 
          x="0" 
          y="0" 
          width={matrixWidth} 
          height={matrixHeight} 
          fill="#1f2937" 
          rx="4" 
          ry="4"
        />
        
        {/* Target labels (top) */}
        {targets.map((target, targetIndex) => (
          <g key={`target-${targetIndex}`}>
            <text
              x={labelWidth + targetIndex * cellSize + cellSize / 2}
              y={labelHeight - 10}
              textAnchor="middle"
              fill="#d1d5db"
              fontSize="10"
              fontWeight="500"
              transform={`rotate(-45, ${labelWidth + targetIndex * cellSize + cellSize / 2}, ${labelHeight - 10})`}
            >
              {target.length > 12 ? target.substring(0, 12) + '...' : target}
            </text>
          </g>
        ))}
        
        {/* Source labels (left) */}
        {sources.map((source, sourceIndex) => (
          <g key={`source-${sourceIndex}`}>
            <text
              x={labelWidth - 8}
              y={labelHeight + sourceIndex * cellSize + cellSize / 2 + 4}
              textAnchor="end"
              fill="#d1d5db"
              fontSize="10"
              fontWeight="500"
            >
              {source.length > 14 ? source.substring(0, 14) + '...' : source}
            </text>
            
            {/* LED indicator */}
            <circle
              cx={20}
              cy={labelHeight + sourceIndex * cellSize + cellSize / 2}
              r={4}
              fill="#10b981"
              opacity="0.8"
            >
              <animate 
                attributeName="opacity" 
                values="0.4;0.8;0.4" 
                dur="2s" 
                repeatCount="indefinite" 
              />
            </circle>
          </g>
        ))}
        
        {/* Matrix grid */}
        {sources.map((source, sourceIndex) =>
          targets.map((target, targetIndex) => {
            const key = `${source}-${target}`;
            const isConnected = connectionMap.has(key);
            const amount = connectionMap.get(key) || 0;
            
            const x = labelWidth + targetIndex * cellSize;
            const y = labelHeight + sourceIndex * cellSize;
            
            return (
              <g key={`cell-${sourceIndex}-${targetIndex}`}>
                {/* Cell background */}
                <rect
                  x={x}
                  y={y}
                  width={cellSize}
                  height={cellSize}
                  fill={isConnected ? '#f97316' : '#374151'}
                  stroke="#6b7280"
                  strokeWidth="1"
                  opacity={isConnected ? 0.8 : 0.3}
                  rx="2"
                  ry="2"
                />
                
                {/* Connection indicator */}
                {isConnected && (
                  <>
                    <circle
                      cx={x + cellSize / 2}
                      cy={y + cellSize / 2}
                      r={Math.max(5, amount * 15)}
                      fill="#ffffff"
                      opacity="0.9"
                    />
                    <text
                      x={x + cellSize / 2}
                      y={y + cellSize / 2 + 3}
                      textAnchor="middle"
                      fill="#1f2937"
                      fontSize="9"
                      fontWeight="bold"
                    >
                      {Math.round(amount * 100)}
                    </text>
                  </>
                )}
              </g>
            );
          })
        )}
        
        {/* Grid lines */}
        <line 
          x1={labelWidth} 
          y1={0} 
          x2={labelWidth} 
          y2={matrixHeight} 
          stroke="#6b7280" 
          strokeWidth="1.5" 
        />
        <line 
          x1={0} 
          y1={labelHeight} 
          x2={matrixWidth} 
          y2={labelHeight} 
          stroke="#6b7280" 
          strokeWidth="1.5" 
        />
      </svg>
      
      {/* Legend */}
      <div className="mt-4 flex items-center space-x-4 text-xs text-gray-400">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-orange-500 rounded opacity-80"></div>
          <span>Active Connection</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-gray-600 rounded opacity-30"></div>
          <span>No Connection</span>
        </div>
        <span>Numbers show modulation amount (%)</span>
      </div>
    </div>
  );
};