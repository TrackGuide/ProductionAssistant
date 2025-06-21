import React from 'react';

export interface ModRouting {
  source: string;
  target: string;
  amount: number;
}

interface ModulationMatrixProps {
  routings: ModRouting[];
}

export const ModulationMatrix: React.FC<ModulationMatrixProps> = ({ routings }) => {
  const filtered = routings.filter(r => r.amount > 0);
  const sources = Array.from(new Set(filtered.map(r => r.source)));
  const targets = Array.from(new Set(filtered.map(r => r.target)));
  const grid: Record<string, Record<string, number>> = {};
  filtered.forEach(({ source, target, amount }) => {
    grid[source] = grid[source] || {};
    grid[source][target] = amount;
  });

  return (
    <table className="w-full table-fixed text-center border-collapse">
      <thead>
        <tr>
          <th></th>
          {targets.map(t => <th key={t} className="px-2 py-1 font-medium text-gray-300">{t}</th>)}
        </tr>
      </thead>
      <tbody>
        {sources.map(src => (
          <tr key={src}>
            <td className="px-2 py-1 font-medium text-gray-300 text-left">{src}</td>
            {targets.map(tgt => {
              const amt = grid[src]?.[tgt] || 0;
              return (
                <td key={tgt} className="p-1">
                  {amt > 0 ? (
                    <div
                      className="w-full h-4 rounded"
                      style={{ backgroundColor: `rgba(255,165,0, ${amt})` }}
                      title={`${Math.round(amt * 100)}%`}
                    />
                  ) : <span className="text-gray-600">–</span>}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
