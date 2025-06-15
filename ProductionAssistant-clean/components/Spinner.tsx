
import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string; // Tailwind color class e.g., 'text-purple-500'
  text?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', color = 'text-purple-500', text }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div
        className={`animate-spin rounded-full border-t-2 border-b-2 border-transparent ${sizeClasses[size]} ${color}`}
        style={{ borderTopColor: 'currentColor', borderBottomColor: 'currentColor' }}
      ></div>
      {text && <p className="mt-2 text-sm text-gray-400">{text}</p>}
    </div>
  );
};
