import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error' | 'default';
  size?: 'sm' | 'md';
  rounded?: boolean;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  rounded = false,
}) => {
  const variantClasses = {
    primary: 'bg-primary-100 text-primary-800',
    secondary: 'bg-secondary-100 text-secondary-800',
    accent: 'bg-accent-100 text-accent-800',
    success: 'bg-success-50 text-success-700',
    warning: 'bg-warning-50 text-warning-700',
    error: 'bg-error-50 text-error-700',
    default: 'bg-gray-100 text-gray-800',
  };
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
  };
  
  const roundedClass = rounded ? 'rounded-full' : 'rounded';
  
  return (
    <span
      className={`
        inline-flex items-center font-medium
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${roundedClass}
      `}
    >
      {children}
    </span>
  );
};

export default Badge;