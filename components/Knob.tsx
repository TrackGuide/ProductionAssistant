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
  size = 60,
  label,
  onChange
}) => {
  // Normalize value to 0-1 range
  const normalizedValue = Math.max(0, Math.min(1, (value - min) / (max - min)));
  
  // Map to rotation angle (-140° to +140°)
  const rotation = -140 + (normalizedValue * 280);
  
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!onChange) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = centerY - moveEvent.clientY;
      const deltaX = moveEvent.clientX - centerX;
      const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
      
      // Convert angle to 0-1 value
      let normalizedAngle = (angle + 140) / 280;
      normalizedAngle = Math.max(0, Math.min(1, normalizedAngle));
      
      const newValue = min + (normalizedAngle * (max - min));
      onChange(newValue);
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  return (
    <div className="flex flex-col items-center space-y-2">
      <div
        className="relative cursor-pointer select-none"
        style={{ width: size, height: size }}
        onMouseDown={handleMouseDown}
      >
        {/* Knob body */}
        <div
          className="absolute inset-0 rounded-full bg-gradient-to-b from-gray-300 to-gray-600 shadow-lg border-2 border-gray-400"
          style={{ width: size, height: size }}
        >
          {/* Knob indicator */}
          <motion.div
            className="absolute w-1 bg-orange-500 rounded-full"
            style={{
              height: size * 0.3,
              left: '50%',
              top: size * 0.1,
              transformOrigin: `50% ${size * 0.4}px`,
              marginLeft: '-2px'
            }}
            animate={{ rotate: rotation }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
          
          {/* Center dot */}
          <div
            className="absolute bg-gray-800 rounded-full"
            style={{
              width: size * 0.15,
              height: size * 0.15,
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          />
        </div>
        
        {/* Value display */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-mono text-gray-800">
            {Math.round(value * 100)}
          </span>
        </div>
      </div>
      
      {label && (
        <span className="text-xs text-gray-400 text-center">{label}</span>
      )}
    </div>
  );
};