
import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  wrapperClassName?: string;
}

export const Textarea: React.FC<TextareaProps> = ({ label, id, wrapperClassName, ...props }) => {
  return (
    <div className={wrapperClassName}>
      {label && <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>}
      <textarea
        id={id}
        {...props}
        className={`w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-100 ${props.className || ''}`}
        rows={3}
      />
    </div>
  );
};
