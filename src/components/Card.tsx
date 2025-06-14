
import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  title?: string;
  titleClassName?: string;
  contentClassName?: string;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  title, 
  titleClassName = '', 
  contentClassName = '',
  ...rest 
}) => {
  return (
    <div 
      className={`bg-gray-800 shadow-lg rounded-lg overflow-hidden ${className}`}
      {...rest}
    >
      {title && (
        <div className={`px-4 py-3 border-b border-gray-700 ${titleClassName}`}>
          <h3 className="text-lg font-semibold text-gray-100">{title}</h3>
        </div>
      )}
      <div className={`p-4 ${contentClassName}`}>
        {children}
      </div>
    </div>
  );
};
