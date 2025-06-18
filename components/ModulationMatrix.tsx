import React from 'react';

interface ModulationRouting {
  source: string;
  target: string;
  amount?: number;
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
  const labelWidth = 100;
  const labelHeight = 30;
  
  const matrixWidth = labelWidth + targets.length * cellSize;
  const matrixHeight = labelHeight + sources.length * cellSize;
  
  // Create a lookup for active connections
  const connectionMap = new Map<string, number>();
  routings.forEach(routing => {
    const key = `${routing.source}-${routing.target}`;
    connectionMap.set(key, routing.amount || 0.5);
  });
  
  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <h3 className="text-sm font-medium text-gray-300 mb-4">Modulation Matrix</h3>
      
      <div className="overflow-x-auto">
        <svg width={matrixWidth} height={matrixHeight} className="min-w-full">
          {/* Target labels (top) */}
          {targets.map((target, targetIndex) => (
            <text
              key={`target-${targetIndex}`}
              x={labelWidth + targetIndex * cellSize + cellSize / 2}
              y={labelHeight - 5}
              textAnchor="middle"
              className="fill-gray-300 text-xs font-medium"
              transform={`rotate(-45, ${labelWidth + targetIndex * cellSize + cellSize / 2}, ${labelHeight - 5})`}
            >
              {target.length > 8 ? target.substring(0, 8) + '...' : target}
            </text>
          ))}
          
          {/* Source labels (left) */}
          {sources.map((source, sourceIndex) => (
            <text
              key={`source-${sourceIndex}`}
              x={labelWidth - 5}
              y={labelHeight + sourceIndex * cellSize + cellSize / 2 + 4}
              textAnchor="end"
              className="fill-gray-300 text-xs font-medium"
            >
              {source.length > 12 ? source.substring(0, 12) + '...' : source}
            </text>
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
                  />
                  
                  {/* Connection indicator */}
                  {isConnected && (
                    <>
                      <circle
                        cx={x + cellSize / 2}
                        cy={y + cellSize / 2}
                        r={Math.max(3, amount * 12)}
                        fill="#fff"
                        opacity="0.9"
                      />
                      <text
                        x={x + cellSize / 2}
                        y={y + cellSize / 2 + 3}
                        textAnchor="middle"
                        className="fill-gray-800 text-xs font-bold"
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
          {/* Vertical lines */}
          {Array.from({ length: targets.length + 1 }, (_, i) => (
            <line
              key={`vline-${i}`}
              x1={labelWidth + i * cellSize}
              y1={labelHeight}
              x2={labelWidth + i * cellSize}
              y2={matrixHeight}
              stroke="#6b7280"
              strokeWidth="1"
            />
          ))}
          
          {/* Horizontal lines */}
          {Array.from({ length: sources.length + 1 }, (_, i) => (
            <line
              key={`hline-${i}`}
              x1={labelWidth}
              y1={labelHeight + i * cellSize}
              x2={matrixWidth}
              y2={labelHeight + i * cellSize}
              stroke="#6b7280"
              strokeWidth="1"
            />
          ))}
        </svg>
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex items-center space-x-4 text-xs text-gray-400">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-orange-500 rounded opacity-80"></div>
          <span>Active Connection</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-600 rounded opacity-30"></div>
          <span>No Connection</span>
        </div>
        <span>Numbers show modulation amount (%)</span>
      </div>
    </div>
  );
};