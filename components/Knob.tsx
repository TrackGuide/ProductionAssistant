import React from 'react';
import { motion } from 'framer-motion';

interface KnobProps {
  value: number;
  min?: number;
  max?: number;
  size?: number;
  label?: string;
  onChange?: (value: number) => void;
}

/**
 * Interactive knob component with visual feedback
 * Maps normalized value (0-1) to rotation angle (-140° to +140°)
 */
export const Knob: React.FC<KnobProps> = ({
  value,
  min = 0,
  max = 1,
  size = 70,
  label,
  onChange
}) => {
  // Normalize value to 0-1 range
  const normalizedValue = Math.max(0, Math.min(1, (value - min) / (max - min)));
  
  // Map to rotation angle (-140° to +140°)
  const rotation = -140 + (normalizedValue * 280);
  
  return (
    <div className="flex flex-col items-center" style={{ width: size }}>
      <div 
        className="relative"
        style={{ width: size, height: size }}
      >
        {/* Knob base with gradient */}
        <div 
          className="absolute inset-0 rounded-full bg-gradient-to-b from-gray-700 to-gray-900 shadow-lg border border-gray-600"
        />
        
        {/* Tick marks around the knob */}
        {Array.from({ length: 11 }).map((_, i) => {
          const tickAngle = -140 + (i * 28);
          const tickRadians = (tickAngle * Math.PI) / 180;
          const tickLength = i % 5 === 0 ? 0.15 : 0.1;
          const innerRadius = size / 2 - 3;
          const outerRadius = size / 2 - size * tickLength;
          
          const x1 = size / 2 + innerRadius * Math.cos(tickRadians);
          const y1 = size / 2 + innerRadius * Math.sin(tickRadians);
          const x2 = size / 2 + outerRadius * Math.cos(tickRadians);
          const y2 = size / 2 + outerRadius * Math.sin(tickRadians);
          
          return (
            <div 
              key={i}
              className="absolute bg-gray-400"
              style={{
                width: '1px',
                height: size * tickLength,
                transformOrigin: 'bottom center',
                transform: `translate(${x2}px, ${y2}px) rotate(${tickAngle + 90}deg)`,
                opacity: i % 5 === 0 ? 0.8 : 0.4
              }}
            />
          );
        })}
        
        {/* Indicator line */}
        <motion.div 
          className="absolute bg-orange-500"
          style={{
            width: 2,
            height: size * 0.4,
            left: '50%',
            top: '10%',
            marginLeft: -1,
            transformOrigin: 'bottom center',
            boxShadow: '0 0 5px rgba(249, 115, 22, 0.5)'
          }}
          animate={{ rotate: rotation }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
        
        {/* Center dot */}
        <div 
          className="absolute bg-gray-300"
          style={{
            width: size * 0.15,
            height: size * 0.15,
            borderRadius: '50%',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            boxShadow: 'inset 0 0 5px rgba(0, 0, 0, 0.5)'
          }}
        />
        
        {/* Value display */}
        <div 
          className="absolute inset-0 flex items-center justify-center"
        >
          <span 
            className="text-xs font-mono text-gray-300"
            style={{ marginTop: size * 0.25 }}
          >
            {Math.round(normalizedValue * 100)}
          </span>
        </div>
      </div>
      
      {label && (
        <span className="text-xs text-gray-300 mt-2 text-center">{label}</span>
      )}
    </div>
  );
};