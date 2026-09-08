'use client';

import React, { useState } from 'react';

interface UserAvatarProps {
  src?: string | null;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function UserAvatar({ src, name, size = 'md', className = '' }: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);

  const initials = (name || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  }[size];

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setImgError(true)}
        className={`${sizeClasses} rounded-full object-cover border-2 border-emerald-400/50 shadow-xs shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses} rounded-full bg-gradient-to-tr from-emerald-600 via-emerald-700 to-teal-800 text-white font-black flex items-center justify-center border-2 border-emerald-400/50 uppercase shadow-xs shrink-0 select-none ${className}`}
    >
      {initials}
    </div>
  );
}
