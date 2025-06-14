import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input: React.FC<InputProps> = ({ className, ...props }) => {
  const baseClassName = "w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm";
  const finalClassName = className ? `${baseClassName} ${className}` : baseClassName;
  
  return (
    <input
      {...props}
      className={finalClassName}
    />
  );
};