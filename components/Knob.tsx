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
 * Maps normalized value (0-1) to rotation angle (-150° to +150°)
 */
export const Knob: React.FC<KnobProps> = ({
  value,
  min = 0,
  max = 1,
  size = 80,
  label,
  onChange
}) => {
  // Normalize value to 0-1 range
  const normalizedValue = Math.max(0, Math.min(1, (value - min) / (max - min)));
  
  // Map to rotation angle (-150° to +150°)
  const rotation = -150 + (normalizedValue * 300);
  
  return (
    <div className="flex flex-col items-center">
      <div 
        className="relative cursor-pointer select-none"
        style={{ width: size, height: size }}
      >
        {/* Knob body */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-gray-700 to-gray-900 border-2 border-gray-600 shadow-lg">
          {/* Tick marks */}
          {[...Array(11)].map((_, i) => {
            const angle = -150 + (i * 30);
            const isHighlighted = i / 10 <= normalizedValue;
            const tickLength = i % 5 === 0 ? size * 0.1 : size * 0.05;
            const innerRadius = size / 2 - tickLength;
            const outerRadius = size / 2 - 2;
            
            const x1 = size / 2 + innerRadius * Math.cos((angle * Math.PI) / 180);
            const y1 = size / 2 + innerRadius * Math.sin((angle * Math.PI) / 180);
            const x2 = size / 2 + outerRadius * Math.cos((angle * Math.PI) / 180);
            const y2 = size / 2 + outerRadius * Math.sin((angle * Math.PI) / 180);
            
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isHighlighted ? '#f97316' : '#6b7280'}
                strokeWidth={i % 5 === 0 ? 2 : 1}
              />
            );
          })}
        </div>
        
        {/* Knob indicator */}
        <motion.div
          className="absolute bg-orange-500 rounded-full shadow-md"
          style={{
            width: size * 0.05,
            height: size * 0.3,
            left: '50%',
            top: size * 0.1,
            marginLeft: size * -0.025,
            transformOrigin: `50% ${size * 0.4}px`,
          }}
          animate={{ rotate: rotation }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
        
        {/* Value display */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-mono text-white bg-gray-800/70 px-2 py-1 rounded-full">
            {Math.round(normalizedValue * 100)}
          </span>
        </div>
      </div>
      
      {label && (
        <span className="text-xs text-gray-300 mt-2 text-center max-w-[80px] truncate">
          {label}
        </span>
      )}
    </div>
  );
};