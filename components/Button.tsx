import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  leftIcon,
  rightIcon,
  ...props
}) => {
  // ⚡️ MOBILE-FIRST with full-width on phones, auto-width at md+
  const baseStyles = `
    inline-flex items-center justify-center
    w-full md:w-auto
    font-semibold rounded-md shadow-sm
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900
    transition-colors duration-150
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const variantStyles = {
    primary:   "bg-purple-600 hover:bg-purple-700 text-white focus:ring-purple-500",
    secondary: "bg-gray-700    hover:bg-gray-600 text-gray-100 focus:ring-gray-500",
    outline:   "border border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white focus:ring-purple-500",
    danger:    "bg-red-600     hover:bg-red-700 text-white focus:ring-red-500",
  };

  // Smaller padding/text on mobile, original sizes at md+
  const sizeStyles = {
    sm: "px-2 py-1 text-sm       md:px-3 md:py-1.5 md:text-sm",
    md: "px-2 py-1 text-sm       md:px-4 md:py-2   md:text-base",
    lg: "px-3 py-1.5 text-base   md:px-6 md:py-3   md:text-lg",
  };

  return (
    <button
      {...props}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {leftIcon  && <span className="mr-2">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
};
