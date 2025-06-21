import React from 'react';
import { SynthConfig } from '../config/synthConfigs';

interface ModRouting {
  source: string;
  target: string;
  amount: number;
}

interface ModulationMatrixProps {
  config: SynthConfig;
  routings: ModRouting[];
}

export const ModulationMatrix: React.FC<ModulationMatrixProps> = ({ config, routings }) => {
  if (routings.length === 0) {
    return (
      <div className="text-gray-300">No modulation routings available.</div>
    );
  }

  return (
    <table className="w-full text-gray-200 border-collapse">
      <thead>
        <tr className="bg-gray-800">
          <th className="p-2 text-left">Source</th>
          <th className="p-2 text-left">Target</th>
          <th className="p-2 text-left">Amount</th>
        </tr>
      </thead>
      <tbody>
        {routings.map((mod, i) => (
          <tr key={i} className="border-t border-gray-700">
            <td className="p-2">{mod.source}</td>
            <td className="p-2">{mod.target}</td>
            <td className="p-2">{Math.round(mod.amount * 100)}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
