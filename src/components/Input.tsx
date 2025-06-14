import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  wrapperClassName?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, id, wrapperClassName, ...props }, ref) => {
    return (
      <div className={wrapperClassName}>
        {label && <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>}
        <input
          id={id}
          ref={ref}
          {...props}
          className={`w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-100 ${props.className || ''}`}
        />
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
