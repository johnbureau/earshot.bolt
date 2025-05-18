import React from 'react';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  fallback?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'User avatar',
  size = 'md',
  fallback,
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg',
  };

  const getFallbackInitials = () => {
    if (!fallback) return '?';
    
    // Split by spaces and get first letter of each word
    const words = fallback.trim().split(/\s+/);
    if (words.length === 1) {
      // If single word, use first two letters
      return fallback.substring(0, 2).toUpperCase();
    }
    // Otherwise use first letter of first two words
    return words.slice(0, 2).map(word => word[0]).join('').toUpperCase();
  };

  return (
    <div
      className={`
        relative rounded-full overflow-hidden bg-gray-200
        flex items-center justify-center font-medium text-gray-600
        ${sizeClasses[size]}
      `}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
        />
      ) : (
        <span>{getFallbackInitials()}</span>
      )}
      <div className="absolute inset-0 ring-2 ring-white rounded-full" />
    </div>
  );
};

export default Avatar;